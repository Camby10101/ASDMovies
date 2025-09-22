"use client"


import { useState } from "react"
import { Heart } from "lucide-react"
import { cn } from "@/lib/utils"

interface HeartRatingProps {
  value?: boolean
  onChange?: (value: boolean) => void
}

export function HeartRating({ value = false, onChange }: HeartRatingProps) {
  const [hover, setHover] = useState(false)

  return (
    <button
      type="button"
      className="focus:outline-none cursor-pointer"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={() => onChange?.(!value)}
    >
      <Heart
        className={cn(
          "h-6 w-6 transition-colors",
          (hover || value)
            ? "fill-red-400 text-red-400"
            : "text-gray-400"
        )}
      />
    </button>
  )
}

