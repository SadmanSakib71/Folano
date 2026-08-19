import { Link, useNavigate } from 'react-router-dom'
import { Minus, Plus, ShoppingBasket, X } from 'lucide-react'
import { DELIVERY_CHARGE } from '../constants'
import { useAuth } from '../context/AuthContext'
import { useCart, type CartItem } from '../context/CartContext'
import { formatBanglaNumber, formatPriceWithUnit } from '../utils/bangla'
import { getPlaceholderImage } from '../utils/placeholderImages'

function formatTaka(amount: number) {
  return `৳${formatBanglaNumber(amount)}`
}

function itemImage(item: CartItem) {
  return item.image_url?.trim()
    ? item.image_url
    : getPlaceholderImage(item.name)
}

function CartLine({ item }: { item: CartItem }) {
  const { updateQuantity, removeFromCart } = useCart()
  const subtotal = item.price * item.quantity
  const atMin = item.quantity <= 1
  const atMax = item.quantity >= item.stock_quantity

  return (
    <article className="relative flex gap-3 rounded-2xl border border-primary/10 bg-white p-3 shadow-sm sm:gap-4 sm:p-4">
      <Link
        to={`/products/${item.product_id}`}
        className="h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-primary/5 sm:h-28 sm:w-28"
      >
        <img
          src={itemImage(item)}
          alt={item.name}
          className="h-full w-full object-cover"
        />
      </Link>

      <div className="min-w-0 flex-1 pr-8">
        <Link
          to={`/products/${item.product_id}`}
          className="font-heading text-base font-semibold text-text transition hover:text-primary sm:text-lg"
        >
          {item.name}
        </Link>
        <p className="mt-1 text-sm font-medium text-accent">
          {formatPriceWithUnit(item.price, item.unit)}
        </p>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex items-center rounded-full bg-cream shadow-sm ring-1 ring-primary/10">
            <button
              type="button"
              aria-label={`${item.name} এর পরিমাণ কমান`}
              onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
              disabled={atMin}
              className="flex h-10 w-10 items-center justify-center rounded-full text-primary transition hover:bg-primary/8 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Minus className="h-4 w-4" strokeWidth={2} />
            </button>
            <span className="min-w-8 text-center text-sm font-medium text-text">
              {formatBanglaNumber(item.quantity)}
            </span>
            <button
              type="button"
              aria-label={`${item.name} এর পরিমাণ বাড়ান`}
              onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
              disabled={atMax}
              className="flex h-10 w-10 items-center justify-center rounded-full text-primary transition hover:bg-primary/8 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Plus className="h-4 w-4" strokeWidth={2} />
            </button>
          </div>

          <p className="text-sm font-medium text-text">
            {formatTaka(subtotal)}
          </p>
        </div>
      </div>

      <button
        type="button"
        aria-label={`${item.name} সরান`}
        onClick={() => removeFromCart(item.product_id)}
        className="absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-full text-muted transition hover:bg-primary/8 hover:text-primary"
      >
        <X className="h-4 w-4" strokeWidth={2} />
      </button>
    </article>
  )
}

export default function Cart() {
  const navigate = useNavigate()
  const { items, totalPrice } = useCart()
  const { isAuthenticated, loading } = useAuth()
  const total = totalPrice + DELIVERY_CHARGE

  function handleCheckout() {
    if (loading) {
      return
    }

    if (!isAuthenticated) {
      navigate('/login')
      return
    }

    navigate('/checkout')
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <p className="text-sm font-medium text-accent">ফলের দোকান</p>
      <h1 className="mt-1 font-heading text-3xl font-semibold text-text sm:text-4xl">
        কার্ট
      </h1>

      {items.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-primary/10 bg-white px-6 py-16 text-center shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <ShoppingBasket className="h-8 w-8 text-primary" strokeWidth={1.5} />
          </div>
          <p className="mt-4 font-heading text-lg font-semibold text-text">
            আপনার কার্ট খালি
          </p>
          <p className="mt-1 text-sm text-muted">
            তাজা ফল বেছে নিন, কেনাকাটা শুরু করুন।
          </p>
          <Link
            to="/products"
            className="mt-5 inline-flex rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-cream shadow-[0_8px_20px_rgba(45,90,61,0.2)] transition hover:bg-primary/90"
          >
            কেনাকাটা করুন
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] xl:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="space-y-3">
            {items.map((item) => (
              <CartLine key={item.product_id} item={item} />
            ))}
          </div>

          <aside className="rounded-2xl border border-primary/10 bg-white p-5 shadow-sm lg:sticky lg:top-28">
            <h2 className="font-heading text-xl font-semibold text-text">
              অর্ডার সামারি
            </h2>

            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex items-center justify-between gap-4">
                <dt className="text-muted">সাবটোটাল</dt>
                <dd className="font-medium text-text">{formatTaka(totalPrice)}</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-muted">ডেলিভারি চার্জ</dt>
                <dd className="font-medium text-text">
                  {formatTaka(DELIVERY_CHARGE)}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4 border-t border-primary/10 pt-3">
                <dt className="font-heading text-base font-semibold text-text">
                  মোট
                </dt>
                <dd className="font-heading text-lg font-semibold text-accent">
                  {formatTaka(total)}
                </dd>
              </div>
            </dl>

            <button
              type="button"
              onClick={handleCheckout}
              disabled={loading}
              className="mt-5 w-full rounded-xl bg-primary py-3 text-sm font-medium text-cream shadow-[0_8px_20px_rgba(45,90,61,0.22)] transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70"
            >
              চেকআউটে যান
            </button>
          </aside>
        </div>
      )}
    </div>
  )
}
