import { useEffect, useState, type FormEvent } from 'react'
import { getAdminPreorderBatchErrorMessage } from '../../api/admin/preorderBatches'
import { getProducts } from '../../api/products'
import type { Product } from '../../types'

export interface PreorderBatchFormValues {
  product_id: number
  batch_name: string
  total_quantity: number
  price_per_unit: number
  preorder_start_date: string
  preorder_end_date: string
  expected_delivery_date: string
}

interface PreorderBatchFormProps {
  onSubmit: (data: PreorderBatchFormValues) => Promise<void>
  onCancel: () => void
}

const fieldClass =
  'mt-1.5 w-full rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 text-sm text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-primary focus:ring-2 focus:ring-primary/15'

export default function PreorderBatchForm({
  onSubmit,
  onCancel,
}: PreorderBatchFormProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [productsLoading, setProductsLoading] = useState(true)
  const [productsError, setProductsError] = useState<string | null>(null)

  const [productId, setProductId] = useState('')
  const [batchName, setBatchName] = useState('')
  const [totalQuantity, setTotalQuantity] = useState('')
  const [pricePerUnit, setPricePerUnit] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [deliveryDate, setDeliveryDate] = useState('')

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let isCancelled = false

    setProductsLoading(true)
    setProductsError(null)

    getProducts()
      .then((data) => {
        if (!isCancelled) {
          setProducts(Array.isArray(data) ? data : [])
        }
      })
      .catch(() => {
        if (!isCancelled) {
          setProductsError('প্রোডাক্ট লোড করা যায়নি')
        }
      })
      .finally(() => {
        if (!isCancelled) {
          setProductsLoading(false)
        }
      })

    return () => {
      isCancelled = true
    }
  }, [])

  function validate() {
    const errors: Record<string, string> = {}
    const parsedProductId = Number(productId)

    if (!productId || !Number.isInteger(parsedProductId) || parsedProductId <= 0) {
      errors.product_id = 'প্রোডাক্ট নির্বাচন করুন'
    }

    if (!batchName.trim()) {
      errors.batch_name = 'ব্যাচের নাম লিখুন'
    }

    const parsedQuantity = Number(totalQuantity)

    if (
      totalQuantity.trim() === '' ||
      !Number.isFinite(parsedQuantity) ||
      parsedQuantity <= 0
    ) {
      errors.total_quantity = 'মোট পরিমাণ ০-এর বেশি হতে হবে'
    }

    const parsedPrice = Number(pricePerUnit)

    if (pricePerUnit.trim() === '' || !Number.isFinite(parsedPrice) || parsedPrice <= 0) {
      errors.price_per_unit = 'ইউনিট মূল্য ০-এর বেশি হতে হবে'
    }

    if (!startDate) {
      errors.preorder_start_date = 'প্রি-অর্ডার শুরুর তারিখ দিন'
    }

    if (!endDate) {
      errors.preorder_end_date = 'প্রি-অর্ডার শেষ তারিখ দিন'
    }

    if (!deliveryDate) {
      errors.expected_delivery_date = 'ডেলিভারির তারিখ দিন'
    }

    // YYYY-MM-DD strings compare safely without timezone shifts.
    if (startDate && endDate && endDate <= startDate) {
      errors.preorder_end_date = 'শেষ তারিখ শুরুর তারিখের পরে হতে হবে'
    }

    if (endDate && deliveryDate && deliveryDate <= endDate) {
      errors.expected_delivery_date = 'ডেলিভারির তারিখ প্রি-অর্ডার শেষ তারিখের পরে হতে হবে'
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
        product_id: Number(productId),
        batch_name: batchName.trim(),
        total_quantity: Number(totalQuantity),
        price_per_unit: Number(pricePerUnit),
        preorder_start_date: startDate,
        preorder_end_date: endDate,
        expected_delivery_date: deliveryDate,
      })
    } catch (error) {
      setSubmitError(
        getAdminPreorderBatchErrorMessage(
          error,
          'ব্যাচ তৈরি করা যায়নি। আবার চেষ্টা করুন।',
        ),
      )
    } finally {
      setSaving(false)
    }
  }

  if (productsLoading) {
    return (
      <div className="space-y-3" aria-busy="true">
        <div className="h-6 w-40 animate-pulse rounded bg-neutral-200" />
        <div className="h-10 animate-pulse rounded-xl bg-neutral-200" />
        <div className="h-10 animate-pulse rounded-xl bg-neutral-200" />
        <div className="h-10 animate-pulse rounded-xl bg-neutral-200" />
        <p className="text-sm text-neutral-500">প্রোডাক্ট লোড হচ্ছে...</p>
      </div>
    )
  }

  if (productsError) {
    return (
      <div>
        <p className="rounded-xl bg-red-50 px-3 py-2.5 text-sm text-red-700" role="alert">
          {productsError}
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
      <h3 className="text-lg font-semibold text-primary">নতুন ব্যাচ</h3>

      <label htmlFor="batch-product" className="mt-4 block text-sm font-medium text-neutral-800">
        প্রোডাক্ট <span className="text-red-600">*</span>
      </label>
      <select
        id="batch-product"
        name="product_id"
        value={productId}
        onChange={(event) => setProductId(event.target.value)}
        className={fieldClass}
        disabled={saving}
      >
        <option value="">প্রোডাক্ট বাছুন</option>
        {products.map((product) => (
          <option key={product.id} value={product.id}>
            {product.name}
          </option>
        ))}
      </select>
      {fieldErrors.product_id ? (
        <p className="mt-1 text-xs text-red-600">{fieldErrors.product_id}</p>
      ) : null}
      {products.length === 0 ? (
        <p className="mt-1 text-xs text-neutral-500">
          কোনো সক্রিয় প্রোডাক্ট নেই। আগে প্রোডাক্ট যোগ করুন।
        </p>
      ) : null}

      <label htmlFor="batch-name" className="mt-4 block text-sm font-medium text-neutral-800">
        ব্যাচের নাম <span className="text-red-600">*</span>
      </label>
      <input
        id="batch-name"
        name="batch_name"
        type="text"
        value={batchName}
        onChange={(event) => setBatchName(event.target.value)}
        className={fieldClass}
        placeholder="যেমন: জুন ২০২৭ হিমসাগর"
        disabled={saving}
      />
      {fieldErrors.batch_name ? (
        <p className="mt-1 text-xs text-red-600">{fieldErrors.batch_name}</p>
      ) : null}

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor="batch-total-quantity"
            className="block text-sm font-medium text-neutral-800"
          >
            মোট পরিমাণ <span className="text-red-600">*</span>
          </label>
          <input
            id="batch-total-quantity"
            name="total_quantity"
            type="number"
            min="0"
            step="0.01"
            value={totalQuantity}
            onChange={(event) => setTotalQuantity(event.target.value)}
            className={fieldClass}
            disabled={saving}
          />
          {fieldErrors.total_quantity ? (
            <p className="mt-1 text-xs text-red-600">{fieldErrors.total_quantity}</p>
          ) : null}
        </div>

        <div>
          <label
            htmlFor="batch-price"
            className="block text-sm font-medium text-neutral-800"
          >
            ইউনিট মূল্য <span className="text-red-600">*</span>
          </label>
          <input
            id="batch-price"
            name="price_per_unit"
            type="number"
            min="0"
            step="0.01"
            value={pricePerUnit}
            onChange={(event) => setPricePerUnit(event.target.value)}
            className={fieldClass}
            disabled={saving}
          />
          {fieldErrors.price_per_unit ? (
            <p className="mt-1 text-xs text-red-600">{fieldErrors.price_per_unit}</p>
          ) : null}
        </div>
      </div>

      <label htmlFor="batch-start-date" className="mt-4 block text-sm font-medium text-neutral-800">
        প্রি-অর্ডার শুরু <span className="text-red-600">*</span>
      </label>
      <input
        id="batch-start-date"
        name="preorder_start_date"
        type="date"
        value={startDate}
        onChange={(event) => setStartDate(event.target.value)}
        className={fieldClass}
        disabled={saving}
      />
      {fieldErrors.preorder_start_date ? (
        <p className="mt-1 text-xs text-red-600">{fieldErrors.preorder_start_date}</p>
      ) : null}

      <label htmlFor="batch-end-date" className="mt-4 block text-sm font-medium text-neutral-800">
        প্রি-অর্ডার শেষ <span className="text-red-600">*</span>
      </label>
      <input
        id="batch-end-date"
        name="preorder_end_date"
        type="date"
        value={endDate}
        onChange={(event) => setEndDate(event.target.value)}
        className={fieldClass}
        disabled={saving}
      />
      {fieldErrors.preorder_end_date ? (
        <p className="mt-1 text-xs text-red-600">{fieldErrors.preorder_end_date}</p>
      ) : null}

      <label
        htmlFor="batch-delivery-date"
        className="mt-4 block text-sm font-medium text-neutral-800"
      >
        সম্ভাব্য ডেলিভারি <span className="text-red-600">*</span>
      </label>
      <input
        id="batch-delivery-date"
        name="expected_delivery_date"
        type="date"
        value={deliveryDate}
        onChange={(event) => setDeliveryDate(event.target.value)}
        className={fieldClass}
        disabled={saving}
      />
      {fieldErrors.expected_delivery_date ? (
        <p className="mt-1 text-xs text-red-600">{fieldErrors.expected_delivery_date}</p>
      ) : null}

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
          {saving ? 'সেভ হচ্ছে...' : 'ব্যাচ তৈরি করুন'}
        </button>
      </div>
    </form>
  )
}
