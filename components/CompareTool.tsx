"use client";

/**
 * Side-by-side college comparison, the site's primary lead magnet.
 *
 * Laid out head-to-head rather than as a three-column table: each college owns
 * a side, the metric name sits between them, and the stronger figure is
 * highlighted. A table makes you read a row and work out which number is better
 * yourself, which is the confusion the section promises to remove.
 *
 * Headline metrics are shown free; the rest is blurred behind a lead form. The
 * gate is presentational only — the same data is public on each college page,
 * so nothing is really being withheld. It exists to prompt an enquiry.
 */
import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { LeadForm } from "./LeadForm";
import { gradientFor, initials } from "@/lib/avatar";
import { formatINR, formatLPA, hasVerifiedFee, type College } from "@/lib/colleges";

type Side = "a" | "b";

type Row = {
  label: string;
  get: (c: College) => string;
  gated?: boolean;
  /**
   * Which side wins, or null when the metric can't be ranked — either it's
   * qualitative (affiliation), a value is missing, or the two are equal.
   * Never guess: an unmarked row reads as "no clear winner", which is honest.
   */
  better?: (a: College, b: College) => Side | null;
};

const lower = (x?: number | null, y?: number | null): Side | null =>
  x == null || y == null || x === y ? null : x < y ? "a" : "b";
const higher = (x?: number | null, y?: number | null): Side | null =>
  x == null || y == null || x === y ? null : x > y ? "a" : "b";

/** Times over the total fee that the first year's CTC covers. */
function roiValue(c: College): number | null {
  // Never compute ROI from an unverified fee — the ratio would be as wrong as
  // the denominator, and it reads like a precise judgement.
  if (!c.avg_ctc_value || !hasVerifiedFee(c) || !c.total_fee_value) return null;
  return c.avg_ctc_value / c.total_fee_value;
}

function roi(c: College): string {
  const x = roiValue(c);
  if (x === null) return "—";
  const band = x >= 5 ? "Excellent" : x >= 2 ? "Strong" : "Moderate";
  return `${band} (${x.toFixed(1)}x)`;
}

const ROWS: Row[] = [
  {
    label: "Total fees",
    get: (c) => (hasVerifiedFee(c) ? formatINR(c.total_fee_value) : "On request"),
    // Cheaper wins, but only when both figures are verified — comparing a
    // checked fee against an unchecked one would crown an arbitrary winner.
    better: (a, b) =>
      hasVerifiedFee(a) && hasVerifiedFee(b) ? lower(a.total_fee_value, b.total_fee_value) : null,
  },
  {
    label: "Average package",
    get: (c) => formatLPA(c.avg_ctc_value),
    better: (a, b) => higher(a.avg_ctc_value, b.avg_ctc_value),
  },
  {
    label: "NIRF ranking",
    get: (c) => (c.nirf_rank ? `#${c.nirf_rank}` : "—"),
    better: (a, b) => lower(a.nirf_rank, b.nirf_rank),
  },
  {
    label: "Highest package",
    get: (c) => formatLPA(c.highest_package_value),
    gated: true,
    better: (a, b) => higher(a.highest_package_value, b.highest_package_value),
  },
  {
    label: "Placement rate",
    get: (c) => (c.placement_rate ? `${c.placement_rate}%` : "—"),
    gated: true,
    better: (a, b) => higher(a.placement_rate, b.placement_rate),
  },
  {
    label: "Return on investment",
    get: roi,
    gated: true,
    better: (a, b) => higher(roiValue(a), roiValue(b)),
  },
  { label: "Campus size", get: (c) => c.campus_size ?? "—", gated: true },
  { label: "NAAC grade", get: (c) => c.naac_grade ?? "—", gated: true },
  { label: "Affiliation", get: (c) => c.affiliation ?? "—", gated: true },
];

/** What the gate is actually withholding, read straight off ROWS so the promise
 *  and the table can never disagree. */
const GATED_LABELS = ROWS.filter((r) => r.gated).map((r) => r.label);

/* -------------------------------------------------------------------------- */

function Picker({
  id,
  label,
  college,
  slug,
  onChange,
  colleges,
  src,
}: {
  id: string;
  label: string;
  college?: College;
  slug: string;
  onChange: (v: string) => void;
  colleges: College[];
  src?: string;
}) {
  const name = college?.short_name || college?.name || "";

  return (
    <div className="min-w-0 text-center">
      <div className="relative mx-auto size-14 overflow-hidden rounded-xl shadow-sm ring-1 ring-line sm:size-16">
        {src ? (
          <Image src={src} alt="" fill sizes="64px" className="object-cover" />
        ) : (
          <div
            className={`grid h-full w-full place-items-center bg-gradient-to-br ${gradientFor(
              name || id,
            )} font-display text-sm font-extrabold text-white`}
          >
            {initials(name || "?")}
          </div>
        )}
      </div>

      <p className="mt-2 truncate font-display text-sm font-bold text-ink">{name || "—"}</p>
      <p className="truncate text-xs text-muted">{college?.city ?? ""}</p>

      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <select
        id={id}
        value={slug}
        onChange={(e) => onChange(e.target.value)}
        className="field select field-sm mt-2.5 w-full font-semibold"
      >
        {colleges.map((c) => (
          <option key={c.slug} value={c.slug}>
            {c.short_name || c.name}
          </option>
        ))}
      </select>
    </div>
  );
}

function Value({
  side,
  text,
  win,
  hidden,
}: {
  side: Side;
  text: string;
  win: boolean;
  hidden: boolean;
}) {
  return (
    <div className={`flex min-w-0 items-center ${side === "a" ? "justify-end" : "justify-start"}`}>
      <span
        aria-hidden={hidden || undefined}
        className={`truncate rounded-lg px-2 py-1 font-display text-sm font-bold transition-colors sm:text-[0.95rem] ${
          win ? "bg-brand-tint text-brand-700 ring-1 ring-brand/30" : "text-ink"
        } ${hidden ? "select-none blur-[6px]" : ""}`}
      >
        {text}
      </span>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

export function CompareTool({
  colleges,
  images = {},
  defaultA,
  defaultB,
}: {
  colleges: College[];
  /** slug → photo path. Passed in so the image map isn't bundled client-side. */
  images?: Record<string, string>;
  /** Which pair to open on. See `compareSeed` in the home page. */
  defaultA?: string;
  defaultB?: string;
}) {
  const [aSlug, setA] = useState(defaultA || colleges[0]?.slug || "");
  const [bSlug, setB] = useState(defaultB || colleges[1]?.slug || "");
  const [unlocked, setUnlocked] = useState(false);

  const a = useMemo(() => colleges.find((c) => c.slug === aSlug), [colleges, aSlug]);
  const b = useMemo(() => colleges.find((c) => c.slug === bSlug), [colleges, bSlug]);

  const swap = () => {
    setA(bSlug);
    setB(aSlug);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
      {/* Elevated explicitly rather than via .card-raised: that class lifts on
          hover, which is right for a clickable tile and wrong for a panel you
          reach into to use a control. */}
      <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-[0_1px_2px_rgb(15_23_42/0.05),0_14px_32px_-16px_rgb(15_23_42/0.25)]">
        {/* ---------------------- head to head ---------------------- */}
        <div className="grid grid-cols-[1fr_auto_1fr] items-start gap-3 border-b border-line bg-gradient-to-b from-paper-2 to-white p-4 sm:gap-6 sm:p-5">
          <Picker
            id="cmp-a"
            label="College A"
            college={a}
            slug={aSlug}
            onChange={setA}
            colleges={colleges}
            src={a ? images[a.slug] : undefined}
          />

          <button
            type="button"
            onClick={swap}
            title="Swap sides"
            aria-label="Swap the two colleges"
            className="group mt-4 grid size-11 shrink-0 place-items-center rounded-full bg-navy font-display text-[0.7rem] font-extrabold text-white shadow-lg shadow-navy/25 transition-all duration-300 hover:bg-brand-600 hover:shadow-brand/40 sm:mt-6"
          >
            <span aria-hidden className="transition-transform duration-500 group-hover:rotate-180">
              VS
            </span>
          </button>

          <Picker
            id="cmp-b"
            label="College B"
            college={b}
            slug={bSlug}
            onChange={setB}
            colleges={colleges}
            src={b ? images[b.slug] : undefined}
          />
        </div>

        {/* ------------------------- metrics ------------------------- */}
        <div>
          {ROWS.map((r) => {
            const hidden = Boolean(r.gated) && !unlocked;
            const winner = !hidden && a && b ? (r.better?.(a, b) ?? null) : null;
            return (
              <div
                key={r.label}
                className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 border-b border-line px-3 py-2.5 last:border-b-0 hover:bg-paper-2 sm:gap-4 sm:px-5 sm:py-3"
              >
                <Value side="a" text={a ? r.get(a) : "—"} win={winner === "a"} hidden={hidden} />

                <span className="flex w-[5.5rem] shrink-0 items-center justify-center gap-1 text-center text-[0.62rem] font-bold uppercase leading-tight tracking-wider text-faint sm:w-36 sm:text-[0.68rem]">
                  {hidden ? (
                    <svg
                      aria-hidden
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      className="size-3 shrink-0"
                    >
                      <rect x="4" y="11" width="16" height="10" rx="2" />
                      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
                    </svg>
                  ) : null}
                  {r.label}
                </span>

                <Value side="b" text={b ? r.get(b) : "—"} win={winner === "b"} hidden={hidden} />
              </div>
            );
          })}
        </div>

        {a && b && (
          <div className="flex flex-wrap gap-2 border-t border-line bg-paper-2 p-4">
            <Link href={`/colleges/${a.slug}`} className="btn btn-ghost px-3 py-2 text-sm">
              View {a.short_name}
            </Link>
            <Link href={`/colleges/${b.slug}`} className="btn btn-ghost px-3 py-2 text-sm">
              View {b.short_name}
            </Link>
          </div>
        )}
      </div>

      {/* -------------------------- the gate -------------------------- */}
      <div className="h-fit overflow-hidden rounded-2xl border border-line bg-white shadow-[0_1px_2px_rgb(15_23_42/0.05),0_14px_32px_-16px_rgb(15_23_42/0.25)] lg:sticky lg:top-24 lg:self-start">
        {unlocked ? (
          <div className="p-6 text-center">
            <span className="mx-auto mb-3 grid size-12 place-items-center rounded-full bg-success/15 text-success">
              <svg
                aria-hidden
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="size-6"
              >
                <path d="m5 13 4 4L19 7" />
              </svg>
            </span>
            <p className="font-display text-lg font-bold">Full comparison unlocked</p>
            <p className="mt-1 text-sm text-muted">
              Every metric is now visible. A counsellor will call to walk you through the numbers.
            </p>
          </div>
        ) : (
          <>
            {/* Gradient cap, so the gate reads as the one promoted thing on the
                page rather than another white panel beside a white panel. */}
            <div className="relative overflow-hidden bg-gradient-to-br from-brand-600 via-brand-700 to-indigo-600 p-5 text-white">
              <div
                aria-hidden
                className="pointer-events-none absolute -right-8 -top-10 size-32 rounded-full bg-white/15 blur-2xl"
              />
              <span className="relative grid size-10 place-items-center rounded-xl bg-white/20 ring-1 ring-white/30 backdrop-blur">
                <svg
                  aria-hidden
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="size-5"
                >
                  <rect x="4" y="11" width="16" height="10" rx="2" />
                  <path d="M8 11V7a4 4 0 0 1 8 0v4" />
                </svg>
              </span>
              <h3 className="relative mt-3 font-display text-lg font-bold leading-tight">
                Unlock the full comparison
              </h3>
              <p className="relative mt-1 text-sm text-white/80">
                {GATED_LABELS.length} more metrics, free.
              </p>
            </div>

            {/* Named rather than summarised: "ROI, placements, campus & rankings"
                asked people to trust a vague promise. The list is derived from
                ROWS, so it can't drift from what is actually locked. */}
            <ul className="space-y-1.5 border-b border-line bg-paper-2 px-5 py-4">
              {GATED_LABELS.map((label) => (
                <li key={label} className="flex items-center gap-2 text-sm text-ink">
                  <svg
                    aria-hidden
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="size-3.5 shrink-0 text-brand-600"
                  >
                    <path d="m5 13 4 4L19 7" />
                  </svg>
                  {label}
                </li>
              ))}
            </ul>

            <div className="p-5">
            <LeadForm
              source="compare-unlock"
              compact
              submitLabel="Unlock full report"
              successTitle="Unlocked."
              successBody="Scroll up to see the full comparison."
              onDone={() => setUnlocked(true)}
              hiddenMeta={{
                compared: [a?.name, b?.name].filter(Boolean).join(" vs "),
              }}
              extraFields={[
                {
                  name: "preferred_course",
                  label: "Preferred course*",
                  type: "select",
                  required: true,
                  options: [
                    "B.Tech (Engineering)",
                    "MBA (Management)",
                    "MBBS (Medical)",
                    "LLB / BA LLB (Law)",
                    "B.Pharm (Pharmacy)",
                    "Other",
                  ],
                },
              ]}
              />

              <p className="mt-3 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[0.68rem] font-medium text-faint">
                <span>Free</span>
                <span aria-hidden>·</span>
                <span>No spam</span>
                <span aria-hidden>·</span>
                <span>Reply within one working day</span>
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
