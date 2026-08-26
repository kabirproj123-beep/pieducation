"use client";

/**
 * Site header.
 *
 * Shares the hero's vocabulary — frosted glass, the brand→indigo gradient, and
 * spring-driven motion — so the chrome and the page below it read as one piece.
 *
 * Two behaviours worth knowing about:
 *
 * 1. It reacts to scroll. Sitting over the top of a page it stays light and
 *    borderless; once the page moves under it, it thickens into opaque glass
 *    with a border and a shadow, and the bar shortens. That keeps it out of the
 *    way of the hero without ever leaving body copy to scroll under bare text.
 *
 * 2. The nav's active pill is a single element moved between items with a
 *    layout animation, rather than one background per link. It tracks whatever
 *    is hovered and falls back to the current route when nothing is — so the
 *    highlight glides to meet the pointer and settles back on release.
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import * as motionReact from "motion/react";
import { AnimatePresence, useReducedMotion } from "motion/react";
import { site } from "@/lib/content";
import { LinkProgress } from "./LinkProgress";

const M = motionReact.motion;

/** Same mark and number the footer's social row uses. */
const WHATSAPP_URL = `https://wa.me/${site.whatsapp.replace(/\D/g, "")}`;
const WHATSAPP_PATH =
  "M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z";

const NAV = [
  { label: "Colleges", href: "/colleges" },
  { label: "Rankings", href: "/rankings" },
  { label: "Courses", href: "/courses" },
  { label: "Exams", href: "/exams" },
  { label: "Counselling", href: "/counselling" },
  { label: "Study Abroad", href: "/study-abroad" },
  { label: "About", href: "/about" },
];

export function Header() {
  const pathname = usePathname();
  const reduced = useReducedMotion() ?? false;
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [hovered, setHovered] = useState<string | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll(); // a reload part-way down the page starts scrolled
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // A route change while the sheet is open should retire it, including one that
  // came from the back button rather than a tap on a link. Adjusted during
  // render off the previous pathname rather than in an effect: React re-runs
  // this component before committing, so the sheet never paints in the open
  // state on the new route.
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpen(false);
  }

  const activeHref =
    NAV.find((i) => pathname === i.href || pathname?.startsWith(i.href + "/"))?.href ?? null;
  const highlight = hovered ?? activeHref;

  return (
    <header
      className={`sticky top-0 z-50 border-b transition-[background-color,border-color,box-shadow] duration-300 ${
        scrolled || open
          ? "border-line bg-white/80 shadow-lg shadow-navy/5 backdrop-blur-xl backdrop-saturate-150"
          : "border-transparent bg-white/45 backdrop-blur-md backdrop-saturate-150"
      }`}
    >
      <div
        className={`container-x flex items-center justify-between gap-4 transition-[height] duration-300 ${
          scrolled ? "h-16" : "h-16 lg:h-[4.75rem]"
        }`}
      >
        {/* ------------------------------ mark ------------------------------ */}
        <Link
          href="/"
          className="group flex shrink-0 items-center gap-2.5"
          aria-label={`${site.name} home`}
        >
          <span className="relative grid size-9 place-items-center overflow-hidden rounded-xl bg-gradient-to-br from-brand-600 via-brand-700 to-indigo-600 font-display text-lg font-extrabold text-white shadow-lg shadow-brand/35 transition-transform duration-300 group-hover:scale-105">
            {site.name.charAt(0)}
            {/* sheen, on hover only */}
            <span
              aria-hidden
              className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/30 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
            />
          </span>
          <span className="font-display text-[0.95rem] font-extrabold leading-none tracking-tight">
            <span className="block">{site.name}</span>
            <span className="block bg-gradient-to-r from-brand-700 to-indigo-600 bg-clip-text text-[0.62rem] font-semibold tracking-[0.18em] text-transparent">
              MAHARASHTRA
            </span>
          </span>
        </Link>

        {/* ------------------------------ nav ------------------------------- */}
        <nav
          className="hidden items-center gap-0.5 lg:flex"
          aria-label="Primary"
          onMouseLeave={() => setHovered(null)}
        >
          {NAV.map((item) => {
            const active = item.href === activeHref;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                onMouseEnter={() => setHovered(item.href)}
                onFocus={() => setHovered(item.href)}
                onBlur={() => setHovered(null)}
                className={`relative rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-200 ${
                  active ? "text-brand-700" : "text-muted hover:text-brand-700"
                }`}
              >
                {highlight === item.href &&
                  (reduced ? (
                    <span aria-hidden className="absolute inset-0 rounded-lg bg-brand-tint" />
                  ) : (
                    <M.span
                      aria-hidden
                      layoutId="nav-pill"
                      className="absolute inset-0 rounded-lg bg-brand-tint ring-1 ring-brand/25"
                      // `initial` only fires on a true first mount — moving
                      // between items reuses the same element via layoutId, so
                      // the fade never replays mid-glide. It matters on routes
                      // with no nav match (the home page), where the pill
                      // appears for the first time on hover.
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{
                        layout: { type: "spring", stiffness: 420, damping: 34, mass: 0.7 },
                        opacity: { duration: 0.18 },
                      }}
                    />
                  ))}
                {/* position:relative lifts the label over the absolute pill
                    without needing a z-index that would escape the header. */}
                <span className="relative">{item.label}</span>
                <LinkProgress />
              </Link>
            );
          })}
        </nav>

        {/* ----------------------------- actions ---------------------------- */}
        <div className="flex items-center gap-2">
          {/* WhatsApp is the one CTA in the bar. It shows at every width — on a
              phone it is the fastest way anyone contacts us, so it earns the
              space next to the menu button rather than waiting for the bottom
              bar. The label drops below sm and the mark carries it alone. */}
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Chat with us on WhatsApp"
            className="btn group gap-2 bg-[#25D366] px-3.5 py-2 text-sm text-white shadow-lg shadow-[#25D366]/30 hover:bg-[#1ebe5b]"
          >
            <svg aria-hidden viewBox="0 0 24 24" fill="currentColor" className="size-4 shrink-0">
              <path d={WHATSAPP_PATH} />
            </svg>
            <span className="hidden sm:inline">WhatsApp</span>
          </a>

          <button
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label={open ? "Close menu" : "Open menu"}
            className="grid size-9 place-items-center rounded-lg border border-line bg-white/70 transition-colors hover:border-brand hover:bg-brand-tint lg:hidden"
          >
            {/* two bars that fold into a cross */}
            <span aria-hidden className="relative block h-4 w-4">
              <span
                className={`absolute left-0 block h-[2px] w-4 rounded-full bg-ink transition-all duration-300 ${
                  open ? "top-[7px] rotate-45" : "top-[3px]"
                }`}
              />
              <span
                className={`absolute left-0 block h-[2px] w-4 rounded-full bg-ink transition-all duration-300 ${
                  open ? "top-[7px] -rotate-45" : "top-[11px]"
                }`}
              />
            </span>
          </button>
        </div>
      </div>

      {/* -------------------------- mobile sheet --------------------------- */}
      <AnimatePresence initial={false}>
        {open && (
          <M.nav
            key="mobile-nav"
            aria-label="Mobile"
            initial={reduced ? false : { height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={reduced ? { opacity: 0 } : { height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden border-t border-line bg-white/95 backdrop-blur-xl lg:hidden"
          >
            <div className="container-x grid gap-1 py-3">
              {NAV.map((item, i) => {
                const active = item.href === activeHref;
                return (
                  <M.div
                    key={item.href}
                    initial={reduced ? false : { opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 + i * 0.035, duration: 0.3, ease: "easeOut" }}
                  >
                    <Link
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      onClick={() => setOpen(false)}
                      className={`flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                        active
                          ? "bg-brand-tint text-brand-700"
                          : "text-ink hover:bg-paper-2 hover:text-brand-700"
                      }`}
                    >
                      {item.label}
                      <span aria-hidden className="text-faint">
                        →
                      </span>
                      <LinkProgress />
                    </Link>
                  </M.div>
                );
              })}
            </div>
          </M.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
