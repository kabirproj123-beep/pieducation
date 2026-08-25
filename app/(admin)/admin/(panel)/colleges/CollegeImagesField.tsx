"use client";

import { useState } from "react";
import { CldImage, CldUploadWidget } from "next-cloudinary";
import type { CloudinaryUploadWidgetInfo } from "@cloudinary-util/types";
import { SIGNATURE_ENDPOINT, canUpload, folderFor } from "@/lib/cloudinary";
import type { CollegeImage } from "@/lib/colleges";

const INPUT =
  "w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink placeholder:text-faint";

/** What the account is willing to store — enforced again by Cloudinary itself. */
const FORMATS = ["png", "jpg", "jpeg", "webp", "avif"];
const MAX_BYTES = 10 * 1024 * 1024;
const MAX_FILES = 12;

function isUploadInfo(info: unknown): info is CloudinaryUploadWidgetInfo {
  return typeof info === "object" && info !== null && "public_id" in info;
}

/**
 * Photo management for one college.
 *
 * Images are part of the form's college state, so they save with everything
 * else — there's no separate "save photos" step, and abandoning the form
 * abandons the changes. What it doesn't undo is the upload itself: a file
 * that reached Cloudinary stays in the Media Library even if the record is
 * never saved. Removing a photo here unlinks it rather than deleting it,
 * which keeps a mis-click from destroying an asset that another draft uses.
 */
export function CollegeImagesField({
  slug,
  images,
  onChange,
}: {
  slug: string;
  images: CollegeImage[];
  onChange: (next: CollegeImage[]) => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const configured = canUpload();

  const set = (i: number, patch: Partial<CollegeImage>) =>
    onChange(images.map((img, j) => (i === j ? { ...img, ...patch } : img)));

  const move = (i: number, by: number) => {
    const j = i + by;
    if (j < 0 || j >= images.length) return;
    const next = [...images];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };

  const add = (info: CloudinaryUploadWidgetInfo) => {
    const publicId = String(info.public_id ?? "");
    if (!publicId) return;
    // The widget can re-fire success on retry; adding the same id twice would
    // show the photo twice on the public page.
    if (images.some((img) => img.public_id === publicId)) return;

    onChange([
      ...images,
      {
        public_id: publicId,
        width: typeof info.width === "number" ? info.width : null,
        height: typeof info.height === "number" ? info.height : null,
        format: typeof info.format === "string" ? info.format : null,
        alt: null,
        credit: null,
      },
    ]);
  };

  return (
    <section className="card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-bold">
            Photos <span className="text-sm font-normal text-muted">({images.length})</span>
          </h2>
          <p className="mt-1 text-sm text-muted">
            The first photo is the cover — it appears on the college card and behind the page
            heading. Saved with the rest of the form.
          </p>
        </div>

        {configured ? (
          <CldUploadWidget
            signatureEndpoint={SIGNATURE_ENDPOINT}
            options={{
              folder: folderFor(slug),
              tags: slug ? ["college", slug] : ["college"],
              multiple: true,
              maxFiles: MAX_FILES,
              sources: ["local", "url", "camera"],
              clientAllowedFormats: FORMATS,
              maxFileSize: MAX_BYTES,
            }}
            onSuccess={(result) => {
              setError(null);
              if (isUploadInfo(result.info)) add(result.info);
            }}
            onError={(err) => {
              const message =
                typeof err === "string"
                  ? err
                  : ((err as { statusText?: string })?.statusText ??
                    "The upload failed. Check your connection and try again.");
              setError(message);
            }}
          >
            {({ open }) => (
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  open();
                }}
                className="btn btn-ghost cursor-pointer px-3 py-2 text-sm"
              >
                + Upload photos
              </button>
            )}
          </CldUploadWidget>
        ) : null}
      </div>

      {!configured && (
        <p className="mt-4 rounded-lg border border-warn/40 bg-warn/5 p-4 text-sm text-muted">
          Cloudinary isn&apos;t configured, so photos can&apos;t be uploaded. Set{" "}
          <code>NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME</code>,{" "}
          <code>NEXT_PUBLIC_CLOUDINARY_API_KEY</code> and <code>CLOUDINARY_API_SECRET</code> in
          <code> .env.local</code>, then restart the server.
        </p>
      )}

      {error && (
        <p role="alert" className="mt-4 text-sm font-medium text-danger">
          {error}
        </p>
      )}

      {images.length === 0 ? (
        <p className="mt-4 rounded-lg border border-dashed border-line-strong p-4 text-center text-sm text-muted">
          No photos yet. Without one the card falls back to a lettered gradient.
        </p>
      ) : (
        <div className="mt-4 space-y-3">
          {images.map((img, i) => (
            <div
              key={img.public_id}
              className="grid gap-3 rounded-xl border border-line bg-paper-2 p-4 sm:grid-cols-[10rem_1fr]"
            >
              <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-line">
                <CldImage
                  src={img.public_id}
                  alt={img.alt ?? "College photo"}
                  fill
                  sizes="160px"
                  crop="fill"
                  gravity="auto"
                  className="object-cover"
                />
                {i === 0 && (
                  <span className="absolute left-1.5 top-1.5 rounded-md bg-white/95 px-1.5 py-0.5 text-[0.65rem] font-bold text-ink">
                    Cover
                  </span>
                )}
              </div>

              <div className="min-w-0">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="truncate text-xs text-faint" title={img.public_id}>
                    {img.public_id}
                    {img.width && img.height ? ` · ${img.width}×${img.height}` : ""}
                  </span>
                  <span className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      onClick={() => move(i, -1)}
                      disabled={i === 0}
                      aria-label="Move earlier"
                      className="cursor-pointer rounded-md border border-line bg-white px-2 py-1 text-xs disabled:cursor-default disabled:opacity-30"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      onClick={() => move(i, 1)}
                      disabled={i === images.length - 1}
                      aria-label="Move later"
                      className="cursor-pointer rounded-md border border-line bg-white px-2 py-1 text-xs disabled:cursor-default disabled:opacity-30"
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      onClick={() => onChange(images.filter((_, j) => j !== i))}
                      className="cursor-pointer rounded-md border border-danger/40 px-2 py-1 text-xs font-semibold text-danger hover:bg-danger/5"
                    >
                      Remove
                    </button>
                  </span>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-1 block text-xs font-semibold text-muted">Alt text</span>
                    <input
                      value={img.alt ?? ""}
                      onChange={(e) => set(i, { alt: e.target.value || null })}
                      placeholder="Main academic building, seen from the quadrangle"
                      className={INPUT}
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-xs font-semibold text-muted">Credit</span>
                    <input
                      value={img.credit ?? ""}
                      onChange={(e) => set(i, { credit: e.target.value || null })}
                      placeholder="Photo: college media office"
                      className={INPUT}
                    />
                  </label>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
