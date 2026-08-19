import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import type { User } from "../../types";
import { formatBanglaNumber } from "../../utils/bangla";
import {
  CalendarClock,
  ChevronDown,
  Home,
  LogOut,
  Menu,
  Package,
  ShoppingBasket,
  ShoppingCart,
  User as UserIcon,
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

function AccountMenu({ user }: { user: User }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const onPointerDown = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  function handleLogout() {
    logout();
    setOpen(false);
    navigate("/login");
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        aria-label="অ্যাকাউন্ট মেনু"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="flex max-w-[9.5rem] items-center gap-1.5 rounded-full py-1 pl-1 pr-2 text-sm font-medium text-primary transition-colors hover:bg-primary/8 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:max-w-[12rem] sm:pr-3"
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
          <UserIcon className="h-4 w-4" strokeWidth={1.75} />
        </span>
        <span className="min-w-0 truncate">{user.name}</span>
        <ChevronDown
          className={[
            "h-4 w-4 shrink-0 transition-transform duration-200",
            open ? "rotate-180" : "",
          ].join(" ")}
          strokeWidth={1.75}
        />
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-48 overflow-hidden rounded-2xl border border-primary/10 bg-white py-1 shadow-[0_16px_40px_rgba(45,90,61,0.14)]"
        >
          <Link
            role="menuitem"
            to="/orders"
            className="flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-text transition-colors hover:bg-primary/8 hover:text-primary"
          >
            <Package className="h-4 w-4 shrink-0" strokeWidth={1.75} />
            আমার অর্ডার
          </Link>
          <button
            type="button"
            role="menuitem"
            onClick={handleLogout}
            className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-sm text-text transition-colors hover:bg-primary/8 hover:text-primary"
          >
            <LogOut className="h-4 w-4 shrink-0" strokeWidth={1.75} />
            লগআউট
          </button>
        </div>
      ) : null}
    </div>
  );
}

export default function Header() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { totalItems } = useCart();
  const { user, loading, isAuthenticated, logout } = useAuth();

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

  function handleMobileLogout() {
    logout();
    setOpen(false);
    navigate("/login");
  }

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

            {loading ? (
              <div
                className="h-10 w-20 animate-pulse rounded-full bg-primary/10"
                aria-hidden
              />
            ) : isAuthenticated && user ? (
              <AccountMenu user={user} />
            ) : (
              <Link
                to="/login"
                className="inline-flex h-10 items-center rounded-full bg-primary px-3.5 text-sm font-medium text-cream shadow-[0_6px_16px_rgba(45,90,61,0.18)] transition hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                লগইন
              </Link>
            )}

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
            {loading ? null : isAuthenticated && user ? (
              <div className="mt-1 border-t border-primary/10 pt-1">
                <p className="px-4 py-2 text-sm font-medium text-primary">
                  {user.name}
                </p>
                <Link
                  to="/orders"
                  className="flex items-center gap-3 rounded-2xl px-4 py-3 text-base font-medium text-text transition-colors hover:bg-primary/8 hover:text-primary"
                >
                  <Package className="h-5 w-5 shrink-0" strokeWidth={1.75} />
                  আমার অর্ডার
                </Link>
                <button
                  type="button"
                  onClick={handleMobileLogout}
                  className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-base font-medium text-text transition-colors hover:bg-primary/8 hover:text-primary"
                >
                  <LogOut className="h-5 w-5 shrink-0" strokeWidth={1.75} />
                  লগআউট
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="mt-1 flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-base font-medium text-text transition-colors hover:bg-primary/8 hover:text-primary"
              >
                <UserIcon className="h-5 w-5 shrink-0" strokeWidth={1.75} />
                লগইন
              </Link>
            )}
          </div>
        ) : null}
      </div>
    </header>
  );
}
