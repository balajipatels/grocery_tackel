"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Plus, Edit2, Trash2, Coffee, ShoppingBasket } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

type Category = {
  id: string; name: string; cgstPercent: number; sgstPercent: number
  isQuickService: boolean; colorHex: string; _count: { products: number }
}

const DEFAULT_COLORS = ["#1B4332", "#0F6E56", "#185FA5", "#BA7517", "#993556", "#534AB7", "#D85A30"]

function CategoryDialog({
  open, onClose, existing,
}: { open: boolean; onClose: () => void; existing?: Category | null }) {
  const qc = useQueryClient()
  const [form, setForm] = useState({
    name: existing?.name || "",
    cgstPercent: String(existing?.cgstPercent ?? 0),
    sgstPercent: String(existing?.sgstPercent ?? 0),
    isQuickService: existing?.isQuickService ?? false,
    colorHex: existing?.colorHex || DEFAULT_COLORS[0],
  })

  const mutation = useMutation({
    mutationFn: () => {
      const url = existing ? `/api/categories/${existing.id}` : "/api/categories"
      return fetch(url, {
        method: existing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, cgstPercent: parseFloat(form.cgstPercent), sgstPercent: parseFloat(form.sgstPercent) }),
      }).then((r) => r.json())
    },
    onSuccess: (data) => {
      if (data.error) { toast.error(data.error); return }
      toast.success(existing ? "Category updated" : "Category created")
      qc.invalidateQueries({ queryKey: ["categories"] })
      onClose()
    },
    onError: () => toast.error("Failed to save category"),
  })

  const set = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }))

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{existing ? "Edit Category" : "Add Category"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Category Name *</Label>
            <Input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Grocery" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">CGST %</Label>
              <Input type="number" step="0.5" value={form.cgstPercent} onChange={(e) => set("cgstPercent", e.target.value)} min="0" max="28" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">SGST %</Label>
              <Input type="number" step="0.5" value={form.sgstPercent} onChange={(e) => set("sgstPercent", e.target.value)} min="0" max="28" />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-medium">Color</Label>
            <div className="flex gap-2 flex-wrap">
              {DEFAULT_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => set("colorHex", c)}
                  className={`w-7 h-7 rounded-full transition-all ${form.colorHex === c ? "ring-2 ring-offset-2 ring-gray-400 scale-110" : ""}`}
                  style={{ backgroundColor: c }}
                />
              ))}
              <Input
                type="color"
                value={form.colorHex}
                onChange={(e) => set("colorHex", e.target.value)}
                className="w-7 h-7 p-0 border-0 rounded-full cursor-pointer"
              />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-xs font-medium">Quick Service</Label>
              <p className="text-xs text-gray-500">For Tea, Buns etc.</p>
            </div>
            <Switch checked={form.isQuickService} onCheckedChange={(v) => set("isQuickService", v)} />
          </div>
          <div className="flex gap-2 pt-1">
            <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
            <Button onClick={() => mutation.mutate()} disabled={!form.name || mutation.isPending} className="flex-1 bg-[#1B4332] hover:bg-[#0F6E56] text-white">
              {mutation.isPending ? "Saving..." : existing ? "Update" : "Create"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default function CategoriesPage() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editCategory, setEditCategory] = useState<Category | null>(null)
  const qc = useQueryClient()

  const { data: categories, isLoading } = useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: () => fetch("/api/categories").then((r) => r.json()),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => fetch(`/api/categories/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      toast.success("Category deleted")
      qc.invalidateQueries({ queryKey: ["categories"] })
    },
    onError: () => toast.error("Cannot delete category with products"),
  })

  const openEdit = (cat: Category) => { setEditCategory(cat); setDialogOpen(true) }
  const openAdd = () => { setEditCategory(null); setDialogOpen(true) }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#1A1A2E]">Categories</h2>
          <p className="text-sm text-gray-500 mt-0.5">Manage product categories and GST rates</p>
        </div>
        <Button onClick={openAdd} size="sm" className="bg-[#1B4332] hover:bg-[#0F6E56] text-white">
          <Plus className="w-4 h-4 mr-1.5" /> Add Category
        </Button>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50/80">
              <TableHead className="text-xs font-semibold text-gray-600">Name</TableHead>
              <TableHead className="text-xs font-semibold text-gray-600">CGST %</TableHead>
              <TableHead className="text-xs font-semibold text-gray-600">SGST %</TableHead>
              <TableHead className="text-xs font-semibold text-gray-600">Total GST</TableHead>
              <TableHead className="text-xs font-semibold text-gray-600">Type</TableHead>
              <TableHead className="text-xs font-semibold text-gray-600">Products</TableHead>
              <TableHead className="text-xs font-semibold text-gray-600 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 7 }).map((_, j) => (
                    <TableCell key={j}><div className="h-4 bg-gray-100 rounded animate-pulse" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : categories?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-gray-400 text-sm">
                  No categories yet. Add one to get started.
                </TableCell>
              </TableRow>
            ) : (
              categories?.map((cat) => (
                <TableRow key={cat.id} className="hover:bg-gray-50/50 transition-colors">
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: cat.colorHex }} />
                      <span className="font-medium text-sm text-[#1A1A2E]">{cat.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{cat.cgstPercent}%</TableCell>
                  <TableCell className="text-sm">{cat.sgstPercent}%</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {(cat.cgstPercent + cat.sgstPercent).toFixed(1)}%
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {cat.isQuickService ? (
                      <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-xs gap-1">
                        <Coffee className="w-3 h-3" /> Quick Service
                      </Badge>
                    ) : (
                      <Badge className="bg-green-100 text-green-700 border-green-200 text-xs gap-1">
                        <ShoppingBasket className="w-3 h-3" /> Grocery
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">{cat._count?.products || 0}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" className="w-7 h-7" onClick={() => openEdit(cat)}>
                        <Edit2 className="w-3.5 h-3.5 text-gray-500" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-7 h-7"
                        onClick={() => deleteMutation.mutate(cat.id)}
                        disabled={(cat._count?.products || 0) > 0}
                      >
                        <Trash2 className="w-3.5 h-3.5 text-gray-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <CategoryDialog open={dialogOpen} onClose={() => setDialogOpen(false)} existing={editCategory} />
    </div>
  )
}
