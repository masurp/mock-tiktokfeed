"use client"

import type React from "react"

import { useRef, useEffect, useState } from "react"
import Image from "next/image"
import { Loader2, Volume2, VolumeX } from "lucide-react"

interface MediaPostProps {
  mediaUrl: string
  mediaType: "video" | "image"
  username: string
  caption: string
  isActive: boolean
}

export default function MediaPost({ mediaUrl, mediaType, username, caption, isActive }: MediaPostProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isMuted, setIsMuted] = useState(false)

  useEffect(() => {
    if (mediaType === "video" && videoRef.current) {
      if (isActive) {
        setIsLoading(true)
        // Use a small timeout to ensure the video plays after it's visible
        const playPromise = videoRef.current.play()

        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              setIsLoading(false)
            })
            .catch((error) => {
              console.error("Video play failed:", error)
              setError("Failed to play video. Tap to try again.")
              // Try again with user interaction simulation
              document.addEventListener(
                "click",
                function playVideo() {
                  if (videoRef.current) {
                    videoRef.current
                      .play()
                      .then(() => setIsLoading(false))
                      .catch(() => setError("Could not play video."))
                  }
                  document.removeEventListener("click", playVideo)
                },
                { once: true },
              )
            })
        }
      } else {
        videoRef.current.pause()
        videoRef.current.currentTime = 0
      }
    }
  }, [isActive, mediaType])

  const handleVideoLoad = () => {
    setIsLoading(false)
  }

  const handleImageLoad = () => {
    setIsLoading(false)
  }

  const handleError = () => {
    setIsLoading(false)
    setError("Failed to load media")
  }

  const toggleSound = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsMuted(!isMuted)

    // If we're unmuting and the video is active, ensure it's playing
    if (isMuted && isActive && videoRef.current) {
      videoRef.current.play().catch((err) => {
        console.error("Could not play video with sound:", err)
        // If autoplay with sound fails, keep it muted
        setIsMuted(true)
      })
    }
  }

  return (
    <div className="relative h-full w-full bg-black">
      {mediaType === "video" ? (
        <>
          <video
            ref={videoRef}
            src={mediaUrl}
            className="h-full w-full object-cover"
            loop
            muted={isMuted}
            playsInline
            autoPlay={isActive}
            preload="auto"
            onLoadedData={handleVideoLoad}
            onError={handleError}
          />
          {isLoading && isActive && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <Loader2 className="h-12 w-12 text-white animate-spin" />
            </div>
          )}
        </>
      ) : (
        <div className="h-full w-full relative">
          <Image
            src={mediaUrl || "/placeholder.svg"}
            alt={caption}
            fill
            className="object-cover"
            priority={isActive}
            onLoad={handleImageLoad}
            onError={handleError}
          />
          {isLoading && isActive && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <Loader2 className="h-12 w-12 text-white animate-spin" />
            </div>
          )}
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/70">
          <div className="text-center p-4">
            <p className="text-white text-lg mb-2">{error}</p>
            <button
              className="bg-primary text-white px-4 py-2 rounded-full"
              onClick={() => {
                setError(null)
                if (videoRef.current) videoRef.current.play()
              }}
            >
              Try Again
            </button>
          </div>
        </div>
      )}

      {/* Media overlay gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/70" />

      {/* User info and caption - moved closer to the bottom */}
      <div className="absolute bottom-6 left-6 right-16 z-10">
        <div className="text-white font-bold text-lg drop-shadow-md">{username}</div>
        <p className="text-white text-sm mt-1 drop-shadow-md">{caption}</p>
      </div>

      {/* Sound control button - only for videos */}
      {mediaType === "video" && (
        <button
          onClick={toggleSound}
          className="absolute top-6 left-6 z-20 bg-black/60 backdrop-blur-sm p-2 rounded-full"
          aria-label={isMuted ? "Unmute" : "Mute"}
        >
          {isMuted ? <VolumeX size={20} className="text-white" /> : <Volume2 size={20} className="text-white" />}
        </button>
      )}
    </div>
  )
}
