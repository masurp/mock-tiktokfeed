import { NextResponse } from "next/server"
import type { TrackingEvent } from "@/types/tracking"

export async function POST(request: Request) {
  try {
    const { events } = (await request.json()) as { events: TrackingEvent[] }

    if (!events || !Array.isArray(events) || events.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "No valid events provided",
        },
        { status: 400 },
      )
    }

    // Log events to console for development
    console.log("Tracking events received:", events.length)

    // Check if Google Script URL is configured
    const GOOGLE_SCRIPT_URL = process.env.GOOGLE_SCRIPT_URL

    // If Google Script URL is not configured, just return success
    // This allows the app to work without the environment variable
    if (!GOOGLE_SCRIPT_URL) {
      console.log("Google Script URL not configured, skipping export to Google Sheets")
      return NextResponse.json({
        success: true,
        message: `Processed ${events.length} events (Google Sheets export disabled)`,
      })
    }

    // If Google Script URL is configured, try to send events to Google Sheets
    try {
      // Add timeout to the fetch request
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

      const response = await fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ events }),
        signal: controller.signal,
      })

      clearTimeout(timeoutId) // Clear the timeout

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`Error from Google Script (${response.status}):`, errorText)

        // Still return success to the client, but log the error
        return NextResponse.json({
          success: true,
          message: `Processed ${events.length} events (Google Sheets export failed but events were logged)`,
        })
      }

      return NextResponse.json({
        success: true,
        message: `Successfully sent ${events.length} events to Google Sheets`,
      })
    } catch (fetchError) {
      console.error("Error sending events to Google Sheets:", fetchError)

      // Still return success to the client, but log the error
      return NextResponse.json({
        success: true,
        message: `Processed ${events.length} events (Google Sheets export failed but events were logged)`,
      })
    }
  } catch (error) {
    console.error("Error processing tracking events:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Server error processing events",
      },
      { status: 500 },
    )
  }
}
