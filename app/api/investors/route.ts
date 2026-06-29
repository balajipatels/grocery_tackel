import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

export async function GET() {
  try {
    const investors = await prisma.investor.findMany({
      include: { user: { select: { name: true, email: true, image: true } } },
      orderBy: { investedAmount: "desc" },
    })
    return NextResponse.json(investors)
  } catch {
    return NextResponse.json({ error: "Failed to fetch investors" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { userId, displayName, investedAmount, investmentDate, colorTag, notes } = body

    if (!userId || !displayName || !investedAmount || !investmentDate) {
      return NextResponse.json({ error: "Required fields missing" }, { status: 400 })
    }

    const investor = await prisma.investor.create({
      data: {
        userId,
        displayName,
        investedAmount: parseFloat(investedAmount),
        investmentDate: new Date(investmentDate),
        colorTag: colorTag || "#1D9E75",
        notes,
      },
      include: { user: true },
    })

    await prisma.user.update({
      where: { id: userId },
      data: { role: "INVESTOR" },
    })

    return NextResponse.json(investor, { status: 201 })
  } catch (error: any) {
    if (error.code === "P2002") {
      return NextResponse.json({ error: "User is already an investor" }, { status: 409 })
    }
    return NextResponse.json({ error: "Failed to create investor" }, { status: 500 })
  }
}
