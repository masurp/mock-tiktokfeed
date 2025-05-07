"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Heart } from "lucide-react"

interface HeartProps {
  id: number
  style: React.CSSProperties
}

export default function HeartAnimation() {
  const [hearts, setHearts] = useState<HeartProps[]>([])

  useEffect(() => {
    // Create multiple hearts with random positions and animations
    const newHearts = Array.from({ length: 12 }, (_, i) => ({
      id: i,
      style: {
        position: "absolute",
        left: `${Math.random() * 70 + 15}%`,
        bottom: "30%",
        opacity: 1,
        transform: `scale(${Math.random() * 0.5 + 0.5})`,
        animation: `float-up-${i} 1s ease-out forwards`,
      } as React.CSSProperties,
    }))

    setHearts(newHearts)

    // Clean up hearts after animation completes
    const timer = setTimeout(() => {
      setHearts([])
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-20">
      <style jsx global>{`
        ${hearts
          .map(
            (heart, i) => `
          @keyframes float-up-${i} {
            0% {
              transform: translate(0, 0) scale(${Math.random() * 0.5 + 0.5}) rotate(${Math.random() * 30 - 15}deg);
              opacity: 1;
            }
            100% {
              transform: translate(${Math.random() * 100 - 50}px, -${Math.random() * 200 + 100}px) scale(${Math.random() * 0.5 + 0.5}) rotate(${Math.random() * 60 - 30}deg);
              opacity: 0;
            }
          }
        `,
          )
          .join("\n")}
      `}</style>

      {hearts.map((heart) => (
        <div key={heart.id} style={heart.style}>
          <Heart className="text-red-500 fill-red-500" size={Math.random() * 20 + 20} />
        </div>
      ))}
    </div>
  )
}
