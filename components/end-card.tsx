"use client"

import { Button } from "@/components/ui/button"

export default function EndCard() {
  const handleCloseTab = () => {
    // Attempt to close the tab
    window.close()

    // If window.close() doesn't work (which is common in many browsers due to security restrictions),
    // show a message asking the user to close the tab manually
    setTimeout(() => {
      alert(
        "Please close this tab manually. Some browsers prevent JavaScript from closing tabs that weren't opened by JavaScript.",
      )
    }, 300)
  }

  return (
    <div className="absolute inset-0 bg-black flex flex-col items-center justify-center text-center p-6">
      <div className="bg-black/60 backdrop-blur-sm p-8 rounded-xl max-w-md">
        <h2 className="text-white text-2xl font-bold mb-6">You have seen all posts, you can close this app now</h2>
        <Button
          onClick={handleCloseTab}
          className="bg-primary hover:bg-primary/80 text-white font-medium py-3 px-6 rounded-full text-lg"
        >
          Close This Tab
        </Button>
        <p className="text-gray-400 mt-4 text-sm">Thank you for participating in this study</p>
      </div>
    </div>
  )
}
