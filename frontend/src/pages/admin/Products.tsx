import { useCallback, useEffect, useState } from 'react'
import {
  createProduct,
  deleteProduct,
  getAdminProductErrorMessage,
  getAdminProducts,
  updateProduct,
} from '../../api/admin/products'
import { getCategories } from '../../api/categories'
import ProductForm, {
  type ProductFormValues,
} from '../../components/admin/ProductForm'
import type { Category, Product } from '../../types'
import { formatBanglaNumber, formatUnit } from '../../utils/bangla'
import { getPlaceholderImage } from '../../utils/placeholderImages'

function slugFromName(name: string) {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\p{L}\p{N}-]+/gu, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')

  return `${slug || 'product'}-${Date.now()}`
}

function productImageSrc(product: Product, categoryName?: string) {
  const imageUrl = product.image_url?.trim()
  return imageUrl ? imageUrl : getPlaceholderImage(product.name, categoryName)
}

export default function Products() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null,
  )

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | undefined>()
  const [isSaving, setIsSaving] = useState(false)
  const [statusUpdatingId, setStatusUpdatingId] = useState<number | null>(null)

  const categoryName = useCallback(
    (categoryId: number) =>
      categories.find((category) => category.id === categoryId)?.name ?? '—',
    [categories],
  )

  const loadProducts = useCallback(async () => {
    const data = await getAdminProducts()
    setProducts(data)
  }, [])

  useEffect(() => {
    let isCancelled = false

    setIsLoading(true)
    setError(null)

    Promise.all([getAdminProducts(), getCategories()])
      .then(([productData, categoryData]) => {
        if (isCancelled) {
          return
        }

        setProducts(productData)
        setCategories(categoryData)
      })
      .catch(() => {
        if (!isCancelled) {
          setError('প্রোডাক্ট লোড করা যায়নি। আবার চেষ্টা করুন।')
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

  function openCreateForm() {
    setEditingProduct(undefined)
    setIsFormOpen(true)
  }

  function openEditForm(product: Product) {
    setEditingProduct(product)
    setIsFormOpen(true)
  }

  function closeForm() {
    if (isSaving) {
      return
    }

    setIsFormOpen(false)
    setEditingProduct(undefined)
  }

  async function handleFormSubmit(values: ProductFormValues) {
    setIsSaving(true)
    setNotice(null)

    try {
      if (editingProduct) {
        await updateProduct(editingProduct.id, values)
        setNotice({ type: 'success', text: 'প্রোডাক্ট আপডেট হয়েছে' })
      } else {
        await createProduct({
          ...values,
          slug: slugFromName(values.name),
        })
        setNotice({ type: 'success', text: 'নতুন প্রোডাক্ট যোগ হয়েছে' })
      }
    } catch (error) {
      throw error
    } finally {
      setIsSaving(false)
    }

    setIsFormOpen(false)
    setEditingProduct(undefined)

    try {
      await loadProducts()
    } catch {
      setNotice({
        type: 'error',
        text: 'প্রোডাক্ট সেভ হয়েছে, কিন্তু লিস্ট রিফ্রেশ করা যায়নি।',
      })
    }
  }

  async function handleToggleActive(product: Product) {
    if (statusUpdatingId !== null) {
      return
    }

    setStatusUpdatingId(product.id)
    setNotice(null)

    try {
      if (product.is_active) {
        await deleteProduct(product.id)
        setNotice({ type: 'success', text: 'প্রোডাক্ট ডিঅ্যাক্টিভেট হয়েছে' })
      } else {
        await updateProduct(product.id, { is_active: true })
        setNotice({ type: 'success', text: 'প্রোডাক্ট অ্যাক্টিভেট হয়েছে' })
      }

      await loadProducts()
    } catch (error) {
      setNotice({ type: 'error', text: getAdminProductErrorMessage(error) })
    } finally {
      setStatusUpdatingId(null)
    }
  }

  return (
    <section>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-neutral-900">প্রোডাক্ট</h2>
          <p className="mt-1 text-sm text-neutral-500">
            ফলের প্রোডাক্ট, দাম এবং স্টক ম্যানেজ করুন
          </p>
        </div>
        <button
          type="button"
          onClick={openCreateForm}
          className="inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary/90"
        >
          নতুন প্রোডাক্ট
        </button>
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
            <div className="h-10 animate-pulse rounded-lg bg-neutral-100" />
            <div className="h-10 animate-pulse rounded-lg bg-neutral-100" />
            <div className="h-10 animate-pulse rounded-lg bg-neutral-100" />
          </div>
          <p className="mt-3 text-sm text-neutral-500">প্রোডাক্ট লোড হচ্ছে...</p>
        </div>
      ) : null}

      {!isLoading && error ? (
        <div className="mt-6 rounded-2xl border border-red-100 bg-white p-6 text-center shadow-sm">
          <p className="font-medium text-neutral-900">লোড করা যায়নি</p>
          <p className="mt-1 text-sm text-neutral-500">{error}</p>
        </div>
      ) : null}

      {!isLoading && !error && products.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-neutral-200 bg-white p-10 text-center shadow-sm">
          <p className="font-medium text-neutral-900">কোনো প্রোডাক্ট নেই</p>
          <p className="mt-1 text-sm text-neutral-500">
            নতুন প্রোডাক্ট যোগ করে শুরু করুন
          </p>
        </div>
      ) : null}

      {!isLoading && !error && products.length > 0 ? (
        <div className="mt-6 overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-[860px] w-full text-left text-sm">
              <thead className="bg-neutral-50 text-neutral-600">
                <tr>
                  <th className="px-4 py-3 font-medium">ছবি</th>
                  <th className="px-4 py-3 font-medium">নাম</th>
                  <th className="px-4 py-3 font-medium">ক্যাটাগরি</th>
                  <th className="px-4 py-3 font-medium">দাম</th>
                  <th className="px-4 py-3 font-medium">ইউনিট</th>
                  <th className="px-4 py-3 font-medium">স্টক</th>
                  <th className="px-4 py-3 font-medium">স্ট্যাটাস</th>
                  <th className="px-4 py-3 font-medium">সিজনাল</th>
                  <th className="px-4 py-3 font-medium">প্রি-অর্ডার</th>
                  <th className="px-4 py-3 font-medium">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => {
                  const nameOfCategory = categoryName(product.category_id)

                  return (
                    <tr key={product.id} className="border-t border-neutral-100">
                      <td className="px-4 py-3">
                        <img
                          src={productImageSrc(product, nameOfCategory)}
                          alt={product.name}
                          className="h-12 w-12 rounded-lg object-cover"
                          onError={(event) => {
                            event.currentTarget.src = getPlaceholderImage(
                              product.name,
                              nameOfCategory,
                            )
                          }}
                        />
                      </td>
                      <td className="px-4 py-3 font-medium text-neutral-900">
                        {product.name}
                      </td>
                      <td className="px-4 py-3 text-neutral-600">{nameOfCategory}</td>
                      <td className="px-4 py-3 text-neutral-900">
                        ৳{formatBanglaNumber(Number(product.price))}
                      </td>
                      <td className="px-4 py-3 text-neutral-600">
                        {formatUnit(product.unit)}
                      </td>
                      <td className="px-4 py-3 text-neutral-600">
                        {formatBanglaNumber(Number(product.stock_quantity))}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            product.is_active
                              ? 'bg-primary/10 text-primary'
                              : 'bg-neutral-100 text-neutral-600'
                          }`}
                        >
                          {product.is_active ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {product.is_seasonal ? (
                          <span className="inline-flex rounded-full bg-accent/15 px-2.5 py-0.5 text-xs font-medium text-accent">
                            সিজনাল
                          </span>
                        ) : (
                          <span className="text-neutral-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {product.is_preorder_only ? (
                          <span className="inline-flex rounded-full bg-accent/15 px-2.5 py-0.5 text-xs font-medium text-accent">
                            প্রি-অর্ডার
                          </span>
                        ) : (
                          <span className="text-neutral-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => openEditForm(product)}
                            className="rounded-lg border border-neutral-200 px-2.5 py-1 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleActive(product)}
                            disabled={statusUpdatingId === product.id}
                            className="rounded-lg border border-neutral-200 px-2.5 py-1 text-xs font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-60"
                          >
                            {statusUpdatingId === product.id
                              ? 'অপেক্ষা করুন...'
                              : product.is_active
                                ? 'ডিঅ্যাক্টিভেট'
                                : 'অ্যাক্টিভেট'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {isFormOpen ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4">
          <button
            type="button"
            aria-label="Close"
            className="absolute inset-0"
            onClick={closeForm}
          />
          <div className="relative z-10 max-h-[92vh] w-full overflow-y-auto rounded-t-2xl bg-white p-4 shadow-xl sm:max-w-xl sm:rounded-2xl sm:p-6">
            <ProductForm
              product={editingProduct}
              onSubmit={handleFormSubmit}
              onCancel={closeForm}
            />
          </div>
        </div>
      ) : null}
    </section>
  )
}
