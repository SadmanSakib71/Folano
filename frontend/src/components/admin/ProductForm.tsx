import { useEffect, useState, type FormEvent } from 'react'
import { getAdminProductErrorMessage } from '../../api/admin/products'
import { getCategories } from '../../api/categories'
import type { Category, Product } from '../../types'

export interface ProductFormValues {
  name: string
  category_id: number
  description: string | null
  unit: string
  price: number
  image_url: string | null
  is_seasonal: boolean
  is_preorder_only: boolean
  stock_quantity: number
}

interface ProductFormProps {
  product?: Product
  onSubmit: (data: ProductFormValues) => Promise<void>
  onCancel: () => void
}

const UNITS = [
  { value: 'kg', label: 'কেজি (kg)' },
  { value: 'piece', label: 'পিস (piece)' },
  { value: 'dozen', label: 'ডজন (dozen)' },
] as const

const fieldClass =
  'mt-1.5 w-full rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 text-sm text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-primary focus:ring-2 focus:ring-primary/15'

function asInputValue(value: string | number | null | undefined) {
  if (value === null || value === undefined) {
    return ''
  }

  return String(value)
}

export default function ProductForm({
  product,
  onSubmit,
  onCancel,
}: ProductFormProps) {
  const [categories, setCategories] = useState<Category[]>([])
  const [categoriesLoading, setCategoriesLoading] = useState(true)
  const [categoriesError, setCategoriesError] = useState<string | null>(null)

  const [name, setName] = useState(product?.name ?? '')
  const [categoryId, setCategoryId] = useState(asInputValue(product?.category_id))
  const [description, setDescription] = useState(product?.description ?? '')
  const [unit, setUnit] = useState(product?.unit || 'kg')
  const [price, setPrice] = useState(asInputValue(product?.price))
  const [imageUrl, setImageUrl] = useState(product?.image_url ?? '')
  const [isSeasonal, setIsSeasonal] = useState(Boolean(product?.is_seasonal))
  const [isPreorderOnly, setIsPreorderOnly] = useState(
    Boolean(product?.is_preorder_only),
  )
  const [stockQuantity, setStockQuantity] = useState(
    asInputValue(product?.stock_quantity),
  )

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const isEdit = Boolean(product)

  useEffect(() => {
    setName(product?.name ?? '')
    setCategoryId(asInputValue(product?.category_id))
    setDescription(product?.description ?? '')
    setUnit(product?.unit || 'kg')
    setPrice(asInputValue(product?.price))
    setImageUrl(product?.image_url ?? '')
    setIsSeasonal(Boolean(product?.is_seasonal))
    setIsPreorderOnly(Boolean(product?.is_preorder_only))
    setStockQuantity(asInputValue(product?.stock_quantity))
    setFieldErrors({})
    setSubmitError(null)
  }, [product])

  useEffect(() => {
    let isCancelled = false

    setCategoriesLoading(true)
    setCategoriesError(null)

    getCategories()
      .then((data) => {
        if (!isCancelled) {
          setCategories(data)
        }
      })
      .catch(() => {
        if (!isCancelled) {
          setCategoriesError('ক্যাটাগরি লোড করা যায়নি')
        }
      })
      .finally(() => {
        if (!isCancelled) {
          setCategoriesLoading(false)
        }
      })

    return () => {
      isCancelled = true
    }
  }, [])

  function validate() {
    const errors: Record<string, string> = {}

    if (!name.trim()) {
      errors.name = 'প্রোডাক্টের নাম লিখুন'
    }

    const parsedCategoryId = Number(categoryId)

    if (!categoryId || !Number.isInteger(parsedCategoryId) || parsedCategoryId <= 0) {
      errors.category_id = 'ক্যাটাগরি নির্বাচন করুন'
    }

    if (!unit) {
      errors.unit = 'ইউনিট নির্বাচন করুন'
    }

    const parsedPrice = Number(price)

    if (price.trim() === '' || !Number.isFinite(parsedPrice) || parsedPrice <= 0) {
      errors.price = 'সঠিক দাম লিখুন'
    }

    const parsedStock = Number(stockQuantity)

    if (
      stockQuantity.trim() === '' ||
      !Number.isFinite(parsedStock) ||
      parsedStock < 0 ||
      !Number.isInteger(parsedStock)
    ) {
      errors.stock_quantity = 'স্টকের পরিমাণ সঠিকভাবে লিখুন'
    }

    return errors
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (saving) {
      return
    }

    const errors = validate()
    setFieldErrors(errors)
    setSubmitError(null)

    if (Object.keys(errors).length > 0) {
      return
    }

    setSaving(true)

    try {
      await onSubmit({
        name: name.trim(),
        category_id: Number(categoryId),
        description: description.trim() || null,
        unit,
        price: Number(price),
        image_url: imageUrl.trim() || null,
        is_seasonal: isSeasonal,
        is_preorder_only: isPreorderOnly,
        stock_quantity: Number(stockQuantity),
      })
    } catch (error) {
      setSubmitError(getAdminProductErrorMessage(error))
    } finally {
      setSaving(false)
    }
  }

  if (categoriesLoading) {
    return (
      <div className="space-y-3" aria-busy="true">
        <div className="h-6 w-40 animate-pulse rounded bg-neutral-200" />
        <div className="h-10 animate-pulse rounded-xl bg-neutral-200" />
        <div className="h-10 animate-pulse rounded-xl bg-neutral-200" />
        <div className="h-24 animate-pulse rounded-xl bg-neutral-200" />
        <p className="text-sm text-neutral-500">ক্যাটাগরি লোড হচ্ছে...</p>
      </div>
    )
  }

  if (categoriesError) {
    return (
      <div>
        <p className="rounded-xl bg-red-50 px-3 py-2.5 text-sm text-red-700" role="alert">
          {categoriesError}
        </p>
        <button
          type="button"
          onClick={onCancel}
          className="mt-4 rounded-xl border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-700"
        >
          বন্ধ করুন
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <h3 className="text-lg font-semibold text-primary">
        {isEdit ? 'প্রোডাক্ট এডিট' : 'নতুন প্রোডাক্ট'}
      </h3>

      <label htmlFor="product-name" className="mt-4 block text-sm font-medium text-neutral-800">
        নাম <span className="text-red-600">*</span>
      </label>
      <input
        id="product-name"
        name="name"
        type="text"
        value={name}
        onChange={(event) => setName(event.target.value)}
        className={fieldClass}
        disabled={saving}
      />
      {fieldErrors.name ? (
        <p className="mt-1 text-xs text-red-600">{fieldErrors.name}</p>
      ) : null}

      <label htmlFor="product-category" className="mt-4 block text-sm font-medium text-neutral-800">
        ক্যাটাগরি <span className="text-red-600">*</span>
      </label>
      <select
        id="product-category"
        name="category_id"
        value={categoryId}
        onChange={(event) => setCategoryId(event.target.value)}
        className={fieldClass}
        disabled={saving}
      >
        <option value="">ক্যাটাগরি বাছুন</option>
        {categories.map((category) => (
          <option key={category.id} value={category.id}>
            {category.name}
          </option>
        ))}
      </select>
      {fieldErrors.category_id ? (
        <p className="mt-1 text-xs text-red-600">{fieldErrors.category_id}</p>
      ) : null}

      <label htmlFor="product-description" className="mt-4 block text-sm font-medium text-neutral-800">
        বিবরণ
      </label>
      <textarea
        id="product-description"
        name="description"
        rows={3}
        value={description}
        onChange={(event) => setDescription(event.target.value)}
        className={`${fieldClass} resize-y`}
        disabled={saving}
      />

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="product-unit" className="block text-sm font-medium text-neutral-800">
            ইউনিট <span className="text-red-600">*</span>
          </label>
          <select
            id="product-unit"
            name="unit"
            value={unit}
            onChange={(event) => setUnit(event.target.value)}
            className={fieldClass}
            disabled={saving}
          >
            {UNITS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {fieldErrors.unit ? (
            <p className="mt-1 text-xs text-red-600">{fieldErrors.unit}</p>
          ) : null}
        </div>

        <div>
          <label htmlFor="product-price" className="block text-sm font-medium text-neutral-800">
            দাম <span className="text-red-600">*</span>
          </label>
          <input
            id="product-price"
            name="price"
            type="number"
            min="0"
            step="0.01"
            value={price}
            onChange={(event) => setPrice(event.target.value)}
            className={fieldClass}
            disabled={saving}
          />
          {fieldErrors.price ? (
            <p className="mt-1 text-xs text-red-600">{fieldErrors.price}</p>
          ) : null}
        </div>
      </div>

      <label htmlFor="product-image-url" className="mt-4 block text-sm font-medium text-neutral-800">
        ইমেজ URL
      </label>
      <input
        id="product-image-url"
        name="image_url"
        type="text"
        value={imageUrl}
        onChange={(event) => setImageUrl(event.target.value)}
        className={fieldClass}
        placeholder="https://..."
        disabled={saving}
      />

      <label htmlFor="product-stock" className="mt-4 block text-sm font-medium text-neutral-800">
        স্টক <span className="text-red-600">*</span>
      </label>
      <input
        id="product-stock"
        name="stock_quantity"
        type="number"
        min="0"
        step="1"
        value={stockQuantity}
        onChange={(event) => setStockQuantity(event.target.value)}
        className={fieldClass}
        disabled={saving}
      />
      {fieldErrors.stock_quantity ? (
        <p className="mt-1 text-xs text-red-600">{fieldErrors.stock_quantity}</p>
      ) : null}

      <div className="mt-4 space-y-2">
        <label className="flex items-center gap-2 text-sm text-neutral-800">
          <input
            type="checkbox"
            checked={isSeasonal}
            onChange={(event) => setIsSeasonal(event.target.checked)}
            disabled={saving}
            className="h-4 w-4 rounded border-neutral-300 text-primary focus:ring-primary"
          />
          সিজনাল
        </label>
        <label className="flex items-center gap-2 text-sm text-neutral-800">
          <input
            type="checkbox"
            checked={isPreorderOnly}
            onChange={(event) => setIsPreorderOnly(event.target.checked)}
            disabled={saving}
            className="h-4 w-4 rounded border-neutral-300 text-primary focus:ring-primary"
          />
          প্রি-অর্ডার
        </label>
      </div>

      {submitError ? (
        <p className="mt-4 rounded-xl bg-red-50 px-3 py-2.5 text-sm text-red-700" role="alert">
          {submitError}
        </p>
      ) : null}

      <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="rounded-xl border border-neutral-200 px-4 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-70"
        >
          বাতিল
        </button>
        <button
          type="submit"
          disabled={saving}
          className="rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {saving ? 'সেভ হচ্ছে...' : isEdit ? 'আপডেট করুন' : 'সেভ করুন'}
        </button>
      </div>
    </form>
  )
}
