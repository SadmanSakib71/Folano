import { Fragment, useEffect, useState } from 'react'
import {
  getAdminOrderErrorMessage,
  getAllOrders,
  updateOrderStatus,
  updatePaymentStatus,
} from '../../api/admin/orders'
import type { Order, OrderItem } from '../../types'
import { formatBanglaDate, formatBanglaNumber } from '../../utils/bangla'

const STATUS_FILTERS = [
  { value: 'all', label: 'সব' },
  { value: 'pending', label: 'পেন্ডিং' },
  { value: 'confirmed', label: 'কনফার্মড' },
  { value: 'processing', label: 'প্রসেসিং' },
  { value: 'out_for_delivery', label: 'ডেলিভারির পথে' },
  { value: 'delivered', label: 'ডেলিভারড' },
  { value: 'cancelled', label: 'বাতিল' },
] as const

const ORDER_TYPE_FILTERS = [
  { value: 'all', label: 'সব' },
  { value: 'normal', label: 'নরমাল' },
  { value: 'preorder', label: 'প্রি-অর্ডার' },
] as const

const STATUS_OPTIONS = STATUS_FILTERS.filter((option) => option.value !== 'all')
const PAYMENT_OPTIONS = [
  { value: 'unpaid', label: 'অপরিশোধিত' },
  { value: 'partial', label: 'আংশিক' },
  { value: 'paid', label: 'পরিশোধিত' },
] as const

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

const filterSelectClass =
  'w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 sm:w-auto'

const rowSelectClass =
  'w-full min-w-[8.5rem] rounded-lg border border-neutral-200 bg-white px-2 py-1.5 text-xs text-neutral-800 outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 disabled:cursor-not-allowed disabled:opacity-60'

function toNumber(value: unknown, fallback = 0): number {
  const numeric = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(numeric) ? numeric : fallback
}

function formatTaka(amount: unknown) {
  return `৳${formatBanglaNumber(toNumber(amount))}`
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

function Badge({ label, className }: { label: string; className: string }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${className}`}>
      {label}
    </span>
  )
}

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([])
  const [statusFilter, setStatusFilter] = useState('all')
  const [orderTypeFilter, setOrderTypeFilter] = useState('all')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null,
  )
  const [reloadKey, setReloadKey] = useState(0)
  const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null)
  const [statusUpdatingId, setStatusUpdatingId] = useState<number | null>(null)
  const [paymentUpdatingId, setPaymentUpdatingId] = useState<number | null>(null)
  const [pendingStatus, setPendingStatus] = useState<Record<number, string>>({})
  const [pendingPayment, setPendingPayment] = useState<Record<number, string>>({})

  useEffect(() => {
    let isCancelled = false

    setIsLoading(true)
    setError(null)

    getAllOrders({
      status: statusFilter,
      order_type: orderTypeFilter,
    })
      .then((data) => {
        if (!isCancelled) {
          setOrders(data)
        }
      })
      .catch(() => {
        if (!isCancelled) {
          setOrders([])
          setError('অর্ডার লোড করা যায়নি। আবার চেষ্টা করুন।')
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
  }, [orderTypeFilter, reloadKey, statusFilter])

  function toggleDetails(orderId: number) {
    setExpandedOrderId((current) => (current === orderId ? null : orderId))
  }

  async function handleStatusChange(order: Order, nextStatus: string) {
    if (nextStatus === order.status || statusUpdatingId === order.id) {
      return
    }

    setStatusUpdatingId(order.id)
    setPendingStatus((current) => ({ ...current, [order.id]: nextStatus }))
    setNotice(null)

    try {
      await updateOrderStatus(order.id, nextStatus)
      setOrders((current) =>
        current.map((item) =>
          item.id === order.id ? { ...item, status: nextStatus } : item,
        ),
      )
      setNotice({ type: 'success', text: 'অর্ডার স্ট্যাটাস আপডেট হয়েছে' })
    } catch (updateError) {
      setNotice({ type: 'error', text: getAdminOrderErrorMessage(updateError) })
    } finally {
      setStatusUpdatingId(null)
      setPendingStatus((current) => {
        const next = { ...current }
        delete next[order.id]
        return next
      })
    }
  }

  async function handlePaymentChange(order: Order, nextPaymentStatus: string) {
    if (nextPaymentStatus === order.payment_status || paymentUpdatingId === order.id) {
      return
    }

    setPaymentUpdatingId(order.id)
    setPendingPayment((current) => ({ ...current, [order.id]: nextPaymentStatus }))
    setNotice(null)

    try {
      await updatePaymentStatus(order.id, nextPaymentStatus)
      setOrders((current) =>
        current.map((item) =>
          item.id === order.id
            ? { ...item, payment_status: nextPaymentStatus }
            : item,
        ),
      )
      setNotice({ type: 'success', text: 'পেমেন্ট স্ট্যাটাস আপডেট হয়েছে' })
    } catch (updateError) {
      setNotice({ type: 'error', text: getAdminOrderErrorMessage(updateError) })
    } finally {
      setPaymentUpdatingId(null)
      setPendingPayment((current) => {
        const next = { ...current }
        delete next[order.id]
        return next
      })
    }
  }

  return (
    <section>
      <div>
        <h2 className="text-xl font-semibold text-neutral-900">অর্ডার ম্যানেজমেন্ট</h2>
        <p className="mt-1 text-sm text-neutral-500">
          কাস্টমার অর্ডার দেখুন এবং স্ট্যাটাস ও পেমেন্ট আপডেট করুন
        </p>
      </div>

      {notice ? (
        <p
          className={`mt-4 rounded-xl px-3 py-2.5 text-sm ${
            notice.type === 'success'
              ? 'bg-primary/10 text-primary'
              : 'bg-red-50 text-red-700'
          }`}
          role={notice.type === 'success' ? 'status' : 'alert'}
        >
          {notice.text}
        </p>
      ) : null}

      <div className="mt-6 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
          <label className="block min-w-[10rem] flex-1 sm:flex-none">
            <span className="mb-1.5 block text-xs font-medium text-neutral-600">
              স্ট্যাটাস
            </span>
            <select
              aria-label="স্ট্যাটাস ফিল্টার"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className={filterSelectClass}
            >
              {STATUS_FILTERS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block min-w-[10rem] flex-1 sm:flex-none">
            <span className="mb-1.5 block text-xs font-medium text-neutral-600">
              অর্ডার টাইপ
            </span>
            <select
              aria-label="অর্ডার টাইপ ফিল্টার"
              value={orderTypeFilter}
              onChange={(event) => setOrderTypeFilter(event.target.value)}
              className={filterSelectClass}
            >
              {ORDER_TYPE_FILTERS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {isLoading ? (
        <div className="mt-6 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
          <div className="space-y-3">
            <div className="h-10 animate-pulse rounded-lg bg-neutral-100" />
            <div className="h-10 animate-pulse rounded-lg bg-neutral-100" />
            <div className="h-10 animate-pulse rounded-lg bg-neutral-100" />
          </div>
          <p className="mt-3 text-sm text-neutral-500">অর্ডার লোড হচ্ছে...</p>
        </div>
      ) : null}

      {!isLoading && error ? (
        <div className="mt-6 rounded-2xl border border-red-100 bg-white p-6 text-center shadow-sm">
          <p className="font-medium text-neutral-900">লোড করা যায়নি</p>
          <p className="mt-1 text-sm text-neutral-500">{error}</p>
          <button
            type="button"
            onClick={() => setReloadKey((current) => current + 1)}
            className="mt-4 inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
          >
            আবার চেষ্টা করুন
          </button>
        </div>
      ) : null}

      {!isLoading && !error && orders.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-neutral-200 bg-white p-10 text-center shadow-sm">
          <p className="font-medium text-neutral-900">কোনো অর্ডার নেই</p>
        </div>
      ) : null}

      {!isLoading && !error && orders.length > 0 ? (
        <div className="mt-6 overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-[1080px] w-full text-left text-sm">
              <thead className="bg-neutral-50 text-neutral-600">
                <tr>
                  <th className="px-4 py-3 font-medium">Order ID</th>
                  <th className="px-4 py-3 font-medium">Customer</th>
                  <th className="px-4 py-3 font-medium">Order Type</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Payment</th>
                  <th className="px-4 py-3 font-medium">Total</th>
                  <th className="px-4 py-3 font-medium">Order Date</th>
                  <th className="px-4 py-3 font-medium">Expected Delivery</th>
                  <th className="px-4 py-3 font-medium">Details</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => {
                  const statusKey = (pendingStatus[order.id] ?? order.status)?.toLowerCase()
                  const paymentKey = (
                    pendingPayment[order.id] ?? order.payment_status
                  )?.toLowerCase()
                  const isPreorder = order.order_type?.toLowerCase() === 'preorder'
                  const isExpanded = expandedOrderId === order.id
                  const items = getOrderItems(order)
                  const isStatusUpdating = statusUpdatingId === order.id
                  const isPaymentUpdating = paymentUpdatingId === order.id

                  return (
                    <Fragment key={order.id}>
                      <tr className="border-t border-neutral-100 align-top">
                        <td className="px-4 py-3 font-medium text-neutral-900">
                          #{formatBanglaNumber(order.id)}
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-neutral-900">
                            {order.customer_name?.trim() || '—'}
                          </p>
                          <p className="mt-0.5 text-xs text-neutral-500">
                            {order.customer_phone?.trim() || '—'}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            label={isPreorder ? 'প্রি-অর্ডার' : 'নরমাল'}
                            className={
                              isPreorder
                                ? 'bg-accent/15 text-accent'
                                : 'bg-neutral-100 text-neutral-700'
                            }
                          />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex min-w-[9rem] flex-col gap-1.5">
                            <Badge
                              label={STATUS_LABELS[statusKey] ?? order.status}
                              className={
                                STATUS_STYLES[statusKey] ?? 'bg-neutral-100 text-neutral-700'
                              }
                            />
                            <select
                              aria-label="অর্ডার স্ট্যাটাস"
                              value={statusKey}
                              disabled={isStatusUpdating}
                              onChange={(event) =>
                                handleStatusChange(order, event.target.value)
                              }
                              className={rowSelectClass}
                            >
                              {STATUS_OPTIONS.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                            {isStatusUpdating ? (
                              <span className="text-[11px] text-neutral-500">
                                আপডেট হচ্ছে...
                              </span>
                            ) : null}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex min-w-[8.5rem] flex-col gap-1.5">
                            <Badge
                              label={PAYMENT_LABELS[paymentKey] ?? order.payment_status}
                              className={
                                PAYMENT_STYLES[paymentKey] ??
                                'bg-neutral-100 text-neutral-700'
                              }
                            />
                            <select
                              aria-label="পেমেন্ট স্ট্যাটাস"
                              value={paymentKey}
                              disabled={isPaymentUpdating}
                              onChange={(event) =>
                                handlePaymentChange(order, event.target.value)
                              }
                              className={rowSelectClass}
                            >
                              {PAYMENT_OPTIONS.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                            {isPaymentUpdating ? (
                              <span className="text-[11px] text-neutral-500">
                                আপডেট হচ্ছে...
                              </span>
                            ) : null}
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 font-medium text-neutral-900">
                          {formatTaka(order.total_amount)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-neutral-600">
                          {formatBanglaDate(order.created_at) ?? '—'}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-neutral-600">
                          {formatBanglaDate(order.expected_delivery_date) ?? '—'}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            aria-expanded={isExpanded}
                            onClick={() => toggleDetails(order.id)}
                            className="rounded-lg border border-neutral-200 px-2.5 py-1 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
                          >
                            {isExpanded ? 'লুকান' : 'বিস্তারিত'}
                          </button>
                        </td>
                      </tr>
                      {isExpanded ? (
                        <tr className="border-t border-neutral-100 bg-neutral-50/80">
                          <td colSpan={9} className="px-4 py-4">
                            <OrderDetailsPanel order={order} items={items} />
                          </td>
                        </tr>
                      ) : null}
                    </Fragment>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </section>
  )
}

function OrderDetailsPanel({ order, items }: { order: Order; items: OrderItem[] }) {
  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(16rem,0.8fr)]">
      <div className="min-w-0 rounded-xl border border-neutral-200 bg-white p-3">
        <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
          পণ্য
        </p>
        {items.length === 0 ? (
          <p className="mt-2 text-sm text-neutral-500">পণ্যের তালিকা পাওয়া যায়নি।</p>
        ) : (
          <ul className="mt-2 divide-y divide-neutral-100">
            {items.map((item, index) => {
              const quantity = toNumber(item.quantity)
              const unitPrice = toNumber(item.unit_price)

              return (
                <li
                  key={item.id ?? `${item.product_id}-${index}`}
                  className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1 py-2 first:pt-0 last:pb-0"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-neutral-900">
                      {item.product_name?.trim() || 'অজানা পণ্য'}
                    </p>
                    <p className="mt-0.5 text-xs text-neutral-500">
                      পরিমাণ {formatBanglaNumber(quantity)} · ইউনিট মূল্য {formatTaka(unitPrice)}
                      {item.batch_id != null ? (
                        <> · ব্যাচ আইডি #{formatBanglaNumber(item.batch_id)}</>
                      ) : null}
                    </p>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      <div className="min-w-0 rounded-xl border border-neutral-200 bg-white p-3">
        <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
          ডেলিভারি ও মোট
        </p>
        <p className="mt-2 text-sm text-neutral-700">
          <span className="text-neutral-500">ঠিকানা: </span>
          {order.address_text?.trim() || '—'}
        </p>
        <dl className="mt-3 space-y-1.5 text-sm">
          <div className="flex items-center justify-between gap-3">
            <dt className="text-neutral-500">সাবটোটাল</dt>
            <dd className="font-medium text-neutral-900">{formatTaka(order.subtotal)}</dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="text-neutral-500">ডেলিভারি চার্জ</dt>
            <dd className="font-medium text-neutral-900">
              {formatTaka(order.delivery_charge)}
            </dd>
          </div>
          <div className="flex items-center justify-between gap-3 border-t border-neutral-100 pt-2">
            <dt className="font-medium text-neutral-700">মোট</dt>
            <dd className="font-semibold text-primary">{formatTaka(order.total_amount)}</dd>
          </div>
        </dl>
      </div>
    </div>
  )
}
