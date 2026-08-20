import { Star } from 'lucide-react'
import { toBanglaDigits } from '../../utils/bangla'

const STAR_VALUES = [1, 2, 3, 4, 5] as const

interface StarRatingProps {
  rating: number
  onChange?: (rating: number) => void
  readOnly?: boolean
}

function isFilled(star: number, rating: number) {
  return star <= rating
}

function starClassName(filled: boolean) {
  return filled
    ? 'fill-accent text-accent'
    : 'fill-none text-muted/40'
}

export default function StarRating({
  rating,
  onChange,
  readOnly = false,
}: StarRatingProps) {
  const safeRating = Number.isFinite(rating) ? rating : 0
  const interactive = !readOnly && typeof onChange === 'function'

  if (!interactive) {
    return (
      <div
        className="inline-flex items-center gap-0.5"
        role="img"
        aria-label={`${toBanglaDigits(Math.round(safeRating))} তারকা, ৫ এর মধ্যে`}
      >
        {STAR_VALUES.map((star) => (
          <Star
            key={star}
            className={`h-5 w-5 ${starClassName(isFilled(star, safeRating))}`}
            strokeWidth={1.5}
            aria-hidden="true"
          />
        ))}
      </div>
    )
  }

  return (
    <div
      className="inline-flex items-center gap-0.5"
      role="radiogroup"
      aria-label="রেটিং নির্বাচন করুন"
    >
      {STAR_VALUES.map((star) => {
        const filled = isFilled(star, safeRating)

        return (
          <button
            key={star}
            type="button"
            role="radio"
            aria-checked={star === safeRating}
            aria-label={`${toBanglaDigits(star)} তারকা`}
            onClick={() => onChange?.(star)}
            className="rounded-md p-0.5 transition hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            <Star
              className={`h-7 w-7 ${starClassName(filled)}`}
              strokeWidth={1.5}
              aria-hidden="true"
            />
          </button>
        )
      })}
    </div>
  )
}
