"use client"

import { useQuery } from "@tanstack/react-query"
import Link from "next/link"
import {
  TrendingUp, ShoppingCart, Package, AlertTriangle,
  Plus, BarChart2, FileText, RefreshCw,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { formatINR, formatDateTime } from "@/lib/format"
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, Legend,
} from "recharts"

function MetricCard({
  title, value, sub, icon: Icon, color, loading,
}: {
  title: string; value: string; sub?: string; icon: any; color: string; loading?: boolean
}) {
  if (loading) return <Skeleton className="h-28 rounded-xl" />
  return (
    <Card className="rounded-xl border border-gray-100 shadow-sm">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-gray-500 font-medium">{title}</span>
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center`} style={{ backgroundColor: `${color}20` }}>
            <Icon className="w-4.5 h-4.5" style={{ color }} />
          </div>
        </div>
        <p className="text-2xl font-bold text-[#1A1A2E] leading-tight">{value}</p>
        {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
      </CardContent>
    </Card>
  )
}

const SUGGESTION_COLORS: Record<string, string> = {
  growth: "#1B4332",
  warning: "#D97706",
  tip: "#2563EB",
  stock: "#DC2626",
}

const CATEGORY_COLORS = ["#1D9E75", "#378ADD", "#BA7517", "#993556", "#534AB7"]

export default function DashboardPage() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: () => fetch("/api/dashboard/stats").then((r) => r.json()),
    refetchInterval: 60000,
  })

  const { data: quote, isLoading: quoteLoading } = useQuery({
    queryKey: ["daily-quote"],
    queryFn: () => fetch("/api/ai/quote").then((r) => r.json()),
    staleTime: 24 * 60 * 60 * 1000,
  })

  const { data: suggestions, isLoading: suggestionsLoading } = useQuery({
    queryKey: ["ai-suggestions"],
    queryFn: () => fetch("/api/ai/suggestions").then((r) => r.json()),
    staleTime: 24 * 60 * 60 * 1000,
  })

  const { data: plData } = useQuery({
    queryKey: ["pl-14days"],
    queryFn: () => {
      const to = new Date().toISOString()
      const from = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()
      return fetch(`/api/finance/pl?from=${from}&to=${to}`).then((r) => r.json())
    },
    staleTime: 5 * 60 * 1000,
  })

  const revenueChange = stats?.revenueChange || 0
  const revenueChangeText =
    revenueChange === 0
      ? "No change vs yesterday"
      : `${revenueChange > 0 ? "+" : ""}${revenueChange.toFixed(1)}% vs yesterday`

  const pieData = [
    { name: "Grocery", value: plData?.groceryRevenue || 0 },
    { name: "Quick Service", value: plData?.quickServiceRevenue || 0 },
  ].filter((d) => d.value > 0)

  return (
    <div className="space-y-6">
      {/* Quote Banner */}
      <div
        className="rounded-xl p-5 border border-[#B7E4C7]"
        style={{ background: "linear-gradient(135deg, #D8F3DC, #E8F5E9)" }}
      >
        {quoteLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-5 w-3/4 bg-green-200" />
            <Skeleton className="h-4 w-1/4 bg-green-200" />
          </div>
        ) : (
          <>
            <p className="text-[#1B4332] text-base italic font-medium leading-relaxed">
              &ldquo;{quote?.quote || "Every day is a new opportunity to grow your business."}&rdquo;
            </p>
            <p className="text-[#2D6A4F] text-sm mt-1.5 font-medium">— {quote?.author || "GroceryOS"}</p>
          </>
        )}
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Today's Revenue"
          value={formatINR(stats?.todayRevenue || 0)}
          sub={revenueChangeText}
          icon={TrendingUp}
          color="#1D9E75"
          loading={statsLoading}
        />
        <MetricCard
          title="Bills Generated"
          value={String(stats?.billCount || 0)}
          sub="Today"
          icon={FileText}
          color="#378ADD"
          loading={statsLoading}
        />
        <MetricCard
          title="Items Sold"
          value={String(stats?.itemsSold || 0)}
          sub="Today"
          icon={ShoppingCart}
          color="#534AB7"
          loading={statsLoading}
        />
        <MetricCard
          title="Low Stock Items"
          value={String(stats?.lowStockCount || 0)}
          sub={stats?.lowStockCount > 0 ? "Needs attention" : "All stocked"}
          icon={AlertTriangle}
          color={stats?.lowStockCount > 0 ? "#DC2626" : "#16A34A"}
          loading={statsLoading}
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "New Sale", href: "/pos", icon: ShoppingCart, color: "#1B4332" },
          { label: "Add Stock", href: "/inventory/add", icon: Plus, color: "#2563EB" },
          { label: "View Finance", href: "/finance", icon: TrendingUp, color: "#D97706" },
          { label: "Generate Report", href: "/reports", icon: BarChart2, color: "#993556" },
        ].map(({ label, href, icon: Icon, color }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-3 bg-white rounded-xl border border-gray-100 px-4 py-3.5 hover:border-gray-200 hover:shadow-sm transition-all duration-200"
          >
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${color}15` }}>
              <Icon className="w-4 h-4" style={{ color }} />
            </div>
            <span className="text-sm font-medium text-[#1A1A2E]">{label}</span>
          </Link>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <Card className="lg:col-span-3 rounded-xl border border-gray-100 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-[#1A1A2E]">Revenue & Profit — Last 14 Days</CardTitle>
          </CardHeader>
          <CardContent className="h-56">
            {plData?.dailyData ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={plData.dailyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="createdAt" tickFormatter={(v) => new Date(v).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })} tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v: number) => formatINR(v)} />
                  <Legend />
                  <Line type="monotone" dataKey="_sum.grandTotal" name="Revenue" stroke="#1B4332" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="_sum.totalCogs" name="COGS" stroke="#52B788" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400 text-sm">No data yet</div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 rounded-xl border border-gray-100 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-[#1A1A2E]">Revenue by Category</CardTitle>
          </CardHeader>
          <CardContent className="h-56 flex items-center justify-center">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                    {pieData.map((_, i) => <Cell key={i} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v: number) => formatINR(v)} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-400 text-sm">No sales today</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Top Products */}
        <Card className="rounded-xl border border-gray-100 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-[#1A1A2E]">Top 5 Products Today</CardTitle>
          </CardHeader>
          <CardContent className="h-48">
            {stats?.topProducts?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.topProducts} layout="vertical">
                  <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={(v) => `₹${(v / 1000).toFixed(1)}k`} />
                  <YAxis type="category" dataKey="productName" tick={{ fontSize: 10 }} width={80} />
                  <Tooltip formatter={(v: number) => formatINR(v)} />
                  <Bar dataKey="_sum.lineTotal" fill="#1B4332" radius={[0, 3, 3, 0]} name="Revenue" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400 text-sm">No sales today</div>
            )}
          </CardContent>
        </Card>

        {/* Recent Bills */}
        <Card className="rounded-xl border border-gray-100 shadow-sm">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold text-[#1A1A2E]">Recent Bills</CardTitle>
            <Link href="/bills" className="text-xs text-[#1B4332] hover:underline">View all →</Link>
          </CardHeader>
          <CardContent className="p-0">
            {statsLoading ? (
              <div className="p-4 space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-10" />)}</div>
            ) : stats?.recentBills?.length > 0 ? (
              <div className="divide-y divide-gray-50">
                {stats.recentBills.map((bill: any) => (
                  <Link key={bill.id} href={`/bills/${bill.id}`} className="flex items-center justify-between px-4 py-2.5 hover:bg-gray-50 transition-colors">
                    <div>
                      <p className="text-xs font-medium text-[#1A1A2E]">{bill.billNumber}</p>
                      <p className="text-xs text-gray-400">{formatDateTime(bill.createdAt)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-semibold text-[#1A1A2E]">{formatINR(bill.grandTotal)}</p>
                      <Badge variant="outline" className="text-[10px] h-4">{bill.paymentMethod}</Badge>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-32 text-gray-400 text-sm">No bills yet</div>
            )}
          </CardContent>
        </Card>

        {/* AI Suggestions */}
        <Card className="rounded-xl border border-gray-100 shadow-sm">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold text-[#1A1A2E]">AI Suggestions</CardTitle>
            <RefreshCw className="w-3.5 h-3.5 text-gray-400" />
          </CardHeader>
          <CardContent className="p-0">
            {suggestionsLoading ? (
              <div className="p-4 space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-12" />)}</div>
            ) : suggestions?.length > 0 ? (
              <div className="divide-y divide-gray-50">
                {(suggestions as any[]).slice(0, 4).map((s: any, i: number) => (
                  <div key={i} className="px-4 py-2.5">
                    <div className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: SUGGESTION_COLORS[s.type] || "#1B4332" }} />
                      <div>
                        <p className="text-xs font-medium text-[#1A1A2E]">{s.title}</p>
                        <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{s.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-32 text-gray-400 text-sm">No suggestions</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
