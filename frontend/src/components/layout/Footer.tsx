export default function Footer() {
  return (
    <footer className="bg-primary text-cream">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <img
          src="/logo.png"
          alt="Folana"
          className="h-28 w-auto rounded-2xl bg-white object-contain p-2 shadow-md sm:h-36"
        />
        <p className="mt-6 font-body text-sm text-cream/70">
          © 2026 Folana. All rights reserved.
        </p>
      </div>
    </footer>
  )
}
