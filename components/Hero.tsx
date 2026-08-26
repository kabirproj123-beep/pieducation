"use client";

/**
 * Home page hero.
 *
 * Three layers, back to front: a drifting aurora + dot-grid backdrop, the copy
 * column, and a cluster of real campus photographs that bob idly and lean
 * towards the pointer. The photos are chosen from the live college data by the
 * server (see app/(site)/page.tsx) so the hero always shows institutions the
 * site actually lists, with their real NIRF rank and city.
 *
 * Everything here degrades to a still, fully-legible layout under
 * prefers-reduced-motion: the CSS keyframes rest on the identity transform (see
 * globals.css) and the JS-driven pieces are gated on `useReducedMotion`.
 */

import Link from "next/link";
import Image from "next/image";
import * as motionReact from "motion/react";
import {
  AnimatePresence,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
  type MotionValue,
} from "motion/react";
import { useEffect, useRef, useState } from "react";
import { CountUp } from "./Motion";

const M = motionReact.motion;

export type HeroPhoto = {
  slug: string;
  name: string;
  city: string | null;
  stream: string;
  nirf: number | null;
  src: string;
};

export type HeroStat = { n: number; label: string };

/**
 * The phrase that cycles in the headline. It sits at the end of the line so a
 * shorter word can never shove following text around — no width juggling, no
 * layout animation.
 */
const ROTATING = [
  "admission",
  "engineering college",
  "medical seat",
  "MBA campus",
  "law school",
];

const QUICK = [
  { label: "IIT Bombay", q: "IIT Bombay" },
  { label: "Pune", q: "Pune" },
  { label: "MBBS", q: "MBBS" },
  { label: "MBA", q: "MBA" },
];

/* -------------------------------------------------------------------------- */

function RotatingPhrase() {
  const reduced = useReducedMotion();
  const [i, setI] = useState(0);

  useEffect(() => {
    if (reduced) return;
    const id = setInterval(() => setI((v) => (v + 1) % ROTATING.length), 2400);
    return () => clearInterval(id);
  }, [reduced]);

  const gradient =
    "bg-gradient-to-r from-brand-600 via-brand-700 to-indigo-600 bg-clip-text text-transparent";

  // Screen readers get one stable sentence rather than a word that mutates
  // underneath them mid-announcement.
  if (reduced) return <span className={gradient}>{ROTATING[0]}</span>;

  return (
    <>
      <span className="sr-only">{ROTATING[0]}</span>
      {/* The padding is the descender allowance. `overflow-hidden` clips to the
          padding box, and the headline's 1.08 line-height leaves the line box
          ending above the baseline's descent — without this the g's in
          "engineering college" and "law school" lose their tails. It stays well
          short of the 0.9em the incoming word travels, so the swap is still
          masked. */}
      <span aria-hidden className="relative inline-block overflow-hidden pb-[0.2em] align-bottom">
        <AnimatePresence mode="wait" initial={false}>
          <M.span
            key={ROTATING[i]}
            className={`inline-block ${gradient}`}
            initial={{ y: "0.9em", opacity: 0, filter: "blur(6px)" }}
            animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
            exit={{ y: "-0.9em", opacity: 0, filter: "blur(6px)" }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          >
            {ROTATING[i]}
          </M.span>
        </AnimatePresence>
      </span>
    </>
  );
}

/* -------------------------------------------------------------------------- */

/** Where each photo sits, how far it leans, and how it bobs. */
const LAYOUT = [
  { pos: "left-0 top-[7%] w-[55%] aspect-[3/4] z-10", depth: 26, dur: 7.4, delay: 0 },
  { pos: "right-0 top-0 w-[41%] aspect-square z-0", depth: -18, dur: 6.2, delay: 0.7 },
  { pos: "bottom-0 right-[7%] w-[47%] aspect-[4/3] z-20", depth: 15, dur: 8.6, delay: 1.3 },
];

/**
 * One photo card. Split into three nested elements so the entrance (motion),
 * the pointer lean (motion) and the idle bob (CSS) each own a transform and
 * never overwrite one another.
 */
function PhotoCard({
  photo,
  index,
  mx,
  my,
  reduced,
}: {
  photo: HeroPhoto;
  index: number;
  mx: MotionValue<number>;
  my: MotionValue<number>;
  reduced: boolean;
}) {
  const l = LAYOUT[index]!;
  const x = useTransform(mx, (v) => v * l.depth);
  const y = useTransform(my, (v) => v * l.depth);

  return (
    <M.div
      className={`absolute ${l.pos}`}
      initial={reduced ? false : { opacity: 0, scale: 0.88, y: 28 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.7, delay: 0.15 + index * 0.13, ease: [0.22, 1, 0.36, 1] }}
    >
      <M.div style={reduced ? undefined : { x, y }} className="h-full w-full">
        <div
          className={reduced ? "h-full w-full" : "hero-float h-full w-full"}
          style={{ animationDuration: `${l.dur}s`, animationDelay: `${l.delay}s` }}
        >
          <Link
            href={`/colleges/${photo.slug}`}
            className="group relative block h-full w-full overflow-hidden rounded-2xl shadow-2xl shadow-navy/30 ring-1 ring-navy/10 transition duration-300 hover:shadow-navy/40 hover:ring-brand/60"
          >
            <Image
              src={photo.src}
              alt={`${photo.name} campus`}
              fill
              sizes="(max-width: 1024px) 45vw, 22vw"
              priority={index === 0}
              className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.07]"
            />
            <div
              aria-hidden
              className="absolute inset-0 bg-gradient-to-t from-navy/85 via-navy/15 to-navy/5"
            />

            {photo.nirf ? (
              <span className="absolute right-2.5 top-2.5 rounded-md bg-white/95 px-2 py-0.5 text-[0.68rem] font-bold text-ink shadow-sm">
                NIRF #{photo.nirf}
              </span>
            ) : null}

            <div className="absolute inset-x-0 bottom-0 p-3 sm:p-3.5">
              <span className="mb-1.5 inline-flex rounded-full bg-brand/25 px-2 py-0.5 text-[0.62rem] font-bold uppercase tracking-wider text-white ring-1 ring-white/30 backdrop-blur">
                {photo.stream}
              </span>
              <p className="font-display text-sm font-bold leading-tight text-white drop-shadow sm:text-[0.95rem]">
                {photo.name}
              </p>
              {photo.city ? (
                <p className="text-[0.7rem] font-medium text-white/75">{photo.city}</p>
              ) : null}
            </div>
          </Link>
        </div>
      </M.div>
    </M.div>
  );
}

function PhotoCluster({
  photos,
  cityCount,
  topCtc,
  mx,
  my,
  reduced,
}: {
  photos: HeroPhoto[];
  cityCount: number;
  topCtc: number | null;
  mx: MotionValue<number>;
  my: MotionValue<number>;
  reduced: boolean;
}) {
  if (photos.length === 0) return null;

  return (
    <div className="relative mx-auto h-[24rem] w-full max-w-md sm:h-[28rem] lg:h-[34rem] lg:max-w-none">
      {photos.slice(0, LAYOUT.length).map((p, i) => (
        <PhotoCard key={p.slug} photo={p} index={i} mx={mx} my={my} reduced={reduced} />
      ))}

      {/* --- figures floating over the cluster --- */}
      {topCtc ? (
        <M.div
          className="glass absolute -left-2 bottom-[16%] z-30 rounded-xl px-3.5 py-2.5 sm:-left-5"
          initial={reduced ? false : { opacity: 0, scale: 0.8, x: -12 }}
          animate={{ opacity: 1, scale: 1, x: 0 }}
          transition={{ duration: 0.55, delay: 0.85, ease: [0.34, 1.56, 0.64, 1] }}
        >
          <p className="text-[0.62rem] font-bold uppercase tracking-wider text-faint">
            Top avg package
          </p>
          <p className="font-display text-xl font-extrabold leading-tight text-ink">
            ₹<CountUp to={topCtc} decimals={1} />
            <span className="text-sm text-brand-700"> LPA</span>
          </p>
        </M.div>
      ) : null}

      <M.div
        className="glass absolute -right-1 top-[28%] z-30 flex items-center gap-2 rounded-full px-3 py-1.5 sm:-right-4"
        initial={reduced ? false : { opacity: 0, scale: 0.8, x: 12 }}
        animate={{ opacity: 1, scale: 1, x: 0 }}
        transition={{ duration: 0.55, delay: 1, ease: [0.34, 1.56, 0.64, 1] }}
      >
        <span className="relative grid size-2 place-items-center">
          <span aria-hidden className="ping-soft absolute size-2 rounded-full bg-success" />
          <span className="size-2 rounded-full bg-success" />
        </span>
        <span className="font-display text-xs font-bold text-ink">
          <CountUp to={cityCount} /> cities covered
        </span>
      </M.div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

export function Hero({
  collegeCount,
  cityCount,
  stats,
  photos,
  topCtc,
}: {
  collegeCount: number;
  cityCount: number;
  stats: HeroStat[];
  photos: HeroPhoto[];
  topCtc: number | null;
}) {
  const reduced = useReducedMotion() ?? false;
  const sectionRef = useRef<HTMLElement>(null);

  /**
   * Pointer lean, normalised to -0.5…0.5 across the hero and eased through a
   * spring. The listener is bound to the section rather than the window so it
   * costs nothing once the hero is scrolled past, and the section's rect is
   * cached on enter/resize — reading it per pointermove would force a layout
   * on every frame of a mouse sweep.
   */
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const mx = useSpring(rawX, { stiffness: 55, damping: 20, mass: 0.6 });
  const my = useSpring(rawY, { stiffness: 55, damping: 20, mass: 0.6 });
  const rect = useRef<DOMRect | null>(null);

  useEffect(() => {
    if (reduced) return;
    const clear = () => {
      rect.current = null;
    };
    window.addEventListener("resize", clear);
    window.addEventListener("scroll", clear, { passive: true });
    return () => {
      window.removeEventListener("resize", clear);
      window.removeEventListener("scroll", clear);
    };
  }, [reduced]);

  // Fine pointers only: a touch device has no hover, so the handler would only
  // ever fire mid-tap and leave the cluster stuck off-centre.
  const onPointerMove = (e: React.PointerEvent) => {
    if (reduced || e.pointerType !== "mouse") return;
    const r = (rect.current ??= sectionRef.current?.getBoundingClientRect() ?? null);
    if (!r) return;
    rawX.set((e.clientX - (r.left + r.width / 2)) / r.width);
    rawY.set((e.clientY - (r.top + r.height / 2)) / r.height);
  };

  const onPointerLeave = () => {
    rawX.set(0);
    rawY.set(0);
  };

  // One shared entrance timeline for the copy column.
  const rise = (delay: number) => ({
    initial: reduced ? false : { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] as const },
  });

  return (
    <section
      ref={sectionRef}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      className="relative isolate overflow-hidden border-b border-line bg-paper"
    >
      {/* ------------------------- atmosphere ------------------------- */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-brand-tint/70 via-white to-white" />
        <div className="aurora aurora-a -left-24 -top-40 size-[34rem] bg-brand/35" />
        <div className="aurora aurora-b -right-32 -top-24 size-[30rem] bg-indigo-400/25" />
        <div className="aurora aurora-c left-1/3 top-40 size-[26rem] bg-cyan-300/25" />
        <div className="hero-dots absolute inset-0" />
      </div>

      <div className="container-x relative py-12 md:py-16 lg:py-20">
        <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] lg:gap-10 xl:grid-cols-[minmax(0,1fr)_minmax(0,30rem)]">
          {/* ----------------------- copy column ----------------------- */}
          <div>
            <M.div {...rise(0)}>
              <span className="chip chip-brand gap-1.5 py-1 pl-1.5 pr-2.5">
                <span className="relative grid size-2 place-items-center">
                  <span aria-hidden className="ping-soft absolute size-2 rounded-full bg-brand-600" />
                  <span className="size-2 rounded-full bg-brand-600" />
                </span>
                Maharashtra · {collegeCount} colleges
              </span>
            </M.div>

            <M.h1 {...rise(0.08)} className="display-xl mt-4 font-display">
              Your career begins
              <br />
              with the right
              <br />
              <RotatingPhrase />
            </M.h1>

            <M.p {...rise(0.16)} className="lede mt-5 max-w-xl">
              Compare every major college in Maharashtra. Real fees, placement packages and
              rankings for Engineering, Medical, Management and Law. Then talk to a counsellor,
              free.
            </M.p>

            {/* --------------------- search --------------------- */}
            <M.div {...rise(0.24)} className="mt-7 max-w-xl">
              <form action="/colleges" method="get">
                <div className="flex items-center gap-1.5 rounded-2xl border border-line bg-white/85 p-1.5 shadow-xl shadow-navy/5 backdrop-blur transition-all duration-300 focus-within:border-brand-600 focus-within:shadow-brand/25">
                  <svg
                    aria-hidden
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    className="ml-2.5 size-[1.15rem] shrink-0 text-faint"
                  >
                    <circle cx="11" cy="11" r="7" />
                    <path d="m20 20-3.5-3.5" />
                  </svg>
                  <input
                    name="q"
                    placeholder="Search a college, city or course…"
                    aria-label="Search colleges"
                    className="w-full bg-transparent px-1 py-2.5 text-sm text-ink outline-none placeholder:text-faint"
                  />
                  <button className="btn btn-primary shrink-0 px-5 py-2.5 text-sm">Search</button>
                </div>
              </form>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="text-xs font-medium text-faint">Popular:</span>
                {QUICK.map((q) => (
                  <Link
                    key={q.label}
                    href={`/colleges?q=${encodeURIComponent(q.q)}`}
                    className="chip transition-colors hover:border-brand hover:bg-brand-tint hover:text-brand-700"
                  >
                    {q.label}
                  </Link>
                ))}
              </div>
            </M.div>

            {/* ---------------------- stats ---------------------- */}
            <M.dl
              {...rise(0.32)}
              className="mt-9 flex flex-wrap gap-x-8 gap-y-5 border-t border-line pt-6"
            >
              {stats.map((s) => (
                <div key={s.label}>
                  <dd className="font-display text-2xl font-extrabold leading-none text-ink">
                    <CountUp to={s.n} />
                    <span className="text-brand-600">+</span>
                  </dd>
                  <dt className="mt-1.5 text-[0.68rem] font-semibold uppercase tracking-wider text-faint">
                    {s.label}
                  </dt>
                </div>
              ))}
            </M.dl>
          </div>

          {/* ---------------------- photo cluster ---------------------- */}
          <PhotoCluster
            photos={photos}
            cityCount={cityCount}
            topCtc={topCtc}
            mx={mx}
            my={my}
            reduced={reduced}
          />
        </div>
      </div>
    </section>
  );
}
