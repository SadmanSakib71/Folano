import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Check, CheckCircle2, Copy, MessageCircle } from 'lucide-react'
import {
  getPaymentClaimErrorMessage,
  submitPaymentClaim,
  type CreatedOrder,
} from '../../api/orders'
import { BKASH_NUMBER, WHATSAPP_NUMBER } from '../../config/payment'
import { formatBanglaNumber } from '../../utils/bangla'

function formatTaka(amount: number) {
  return `৳${formatBanglaNumber(amount)}`
}

function isExactlyThreeDigits(value: string) {
  return /^\d{3}$/.test(value)
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

function CopyButton({
  value,
  copied,
  onCopied,
  label,
}: {
  value: string
  copied: boolean
  onCopied: () => void
  label: string
}) {
  async function handleCopy() {
    const ok = await copyText(value)

    if (ok) {
      onCopied()
    }
  }

  return (
    <button
      type="button"
      aria-live="polite"
      onClick={() => {
        void handleCopy()
      }}
      className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-primary/15 bg-cream px-3 py-2 text-xs font-medium text-primary transition hover:bg-primary/8 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
    >
      {copied ? (
        <>
          <Check className="h-3.5 w-3.5" strokeWidth={2} />
          কপি হয়েছে
        </>
      ) : (
        <>
          <Copy className="h-3.5 w-3.5" strokeWidth={2} />
          {label}
        </>
      )}
    </button>
  )
}

function InstructionStep({
  number,
  children,
}: {
  number: string
  children: ReactNode
}) {
  return (
    <li className="flex gap-3 rounded-2xl border border-primary/10 bg-white p-4 shadow-sm sm:p-5">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-medium text-cream">
        {number}
      </span>
      <div className="min-w-0 flex-1 text-sm text-text">{children}</div>
    </li>
  )
}

function OrderCreatedFallback() {
  return (
    <div className="mx-auto max-w-2xl rounded-2xl border border-primary/10 bg-white px-6 py-16 text-center shadow-sm">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
        <CheckCircle2 className="h-8 w-8 text-primary" strokeWidth={1.5} />
      </div>
      <p className="mt-4 font-heading text-lg font-semibold text-text">
        আপনার অর্ডার তৈরি হয়েছে
      </p>
      <p className="mt-2 text-sm text-muted">
        পেমেন্ট ধাপ লোড করা যায়নি। আমার অর্ডার পেজে গিয়ে স্ট্যাটাস দেখুন।
      </p>
      <Link
        to="/orders"
        className="mt-5 inline-flex rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-cream shadow-[0_8px_20px_rgba(45,90,61,0.2)] transition hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        আমার অর্ডার দেখুন
      </Link>
    </div>
  )
}

export default function PaymentStep({ order }: { order: CreatedOrder | null }) {
  const [bkashNumberUsed, setBkashNumberUsed] = useState('')
  const [trxLastDigits, setTrxLastDigits] = useState('')
  const [trxError, setTrxError] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [copiedKey, setCopiedKey] = useState<'order' | 'bkash' | null>(null)
  const inFlightRef = useRef(false)
  const copiedTimeoutRef = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (copiedTimeoutRef.current !== null) {
        window.clearTimeout(copiedTimeoutRef.current)
      }
    }
  }, [])

  if (!order) {
    return <OrderCreatedFallback />
  }

  const amountLabel = formatTaka(order.total_amount)
  const whatsappMessage = `আসসালামু আলাইকুম,
আমার অর্ডার কোড: ${order.order_code}
পেমেন্ট এমাউন্ট: ${amountLabel}
Transaction শেষ ডিজিট: ${trxLastDigits.trim()}`
  const whatsappHref = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(whatsappMessage)}`

  function markCopied(key: 'order' | 'bkash') {
    setCopiedKey(key)

    if (copiedTimeoutRef.current !== null) {
      window.clearTimeout(copiedTimeoutRef.current)
    }

    copiedTimeoutRef.current = window.setTimeout(() => {
      setCopiedKey((current) => (current === key ? null : current))
    }, 2000)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!order || inFlightRef.current || submitting || submitted) {
      return
    }

    const digits = trxLastDigits.trim()

    if (!digits) {
      setTrxError('Transaction ID-এর শেষ ৩ ডিজিট দিন')
      return
    }

    if (!isExactlyThreeDigits(digits)) {
      setTrxError('Transaction ID-এর শেষ ৩ ডিজিট অবশ্যই ৩টি সংখ্যা হতে হবে')
      return
    }

    inFlightRef.current = true
    setSubmitting(true)
    setTrxError(null)
    setSubmitError(null)

    try {
      const trimmedBkashNumber = bkashNumberUsed.trim()
      await submitPaymentClaim(
        trimmedBkashNumber
          ? {
              order_id: order.id,
              bkash_number_used: trimmedBkashNumber,
              bkash_trx_last_digits: digits,
            }
          : {
              order_id: order.id,
              bkash_trx_last_digits: digits,
            },
      )
      setSubmitted(true)
    } catch (error) {
      setSubmitError(getPaymentClaimErrorMessage(error))
    } finally {
      inFlightRef.current = false
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto w-full min-w-0 max-w-2xl">
      <p className="text-sm font-medium text-accent">নিরাপদ পেমেন্ট</p>
      <h1 className="mt-1 font-heading text-3xl font-semibold text-text sm:text-4xl">
        বিকাশ পেমেন্ট করুন
      </h1>
      <p className="mt-2 text-sm text-muted">
        অর্ডার তৈরি হয়েছে। নিচের ধাপগুলো অনুসরণ করে পেমেন্ট সম্পন্ন করুন।
      </p>

      <section className="mt-6 rounded-2xl border border-primary/10 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-medium tracking-wide text-muted">অর্ডার কোড</p>
            <p className="mt-1 break-all font-heading text-2xl font-semibold tracking-wide text-text select-all sm:text-3xl">
              {order.order_code}
            </p>
          </div>
          <CopyButton
            value={order.order_code}
            copied={copiedKey === 'order'}
            onCopied={() => markCopied('order')}
            label="কপি করুন"
          />
        </div>
      </section>

      <ol className="mt-6 space-y-3">
        <InstructionStep number="১">
          <p>bKash এ যান এবং Send Money করুন এই নম্বরে:</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <p className="break-all font-heading text-lg font-semibold tracking-wide text-primary select-all">
              {BKASH_NUMBER}
            </p>
            <CopyButton
              value={BKASH_NUMBER}
              copied={copiedKey === 'bkash'}
              onCopied={() => markCopied('bkash')}
              label="কপি করুন"
            />
          </div>
        </InstructionStep>

        <InstructionStep number="২">
          <p>Reference/Reason এ আপনার Order Code লিখুন:</p>
          <p className="mt-2 break-all font-heading text-lg font-semibold tracking-wide text-text select-all">
            {order.order_code}
          </p>
        </InstructionStep>

        <InstructionStep number="৩">
          <p>পেমেন্টের পরিমাণ:</p>
          <p className="mt-2 font-heading text-xl font-semibold text-accent">
            {amountLabel}
          </p>
        </InstructionStep>

        <InstructionStep number="৪">
          <p>
            পেমেন্ট হয়ে গেলে নিচের ফর্মে Transaction ID-এর শেষ ৩ ডিজিট দিন।
          </p>
        </InstructionStep>
      </ol>

      {submitted ? (
        <div className="mt-6 rounded-2xl border border-primary/10 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <CheckCircle2 className="h-5 w-5 text-primary" strokeWidth={1.75} />
            </span>
            <div className="min-w-0">
              <p className="font-heading text-lg font-semibold text-text" role="status">
                পেমেন্ট তথ্য সাবমিট হয়েছে
              </p>
              <p className="mt-1 text-sm text-muted">
                আপনার পেমেন্ট তথ্য সফলভাবে সাবমিট হয়েছে। অ্যাডমিন verify করার পর
                অর্ডার কনফার্ম হবে।
              </p>
            </div>
          </div>

          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#128C7E] px-4 py-3 text-sm font-medium text-white shadow-[0_8px_20px_rgba(18,140,126,0.25)] transition hover:bg-[#0E7A6E] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            <MessageCircle className="h-4 w-4" strokeWidth={2} />
            WhatsApp এ কনফার্মেশন পাঠান
          </a>

          <p className="mt-4 text-sm text-muted">
            অ্যাডমিন verify করার পর আপনার অর্ডার কনফার্ম হবে। My Orders পেজে
            স্ট্যাটাস দেখতে পারবেন।
          </p>
          <Link
            to="/orders"
            className="mt-3 inline-flex text-sm font-medium text-primary underline-offset-4 transition hover:text-primary/80 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            আমার অর্ডার দেখুন
          </Link>
        </div>
      ) : (
        <form
          className="mt-6 rounded-2xl border border-primary/10 bg-white p-5 shadow-sm sm:p-6"
          onSubmit={handleSubmit}
          noValidate
        >
          <h2 className="font-heading text-xl font-semibold text-text">
            পেমেন্ট তথ্য দিন
          </h2>

          <label htmlFor="bkash-number-used" className="mt-5 block text-sm font-medium text-text">
            যে bKash নম্বর থেকে টাকা পাঠিয়েছেন
            <span className="ml-1 font-normal text-muted">(ঐচ্ছিক)</span>
          </label>
          <input
            id="bkash-number-used"
            name="bkash_number_used"
            type="tel"
            inputMode="numeric"
            autoComplete="tel"
            value={bkashNumberUsed}
            onChange={(event) => setBkashNumberUsed(event.target.value)}
            placeholder="01XXXXXXXXX"
            className="mt-1.5 w-full rounded-xl border border-primary/15 bg-cream px-3.5 py-2.5 text-sm text-text outline-none transition placeholder:text-muted/70 focus:border-primary focus:ring-2 focus:ring-primary/15"
          />

          <label
            htmlFor="trx-last-digits"
            className="mt-4 block text-sm font-medium text-text"
          >
            Transaction ID-এর শেষ ৩ ডিজিট
          </label>
          <input
            id="trx-last-digits"
            name="bkash_trx_last_digits"
            type="text"
            inputMode="numeric"
            autoComplete="off"
            value={trxLastDigits}
            aria-invalid={trxError ? true : undefined}
            aria-describedby={trxError ? 'trx-last-digits-error' : undefined}
            onChange={(event) => {
              setTrxLastDigits(event.target.value)
              if (trxError) {
                setTrxError(null)
              }
            }}
            placeholder="007"
            className="mt-1.5 w-full rounded-xl border border-primary/15 bg-cream px-3.5 py-2.5 text-sm tracking-widest text-text outline-none transition placeholder:text-muted/70 focus:border-primary focus:ring-2 focus:ring-primary/15"
          />
          {trxError ? (
            <p id="trx-last-digits-error" className="mt-1.5 text-sm text-[#9A4B12]" role="alert">
              {trxError}
            </p>
          ) : null}

          {submitError ? (
            <p
              className="mt-4 rounded-xl bg-[#F8E7DC] px-3 py-2.5 text-sm text-[#9A4B12]"
              role="alert"
            >
              {submitError}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={submitting}
            className="mt-5 w-full rounded-xl bg-primary py-3 text-sm font-medium text-cream shadow-[0_8px_20px_rgba(45,90,61,0.22)] transition hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-70"
          >
            {submitting ? 'সাবমিট হচ্ছে...' : 'পেমেন্ট সাবমিট করুন'}
          </button>
        </form>
      )}
    </div>
  )
}
