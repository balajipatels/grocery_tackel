"use client"

import { useEffect, useState } from "react"
import { Bell, LogOut, User } from "lucide-react"
import { signOut, useSession } from "next-auth/react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { formatTimeAgo } from "@/lib/format"

type Notification = {
  id: string
  title: string
  message: string
  type: string
  isRead: boolean
  createdAt: string
}

export default function Header({ title }: { title?: string }) {
  const { data: session } = useSession()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications")
      if (res.ok) {
        const data = await res.json()
        setNotifications(data.slice(0, 10))
        setUnreadCount(data.filter((n: Notification) => !n.isRead).length)
      }
    } catch {}
  }

  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 60000)
    return () => clearInterval(interval)
  }, [])

  const markAllRead = async () => {
    await fetch("/api/notifications/mark-read", { method: "POST" })
    setUnreadCount(0)
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
  }

  const user = session?.user
  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "U"

  return (
    <header className="fixed top-0 left-60 right-0 h-16 bg-white border-b border-gray-100 flex items-center justify-between px-6 z-20">
      {title && <h1 className="text-lg font-semibold text-[#1A1A2E]">{title}</h1>}
      {!title && <div />}

      <div className="flex items-center gap-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="relative p-2 rounded-lg hover:bg-gray-100 transition-all duration-200">
              <Bell className="w-5 h-5 text-gray-600" />
              {unreadCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-[10px] bg-red-500 text-white border-white">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </Badge>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel className="flex items-center justify-between">
              <span>Notifications</span>
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-xs text-[#1B4332] hover:underline font-normal"
                >
                  Mark all read
                </button>
              )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {notifications.length === 0 ? (
              <div className="py-6 text-center text-sm text-gray-500">No notifications</div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`px-3 py-2.5 text-sm border-b border-gray-50 last:border-0 ${!n.isRead ? "bg-green-50/50" : ""}`}
                >
                  <div className="flex items-start gap-2">
                    <span
                      className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${
                        n.type === "LOW_STOCK"
                          ? "bg-red-500"
                          : n.type === "BILL_CREATED"
                            ? "bg-green-500"
                            : "bg-blue-500"
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-[#1A1A2E] truncate">{n.title}</p>
                      <p className="text-gray-500 text-xs mt-0.5 line-clamp-2">{n.message}</p>
                      <p className="text-gray-400 text-xs mt-1">{formatTimeAgo(n.createdAt)}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2.5 hover:bg-gray-100 rounded-lg px-2 py-1.5 transition-all duration-200">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.image || ""} />
                <AvatarFallback className="bg-[#1B4332] text-white text-xs font-medium">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="text-left hidden sm:block">
                <p className="text-sm font-medium text-[#1A1A2E] leading-tight">{user?.name || "User"}</p>
                <p className="text-xs text-gray-500 leading-tight capitalize">
                  {((user as any)?.role || "staff").toLowerCase()}
                </p>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel className="text-xs text-gray-500 font-normal">
              {user?.email}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <a href="/settings" className="cursor-pointer">
                <User className="w-4 h-4 mr-2" />
                Profile & Settings
              </a>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="text-red-600 cursor-pointer"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
