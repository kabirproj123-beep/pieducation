/**
 * The "comparing right now" rail: two rows of college cards travelling in
 * opposite directions.
 *
 * A navy band, deliberately. It sits directly beneath a near-white hero, so the
 * jump is a real one — that contrast is the point, and lighter treatments were
 * tried and rejected for reading as a continuation of the hero rather than a
 * section of its own. The brand aurora and dot texture keep it from being a
 * flat block of dark.
 *
 * Server component on purpose. Everything moving here is CSS — the two tracks,
 * the pause on hover, the pulse on the live dot — so the rail costs no
 * JavaScript and stops dead for prefers-reduced-motion without a hydration
 * boundary. Each row duplicates its own list so the -50% translate wraps
 * seamlessly; the copies are aria-hidden so the names are announced once.
 */
import Link from "next/link";
import Image from "next/image";
import { gradientFor, initials } from "@/lib/avatar";

export type TrendingItem = {
  slug: string;
  name: string;
  city: string | null;
  stream: string;
  /** Photo path, or null to fall back to the generated initials tile. */
  src: string | null;
  /** Short right-hand figure — an NIRF rank or a package. Optional. */
  metric: string | null;
};

function Card({ item, hidden }: { item: TrendingItem; hidden: boolean }) {
  return (
    <Link
      href={`/colleges/${item.slug}`}
      aria-hidden={hidden || undefined}
      tabIndex={hidden ? -1 : undefined}
      className="group flex w-[17.75rem] shrink-0 items-center gap-3 rounded-xl border border-line-navy bg-navy-2/70 p-2.5 backdrop-blur transition-all duration-300 hover:-translate-y-0.5 hover:border-brand/60 hover:bg-navy-2 hover:shadow-xl hover:shadow-brand/10"
    >
      <div className="relative size-11 shrink-0 overflow-hidden rounded-lg ring-1 ring-white/10">
        {item.src ? (
          <Image
            src={item.src}
            alt=""
            fill
            sizes="44px"
            className="object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div
            className={`grid h-full w-full place-items-center bg-gradient-to-br ${gradientFor(
              item.name,
            )} font-display text-xs font-extrabold text-white`}
          >
            {initials(item.name)}
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate font-display text-sm font-bold leading-tight text-white transition-colors duration-300 group-hover:text-brand">
          {item.name}
        </p>
        <p className="truncate text-[0.7rem] leading-tight text-on-navy-dim">
          {[item.city, item.stream].filter(Boolean).join(" · ")}
        </p>
      </div>

      {item.metric ? (
        <span className="shrink-0 whitespace-nowrap rounded-md bg-brand/15 px-1.5 py-0.5 text-[0.65rem] font-bold text-brand ring-1 ring-brand/30">
          {item.metric}
        </span>
      ) : null}
    </Link>
  );
}

function Row({ items, reverse }: { items: TrendingItem[]; reverse: boolean }) {
  if (items.length === 0) return null;
  const doubled = [...items, ...items];

  return (
    <div className="marquee-mask overflow-hidden py-1.5">
      <div className={`${reverse ? "marquee-track-rev" : "marquee-track"} flex w-max gap-3`}>
        {doubled.map((item, i) => (
          <Card key={`${item.slug}-${i}`} item={item} hidden={i >= items.length} />
        ))}
      </div>
    </div>
  );
}

export function TrendingRail({ items, label }: { items: TrendingItem[]; label: string }) {
  if (items.length === 0) return null;

  // Split rather than reuse: two rows showing the same colleges in mirror
  // would read as a glitch rather than a second row.
  const half = Math.ceil(items.length / 2);
  const top = items.slice(0, half);
  const bottom = items.slice(half);

  return (
    <section className="relative isolate overflow-hidden border-y border-line bg-navy py-10">
      {/* ------------------------- atmosphere ------------------------- */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="aurora aurora-b -left-20 top-1/2 size-[26rem] -translate-y-1/2 bg-brand/20" />
        <div className="aurora aurora-c right-0 top-0 size-[22rem] bg-indigo-500/20" />
        <div className="dots-on-navy absolute inset-0" />
        {/* hairlines that fade out towards the edges */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand/40 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-brand/25 to-transparent" />
      </div>

      <div className="container-x mb-4 flex flex-wrap items-center gap-x-3 gap-y-2">
        <span className="relative grid size-2 shrink-0 place-items-center">
          <span aria-hidden className="ping-soft absolute size-2 rounded-full bg-brand" />
          <span className="size-2 rounded-full bg-brand" />
        </span>
        <p className="text-xs font-semibold uppercase tracking-widest text-on-navy-dim">{label}</p>
        <span className="ml-auto hidden items-center gap-1.5 rounded-full border border-line-navy bg-navy-2/70 px-2.5 py-1 text-[0.68rem] font-semibold text-on-navy-dim sm:inline-flex">
          Hover to pause
        </span>
      </div>

      {/* One hover target for both rows: pausing only the row under the cursor
          leaves the other sliding, which reads as a stutter. */}
      <div className="marquee-pause">
        <Row items={top} reverse={false} />
        <Row items={bottom} reverse />
      </div>
    </section>
  );
}
