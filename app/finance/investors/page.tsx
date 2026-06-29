"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { Plus, Edit2, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatINR, formatDate, formatPercent } from "@/lib/format"

type Investor = {
  id: string; displayName: string; investedAmount: number; colorTag: string
  isActive: boolean; investmentDate: string; notes?: string
  user: { name?: string; email: string; image?: string }
}
type User = { id: string; name?: string; email: string }

const COLORS = ["#1D9E75", "#378ADD", "#BA7517", "#993556", "#534AB7", "#D85A30", "#0F6E56", "#185FA5"]

function InvestorDialog({ open, onClose, existing }: { open: boolean; onClose: () => void; existing?: Investor | null }) {
  const qc = useQueryClient()
  const { data: users } = useQuery<User[]>({ queryKey: ["users"], queryFn: () => fetch("/api/users").then((r) => r.json()) })
  const [form, setForm] = useState({
    userId: existing?.user ? "" : "",
    displayName: existing?.displayName || "",
    investedAmount: String(existing?.investedAmount || ""),
    investmentDate: existing?.investmentDate ? existing.investmentDate.split("T")[0] : new Date().toISOString().split("T")[0],
    colorTag: existing?.colorTag || COLORS[0],
    notes: existing?.notes || "",
    isActive: existing?.isActive ?? true,
  })

  const mutation = useMutation({
    mutationFn: () => {
      const url = existing ? `/api/investors/${existing.id}` : "/api/investors"
      return fetch(url, {
        method: existing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, investedAmount: parseFloat(form.investedAmount) }),
      }).then((r) => r.json())
    },
    onSuccess: (data) => {
      if (data.error) { toast.error(data.error); return }
      toast.success(existing ? "Investor updated" : "Investor added")
      qc.invalidateQueries({ queryKey: ["investors"] })
      onClose()
    },
    onError: () => toast.error("Failed to save investor"),
  })

  const set = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }))

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{existing ? "Edit Investor" : "Add Investor"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          {!existing && (
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Link User Account *</Label>
              <Select value={form.userId} onValueChange={(v) => set("userId", v)}>
                <SelectTrigger><SelectValue placeholder="Select user" /></SelectTrigger>
                <SelectContent>
                  {users?.map((u) => <SelectItem key={u.id} value={u.id}>{u.name || u.email} ({u.email})</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Display Name *</Label>
            <Input value={form.displayName} onChange={(e) => set("displayName", e.target.value)} placeholder="e.g. Ravi Kumar" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Invested Amount ₹ *</Label>
              <Input type="number" value={form.investedAmount} onChange={(e) => set("investedAmount", e.target.value)} placeholder="500000" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Investment Date *</Label>
              <Input type="date" value={form.investmentDate} onChange={(e) => set("investmentDate", e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-medium">Color Tag</Label>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map((c) => (
                <button key={c} type="button" onClick={() => set("colorTag", c)}
                  className={`w-7 h-7 rounded-full transition-all ${form.colorTag === c ? "ring-2 ring-offset-2 ring-gray-400 scale-110" : ""}`}
                  style={{ backgroundColor: c }} />
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Notes</Label>
            <Input value={form.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Optional notes..." />
          </div>
          {existing && (
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium">Active Investor</Label>
              <Switch checked={form.isActive} onCheckedChange={(v) => set("isActive", v)} />
            </div>
          )}
          <div className="flex gap-2 pt-1">
            <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
            <Button
              onClick={() => mutation.mutate()}
              disabled={!form.displayName || !form.investedAmount || (!existing && !form.userId) || mutation.isPending}
              className="flex-1 bg-[#1B4332] hover:bg-[#0F6E56] text-white"
            >
              {mutation.isPending ? "Saving..." : existing ? "Update" : "Add Investor"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default function InvestorsPage() {
  const { data: session } = useSession()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editInvestor, setEditInvestor] = useState<Investor | null>(null)

  const isAdmin = (session?.user as any)?.role === "ADMIN"

  const { data: investors, isLoading } = useQuery<Investor[]>({
    queryKey: ["investors"],
    queryFn: () => fetch("/api/investors").then((r) => r.json()),
  })

  const totalInvestment = investors?.reduce((s, i) => s + i.investedAmount, 0) || 0

  const openEdit = (inv: Investor) => { setEditInvestor(inv); setDialogOpen(true) }
  const openAdd = () => { setEditInvestor(null); setDialogOpen(true) }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#1A1A2E]">Investors</h2>
          <p className="text-sm text-gray-500 mt-0.5">Total invested: {formatINR(totalInvestment)}</p>
        </div>
        {isAdmin && (
          <Button onClick={openAdd} size="sm" className="bg-[#1B4332] hover:bg-[#0F6E56] text-white">
            <Plus className="w-4 h-4 mr-1.5" /> Add Investor
          </Button>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50/80">
              <TableHead className="text-xs font-semibold text-gray-600">Investor</TableHead>
              <TableHead className="text-xs font-semibold text-gray-600">Email</TableHead>
              <TableHead className="text-xs font-semibold text-gray-600 text-right">Invested</TableHead>
              <TableHead className="text-xs font-semibold text-gray-600 text-right">Share %</TableHead>
              <TableHead className="text-xs font-semibold text-gray-600">Since</TableHead>
              <TableHead className="text-xs font-semibold text-gray-600">Status</TableHead>
              <TableHead className="text-xs font-semibold text-gray-600 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>{Array.from({ length: 7 }).map((_, j) => (
                  <TableCell key={j}><div className="h-4 bg-gray-100 rounded animate-pulse" /></TableCell>
                ))}</TableRow>
              ))
            ) : !investors?.length ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-gray-400 text-sm">
                  No investors added yet.
                </TableCell>
              </TableRow>
            ) : (
              investors.map((inv) => {
                const sharePercent = totalInvestment > 0 ? (inv.investedAmount / totalInvestment) * 100 : 0
                return (
                  <TableRow key={inv.id} className="hover:bg-gray-50/50 transition-colors">
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: inv.colorTag }} />
                        <span className="font-medium text-sm text-[#1A1A2E]">{inv.displayName}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">{inv.user?.email}</TableCell>
                    <TableCell className="text-sm font-medium text-right">{formatINR(inv.investedAmount)}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant="outline" className="text-xs">{formatPercent(sharePercent)}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">{formatDate(inv.investmentDate)}</TableCell>
                    <TableCell>
                      <Badge className={inv.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}>
                        {inv.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link href={`/finance/investors/${inv.id}`}>
                          <Button variant="ghost" size="icon" className="w-7 h-7">
                            <TrendingUp className="w-3.5 h-3.5 text-[#1B4332]" />
                          </Button>
                        </Link>
                        {isAdmin && (
                          <Button variant="ghost" size="icon" className="w-7 h-7" onClick={() => openEdit(inv)}>
                            <Edit2 className="w-3.5 h-3.5 text-gray-500" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      <InvestorDialog open={dialogOpen} onClose={() => setDialogOpen(false)} existing={editInvestor} />
    </div>
  )
}
