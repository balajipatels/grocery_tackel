import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { calculateAndSaveInvestorShares } from "@/lib/bill-splitting"
import { generateBillNumber } from "@/lib/format"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const search = searchParams.get("search") || ""
    const status = searchParams.get("status") || ""
    const paymentMethod = searchParams.get("paymentMethod") || ""
    const from = searchParams.get("from")
    const to = searchParams.get("to")
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "25")
    const skip = (page - 1) * limit

    const where: any = {}
    if (search) {
      where.OR = [
        { billNumber: { contains: search, mode: "insensitive" } },
        { customerName: { contains: search, mode: "insensitive" } },
        { customerPhone: { contains: search, mode: "insensitive" } },
      ]
    }
    if (status) where.status = status
    if (paymentMethod) where.paymentMethod = paymentMethod
    if (from || to) {
      where.createdAt = {}
      if (from) where.createdAt.gte = new Date(from)
      if (to) where.createdAt.lte = new Date(to)
    }

    const [bills, total] = await Promise.all([
      prisma.bill.findMany({
        where,
        include: { createdBy: { select: { name: true, email: true } }, items: true },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.bill.count({ where }),
    ])

    return NextResponse.json({ bills, total, page, totalPages: Math.ceil(total / limit) })
  } catch {
    return NextResponse.json({ error: "Failed to fetch bills" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await req.json()
    const { items, customerName, customerPhone, paymentMethod = "CASH", discountAmount = 0 } = body

    if (!items || items.length === 0) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 })
    }

    const productIds = items.map((i: any) => i.productId)
    const products = await prisma.product.findMany({
      where: { id: { in: productIds }, isActive: true },
      include: { category: true },
    })

    type ProductWithCategory = typeof products[number]
    const productMap = new Map<string, ProductWithCategory>(products.map((p) => [p.id, p]))

    let subtotal = 0
    let totalCgst = 0
    let totalSgst = 0
    let totalCogs = 0

    const billItems = items.map((item: any) => {
      const product = productMap.get(item.productId)
      if (!product) throw new Error(`Product ${item.productId} not found`)
      if (product.stockQty < item.quantity) {
        throw new Error(`Insufficient stock for ${product.name}`)
      }

      const lineSubtotal = product.sellingPrice * item.quantity
      const cgstAmount = (lineSubtotal * product.category.cgstPercent) / 100
      const sgstAmount = (lineSubtotal * product.category.sgstPercent) / 100
      const lineTotal = lineSubtotal + cgstAmount + sgstAmount

      subtotal += lineSubtotal
      totalCgst += cgstAmount
      totalSgst += sgstAmount
      totalCogs += product.buyingPrice * item.quantity

      return {
        productId: product.id,
        productName: product.name,
        quantity: item.quantity,
        buyingPrice: product.buyingPrice,
        sellingPrice: product.sellingPrice,
        cgstPercent: product.category.cgstPercent,
        sgstPercent: product.category.sgstPercent,
        cgstAmount,
        sgstAmount,
        lineTotal,
      }
    })

    const grandTotal = subtotal + totalCgst + totalSgst - discountAmount

    const today = new Date()
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const todayCount = await prisma.bill.count({
      where: { createdAt: { gte: startOfDay } },
    })
    const billNumber = generateBillNumber(today, todayCount + 1)

    const bill = await prisma.$transaction(async (tx) => {
      const newBill = await tx.bill.create({
        data: {
          billNumber,
          customerName: customerName || null,
          customerPhone: customerPhone || null,
          subtotal,
          totalCgst,
          totalSgst,
          totalCogs,
          discountAmount,
          grandTotal,
          paymentMethod,
          createdById: (session.user as any).id,
          items: { create: billItems },
        },
        include: { items: { include: { product: { include: { category: true } } } }, createdBy: true },
      })

      for (const item of items) {
        const product = productMap.get(item.productId)!
        const newQty = product.stockQty - item.quantity
        await tx.product.update({ where: { id: product.id }, data: { stockQty: newQty } })
        await tx.stockTransaction.create({
          data: {
            productId: product.id,
            type: "SALE",
            quantity: item.quantity,
            previousQty: product.stockQty,
            newQty,
            notes: `Bill: ${billNumber}`,
            createdById: (session.user as any).id,
          },
        })

        if (newQty <= product.reorderLevel) {
          await tx.notification.create({
            data: {
              type: "LOW_STOCK",
              title: "Low Stock Alert",
              message: `${product.name} — only ${newQty} ${product.unit} left`,
              productId: product.id,
            },
          })
        }
      }

      await tx.auditLog.create({
        data: {
          userId: (session.user as any).id,
          action: "BILL_CREATED",
          entity: "Bill",
          entityId: newBill.id,
          newValue: { billNumber, grandTotal },
        },
      })

      return newBill
    })

    await calculateAndSaveInvestorShares(bill.id)

    return NextResponse.json(bill, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to create bill" }, { status: 500 })
  }
}
