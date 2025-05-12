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
  isMuted: boolean
  onMuteChange: (muted: boolean) => void
  userInteracted: boolean
}

export default function MediaPost({
  mediaUrl,
  mediaType,
  username,
  caption,
  isActive,
  isMuted,
  onMuteChange,
  userInteracted,
}: MediaPostProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  // Add a ref to track the play promise
  const playPromiseRef = useRef<Promise<void> | null>(null)
  // Track retry attempts
  const [retryCount, setRetryCount] = useState(0)
  const maxRetries = 3

  // Function to safely play video with retries and fallbacks
  const playVideo = async () => {
    if (!videoRef.current) return Promise.reject(new Error("No video element"))

    try {
      setIsLoading(true)
      setError(null)

      // First, ensure video is visible in the viewport
      if (isActive) {
        // Force low-level play attempt with timeout
        const playAttempt = new Promise<void>((resolve, reject) => {
          // Set a timeout in case play hangs
          const timeoutId = setTimeout(() => {
            reject(new Error("Play attempt timed out"))
          }, 2000)

          // Attempt to play
          playPromiseRef.current = videoRef.current.play()
          playPromiseRef.current
            .then(() => {
              clearTimeout(timeoutId)
              resolve()
            })
            .catch((err) => {
              clearTimeout(timeoutId)
              reject(err)
            })
        })

        await playAttempt
        setIsLoading(false)
        setRetryCount(0) // Reset retry count on success
        playPromiseRef.current = null
        return Promise.resolve()
      }

      return Promise.reject(new Error("Video not active"))
    } catch (error) {
      console.error("Video play failed:", error)
      playPromiseRef.current = null

      // If we've tried less than max retries, try again with a delay
      if (retryCount < maxRetries) {
        setRetryCount((prev) => prev + 1)

        // Exponential backoff for retries
        const retryDelay = 300 * Math.pow(2, retryCount)

        return new Promise((resolve, reject) => {
          setTimeout(() => {
            if (videoRef.current && isActive) {
              // Force mute for retry (better autoplay success rate)
              videoRef.current.muted = true
              onMuteChange(true) // Update parent state to match

              // Try a different approach on later retries
              if (retryCount >= 2 && videoRef.current) {
                // Reset the video element completely
                videoRef.current.load()
                // Small delay after load
                setTimeout(() => {
                  if (videoRef.current) {
                    videoRef.current.play().then(resolve).catch(reject)
                  } else {
                    reject(new Error("Video element not available"))
                  }
                }, 100)
              } else {
                // Standard retry
                videoRef.current.play().then(resolve).catch(reject)
              }
            } else {
              reject(new Error("Video not active or not available"))
            }
          }, retryDelay)
        })
      } else {
        // If we've exceeded max retries, show error
        setError("Failed to play video. Tap to try again.")
        setIsLoading(false)
        return Promise.reject(error)
      }
    }
  }

  // Function to safely pause video
  const pauseVideo = async () => {
    if (!videoRef.current) return

    // Wait for any pending play operation to complete before pausing
    if (playPromiseRef.current) {
      try {
        await playPromiseRef.current
      } catch (e) {
        // Ignore errors from the play promise
      }
      playPromiseRef.current = null
    }

    // Now it's safe to pause
    videoRef.current.pause()
    videoRef.current.currentTime = 0
  }

  // Handle video playback when active state changes
  useEffect(() => {
    if (mediaType === "video" && videoRef.current) {
      if (isActive) {
        // Delay play attempt slightly to ensure DOM is ready
        const playTimer = setTimeout(() => {
          if (videoRef.current) {
            // Always start with muted for autoplay compatibility
            videoRef.current.muted = true

            // Attempt to play
            playVideo()
              .then(() => {
                // If user has interacted and video is supposed to be unmuted, try to unmute it
                if (userInteracted && !isMuted && videoRef.current) {
                  videoRef.current.muted = false
                } else if (videoRef.current.muted !== isMuted) {
                  // Otherwise ensure video muted state matches the expected state
                  videoRef.current.muted = isMuted
                }
              })
              .catch((error) => {
                console.error("Initial play failed:", error)
                // If play fails, ensure we're in muted state
                if (videoRef.current) {
                  videoRef.current.muted = true
                  onMuteChange(true)
                }
              })
          }
        }, 100)

        return () => clearTimeout(playTimer)
      } else {
        pauseVideo()
      }
    }
  }, [isActive, mediaType, userInteracted, isMuted, onMuteChange])

  // Preload videos for smoother experience
  useEffect(() => {
    if (mediaType === "video" && videoRef.current) {
      videoRef.current.load()
    }
  }, [mediaUrl, mediaType])

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

    // Get the new desired muted state (opposite of current)
    const newMutedState = !isMuted

    // Update parent state
    onMuteChange(newMutedState)

    // Update video element if it exists
    if (videoRef.current) {
      videoRef.current.muted = newMutedState

      // If we're unmuting and the video is active, ensure it's playing
      if (!newMutedState && isActive) {
        // Don't try to play if there's already a play promise pending
        if (!playPromiseRef.current) {
          videoRef.current.play().catch((err) => {
            console.error("Could not play video with sound:", err)
            // If autoplay with sound fails, revert to muted state
            if (videoRef.current) {
              videoRef.current.muted = true
              onMuteChange(true) // Update parent state to match
            }
          })
        }
      }
    }
  }

  const handleRetry = () => {
    setRetryCount(0) // Reset retry count
    setError(null)
    if (videoRef.current && !playPromiseRef.current) {
      playVideo()
    }
  }

  // Add this after the other useEffect hooks
  useEffect(() => {
    if (mediaType === "video" && videoRef.current && isActive) {
      // Create an intersection observer to detect when the video is visible
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting && videoRef.current && isActive) {
              // Video is visible in viewport, try to play it
              playVideo().catch((err) => console.error("Visibility play failed:", err))
              // Stop observing once we've detected visibility
              observer.disconnect()
            }
          })
        },
        { threshold: 0.1 }, // Trigger when at least 10% of the video is visible
      )

      // Start observing the video element
      observer.observe(videoRef.current)

      return () => {
        observer.disconnect()
      }
    }
  }, [isActive, mediaType])

  // Update video muted state when isMuted prop changes
  useEffect(() => {
    if (mediaType === "video" && videoRef.current) {
      videoRef.current.muted = isMuted
    }
  }, [isMuted, mediaType])

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
            preload="auto"
            onLoadedData={handleVideoLoad}
            onError={handleError}
            // Add poster for better perceived performance
            poster={mediaUrl + "?poster=true"}
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
            <button className="bg-primary text-white px-4 py-2 rounded-full" onClick={handleRetry}>
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
          className="absolute top-16 left-6 z-20 bg-black/60 backdrop-blur-sm p-2 rounded-full"
          aria-label={isMuted ? "Unmute" : "Mute"}
        >
          {isMuted ? <VolumeX size={20} className="text-white" /> : <Volume2 size={20} className="text-white" />}
        </button>
      )}
    </div>
  )
}
