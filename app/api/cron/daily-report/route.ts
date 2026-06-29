import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  try {
    const auth = req.headers.get("authorization")
    if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const bills = await prisma.bill.count({
      where: { createdAt: { gte: today, lt: tomorrow }, status: "PAID" }
    })

    return NextResponse.json({ 
      success: true, 
      message: "Report generated",
      billsToday: bills 
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Failed" }, { status: 500 })
  }
}
