/**
 * Placeholder artwork for colleges with no confidently-matched photograph.
 *
 * Image coverage is partial by design (see lib/images.ts), so a good fallback
 * is load-bearing rather than an edge case. Both pieces are deterministic
 * functions of the name: the same college gets the same colours and the same
 * initials on every render, on the server and the client, with no layout shift
 * and no external request.
 */

const GRADIENTS = [
  "from-sky-500 to-blue-700",
  "from-emerald-500 to-teal-700",
  "from-violet-500 to-indigo-700",
  "from-amber-500 to-orange-600",
  "from-rose-500 to-pink-700",
  "from-cyan-500 to-sky-700",
];

/** Picks a gradient by hashing the seed, so it is stable across renders. */
export function gradientFor(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return GRADIENTS[h % GRADIENTS.length]!;
}

/**
 * Up to two initials. Words of three characters or fewer are skipped so
 * "Institute of Technology" reads as "IT" rather than "IO".
 */
export function initials(name: string): string {
  return name
    .replace(/[^A-Za-z\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");
}
