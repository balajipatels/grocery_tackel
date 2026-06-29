import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const from = searchParams.get("from")
    const to = searchParams.get("to")

    const where: any = {}
    if (from || to) {
      where.date = {}
      if (from) where.date.gte = new Date(from)
      if (to) where.date.lte = new Date(to)
    }

    const expenses = await prisma.expense.findMany({
      where,
      orderBy: { date: "desc" },
    })
    return NextResponse.json(expenses)
  } catch {
    return NextResponse.json({ error: "Failed to fetch expenses" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await req.json()
    const { category, amount, description, date } = body
    if (!category || !amount || !description || !date) {
      return NextResponse.json({ error: "All fields required" }, { status: 400 })
    }

    const expense = await prisma.expense.create({
      data: { category, amount: parseFloat(amount), description, date: new Date(date) },
    })
    return NextResponse.json(expense, { status: 201 })
  } catch {
    return NextResponse.json({ error: "Failed to create expense" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 })
    await prisma.expense.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Failed to delete expense" }, { status: 500 })
  }
}
