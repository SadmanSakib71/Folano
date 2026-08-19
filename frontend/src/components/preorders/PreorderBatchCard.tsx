import { Link } from 'react-router-dom'
import type { PreorderBatch } from '../../types'
import {
  formatBanglaDate,
  formatBanglaNumber,
  formatPriceWithUnit,
  formatUnit,
} from '../../utils/bangla'
import {
  getBatchImage,
  getBatchUnit,
  getCountdownText,
  getReservationPercent,
} from '../../utils/preorder'

export default function PreorderBatchCard({ batch }: { batch: PreorderBatch }) {
  const unit = getBatchUnit(batch)
  const imageSrc = getBatchImage(batch)
  const percent = getReservationPercent(batch)
  const countdown = getCountdownText(batch.preorder_end_date)
  const deliveryDate = formatBanglaDate(batch.expected_delivery_date)
  const endDate = formatBanglaDate(batch.preorder_end_date)

  return (
    <Link
      to={`/preorders/${batch.id}`}
      className="group flex min-w-0 flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-primary/5 transition duration-200 hover:-translate-y-1 hover:shadow-md"
    >
      <div className="relative aspect-4/3 overflow-hidden bg-primary/5">
        <img
          src={imageSrc}
          alt={batch.batch_name}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <span className="absolute left-2 top-2 rounded-full bg-cream/90 px-2 py-0.5 text-[11px] font-medium text-accent shadow-sm">
          প্রি-অর্ডার
        </span>
      </div>

      <div className="flex flex-1 flex-col p-3 sm:p-4">
        {batch.product_name ? (
          <p className="text-xs font-medium text-accent sm:text-sm">
            {batch.product_name}
          </p>
        ) : null}

        <h3
          className={[
            'font-heading text-sm font-semibold leading-snug text-text sm:text-base',
            batch.product_name ? 'mt-0.5' : '',
          ].join(' ')}
        >
          {batch.batch_name}
        </h3>

        <p className="mt-2 text-sm font-medium text-accent">
          {formatPriceWithUnit(batch.price_per_unit, unit)}
        </p>

        <p className="mt-2 text-sm text-muted">
          বাকি আছে: {formatBanglaNumber(batch.available_quantity)} {formatUnit(unit)}
        </p>

        <div className="mt-3">
          <div className="flex items-center justify-between gap-2 text-xs text-muted">
            <span>
              {formatBanglaNumber(batch.reserved_quantity)} /{' '}
              {formatBanglaNumber(batch.total_quantity)} {formatUnit(unit)}
            </span>
            <span>{formatBanglaNumber(Math.round(percent))}%</span>
          </div>
          <div className="mt-1 h-2 overflow-hidden rounded-full bg-primary/10">
            <div
              className="h-full rounded-full bg-accent transition-[width] duration-300"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>

        {deliveryDate ? (
          <p className="mt-3 text-xs text-muted">
            সম্ভাব্য ডেলিভারি:{' '}
            <span className="font-medium text-text">{deliveryDate}</span>
          </p>
        ) : null}

        {endDate ? (
          <p className="mt-1 text-xs text-muted">
            শেষ তারিখ: <span className="font-medium text-text">{endDate}</span>
          </p>
        ) : null}

        {countdown ? (
          <p className="mt-2 text-xs font-medium text-accent">{countdown}</p>
        ) : null}

        <span className="mt-4 inline-flex w-full items-center justify-center rounded-full bg-primary px-4 py-2.5 text-sm font-medium text-cream shadow-[0_8px_20px_rgba(45,90,61,0.2)] transition group-hover:bg-primary/90">
          প্রি-অর্ডার করুন
        </span>
      </div>
    </Link>
  )
}
