import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { getCategories } from '../../api/categories'
import type { Category } from '../../types'

export type ProductSort = 'newest' | 'price-asc' | 'price-desc'

const sortOptions: { value: ProductSort; label: string }[] = [
  { value: 'newest', label: 'নতুনতম' },
  { value: 'price-asc', label: 'দাম কম থেকে বেশি' },
  { value: 'price-desc', label: 'দাম বেশি থেকে কম' },
]

interface ProductFiltersProps {
  sort: ProductSort
  onSortChange: (sort: ProductSort) => void
  onCategoryResolved: (category: Category | null) => void
}

export default function ProductFilters({
  sort,
  onSortChange,
  onCategoryResolved,
}: ProductFiltersProps) {
  const [searchParams, setSearchParams] = useSearchParams()
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const selectedSlug = searchParams.get('category')
  const categoryList = Array.isArray(categories) ? categories : []

  useEffect(() => {
    let isCancelled = false

    getCategories()
      .then((data) => {
        if (!isCancelled) {
          setCategories(Array.isArray(data) ? data : [])
        }
      })
      .catch(() => {
        if (!isCancelled) {
          setCategories([])
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

  // Homepage links send ?category=<slug>; the products API needs category_id.
  useEffect(() => {
    if (!selectedSlug) {
      onCategoryResolved(null)
      return
    }

    if (isLoading) {
      return
    }

    const match = categoryList.find((category) => category.slug === selectedSlug)
    onCategoryResolved(match ?? null)
  }, [categoryList, isLoading, onCategoryResolved, selectedSlug])

  const selectCategory = (slug: string | null) => {
    if (slug) {
      setSearchParams({ category: slug })
    } else {
      setSearchParams({})
    }
  }

  const matchedSlug =
    selectedSlug && categoryList.some((category) => category.slug === selectedSlug)
      ? selectedSlug
      : null
  const activeSlug = isLoading ? selectedSlug : matchedSlug

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
        <CategoryPill
          label="সব"
          isActive={activeSlug === null}
          onClick={() => selectCategory(null)}
        />

        {isLoading
          ? [1, 2, 3].map((item) => (
              <span
                key={item}
                className="h-9 w-24 shrink-0 animate-pulse rounded-full bg-white shadow-sm"
              />
            ))
          : categoryList.map((category) => (
              <CategoryPill
                key={category.id}
                label={category.name}
                isActive={activeSlug === category.slug}
                onClick={() => selectCategory(category.slug)}
              />
            ))}
      </div>

      <label className="flex shrink-0 items-center gap-2 self-start text-sm text-muted">
        <span className="sr-only">সাজানো</span>
        <select
          value={sort}
          onChange={(event) => onSortChange(event.target.value as ProductSort)}
          className="rounded-full border border-primary/10 bg-white px-3 py-2 text-sm text-text shadow-sm outline-none transition hover:border-primary/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          {sortOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  )
}

function CategoryPill({
  label,
  isActive,
  onClick,
}: {
  label: string
  isActive: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'shrink-0 rounded-full px-4 py-2 text-sm font-medium whitespace-nowrap transition',
        isActive
          ? 'bg-primary text-cream shadow-sm'
          : 'bg-white text-text shadow-sm hover:bg-primary/8 hover:text-primary',
      ].join(' ')}
    >
      {label}
    </button>
  )
}
