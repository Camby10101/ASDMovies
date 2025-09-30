"use client" // runs on the client side

import { useState } from "react"
import { Star } from "lucide-react"
import { cn } from "@/lib/utils" 

export function StarRating({ max = 5, value, onChange, readOnly = false }: {
  max?: number
  value?: number
  onChange?: (rating: number) => void
  readOnly?: boolean
}) {
  // state to track which star is being hovered over
  const [hover, setHover] = useState<number | null>(null)

  return (
    <div className="flex gap-0.25 w-full"> {/* Container wth flexboz layour */}
      {Array.from({ length: max }, (_, i) => {
        const ratingValue = i + 1
        return (
          <button
            key={ratingValue}
            type="button"
            onClick={() => onChange?.(ratingValue)}
            onMouseEnter={() => !readOnly && setHover(ratingValue)}
            onMouseLeave={() => !readOnly && setHover(null)}
            className="focus:outline-none cursor-pointer"
          >
            <Star
              className={cn(
                "h-full w-full transition-colors",
                ((hover ?? value ?? 0) >= ratingValue)
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-gray-400"
              )}
            />
          </button>
        )
      })}
    </div>
  )
}

