"use client"

export const dynamic = 'force-dynamic'

import { useState } from "react"
import { useSession } from "next-auth/react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { User, Mail, Shield, IdCard } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

const ROLE_COLORS: Record<string, string> = {
  ADMIN: "bg-red-100 text-red-700",
  STAFF: "bg-blue-100 text-blue-700",
  VENDOR: "bg-purple-100 text-purple-700",
  INVESTOR: "bg-green-100 text-green-700",
}

export default function ProfilePage() {
  const sessionData = useSession()
  const session = sessionData?.data
  const status = sessionData?.status
  const update = sessionData?.update
  const qc = useQueryClient()
  const [nickname, setNickname] = useState((session?.user as any)?.nickname || "")
  const [editing, setEditing] = useState(false)

  if (!sessionData || status === "loading") {
    return <div className="flex items-center justify-center h-96">Loading...</div>
  }

  if (!session) {
    return <div className="flex items-center justify-center h-96">Please log in to view your profile</div>
  }

  const updateMutation = useMutation({
    mutationFn: (data: { nickname: string }) =>
      fetch("/api/users/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then(r => r.json()),
    onSuccess: (data) => {
      if (data.error) { toast.error(data.error); return }
      toast.success("Profile updated")
      update()
      setEditing(false)
    },
    onError: () => toast.error("Failed to update profile"),
  })

  const handleSave = () => {
    if (!nickname.trim()) {
      toast.error("Nickname cannot be empty")
      return
    }
    updateMutation.mutate({ nickname: nickname.trim() })
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-bold text-[#1A1A2E]">My Profile</h2>
        <p className="text-sm text-gray-500 mt-0.5">Manage your account information</p>
      </div>

      <Card className="rounded-xl border border-gray-100">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Account Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-start gap-4">
            {(session?.user as any)?.image ? (
              <img 
                src={(session?.user as any)?.image} 
                alt="Profile" 
                className="w-20 h-20 rounded-full border-2 border-gray-200"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-[#1B4332] flex items-center justify-center text-white font-bold text-2xl">
                {session?.user?.name?.charAt(0) || "U"}
              </div>
            )}
            <div className="flex-1">
              <p className="text-xs text-gray-500 mb-1">Profile Photo</p>
              <p className="text-sm text-gray-600">Synced from Google Account</p>
            </div>
          </div>

          <div className="grid gap-4">
            <div>
              <Label className="text-xs text-gray-500 mb-1">Full Name</Label>
              <div className="flex items-center gap-2 mt-1">
                <User className="w-4 h-4 text-gray-400" />
                <span className="text-sm font-medium">{session?.user?.name || "—"}</span>
              </div>
            </div>

            <div>
              <Label className="text-xs text-gray-500 mb-1">Email</Label>
              <div className="flex items-center gap-2 mt-1">
                <Mail className="w-4 h-4 text-gray-400" />
                <span className="text-sm font-medium">{session?.user?.email}</span>
              </div>
            </div>

            <div>
              <Label className="text-xs text-gray-500 mb-1">Role</Label>
              <div className="flex items-center gap-2 mt-1">
                <Shield className="w-4 h-4 text-gray-400" />
                <Badge className={`text-xs ${ROLE_COLORS[(session?.user as any)?.role] || ""}`}>
                  {(session?.user as any)?.role || "USER"}
                </Badge>
              </div>
            </div>

            {(session?.user as any)?.staffId && (
              <div>
                <Label className="text-xs text-gray-500 mb-1">Staff ID</Label>
                <div className="flex items-center gap-2 mt-1">
                  <IdCard className="w-4 h-4 text-gray-400" />
                  <span className="text-sm font-mono font-medium">{(session?.user as any)?.staffId}</span>
                </div>
              </div>
            )}

            <div>
              <Label className="text-xs text-gray-500 mb-2">Nickname</Label>
              {editing ? (
                <div className="space-y-2">
                  <Input 
                    value={nickname} 
                    onChange={(e) => setNickname(e.target.value)}
                    placeholder="Enter nickname"
                    className="text-sm"
                  />
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      onClick={handleSave}
                      disabled={updateMutation.isPending}
                      className="bg-[#1B4332] hover:bg-[#0F6E56] text-white"
                    >
                      {updateMutation.isPending ? "Saving..." : "Save"}
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => {
                        setEditing(false)
                        setNickname((session?.user as any)?.nickname || "")
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{(session?.user as any)?.nickname || "Not set"}</span>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => setEditing(true)}
                    className="text-xs"
                  >
                    Edit
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
