import { prisma } from "@/lib/prisma"

export async function calculateAndSaveInvestorShares(billId: string) {
  const bill = await prisma.bill.findUnique({
    where: { id: billId },
    include: { items: true },
  })
  if (!bill) throw new Error("Bill not found")

  const investors = await prisma.investor.findMany({
    where: { isActive: true },
  })
  if (investors.length === 0) return

  const totalInvestment = investors.reduce((sum, inv) => sum + inv.investedAmount, 0)

  const shares = investors.map((investor) => {
    const sharePercent = (investor.investedAmount / totalInvestment) * 100
    const revenueShare = (bill.grandTotal * sharePercent) / 100
    const cogShare = (bill.totalCogs * sharePercent) / 100
    const profitShare = revenueShare - cogShare
    return {
      billId: bill.id,
      investorId: investor.id,
      sharePercent,
      revenueShare,
      cogShare,
      profitShare,
    }
  })

  await prisma.investorBillShare.createMany({ data: shares })
}
