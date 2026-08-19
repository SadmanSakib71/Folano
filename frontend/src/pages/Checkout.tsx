import { useEffect, useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { CheckCircle2, Package } from 'lucide-react'
import { createOrder, getOrderErrorMessage } from '../api/orders'
import { DELIVERY_CHARGE } from '../constants'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { formatBanglaNumber, formatPriceWithUnit } from '../utils/bangla'
import { getPlaceholderImage } from '../utils/placeholderImages'

function formatTaka(amount: number) {
  return `৳${formatBanglaNumber(amount)}`
}

export default function Checkout() {
  const navigate = useNavigate()
  const { items, totalPrice, clearCart } = useCart()
  const { isAuthenticated, loading } = useAuth()
  const [addressText, setAddressText] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  const total = totalPrice + DELIVERY_CHARGE

  useEffect(() => {
    if (!success) {
      return
    }

    const timeoutId = window.setTimeout(() => {
      navigate('/orders')
    }, 1800)

    return () => window.clearTimeout(timeoutId)
  }, [success, navigate])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (submitting || success) {
      return
    }

    if (!isAuthenticated) {
      navigate('/login')
      return
    }

    if (items.length === 0) {
      navigate('/cart')
      return
    }

    const address = addressText.trim()

    if (!address) {
      setError('ডেলিভারি ঠিকানা লিখুন')
      return
    }

    setError(null)
    setSubmitting(true)

    try {
      await createOrder({
        address_text: address,
        delivery_charge: DELIVERY_CHARGE,
        items: items.map((item) => ({
          product_id: item.product_id,
          quantity: item.quantity,
        })),
      })

      clearCart()
      setSuccess(true)
    } catch (err) {
      setError(getOrderErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  if (success) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="rounded-2xl border border-primary/10 bg-white px-6 py-16 text-center shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <CheckCircle2 className="h-8 w-8 text-primary" strokeWidth={1.5} />
          </div>
          <p className="mt-4 font-heading text-lg font-semibold text-text">
            আপনার অর্ডার সফল হয়েছে
          </p>
          <p className="mt-1 text-sm text-muted" role="status">
            অর্ডার তালিকায় নিয়ে যাওয়া হচ্ছে...
          </p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="h-8 w-40 animate-pulse rounded-lg bg-primary/10" />
        <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="h-56 animate-pulse rounded-2xl bg-white shadow-sm" />
          <div className="h-64 animate-pulse rounded-2xl bg-white shadow-sm" />
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (items.length === 0) {
    return <Navigate to="/cart" replace />
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <p className="text-sm font-medium text-accent">ফলের দোকান</p>
      <h1 className="mt-1 font-heading text-3xl font-semibold text-text sm:text-4xl">
        চেকআউট
      </h1>

      <form
        className="mt-8 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] xl:grid-cols-[minmax(0,1fr)_22rem]"
        onSubmit={handleSubmit}
        noValidate
      >
        <section className="rounded-2xl border border-primary/10 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" strokeWidth={1.75} />
            <h2 className="font-heading text-xl font-semibold text-text">
              ডেলিভারি ঠিকানা
            </h2>
          </div>
          <p className="mt-1 text-sm text-muted">
            ফল পৌঁছে দেওয়ার জন্য সম্পূর্ণ ঠিকানা লিখুন।
          </p>

          <label htmlFor="checkout-address" className="mt-5 block text-sm font-medium text-text">
            ঠিকানা
          </label>
          <textarea
            id="checkout-address"
            name="address_text"
            required
            rows={5}
            value={addressText}
            onChange={(event) => setAddressText(event.target.value)}
            placeholder="বাসা/রোড, এলাকা, শহর"
            className="mt-1.5 w-full resize-y rounded-xl border border-primary/15 bg-cream px-3.5 py-2.5 text-sm text-text outline-none transition placeholder:text-muted/70 focus:border-primary focus:ring-2 focus:ring-primary/15"
          />
        </section>

        <aside className="rounded-2xl border border-primary/10 bg-white p-5 shadow-sm lg:sticky lg:top-28">
          <h2 className="font-heading text-xl font-semibold text-text">
            অর্ডার সামারি
          </h2>

          <ul className="mt-4 space-y-3">
            {items.map((item) => {
              const imageSrc = item.image_url?.trim()
                ? item.image_url
                : getPlaceholderImage(item.name)

              return (
                <li key={item.product_id} className="flex gap-3">
                  <img
                    src={imageSrc}
                    alt=""
                    className="h-14 w-14 shrink-0 rounded-xl object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-text">
                      {item.name}
                    </p>
                    <p className="mt-0.5 text-xs text-muted">
                      {formatBanglaNumber(item.quantity)} ×{' '}
                      {formatPriceWithUnit(item.price, item.unit)}
                    </p>
                  </div>
                  <p className="shrink-0 text-sm font-medium text-text">
                    {formatTaka(item.price * item.quantity)}
                  </p>
                </li>
              )
            })}
          </ul>

          <dl className="mt-4 space-y-3 border-t border-primary/10 pt-4 text-sm">
            <div className="flex items-center justify-between gap-4">
              <dt className="text-muted">সাবটোটাল</dt>
              <dd className="font-medium text-text">{formatTaka(totalPrice)}</dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-muted">ডেলিভারি চার্জ</dt>
              <dd className="font-medium text-text">
                {formatTaka(DELIVERY_CHARGE)}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4 border-t border-primary/10 pt-3">
              <dt className="font-heading text-base font-semibold text-text">
                মোট
              </dt>
              <dd className="font-heading text-lg font-semibold text-accent">
                {formatTaka(total)}
              </dd>
            </div>
          </dl>

          {error ? (
            <p
              className="mt-4 rounded-xl bg-[#F8E7DC] px-3 py-2.5 text-sm text-[#9A4B12]"
              role="alert"
            >
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={submitting}
            className="mt-5 w-full rounded-xl bg-primary py-3 text-sm font-medium text-cream shadow-[0_8px_20px_rgba(45,90,61,0.22)] transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {submitting ? 'অর্ডার হচ্ছে...' : 'অর্ডার কনফার্ম করুন'}
          </button>
        </aside>
      </form>
    </div>
  )
}
