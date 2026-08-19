import { ShoppingBasket } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { getProducts } from '../api/products'
import ProductCard from '../components/products/ProductCard'
import ProductFilters, {
  type ProductSort,
} from '../components/products/ProductFilters'
import type { Category, Product } from '../types'

function sortProducts(products: Product[], sort: ProductSort) {
  const sorted = [...products]

  if (sort === 'price-asc') {
    return sorted.sort((a, b) => a.price - b.price)
  }

  if (sort === 'price-desc') {
    return sorted.sort((a, b) => b.price - a.price)
  }

  // Product has no created_at, so newest keeps the API's original order.
  return sorted
}

function ProductSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-primary/5">
      <div className="aspect-4/3 animate-pulse bg-primary/10" />
      <div className="space-y-2 p-3">
        <div className="h-4 w-3/4 animate-pulse rounded bg-primary/10" />
        <div className="h-3 w-1/2 animate-pulse rounded bg-accent/20" />
      </div>
    </div>
  )
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
    </div>
  )
}

export default function Products() {
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
  const [filtersReady, setFiltersReady] = useState(false)
  const [sort, setSort] = useState<ProductSort>('newest')
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  const handleCategoryResolved = useCallback((category: Category | null) => {
    setSelectedCategory(category)
    setFiltersReady(true)
  }, [])

  useEffect(() => {
    if (!filtersReady) {
      return
    }

    let isCancelled = false

    setIsLoading(true)
    setHasError(false)

    getProducts(selectedCategory?.id)
      .then((data) => {
        if (!isCancelled) {
          const list = Array.isArray(data) ? data : []
          setProducts(list.filter((product) => product.is_active))
        }
      })
      .catch(() => {
        if (!isCancelled) {
          setHasError(true)
          setProducts([])
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
  }, [filtersReady, selectedCategory])

  const visibleProducts = useMemo(
    () => sortProducts(products, sort),
    [products, sort],
  )

  const heading = selectedCategory ? selectedCategory.name : 'সব ফল'
  const supportingText = selectedCategory
    ? selectedCategory.description || 'এই ক্যাটাগরির তাজা ফলগুলো দেখুন'
    : 'সব ধরনের তাজা ফল এক জায়গায়'

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <p className="text-sm font-medium text-accent">ফলের দোকান</p>
      {filtersReady ? (
        <>
          <h1 className="mt-1 font-heading text-3xl font-semibold text-text sm:text-4xl">
            {heading}
          </h1>
          <p className="mt-2 max-w-xl text-muted">{supportingText}</p>
        </>
      ) : (
        <>
          <div className="mt-1 h-10 w-48 animate-pulse rounded-lg bg-primary/10" />
          <div className="mt-2 h-4 w-72 max-w-full animate-pulse rounded bg-primary/10" />
        </>
      )}

      <div className="mt-6">
        <ProductFilters
          sort={sort}
          onSortChange={setSort}
          onCategoryResolved={handleCategoryResolved}
        />
      </div>

      <div className="mt-6">
        {!filtersReady || isLoading ? (
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
              <ProductSkeleton key={item} />
            ))}
          </div>
        ) : hasError ? (
          <StatusState
            title="ফল লোড করা যায়নি"
            message="একটু পরে আবার চেষ্টা করুন।"
          />
        ) : visibleProducts.length === 0 ? (
          <StatusState
            title="কোনো ফল পাওয়া যায়নি"
            message="এই ক্যাটাগরিতে এখন কোনো ফল নেই। অন্য ক্যাটাগরি দেখুন।"
          />
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
            {visibleProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
