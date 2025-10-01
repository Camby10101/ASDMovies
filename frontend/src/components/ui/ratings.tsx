"use client" // runs on the client side

/*
* Component for star ratings 
*/

import { useState } from "react"
import { Star } from "lucide-react"
import { cn } from "@/lib/utils" 

export function StarRating({ max = 5, value, onChange }: {
  max?: number
  value?: number
  onChange?: (rating: number) => void
}) {
  // state to track which star is being hovered over
  const [hover, setHover] = useState<number | null>(null)

  return (
    <div className="flex gap-1"> {/* Container wth flexboz layour */}
      {Array.from({ length: max }, (_, i) => {
        const ratingValue = i + 1
        return (
          <button
            key={ratingValue}
            type="button"
            onClick={() => onChange?.(ratingValue)}
            onMouseEnter={() => setHover(ratingValue)}
            onMouseLeave={() => setHover(null)}
            className="focus:outline-none cursor-pointer"
          >
            <Star
              className={cn(
                "h-6 w-6 transition-colors",
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

