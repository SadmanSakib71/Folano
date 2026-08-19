import type { FormEvent, ReactNode } from 'react'
import { Link } from 'react-router-dom'

export const authFieldClass =
  'mt-1.5 w-full rounded-xl border border-primary/15 bg-cream px-3.5 py-2.5 text-sm text-text outline-none transition placeholder:text-muted/70 focus:border-primary focus:ring-2 focus:ring-primary/15'

export const authLabelClass = 'block text-sm font-medium text-text'

interface AuthScreenProps {
  title: string
  subtitle: string
  children: ReactNode
  footer: ReactNode
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  submitLabel: string
  submittingLabel: string
  submitting: boolean
  error: string | null
}

export default function AuthScreen({
  title,
  subtitle,
  children,
  footer,
  onSubmit,
  submitLabel,
  submittingLabel,
  submitting,
  error,
}: AuthScreenProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-cream px-4 py-10">
        <div className="w-full max-w-md">
        <Link to="/" className="group flex flex-col items-center text-center">
          <span className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-[0_8px_24px_rgba(45,90,61,0.14)] ring-1 ring-primary/10 transition-transform duration-300 group-hover:scale-105">
            <img
              src="/logo-mark.png"
              alt=""
              className="h-full w-full object-contain p-1"
            />
          </span>
          <span className="mt-3 font-heading text-2xl font-semibold tracking-tight text-primary">
            ফলানা
          </span>
          <span className="mt-0.5 text-sm text-muted">প্রকৃতি থেকে সতেজতা</span>
        </Link>

        <div className="mt-8 rounded-2xl border border-primary/10 bg-white p-6 shadow-[0_16px_40px_rgba(45,90,61,0.10)] sm:p-8">
          <h1 className="font-heading text-2xl font-semibold text-text">
            {title}
          </h1>
          <p className="mt-1 text-sm text-muted">{subtitle}</p>

          <form className="mt-6" onSubmit={onSubmit} noValidate>
            <div className="space-y-4">{children}</div>

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
              className="mt-6 w-full rounded-xl bg-primary py-3 text-sm font-medium text-cream shadow-[0_8px_20px_rgba(45,90,61,0.22)] transition hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-70"
            >
              {submitting ? submittingLabel : submitLabel}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-muted">{footer}</p>
        </div>
      </div>
    </div>
  )
}
