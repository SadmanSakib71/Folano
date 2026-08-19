import { Leaf, Sparkles, Truck } from 'lucide-react'
import Carousel from '../components/home/Carousel'
import CategoryCards from '../components/home/CategoryCards'
import PopularProducts from '../components/home/PopularProducts'

const highlights = [
  {
    icon: Leaf,
    title: 'তাজা মৌসুমি ফল',
    text: 'প্রতিদিন বাছাই করা ফল',
    iconWrap: 'bg-primary/10 text-primary group-hover:bg-primary group-hover:text-cream',
  },
  {
    icon: Truck,
    title: 'ঘরে পৌঁছে দেই',
    text: 'নির্দিষ্ট অর্ডারে ফ্রি ডেলিভারি',
    iconWrap: 'bg-accent/15 text-accent group-hover:bg-accent group-hover:text-cream',
  },
  {
    icon: Sparkles,
    title: 'সিজনাল প্রি-অর্ডার',
    text: 'সেরা ফল আগে থেকেই বুক করুন',
    iconWrap: 'bg-[#F3E8D8] text-[#B06B1A] group-hover:bg-[#B06B1A] group-hover:text-cream',
  },
]

export default function Home() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <Carousel />

      <section className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {highlights.map((item) => {
          const Icon = item.icon

          return (
            <div
              key={item.title}
              className="group relative overflow-hidden rounded-2xl border border-primary/10 bg-white px-4 py-4 shadow-sm transition-all duration-500 ease-out hover:-translate-y-1.5 hover:border-accent/30 hover:shadow-[0_16px_32px_rgba(45,90,61,0.12)] motion-reduce:transition-none motion-reduce:hover:translate-y-0"
            >
              <div className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/50 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-full motion-reduce:hidden" />

              <div className="relative flex items-center gap-3">
                <div
                  className={`${item.iconWrap} flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-all duration-500 group-hover:scale-110 group-hover:shadow-md motion-reduce:group-hover:scale-100`}
                >
                  <Icon
                    className="h-5 w-5 transition-transform duration-500 group-hover:-rotate-6"
                    strokeWidth={1.75}
                  />
                </div>
                <div>
                  <p className="font-heading text-sm font-semibold text-text sm:text-base">
                    {item.title}
                  </p>
                  <p className="text-xs text-muted sm:text-sm">{item.text}</p>
                </div>
              </div>

              <span className="absolute bottom-0 left-0 h-0.5 w-0 bg-accent transition-all duration-500 ease-out group-hover:w-full" />
            </div>
          )
        })}
      </section>

      <section className="mt-12 sm:mt-14">
        <p className="text-sm font-medium text-accent">ফলের দোকান</p>
        <h2 className="mt-1 font-heading text-2xl font-semibold text-text sm:text-3xl">
          ক্যাটাগরি
        </h2>
        <p className="mt-1 text-muted">আপনার পছন্দের ফল খুঁজে নিন</p>
        <div className="mt-6">
          <CategoryCards />
        </div>
      </section>

      <section className="mt-12 sm:mt-14">
        <p className="text-sm font-medium text-accent">আজকের বাছাই</p>
        <h2 className="mt-1 font-heading text-2xl font-semibold text-text sm:text-3xl">
          জনপ্রিয় এখন
        </h2>
        <p className="mt-1 text-muted">আজকের পছন্দের ফলগুলো দেখুন</p>
        <div className="mt-6">
          <PopularProducts />
        </div>
      </section>
    </div>
  )
}
