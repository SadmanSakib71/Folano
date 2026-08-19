import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { Package, ShoppingBasket } from 'lucide-react'
import { getMyOrders } from '../api/orders'
import { useAuth } from '../context/AuthContext'
import type { Order, OrderItem } from '../types'
import { formatBanglaDate, formatBanglaNumber, toBanglaDigits } from '../utils/bangla'

const STATUS_LABELS: Record<string, string> = {
  pending: 'পেন্ডিং',
  confirmed: 'কনফার্মড',
  processing: 'প্রসেসিং',
  out_for_delivery: 'ডেলিভারির পথে',
  delivered: 'ডেলিভারড',
  cancelled: 'বাতিল',
}

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800',
  confirmed: 'bg-blue-100 text-blue-800',
  processing: 'bg-purple-100 text-purple-800',
  out_for_delivery: 'bg-orange-100 text-orange-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
}

const PAYMENT_LABELS: Record<string, string> = {
  unpaid: 'অপরিশোধিত',
  partial: 'আংশিক',
  paid: 'পরিশোধিত',
}

const PAYMENT_STYLES: Record<string, string> = {
  unpaid: 'bg-red-50 text-red-700',
  partial: 'bg-amber-50 text-amber-800',
  paid: 'bg-green-50 text-green-800',
}

function formatTaka(amount: number) {
  return `৳${formatBanglaNumber(amount)}`
}

function toNumber(value: unknown, fallback = 0): number {
  const numeric = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(numeric) ? numeric : fallback
}

function getOrderItems(order: Order): OrderItem[] {
  if (Array.isArray(order.items)) {
    return order.items
  }

  if (Array.isArray(order.order_items)) {
    return order.order_items
  }

  return []
}

function getItemName(item: OrderItem): string {
  const name = item.product_name?.trim()
  return name || 'অজানা পণ্য'
}

function sortNewestFirst(orders: Order[]) {
  return [...orders].sort((a, b) => {
    const aTime = new Date(a.created_at).getTime()
    const bTime = new Date(b.created_at).getTime()
    const aValid = Number.isFinite(aTime) ? aTime : 0
    const bValid = Number.isFinite(bTime) ? bTime : 0
    return bValid - aValid
  })
}

function parseOrders(data: unknown): Order[] {
  if (!Array.isArray(data)) {
    return []
  }

  return sortNewestFirst(data as Order[])
}

function Badge({
  label,
  className,
}: {
  label: string
  className: string
}) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${className}`}
    >
      {label}
    </span>
  )
}

function OrdersSkeleton() {
  return (
    <div className="mt-8 space-y-4" aria-hidden="true">
      {Array.from({ length: 3 }, (_, index) => (
        <div
          key={index}
          className="h-44 animate-pulse rounded-2xl bg-white shadow-sm"
        />
      ))}
    </div>
  )
}

function OrderCard({ order }: { order: Order }) {
  const items = getOrderItems(order)
  const createdAt = formatBanglaDate(order.created_at)
  const deliveryDate = formatBanglaDate(order.expected_delivery_date)
  const statusKey = order.status?.toLowerCase() ?? ''
  const paymentKey = order.payment_status?.toLowerCase() ?? ''
  const isPreorder = order.order_type?.toLowerCase() === 'preorder'

  return (
    <article className="overflow-hidden rounded-2xl border border-primary/10 bg-white shadow-sm">
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-primary/10 px-4 py-4 sm:px-5">
        <div className="min-w-0">
          <h2 className="font-heading text-lg font-semibold text-text">
            অর্ডার #{toBanglaDigits(order.id)}
          </h2>
          {createdAt ? (
            <p className="mt-1 text-sm text-muted">{createdAt}</p>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge
            label={STATUS_LABELS[statusKey] ?? order.status}
            className={STATUS_STYLES[statusKey] ?? 'bg-primary/10 text-primary'}
          />
          {isPreorder ? (
            <Badge
              label="প্রি-অর্ডার"
              className="bg-accent/15 text-accent"
            />
          ) : null}
          <Badge
            label={PAYMENT_LABELS[paymentKey] ?? order.payment_status}
            className={PAYMENT_STYLES[paymentKey] ?? 'bg-primary/8 text-muted'}
          />
        </div>
      </header>

      <div className="px-4 py-4 sm:px-5">
        {items.length === 0 ? (
          <p className="text-sm text-muted">পণ্যের তালিকা পাওয়া যায়নি।</p>
        ) : (
          <ul className="divide-y divide-primary/8">
            {items.map((item, index) => {
              const quantity = toNumber(item.quantity)
              const unitPrice = toNumber(item.unit_price)
              const lineTotal =
                item.subtotal != null ? toNumber(item.subtotal) : quantity * unitPrice

              return (
                <li
                  key={item.id ?? `${item.product_id}-${index}`}
                  className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1 py-2.5 first:pt-0 last:pb-0"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-text">
                      {getItemName(item)}
                    </p>
                    <p className="mt-0.5 text-xs text-muted">
                      {formatBanglaNumber(quantity)} × {formatTaka(unitPrice)}
                    </p>
                  </div>
                  <p className="shrink-0 text-sm font-medium text-text">
                    {formatTaka(lineTotal)}
                  </p>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      <footer className="flex flex-wrap items-end justify-between gap-3 border-t border-primary/10 bg-cream/70 px-4 py-4 sm:px-5">
        {deliveryDate ? (
          <p className="text-sm text-muted">
            সম্ভাব্য ডেলিভারি:{' '}
            <span className="font-medium text-text">{deliveryDate}</span>
          </p>
        ) : (
          <span />
        )}
        <p className="ml-auto font-heading text-lg font-semibold text-accent">
          মোট {formatTaka(toNumber(order.total_amount))}
        </p>
      </footer>
    </article>
  )
}

export default function MyOrders() {
  const { isAuthenticated, loading: authLoading } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    if (authLoading || !isAuthenticated) {
      return
    }

    let isCancelled = false

    setIsLoading(true)
    setHasError(false)

    getMyOrders()
      .then((data) => {
        if (!isCancelled) {
          setOrders(parseOrders(data))
        }
      })
      .catch(() => {
        if (!isCancelled) {
          setOrders([])
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
  }, [authLoading, isAuthenticated])

  if (authLoading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="h-8 w-40 animate-pulse rounded-lg bg-primary/10" />
        <OrdersSkeleton />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <p className="text-sm font-medium text-accent">ফলের দোকান</p>
      <h1 className="mt-1 font-heading text-3xl font-semibold text-text sm:text-4xl">
        আমার অর্ডার
      </h1>
      <p className="mt-2 max-w-xl text-sm text-muted">
        আপনার সব অর্ডার এখানে দেখতে পাবেন।
      </p>

      {isLoading ? (
        <OrdersSkeleton />
      ) : hasError ? (
        <div className="mt-8 rounded-2xl border border-primary/10 bg-white px-6 py-16 text-center shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Package className="h-8 w-8 text-primary" strokeWidth={1.5} />
          </div>
          <p className="mt-4 font-heading text-lg font-semibold text-text">
            অর্ডার লোড করা যায়নি
          </p>
          <p className="mt-1 text-sm text-muted">
            একটু পরে আবার চেষ্টা করুন।
          </p>
        </div>
      ) : orders.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-primary/10 bg-white px-6 py-16 text-center shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <ShoppingBasket className="h-8 w-8 text-primary" strokeWidth={1.5} />
          </div>
          <p className="mt-4 font-heading text-lg font-semibold text-text">
            এখনো কোনো অর্ডার নেই
          </p>
          <p className="mt-1 text-sm text-muted">
            তাজা ফল বেছে নিন, কেনাকাটা শুরু করুন।
          </p>
          <Link
            to="/products"
            className="mt-5 inline-flex rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-cream shadow-[0_8px_20px_rgba(45,90,61,0.2)] transition hover:bg-primary/90"
          >
            কেনাকাটা শুরু করুন
          </Link>
        </div>
      ) : (
        <div className="mt-8 space-y-4">
          {orders.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>
      )}
    </div>
  )
}
