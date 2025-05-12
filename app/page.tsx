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

  useEffect(() => {
    // Function to help with mobile autoplay
    const enableAutoplay = () => {
      // Create a silent audio element and play it to enable autoplay
      const audio = new Audio()
      audio.src =
        "data:audio/mpeg;base64,SUQzBAAAAAABEVRYWFgAAAAtAAADY29tbWVudABCaWdTb3VuZEJhbmsuY29tIC8gTGFTb25vdGhlcXVlLm9yZwBURU5DAAAAHQAAA1N3aXRjaCBQbHVzIMKpIE5DSCBTb2Z0d2FyZQBUSVQyAAAABgAAAzIyMzUAVFNTRQAAAA8AAANMYXZmNTcuODMuMTAwAAAAAAAAAAAAAAD/80DEAAAAA0gAAAAATEFNRTMuMTAwVVVVVVVVVVVVVUxBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/zQsRbAAADSAAAAABVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/zQMSkAAADSAAAAABVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV"
      audio.load()
      audio.volume = 0.01 // Very low volume
      audio.play().catch(() => {
        // Ignore errors - this is just to enable autoplay
      })
    }

    // Try to enable autoplay on page load
    enableAutoplay()

    // Also try on first user interaction
    const handleFirstInteraction = () => {
      enableAutoplay()
      document.removeEventListener("click", handleFirstInteraction)
      document.removeEventListener("touchstart", handleFirstInteraction)
    }

    document.addEventListener("click", handleFirstInteraction)
    document.addEventListener("touchstart", handleFirstInteraction)

    return () => {
      document.removeEventListener("click", handleFirstInteraction)
      document.removeEventListener("touchstart", handleFirstInteraction)
    }
  }, [])

  return (
    <main className="flex mobile-full-height flex-col items-center justify-center bg-black">
      <div className="w-full h-full flex items-center justify-center">
        <TikTokFeed />
      </div>
    </main>
  )
}
