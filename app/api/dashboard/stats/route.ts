import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const now = new Date()
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const startOfYesterday = new Date(startOfToday.getTime() - 24 * 60 * 60 * 1000)

    const [todayBills, yesterdayBills, itemsSold, lowStockCount, recentBills, topProducts] =
      await Promise.all([
        prisma.bill.aggregate({
          where: { createdAt: { gte: startOfToday }, status: "PAID" },
          _sum: { grandTotal: true },
          _count: true,
        }),
        prisma.bill.aggregate({
          where: { createdAt: { gte: startOfYesterday, lt: startOfToday }, status: "PAID" },
          _sum: { grandTotal: true },
          _count: true,
        }),
        prisma.billItem.aggregate({
          where: { bill: { createdAt: { gte: startOfToday }, status: "PAID" } },
          _sum: { quantity: true },
        }),
        prisma.$queryRaw`SELECT COUNT(*)::int as count FROM "Product" WHERE "isActive" = true AND "stockQty" <= "reorderLevel"`.then((r: any) => r[0]?.count || 0),
        prisma.bill.findMany({
          where: { status: { not: "CANCELLED" } },
          include: { items: true, createdBy: { select: { name: true } } },
          orderBy: { createdAt: "desc" },
          take: 5,
        }),
        prisma.billItem.groupBy({
          by: ["productName"],
          where: { bill: { createdAt: { gte: startOfToday } } },
          _sum: { quantity: true, lineTotal: true },
          orderBy: { _sum: { lineTotal: "desc" } },
          take: 5,
        }),
      ])

    const todayRevenue = todayBills._sum.grandTotal || 0
    const yesterdayRevenue = yesterdayBills._sum.grandTotal || 0
    const revenueChange =
      yesterdayRevenue > 0 ? ((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100 : 0

    return NextResponse.json({
      todayRevenue,
      yesterdayRevenue,
      revenueChange,
      billCount: todayBills._count,
      itemsSold: itemsSold._sum.quantity || 0,
      lowStockCount,
      recentBills,
      topProducts,
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 })
  }
}
