import { useEffect, useState } from 'react'
import { getProductReviews, type Review } from '../../api/reviews'
import {
  formatBanglaDate,
  formatBanglaNumber,
  toBanglaDigits,
} from '../../utils/bangla'
import StarRating from './StarRating'

interface ReviewsListProps {
  productId: number
  refreshKey?: number
}

function formatAverageRating(value: number): string {
  if (!Number.isFinite(value) || value <= 0) {
    return toBanglaDigits(0)
  }

  const rounded = Math.round(value * 10) / 10

  return Number.isInteger(rounded)
    ? toBanglaDigits(rounded)
    : toBanglaDigits(rounded.toFixed(1))
}

function reviewerName(review: Review): string {
  const name = review.user_name?.trim()
  return name || 'ক্রেতা'
}

function reviewComment(review: Review): string | null {
  const comment = review.comment?.trim()
  return comment || null
}

export default function ReviewsList({ productId, refreshKey }: ReviewsListProps) {
  const [reviews, setReviews] = useState<Review[]>([])
  const [averageRating, setAverageRating] = useState(0)
  const [totalReviews, setTotalReviews] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    let isCancelled = false

    setIsLoading(true)
    setHasError(false)

    getProductReviews(productId)
      .then((data) => {
        if (isCancelled) {
          return
        }

        setReviews(Array.isArray(data.reviews) ? data.reviews : [])
        setAverageRating(
          Number.isFinite(data.average_rating) ? data.average_rating : 0,
        )
        setTotalReviews(
          Number.isFinite(data.total_reviews) ? data.total_reviews : 0,
        )
      })
      .catch(() => {
        if (!isCancelled) {
          setHasError(true)
          setReviews([])
          setAverageRating(0)
          setTotalReviews(0)
        }
      })
      .finally(() => {
        if (!isCancelled) {
          setIsLoading(false)
        }
      })

    return () => {
      isCancelled = true
    }
  }, [productId, refreshKey])

  if (isLoading) {
    return (
      <div
        className="rounded-2xl border border-primary/10 bg-white p-5 shadow-sm sm:p-6"
        aria-busy="true"
        aria-label="রিভিউ লোড হচ্ছে"
      >
        <div className="h-6 w-40 animate-pulse rounded bg-primary/10" />
        <div className="mt-3 h-5 w-28 animate-pulse rounded bg-accent/20" />
        <div className="mt-6 space-y-4">
          <div className="h-20 animate-pulse rounded-xl bg-primary/8" />
          <div className="h-20 animate-pulse rounded-xl bg-primary/8" />
        </div>
      </div>
    )
  }

  if (hasError) {
    return (
      <div className="rounded-2xl border border-primary/10 bg-white px-5 py-10 text-center shadow-sm sm:px-6">
        <p className="font-heading text-lg font-semibold text-text">
          রিভিউ লোড করা যায়নি
        </p>
        <p className="mt-1 text-sm text-muted">
          একটু পরে আবার চেষ্টা করুন।
        </p>
      </div>
    )
  }

  return (
    <section className="rounded-2xl border border-primary/10 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <p className="font-heading text-3xl font-semibold text-text">
          {formatAverageRating(averageRating)}
        </p>
        <div>
          <StarRating rating={averageRating} readOnly />
          <p className="mt-1 text-sm text-muted">
            মোট {formatBanglaNumber(totalReviews)}টি রিভিউ
          </p>
        </div>
      </div>

      {reviews.length === 0 ? (
        <p className="mt-6 rounded-xl bg-cream px-4 py-5 text-center text-sm text-muted">
          এখনো কোনো রিভিউ নেই, প্রথম রিভিউ দিন!
        </p>
      ) : (
        <ul className="mt-6 divide-y divide-primary/10">
          {reviews.map((review) => {
            const comment = reviewComment(review)
            const reviewedOn = formatBanglaDate(review.created_at)

            return (
              <li key={review.id} className="py-4 first:pt-0 last:pb-0">
                <div className="flex min-w-0 flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-text">
                      {reviewerName(review)}
                    </p>
                    <div className="mt-1">
                      <StarRating rating={review.rating} readOnly />
                    </div>
                  </div>
                  {reviewedOn ? (
                    <p className="shrink-0 text-xs text-muted sm:text-sm">
                      {reviewedOn}
                    </p>
                  ) : null}
                </div>
                {comment ? (
                  <p className="mt-2 break-words whitespace-pre-wrap text-sm leading-relaxed text-muted">
                    {comment}
                  </p>
                ) : null}
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
