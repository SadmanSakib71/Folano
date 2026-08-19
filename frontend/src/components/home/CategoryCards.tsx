import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { placeholderImages } from '../../utils/placeholderImages'

const categories = [
  {
    name: 'দেশি সিজনাল',
    slug: 'deshi-seasonal',
    description: 'মৌসুমের তাজা দেশি ফল',
    image: placeholderImages.mango,
  },
  {
    name: 'দেশি রেগুলার',
    slug: 'deshi-regular',
    description: 'প্রতিদিনের পছন্দের দেশি ফল',
    image: placeholderImages.banana,
  },
  {
    name: 'বিদেশি ফল',
    slug: 'imported-fruits',
    description: 'বাছাই করা আমদানিকৃত ফল',
    image: placeholderImages.kiwi,
  },
  {
    name: 'প্রি-অর্ডার',
    slug: 'preorder',
    description: 'আগেই বুক করুন, পরে উপভোগ করুন',
    image: placeholderImages.preorder,
  },
]

export default function CategoryCards() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {categories.map((category) => (
        <Link
          key={category.slug}
          to={category.slug === 'preorder' ? '/preorders' : `/products?category=${category.slug}`}
          className="group relative overflow-hidden rounded-2xl shadow-sm ring-1 ring-black/5 transition-all duration-500 ease-out hover:-translate-y-1.5 hover:shadow-[0_20px_40px_rgba(45,90,61,0.18)] hover:ring-accent/35 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
        >
          <img
            src={category.image}
            alt={category.name}
            loading="lazy"
            className="h-52 w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110 motion-reduce:transition-none motion-reduce:group-hover:scale-100 sm:h-60"
          />

          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/5 transition-colors duration-500 group-hover:from-black/80 group-hover:via-black/40" />

          <div className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-full motion-reduce:hidden" />

          <div className="absolute inset-x-0 bottom-0 p-5 transition-transform duration-500 ease-out group-hover:-translate-y-1 motion-reduce:group-hover:translate-y-0">
            <h3 className="font-heading text-lg font-semibold text-cream">
              {category.name}
            </h3>
            <p className="mt-1 text-sm text-cream/85">{category.description}</p>
            <span className="mt-3 inline-flex items-center gap-1 rounded-full py-1 text-sm font-medium text-cream transition-all duration-300 group-hover:bg-cream/15 group-hover:px-3">
              দেখুন
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </span>
          </div>

          <span className="absolute bottom-0 left-0 h-0.5 w-0 bg-accent transition-all duration-500 ease-out group-hover:w-full" />
        </Link>
      ))}
    </div>
  )
}
