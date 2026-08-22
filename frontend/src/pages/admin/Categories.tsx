import { useCallback, useEffect, useState } from 'react'
import {
  createCategory,
  deleteCategory,
  getAdminCategories,
  getAdminCategoryErrorMessage,
  updateCategory,
} from '../../api/admin/categories'
import CategoryForm, {
  type CategoryFormValues,
} from '../../components/admin/CategoryForm'
import type { Category } from '../../types'

export default function Categories() {
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null,
  )

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | undefined>()
  const [isSaving, setIsSaving] = useState(false)
  const [statusUpdatingId, setStatusUpdatingId] = useState<number | null>(null)

  const loadCategories = useCallback(async () => {
    const data = await getAdminCategories()
    setCategories(data)
  }, [])

  useEffect(() => {
    let isCancelled = false

    setIsLoading(true)
    setError(null)

    getAdminCategories()
      .then((data) => {
        if (!isCancelled) {
          setCategories(data)
        }
      })
      .catch(() => {
        if (!isCancelled) {
          setError('ক্যাটাগরি লোড করা যায়নি। আবার চেষ্টা করুন।')
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
    setEditingCategory(undefined)
    setIsFormOpen(true)
  }

  function openEditForm(category: Category) {
    setEditingCategory(category)
    setIsFormOpen(true)
  }

  function closeForm() {
    if (isSaving) {
      return
    }

    setIsFormOpen(false)
    setEditingCategory(undefined)
  }

  async function handleFormSubmit(values: CategoryFormValues) {
    setIsSaving(true)
    setNotice(null)

    try {
      if (editingCategory) {
        await updateCategory(editingCategory.id, values)
        setNotice({ type: 'success', text: 'ক্যাটাগরি আপডেট হয়েছে' })
      } else {
        await createCategory(values)
        setNotice({ type: 'success', text: 'নতুন ক্যাটাগরি যোগ হয়েছে' })
      }
    } catch (error) {
      throw error
    } finally {
      setIsSaving(false)
    }

    setIsFormOpen(false)
    setEditingCategory(undefined)

    try {
      await loadCategories()
    } catch {
      setNotice({
        type: 'error',
        text: 'ক্যাটাগরি সেভ হয়েছে, কিন্তু লিস্ট রিফ্রেশ করা যায়নি।',
      })
    }
  }

  async function handleDeactivate(category: Category) {
    if (statusUpdatingId !== null) {
      return
    }

    const confirmed = window.confirm('এই ক্যাটাগরিটি ডিঅ্যাক্টিভেট করতে চান?')

    if (!confirmed) {
      return
    }

    setStatusUpdatingId(category.id)
    setNotice(null)

    try {
      await deleteCategory(category.id)
      setNotice({ type: 'success', text: 'ক্যাটাগরি ডিঅ্যাক্টিভেট হয়েছে' })
      await loadCategories()
    } catch (error) {
      setNotice({ type: 'error', text: getAdminCategoryErrorMessage(error) })
    } finally {
      setStatusUpdatingId(null)
    }
  }

  async function handleActivate(category: Category) {
    if (statusUpdatingId !== null) {
      return
    }

    setStatusUpdatingId(category.id)
    setNotice(null)

    try {
      await updateCategory(category.id, { is_active: true })
      setNotice({ type: 'success', text: 'ক্যাটাগরি অ্যাক্টিভেট হয়েছে' })
      await loadCategories()
    } catch (error) {
      setNotice({ type: 'error', text: getAdminCategoryErrorMessage(error) })
    } finally {
      setStatusUpdatingId(null)
    }
  }

  return (
    <section>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-neutral-900">ক্যাটাগরি</h2>
          <p className="mt-1 text-sm text-neutral-500">
            ফলের ক্যাটাগরি তৈরি এবং সক্রিয়/নিষ্ক্রিয় করুন
          </p>
        </div>
        <button
          type="button"
          onClick={openCreateForm}
          className="inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary/90"
        >
          নতুন ক্যাটাগরি
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
          <p className="mt-3 text-sm text-neutral-500">ক্যাটাগরি লোড হচ্ছে...</p>
        </div>
      ) : null}

      {!isLoading && error ? (
        <div className="mt-6 rounded-2xl border border-red-100 bg-white p-6 text-center shadow-sm">
          <p className="font-medium text-neutral-900">লোড করা যায়নি</p>
          <p className="mt-1 text-sm text-neutral-500">{error}</p>
        </div>
      ) : null}

      {!isLoading && !error && categories.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-neutral-200 bg-white p-10 text-center shadow-sm">
          <p className="font-medium text-neutral-900">কোনো ক্যাটাগরি নেই</p>
          <p className="mt-1 text-sm text-neutral-500">
            নতুন ক্যাটাগরি যোগ করে শুরু করুন
          </p>
        </div>
      ) : null}

      {!isLoading && !error && categories.length > 0 ? (
        <div className="mt-6 overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-[720px] w-full text-left text-sm">
              <thead className="bg-neutral-50 text-neutral-600">
                <tr>
                  <th className="px-4 py-3 font-medium">নাম</th>
                  <th className="px-4 py-3 font-medium">Slug</th>
                  <th className="px-4 py-3 font-medium">বিবরণ</th>
                  <th className="px-4 py-3 font-medium">স্ট্যাটাস</th>
                  <th className="px-4 py-3 font-medium">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((category) => (
                  <tr key={category.id} className="border-t border-neutral-100">
                    <td className="px-4 py-3 font-medium text-neutral-900">
                      {category.name}
                    </td>
                    <td className="px-4 py-3 text-neutral-600">{category.slug}</td>
                    <td className="max-w-xs px-4 py-3 text-neutral-600">
                      {category.description?.trim() ? category.description : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          category.is_active
                            ? 'bg-primary/10 text-primary'
                            : 'bg-neutral-100 text-neutral-600'
                        }`}
                      >
                        {category.is_active ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => openEditForm(category)}
                          className="rounded-lg border border-neutral-200 px-2.5 py-1 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
                        >
                          এডিট
                        </button>
                        {category.is_active ? (
                          <button
                            type="button"
                            onClick={() => handleDeactivate(category)}
                            disabled={statusUpdatingId === category.id}
                            className="rounded-lg border border-neutral-200 px-2.5 py-1 text-xs font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-60"
                          >
                            {statusUpdatingId === category.id
                              ? 'অপেক্ষা করুন...'
                              : 'ডিঅ্যাক্টিভেট'}
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleActivate(category)}
                            disabled={statusUpdatingId === category.id}
                            className="rounded-lg border border-neutral-200 px-2.5 py-1 text-xs font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-60"
                          >
                            {statusUpdatingId === category.id
                              ? 'অপেক্ষা করুন...'
                              : 'অ্যাক্টিভেট'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
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
            <CategoryForm
              category={editingCategory}
              onSubmit={handleFormSubmit}
              onCancel={closeForm}
            />
          </div>
        </div>
      ) : null}
    </section>
  )
}
