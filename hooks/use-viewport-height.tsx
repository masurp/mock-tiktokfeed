"use client"

import { useEffect } from "react"

/**
 * Custom hook to calculate and update the correct viewport height
 * This addresses the issue with mobile browsers where 100vh includes
 * the address bar, causing content to be hidden under it
 */
export function useViewportHeight() {
  // Set up the viewport height calculation
  useEffect(() => {
    // Function to update the CSS variable with the window's inner height
    const setAppHeight = () => {
      // Set a CSS variable that represents the actual viewport height
      document.documentElement.style.setProperty("--app-height", `${window.innerHeight}px`)
    }

    // Set the height initially
    setAppHeight()

    // Update on resize and orientation change
    window.addEventListener("resize", setAppHeight)
    window.addEventListener("orientationchange", setAppHeight)

    // Clean up event listeners
    return () => {
      window.removeEventListener("resize", setAppHeight)
      window.removeEventListener("orientationchange", setAppHeight)
    }
  }, [])
}
