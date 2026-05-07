import React from 'react'
import { Star } from 'lucide-react'

export default function StarRating({ rating = 0, max = 5, size = 16 }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: max }, (_, i) => (
        <Star
          key={i}
          size={size}
          className={i < rating ? 'star-filled fill-warning' : 'star-empty'}
          fill={i < rating ? '#f59e0b' : 'none'}
          stroke={i < rating ? '#f59e0b' : '#374151'}
        />
      ))}
    </div>
  )
}
