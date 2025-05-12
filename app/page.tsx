"use client"

import { useEffect } from "react"
import TikTokFeed from "@/components/tiktok-feed"
import { useViewportHeight } from "@/hooks/use-viewport-height"

export default function Home() {
  // Use our custom hook to handle viewport height
  const { cssVarValue } = useViewportHeight()

  // Update CSS variable on component mount
  useEffect(() => {
    // Force a resize event to ensure the viewport height is calculated correctly
    window.dispatchEvent(new Event("resize"))
  }, [])

  return (
    <main className="flex mobile-full-height flex-col items-center justify-center bg-black">
      <div className="w-full h-full flex items-center justify-center">
        <TikTokFeed />
      </div>
    </main>
  )
}
