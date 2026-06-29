import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const product = await prisma.product.findUnique({
      where: { id },
      include: { category: true },
    })
    if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 })
    return NextResponse.json(product)
  } catch {
    return NextResponse.json({ error: "Failed to fetch product" }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const { id } = await params
    const body = await req.json()

    const existing = await prisma.product.findUnique({ where: { id } })
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })

    const {
      name, categoryId, buyingPrice, sellingPrice, mrp, stockQty,
      reorderLevel, unit, sku, barcode, imageUrl, expiryDate, isActive,
    } = body

    const product = await prisma.product.update({
      where: { id },
      data: {
        name, categoryId,
        buyingPrice: buyingPrice !== undefined ? parseFloat(buyingPrice) : undefined,
        sellingPrice: sellingPrice !== undefined ? parseFloat(sellingPrice) : undefined,
        mrp: mrp !== undefined ? parseFloat(mrp) : undefined,
        stockQty: stockQty !== undefined ? parseInt(stockQty) : undefined,
        reorderLevel: reorderLevel !== undefined ? parseInt(reorderLevel) : undefined,
        unit, sku: sku || null, barcode: barcode || null,
        imageUrl: imageUrl || null,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        isActive,
      },
      include: { category: true },
    })

    if (buyingPrice !== undefined && parseFloat(buyingPrice) !== existing.buyingPrice) {
      await prisma.auditLog.create({
        data: {
          userId: (session.user as any).id,
          action: "PRICE_CHANGE",
          entity: "Product",
          entityId: id,
          oldValue: { buyingPrice: existing.buyingPrice, sellingPrice: existing.sellingPrice },
          newValue: { buyingPrice: parseFloat(buyingPrice), sellingPrice: parseFloat(sellingPrice) },
        },
      })
    }

    return NextResponse.json(product)
  } catch (error: any) {
    if (error.code === "P2025") return NextResponse.json({ error: "Not found" }, { status: 404 })
    return NextResponse.json({ error: "Failed to update product" }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const { id } = await params
    await prisma.product.update({ where: { id }, data: { isActive: false } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Failed to archive product" }, { status: 500 })
  }
}
