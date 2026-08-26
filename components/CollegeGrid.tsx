"use client";

/**
 * The /colleges results grid, revealed a page at a time behind a "See more".
 *
 * The pagination is deliberately client-side, over a list the server has
 * already read. It is worth being explicit about why, because the obvious
 * alternative is worse: fetching each page from Firestore on demand would turn
 * one cached collection read into a fresh billed read per "See more" click,
 * per visitor. The catalogue is ~200 records and is read once per hour into
 * the server cache, so slicing it here costs nothing and spends no quota.
 *
 * What it does buy is the browser: 192 cards is 192 next/image mounts and a
 * long first paint on a phone. A page of 24 is a screenful or two.
 *
 * Filters live in the URL and re-render the server component with a new list,
 * which remounts this one — so changing a filter correctly drops you back to
 * the first page rather than leaving you deep in a stale result set.
 */

import { useState } from "react";
import { CollegeCard } from "@/components/CollegeCard";
import type { College } from "@/lib/colleges";

const PAGE = 24;

export function CollegeGrid({ colleges }: { colleges: College[] }) {
  const [shown, setShown] = useState(PAGE);
  const visible = colleges.slice(0, shown);
  const remaining = colleges.length - visible.length;

  return (
    <>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {visible.map((c) => (
          <CollegeCard key={c.slug} college={c} />
        ))}
      </div>

      {remaining > 0 && (
        <div className="mt-8 flex flex-col items-center gap-2">
          <button
            type="button"
            onClick={() => setShown((n) => n + PAGE)}
            className="btn btn-ghost px-6 py-2.5 text-sm"
          >
            See more colleges
          </button>
          <p className="text-xs text-faint">
            Showing {visible.length} of {colleges.length} · {remaining} more
          </p>
        </div>
      )}
    </>
  );
}
