"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"
import { getFirebaseApp } from "@/lib/firebase"

export default function FirebaseAnalytics() {
  const pathname = usePathname()

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID) return

    import("firebase/analytics").then(async ({ getAnalytics, logEvent, isSupported }) => {
      const supported = await isSupported()
      if (!supported) return
      const analytics = getAnalytics(getFirebaseApp())
      logEvent(analytics, "page_view", { page_path: pathname })
    })
  }, [pathname])

  return null
}
