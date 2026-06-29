"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { toast } from "sonner"
import { ArrowLeft, Loader2 } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

type Category = { id: string; name: string }
const UNITS = ["pcs", "kg", "ltr", "dozen", "pack", "gm", "ml", "bundle"]

export default function EditProductPage() {
  const router = useRouter()
  const { id } = useParams<{ id: string }>()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState<any>(null)

  const { data: product, isLoading } = useQuery({
    queryKey: ["product", id],
    queryFn: () => fetch(`/api/products/${id}`).then((r) => r.json()),
  })

  const { data: categories } = useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: () => fetch("/api/categories").then((r) => r.json()),
  })

  useEffect(() => {
    if (product && !form) {
      setForm({
        name: product.name || "",
        categoryId: product.categoryId || "",
        sku: product.sku || "",
        barcode: product.barcode || "",
        buyingPrice: String(product.buyingPrice || ""),
        sellingPrice: String(product.sellingPrice || ""),
        mrp: String(product.mrp || ""),
        stockQty: String(product.stockQty ?? "0"),
        reorderLevel: String(product.reorderLevel ?? "10"),
        unit: product.unit || "pcs",
        expiryDate: product.expiryDate ? product.expiryDate.split("T")[0] : "",
        isActive: product.isActive ?? true,
      })
    }
  }, [product, form])

  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch(`/api/products/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error("Failed to update")
      toast.success("Product updated successfully")
      router.push("/inventory")
    } catch {
      toast.error("Failed to update product")
    } finally {
      setLoading(false)
    }
  }

  if (isLoading || !form) return (
    <div className="max-w-2xl mx-auto space-y-4">
      <Skeleton className="h-9 w-40" />
      {[1, 2, 3].map((i) => <Skeleton key={i} className="h-48 rounded-xl" />)}
    </div>
  )

  const margin = form.buyingPrice && form.sellingPrice
    ? (((parseFloat(form.sellingPrice) - parseFloat(form.buyingPrice)) / parseFloat(form.buyingPrice)) * 100).toFixed(1)
    : null

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/inventory">
          <Button variant="ghost" size="icon" className="w-8 h-8"><ArrowLeft className="w-4 h-4" /></Button>
        </Link>
        <div>
          <h2 className="text-xl font-bold text-[#1A1A2E]">Edit Product</h2>
          <p className="text-sm text-gray-500">{product?.name}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Card className="rounded-xl border border-gray-100">
          <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Basic Information</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-gray-700">Product Name *</Label>
              <Input value={form.name} onChange={(e) => set("name", e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-gray-700">Category *</Label>
              <Select value={form.categoryId} onValueChange={(v) => set("categoryId", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {categories?.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-gray-700">SKU</Label>
                <Input value={form.sku} onChange={(e) => set("sku", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-gray-700">Barcode</Label>
                <Input value={form.barcode} onChange={(e) => set("barcode", e.target.value)} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border border-gray-100">
          <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Pricing</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-gray-700">Buying Price ₹</Label>
                <Input type="number" step="0.01" value={form.buyingPrice} onChange={(e) => set("buyingPrice", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-gray-700">Selling Price ₹</Label>
                <Input type="number" step="0.01" value={form.sellingPrice} onChange={(e) => set("sellingPrice", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-gray-700">MRP ₹</Label>
                <Input type="number" step="0.01" value={form.mrp} onChange={(e) => set("mrp", e.target.value)} />
              </div>
            </div>
            {margin && <p className="text-xs text-green-600 font-medium">Margin: {margin}%</p>}
          </CardContent>
        </Card>

        <Card className="rounded-xl border border-gray-100">
          <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Stock & Unit</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-gray-700">Stock Qty</Label>
                <Input type="number" value={form.stockQty} onChange={(e) => set("stockQty", e.target.value)} min="0" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-gray-700">Reorder Level</Label>
                <Input type="number" value={form.reorderLevel} onChange={(e) => set("reorderLevel", e.target.value)} min="0" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-gray-700">Unit</Label>
                <Select value={form.unit} onValueChange={(v) => set("unit", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{UNITS.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-gray-700">Expiry Date</Label>
              <Input type="date" value={form.expiryDate} onChange={(e) => set("expiryDate", e.target.value)} />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium text-gray-700">Active Product</Label>
              <Switch checked={form.isActive} onCheckedChange={(v) => set("isActive", v)} />
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Link href="/inventory" className="flex-1">
            <Button variant="outline" type="button" className="w-full">Cancel</Button>
          </Link>
          <Button type="submit" disabled={loading} className="flex-1 bg-[#1B4332] hover:bg-[#0F6E56] text-white">
            {loading ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </div>
  )
}
