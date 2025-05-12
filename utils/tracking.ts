import type { TrackingEvent } from "@/types/tracking"

// Queue to store events before they're sent to the server
let eventQueue: TrackingEvent[] = []
const BATCH_SIZE = 10 // Number of events to batch before sending
const FLUSH_INTERVAL = 30000 // Flush events every 30 seconds

// Initialize tracking system
export function initTracking() {
  // Set up interval to flush events periodically
  setInterval(() => {
    flushEvents()
  }, FLUSH_INTERVAL)

  // Flush events when the page is about to be unloaded
  if (typeof window !== "undefined") {
    window.addEventListener("beforeunload", () => {
      flushEvents(true)
    })
  }
}

// Track an event
export function trackEvent(event: TrackingEvent) {
  // Add event to queue
  eventQueue.push(event)
  console.log("Tracked event:", event)

  // If queue reaches batch size, flush events
  if (eventQueue.length >= BATCH_SIZE) {
    flushEvents()
  }
}

// Start tracking view duration
export function startViewTracking(userId: string, postId: number, postOwner: string): () => void {
  const startTime = Date.now()

  // Return a function that, when called, will end the tracking and record the duration
  return () => {
    const endTime = Date.now()
    const duration = endTime - startTime

    trackEvent({
      event: "view_post",
      userId,
      postId,
      postOwner,
      timestamp: startTime,
      duration,
    })
  }
}

// Flush events to the server
export async function flushEvents(isUnloading = false) {
  if (eventQueue.length === 0) return

  const events = [...eventQueue]

  // Clear the queue immediately to prevent duplicate sends
  eventQueue = []

  try {
    // If the page is unloading, use navigator.sendBeacon for more reliable delivery
    if (isUnloading && navigator.sendBeacon) {
      const blob = new Blob([JSON.stringify({ events })], { type: "application/json" })
      navigator.sendBeacon("/api/track", blob)
      return
    }

    // Otherwise use fetch
    const response = await fetch("/api/track", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ events }),
    })

    const result = await response.json()

    if (!result.success) {
      console.error("Failed to send events:", result.message)
      // Put events back in the queue if sending failed
      eventQueue = [...events, ...eventQueue]
    }
  } catch (error) {
    console.error("Error sending events:", error)
    // Put events back in the queue if sending failed
    eventQueue = [...events, ...eventQueue]
  }
}
