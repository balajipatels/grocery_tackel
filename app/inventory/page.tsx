"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import Link from "next/link"
import {
  Plus, Search, Edit2, Archive, AlertTriangle, ChevronLeft, ChevronRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { formatINR } from "@/lib/format"

type Product = {
  id: string; name: string; sku?: string; stockQty: number; reorderLevel: number
  buyingPrice: number; sellingPrice: number; unit: string; isActive: boolean
  category: { id: string; name: string; colorHex: string }
  imageUrl?: string | null
}
type Category = { id: string; name: string }

function StockBadge({ qty, reorder }: { qty: number; reorder: number }) {
  if (qty <= 0) return <Badge className="bg-red-100 text-red-700 border-red-200">Out of Stock</Badge>
  if (qty <= reorder) return (
    <Badge className="bg-amber-100 text-amber-700 border-amber-200 gap-1">
      <AlertTriangle className="w-3 h-3" /> Low ({qty})
    </Badge>
  )
  return <Badge className="bg-green-100 text-green-700 border-green-200">In Stock ({qty})</Badge>
}

function StockAdjustDialog({
  product, open, onClose,
}: { product: Product | null; open: boolean; onClose: () => void }) {
  const [qty, setQty] = useState("")
  const [type, setType] = useState("STOCK_IN")
  const [notes, setNotes] = useState("")
  const qc = useQueryClient()

  const mutation = useMutation({
    mutationFn: () =>
      fetch("/api/stock/adjust", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product?.id, type, quantity: parseInt(qty), notes }),
      }).then((r) => r.json()),
    onSuccess: () => {
      toast.success("Stock updated")
      qc.invalidateQueries({ queryKey: ["products"] })
      onClose()
      setQty("")
      setNotes("")
    },
    onError: () => toast.error("Failed to update stock"),
  })

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Adjust Stock — {product?.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">Type</label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="STOCK_IN">Stock In (+)</SelectItem>
                <SelectItem value="ADJUSTMENT">Adjustment</SelectItem>
                <SelectItem value="DAMAGE">Damage (-)</SelectItem>
                <SelectItem value="RETURN">Return (+)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">Quantity</label>
            <Input type="number" value={qty} onChange={(e) => setQty(e.target.value)} placeholder="0" min="1" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">Notes (optional)</label>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Reason..." />
          </div>
          <div className="flex gap-2 pt-1">
            <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
            <Button
              onClick={() => mutation.mutate()}
              disabled={!qty || mutation.isPending}
              className="flex-1 bg-[#1B4332] hover:bg-[#0F6E56] text-white"
            >
              {mutation.isPending ? "Saving..." : "Update Stock"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default function InventoryPage() {
  const [search, setSearch] = useState("")
  const [categoryId, setCategoryId] = useState("all")
  const [status, setStatus] = useState("all")
  const [page, setPage] = useState(1)
  const [adjustProduct, setAdjustProduct] = useState<Product | null>(null)
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ["products", search, categoryId, status, page],
    queryFn: () => {
      const params = new URLSearchParams({ page: String(page), limit: "25" })
      if (search) params.set("search", search)
      if (categoryId !== "all") params.set("categoryId", categoryId)
      if (status !== "all") params.set("status", status)
      return fetch(`/api/products?${params}`).then((r) => r.json())
    },
  })

  const { data: categories } = useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: () => fetch("/api/categories").then((r) => r.json()),
  })

  const archiveMutation = useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/products/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      toast.success("Product archived")
      qc.invalidateQueries({ queryKey: ["products"] })
    },
    onError: () => toast.error("Failed to archive product"),
  })

  const products: Product[] = data?.products || []
  const totalPages: number = data?.totalPages || 1

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#1A1A2E]">Products</h2>
          <p className="text-sm text-gray-500 mt-0.5">{data?.total || 0} total products</p>
        </div>
        <div className="flex gap-2">
          <Link href="/inventory/categories">
            <Button variant="outline" size="sm">Categories</Button>
          </Link>
          <Link href="/inventory/add">
            <Button size="sm" className="bg-[#1B4332] hover:bg-[#0F6E56] text-white">
              <Plus className="w-4 h-4 mr-1.5" /> Add Product
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 bg-white rounded-xl border border-gray-100 p-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <Input
            placeholder="Search products..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="pl-8 h-9 text-sm border-gray-200"
          />
        </div>
        <Select value={categoryId} onValueChange={(v) => { setCategoryId(v); setPage(1) }}>
          <SelectTrigger className="w-40 h-9 text-sm border-gray-200">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories?.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1) }}>
          <SelectTrigger className="w-36 h-9 text-sm border-gray-200">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="IN">In Stock</SelectItem>
            <SelectItem value="LOW">Low Stock</SelectItem>
            <SelectItem value="OUT">Out of Stock</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50/80">
              <TableHead className="text-xs font-semibold text-gray-600 w-10"></TableHead>
              <TableHead className="text-xs font-semibold text-gray-600">Name</TableHead>
              <TableHead className="text-xs font-semibold text-gray-600">Category</TableHead>
              <TableHead className="text-xs font-semibold text-gray-600">SKU</TableHead>
              <TableHead className="text-xs font-semibold text-gray-600">Stock</TableHead>
              <TableHead className="text-xs font-semibold text-gray-600">Buying ₹</TableHead>
              <TableHead className="text-xs font-semibold text-gray-600">Selling ₹</TableHead>
              <TableHead className="text-xs font-semibold text-gray-600">Margin</TableHead>
              <TableHead className="text-xs font-semibold text-gray-600 text-right">Actions</TableHead>
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
            ) : products.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-12 text-gray-400 text-sm">
                  No products found. <Link href="/inventory/add" className="text-[#1B4332] underline">Add one</Link>
                </TableCell>
              </TableRow>
            ) : (
              products.map((p) => {
                const margin = p.buyingPrice > 0 ? ((p.sellingPrice - p.buyingPrice) / p.buyingPrice) * 100 : 0
                return (
                  <TableRow key={p.id} className="hover:bg-gray-50/50 transition-colors">
                    <TableCell>
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: p.category.colorHex }}>
                        {p.imageUrl ? <img src={p.imageUrl} className="w-full h-full object-cover rounded-lg" alt={p.name} /> : p.name.charAt(0)}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium text-sm text-[#1A1A2E]">{p.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs" style={{ borderColor: p.category.colorHex, color: p.category.colorHex }}>
                        {p.category.name}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-gray-500 font-mono">{p.sku || "—"}</TableCell>
                    <TableCell>
                      <button onClick={() => setAdjustProduct(p)} className="hover:opacity-80 transition-opacity">
                        <StockBadge qty={p.stockQty} reorder={p.reorderLevel} />
                      </button>
                    </TableCell>
                    <TableCell className="text-sm">{formatINR(p.buyingPrice)}</TableCell>
                    <TableCell className="text-sm font-medium">{formatINR(p.sellingPrice)}</TableCell>
                    <TableCell>
                      <span className={`text-xs font-medium ${margin >= 20 ? "text-green-600" : margin >= 10 ? "text-amber-600" : "text-red-600"}`}>
                        {margin.toFixed(1)}%
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link href={`/inventory/${p.id}/edit`}>
                          <Button variant="ghost" size="icon" className="w-7 h-7">
                            <Edit2 className="w-3.5 h-3.5 text-gray-500" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="w-7 h-7"
                          onClick={() => archiveMutation.mutate(p.id)}
                        >
                          <Archive className="w-3.5 h-3.5 text-gray-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>

        {/* Pagination */}
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

      <StockAdjustDialog product={adjustProduct} open={!!adjustProduct} onClose={() => setAdjustProduct(null)} />
    </div>
  )
}
