"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
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

type Category = { id: string; name: string }

const UNITS = ["pcs", "kg", "ltr", "dozen", "pack", "gm", "ml", "bundle"]

export default function AddProductPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [imageLoading, setImageLoading] = useState(false)
  const [suggestedImage, setSuggestedImage] = useState<string | null>(null)
  const debounceTimer = useRef<NodeJS.Timeout | null>(null)
  const [form, setForm] = useState({
    name: "", categoryId: "", sku: "", barcode: "",
    buyingPrice: "", sellingPrice: "", mrp: "",
    stockQty: "0", reorderLevel: "10", unit: "pcs",
    expiryDate: "", isActive: true, imageUrl: "",
  })

  const { data: categories } = useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: () => fetch("/api/categories").then((r) => r.json()),
  })

  const set = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }))

  useEffect(() => {
    if (form.name.trim().length < 3) {
      setSuggestedImage(null)
      return
    }

    if (debounceTimer.current) clearTimeout(debounceTimer.current)
    
    debounceTimer.current = setTimeout(async () => {
      setImageLoading(true)
      try {
        const res = await fetch(`/api/products/image-suggest?name=${encodeURIComponent(form.name)}`)
        const data = await res.json()
        if (data.imageUrl) {
          setSuggestedImage(data.imageUrl)
          if (!form.imageUrl) {
            set("imageUrl", data.imageUrl)
          }
        }
      } catch (error) {
        console.error("Failed to fetch image suggestion:", error)
      } finally {
        setImageLoading(false)
      }
    }, 800)

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current)
    }
  }, [form.name])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.categoryId || !form.buyingPrice || !form.sellingPrice || !form.mrp) {
      toast.error("Please fill all required fields")
      return
    }
    setLoading(true)
    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed")
      }
      toast.success("Product added successfully")
      router.push("/inventory")
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  const margin = form.buyingPrice && form.sellingPrice
    ? (((parseFloat(form.sellingPrice) - parseFloat(form.buyingPrice)) / parseFloat(form.buyingPrice)) * 100).toFixed(1)
    : null

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/inventory">
          <Button variant="ghost" size="icon" className="w-8 h-8">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h2 className="text-xl font-bold text-[#1A1A2E]">Add Product</h2>
          <p className="text-sm text-gray-500">Fill in the product details below</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Card className="rounded-xl border border-gray-100">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-gray-700">Product Name *</Label>
              <Input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Toor Dal" required />
            </div>
            {(suggestedImage || form.imageUrl) && (
              <div className="space-y-2">
                <Label className="text-xs font-medium text-gray-700">Product Image</Label>
                <div className="flex gap-3 items-start">
                  <div className="relative w-24 h-24 rounded-lg overflow-hidden border border-gray-200">
                    {imageLoading ? (
                      <div className="w-full h-full flex items-center justify-center bg-gray-50">
                        <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                      </div>
                    ) : (
                      <img src={form.imageUrl || suggestedImage!} alt="Product" className="w-full h-full object-cover" />
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <Input 
                      value={form.imageUrl} 
                      onChange={(e) => set("imageUrl", e.target.value)} 
                      placeholder="Or enter custom image URL"
                      className="text-sm"
                    />
                    {suggestedImage && suggestedImage !== form.imageUrl && (
                      <button
                        type="button"
                        onClick={() => set("imageUrl", suggestedImage)}
                        className="text-xs text-[#1B4332] hover:underline"
                      >
                        Use suggested image
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-gray-700">Category *</Label>
              <Select value={form.categoryId} onValueChange={(v) => set("categoryId", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories?.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-gray-700">SKU</Label>
                <Input value={form.sku} onChange={(e) => set("sku", e.target.value)} placeholder="Auto or manual" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-gray-700">Barcode</Label>
                <Input value={form.barcode} onChange={(e) => set("barcode", e.target.value)} placeholder="Optional" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border border-gray-100">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Pricing</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-gray-700">Buying Price ₹ *</Label>
                <Input type="number" step="0.01" value={form.buyingPrice} onChange={(e) => set("buyingPrice", e.target.value)} placeholder="0.00" required />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-gray-700">Selling Price ₹ *</Label>
                <Input type="number" step="0.01" value={form.sellingPrice} onChange={(e) => set("sellingPrice", e.target.value)} placeholder="0.00" required />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-gray-700">MRP ₹ *</Label>
                <Input type="number" step="0.01" value={form.mrp} onChange={(e) => set("mrp", e.target.value)} placeholder="0.00" required />
              </div>
            </div>
            {margin && (
              <p className="text-xs text-green-600 font-medium">Margin: {margin}%</p>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-xl border border-gray-100">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Stock & Unit</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-gray-700">Opening Stock</Label>
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
                  <SelectContent>
                    {UNITS.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-gray-700">Expiry Date (optional)</Label>
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
            {loading ? "Adding..." : "Add Product"}
          </Button>
        </div>
      </form>
    </div>
  )
}
