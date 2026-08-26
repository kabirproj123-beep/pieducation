import Link from "next/link";
import { CollegePhoto } from "@/components/CollegePhoto";
import { formatINR, formatLPA, hasVerifiedFee, type College } from "@/lib/colleges";
import { getImage } from "@/lib/images";
import { gradientFor, initials } from "@/lib/avatar";

/**
 * The college tile used by the home rails, the /colleges grid and the related
 * block on a college page.
 *
 * Motion is deliberately restrained — this thing appears twelve at a time, so
 * anything lively becomes a mess at scale. Everything is hover-only and driven
 * off one `group`: the card lifts, its shadow deepens, the photo eases in a few
 * percent, a brand rule draws across the top, and the title takes the brand
 * colour. Nothing moves until you point at it, and nothing loops.
 *
 * The stream badge sits on the photo rather than in the body: it is true of
 * every card in a stream rail, so in that context it is the least informative
 * thing on the tile and shouldn't take a line of body space from the figures.
 */
export function CollegeCard({ college: c }: { college: College }) {
  const cover = collegeCover(c);
  const verified = hasVerifiedFee(c);
  const name = c.short_name || c.name;

  return (
    <Link
      href={`/colleges/${c.slug}`}
      className="card-raised group relative flex h-full flex-col overflow-hidden"
    >
      {/* Brand rule, drawn left-to-right on hover. */}
      <span
        aria-hidden
        className="absolute inset-x-0 top-0 z-20 h-[3px] origin-left scale-x-0 bg-gradient-to-r from-brand-600 via-brand to-indigo-500 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-x-100"
      />

      <div className="relative h-32 shrink-0 overflow-hidden sm:h-36">
        {img ? (
          <Image
            src={img.src}
            alt={`${name} campus`}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.06]"
          />
        ) : (
          <div
            className={`h-full w-full bg-gradient-to-br ${gradientFor(
              c.name,
            )} transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.06]`}
          >
            <span
              aria-hidden
              className="absolute bottom-1 right-3 font-display text-4xl font-extrabold text-white/25"
            >
              {initials(name)}
            </span>
          </div>
        )}

        {/* Scrim — keeps both badges legible over any photograph. */}
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-t from-navy/75 via-navy/5 to-navy/25"
        />

        {c.nirf_rank ? (
          <span className="absolute right-2.5 top-2.5 rounded-md bg-white/95 px-2 py-0.5 text-[0.68rem] font-bold text-ink shadow-sm ring-1 ring-navy/10">
            NIRF #{c.nirf_rank}
          </span>
        ) : null}

        <span className="absolute bottom-2.5 left-2.5 rounded-full bg-white/15 px-2 py-0.5 text-[0.62rem] font-bold uppercase tracking-wider text-white ring-1 ring-white/30 backdrop-blur">
          {c.stream}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-3.5 sm:p-4">
        <h3 className="font-display text-[0.95rem] font-bold leading-snug text-ink transition-colors duration-300 group-hover:text-brand-700 sm:text-[0.98rem]">
          {name}
        </h3>
        <p className="mt-0.5 text-xs text-muted">
          {c.city}
          {c.ownership ? ` · ${c.ownership}` : ""}
        </p>

        {c.naac_grade ? (
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            <span className="chip">NAAC {c.naac_grade}</span>
          </div>
        ) : null}

        <dl className="mt-auto grid grid-cols-2 gap-x-3 gap-y-1 border-t border-line pt-3 text-sm">
          <div>
            <dt className="text-[0.68rem] uppercase tracking-wide text-faint">
              {verified ? "Total fees" : "Fees"}
            </dt>
            <dd className={verified ? "font-semibold text-ink" : "font-semibold text-muted"}>
              {verified ? formatINR(c.total_fee_value) : "On request"}
            </dd>
          </div>
          <div>
            <dt className="text-[0.68rem] uppercase tracking-wide text-faint">Avg package</dt>
            <dd className="font-semibold text-ink">{formatLPA(c.avg_ctc_value)}</dd>
          </div>
        </dl>

        <span
          aria-hidden
          className="mt-3 inline-flex items-center gap-1 font-display text-[0.72rem] font-bold uppercase tracking-wider text-brand-700"
        >
          View details
          <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
        </span>
      </div>
    </Link>
  );
}
