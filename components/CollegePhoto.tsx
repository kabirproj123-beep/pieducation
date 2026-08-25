"use client";

import Image from "next/image";
import { CldImage } from "next-cloudinary";
import type { Photo } from "@/lib/images";

/**
 * Renders a college photo from either source behind one prop.
 *
 * Cloudinary images go through `CldImage`, which adds a loader so each entry in
 * the srcset is delivered at that exact width with automatic format and
 * quality — the reason we store a public id rather than a URL. Seeded photos
 * are plain files, so they take the normal Next optimiser.
 *
 * A client component because `CldImage` uses hooks. It's a leaf, so the pages
 * that use it stay server-rendered.
 */
export function CollegePhoto({
  photo,
  sizes,
  className,
  priority,
}: {
  photo: Photo;
  /** Required: every use of this component fills its container. */
  sizes: string;
  className?: string;
  priority?: boolean;
}) {
  const common = { fill: true as const, sizes, className, priority };

  if (photo.kind === "cloudinary") {
    return <CldImage src={photo.src} alt={photo.alt} {...common} />;
  }
  return <Image src={photo.src} alt={photo.alt} {...common} />;
}
