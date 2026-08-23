import { useCallback, useEffect, useState } from 'react'
import {
  createBatch,
  getAdminPreorderBatchErrorMessage,
  updateBatchStatus,
} from '../../api/admin/preorderBatches'
import { getPreorderBatches } from '../../api/preorders'
import PreorderBatchForm, {
  type PreorderBatchFormValues,
} from '../../components/admin/PreorderBatchForm'
import type { PreorderBatch } from '../../types'
import { formatBanglaDate, formatBanglaNumber } from '../../utils/bangla'

const STATUS_OPTIONS = [
  { value: 'open', label: 'খোলা' },
  { value: 'closed', label: 'বন্ধ' },
  { value: 'fulfilled', label: 'সম্পন্ন' },
  { value: 'cancelled', label: 'বাতিল' },
] as const

const STATUS_LABELS: Record<string, string> = {
  open: 'খোলা',
  closed: 'বন্ধ',
  fulfilled: 'সম্পন্ন',
  cancelled: 'বাতিল',
}

const STATUS_STYLES: Record<string, string> = {
  open: 'bg-green-100 text-green-800',
  closed: 'bg-neutral-100 text-neutral-600',
  fulfilled: 'bg-blue-100 text-blue-800',
  cancelled: 'bg-red-100 text-red-800',
}

const rowSelectClass =
  'w-full min-w-[8rem] rounded-lg border border-neutral-200 bg-white px-2 py-1.5 text-xs text-neutral-800 outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 disabled:cursor-not-allowed disabled:opacity-60'

function availableQuantity(batch: PreorderBatch) {
  return batch.total_quantity - batch.reserved_quantity
}

export default function PreorderBatches() {
  const [batches, setBatches] = useState<PreorderBatch[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null,
  )

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [statusUpdatingId, setStatusUpdatingId] = useState<number | null>(null)

  const loadBatches = useCallback(async () => {
    const data = await getPreorderBatches()
    setBatches(data)
  }, [])

  useEffect(() => {
    let isCancelled = false

    setIsLoading(true)
    setError(null)

    getPreorderBatches()
      .then((data) => {
        if (!isCancelled) {
          setBatches(data)
        }
      })
      .catch(() => {
        if (!isCancelled) {
          setError('ব্যাচ লোড করা যায়নি। আবার চেষ্টা করুন।')
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
    setIsFormOpen(true)
  }

  function closeForm() {
    if (isSaving) {
      return
    }

    setIsFormOpen(false)
  }

  async function handleFormSubmit(values: PreorderBatchFormValues) {
    setIsSaving(true)
    setNotice(null)

    try {
      await createBatch(values)
      setNotice({ type: 'success', text: 'নতুন ব্যাচ তৈরি হয়েছে' })
    } catch (submitError) {
      throw submitError
    } finally {
      setIsSaving(false)
    }

    setIsFormOpen(false)

    try {
      await loadBatches()
    } catch {
      setNotice({
        type: 'error',
        text: 'ব্যাচ তৈরি হয়েছে, কিন্তু লিস্ট রিফ্রেশ করা যায়নি।',
      })
    }
  }

  async function handleStatusChange(batch: PreorderBatch, nextStatus: string) {
    if (nextStatus === batch.status || statusUpdatingId === batch.id) {
      return
    }

    setStatusUpdatingId(batch.id)
    setNotice(null)

    try {
      await updateBatchStatus(batch.id, nextStatus)
      setBatches((current) =>
        current.map((item) =>
          item.id === batch.id ? { ...item, status: nextStatus } : item,
        ),
      )
      setNotice({ type: 'success', text: 'ব্যাচ স্ট্যাটাস আপডেট হয়েছে' })

      try {
        await loadBatches()
      } catch {
        // Local status already updated; list refresh can be retried later.
      }
    } catch (updateError) {
      setNotice({
        type: 'error',
        text: getAdminPreorderBatchErrorMessage(
          updateError,
          'স্ট্যাটাস পরিবর্তন করা যায়নি। আবার চেষ্টা করুন।',
        ),
      })
    } finally {
      setStatusUpdatingId(null)
    }
  }

  return (
    <section>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-neutral-900">প্রি-অর্ডার ব্যাচ</h2>
          <p className="mt-1 text-sm text-neutral-500">
            সিজনাল প্রি-অর্ডার ব্যাচ তৈরি এবং স্ট্যাটাস ম্যানেজ করুন
          </p>
        </div>
        <button
          type="button"
          onClick={openCreateForm}
          className="inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary/90"
        >
          নতুন ব্যাচ
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
          <p className="mt-3 text-sm text-neutral-500">ব্যাচ লোড হচ্ছে...</p>
        </div>
      ) : null}

      {!isLoading && error ? (
        <div className="mt-6 rounded-2xl border border-red-100 bg-white p-6 text-center shadow-sm">
          <p className="font-medium text-neutral-900">লোড করা যায়নি</p>
          <p className="mt-1 text-sm text-neutral-500">{error}</p>
        </div>
      ) : null}

      {!isLoading && !error && batches.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-neutral-200 bg-white p-10 text-center shadow-sm">
          <p className="font-medium text-neutral-900">কোনো প্রি-অর্ডার ব্যাচ নেই</p>
          <p className="mt-1 text-sm text-neutral-500">নতুন ব্যাচ তৈরি করে শুরু করুন</p>
        </div>
      ) : null}

      {!isLoading && !error && batches.length > 0 ? (
        <div className="mt-6 overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-[1120px] w-full text-left text-sm">
              <thead className="bg-neutral-50 text-neutral-600">
                <tr>
                  <th className="px-4 py-3 font-medium">প্রোডাক্ট</th>
                  <th className="px-4 py-3 font-medium">ব্যাচের নাম</th>
                  <th className="px-4 py-3 font-medium">মোট</th>
                  <th className="px-4 py-3 font-medium">রিজার্ভড</th>
                  <th className="px-4 py-3 font-medium">অবশিষ্ট</th>
                  <th className="px-4 py-3 font-medium">ইউনিট মূল্য</th>
                  <th className="px-4 py-3 font-medium">শুরু</th>
                  <th className="px-4 py-3 font-medium">শেষ</th>
                  <th className="px-4 py-3 font-medium">ডেলিভারি</th>
                  <th className="px-4 py-3 font-medium">স্ট্যাটাস</th>
                  <th className="px-4 py-3 font-medium">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody>
                {batches.map((batch) => {
                  const statusKey = batch.status?.toLowerCase()
                  const isStatusUpdating = statusUpdatingId === batch.id

                  return (
                    <tr key={batch.id} className="border-t border-neutral-100">
                      <td className="px-4 py-3 font-medium text-neutral-900">
                        {batch.product_name?.trim() || '—'}
                      </td>
                      <td className="px-4 py-3 text-neutral-700">{batch.batch_name}</td>
                      <td className="px-4 py-3 text-neutral-600">
                        {formatBanglaNumber(batch.total_quantity)}
                      </td>
                      <td className="px-4 py-3 text-neutral-600">
                        {formatBanglaNumber(batch.reserved_quantity)}
                      </td>
                      <td className="px-4 py-3 text-neutral-600">
                        {formatBanglaNumber(availableQuantity(batch))}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-neutral-900">
                        ৳{formatBanglaNumber(batch.price_per_unit)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-neutral-600">
                        {formatBanglaDate(batch.preorder_start_date) ?? '—'}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-neutral-600">
                        {formatBanglaDate(batch.preorder_end_date) ?? '—'}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-neutral-600">
                        {formatBanglaDate(batch.expected_delivery_date) ?? '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            STATUS_STYLES[statusKey] ?? 'bg-neutral-100 text-neutral-700'
                          }`}
                        >
                          {STATUS_LABELS[statusKey] ?? batch.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex min-w-[8rem] flex-col gap-1.5">
                          <select
                            aria-label="ব্যাচ স্ট্যাটাস"
                            value={statusKey}
                            disabled={isStatusUpdating}
                            onChange={(event) =>
                              handleStatusChange(batch, event.target.value)
                            }
                            className={rowSelectClass}
                          >
                            {STATUS_OPTIONS.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                          {isStatusUpdating ? (
                            <span className="text-[11px] text-neutral-500">
                              আপডেট হচ্ছে...
                            </span>
                          ) : null}
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
            <PreorderBatchForm onSubmit={handleFormSubmit} onCancel={closeForm} />
          </div>
        </div>
      ) : null}
    </section>
  )
}
