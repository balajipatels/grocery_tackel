"use client"

import Sidebar from "./Sidebar"
import Header from "./Header"
import SessionProvider from "@/components/providers/SessionProvider"

interface ShellProps {
  children: React.ReactNode
  title?: string
}

export default function Shell({ children, title }: ShellProps) {
  return (
    <SessionProvider>
      <div className="flex h-full min-h-screen">
        <Sidebar />
        <div className="flex-1 ml-60 flex flex-col min-h-screen">
          <Header title={title} />
          <main className="flex-1 pt-16 p-6">{children}</main>
        </div>
      </div>
    </SessionProvider>
  )
}
