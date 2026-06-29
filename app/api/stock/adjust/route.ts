import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { productId, type, quantity, notes } = await req.json()
    if (!productId || !type || quantity === undefined) {
      return NextResponse.json({ error: "productId, type, and quantity required" }, { status: 400 })
    }

    const product = await prisma.product.findUnique({ where: { id: productId } })
    if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 })

    const previousQty = product.stockQty
    let newQty: number
    if (type === "STOCK_IN" || type === "RETURN") {
      newQty = previousQty + Math.abs(quantity)
    } else {
      newQty = Math.max(0, previousQty - Math.abs(quantity))
    }

    await prisma.$transaction([
      prisma.product.update({ where: { id: productId }, data: { stockQty: newQty } }),
      prisma.stockTransaction.create({
        data: {
          productId,
          type,
          quantity: Math.abs(quantity),
          previousQty,
          newQty,
          notes,
          createdById: (session.user as any).id,
        },
      }),
      prisma.auditLog.create({
        data: {
          userId: (session.user as any).id,
          action: "STOCK_ADJUSTMENT",
          entity: "Product",
          entityId: productId,
          oldValue: { stockQty: previousQty },
          newValue: { stockQty: newQty, type, quantity },
        },
      }),
    ])

    const updated = await prisma.product.findUnique({ where: { id: productId } })
    return NextResponse.json(updated)
  } catch {
    return NextResponse.json({ error: "Failed to adjust stock" }, { status: 500 })
  }
}
