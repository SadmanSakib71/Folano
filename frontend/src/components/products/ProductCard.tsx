import { Link } from 'react-router-dom'
import type { Product } from '../../types'
import { getPlaceholderImage } from '../../utils/placeholderImages'

export default function ProductCard({ product }: { product: Product }) {
  const imageSrc = product.image_url?.trim()
    ? product.image_url
    : getPlaceholderImage(product.name)

  return (
    <Link
      to={`/products/${product.id}`}
      className="group flex min-w-0 flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-primary/5 transition duration-200 hover:-translate-y-1 hover:shadow-md"
    >
      <div className="relative aspect-4/3 overflow-hidden bg-primary/5">
        <img
          src={imageSrc}
          alt={product.name}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />

        {product.is_seasonal || product.is_preorder_only ? (
          <div className="absolute left-2 top-2 flex flex-wrap gap-1">
            {product.is_seasonal ? (
              <span className="rounded-full bg-cream/90 px-2 py-0.5 text-[11px] font-medium text-accent shadow-sm">
                সিজনাল
              </span>
            ) : null}
            {product.is_preorder_only ? (
              <span className="rounded-full bg-cream/90 px-2 py-0.5 text-[11px] font-medium text-accent shadow-sm">
                প্রি-অর্ডার
              </span>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col p-3">
        <h3 className="font-heading text-sm font-semibold leading-snug text-text sm:text-base">
          {product.name}
        </h3>
        <p className="mt-2 text-sm font-medium text-accent">
          ৳{product.price}/{product.unit}
        </p>
      </div>
    </Link>
  )
}
