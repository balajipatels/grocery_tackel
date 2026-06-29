"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { useSession } from "next-auth/react"
import { User, Shield, Bell, Database } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"

type User_ = { id: string; name?: string; email: string; role: string; createdAt: string }

const ROLE_STYLES: Record<string, string> = {
  ADMIN: "bg-red-100 text-red-700",
  STAFF: "bg-blue-100 text-blue-700",
  INVESTOR: "bg-green-100 text-green-700",
}

export default function SettingsPage() {
  const { data: session } = useSession()
  const qc = useQueryClient()
  const isAdmin = (session?.user as any)?.role === "ADMIN"

  const { data: users, isLoading } = useQuery<User_[]>({
    queryKey: ["users"],
    queryFn: () => fetch("/api/users").then((r) => r.json()),
    enabled: isAdmin,
  })

  const updateRoleMutation = useMutation({
    mutationFn: ({ id, role }: { id: string; role: string }) =>
      fetch("/api/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, role }),
      }).then((r) => r.json()),
    onSuccess: (data) => {
      if (data.error) { toast.error(data.error); return }
      toast.success("Role updated")
      qc.invalidateQueries({ queryKey: ["users"] })
    },
    onError: () => toast.error("Failed to update role"),
  })

  const shopName = process.env.NEXT_PUBLIC_SHOP_NAME || "My Grocery Store"

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-bold text-[#1A1A2E]">Settings</h2>
        <p className="text-sm text-gray-500 mt-0.5">Manage your store settings and user roles</p>
      </div>

      {/* Shop Info */}
      <Card className="rounded-xl border border-gray-100">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-[#1B4332]" />
            <CardTitle className="text-sm font-semibold">Store Information</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500 text-xs mb-0.5">Shop Name</p>
              <p className="font-medium">{process.env.NEXT_PUBLIC_SHOP_NAME || "Not configured"}</p>
            </div>
            <div>
              <p className="text-gray-500 text-xs mb-0.5">GSTIN</p>
              <p className="font-medium font-mono">{process.env.NEXT_PUBLIC_SHOP_GSTIN || "Not configured"}</p>
            </div>
            <div>
              <p className="text-gray-500 text-xs mb-0.5">Address</p>
              <p className="font-medium">{process.env.NEXT_PUBLIC_SHOP_ADDRESS || "Not configured"}</p>
            </div>
            <div>
              <p className="text-gray-500 text-xs mb-0.5">Phone</p>
              <p className="font-medium">{process.env.NEXT_PUBLIC_SHOP_PHONE || "Not configured"}</p>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-2">
            Update these values in your <code className="bg-gray-100 px-1 rounded">.env.local</code> file.
          </p>
        </CardContent>
      </Card>

      {/* Current User */}
      <Card className="rounded-xl border border-gray-100">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-[#1B4332]" />
            <CardTitle className="text-sm font-semibold">My Account</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            {(session?.user as any)?.image ? (
              <img src={(session?.user as any)?.image} alt="avatar" className="w-12 h-12 rounded-full" />
            ) : (
              <div className="w-12 h-12 rounded-full bg-[#1B4332] flex items-center justify-center text-white font-bold text-lg">
                {session?.user?.name?.charAt(0) || "U"}
              </div>
            )}
            <div>
              <p className="font-semibold text-[#1A1A2E]">{session?.user?.name}</p>
              <p className="text-sm text-gray-500">{session?.user?.email}</p>
              <Badge className={`mt-1 text-xs ${ROLE_STYLES[(session?.user as any)?.role] || ""}`}>
                {(session?.user as any)?.role || "USER"}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* User Management (Admin only) */}
      {isAdmin && (
        <Card className="rounded-xl border border-gray-100">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#1B4332]" />
              <CardTitle className="text-sm font-semibold">User Management</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/80">
                  <TableHead className="text-xs font-semibold text-gray-600">User</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-600">Email</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-600">Current Role</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-600">Change Role</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 4 }).map((_, j) => (
                        <TableCell key={j}><div className="h-4 bg-gray-100 rounded animate-pulse" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : users?.map((user) => (
                  <TableRow key={user.id} className="hover:bg-gray-50/50">
                    <TableCell className="font-medium text-sm">{user.name || "—"}</TableCell>
                    <TableCell className="text-sm text-gray-500">{user.email}</TableCell>
                    <TableCell>
                      <Badge className={`text-xs ${ROLE_STYLES[user.role] || ""}`}>{user.role}</Badge>
                    </TableCell>
                    <TableCell>
                      {user.id !== (session?.user as any)?.id ? (
                        <Select
                          value={user.role}
                          onValueChange={(role) => updateRoleMutation.mutate({ id: user.id, role })}
                        >
                          <SelectTrigger className="w-32 h-7 text-xs border-gray-200">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ADMIN">Admin</SelectItem>
                            <SelectItem value="STAFF">Staff</SelectItem>
                            <SelectItem value="INVESTOR">Investor</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <span className="text-xs text-gray-400">You</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Features Status */}
      <Card className="rounded-xl border border-gray-100">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-[#1B4332]" />
            <CardTitle className="text-sm font-semibold">Feature Configuration</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2.5">
            {[
              { label: "AI Suggestions (Anthropic Claude)", enabled: !!process.env.NEXT_PUBLIC_AI_ENABLED, key: "ANTHROPIC_API_KEY" },
              { label: "Redis Caching (Upstash)", enabled: !!process.env.NEXT_PUBLIC_REDIS_ENABLED, key: "UPSTASH_REDIS_REST_URL" },
              { label: "Email Notifications (Resend)", enabled: false, key: "RESEND_API_KEY" },
              { label: "File Uploads (UploadThing)", enabled: false, key: "UPLOADTHING_TOKEN" },
            ].map(({ label, enabled, key }) => (
              <div key={key} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div>
                  <p className="text-sm font-medium text-[#1A1A2E]">{label}</p>
                  <p className="text-xs text-gray-400">Env: {key}</p>
                </div>
                <Badge className={enabled ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}>
                  {enabled ? "Configured" : "Not configured"}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
