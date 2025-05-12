"use client"

import { useState, useEffect } from "react"

/**
 * Custom hook to get the actual viewport height, accounting for mobile browser toolbars
 * Uses modern viewport units (dvh, svh, lvh) with fallbacks for older browsers
 * @returns An object with CSS variables and utility functions for viewport height
 */
export function useViewportHeight() {
  const [viewportHeight, setViewportHeight] = useState<number>(0)
  const [cssVarValue, setCssVarValue] = useState<string>("100vh")

  useEffect(() => {
    // Function to update the viewport height
    const updateViewportHeight = () => {
      // Get the actual viewport height
      const vh = window.innerHeight
      setViewportHeight(vh)

      // Check if modern viewport units are supported
      const supportsModernViewportUnits = CSS.supports("height", "1dvh")

      if (supportsModernViewportUnits) {
        // Use dynamic viewport height (dvh) which adjusts for mobile browser UI
        setCssVarValue("100dvh")
        document.documentElement.style.setProperty("--app-height", "100dvh")
      } else {
        // Fallback for browsers that don't support dvh
        setCssVarValue(`${vh}px`)
        document.documentElement.style.setProperty("--app-height", `${vh}px`)
      }
    }

    // Initial update
    updateViewportHeight()

    // Update on resize and orientation change
    window.addEventListener("resize", updateViewportHeight)
    window.addEventListener("orientationchange", updateViewportHeight)

    // Clean up
    return () => {
      window.removeEventListener("resize", updateViewportHeight)
      window.removeEventListener("orientationchange", updateViewportHeight)
    }
  }, [])

  return {
    viewportHeight,
    cssVarValue,
    // Helper function to get percentage of viewport height
    getViewportHeightPercentage: (percentage: number) => {
      if (cssVarValue === "100dvh") {
        return `${percentage}dvh`
      } else if (viewportHeight > 0) {
        return `${viewportHeight * (percentage / 100)}px`
      }
      return `${percentage}vh` // Fallback
    },
  }
}
