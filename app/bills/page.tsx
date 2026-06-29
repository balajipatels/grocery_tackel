"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import Link from "next/link"
import { Search, ChevronLeft, ChevronRight, ExternalLink } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatINR, formatDateTime } from "@/lib/format"

type Bill = {
  id: string; billNumber: string; customerName?: string; grandTotal: number
  paymentMethod: string; status: string; createdAt: string; items: any[]
  createdBy: { name?: string }
}

const STATUS_STYLES: Record<string, string> = {
  PAID: "bg-green-100 text-green-700 border-green-200",
  PENDING: "bg-amber-100 text-amber-700 border-amber-200",
  CANCELLED: "bg-red-100 text-red-700 border-red-200",
}

const PAYMENT_STYLES: Record<string, string> = {
  CASH: "bg-blue-100 text-blue-700 border-blue-200",
  UPI: "bg-purple-100 text-purple-700 border-purple-200",
  CARD: "bg-gray-100 text-gray-700 border-gray-200",
}

export default function BillsPage() {
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState("all")
  const [paymentMethod, setPaymentMethod] = useState("all")
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ["bills", search, status, paymentMethod, page],
    queryFn: () => {
      const params = new URLSearchParams({ page: String(page), limit: "25" })
      if (search) params.set("search", search)
      if (status !== "all") params.set("status", status)
      if (paymentMethod !== "all") params.set("paymentMethod", paymentMethod)
      return fetch(`/api/bills?${params}`).then((r) => r.json())
    },
  })

  const bills: Bill[] = data?.bills || []
  const totalPages: number = data?.totalPages || 1

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#1A1A2E]">Bills</h2>
          <p className="text-sm text-gray-500 mt-0.5">{data?.total || 0} total bills</p>
        </div>
        <Link href="/pos">
          <Button size="sm" className="bg-[#1B4332] hover:bg-[#0F6E56] text-white">New Sale</Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 bg-white rounded-xl border border-gray-100 p-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <Input
            placeholder="Search bill no, customer..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="pl-8 h-9 text-sm border-gray-200"
          />
        </div>
        <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1) }}>
          <SelectTrigger className="w-36 h-9 text-sm border-gray-200">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="PAID">Paid</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="CANCELLED">Cancelled</SelectItem>
          </SelectContent>
        </Select>
        <Select value={paymentMethod} onValueChange={(v) => { setPaymentMethod(v); setPage(1) }}>
          <SelectTrigger className="w-36 h-9 text-sm border-gray-200">
            <SelectValue placeholder="Payment" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Methods</SelectItem>
            <SelectItem value="CASH">Cash</SelectItem>
            <SelectItem value="UPI">UPI</SelectItem>
            <SelectItem value="CARD">Card</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50/80">
              <TableHead className="text-xs font-semibold text-gray-600">Bill No.</TableHead>
              <TableHead className="text-xs font-semibold text-gray-600">Customer</TableHead>
              <TableHead className="text-xs font-semibold text-gray-600">Items</TableHead>
              <TableHead className="text-xs font-semibold text-gray-600">Amount</TableHead>
              <TableHead className="text-xs font-semibold text-gray-600">Payment</TableHead>
              <TableHead className="text-xs font-semibold text-gray-600">Status</TableHead>
              <TableHead className="text-xs font-semibold text-gray-600">Date</TableHead>
              <TableHead className="text-xs font-semibold text-gray-600">Staff</TableHead>
              <TableHead className="text-xs font-semibold text-gray-600 text-right">View</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 9 }).map((_, j) => (
                    <TableCell key={j}><div className="h-4 bg-gray-100 rounded animate-pulse" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : bills.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-12 text-gray-400 text-sm">
                  No bills found. <Link href="/pos" className="text-[#1B4332] underline">Create a sale</Link>
                </TableCell>
              </TableRow>
            ) : (
              bills.map((bill) => (
                <TableRow key={bill.id} className="hover:bg-gray-50/50 transition-colors">
                  <TableCell className="font-mono text-xs font-medium text-[#1B4332]">{bill.billNumber}</TableCell>
                  <TableCell className="text-sm">{bill.customerName || <span className="text-gray-400">Walk-in</span>}</TableCell>
                  <TableCell className="text-sm text-gray-600">{bill.items?.length || 0}</TableCell>
                  <TableCell className="font-semibold text-sm">{formatINR(bill.grandTotal)}</TableCell>
                  <TableCell>
                    <Badge className={`text-xs ${PAYMENT_STYLES[bill.paymentMethod] || ""}`}>{bill.paymentMethod}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={`text-xs ${STATUS_STYLES[bill.status] || ""}`}>{bill.status}</Badge>
                  </TableCell>
                  <TableCell className="text-xs text-gray-500">{formatDateTime(bill.createdAt)}</TableCell>
                  <TableCell className="text-xs text-gray-500">{bill.createdBy?.name || "—"}</TableCell>
                  <TableCell className="text-right">
                    <Link href={`/bills/${bill.id}`}>
                      <Button variant="ghost" size="icon" className="w-7 h-7">
                        <ExternalLink className="w-3.5 h-3.5 text-gray-500" />
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
            <span className="text-xs text-gray-500">Page {page} of {totalPages}</span>
            <div className="flex gap-1.5">
              <Button variant="outline" size="icon" className="w-8 h-8" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
                <ChevronLeft className="w-3.5 h-3.5" />
              </Button>
              <Button variant="outline" size="icon" className="w-8 h-8" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
