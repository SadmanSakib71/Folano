import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import { formatBanglaNumber } from "../../utils/bangla";
import {
  CalendarClock,
  Home,
  Menu,
  Package,
  ShoppingBasket,
  ShoppingCart,
  User,
  X,
} from "lucide-react";

const links = [
  { to: "/", label: "হোম", end: true, icon: Home },
  { to: "/products", label: "ফল", icon: ShoppingBasket },
  { to: "/preorders", label: "প্রি-অর্ডার", icon: CalendarClock },
  { to: "/orders", label: "অর্ডার", icon: Package },
];

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  [
    "rounded-full px-4 py-2 text-sm font-medium tracking-wide transition-all duration-300",
    isActive
      ? "bg-primary text-cream shadow-[0_6px_16px_rgba(45,90,61,0.22)]"
      : "text-muted hover:bg-primary/8 hover:text-primary",
  ].join(" ");

const mobileLinkClass = ({ isActive }: { isActive: boolean }) =>
  [
    "flex items-center gap-3 rounded-2xl px-4 py-3 text-base font-medium transition-all duration-300",
    isActive
      ? "bg-primary text-cream shadow-sm"
      : "text-text hover:bg-primary/8 hover:text-primary",
  ].join(" ");

export default function Header() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const { totalItems } = useCart();

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header className="sticky top-0 z-50">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-linear-to-b from-cream via-cream/90 to-transparent" />

      <div className="relative px-3 pt-3 sm:px-4 sm:pt-4">
        <div
          className={[
            "relative z-50 mx-auto flex max-w-6xl items-center justify-between gap-3 rounded-2xl border px-3 py-2.5 transition-all duration-300 sm:px-4",
            scrolled || open
              ? "border-primary/10 bg-white/85 shadow-[0_12px_40px_rgba(45,90,61,0.12)] backdrop-blur-xl"
              : "border-white/70 bg-white/70 shadow-[0_8px_28px_rgba(45,90,61,0.08)] backdrop-blur-md",
          ].join(" ")}
        >
          <NavLink to="/" className="group flex min-w-0 items-center gap-2.5">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white shadow-[0_6px_16px_rgba(45,90,61,0.16)] ring-1 ring-primary/10 transition-transform duration-300 group-hover:scale-105">
              <img
                src="/logo-mark.png"
                alt=""
                className="h-full w-full object-contain p-0.5"
              />
            </span>
            <span className="min-w-0">
              <span className="block font-heading text-lg font-semibold leading-none tracking-tight text-primary sm:text-xl">
                ফলানা
              </span>
              <span className="mt-0.5 hidden text-[11px] font-medium tracking-wide text-muted sm:block">
                প্রকৃতি থেকে সতেজতা
              </span>
            </span>
          </NavLink>

          <nav
            className="hidden items-center gap-1 lg:flex"
            aria-label="প্রধান মেনু"
          >
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={navLinkClass}
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <Link
              to="/cart"
              aria-label="কার্ট"
              className="relative flex h-10 w-10 items-center justify-center rounded-full text-primary transition-colors hover:bg-primary/8 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              <ShoppingCart className="h-5 w-5" strokeWidth={1.75} />
              {/* Hide the badge when the cart is empty so the icon stays clean. */}
              {totalItems > 0 ? (
                <span className="absolute -right-0.5 -top-0.5 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-semibold leading-none text-cream">
                  {formatBanglaNumber(totalItems)}
                </span>
              ) : null}
            </Link>

            <button
              type="button"
              aria-label="অ্যাকাউন্ট"
              className="hidden h-10 w-10 items-center justify-center rounded-full text-primary transition-colors hover:bg-primary/8 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:flex"
            >
              <User className="h-5 w-5" strokeWidth={1.75} />
            </button>

            <button
              type="button"
              aria-label={open ? "মেনু বন্ধ করুন" : "মেনু খুলুন"}
              aria-expanded={open}
              aria-controls="mobile-nav"
              onClick={() => setOpen((value) => !value)}
              className="flex h-10 w-10 items-center justify-center rounded-full text-primary transition-colors hover:bg-primary/8 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent lg:hidden"
            >
              {open ? (
                <X className="h-5 w-5" strokeWidth={1.75} />
              ) : (
                <Menu className="h-5 w-5" strokeWidth={1.75} />
              )}
            </button>
          </div>
        </div>

        {open ? (
          <button
            type="button"
            aria-label="মেনু বন্ধ করুন"
            className="fixed inset-0 z-40 bg-text/20 backdrop-blur-[2px] lg:hidden"
            onClick={() => setOpen(false)}
          />
        ) : null}

        {open ? (
          <div
            id="mobile-nav"
            className="relative z-50 mx-auto mt-2 max-w-6xl overflow-hidden rounded-2xl border border-primary/10 bg-white/95 p-2 shadow-[0_16px_40px_rgba(45,90,61,0.14)] backdrop-blur-xl lg:hidden"
          >
            <nav className="flex flex-col gap-1" aria-label="মোবাইল মেনু">
              {links.map((link) => {
                const Icon = link.icon;

                return (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    end={link.end}
                    className={mobileLinkClass}
                  >
                    <Icon className="h-5 w-5 shrink-0" strokeWidth={1.75} />
                    {link.label}
                  </NavLink>
                );
              })}
            </nav>
            <button
              type="button"
              className="mt-1 flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-base font-medium text-text transition-colors hover:bg-primary/8 hover:text-primary sm:hidden"
            >
              <User className="h-5 w-5 shrink-0" strokeWidth={1.75} />
              অ্যাকাউন্ট
            </button>
          </div>
        ) : null}
      </div>
    </header>
  );
}
