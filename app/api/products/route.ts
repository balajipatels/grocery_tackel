import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const search = searchParams.get("search") || ""
    const categoryId = searchParams.get("categoryId") || ""
    const status = searchParams.get("status") || ""
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "25")
    const skip = (page - 1) * limit

    const where: any = { isActive: true }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { sku: { contains: search, mode: "insensitive" } },
        { barcode: { contains: search, mode: "insensitive" } },
      ]
    }
    if (categoryId) where.categoryId = categoryId
    if (status === "OUT") where.stockQty = { lte: 0 }
    if (status === "IN") where.stockQty = { gt: 0 }

    // LOW stock requires comparing two columns — resolve via raw SQL
    if (status === "LOW") {
      const lowIds = await prisma.$queryRaw<{ id: string }[]>`
        SELECT id FROM "Product" WHERE "isActive" = true AND "stockQty" > 0 AND "stockQty" <= "reorderLevel"
      `
      where.id = { in: lowIds.map((r) => r.id) }
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: { category: true },
        orderBy: { name: "asc" },
        skip,
        take: limit,
      }),
      prisma.product.count({ where }),
    ])

    return NextResponse.json({
      products,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    })
  } catch {
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await req.json()
    const {
      name, categoryId, buyingPrice, sellingPrice, mrp, stockQty = 0,
      reorderLevel = 10, unit = "pcs", sku, barcode, imageUrl, expiryDate,
    } = body

    if (!name || !categoryId || !buyingPrice || !sellingPrice || !mrp) {
      return NextResponse.json({ error: "Required fields missing" }, { status: 400 })
    }

    const product = await prisma.product.create({
      data: {
        name, categoryId,
        buyingPrice: parseFloat(buyingPrice),
        sellingPrice: parseFloat(sellingPrice),
        mrp: parseFloat(mrp),
        stockQty: parseInt(stockQty),
        reorderLevel: parseInt(reorderLevel),
        unit, sku: sku || null, barcode: barcode || null,
        imageUrl: imageUrl || null,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
      },
      include: { category: true },
    })

    if (stockQty > 0) {
      await prisma.stockTransaction.create({
        data: {
          productId: product.id,
          type: "STOCK_IN",
          quantity: parseInt(stockQty),
          previousQty: 0,
          newQty: parseInt(stockQty),
          notes: "Initial stock",
          createdById: (session.user as any).id,
        },
      })
    }

    return NextResponse.json(product, { status: 201 })
  } catch (error: any) {
    if (error.code === "P2002") {
      return NextResponse.json({ error: "SKU or barcode already exists" }, { status: 409 })
    }
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 })
  }
}
