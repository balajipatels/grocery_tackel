"use client"

import { useQuery } from "@tanstack/react-query"
import { useParams } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { formatINR, formatPercent, formatDate, formatDateTime } from "@/lib/format"

export default function InvestorDetailPage() {
  const { id } = useParams<{ id: string }>()

  const { data: investor, isLoading } = useQuery({
    queryKey: ["investor", id],
    queryFn: () => fetch(`/api/investors/${id}`).then((r) => r.json()),
  })

  const { data: returns } = useQuery({
    queryKey: ["investor-returns-all"],
    queryFn: () => fetch("/api/finance/investor-returns").then((r) => r.json()),
  })

  const myReturn = returns?.find((r: any) => r.investor?.id === id)

  if (isLoading) return (
    <div className="max-w-4xl mx-auto space-y-5">
      <Skeleton className="h-9 w-48" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1,2,3,4].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
      </div>
    </div>
  )

  if (investor?.error) return (
    <div className="flex flex-col items-center justify-center py-20">
      <p className="text-gray-500">Investor not found</p>
      <Link href="/finance/investors" className="mt-3 text-[#1B4332] underline text-sm">Back</Link>
    </div>
  )

  const billShares = investor?.billShares || []

  // Month-by-month profit data
  const monthlyData: Record<string, number> = {}
  billShares.forEach((share: any) => {
    const month = new Date(share.createdAt).toLocaleDateString("en-IN", { month: "short", year: "2-digit" })
    monthlyData[month] = (monthlyData[month] || 0) + share.profitShare
  })
  const chartData = Object.entries(monthlyData).map(([month, profit]) => ({ month, profit }))

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/finance/investors">
          <Button variant="ghost" size="icon" className="w-8 h-8"><ArrowLeft className="w-4 h-4" /></Button>
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full" style={{ backgroundColor: investor?.colorTag || "#1B4332" }} />
          <div>
            <h2 className="text-xl font-bold text-[#1A1A2E]">{investor?.displayName}</h2>
            <p className="text-sm text-gray-500">{investor?.user?.email} · Since {formatDate(investor?.investmentDate)}</p>
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Invested", value: formatINR(investor?.investedAmount || 0), color: "#1B4332" },
          { label: "Share %", value: formatPercent(myReturn?.sharePercent || 0), color: "#378ADD" },
          { label: "Net Profit (30d)", value: formatINR(myReturn?.netProfit || 0), color: "#16A34A" },
          { label: "ROI (30d)", value: `${(myReturn?.roi || 0).toFixed(2)}%`, color: "#D97706" },
        ].map(({ label, value, color }) => (
          <Card key={label} className="rounded-xl border border-gray-100 shadow-sm">
            <CardContent className="p-4">
              <p className="text-xs text-gray-500 font-medium mb-1.5">{label}</p>
              <p className="text-xl font-bold" style={{ color }}>{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Monthly Profit Chart */}
      {chartData.length > 0 && (
        <Card className="rounded-xl border border-gray-100 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Monthly Profit Share</CardTitle>
          </CardHeader>
          <CardContent className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: any) => formatINR(Number(v))} />
                <Bar dataKey="profit" fill={investor?.colorTag || "#1B4332"} radius={[4, 4, 0, 0]} name="Profit" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Bill Shares Table */}
      <Card className="rounded-xl border border-gray-100 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Bill-wise Profit Share</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {billShares.length === 0 ? (
            <div className="py-12 text-center text-gray-400 text-sm">No bill shares recorded yet</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/80">
                  <TableHead className="text-xs font-semibold text-gray-600">Bill No.</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-600">Date</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-600 text-right">Revenue Share</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-600 text-right">COGS Share</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-600 text-right">Profit Share</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {billShares.slice(0, 50).map((share: any) => (
                  <TableRow key={share.id} className="hover:bg-gray-50/50 transition-colors">
                    <TableCell>
                      <Link href={`/bills/${share.billId}`} className="text-xs font-mono text-[#1B4332] hover:underline">
                        {share.bill?.billNumber}
                      </Link>
                    </TableCell>
                    <TableCell className="text-xs text-gray-500">{formatDateTime(share.createdAt)}</TableCell>
                    <TableCell className="text-sm text-right">{formatINR(share.revenueShare)}</TableCell>
                    <TableCell className="text-sm text-right text-red-500">{formatINR(share.cogShare)}</TableCell>
                    <TableCell className="text-sm font-semibold text-right text-green-600">{formatINR(share.profitShare)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
