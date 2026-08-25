/**
 * College photography.
 *
 * Two sources, in priority order:
 *
 * 1. Photos an admin uploaded, stored on the college record as Cloudinary
 *    public ids and delivered straight from Cloudinary.
 * 2. The seeded Wikimedia set below, for colleges nobody has photographed yet.
 *
 * `collegePhotos()` is the only thing the UI should call — it picks between the
 * two and hands back a shape that `<CollegePhoto>` can render either way.
 *
 * The seeded images come from Wikipedia/Wikimedia Commons under free licences
 * and are stored locally in public/colleges.
 * Matching is intentionally conservative: a college with no confident match
 * gets no photo rather than someone else's building. Coverage is therefore
 * partial by design, and the UI falls back to a generated gradient.
 *
 * Most of these licences (CC BY, CC BY-SA) require attribution, so every photo
 * carries its credit — see `CollegeImage`.
 */
import images from "@/data/college_images.json";
import type { College, CollegeImage } from "./colleges";

export type ImageMeta = {
  src: string;
  wikipedia_title: string;
  license: string | null;
  author: string | null;
};

const MAP = images as Record<string, ImageMeta>;

export function getImage(slug: string): ImageMeta | null {
  return MAP[slug] ?? null;
}

export function hasImage(slug: string): boolean {
  return slug in MAP;
}

export function imageCount(): number {
  return Object.keys(MAP).length;
}

/** Short credit line, e.g. "Photo: Jane Doe / CC BY-SA 4.0 via Wikimedia". */
export function creditLine(meta: ImageMeta): string {
  const bits = [meta.author, meta.license].filter(Boolean);
  return bits.length ? `Photo: ${bits.join(" / ")} · Wikimedia` : "Photo via Wikimedia Commons";
}

/* ---------------------------------------------------------------------- */
/* Resolution — what the UI actually renders.                             */
/* ---------------------------------------------------------------------- */

/**
 * One renderable photo, whichever source it came from. `src` is a Cloudinary
 * public id for uploads and a path under /public for the seeded set; the
 * `kind` says which, and `<CollegePhoto>` branches on it.
 */
export type Photo = {
  kind: "cloudinary" | "local";
  src: string;
  alt: string;
  credit: string | null;
  width: number | null;
  height: number | null;
};

function fromUpload(img: CollegeImage, college: College): Photo {
  return {
    kind: "cloudinary",
    src: img.public_id,
    alt: img.alt ?? `${college.short_name || college.name} campus`,
    credit: img.credit,
    width: img.width,
    height: img.height,
  };
}

function fromSeed(meta: ImageMeta, college: College): Photo {
  return {
    kind: "local",
    src: meta.src,
    alt: `${college.short_name || college.name} campus`,
    credit: creditLine(meta),
    width: null,
    height: null,
  };
}

/**
 * Every photo for a college, cover first. Uploads win outright rather than
 * merging with the seeded photo: once someone has chosen real pictures, a
 * stock Wikimedia shot alongside them looks like a mistake.
 */
export function collegePhotos(college: College): Photo[] {
  // `images` is normalised on the way out of the store, but a cached read can
  // predate the field: entries written before it existed are replayed as-is,
  // and a missing array must not take a page down.
  const uploads = college.images ?? [];
  if (uploads.length > 0) return uploads.map((i) => fromUpload(i, college));

  const seed = getImage(college.slug);
  return seed ? [fromSeed(seed, college)] : [];
}

/** The single image used on cards and in the page hero, or null for none. */
export function collegeCover(college: College): Photo | null {
  return collegePhotos(college)[0] ?? null;
}
