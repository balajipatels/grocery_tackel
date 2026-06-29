import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const from = searchParams.get("from") || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const to = searchParams.get("to") || new Date().toISOString()
    const dateFilter = { gte: new Date(from), lte: new Date(to) }

    const investors = await prisma.investor.findMany({
      where: { isActive: true },
      include: {
        user: { select: { name: true, email: true, image: true } },
        billShares: {
          where: { bill: { createdAt: dateFilter, status: "PAID" } },
          include: { bill: { select: { grandTotal: true, totalCogs: true, createdAt: true } } },
        },
      },
    })

    const totalInvestment = investors.reduce((s, i) => s + i.investedAmount, 0)
    const expenses = await prisma.expense.aggregate({
      where: { date: dateFilter },
      _sum: { amount: true },
    })
    const totalExpenses = expenses._sum.amount || 0

    const result = investors.map((inv) => {
      const sharePercent = totalInvestment > 0 ? (inv.investedAmount / totalInvestment) * 100 : 0
      const revenueShare = inv.billShares.reduce((s, b) => s + b.revenueShare, 0)
      const cogShare = inv.billShares.reduce((s, b) => s + b.cogShare, 0)
      const grossProfitShare = inv.billShares.reduce((s, b) => s + b.profitShare, 0)
      const expenseShare = (totalExpenses * sharePercent) / 100
      const netProfit = grossProfitShare - expenseShare
      const roi = inv.investedAmount > 0 ? (netProfit / inv.investedAmount) * 100 : 0
      return {
        investor: inv,
        sharePercent,
        revenueShare,
        cogShare,
        grossProfitShare,
        expenseShare,
        netProfit,
        roi,
        billCount: inv.billShares.length,
      }
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Failed to fetch investor returns" }, { status: 500 })
  }
}
