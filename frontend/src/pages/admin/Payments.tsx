import { useEffect, useRef, useState } from 'react'
import { Check, Copy, Wallet } from 'lucide-react'
import {
  confirmPayment,
  getConfirmPaymentErrorMessage,
  getPendingPaymentClaims,
  getRejectPaymentErrorMessage,
  rejectPaymentClaim,
  type PendingPaymentClaim,
} from '../../api/admin/payments'
import type { OrderItem } from '../../types'
import { formatBanglaDate, formatBanglaNumber, toBanglaDigits } from '../../utils/bangla'

function toNumber(value: unknown, fallback = 0): number {
  const numeric = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(numeric) ? numeric : fallback
}

function formatTaka(amount: unknown) {
  return `৳${formatBanglaNumber(toNumber(amount))}`
}

function getClaimItems(claim: PendingPaymentClaim): OrderItem[] {
  if (Array.isArray(claim.items)) {
    return claim.items
  }

  if (Array.isArray(claim.order_items)) {
    return claim.order_items
  }

  return []
}

function formatRelativeTime(value: string | null | undefined): string {
  if (!value) {
    return '—'
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return '—'
  }

  const diffMs = Date.now() - date.getTime()

  if (diffMs < 0) {
    return formatBanglaDate(date) ?? '—'
  }

  const minutes = Math.floor(diffMs / 60_000)

  if (minutes < 1) {
    return 'এইমাত্র'
  }

  if (minutes < 60) {
    return `${toBanglaDigits(minutes)} মিনিট আগে`
  }

  const hours = Math.floor(minutes / 60)

  if (hours < 24) {
    return `${toBanglaDigits(hours)} ঘণ্টা আগে`
  }

  const days = Math.floor(hours / 24)

  if (days < 7) {
    return `${toBanglaDigits(days)} দিন আগে`
  }

  return formatBanglaDate(date) ?? '—'
}

async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch {
    // Fall through to the non-clipboard path.
  }

  try {
    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.setAttribute('readonly', '')
    textarea.style.position = 'fixed'
    textarea.style.left = '-9999px'
    document.body.appendChild(textarea)
    textarea.select()
    const copied = document.execCommand('copy')
    document.body.removeChild(textarea)
    return copied
  } catch {
    return false
  }
}

export default function Payments() {
  const [claims, setClaims] = useState<PendingPaymentClaim[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null,
  )
  const [reloadKey, setReloadKey] = useState(0)
  const [busyOrderId, setBusyOrderId] = useState<number | null>(null)
  const [copiedOrderId, setCopiedOrderId] = useState<number | null>(null)
  const inflightRef = useRef<Set<number>>(new Set())

  useEffect(() => {
    let isCancelled = false

    setIsLoading(true)
    setError(null)

    getPendingPaymentClaims()
      .then((data) => {
        if (!isCancelled) {
          setClaims(data)
        }
      })
      .catch(() => {
        if (!isCancelled) {
          setClaims([])
          setError('পেমেন্ট ক্লেইম লোড করা যায়নি। আবার চেষ্টা করুন।')
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
  }, [reloadKey])

  function removeClaim(orderId: number) {
    setClaims((current) => current.filter((claim) => claim.id !== orderId))
  }

  async function handleConfirm(claim: PendingPaymentClaim) {
    if (inflightRef.current.has(claim.id)) {
      return
    }

    inflightRef.current.add(claim.id)
    setBusyOrderId(claim.id)

    const confirmed = window.confirm('এই পেমেন্টটি নিশ্চিত করতে চান?')

    if (!confirmed) {
      inflightRef.current.delete(claim.id)
      setBusyOrderId(null)
      return
    }

    setNotice(null)

    try {
      await confirmPayment(claim.id)
      removeClaim(claim.id)
      setNotice({ type: 'success', text: 'পেমেন্ট নিশ্চিত করা হয়েছে' })
    } catch (actionError) {
      setNotice({ type: 'error', text: getConfirmPaymentErrorMessage(actionError) })
    } finally {
      inflightRef.current.delete(claim.id)
      setBusyOrderId(null)
    }
  }

  async function handleReject(claim: PendingPaymentClaim) {
    if (inflightRef.current.has(claim.id)) {
      return
    }

    inflightRef.current.add(claim.id)
    setBusyOrderId(claim.id)

    const reason = window.prompt('বাতিলের কারণ লিখুন (ঐচ্ছিক)')

    if (reason === null) {
      inflightRef.current.delete(claim.id)
      setBusyOrderId(null)
      return
    }

    setNotice(null)

    try {
      await rejectPaymentClaim(claim.id, reason)
      removeClaim(claim.id)
      setNotice({ type: 'success', text: 'পেমেন্ট ক্লেইম বাতিল করা হয়েছে' })
    } catch (actionError) {
      setNotice({ type: 'error', text: getRejectPaymentErrorMessage(actionError) })
    } finally {
      inflightRef.current.delete(claim.id)
      setBusyOrderId(null)
    }
  }

  async function handleCopyCode(claim: PendingPaymentClaim) {
    const code = claim.order_code?.trim()

    if (!code) {
      return
    }

    const copied = await copyText(code)

    if (copied) {
      setCopiedOrderId(claim.id)
      window.setTimeout(() => {
        setCopiedOrderId((current) => (current === claim.id ? null : current))
      }, 1500)
    }
  }

  return (
    <section>
      <div>
        <h2 className="text-xl font-semibold text-neutral-900">পেমেন্ট ভেরিফাই</h2>
        <p className="mt-1 text-sm text-neutral-500">
          bKash SMS বা স্টেটমেন্টের সাথে কাস্টমারের পেমেন্ট ক্লেইম মিলিয়ে দেখুন
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

      {isLoading ? (
        <div className="mt-6 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
          <div className="space-y-3">
            <div className="h-24 animate-pulse rounded-xl bg-neutral-100" />
            <div className="h-24 animate-pulse rounded-xl bg-neutral-100" />
          </div>
          <p className="mt-3 text-sm text-neutral-500">পেমেন্ট ক্লেইম লোড হচ্ছে...</p>
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

      {!isLoading && !error && claims.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-neutral-200 bg-white p-10 text-center shadow-sm">
          <Wallet className="mx-auto h-8 w-8 text-neutral-300" strokeWidth={1.5} />
          <p className="mt-3 font-medium text-neutral-900">
            যাচাই করার মতো কোনো পেমেন্ট নেই
          </p>
        </div>
      ) : null}

      {!isLoading && !error && claims.length > 0 ? (
        <div className="mt-6 space-y-4">
          {claims.map((claim) => {
            const isBusy = busyOrderId === claim.id
            const isPreorder = claim.order_type?.toLowerCase() === 'preorder'
            const items = getClaimItems(claim)
            const orderCode = claim.order_code?.trim() || '—'
            const bkashNumber = claim.bkash_number_used?.trim()
            const trxDigits = claim.bkash_trx_last_digits?.trim() || ''

            return (
              <article
                key={claim.id}
                className="min-w-0 overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm"
              >
                <div className="grid gap-4 p-4 sm:p-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
                  <div className="min-w-0">
                    <div className="flex min-w-0 flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
                          অর্ডার কোড
                        </p>
                        <div className="mt-1 flex min-w-0 items-center gap-2">
                          <p className="min-w-0 break-all font-mono text-xl font-semibold tracking-wide text-neutral-900 sm:text-2xl">
                            {orderCode}
                          </p>
                          {claim.order_code?.trim() ? (
                            <button
                              type="button"
                              aria-label="অর্ডার কোড কপি করুন"
                              onClick={() => {
                                void handleCopyCode(claim)
                              }}
                              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-neutral-200 text-neutral-600 hover:bg-neutral-50"
                            >
                              {copiedOrderId === claim.id ? (
                                <Check className="h-4 w-4 text-primary" strokeWidth={2} />
                              ) : (
                                <Copy className="h-4 w-4" strokeWidth={1.75} />
                              )}
                            </button>
                          ) : null}
                        </div>
                      </div>
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          isPreorder
                            ? 'bg-accent/15 text-accent'
                            : 'bg-neutral-100 text-neutral-700'
                        }`}
                      >
                        {isPreorder ? 'প্রি-অর্ডার' : 'নরমাল'}
                      </span>
                    </div>

                    <p className="mt-4 text-3xl font-semibold tracking-tight text-accent sm:text-4xl">
                      {formatTaka(claim.total_amount)}
                    </p>
                    <p className="mt-1 text-xs text-neutral-500">
                      SMS/স্টেটমেন্টের সাথে এই অ্যামাউন্ট মিলিয়ে দেখুন
                    </p>

                    <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                      <div className="min-w-0">
                        <dt className="text-xs text-neutral-500">কাস্টমার</dt>
                        <dd className="mt-0.5 wrap-break-word font-medium text-neutral-900">
                          {claim.customer_name?.trim() || '—'}
                        </dd>
                      </div>
                      <div className="min-w-0">
                        <dt className="text-xs text-neutral-500">ফোন</dt>
                        <dd className="mt-0.5 break-all font-medium text-neutral-900">
                          {claim.customer_phone?.trim() || '—'}
                        </dd>
                      </div>
                      <div className="min-w-0">
                        <dt className="text-xs text-neutral-500">bKash নম্বর</dt>
                        <dd className="mt-0.5 break-all font-medium text-neutral-900">
                          {bkashNumber || 'দেওয়া হয়নি'}
                        </dd>
                      </div>
                      <div className="min-w-0">
                        <dt className="text-xs text-neutral-500">সাবমিট সময়</dt>
                        <dd className="mt-0.5 font-medium text-neutral-900">
                          {formatRelativeTime(claim.payment_submitted_at)}
                        </dd>
                      </div>
                    </dl>
                  </div>

                  <div className="min-w-0 rounded-xl border border-neutral-200 bg-neutral-50 p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
                      ট্রানজেকশন শেষ ৩ ডিজিট
                    </p>
                    <p className="mt-2 font-mono text-4xl font-bold tracking-[0.35em] text-primary sm:text-5xl">
                      {trxDigits || '—'}
                    </p>
                    <p className="mt-3 text-xs text-neutral-500">
                      bKash SMS-এর TrxID-এর শেষ তিন অঙ্কের সাথে মিলিয়ে দেখুন
                    </p>

                    <div className="mt-5 min-w-0">
                      <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
                        অর্ডার আইটেম
                      </p>
                      {items.length === 0 ? (
                        <p className="mt-2 text-sm text-neutral-500">
                          পণ্যের তালিকা পাওয়া যায়নি।
                        </p>
                      ) : (
                        <ul className="mt-2 divide-y divide-neutral-200">
                          {items.map((item, index) => {
                            const quantity = toNumber(item.quantity)
                            const unitPrice = toNumber(item.unit_price)

                            return (
                              <li
                                key={item.id ?? `${item.product_id}-${index}`}
                                className="flex min-w-0 items-start justify-between gap-3 py-2 first:pt-0 last:pb-0"
                              >
                                <div className="min-w-0">
                                  <p className="wrap-break-word text-sm font-medium text-neutral-900">
                                    {item.product_name?.trim() || 'অজানা পণ্য'}
                                  </p>
                                  <p className="mt-0.5 text-xs text-neutral-500">
                                    পরিমাণ {formatBanglaNumber(quantity)} · ইউনিট{' '}
                                    {formatTaka(unitPrice)}
                                  </p>
                                </div>
                              </li>
                            )
                          })}
                        </ul>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2 border-t border-neutral-100 bg-neutral-50/80 p-4 sm:flex-row sm:items-center sm:justify-end">
                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={() => {
                      void handleConfirm(claim)
                    }}
                    className="inline-flex min-h-10 items-center justify-center rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isBusy ? 'অপেক্ষা করুন...' : 'কনফার্ম করুন'}
                  </button>
                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={() => {
                      void handleReject(claim)
                    }}
                    className="inline-flex min-h-10 items-center justify-center rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    বাতিল করুন
                  </button>
                </div>
              </article>
            )
          })}
        </div>
      ) : null}
    </section>
  )
}
