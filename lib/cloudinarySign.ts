/**
 * Cloudinary upload signing.
 *
 * Uploads are *signed*, not preset-based: the browser widget asks this app to
 * sign each upload, and only a signed-in admin gets a signature. An unsigned
 * preset would let anyone who found the cloud name upload into the account.
 *
 * The API secret is read here and nowhere else.
 */
import "server-only";
import { createHash } from "node:crypto";
import { CLOUD_NAME, API_KEY, UPLOAD_FOLDER } from "./cloudinary";

const API_SECRET = process.env.CLOUDINARY_API_SECRET ?? "";

/** A signature older than this is refused, limiting replay of a leaked one. */
const MAX_SKEW_SECONDS = 60 * 10;

export function isCloudinaryConfigured(): boolean {
  return Boolean(CLOUD_NAME && API_KEY && API_SECRET);
}

/** Never signed: the file itself, and anything that identifies the account. */
const SKIP = new Set(["file", "cloud_name", "resource_type", "api_key"]);

/** Cloudinary joins array values with commas before signing them. */
function serialise(value: unknown): string {
  return Array.isArray(value) ? value.map((v) => String(v)).join(",") : String(value);
}

/**
 * Cloudinary's signature: every parameter except the file and the credentials,
 * sorted by key, joined `k=v&k=v`, with the API secret appended, then SHA-1.
 */
export function signUploadParams(params: Record<string, unknown>): string {
  const signable = Object.entries(params)
    .filter(([k, v]) => !SKIP.has(k) && v !== undefined && v !== null && v !== "")
    .map(([k, v]) => [k, serialise(v)] as const)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join("&");

  return createHash("sha1").update(signable + API_SECRET).digest("hex");
}

/**
 * Guard the parameters the browser asked us to sign.
 *
 * Only admins reach the signing route, but a signature authorises whatever it
 * covers — so an upload is confined to our folder, and the timestamp has to be
 * roughly now.
 */
export function checkUploadParams(params: Record<string, unknown>): string | null {
  const folder = params.folder === undefined ? UPLOAD_FOLDER : String(params.folder);
  if (folder !== UPLOAD_FOLDER && !folder.startsWith(`${UPLOAD_FOLDER}/`)) {
    return `Uploads are limited to the ${UPLOAD_FOLDER} folder.`;
  }

  // A public id with ".." or a leading slash would escape the folder above.
  if (params.public_id !== undefined) {
    const id = String(params.public_id);
    if (id.startsWith("/") || id.split("/").includes("..")) return "Invalid public id.";
  }

  const timestamp = Number(params.timestamp);
  if (!Number.isFinite(timestamp)) return "Missing upload timestamp.";
  if (Math.abs(Date.now() / 1000 - timestamp) > MAX_SKEW_SECONDS) {
    return "That upload request has expired — reload the page and try again.";
  }

  return null;
}
