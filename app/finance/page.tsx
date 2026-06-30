"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import Link from "next/link"
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, Legend,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { formatINR, formatPercent } from "@/lib/format"
import { Download, TrendingUp } from "lucide-react"

const PERIOD_OPTIONS = [
  { label: "Today", days: 1 },
  { label: "This Week", days: 7 },
  { label: "This Month", days: 30 },
  { label: "This Quarter", days: 90 },
]

const INVESTOR_COLORS = ["#1D9E75", "#378ADD", "#BA7517", "#993556", "#534AB7", "#D85A30", "#0F6E56", "#185FA5"]

export default function FinancePage() {
  const [period, setPeriod] = useState(30)

  const getDateRange = (days: number) => {
    const to = new Date()
    const from = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    return { from: from.toISOString(), to: to.toISOString() }
  }

  const { from, to } = getDateRange(period)

  const { data: pl, isLoading: plLoading } = useQuery({
    queryKey: ["pl", period],
    queryFn: () => fetch(`/api/finance/pl?from=${from}&to=${to}`).then((r) => r.json()),
  })

  const { data: investorData, isLoading: invLoading } = useQuery({
    queryKey: ["investor-returns", period],
    queryFn: () => fetch(`/api/finance/investor-returns?from=${from}&to=${to}`).then((r) => r.json()),
  })

  const expenseBreakdown = [
    { name: "Other", value: pl?.totalExpenses || 0 },
  ]

  const revenueSplit = [
    { name: "Grocery", value: pl?.groceryRevenue || 0 },
    { name: "Quick Service", value: pl?.quickServiceRevenue || 0 },
  ].filter((d) => d.value > 0)

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-xl font-bold text-[#1A1A2E]">Profit & Loss</h2>
        <div className="flex gap-2 bg-white rounded-lg border border-gray-200 p-1">
          {PERIOD_OPTIONS.map((opt) => (
            <button
              key={opt.days}
              onClick={() => setPeriod(opt.days)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 ${
                period === opt.days
                  ? "bg-[#1B4332] text-white"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: "Gross Revenue", value: pl?.grossRevenue, color: "#1D9E75" },
          { label: "Total COGS", value: pl?.totalCogs, color: "#DC2626" },
          { label: "Gross Profit", value: pl?.grossProfit, color: "#2563EB" },
          { label: "Expenses", value: pl?.totalExpenses, color: "#D97706" },
          { label: "Net Profit", value: pl?.netProfit, color: "#1B4332" },
        ].map(({ label, value, color }) => (
          plLoading ? (
            <Skeleton key={label} className="h-24 rounded-xl" />
          ) : (
            <Card key={label} className="rounded-xl border border-gray-100 shadow-sm">
              <CardContent className="p-4">
                <p className="text-xs text-gray-500 font-medium mb-1.5">{label}</p>
                <p className="text-xl font-bold" style={{ color }}>{formatINR(value || 0)}</p>
              </CardContent>
            </Card>
          )
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 rounded-xl border border-gray-100 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Revenue vs Profit Trend</CardTitle>
          </CardHeader>
          <CardContent className="h-52">
            {pl?.dailyData?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={pl.dailyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="createdAt" tickFormatter={(v) => new Date(v).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })} tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v) => formatINR(Number(v))} />
                  <Legend />
                  <Line type="monotone" dataKey="_sum.grandTotal" name="Revenue" stroke="#1B4332" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="_sum.totalCogs" name="COGS" stroke="#DC2626" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400 text-sm">No data for selected period</div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="rounded-xl border border-gray-100 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Revenue Split</CardTitle>
            </CardHeader>
            <CardContent className="h-36 flex items-center justify-center">
              {revenueSplit.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={revenueSplit} cx="50%" cy="50%" outerRadius={55} dataKey="value" label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`} labelLine={false}>
                      {revenueSplit.map((_, i) => <Cell key={i} fill={INVESTOR_COLORS[i]} />)}
                    </Pie>
                    <Tooltip formatter={(v) => formatINR(Number(v))} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-gray-400 text-sm">No data</p>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-xl border border-gray-100 shadow-sm">
            <CardContent className="p-4 space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Total Bills</span>
                <span className="font-medium">{pl?.billCount || 0}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Total CGST</span>
                <span className="font-medium">{formatINR(pl?.totalCgst || 0)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Total SGST</span>
                <span className="font-medium">{formatINR(pl?.totalSgst || 0)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Investor Profit Split Table */}
      <Card className="rounded-xl border border-gray-100 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-sm font-semibold text-[#1A1A2E]">Profit Distribution Among Investors</CardTitle>
          <div className="flex gap-2">
            <Link href="/finance/investors">
              <Button variant="outline" size="sm" className="text-xs h-8">Manage Investors</Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {invLoading ? (
            <div className="p-5 space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-10" />)}</div>
          ) : !investorData?.length ? (
            <div className="py-12 text-center text-gray-400 text-sm">
              No investors added yet. <Link href="/finance/investors" className="text-[#1B4332] underline">Add investors</Link>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/80">
                  <TableHead className="text-xs font-semibold text-gray-600">Investor</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-600 text-right">Invested</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-600 text-right">Share %</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-600 text-right">Revenue</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-600 text-right">COGS</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-600 text-right">Gross Profit</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-600 text-right">Exp. Share</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-600 text-right">Net Profit</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-600 text-right"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(investorData as any[]).map((item: any, i: number) => (
                  <TableRow key={item.investor?.id} className="hover:bg-gray-50/50 transition-colors">
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: item.investor?.colorTag || INVESTOR_COLORS[i] }} />
                        <div>
                          <p className="text-sm font-medium text-[#1A1A2E]">{item.investor?.displayName}</p>
                          <p className="text-xs text-gray-400">{item.investor?.user?.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-right">{formatINR(item.investor?.investedAmount || 0)}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant="outline" className="text-xs">{formatPercent(item.sharePercent)}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-right">{formatINR(item.revenueShare)}</TableCell>
                    <TableCell className="text-sm text-right text-red-600">{formatINR(item.cogShare)}</TableCell>
                    <TableCell className="text-sm text-right text-blue-600">{formatINR(item.grossProfitShare)}</TableCell>
                    <TableCell className="text-sm text-right text-amber-600">{formatINR(item.expenseShare)}</TableCell>
                    <TableCell className="text-sm font-bold text-right text-green-600">{formatINR(item.netProfit)}</TableCell>
                    <TableCell className="text-right">
                      <Link href={`/finance/investors/${item.investor?.id}`} className="text-xs text-[#1B4332] hover:underline whitespace-nowrap">
                        View →
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
                {/* Total row */}
                {investorData?.length > 0 && (
                  <TableRow className="bg-gray-50/80 font-semibold">
                    <TableCell className="text-sm">Total</TableCell>
                    <TableCell className="text-sm text-right">{formatINR((investorData as any[]).reduce((s: number, i: any) => s + (i.investor?.investedAmount || 0), 0))}</TableCell>
                    <TableCell className="text-right text-xs">100%</TableCell>
                    <TableCell className="text-sm text-right">{formatINR(pl?.grossRevenue || 0)}</TableCell>
                    <TableCell className="text-sm text-right text-red-600">{formatINR(pl?.totalCogs || 0)}</TableCell>
                    <TableCell className="text-sm text-right text-blue-600">{formatINR(pl?.grossProfit || 0)}</TableCell>
                    <TableCell className="text-sm text-right text-amber-600">{formatINR(pl?.totalExpenses || 0)}</TableCell>
                    <TableCell className="text-sm font-bold text-right text-green-600">{formatINR(pl?.netProfit || 0)}</TableCell>
                    <TableCell />
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
