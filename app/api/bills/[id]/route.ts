import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const bill = await prisma.bill.findUnique({
      where: { id },
      include: {
        items: { include: { product: { include: { category: true } } } },
        createdBy: { select: { name: true, email: true } },
        investorShares: { include: { investor: true } },
      },
    })
    if (!bill) return NextResponse.json({ error: "Not found" }, { status: 404 })
    return NextResponse.json(bill)
  } catch {
    return NextResponse.json({ error: "Failed to fetch bill" }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const { id } = await params
    const { status } = await req.json()

    const bill = await prisma.bill.update({
      where: { id },
      data: { status },
    })

    if (status === "CANCELLED") {
      await prisma.auditLog.create({
        data: {
          userId: (session.user as any).id,
          action: "BILL_CANCELLED",
          entity: "Bill",
          entityId: id,
          newValue: { status: "CANCELLED" },
        },
      })
    }

    return NextResponse.json(bill)
  } catch {
    return NextResponse.json({ error: "Failed to update bill" }, { status: 500 })
  }
}
