import axios from 'axios'
import { Link, useParams } from 'react-router-dom'
import { Minus, Plus, ShoppingBasket, ShoppingCart } from 'lucide-react'
import { useEffect, useState } from 'react'
import { getCategories } from '../api/categories'
import { getProductById } from '../api/products'
import type { Category, Product } from '../types'
import { getPlaceholderImage } from '../utils/placeholderImages'

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
        to="/products"
        className="mt-5 inline-flex rounded-full bg-primary px-4 py-2 text-sm font-medium text-cream transition hover:bg-primary/90"
      >
        সব ফল দেখুন
      </Link>
    </div>
  )
}

function ProductDetailSkeleton() {
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

export default function ProductDetail() {
  const { id } = useParams()
  const [product, setProduct] = useState<Product | null>(null)
  const [category, setCategory] = useState<Category | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [quantity, setQuantity] = useState(1)
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    const productId = Number(id)

    if (!id || Number.isNaN(productId)) {
      setProduct(null)
      setCategory(null)
      setNotFound(true)
      setHasError(false)
      setIsLoading(false)
      return
    }

    let isCancelled = false

    setIsLoading(true)
    setNotFound(false)
    setHasError(false)
    setProduct(null)
    setCategory(null)
    setQuantity(1)

    getProductById(productId)
      .then((data) => {
        if (isCancelled) {
          return
        }

        setProduct(data)

        getCategories()
          .then((categories) => {
            if (!isCancelled) {
              setCategory(
                categories.find((item) => item.id === data.category_id) ?? null,
              )
            }
          })
          .catch(() => {
            if (!isCancelled) {
              setCategory(null)
            }
          })
      })
      .catch((error: unknown) => {
        if (isCancelled) {
          return
        }

        if (isNotFoundError(error)) {
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

  useEffect(() => {
    if (!toast) {
      return
    }

    const timeoutId = window.setTimeout(() => setToast(null), 2500)
    return () => window.clearTimeout(timeoutId)
  }, [toast])

  const canAddToCart =
    product !== null && !product.is_preorder_only && product.stock_quantity > 0

  const decreaseQuantity = () => {
    setQuantity((value) => Math.max(1, value - 1))
  }

  const increaseQuantity = () => {
    if (!product) {
      return
    }

    setQuantity((value) => Math.min(product.stock_quantity, value + 1))
  }

  const handleAddToCart = () => {
    setToast('Added to cart')
  }

  const imageSrc = product?.image_url?.trim()
    ? product.image_url
    : getPlaceholderImage(product?.name, category?.name)

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      {isLoading ? (
        <ProductDetailSkeleton />
      ) : notFound ? (
        <StatusState
          title="ফল পাওয়া যায়নি"
          message="এই ফলটি খুঁজে পাওয়া যায়নি। অন্য ফল দেখুন।"
        />
      ) : hasError || !product ? (
        <StatusState
          title="ফল লোড করা যায়নি"
          message="একটু পরে আবার চেষ্টা করুন।"
        />
      ) : (
        <>
          <p className="text-sm font-medium text-accent">ফলের দোকান</p>
          <Link
            to="/products"
            className="mt-1 inline-flex text-sm text-muted transition hover:text-primary"
          >
            ← সব ফল
          </Link>

          <div className="mt-6 grid items-start gap-8 lg:grid-cols-2 lg:gap-12">
            <div className="relative overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-primary/5">
              <img
                src={imageSrc}
                alt={product.name}
                className="aspect-square w-full object-cover sm:aspect-4/3 lg:aspect-square"
              />

              {product.is_seasonal || product.is_preorder_only ? (
                <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
                  {product.is_seasonal ? (
                    <span className="rounded-full bg-cream/90 px-2.5 py-1 text-xs font-medium text-accent shadow-sm">
                      সিজনাল
                    </span>
                  ) : null}
                  {product.is_preorder_only ? (
                    <span className="rounded-full bg-cream/90 px-2.5 py-1 text-xs font-medium text-accent shadow-sm">
                      প্রি-অর্ডার
                    </span>
                  ) : null}
                </div>
              ) : null}
            </div>

            <div>
              {category ? (
                <p className="text-sm font-medium text-accent">{category.name}</p>
              ) : null}

              <h1 className="mt-1 font-heading text-3xl font-semibold text-text sm:text-4xl">
                {product.name}
              </h1>

              <p className="mt-3 text-2xl font-medium text-accent">
                ৳{product.price}/{product.unit}
              </p>

              {product.description ? (
                <p className="mt-4 max-w-xl leading-relaxed text-muted">
                  {product.description}
                </p>
              ) : null}

              <div className="mt-5 flex flex-wrap items-center gap-2">
                {product.stock_quantity > 0 ? (
                  <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                    স্টকে আছে
                  </span>
                ) : (
                  <span className="rounded-full bg-muted/15 px-3 py-1 text-sm font-medium text-muted">
                    স্টক নেই
                  </span>
                )}
              </div>

              {product.is_preorder_only ? (
                <div className="mt-6 rounded-2xl border border-accent/20 bg-accent/10 px-4 py-4">
                  <p className="font-heading text-lg font-semibold text-accent">
                    শুধুমাত্র প্রি-অর্ডার
                  </p>
                  <p className="mt-1 text-sm text-muted">
                    এই ফলটি এখন শুধু প্রি-অর্ডারে পাওয়া যাবে।
                  </p>
                </div>
              ) : canAddToCart ? (
                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <div className="inline-flex items-center rounded-full bg-white shadow-sm ring-1 ring-primary/10">
                    <button
                      type="button"
                      aria-label="পরিমাণ কমান"
                      onClick={decreaseQuantity}
                      disabled={quantity <= 1}
                      className="flex h-11 w-11 items-center justify-center rounded-full text-primary transition hover:bg-primary/8 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Minus className="h-4 w-4" strokeWidth={2} />
                    </button>
                    <span className="min-w-8 text-center text-base font-medium text-text">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      aria-label="পরিমাণ বাড়ান"
                      onClick={increaseQuantity}
                      disabled={quantity >= product.stock_quantity}
                      className="flex h-11 w-11 items-center justify-center rounded-full text-primary transition hover:bg-primary/8 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Plus className="h-4 w-4" strokeWidth={2} />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddToCart}
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-cream shadow-[0_8px_20px_rgba(45,90,61,0.2)] transition hover:bg-primary/90"
                  >
                    <ShoppingCart className="h-4 w-4" strokeWidth={1.75} />
                    কার্টে যোগ করুন
                  </button>
                </div>
              ) : null}

              {!product.is_preorder_only && product.stock_quantity === 0 ? (
                <p className="mt-6 text-sm text-muted">
                  এই ফলটি এখন স্টকে নেই। পরে আবার দেখুন।
                </p>
              ) : null}
            </div>
          </div>

          <section className="mt-12 rounded-2xl border border-primary/10 bg-white px-6 py-10 text-center shadow-sm sm:mt-14">
            <h2 className="font-heading text-2xl font-semibold text-text">
              রিভিউ
            </h2>
            <p className="mt-2 text-muted">শীঘ্রই আসছে</p>
          </section>
        </>
      )}

      {toast ? (
        <div
          role="status"
          className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-cream shadow-[0_12px_28px_rgba(45,90,61,0.28)]"
        >
          {toast}
        </div>
      ) : null}
    </div>
  )
}
