"use client"

import { useState, useEffect, useRef } from "react"
import {
  ChevronUp,
  ChevronDown,
  Search,
  Heart,
  MessageCircle,
  Bookmark,
  ArrowUpRight,
  Sparkles,
  Loader2,
} from "lucide-react"
import { useSwipeable } from "react-swipeable"
import MediaPost from "./media-post"
import EndCard from "./end-card"
import HeartAnimation from "./heart-animation"
import { useMobile } from "@/hooks/use-mobile"
import { useViewportHeight } from "@/hooks/use-viewport-height"
import { initTracking, trackEvent, startViewTracking } from "@/utils/tracking"

// Interface for our post data structure
interface Post {
  id: number
  mediaUrl: string
  mediaType: "video" | "image"
  username: string
  caption: string
  condition?: string
  filter?: string // "yes" or "no" for beauty filter
  likes?: number
  comments?: number
  saves?: number
  shares?: number
}

export default function TikTokFeed() {
  const [allPosts, setAllPosts] = useState<Post[]>([])
  const [filteredPosts, setFilteredPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isLiked, setIsLiked] = useState<boolean[]>([])
  const [isSaved, setIsSaved] = useState<boolean[]>([])
  // Store which video has an active heart animation
  const [animatingHeartForVideo, setAnimatingHeartForVideo] = useState<number | null>(null)
  // State to determine if beauty filter labels should be shown based on URL parameter
  const [showBeautyFilterLabels, setShowBeautyFilterLabels] = useState<boolean>(false)
  const [conditionValue, setConditionValue] = useState<string>("unknown")
  const [userId, setUserId] = useState<string>("unknown")
  const containerRef = useRef<HTMLDivElement>(null)
  const isMobile = useMobile()

  // Use our custom hook to handle viewport height
  const { getViewportHeightPercentage } = useViewportHeight()

  // Ref to store the cleanup function for view tracking
  const viewTrackingCleanupRef = useRef<(() => void) | null>(null)

  // Initialize tracking system
  useEffect(() => {
    initTracking()
  }, [])

  // Fisher-Yates shuffle algorithm for randomizing array order
  const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }

  // Fetch data from Google Sheets
  useEffect(() => {
    async function fetchSheetData() {
      try {
        setLoading(true)
        // Convert Google Sheet to CSV export URL
        const sheetId = "1B0435uEbQa0LENR__kj_oE5aSwty6QDAxiCE7TI5Eoc"
        const sheetUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=posts`

        const response = await fetch(sheetUrl)
        if (!response.ok) {
          throw new Error("Failed to fetch data from Google Sheets")
        }

        const csvText = await response.text()
        const parsedData = parseCSV(csvText)
        setAllPosts(parsedData)

        // Process URL parameters after data is loaded
        processUrlParameters(parsedData)

        setLoading(false)
      } catch (err) {
        console.error("Error fetching data:", err)
        setError(err instanceof Error ? err.message : "An unknown error occurred")
        setLoading(false)
      }
    }

    fetchSheetData()
  }, [])

  // Process URL parameters and filter posts accordingly
  const processUrlParameters = (posts: Post[]) => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search)
      const condParam = urlParams.get("cond") || ""
      const idParam = urlParams.get("id") || "unknown"

      setConditionValue(condParam)
      setUserId(idParam)

      // Parse condition parameter (format: "1a", "1b", "2a", etc.)
      const conditionNumber = condParam.match(/^\d+/)?.[0] || ""
      const conditionLetter = condParam.match(/[a-z]$/i)?.[0]?.toLowerCase() || ""

      console.log(`Condition number: ${conditionNumber}, letter: ${conditionLetter}`)
      console.log(`User ID: ${idParam}`)

      // Filter posts by condition number
      const postsForCondition = posts.filter((post) => post.condition === conditionNumber)

      // Randomize the order of the filtered posts
      const randomizedPosts = shuffleArray(postsForCondition)

      console.log(`Randomized ${randomizedPosts.length} posts for condition ${conditionNumber}`)

      // Determine whether to show beauty filter labels based on condition letter
      const shouldShowLabels = conditionLetter === "b"
      setShowBeautyFilterLabels(shouldShowLabels)

      console.log(`Showing beauty filter labels: ${shouldShowLabels}`)

      // Set filtered posts and initialize interaction states
      setFilteredPosts(randomizedPosts)
      setIsLiked(Array(randomizedPosts.length).fill(false))
      setIsSaved(Array(randomizedPosts.length).fill(false))

      // Track app_open event
      trackEvent({
        event: "app_open",
        userId: idParam,
        postId: 0,
        postOwner: "",
        timestamp: Date.now(),
      })
    }
  }

  // Parse CSV data from Google Sheets
  function parseCSV(csvText: string): Post[] {
    const lines = csvText.split("\n")
    const headers = lines[0].split(",").map((header) => header.trim().replace(/"/g, ""))

    return lines
      .slice(1)
      .map((line, index) => {
        // Handle commas within quoted strings
        const values: string[] = []
        let inQuotes = false
        let currentValue = ""

        for (let i = 0; i < line.length; i++) {
          const char = line[i]

          if (char === '"') {
            inQuotes = !inQuotes
          } else if (char === "," && !inQuotes) {
            values.push(currentValue)
            currentValue = ""
          } else {
            currentValue += char
          }
        }

        // Add the last value
        values.push(currentValue)

        // Clean up values (remove quotes)
        const cleanValues = values.map((val) => val.trim().replace(/"/g, ""))

        // Create a post object
        const post: Post = {
          id: Number.parseInt(cleanValues[headers.indexOf("id")] || (index + 1).toString()),
          mediaUrl: cleanValues[headers.indexOf("contentUrl")],
          mediaType: cleanValues[headers.indexOf("type")] as "video" | "image",
          username: cleanValues[headers.indexOf("username")],
          caption: cleanValues[headers.indexOf("caption")],
          condition: cleanValues[headers.indexOf("condition")],
          filter: cleanValues[headers.indexOf("filter")], // "yes" or "no"
          // Generate random engagement numbers if not provided
          likes: Math.floor(Math.random() * 10000) + 100,
          comments: Math.floor(Math.random() * 1000) + 50,
          saves: Math.floor(Math.random() * 500) + 20,
          shares: Math.floor(Math.random() * 300) + 10,
        }

        return post
      })
      .filter((post) => post.mediaUrl && post.username) // Filter out any rows with missing essential data
  }

  const goToNext = () => {
    // Check if we're at the last real post (one before the end card)
    const isLastRealPost = currentIndex === filteredPosts.length - 1

    // If we're at the last real post, track completion event
    if (isLastRealPost) {
      // End tracking for current post
      if (viewTrackingCleanupRef.current) {
        viewTrackingCleanupRef.current()
        viewTrackingCleanupRef.current = null
      }

      // Track feed completion event
      trackEvent({
        event: "feed_completed",
        userId,
        postId: 0,
        postOwner: "",
        timestamp: Date.now(),
      })

      // Move to the end card
      setCurrentIndex(currentIndex + 1)
    }
    // If we're not at the end yet, just go to the next post
    else if (currentIndex < filteredPosts.length) {
      // End tracking for current post
      if (viewTrackingCleanupRef.current) {
        viewTrackingCleanupRef.current()
        viewTrackingCleanupRef.current = null
      }

      setCurrentIndex(currentIndex + 1)
    }
  }

  const goToPrevious = () => {
    if (currentIndex > 0) {
      // End tracking for current post
      if (viewTrackingCleanupRef.current) {
        viewTrackingCleanupRef.current()
        viewTrackingCleanupRef.current = null
      }

      setCurrentIndex(currentIndex - 1)
    }
  }

  const handleLike = (index: number) => {
    const newLiked = [...isLiked]
    const wasLiked = newLiked[index]
    newLiked[index] = !wasLiked
    setIsLiked(newLiked)

    // Track like/unlike event
    const post = filteredPosts[index]
    trackEvent({
      event: wasLiked ? "unlike_post" : "like_post",
      userId,
      postId: post.id,
      postOwner: post.username,
      timestamp: Date.now(),
    })

    // Only show heart animation when liking (not unliking)
    if (!wasLiked) {
      setAnimatingHeartForVideo(index)
      setTimeout(() => {
        setAnimatingHeartForVideo(null)
      }, 1000)
    }
  }

  const handleSave = (index: number) => {
    const newSaved = [...isSaved]
    const wasSaved = newSaved[index]
    newSaved[index] = !wasSaved
    setIsSaved(newSaved)

    // Track save/unsave event
    const post = filteredPosts[index]
    trackEvent({
      event: wasSaved ? "unsave_post" : "save_post",
      userId,
      postId: post.id,
      postOwner: post.username,
      timestamp: Date.now(),
    })
  }

  const handleShare = (index: number) => {
    // Track share event
    const post = filteredPosts[index]
    trackEvent({
      event: "share_post",
      userId,
      postId: post.id,
      postOwner: post.username,
      timestamp: Date.now(),
    })
  }

  // Start tracking view duration when current post changes
  useEffect(() => {
    // Only track real posts, not the end card
    if (filteredPosts.length > 0 && currentIndex >= 0 && currentIndex < filteredPosts.length) {
      const post = filteredPosts[currentIndex]

      // End previous tracking if exists
      if (viewTrackingCleanupRef.current) {
        viewTrackingCleanupRef.current()
      }

      // Start new tracking
      viewTrackingCleanupRef.current = startViewTracking(userId, post.id, post.username)
    }

    // Clean up on unmount
    return () => {
      if (viewTrackingCleanupRef.current) {
        viewTrackingCleanupRef.current()
      }
    }
  }, [currentIndex, filteredPosts, userId])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowUp") {
        goToPrevious()
      } else if (e.key === "ArrowDown") {
        goToNext()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [currentIndex, filteredPosts.length])

  // Swipe handlers
  const swipeHandlers = useSwipeable({
    onSwipedUp: () => goToNext(),
    onSwipedDown: () => goToPrevious(),
    preventDefaultTouchmoveEvent: true,
    trackMouse: true,
  })

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center mobile-full-height w-full bg-black">
        <div className="flex flex-col items-center">
          <Loader2 className="h-12 w-12 text-primary animate-spin" />
          <p className="mt-4 text-white">Loading videos...</p>
        </div>
      </div>
    )
  }

  // Show error state
  if (error) {
    return (
      <div className="flex items-center justify-center mobile-full-height w-full bg-black">
        <div className="bg-red-900/50 p-6 rounded-lg max-w-md">
          <h2 className="text-xl font-bold text-white mb-2">Error Loading Videos</h2>
          <p className="text-white">{error}</p>
          <p className="text-white mt-4">Please try refreshing the page.</p>
        </div>
      </div>
    )
  }

  // Show empty state
  if (filteredPosts.length === 0) {
    return (
      <div className="flex items-center justify-center mobile-full-height w-full bg-black">
        <div className="bg-gray-900/50 p-6 rounded-lg max-w-md">
          <h2 className="text-xl font-bold text-white mb-2">No Videos Found</h2>
          <p className="text-white">There are no videos available for condition "{conditionValue}".</p>
          <p className="text-white mt-2">Please check the URL parameter or try a different condition.</p>
        </div>
      </div>
    )
  }

  // Check if we're showing the end card
  const isShowingEndCard = currentIndex === filteredPosts.length

  // Calculate height styles based on device
  const mobileHeightStyle = "mobile-full-height" // Uses CSS variable for mobile
  const desktopHeightStyle = isMobile ? "mobile-full-height" : "h-[80vh]"

  // Calculate width for desktop based on aspect ratio
  const desktopWidthStyle = isMobile ? "w-full" : "w-[calc(80vh*9/16)]"

  return (
    <div
      className={`relative ${isMobile ? mobileHeightStyle : desktopHeightStyle} ${desktopWidthStyle} mx-auto overflow-hidden bg-black`}
      ref={containerRef}
      style={{
        // Fallback inline style for browsers that don't support CSS variables
        height: isMobile ? "var(--app-height)" : "80vh",
      }}
    >
      {/* Header with search icon only - hide on end card */}
      {!isShowingEndCard && (
        <div className="absolute top-0 right-0 z-10 p-6">
          <button className="text-white p-2">
            <Search size={24} />
          </button>
        </div>
      )}

      {/* Navigation arrows for desktop - adjust for end card */}
      <button
        onClick={goToPrevious}
        className="absolute top-1/2 left-6 z-10 transform -translate-y-1/2 text-white bg-black/30 p-2 rounded-full hidden md:block"
        disabled={currentIndex === 0}
      >
        <ChevronUp size={24} />
      </button>
      <button
        onClick={goToNext}
        className="absolute top-1/2 right-6 z-10 transform -translate-y-1/2 text-white bg-black/30 p-2 rounded-full hidden md:block"
        disabled={isShowingEndCard}
      >
        <ChevronDown size={24} />
      </button>

      {/* Video container with swipe handlers */}
      <div
        {...swipeHandlers}
        className="h-full w-full"
        style={{
          transform: `translateY(-${currentIndex * 100}%)`,
          transition: "transform 0.3s ease-in-out",
        }}
      >
        {/* Regular posts */}
        {filteredPosts.map((post, index) => (
          <div key={post.id} className="h-full w-full flex-shrink-0 relative">
            <MediaPost
              mediaUrl={post.mediaUrl}
              mediaType={post.mediaType}
              username={post.username}
              caption={post.caption}
              isActive={index === currentIndex}
            />

            {/* Heart animation when liking a video */}
            {animatingHeartForVideo === index && <HeartAnimation />}

            {/* Beauty Filter Label - moved above username with more space */}
            {showBeautyFilterLabels && post.filter === "yes" && (
              <div className="absolute bottom-[6.5rem] left-6 z-20 bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-full flex items-center">
                <Sparkles size={16} className="text-yellow-400 mr-1.5" />
                <span className="text-white text-sm font-medium">Beauty Filter Used</span>
              </div>
            )}

            {/* Interaction buttons - moved closer to the bottom */}
            <div className="absolute z-30 flex flex-col right-6 bottom-6 gap-5">
              <button className="flex flex-col items-center" onClick={() => handleLike(index)} aria-label="Like">
                <Heart
                  size={28}
                  strokeWidth={2.5}
                  className={`${isLiked[index] ? "text-red-500 fill-red-500" : "text-white"} drop-shadow-md`}
                />
                <span className="text-white text-xs font-medium mt-1 drop-shadow-md">
                  {isLiked[index] ? (post.likes || 0) + 1 : post.likes}
                </span>
              </button>

              <button className="flex flex-col items-center" aria-label="Comment">
                <MessageCircle size={28} strokeWidth={2.5} className="text-white drop-shadow-md" />
                <span className="text-white text-xs font-medium mt-1 drop-shadow-md">{post.comments}</span>
              </button>

              <button className="flex flex-col items-center" onClick={() => handleSave(index)} aria-label="Save">
                <Bookmark
                  size={28}
                  strokeWidth={2.5}
                  className={`${isSaved[index] ? "text-yellow-500 fill-yellow-500" : "text-white"} drop-shadow-md`}
                />
                <span className="text-white text-xs font-medium mt-1 drop-shadow-md">
                  {isSaved[index] ? (post.saves || 0) + 1 : post.saves}
                </span>
              </button>

              <button className="flex flex-col items-center" onClick={() => handleShare(index)} aria-label="Share">
                <ArrowUpRight size={28} strokeWidth={2.5} className="text-white drop-shadow-md" />
                <span className="text-white text-xs font-medium mt-1 drop-shadow-md">{post.shares}</span>
              </button>
            </div>
          </div>
        ))}

        {/* End card */}
        <div className="h-full w-full flex-shrink-0 relative">
          <EndCard />
        </div>
      </div>

      {/* Progress indicator - hide on end card */}
      {!isShowingEndCard && (
        <div className="absolute top-6 left-0 right-0 z-10 flex justify-center gap-1">
          {filteredPosts.map((_, index) => (
            <div
              key={index}
              className={`h-1 rounded-full ${index === currentIndex ? "bg-white w-6" : "bg-white/30 w-4"}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
