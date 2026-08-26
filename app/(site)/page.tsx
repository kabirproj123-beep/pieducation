import Link from "next/link";
import type { Metadata } from "next";
import { CollegeCard } from "@/components/CollegeCard";
import { CompareTool } from "@/components/CompareTool";
import { Carousel, Slide } from "@/components/Carousel";
import { Reveal } from "@/components/Motion";
import { Hero, type HeroPhoto } from "@/components/Hero";
import { TrendingRail, type TrendingItem } from "@/components/TrendingRail";
import {
  countByStreamIn,
  formatLPA,
  PRIMARY_STREAMS,
  topInStream,
  type College,
} from "@/lib/colleges";
import { getAllColleges } from "@/lib/collegeStore";
import { getImage } from "@/lib/images";
import { faqs, site } from "@/lib/content";

export const metadata: Metadata = {
  title: `${site.name} | Compare Maharashtra Colleges, Fees & Placements`,
  description: site.description,
};

/**
 * Per-stream accent: a glyph and a gradient, used on the section's icon tile
 * and as a faint wash behind its heading. Four near-identical rails in a row
 * are hard to tell apart while scrolling; a consistent colour per stream gives
 * each one a landmark.
 */
const STREAM_META: Record<string, { icon: string; tile: string }> = {
  Engineering: { icon: "⚙️", tile: "from-sky-500 to-blue-700" },
  Medical: { icon: "🩺", tile: "from-rose-500 to-red-600" },
  Management: { icon: "📈", tile: "from-amber-500 to-orange-600" },
  Law: { icon: "⚖️", tile: "from-violet-500 to-indigo-700" },
};

/** Best-known first: NIRF rank ascending with unranked last, then package. */
function byProminence(a: College, b: College) {
  const ra = a.nirf_rank ?? Number.POSITIVE_INFINITY;
  const rb = b.nirf_rank ?? Number.POSITIVE_INFINITY;
  if (ra !== rb) return ra - rb;
  return (b.avg_ctc_value ?? 0) - (a.avg_ctc_value ?? 0);
}

/**
 * Photos for the hero cluster: the most prominent photographed college from
 * each stream, so the three cards show different kinds of institution rather
 * than three engineering campuses. Falls back to filling out of the general
 * pool when a stream has no photographed college.
 */
function pickHeroPhotos(all: College[], want: number): HeroPhoto[] {
  const pool = all
    .map((c) => ({ c, img: getImage(c.slug) }))
    .filter((x): x is { c: College; img: NonNullable<ReturnType<typeof getImage>> } =>
      Boolean(x.img),
    )
    .sort((x, y) => byProminence(x.c, y.c));

  const picked: typeof pool = [];
  for (const stream of PRIMARY_STREAMS) {
    const hit = pool.find((x) => x.c.stream === stream && !picked.includes(x));
    if (hit) picked.push(hit);
  }
  for (const x of pool) {
    if (picked.length >= want) break;
    if (!picked.includes(x)) picked.push(x);
  }

  return picked.slice(0, want).map(({ c, img }) => ({
    slug: c.slug,
    name: c.short_name || c.name,
    city: c.city,
    stream: c.stream,
    nirf: c.nirf_rank,
    src: img.src,
  }));
}

export default async function Home() {
  // One fetch, then every rail is derived from it in memory.
  const all = await getAllColleges();
  const counts = countByStreamIn(all);
  const byStream = Object.fromEntries(
    PRIMARY_STREAMS.map((s) => [s, topInStream(all, s, 12)] as const),
  );

  // Compare tool: a manageable, recognisable subset rather than the full list.
  const comparePool = PRIMARY_STREAMS.flatMap((s) => byStream[s]).sort((a, b) =>
    a.name.localeCompare(b.name),
  );
  // Only the photos this pool can actually show. Resolved here so the whole
  // 17KB image map doesn't get bundled into the client component.
  const compareImages = Object.fromEntries(
    comparePool.flatMap((c) => {
      const img = getImage(c.slug);
      return img ? [[c.slug, img.src] as const] : [];
    }),
  );

  /**
   * What the compare tool opens on. The dropdown is alphabetical so a name is
   * easy to find, but opening on the first two entries alphabetically landed on
   * a pair with no fees, no ranking and no package — the tool demoed itself as
   * empty. Pick the two best-documented colleges that share a stream instead,
   * so the first thing a visitor sees is a comparison that actually compares.
   */
  const compareSeed = (() => {
    const documented = comparePool.filter((c) => c.nirf_rank && c.avg_ctc_value);
    for (const s of PRIMARY_STREAMS) {
      const inStream = documented.filter((c) => c.stream === s).sort(byProminence);
      if (inStream.length >= 2) return [inStream[0]!.slug, inStream[1]!.slug] as const;
    }
    return [comparePool[0]?.slug ?? "", comparePool[1]?.slug ?? ""] as const;
  })();

  const cities = new Set(all.map((c) => c.city).filter(Boolean));

  // Hero: three photographed campuses, plus the best package among them so the
  // floating figure is one a visitor can verify on the card next to it.
  const heroPhotos = pickHeroPhotos(all, 3);
  const heroSlugs = new Set(heroPhotos.map((p) => p.slug));
  // avg_ctc_value is stored in rupees; the badge reads in lakhs per annum.
  const heroTopRupees = all
    .filter((c) => heroSlugs.has(c.slug))
    .reduce<number>((m, c) => Math.max(m, c.avg_ctc_value ?? 0), 0);
  const heroTopCtc = heroTopRupees
    ? Math.round((heroTopRupees / 1_00_000) * 10) / 10
    : null;

  /**
   * Trending rail: five recognisable names per stream, interleaved so a single
   * row is never four engineering colleges in a run. The right-hand figure
   * prefers the NIRF rank and falls back to the package, so a card only ever
   * shows a number the college actually has.
   */
  const trending: TrendingItem[] = Array.from({ length: 5 }, (_, i) =>
    PRIMARY_STREAMS.map((s) => byStream[s][i]).filter(Boolean),
  )
    .flat()
    .map((c) => ({
      slug: c.slug,
      name: c.short_name || c.name,
      city: c.city,
      stream: c.stream,
      src: getImage(c.slug)?.src ?? null,
      // Both figures are labelled: the slot carries a rank for some colleges
      // and a salary for others, and a bare "₹9L" next to a bare "#3" reads
      // just as easily as a fee.
      metric: c.nirf_rank
        ? `NIRF #${c.nirf_rank}`
        : c.avg_ctc_value
          ? `${formatLPA(c.avg_ctc_value).replace(" LPA", "L")} avg`
          : null,
    }));

  return (
    <>
      {/* ------------------------------ hero ------------------------------ */}
      <Hero
        collegeCount={all.length}
        cityCount={cities.size}
        photos={heroPhotos}
        topCtc={heroTopCtc}
        stats={[
          { n: counts.Engineering ?? 0, label: "Engineering" },
          { n: counts.Medical ?? 0, label: "Medical" },
          { n: counts.Management ?? 0, label: "Management" },
          { n: counts.Law ?? 0, label: "Law" },
        ]}
      />

      {/* ---------------------------- trending ---------------------------- */}
      <TrendingRail items={trending} label="Colleges students are comparing right now" />

      {/* ---------------------------- by stream --------------------------- */}
      {PRIMARY_STREAMS.map((stream, i) => {
        const list = byStream[stream].slice(0, 10);
        if (list.length === 0) return null;
        const meta = STREAM_META[stream];
        return (
          <section
            key={stream}
            className={`relative isolate overflow-hidden border-b border-line ${
              i % 2 ? "bg-white" : "bg-paper-2"
            }`}
          >
            {/* A wash of the stream's own colour behind the heading, so the four
                rails are distinguishable at a glance while scrolling. */}
            <div
              aria-hidden
              className={`pointer-events-none absolute -left-24 -top-28 -z-10 size-[26rem] rounded-full bg-gradient-to-br ${meta.tile} opacity-[0.07] blur-3xl`}
            />

            <div className="container-x py-12">
              <Reveal>
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <span
                      className={`grid size-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br ${meta.tile} text-xl shadow-lg shadow-navy/20`}
                    >
                      <span aria-hidden>{meta.icon}</span>
                    </span>
                    <div>
                      <p className="eyebrow">{counts[stream]} colleges listed</p>
                      <h2 className="display-md mt-0.5 font-display">
                        Top {stream} colleges{" "}
                        <span className="font-normal text-faint">in Maharashtra</span>
                      </h2>
                    </div>
                  </div>

                  <Link
                    href={`/colleges?stream=${encodeURIComponent(stream)}`}
                    className="btn btn-ghost group px-4 py-2 text-sm shadow-sm"
                  >
                    View all {stream.toLowerCase()}
                    <span
                      aria-hidden
                      className="transition-transform duration-300 group-hover:translate-x-1"
                    >
                      →
                    </span>
                  </Link>
                </div>

                <Carousel ariaLabel={`Top ${stream} colleges`} className="mt-6">
                  {list.map((c) => (
                    <Slide key={c.slug}>
                      <CollegeCard college={c} />
                    </Slide>
                  ))}
                </Carousel>
              </Reveal>
            </div>
          </section>
        );
      })}

      {/* ----------------------------- compare ---------------------------- */}
      <section id="compare" className="relative isolate overflow-hidden border-b border-line bg-white">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-32 -top-32 -z-10 size-[30rem] rounded-full bg-gradient-to-br from-brand to-indigo-500 opacity-[0.07] blur-3xl"
        />
        <div className="container-x py-14">
          <Reveal>
            <div className="max-w-2xl">
              <p className="eyebrow">Compare</p>
              <h2 className="display-lg mt-1 font-display">
                Compare colleges{" "}
                <span className="font-normal text-faint">without confusion</span>
              </h2>
              <p className="lede mt-2">
                Pick any two institutions and see fees, placements and ROI side by side. The
                stronger figure on each row is marked, so you are not left comparing numbers in
                your head.
              </p>
            </div>
            <div className="mt-7">
              <CompareTool
                colleges={comparePool}
                images={compareImages}
                defaultA={compareSeed[0]}
                defaultB={compareSeed[1]}
              />
            </div>
          </Reveal>
        </div>
      </section>

      {/* ------------------------------ faq ------------------------------- */}
      <section className="border-b border-line bg-paper-2">
        {/*
          Heading on the left, questions on the right. When the newsletter card
          was removed this became a single narrow column centred inside the
          page container, which left its heading indented against every other
          section's left edge. The two-column split realigns it and gives the
          freed space something to do.
        */}
        <div className="container-x grid gap-8 py-14 lg:grid-cols-[19rem_1fr] lg:gap-12">
          <div className="lg:sticky lg:top-24 lg:self-start">
            <p className="eyebrow">Support centre</p>
            <h2 className="display-lg mt-1 font-display">Frequently asked questions</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              Still unsure about something? A counsellor will talk it through with you, free.
            </p>
            <Link href="/counselling" className="btn btn-primary group mt-5 px-4 py-2.5 text-sm">
              Talk to a counsellor
              <span
                aria-hidden
                className="transition-transform duration-300 group-hover:translate-x-1"
              >
                →
              </span>
            </Link>
          </div>

          <div className="space-y-3">
            {faqs.map((f) => (
              <details
                key={f.q}
                className="group rounded-xl border border-line bg-white shadow-sm transition-all duration-300 hover:border-line-strong open:border-brand/45 open:shadow-md"
              >
                {/*
                  `list-none` + `marker:content-none` removes the browser's own
                  disclosure triangle, so the chevron below is the only thing
                  telling anyone these open at all. It has to be here.
                */}
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-4 font-display text-[0.95rem] font-bold leading-snug text-ink transition-colors marker:content-none hover:text-brand-700 sm:p-5">
                  {f.q}
                  <span
                    aria-hidden
                    className="grid size-7 shrink-0 place-items-center rounded-full border border-line bg-paper-2 text-muted transition-all duration-300 group-open:rotate-180 group-open:border-brand group-open:bg-brand-tint group-open:text-brand-700"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="size-3.5"
                    >
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  </span>
                </summary>
                <p className="faq-body px-4 pb-4 text-sm leading-relaxed text-muted sm:px-5 sm:pb-5">
                  {f.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
