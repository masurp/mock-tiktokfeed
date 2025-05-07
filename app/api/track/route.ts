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
    console.log("Tracking events received:", events)

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

    // If Google Script URL is configured, send events to Google Sheets
    try {
      const response = await fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ events }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error("Error from Google Script:", errorText)
        return NextResponse.json(
          {
            success: false,
            message: "Failed to send events to Google Sheets",
          },
          { status: 500 },
        )
      }

      return NextResponse.json({
        success: true,
        message: `Successfully sent ${events.length} events to Google Sheets`,
      })
    } catch (fetchError) {
      console.error("Error sending events to Google Sheets:", fetchError)
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
