"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { toast } from "sonner"
import { Download, FileText, FileSpreadsheet } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { formatINR } from "@/lib/format"

export default function ReportsPage() {
  const [from, setFrom] = useState(() => {
    const d = new Date()
    d.setDate(1)
    return d.toISOString().split("T")[0]
  })
  const [to, setTo] = useState(() => new Date().toISOString().split("T")[0])
  const [exporting, setExporting] = useState(false)

  const { data: pl, isLoading, refetch } = useQuery({
    queryKey: ["pl-report", from, to],
    queryFn: () =>
      fetch(`/api/finance/pl?from=${new Date(from).toISOString()}&to=${new Date(to).toISOString()}`).then((r) =>
        r.json()
      ),
    enabled: !!from && !!to,
  })

  const { data: investorData } = useQuery({
    queryKey: ["investor-returns-report", from, to],
    queryFn: () =>
      fetch(
        `/api/finance/investor-returns?from=${new Date(from).toISOString()}&to=${new Date(to).toISOString()}`
      ).then((r) => r.json()),
    enabled: !!from && !!to,
  })

  const handleExcelExport = async () => {
    setExporting(true)
    try {
      const XLSX = await import("xlsx")
      const wb = XLSX.utils.book_new()

      // P&L Sheet
      const plSheet = XLSX.utils.aoa_to_sheet([
        ["GroceryOS — Profit & Loss Report"],
        [`Period: ${from} to ${to}`],
        [],
        ["Metric", "Amount (₹)"],
        ["Gross Revenue", pl?.grossRevenue || 0],
        ["Total COGS", pl?.totalCogs || 0],
        ["Gross Profit", pl?.grossProfit || 0],
        ["Total Expenses", pl?.totalExpenses || 0],
        ["Net Profit", pl?.netProfit || 0],
        [],
        ["GST Collected", ""],
        ["Total CGST", pl?.totalCgst || 0],
        ["Total SGST", pl?.totalSgst || 0],
        [],
        ["Revenue Split", ""],
        ["Grocery Revenue", pl?.groceryRevenue || 0],
        ["Quick Service Revenue", pl?.quickServiceRevenue || 0],
      ])
      XLSX.utils.book_append_sheet(wb, plSheet, "P&L Summary")

      // Investor Sheet
      if (investorData?.length) {
        const invRows = [
          ["Investor", "Invested Amount", "Share %", "Revenue Share", "COGS Share", "Gross Profit", "Expense Share", "Net Profit", "ROI %"],
          ...(investorData as any[]).map((i: any) => [
            i.investor?.displayName,
            i.investor?.investedAmount,
            i.sharePercent?.toFixed(2),
            i.revenueShare?.toFixed(2),
            i.cogShare?.toFixed(2),
            i.grossProfitShare?.toFixed(2),
            i.expenseShare?.toFixed(2),
            i.netProfit?.toFixed(2),
            i.roi?.toFixed(2),
          ]),
        ]
        const invSheet = XLSX.utils.aoa_to_sheet(invRows)
        XLSX.utils.book_append_sheet(wb, invSheet, "Investor Returns")
      }

      XLSX.writeFile(wb, `GroceryOS-Report-${from}-to-${to}.xlsx`)
      toast.success("Excel report downloaded")
    } catch (err) {
      toast.error("Failed to export Excel")
    } finally {
      setExporting(false)
    }
  }

  const handlePrintReport = () => {
    window.print()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-[#1A1A2E]">Reports</h2>
          <p className="text-sm text-gray-500 mt-0.5">Generate and export P&L reports</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrintReport}
            className="gap-1.5"
          >
            <FileText className="w-3.5 h-3.5" /> Print PDF
          </Button>
          <Button
            size="sm"
            onClick={handleExcelExport}
            disabled={exporting || isLoading}
            className="bg-[#1B4332] hover:bg-[#0F6E56] text-white gap-1.5"
          >
            {exporting ? (
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <FileSpreadsheet className="w-3.5 h-3.5" />
            )}
            Export Excel
          </Button>
        </div>
      </div>

      {/* Date Range */}
      <Card className="rounded-xl border border-gray-100">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-gray-700">From</Label>
              <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-40 h-9 text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-gray-700">To</Label>
              <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-40 h-9 text-sm" />
            </div>
            <Button onClick={() => refetch()} variant="outline" size="sm" className="h-9">
              Generate Report
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* P&L Summary */}
      <div id="printable-report">
        <Card className="rounded-xl border border-gray-100">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">P&L Summary — {from} to {to}</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">{[1,2,3,4,5].map(i => <Skeleton key={i} className="h-8" />)}</div>
            ) : (
              <div className="space-y-0">
                {[
                  { label: "Gross Revenue", value: pl?.grossRevenue, color: "text-[#1A1A2E]" },
                  { label: "Total COGS", value: pl?.totalCogs, color: "text-red-600" },
                  { label: "Gross Profit", value: pl?.grossProfit, color: "text-blue-600", divider: true },
                  { label: "Total Expenses", value: pl?.totalExpenses, color: "text-amber-600" },
                  { label: "Net Profit", value: pl?.netProfit, color: "text-green-700", bold: true },
                ].map(({ label, value, color, divider, bold }) => (
                  <div key={label}>
                    {divider && <div className="my-2 border-t border-gray-200" />}
                    <div className={`flex justify-between py-2.5 ${bold ? "border-t border-gray-200 mt-2 pt-3" : ""}`}>
                      <span className={`text-sm ${bold ? "font-bold text-[#1A1A2E]" : "text-gray-600"}`}>{label}</span>
                      <span className={`text-sm font-semibold ${color} ${bold ? "text-base" : ""}`}>{formatINR(value || 0)}</span>
                    </div>
                  </div>
                ))}
                <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Total CGST Collected</p>
                    <p className="text-sm font-semibold">{formatINR(pl?.totalCgst || 0)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Total SGST Collected</p>
                    <p className="text-sm font-semibold">{formatINR(pl?.totalSgst || 0)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Grocery Revenue</p>
                    <p className="text-sm font-semibold">{formatINR(pl?.groceryRevenue || 0)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Quick Service Revenue</p>
                    <p className="text-sm font-semibold">{formatINR(pl?.quickServiceRevenue || 0)}</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Investor Returns */}
        {investorData?.length > 0 && (
          <Card className="rounded-xl border border-gray-100 mt-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Investor Returns</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      {["Investor","Invested","Share %","Revenue","COGS","Gross Profit","Exp. Share","Net Profit"].map(h => (
                        <th key={h} className="px-4 py-2.5 text-xs font-semibold text-gray-600 text-right first:text-left">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(investorData as any[]).map((item: any) => (
                      <tr key={item.investor?.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.investor?.colorTag }} />
                            <span className="font-medium">{item.investor?.displayName}</span>
                          </div>
                        </td>
                        <td className="px-4 py-2.5 text-right">{formatINR(item.investor?.investedAmount)}</td>
                        <td className="px-4 py-2.5 text-right">{item.sharePercent?.toFixed(1)}%</td>
                        <td className="px-4 py-2.5 text-right">{formatINR(item.revenueShare)}</td>
                        <td className="px-4 py-2.5 text-right text-red-600">{formatINR(item.cogShare)}</td>
                        <td className="px-4 py-2.5 text-right text-blue-600">{formatINR(item.grossProfitShare)}</td>
                        <td className="px-4 py-2.5 text-right text-amber-600">{formatINR(item.expenseShare)}</td>
                        <td className="px-4 py-2.5 text-right font-bold text-green-600">{formatINR(item.netProfit)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
