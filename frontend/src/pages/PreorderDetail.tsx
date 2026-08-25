import axios from 'axios'
import { Minus, Plus, ShoppingBasket } from 'lucide-react'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  parseCreatedOrder,
  type CreatedOrder,
} from '../api/orders'
import {
  createPreorder,
  getPreorderBatchById,
  getPreorderErrorMessage,
} from '../api/preorders'
import PaymentStep from '../components/payment/PaymentStep'
import { useAuth } from '../context/AuthContext'
import type { PreorderBatch } from '../types'
import {
  formatBanglaDate,
  formatBanglaNumber,
  formatPriceWithUnit,
  formatUnit,
} from '../utils/bangla'
import {
  clampQuantity,
  getBatchImage,
  getBatchUnit,
  getMinQuantity,
  getReservationPercent,
  stepQuantity,
} from '../utils/preorder'

function isNotFoundError(error: unknown) {
  return axios.isAxiosError(error) && error.response?.status === 404
}

function StatusState({
  title,
  message,
}: {
  title: string
  message: string
}) {
  return (
    <div className="rounded-2xl border border-primary/10 bg-white px-6 py-16 text-center shadow-sm">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
        <ShoppingBasket className="h-8 w-8 text-primary" strokeWidth={1.5} />
      </div>
      <p className="mt-4 font-heading text-lg font-semibold text-text">{title}</p>
      <p className="mt-1 text-sm text-muted">{message}</p>
      <Link
        to="/preorders"
        className="mt-5 inline-flex rounded-full bg-primary px-4 py-2 text-sm font-medium text-cream transition hover:bg-primary/90"
      >
        সব প্রি-অর্ডার দেখুন
      </Link>
    </div>
  )
}

function PreorderDetailSkeleton() {
  return (
    <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
      <div className="aspect-square animate-pulse rounded-3xl bg-primary/10 shadow-sm sm:aspect-4/3 lg:aspect-square" />
      <div className="space-y-4 py-2">
        <div className="h-4 w-24 animate-pulse rounded bg-accent/20" />
        <div className="h-10 w-3/4 animate-pulse rounded-lg bg-primary/10" />
        <div className="h-6 w-32 animate-pulse rounded bg-accent/20" />
        <div className="h-20 w-full animate-pulse rounded-xl bg-primary/10" />
        <div className="h-12 w-48 animate-pulse rounded-full bg-primary/10" />
      </div>
    </div>
  )
}

export default function PreorderDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { isAuthenticated, loading: authLoading } = useAuth()
  const [batch, setBatch] = useState<PreorderBatch | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [quantity, setQuantity] = useState(1)
  const [addressText, setAddressText] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [orderCreated, setOrderCreated] = useState(false)
  const [createdOrder, setCreatedOrder] = useState<CreatedOrder | null>(null)
  const inFlightRef = useRef(false)

  useEffect(() => {
    const batchId = Number(id)

    if (!id || Number.isNaN(batchId)) {
      setBatch(null)
      setNotFound(true)
      setHasError(false)
      setIsLoading(false)
      return
    }

    let isCancelled = false

    setIsLoading(true)
    setNotFound(false)
    setHasError(false)
    setBatch(null)
    setQuantity(1)
    setAddressText('')
    setError(null)
    setOrderCreated(false)
    setCreatedOrder(null)

    getPreorderBatchById(batchId)
      .then((data) => {
        if (isCancelled) {
          return
        }

        setBatch(data)
        setQuantity(clampQuantity(1, data.available_quantity))
      })
      .catch((err: unknown) => {
        if (isCancelled) {
          return
        }

        if (isNotFoundError(err)) {
          setNotFound(true)
        } else {
          setHasError(true)
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
  }, [id])

  const unit = batch ? getBatchUnit(batch) : 'kg'
  const minQuantity = batch ? getMinQuantity(batch.available_quantity) : 1
  const isOpen = batch?.status === 'open'
  const hasStock = (batch?.available_quantity ?? 0) > 0
  const canSubmit = Boolean(batch && isOpen && hasStock && !submitting && !orderCreated)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!batch || inFlightRef.current || submitting || orderCreated) {
      return
    }

    if (!isOpen || !hasStock) {
      return
    }

    if (authLoading) {
      return
    }

    if (!isAuthenticated) {
      navigate('/login')
      return
    }

    const address = addressText.trim()

    if (!address) {
      setError('ডেলিভারি ঠিকানা লিখুন')
      return
    }

    const nextQuantity = clampQuantity(quantity, batch.available_quantity)

    if (nextQuantity > batch.available_quantity || nextQuantity <= 0) {
      setError('পর্যাপ্ত পরিমাণ নেই। পরিমাণ কমিয়ে আবার চেষ্টা করুন।')
      return
    }

    setError(null)
    inFlightRef.current = true
    setSubmitting(true)

    try {
      const data = await createPreorder({
        batch_id: batch.id,
        quantity: nextQuantity,
        address_text: address,
      })
      setCreatedOrder(parseCreatedOrder(data))
      setOrderCreated(true)
    } catch (err) {
      setError(getPreorderErrorMessage(err))
    } finally {
      inFlightRef.current = false
      setSubmitting(false)
    }
  }

  if (orderCreated) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <PaymentStep order={createdOrder} />
      </div>
    )
  }

  const imageSrc = batch ? getBatchImage(batch) : ''
  const percent = batch ? getReservationPercent(batch) : 0
  const deliveryDate = batch ? formatBanglaDate(batch.expected_delivery_date) : null
  const startDate = batch ? formatBanglaDate(batch.preorder_start_date) : null
  const endDate = batch ? formatBanglaDate(batch.preorder_end_date) : null

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      {isLoading ? (
        <PreorderDetailSkeleton />
      ) : notFound ? (
        <StatusState
          title="ব্যাচ পাওয়া যায়নি"
          message="এই প্রি-অর্ডার ব্যাচ খুঁজে পাওয়া যায়নি। অন্য ব্যাচ দেখুন।"
        />
      ) : hasError || !batch ? (
        <StatusState
          title="প্রি-অর্ডার লোড করা যায়নি"
          message="একটু পরে আবার চেষ্টা করুন।"
        />
      ) : (
        <>
          <p className="text-sm font-medium text-accent">ফলের দোকান</p>
          <Link
            to="/preorders"
            className="mt-1 inline-flex text-sm text-muted transition hover:text-primary"
          >
            ← সব প্রি-অর্ডার
          </Link>

          <div className="mt-6 grid items-start gap-8 lg:grid-cols-2 lg:gap-12">
            <div className="relative overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-primary/5">
              <img
                src={imageSrc}
                alt={batch.batch_name}
                className="aspect-square w-full object-cover sm:aspect-4/3 lg:aspect-square"
              />
              <div className="absolute left-3 top-3">
                <span className="rounded-full bg-cream/90 px-2.5 py-1 text-xs font-medium text-accent shadow-sm">
                  প্রি-অর্ডার
                </span>
              </div>
            </div>

            <form onSubmit={handleSubmit} noValidate>
              {batch.product_name ? (
                <p className="text-sm font-medium text-accent">{batch.product_name}</p>
              ) : null}

              <h1 className="mt-1 font-heading text-3xl font-semibold text-text sm:text-4xl">
                {batch.batch_name}
              </h1>

              <p className="mt-3 text-2xl font-medium text-accent">
                {formatPriceWithUnit(batch.price_per_unit, unit)}
              </p>

              <p className="mt-4 text-sm text-muted">
                বাকি আছে:{' '}
                <span className="font-medium text-text">
                  {formatBanglaNumber(batch.available_quantity)} {formatUnit(unit)}
                </span>
              </p>

              <div className="mt-4">
                <div className="flex items-center justify-between gap-2 text-xs text-muted">
                  <span>
                    {formatBanglaNumber(batch.reserved_quantity)} /{' '}
                    {formatBanglaNumber(batch.total_quantity)} {formatUnit(unit)}
                  </span>
                  <span>{formatBanglaNumber(Math.round(percent))}%</span>
                </div>
                <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-primary/10">
                  <div
                    className="h-full rounded-full bg-accent"
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>

              <dl className="mt-5 space-y-1.5 text-sm text-muted">
                {deliveryDate ? (
                  <div className="flex flex-wrap gap-x-2">
                    <dt>সম্ভাব্য ডেলিভারি:</dt>
                    <dd className="font-medium text-text">{deliveryDate}</dd>
                  </div>
                ) : null}
                {startDate ? (
                  <div className="flex flex-wrap gap-x-2">
                    <dt>প্রি-অর্ডার শুরু:</dt>
                    <dd className="font-medium text-text">{startDate}</dd>
                  </div>
                ) : null}
                {endDate ? (
                  <div className="flex flex-wrap gap-x-2">
                    <dt>প্রি-অর্ডার শেষ:</dt>
                    <dd className="font-medium text-text">{endDate}</dd>
                  </div>
                ) : null}
              </dl>

              <p className="mt-5 rounded-2xl border border-accent/20 bg-accent/10 px-4 py-3 text-sm text-text">
                শুধু ডেলিভারি চার্জ এখন পরিশোধ করতে হবে, বাকি টাকা ডেলিভারির সময়
              </p>

              {!isOpen ? (
                <p className="mt-4 text-sm font-medium text-muted">
                  এই ব্যাচ বন্ধ হয়ে গেছে
                </p>
              ) : !hasStock ? (
                <p className="mt-4 text-sm font-medium text-muted">স্টক শেষ</p>
              ) : (
                <>
                  <div className="mt-6 inline-flex items-center rounded-full bg-white shadow-sm ring-1 ring-primary/10">
                    <button
                      type="button"
                      aria-label="পরিমাণ কমান"
                      onClick={() =>
                        setQuantity((value) =>
                          stepQuantity(value, batch.available_quantity, -1, unit),
                        )
                      }
                      disabled={quantity <= minQuantity}
                      className="flex h-11 w-11 items-center justify-center rounded-full text-primary transition hover:bg-primary/8 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Minus className="h-4 w-4" strokeWidth={2} />
                    </button>
                    <span className="min-w-8 text-center text-base font-medium text-text">
                      {formatBanglaNumber(quantity)}
                    </span>
                    <button
                      type="button"
                      aria-label="পরিমাণ বাড়ান"
                      onClick={() =>
                        setQuantity((value) =>
                          stepQuantity(value, batch.available_quantity, 1, unit),
                        )
                      }
                      disabled={quantity >= batch.available_quantity}
                      className="flex h-11 w-11 items-center justify-center rounded-full text-primary transition hover:bg-primary/8 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Plus className="h-4 w-4" strokeWidth={2} />
                    </button>
                  </div>

                  <label
                    htmlFor="preorder-address"
                    className="mt-5 block text-sm font-medium text-text"
                  >
                    ডেলিভারি ঠিকানা
                  </label>
                  <textarea
                    id="preorder-address"
                    name="address_text"
                    required
                    rows={4}
                    value={addressText}
                    onChange={(event) => setAddressText(event.target.value)}
                    placeholder="বাসা/রোড, এলাকা, শহর"
                    className="mt-1.5 w-full resize-y rounded-xl border border-primary/15 bg-white px-3.5 py-2.5 text-sm text-text outline-none transition placeholder:text-muted/70 focus:border-primary focus:ring-2 focus:ring-primary/15"
                  />
                </>
              )}

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
                disabled={!canSubmit}
                className="mt-5 inline-flex w-full items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-medium text-cream shadow-[0_8px_20px_rgba(45,90,61,0.2)] transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
              >
                {submitting ? 'প্রি-অর্ডার হচ্ছে...' : 'প্রি-অর্ডার কনফার্ম করুন'}
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  )
}
