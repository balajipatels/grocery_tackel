import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const investor = await prisma.investor.findUnique({
      where: { id },
      include: {
        user: { select: { name: true, email: true, image: true } },
        billShares: {
          include: { bill: true },
          orderBy: { createdAt: "desc" },
          take: 50,
        },
      },
    })
    if (!investor) return NextResponse.json({ error: "Not found" }, { status: 404 })
    return NextResponse.json(investor)
  } catch {
    return NextResponse.json({ error: "Failed to fetch investor" }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session?.user || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const { id } = await params
    const body = await req.json()
    const { displayName, investedAmount, colorTag, isActive, notes } = body

    const investor = await prisma.investor.update({
      where: { id },
      data: {
        displayName,
        investedAmount: investedAmount !== undefined ? parseFloat(investedAmount) : undefined,
        colorTag,
        isActive,
        notes,
      },
    })
    return NextResponse.json(investor)
  } catch {
    return NextResponse.json({ error: "Failed to update investor" }, { status: 500 })
  }
}
