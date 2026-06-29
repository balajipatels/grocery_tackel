import SessionProvider from "@/components/providers/SessionProvider"

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>
}
