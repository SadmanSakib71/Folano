import { ShoppingBasket } from 'lucide-react'
import { useEffect, useState } from 'react'
import { getPreorderBatches } from '../api/preorders'
import PreorderBatchCard from '../components/preorders/PreorderBatchCard'
import type { PreorderBatch } from '../types'

function BatchSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-primary/5">
      <div className="aspect-4/3 animate-pulse bg-primary/10" />
      <div className="space-y-2 p-3 sm:p-4">
        <div className="h-4 w-3/4 animate-pulse rounded bg-primary/10" />
        <div className="h-3 w-1/2 animate-pulse rounded bg-accent/20" />
        <div className="h-2 w-full animate-pulse rounded-full bg-primary/10" />
      </div>
    </div>
  )
}

function StatusState({
  title,
  message,
}: {
  title: string
  message?: string
}) {
  return (
    <div className="rounded-2xl border border-primary/10 bg-white px-6 py-16 text-center shadow-sm">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
        <ShoppingBasket className="h-8 w-8 text-primary" strokeWidth={1.5} />
      </div>
      <p className="mt-4 font-heading text-lg font-semibold text-text">{title}</p>
      {message ? <p className="mt-1 text-sm text-muted">{message}</p> : null}
    </div>
  )
}

export default function Preorders() {
  const [batches, setBatches] = useState<PreorderBatch[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    let isCancelled = false

    setIsLoading(true)
    setHasError(false)

    getPreorderBatches('open')
      .then((data) => {
        if (!isCancelled) {
          setBatches(data)
        }
      })
      .catch(() => {
        if (!isCancelled) {
          setBatches([])
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
  }, [])

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <p className="text-sm font-medium text-accent">ফলের দোকান</p>
      <h1 className="mt-1 font-heading text-3xl font-semibold text-text sm:text-4xl">
        প্রি-অর্ডার
      </h1>
      <p className="mt-2 max-w-xl text-muted">
        মৌসুমি ফল আগে থেকে বুক করুন, পরে তাজা পেয়ে যান।
      </p>

      <div className="mt-6">
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
              <BatchSkeleton key={item} />
            ))}
          </div>
        ) : hasError ? (
          <StatusState
            title="প্রি-অর্ডার লোড করা যায়নি"
            message="একটু পরে আবার চেষ্টা করুন।"
          />
        ) : batches.length === 0 ? (
          <StatusState title="এই মুহূর্তে কোনো প্রি-অর্ডার ব্যাচ নেই" />
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
            {batches.map((batch) => (
              <PreorderBatchCard key={batch.id} batch={batch} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
