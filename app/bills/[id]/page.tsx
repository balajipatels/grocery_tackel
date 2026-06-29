"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useParams } from "next/navigation"
import { toast } from "sonner"
import Link from "next/link"
import { ArrowLeft, Printer, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatINR, formatDateTime } from "@/lib/format"

const STATUS_STYLES: Record<string, string> = {
  PAID: "bg-green-100 text-green-700",
  PENDING: "bg-amber-100 text-amber-700",
  CANCELLED: "bg-red-100 text-red-700",
}

export default function BillDetailPage() {
  const { id } = useParams<{ id: string }>()
  const qc = useQueryClient()

  const { data: bill, isLoading } = useQuery({
    queryKey: ["bill", id],
    queryFn: () => fetch(`/api/bills/${id}`).then((r) => r.json()),
  })

  const cancelMutation = useMutation({
    mutationFn: () =>
      fetch(`/api/bills/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CANCELLED" }),
      }),
    onSuccess: () => {
      toast.success("Bill cancelled")
      qc.invalidateQueries({ queryKey: ["bill", id] })
    },
    onError: () => toast.error("Failed to cancel bill"),
  })

  if (isLoading) return (
    <div className="max-w-2xl mx-auto space-y-4">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-64 rounded-xl" />
      <Skeleton className="h-48 rounded-xl" />
    </div>
  )

  if (bill?.error) return (
    <div className="flex flex-col items-center justify-center py-20">
      <p className="text-gray-500">Bill not found</p>
      <Link href="/bills" className="mt-3 text-[#1B4332] underline text-sm">Back to Bills</Link>
    </div>
  )

  const shopName = process.env.NEXT_PUBLIC_SHOP_NAME || "My Grocery Store"

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/bills">
            <Button variant="ghost" size="icon" className="w-8 h-8"><ArrowLeft className="w-4 h-4" /></Button>
          </Link>
          <div>
            <h2 className="text-xl font-bold text-[#1A1A2E]">{bill?.billNumber}</h2>
            <p className="text-sm text-gray-500">{formatDateTime(bill?.createdAt)}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {bill?.status !== "CANCELLED" && (
            <Button
              variant="outline"
              size="sm"
              className="text-red-600 border-red-200 hover:bg-red-50"
              onClick={() => cancelMutation.mutate()}
              disabled={cancelMutation.isPending}
            >
              <XCircle className="w-3.5 h-3.5 mr-1.5" /> Cancel Bill
            </Button>
          )}
          <Button
            size="sm"
            className="bg-[#1B4332] hover:bg-[#0F6E56] text-white"
            onClick={() => window.open(`/bills/${id}`, "_blank")}
          >
            <Printer className="w-3.5 h-3.5 mr-1.5" /> Print Bill
          </Button>
        </div>
      </div>

      {/* Bill Card */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {/* Shop Header */}
        <div className="bg-[#1B4332] text-white p-5 text-center">
          <h3 className="font-bold text-lg">{shopName}</h3>
          <p className="text-white/70 text-xs mt-0.5">{process.env.NEXT_PUBLIC_SHOP_ADDRESS || ""}</p>
          {process.env.NEXT_PUBLIC_SHOP_GSTIN && (
            <p className="text-white/70 text-xs">GSTIN: {process.env.NEXT_PUBLIC_SHOP_GSTIN}</p>
          )}
        </div>

        {/* Bill Info */}
        <div className="grid grid-cols-2 gap-4 p-5 border-b border-gray-100 text-sm">
          <div>
            <p className="text-gray-500 text-xs">Bill No.</p>
            <p className="font-mono font-medium">{bill?.billNumber}</p>
          </div>
          <div>
            <p className="text-gray-500 text-xs">Date</p>
            <p className="font-medium">{formatDateTime(bill?.createdAt)}</p>
          </div>
          <div>
            <p className="text-gray-500 text-xs">Customer</p>
            <p className="font-medium">{bill?.customerName || "Walk-in Customer"}</p>
            {bill?.customerPhone && <p className="text-gray-500 text-xs">{bill.customerPhone}</p>}
          </div>
          <div>
            <p className="text-gray-500 text-xs">Status</p>
            <Badge className={`text-xs ${STATUS_STYLES[bill?.status] || ""}`}>{bill?.status}</Badge>
          </div>
        </div>

        {/* Items Table */}
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50/80">
              <TableHead className="text-xs font-semibold text-gray-600 w-8">#</TableHead>
              <TableHead className="text-xs font-semibold text-gray-600">Product</TableHead>
              <TableHead className="text-xs font-semibold text-gray-600 text-center">Qty</TableHead>
              <TableHead className="text-xs font-semibold text-gray-600 text-right">Rate</TableHead>
              <TableHead className="text-xs font-semibold text-gray-600 text-right">CGST</TableHead>
              <TableHead className="text-xs font-semibold text-gray-600 text-right">SGST</TableHead>
              <TableHead className="text-xs font-semibold text-gray-600 text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bill?.items?.map((item: any, i: number) => (
              <TableRow key={item.id}>
                <TableCell className="text-xs text-gray-500">{i + 1}</TableCell>
                <TableCell className="text-sm font-medium">{item.productName}</TableCell>
                <TableCell className="text-sm text-center">{item.quantity}</TableCell>
                <TableCell className="text-sm text-right">{formatINR(item.sellingPrice)}</TableCell>
                <TableCell className="text-xs text-right text-gray-500">{formatINR(item.cgstAmount)}</TableCell>
                <TableCell className="text-xs text-right text-gray-500">{formatINR(item.sgstAmount)}</TableCell>
                <TableCell className="text-sm font-medium text-right">{formatINR(item.lineTotal)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* Totals */}
        <div className="p-5 border-t border-gray-100 space-y-2">
          <div className="flex justify-between text-sm text-gray-500">
            <span>Subtotal</span><span>{formatINR(bill?.subtotal || 0)}</span>
          </div>
          {(bill?.totalCgst || 0) > 0 && (
            <div className="flex justify-between text-sm text-gray-500">
              <span>CGST</span><span>{formatINR(bill?.totalCgst || 0)}</span>
            </div>
          )}
          {(bill?.totalSgst || 0) > 0 && (
            <div className="flex justify-between text-sm text-gray-500">
              <span>SGST</span><span>{formatINR(bill?.totalSgst || 0)}</span>
            </div>
          )}
          {(bill?.discountAmount || 0) > 0 && (
            <div className="flex justify-between text-sm text-green-600">
              <span>Discount</span><span>-{formatINR(bill?.discountAmount || 0)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-base text-[#1A1A2E] pt-2 border-t border-gray-200">
            <span>GRAND TOTAL</span><span>{formatINR(bill?.grandTotal || 0)}</span>
          </div>
          <div className="flex justify-between text-sm text-gray-500 pt-1">
            <span>Payment Method</span>
            <Badge variant="outline" className="text-xs">{bill?.paymentMethod}</Badge>
          </div>
        </div>

        <div className="text-center py-4 border-t border-gray-100 text-gray-400 text-sm">
          Thank you for shopping with us! 🙏
        </div>
      </div>

      {/* Investor Shares */}
      {bill?.investorShares?.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-[#1A1A2E]">Investor Profit Split</h3>
          </div>
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/80">
                <TableHead className="text-xs font-semibold text-gray-600">Investor</TableHead>
                <TableHead className="text-xs font-semibold text-gray-600 text-right">Share %</TableHead>
                <TableHead className="text-xs font-semibold text-gray-600 text-right">Revenue</TableHead>
                <TableHead className="text-xs font-semibold text-gray-600 text-right">COGS</TableHead>
                <TableHead className="text-xs font-semibold text-gray-600 text-right">Profit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bill.investorShares.map((share: any) => (
                <TableRow key={share.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: share.investor?.colorTag || "#1B4332" }} />
                      <span className="text-sm font-medium">{share.investor?.displayName}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-right">{share.sharePercent.toFixed(1)}%</TableCell>
                  <TableCell className="text-sm text-right">{formatINR(share.revenueShare)}</TableCell>
                  <TableCell className="text-sm text-right text-gray-500">{formatINR(share.cogShare)}</TableCell>
                  <TableCell className="text-sm font-semibold text-right text-green-600">{formatINR(share.profitShare)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
