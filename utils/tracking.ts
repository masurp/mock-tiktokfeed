import type { TrackingEvent } from "@/types/tracking"

// Queue to store events before they're sent to the server
let eventQueue: TrackingEvent[] = []
const BATCH_SIZE = 10 // Number of events to batch before sending
const FLUSH_INTERVAL = 30000 // Flush events every 30 seconds
const MAX_RETRIES = 3 // Maximum number of retries for failed requests
const RETRY_DELAY = 5000 // Delay between retries in milliseconds

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

  console.log("Tracking system initialized")
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
export async function flushEvents(isUnloading = false, retryCount = 0) {
  if (eventQueue.length === 0) return

  const events = [...eventQueue]

  // Clear the queue immediately to prevent duplicate sends
  eventQueue = []

  try {
    // If the page is unloading, use navigator.sendBeacon for more reliable delivery
    if (isUnloading && navigator.sendBeacon) {
      try {
        const blob = new Blob([JSON.stringify({ events })], { type: "application/json" })
        const success = navigator.sendBeacon("/api/track", blob)

        if (!success) {
          console.warn("sendBeacon failed, events may be lost")
        }
        return
      } catch (beaconError) {
        console.error("Error using sendBeacon:", beaconError)
        // Fall back to fetch if sendBeacon fails
      }
    }

    // Otherwise use fetch
    const response = await fetch("/api/track", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ events }),
    })

    if (!response.ok) {
      throw new Error(`Server returned ${response.status}: ${response.statusText}`)
    }

    const result = await response.json()

    if (!result.success) {
      console.warn("Tracking API reported failure:", result.message)

      // Put events back in the queue if sending failed and we haven't exceeded max retries
      if (retryCount < MAX_RETRIES) {
        console.log(`Retrying send (attempt ${retryCount + 1}/${MAX_RETRIES}) in ${RETRY_DELAY}ms`)
        setTimeout(() => {
          // Add events back to the queue
          eventQueue = [...events, ...eventQueue]
          flushEvents(false, retryCount + 1)
        }, RETRY_DELAY)
      } else {
        console.error("Max retries exceeded, events will be lost:", events)
      }
    }
  } catch (error) {
    console.error("Error sending events:", error)

    // Put events back in the queue if sending failed and we haven't exceeded max retries
    if (retryCount < MAX_RETRIES) {
      console.log(`Retrying send (attempt ${retryCount + 1}/${MAX_RETRIES}) in ${RETRY_DELAY}ms`)
      setTimeout(() => {
        // Add events back to the queue
        eventQueue = [...events, ...eventQueue]
        flushEvents(false, retryCount + 1)
      }, RETRY_DELAY)
    } else {
      console.error("Max retries exceeded, events will be lost:", events)
      // Store events in localStorage as a last resort
      try {
        const storedEvents = JSON.parse(localStorage.getItem("failedTrackingEvents") || "[]")
        localStorage.setItem("failedTrackingEvents", JSON.stringify([...storedEvents, ...events]))
        console.log("Failed events saved to localStorage")
      } catch (storageError) {
        console.error("Could not save events to localStorage:", storageError)
      }
    }
  }
}
