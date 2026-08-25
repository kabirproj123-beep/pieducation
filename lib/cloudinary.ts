/**
 * Cloudinary configuration shared by the browser and the server.
 *
 * Everything here is public by design: the cloud name and API key appear in
 * delivery URLs and in the upload widget. The API secret lives in
 * `lib/cloudinarySign.ts`, which never reaches the client.
 */

export const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? "";
export const API_KEY = process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY ?? "";

/** Every college photo lands under here, so the account stays browsable. */
export const UPLOAD_FOLDER = "pieducations/colleges";

/** Where the signing route lives; the widget posts each upload to it. */
export const SIGNATURE_ENDPOINT = "/api/admin/cloudinary/sign";

/**
 * One folder per college keeps the Media Library navigable. A college being
 * created has no slug yet, so those land at the root of the folder above.
 */
export function folderFor(slug: string): string {
  const clean = slug.trim();
  return clean ? `${UPLOAD_FOLDER}/${clean}` : UPLOAD_FOLDER;
}

/** Whether the browser has enough configuration to open the upload widget. */
export function canUpload(): boolean {
  return Boolean(CLOUD_NAME && API_KEY);
}
