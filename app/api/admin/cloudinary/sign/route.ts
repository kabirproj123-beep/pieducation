/**
 * Upload signing for the admin media widget.
 *
 * next-cloudinary POSTs `{ paramsToSign }` here and expects `{ signature }`
 * back. Signing is the whole authorisation step for an upload, so the admin
 * session is checked first and the parameters are checked second.
 */
import { NextResponse } from "next/server";
import { currentAdmin } from "@/lib/adminAuth";
import { checkUploadParams, isCloudinaryConfigured, signUploadParams } from "@/lib/cloudinarySign";

export async function POST(request: Request) {
  const admin = await currentAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Sign in to upload photos." }, { status: 401 });
  }

  if (!isCloudinaryConfigured()) {
    return NextResponse.json(
      {
        error:
          "Cloudinary isn't configured. Set NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME, " +
          "NEXT_PUBLIC_CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET, then restart the server.",
      },
      { status: 500 },
    );
  }

  let paramsToSign: unknown;
  try {
    ({ paramsToSign } = await request.json());
  } catch {
    return NextResponse.json({ error: "Malformed request." }, { status: 400 });
  }

  if (!paramsToSign || typeof paramsToSign !== "object" || Array.isArray(paramsToSign)) {
    return NextResponse.json({ error: "Nothing to sign." }, { status: 400 });
  }

  const params = paramsToSign as Record<string, unknown>;
  const problem = checkUploadParams(params);
  if (problem) return NextResponse.json({ error: problem }, { status: 400 });

  return NextResponse.json({ signature: signUploadParams(params) });
}
