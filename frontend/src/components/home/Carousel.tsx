import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { toBanglaDigits } from '../../utils/bangla'
import { placeholderImages } from '../../utils/placeholderImages'

const slides = [
  {
    eyebrow: 'সিজনাল প্রি-অর্ডার',
    heading: 'সিজনের সেরা ফল আগে থেকেই বুক করুন',
    text: 'তাজা মৌসুমি ফলের জন্য আজই আপনার প্রি-অর্ডার করুন।',
    image: placeholderImages.mango,
    imageAlt: 'মৌসুমি আম',
    ctaLabel: 'প্রি-অর্ডার করুন',
    ctaTo: '/preorders',
  },
  {
    eyebrow: 'নতুন এসেছে',
    heading: 'নতুন আমদানি করা ফল এখন পাওয়া যাচ্ছে',
    text: 'বেছে নিন আপনার পছন্দের বিদেশি ফল।',
    image: placeholderImages.grapes,
    imageAlt: 'আমদানি করা আঙুর',
    ctaLabel: 'ফল দেখুন',
    ctaTo: '/products',
  },
  {
    eyebrow: 'বিশেষ অফার',
    heading: 'ফ্রি ডেলিভারি উপভোগ করুন',
    text: 'নির্দিষ্ট অর্ডারে কোনো ডেলিভারি চার্জ নেই।',
    image: placeholderImages.default,
    imageAlt: 'মিশ্র তাজা ফলের ঝুড়ি',
    ctaLabel: 'এখনই দেখুন',
    ctaTo: '/products',
  },
]

const SLIDE_INTERVAL_MS = 3500

export default function Carousel() {
  const [index, setIndex] = useState(0)

  // Restart the timer whenever the slide changes, including after a dot click.
  useEffect(() => {
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % slides.length)
    }, SLIDE_INTERVAL_MS)

    return () => window.clearInterval(timer)
  }, [index])

  return (
    <div className="relative overflow-hidden rounded-2xl shadow-md">
      <div
        className="flex transition-transform duration-500 ease-out"
        style={{ transform: `translateX(-${index * 100}%)` }}
      >
        {slides.map((slide) => (
          <div
            key={slide.heading}
            className="relative flex min-h-[240px] min-w-full shrink-0 items-center overflow-hidden px-5 py-8 sm:min-h-[260px] sm:px-8 md:min-h-[300px] md:px-10"
          >
            <img
              src={slide.image}
              alt={slide.imageAlt}
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div
              className="absolute inset-0"
              style={{
                backgroundImage:
                  'linear-gradient(to right, rgba(0, 0, 0, 0.65), rgba(0, 0, 0, 0.25), rgba(0, 0, 0, 0))',
              }}
            />
            <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/35 to-transparent" />

            <div className="relative z-10 max-w-xl pb-6">
              <p className="inline-flex rounded-full bg-cream/15 px-3 py-1 text-xs font-medium tracking-wide text-cream sm:text-sm">
                {slide.eyebrow}
              </p>
              <h2 className="mt-3 font-heading text-xl font-semibold leading-snug text-cream sm:text-3xl md:text-4xl">
                {slide.heading}
              </h2>
              <p className="mt-2 max-w-md text-sm leading-relaxed text-cream/90 sm:text-base">
                {slide.text}
              </p>
              <Link
                to={slide.ctaTo}
                className="mt-5 inline-flex rounded-full bg-cream px-4 py-2 text-sm font-medium text-primary shadow-sm transition hover:bg-white"
              >
                {slide.ctaLabel}
              </Link>
            </div>
          </div>
        ))}
      </div>

      <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 gap-2">
        {slides.map((slide, slideIndex) => {
          const isActive = slideIndex === index

          return (
            <button
              key={slide.heading}
              type="button"
              aria-label={`স্লাইড ${toBanglaDigits(slideIndex + 1)} দেখুন`}
              aria-current={isActive}
              onClick={() => setIndex(slideIndex)}
              className={`h-2.5 rounded-full transition-all ${
                isActive
                  ? 'w-6 bg-cream'
                  : 'w-2.5 bg-cream/45 hover:bg-cream/75'
              }`}
            />
          )
        })}
      </div>
    </div>
  )
}
