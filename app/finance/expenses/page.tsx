"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { formatINR, formatDate } from "@/lib/format"

type Expense = { id: string; category: string; amount: number; description: string; date: string }

const CATEGORIES = ["RENT", "ADVANCE", "UTILITIES", "SALARIES", "MAINTENANCE", "OTHER"]
const CATEGORY_COLORS: Record<string, string> = {
  RENT: "bg-blue-100 text-blue-700",
  ADVANCE: "bg-purple-100 text-purple-700",
  UTILITIES: "bg-amber-100 text-amber-700",
  SALARIES: "bg-green-100 text-green-700",
  MAINTENANCE: "bg-orange-100 text-orange-700",
  OTHER: "bg-gray-100 text-gray-700",
}

function AddExpenseDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const qc = useQueryClient()
  const [form, setForm] = useState({ category: "OTHER", amount: "", description: "", date: new Date().toISOString().split("T")[0] })

  const mutation = useMutation({
    mutationFn: () =>
      fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      }).then((r) => r.json()),
    onSuccess: (data) => {
      if (data.error) { toast.error(data.error); return }
      toast.success("Expense added")
      qc.invalidateQueries({ queryKey: ["expenses"] })
      onClose()
      setForm({ category: "OTHER", amount: "", description: "", date: new Date().toISOString().split("T")[0] })
    },
    onError: () => toast.error("Failed to add expense"),
  })

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Add Expense</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Category</Label>
            <Select value={form.category} onValueChange={(v) => setForm((f) => ({ ...f, category: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c.charAt(0) + c.slice(1).toLowerCase()}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Amount ₹</Label>
            <Input type="number" value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} placeholder="0" min="0" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Description</Label>
            <Input value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="e.g. Monthly rent for April" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Date</Label>
            <Input type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} />
          </div>
          <div className="flex gap-2 pt-1">
            <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
            <Button
              onClick={() => mutation.mutate()}
              disabled={!form.amount || !form.description || mutation.isPending}
              className="flex-1 bg-[#1B4332] hover:bg-[#0F6E56] text-white"
            >
              {mutation.isPending ? "Adding..." : "Add Expense"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default function ExpensesPage() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const qc = useQueryClient()

  const { data: expenses, isLoading } = useQuery<Expense[]>({
    queryKey: ["expenses"],
    queryFn: () => fetch("/api/expenses").then((r) => r.json()),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => fetch(`/api/expenses?id=${id}`, { method: "DELETE" }),
    onSuccess: () => {
      toast.success("Expense deleted")
      qc.invalidateQueries({ queryKey: ["expenses"] })
    },
  })

  const total = expenses?.reduce((s, e) => s + e.amount, 0) || 0

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#1A1A2E]">Expenses</h2>
          <p className="text-sm text-gray-500 mt-0.5">Total: {formatINR(total)}</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} size="sm" className="bg-[#1B4332] hover:bg-[#0F6E56] text-white">
          <Plus className="w-4 h-4 mr-1.5" /> Add Expense
        </Button>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50/80">
              <TableHead className="text-xs font-semibold text-gray-600">Date</TableHead>
              <TableHead className="text-xs font-semibold text-gray-600">Category</TableHead>
              <TableHead className="text-xs font-semibold text-gray-600">Description</TableHead>
              <TableHead className="text-xs font-semibold text-gray-600 text-right">Amount</TableHead>
              <TableHead className="text-xs font-semibold text-gray-600 text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 5 }).map((_, j) => (
                    <TableCell key={j}><div className="h-4 bg-gray-100 rounded animate-pulse" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : !expenses?.length ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12 text-gray-400 text-sm">No expenses recorded</TableCell>
              </TableRow>
            ) : (
              expenses.map((exp) => (
                <TableRow key={exp.id} className="hover:bg-gray-50/50 transition-colors">
                  <TableCell className="text-sm">{formatDate(exp.date)}</TableCell>
                  <TableCell>
                    <Badge className={`text-xs ${CATEGORY_COLORS[exp.category] || ""}`}>
                      {exp.category.charAt(0) + exp.category.slice(1).toLowerCase()}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">{exp.description}</TableCell>
                  <TableCell className="text-sm font-semibold text-right">{formatINR(exp.amount)}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" className="w-7 h-7" onClick={() => deleteMutation.mutate(exp.id)}>
                      <Trash2 className="w-3.5 h-3.5 text-red-400" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <AddExpenseDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />
    </div>
  )
}
