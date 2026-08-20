import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { createReview, getReviewErrorMessage } from '../../api/reviews'
import { useAuth } from '../../context/AuthContext'
import StarRating from './StarRating'

interface ReviewFormProps {
  productId: number
  onReviewSubmitted?: () => void
}

const fieldClass =
  'mt-1.5 w-full rounded-xl border border-primary/15 bg-cream px-3.5 py-2.5 text-sm text-text outline-none transition placeholder:text-muted/70 focus:border-primary focus:ring-2 focus:ring-primary/15'

export default function ReviewForm({
  productId,
  onReviewSubmitted,
}: ReviewFormProps) {
  const { isAuthenticated, loading } = useAuth()
  const [rating, setRating] = useState(0)
  const [orderId, setOrderId] = useState('')
  const [comment, setComment] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (loading) {
    return (
      <div
        className="h-56 animate-pulse rounded-2xl border border-primary/10 bg-white shadow-sm"
        aria-hidden="true"
      />
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="rounded-2xl border border-primary/10 bg-white px-5 py-8 text-center shadow-sm sm:px-6">
        <p className="font-heading text-lg font-semibold text-text">
          রিভিউ দিতে লগইন করুন
        </p>
        <Link
          to="/login"
          className="mt-4 inline-flex rounded-full bg-primary px-4 py-2 text-sm font-medium text-cream shadow-[0_8px_20px_rgba(45,90,61,0.2)] transition hover:bg-primary/90"
        >
          লগইন
        </Link>
      </div>
    )
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (submitting) {
      return
    }

    setSuccess(null)

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      setError('রেটিং ১ থেকে ৫ এর মধ্যে দিন')
      return
    }

    const parsedOrderId = Number(orderId.trim())

    if (!Number.isInteger(parsedOrderId) || parsedOrderId <= 0) {
      setError('Order ID দিন')
      return
    }

    const trimmedComment = comment.trim()

    setError(null)
    setSubmitting(true)

    try {
      await createReview({
        product_id: productId,
        order_id: parsedOrderId,
        rating,
        comment: trimmedComment || undefined,
      })

      setRating(0)
      setOrderId('')
      setComment('')
      setSuccess('আপনার রিভিউ জমা হয়েছে')
      onReviewSubmitted?.()
    } catch (err) {
      setError(getReviewErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="rounded-2xl border border-primary/10 bg-white p-5 shadow-sm sm:p-6"
    >
      <h3 className="font-heading text-xl font-semibold text-text">
        রিভিউ দিন
      </h3>

      <div className="mt-4">
        <p className="text-sm font-medium text-text">রেটিং</p>
        <div className="mt-1.5">
          <StarRating rating={rating} onChange={setRating} />
        </div>
      </div>

      <label htmlFor="review-order-id" className="mt-4 block text-sm font-medium text-text">
        Order ID
      </label>
      <input
        id="review-order-id"
        name="order_id"
        type="text"
        inputMode="numeric"
        autoComplete="off"
        value={orderId}
        onChange={(event) => setOrderId(event.target.value)}
        className={fieldClass}
        placeholder="যেমন: 12"
        disabled={submitting}
      />
      <p className="mt-1.5 text-xs text-muted">
        যে অর্ডারে এই প্রোডাক্ট ছিল তার Order ID দিন
      </p>

      <label htmlFor="review-comment" className="mt-4 block text-sm font-medium text-text">
        মন্তব্য <span className="font-normal text-muted">(ঐচ্ছিক)</span>
      </label>
      <textarea
        id="review-comment"
        name="comment"
        rows={4}
        value={comment}
        onChange={(event) => setComment(event.target.value)}
        className={`${fieldClass} resize-y`}
        placeholder="আপনার অভিজ্ঞতা লিখুন"
        disabled={submitting}
      />

      {error ? (
        <p
          className="mt-4 rounded-xl bg-[#F8E7DC] px-3 py-2.5 text-sm text-[#9A4B12]"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      {success ? (
        <p
          className="mt-4 rounded-xl bg-primary/10 px-3 py-2.5 text-sm text-primary"
          role="status"
        >
          {success}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={submitting}
        className="mt-5 w-full rounded-xl bg-primary py-3 text-sm font-medium text-cream shadow-[0_8px_20px_rgba(45,90,61,0.22)] transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto sm:px-6"
      >
        {submitting ? 'জমা হচ্ছে...' : 'রিভিউ জমা দিন'}
      </button>
    </form>
  )
}
