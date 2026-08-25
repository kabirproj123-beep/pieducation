"use client";

/**
 * The college table, filtered in the browser.
 *
 * The catalogue is ~190 rows and projects to about 25 KB of the fields this
 * table actually shows, so it ships once and every search keystroke, stream
 * change and page turn is instant. The old GET form re-ran the whole render —
 * session lookup included — for each one.
 */
import { useMemo, useState } from "react";
import Link from "next/link";
import { STREAMS, formatINR } from "@/lib/colleges";
import { CollegePhoto } from "@/components/CollegePhoto";
import DeleteCollegeButton from "./DeleteCollegeButton";
import ClientPager from "../_components/ClientPager";

const PER_PAGE = 25;

export type CollegeRow = {
  slug: string;
  name: string;
  shortName: string;
  stream: string;
  city: string | null;
  nirf: number | null;
  fee: number | null;
  feeVerified: boolean;
  updatedAt: string | null;
  /** The photo the public page shows, or null when it falls back to a gradient. */
  cover: { kind: "cloudinary" | "local"; src: string } | null;
  /** Admin-uploaded photos. Zero with a cover set means it's the seeded one. */
  uploads: number;
};

/** Which photo state a row is in — the thing the thumbnail has to make obvious. */
type PhotoState = "uploaded" | "stock" | "none";

function photoState(row: CollegeRow): PhotoState {
  if (row.uploads > 0) return "uploaded";
  return row.cover ? "stock" : "none";
}

const PHOTO_FILTERS = [
  { value: "All", label: "Any photo state" },
  { value: "uploaded", label: "Has uploaded photos" },
  { value: "stock", label: "Stock photo only" },
  { value: "none", label: "No photo" },
] as const;

/**
 * The at-a-glance photo column.
 *
 * A thumbnail means the public page has a picture; the dashed placeholder means
 * it falls back to a lettered gradient. A seeded Wikimedia photo looks the same
 * as an uploaded one — it renders the same on the site — so the distinction is
 * carried by the hover title and the Photos filter rather than by a badge on
 * every row.
 */
function PhotoCell({ row }: { row: CollegeRow }) {
  const state = photoState(row);

  if (!row.cover) {
    return (
      <span
        title="No photo — the public page falls back to a lettered gradient"
        aria-label="No photo"
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-dashed border-line-strong text-faint"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-4 w-4" aria-hidden>
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <path d="m21 15-5-5L5 21" />
        </svg>
      </span>
    );
  }

  return (
    <span
      title={
        state === "uploaded"
          ? `${row.uploads} uploaded photo${row.uploads === 1 ? "" : "s"}`
          : "Stock Wikimedia photo — nothing uploaded yet"
      }
      className="relative block h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-paper-2"
    >
      <CollegePhoto
        photo={{ ...row.cover, alt: row.name, credit: null, width: null, height: null }}
        sizes="40px"
        className="object-cover"
      />
      {row.uploads > 1 && (
        <span className="absolute bottom-0 right-0 rounded-tl-md bg-ink/80 px-1 text-[0.6rem] font-bold leading-[1.1rem] text-white">
          {row.uploads}
        </span>
      )}
    </span>
  );
}

function Fee({ row }: { row: CollegeRow }) {
  return row.feeVerified ? (
    <span className="tabular-nums">{formatINR(row.fee)}</span>
  ) : (
    <span className="text-faint" title="Fee not verified — hidden on the public page">
      on request
    </span>
  );
}

const action =
  "rounded-lg border border-line px-2.5 py-1.5 text-xs font-semibold hover:bg-paper-2";

export default function CollegesTable({ rows: all }: { rows: CollegeRow[] }) {
  const [q, setQ] = useState("");
  const [stream, setStream] = useState("All");
  const [photos, setPhotos] = useState<string>("All");
  const [page, setPage] = useState(1);

  const results = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return all.filter((c) => {
      if (stream !== "All" && c.stream !== stream) return false;
      if (photos !== "All" && photoState(c) !== photos) return false;
      if (!needle) return true;
      return (
        c.name.toLowerCase().includes(needle) ||
        c.shortName.toLowerCase().includes(needle) ||
        (c.city ?? "").toLowerCase().includes(needle) ||
        c.stream.toLowerCase().includes(needle)
      );
    });
  }, [all, q, stream, photos]);

  const pageCount = Math.max(1, Math.ceil(results.length / PER_PAGE));
  const current = Math.min(page, pageCount);
  const rows = results.slice((current - 1) * PER_PAGE, current * PER_PAGE);

  const filtered = q !== "" || stream !== "All" || photos !== "All";
  const editHref = (slug: string) => `/admin/colleges/${slug}`;

  function clear() {
    setQ("");
    setStream("All");
    setPhotos("All");
    setPage(1);
  }

  return (
    <>
      <div className="card flex flex-wrap items-end gap-3 p-4">
        <label className="min-w-[14rem] flex-1">
          <span className="mb-1 block text-xs font-semibold text-muted">Search</span>
          <input
            type="search"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
            placeholder="Name, short name or city"
            className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm"
          />
        </label>
        <label>
          <span className="mb-1 block text-xs font-semibold text-muted">Stream</span>
          <select
            value={stream}
            onChange={(e) => {
              setStream(e.target.value);
              setPage(1);
            }}
            className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm"
          >
            <option value="All">All streams</option>
            {STREAMS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="mb-1 block text-xs font-semibold text-muted">Photos</span>
          <select
            value={photos}
            onChange={(e) => {
              setPhotos(e.target.value);
              setPage(1);
            }}
            className="w-full cursor-pointer rounded-lg border border-line bg-white px-3 py-2 text-sm"
          >
            {PHOTO_FILTERS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
        </label>
        {filtered && (
          <button type="button" onClick={clear} className="cursor-pointer px-1 py-2 text-sm text-muted underline">
            Clear
          </button>
        )}
      </div>

      <div className="card overflow-hidden">
        {/* desktop */}
        <div className="hidden overflow-x-auto lg:block">
          <table className="dtable min-w-[58rem]">
            <thead>
              <tr>
                <th>College</th>
                <th>Stream</th>
                <th>City</th>
                <th>NIRF</th>
                <th>Total fee</th>
                <th>Updated</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.slug}>
                  <td>
                    <div className="flex items-center gap-3">
                      <PhotoCell row={c} />
                      <Link
                        href={editHref(c.slug)}
                        className="font-semibold text-ink hover:underline"
                      >
                        {c.name}
                      </Link>
                    </div>
                  </td>
                  <td className="whitespace-nowrap text-sm">{c.stream}</td>
                  <td className="whitespace-nowrap text-sm">{c.city ?? "—"}</td>
                  <td className="text-sm tabular-nums">{c.nirf ?? "—"}</td>
                  <td className="whitespace-nowrap text-sm">
                    <Fee row={c} />
                  </td>
                  <td className="whitespace-nowrap text-xs tabular-nums text-muted">
                    {c.updatedAt
                      ? new Date(c.updatedAt).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "2-digit",
                        })
                      : "—"}
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <Link href={editHref(c.slug)} className={action}>
                        Edit
                      </Link>
                      <Link href={`/colleges/${c.slug}`} className={action}>
                        View
                      </Link>
                      <DeleteCollegeButton slug={c.slug} name={c.name} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* phone */}
        <ul className="divide-y divide-line lg:hidden">
          {rows.map((c) => (
            <li key={c.slug} className="p-4">
              <div className="flex items-start gap-3">
                <PhotoCell row={c} />
                <div className="min-w-0 flex-1">
                  <Link href={editHref(c.slug)} className="font-semibold text-ink">
                    {c.name}
                  </Link>
                  <p className="mt-0.5 text-xs text-muted">
                    {c.stream}
                    {c.city ? ` · ${c.city}` : ""}
                    {c.nirf ? ` · NIRF ${c.nirf}` : ""}
                  </p>
                  <p className="mt-1 text-sm">
                    <Fee row={c} />
                  </p>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <Link href={editHref(c.slug)} className={action}>
                  Edit
                </Link>
                <Link href={`/colleges/${c.slug}`} className={action}>
                  View
                </Link>
                <DeleteCollegeButton slug={c.slug} name={c.name} />
              </div>
            </li>
          ))}
        </ul>

        {results.length === 0 ? (
          <div className="p-12 text-center">
            <p className="font-display text-lg font-bold">Nothing matches that search</p>
            <button
              type="button"
              onClick={clear}
              className="mt-2 inline-block text-sm text-brand-700 underline"
            >
              Clear the filters
            </button>
          </div>
        ) : (
          <ClientPager
            page={current}
            pageCount={pageCount}
            total={results.length}
            perPage={PER_PAGE}
            unit="colleges"
            onPage={setPage}
          />
        )}
      </div>
    </>
  );
}
