import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const from = searchParams.get("from") || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const to = searchParams.get("to") || new Date().toISOString()

    const dateFilter = { gte: new Date(from), lte: new Date(to) }

    const [bills, expenses, billsByDay] = await Promise.all([
      prisma.bill.aggregate({
        where: { createdAt: dateFilter, status: "PAID" },
        _sum: { grandTotal: true, totalCogs: true, totalCgst: true, totalSgst: true },
        _count: true,
      }),
      prisma.expense.aggregate({
        where: { date: dateFilter },
        _sum: { amount: true },
      }),
      prisma.bill.groupBy({
        by: ["createdAt"],
        where: { createdAt: dateFilter, status: "PAID" },
        _sum: { grandTotal: true, totalCogs: true },
        orderBy: { createdAt: "asc" },
      }),
    ])

    const grossRevenue = bills._sum.grandTotal || 0
    const totalCogs = bills._sum.totalCogs || 0
    const grossProfit = grossRevenue - totalCogs
    const totalExpenses = expenses._sum.amount || 0
    const netProfit = grossProfit - totalExpenses

    const quickServiceRevenue = await prisma.billItem.aggregate({
      where: {
        bill: { createdAt: dateFilter, status: "PAID" },
        product: { category: { isQuickService: true } },
      },
      _sum: { lineTotal: true },
    })

    const groceryRevenue = grossRevenue - (quickServiceRevenue._sum.lineTotal || 0)

    return NextResponse.json({
      grossRevenue,
      totalCogs,
      grossProfit,
      totalExpenses,
      netProfit,
      billCount: bills._count,
      totalCgst: bills._sum.totalCgst || 0,
      totalSgst: bills._sum.totalSgst || 0,
      quickServiceRevenue: quickServiceRevenue._sum.lineTotal || 0,
      groceryRevenue,
      dailyData: billsByDay,
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Failed to fetch P&L data" }, { status: 500 })
  }
}
