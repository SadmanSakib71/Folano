import { useEffect, useState, type FormEvent } from 'react'
import { getAdminCategoryErrorMessage } from '../../api/admin/categories'
import type { Category } from '../../types'

export interface CategoryFormValues {
  name: string
  slug: string
  description: string | null
  is_active?: boolean
}

interface CategoryFormProps {
  category?: Category
  onSubmit: (data: CategoryFormValues) => Promise<void>
  onCancel: () => void
}

const fieldClass =
  'mt-1.5 w-full rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 text-sm text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-primary focus:ring-2 focus:ring-primary/15'

const SLUG_PATTERN = /^[\p{L}\p{N}]+(?:-[\p{L}\p{N}]+)*$/u

function slugFromName(name: string) {
  return name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\p{L}\p{N}-]+/gu, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

export default function CategoryForm({
  category,
  onSubmit,
  onCancel,
}: CategoryFormProps) {
  const [name, setName] = useState(category?.name ?? '')
  const [slug, setSlug] = useState(category?.slug ?? '')
  const [description, setDescription] = useState(category?.description ?? '')
  const [isActive, setIsActive] = useState(category?.is_active ?? true)
  const [slugTouched, setSlugTouched] = useState(Boolean(category))

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const isEdit = Boolean(category)

  useEffect(() => {
    setName(category?.name ?? '')
    setSlug(category?.slug ?? '')
    setDescription(category?.description ?? '')
    setIsActive(category?.is_active ?? true)
    setSlugTouched(Boolean(category))
    setFieldErrors({})
    setSubmitError(null)
  }, [category])

  function handleNameChange(value: string) {
    setName(value)

    if (!slugTouched) {
      setSlug(slugFromName(value))
    }
  }

  function handleSlugChange(value: string) {
    setSlug(value)
    setSlugTouched(true)
  }

  function validate() {
    const errors: Record<string, string> = {}

    if (!name.trim()) {
      errors.name = 'ক্যাটাগরির নাম লিখুন'
    }

    const nextSlug = slug.trim()

    if (!nextSlug) {
      errors.slug = 'slug লিখুন'
    } else if (!SLUG_PATTERN.test(nextSlug)) {
      errors.slug = 'slug শুধুমাত্র অক্ষর, সংখ্যা এবং হাইফেন হতে পারে'
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
      const values: CategoryFormValues = {
        name: name.trim(),
        slug: slug.trim(),
        description: description.trim() || null,
      }

      if (isEdit) {
        values.is_active = isActive
      }

      await onSubmit(values)
    } catch (error) {
      setSubmitError(getAdminCategoryErrorMessage(error))
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <h3 className="text-lg font-semibold text-primary">
        {isEdit ? 'ক্যাটাগরি এডিট' : 'নতুন ক্যাটাগরি'}
      </h3>

      <label htmlFor="category-name" className="mt-4 block text-sm font-medium text-neutral-800">
        নাম <span className="text-red-600">*</span>
      </label>
      <input
        id="category-name"
        name="name"
        type="text"
        value={name}
        onChange={(event) => handleNameChange(event.target.value)}
        className={fieldClass}
        disabled={saving}
      />
      {fieldErrors.name ? (
        <p className="mt-1 text-xs text-red-600">{fieldErrors.name}</p>
      ) : null}

      <label htmlFor="category-slug" className="mt-4 block text-sm font-medium text-neutral-800">
        Slug <span className="text-red-600">*</span>
      </label>
      <input
        id="category-slug"
        name="slug"
        type="text"
        value={slug}
        onChange={(event) => handleSlugChange(event.target.value)}
        className={fieldClass}
        disabled={saving}
      />
      {fieldErrors.slug ? (
        <p className="mt-1 text-xs text-red-600">{fieldErrors.slug}</p>
      ) : null}

      <label
        htmlFor="category-description"
        className="mt-4 block text-sm font-medium text-neutral-800"
      >
        বিবরণ
      </label>
      <textarea
        id="category-description"
        name="description"
        rows={3}
        value={description}
        onChange={(event) => setDescription(event.target.value)}
        className={`${fieldClass} resize-y`}
        disabled={saving}
      />

      {isEdit ? (
        <label className="mt-4 flex items-center gap-2 text-sm text-neutral-800">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(event) => setIsActive(event.target.checked)}
            disabled={saving}
            className="h-4 w-4 rounded border-neutral-300 text-primary focus:ring-primary"
          />
          সক্রিয়
        </label>
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
          {saving ? 'সেভ হচ্ছে...' : isEdit ? 'আপডেট করুন' : 'সেভ করুন'}
        </button>
      </div>
    </form>
  )
}
