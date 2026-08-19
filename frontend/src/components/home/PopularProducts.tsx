import { ShoppingBasket } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getProducts } from '../../api/products'
import type { Product } from '../../types'
import { formatPriceWithUnit } from '../../utils/bangla'
import { getPlaceholderImage } from '../../utils/placeholderImages'

function StatusCard({
  title,
  message,
}: {
  title: string
  message: string
}) {
  return (
    <div className="rounded-2xl border border-primary/10 bg-white px-6 py-12 text-center shadow-sm">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
        <ShoppingBasket className="h-8 w-8 text-primary" strokeWidth={1.5} />
      </div>
      <p className="mt-4 font-heading text-lg font-semibold text-text">{title}</p>
      <p className="mt-1 text-sm text-muted">{message}</p>
      <Link
        to="/products"
        className="mt-5 inline-flex rounded-full bg-primary px-4 py-2 text-sm font-medium text-cream transition hover:bg-primary/90"
      >
        সব ফল দেখুন
      </Link>
    </div>
  )
}

export default function PopularProducts() {
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    let isCancelled = false

    getProducts()
      .then((data) => {
        if (!isCancelled) {
          setProducts(data.filter((product) => product.is_active))
        }
      })
      .catch(() => {
        if (!isCancelled) {
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

  if (isLoading) {
    return (
      <div className="flex gap-4 overflow-hidden">
        {[1, 2, 3, 4].map((item) => (
          <div
            key={item}
            className="h-56 w-48 shrink-0 animate-pulse rounded-2xl bg-white shadow-sm"
          >
            <div className="h-36 rounded-t-2xl bg-primary/10" />
            <div className="space-y-2 p-3">
              <div className="h-4 w-24 rounded bg-primary/10" />
              <div className="h-3 w-16 rounded bg-accent/20" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (hasError) {
    return (
      <StatusCard
        title="ফল লোড করা যায়নি"
        message="জনপ্রিয় ফল লোড করা যায়নি। একটু পরে আবার চেষ্টা করুন।"
      />
    )
  }

  if (products.length === 0) {
    return (
      <StatusCard
        title="এখনও খালি"
        message="এখনও কোনো জনপ্রিয় ফল যোগ করা হয়নি।"
      />
    )
  }

  return (
    <div className="flex flex-nowrap gap-4 overflow-x-auto pb-2">
      {products.map((product) => {
        const imageSrc = product.image_url?.trim()
          ? product.image_url
          : getPlaceholderImage(product.name)

        return (
          <article
            key={product.id}
            className="w-48 shrink-0 overflow-hidden rounded-2xl bg-white shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-md"
          >
            <img
              src={imageSrc}
              alt={product.name}
              loading="lazy"
              className="h-36 w-full object-cover"
            />
            <div className="p-3">
              <h3 className="font-heading text-base font-semibold leading-snug text-text">
                {product.name}
              </h3>
              <p className="mt-2 inline-flex rounded-full bg-accent/10 px-2.5 py-1 text-sm font-medium text-accent">
                {formatPriceWithUnit(product.price, product.unit)}
              </p>
            </div>
          </article>
        )
      })}
    </div>
  )
}
