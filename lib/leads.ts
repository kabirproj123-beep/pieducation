/**
 * Leads — the core of the business. Every gated tool on the site (comparison
 * unlock, loan calculator, counselling request, newsletter) funnels here, and
 * the admin panel at /admin reads it back.
 *
 * Storage: Firestore only. If Firebase is not configured, writes fail loudly
 * instead of silently falling back to a local JSON file.
 */
import "server-only";
import { unstable_cache, updateTag } from "next/cache";
import { getAdminDb, isFirebaseConfigured } from "./firebaseAdmin";
import { LEAD_SOURCES, type Lead, type LeadSource, type LeadStatus, type NewLead } from "./leadTypes";

// Re-exported so server callers keep importing everything from one place.
// Client components must import from ./leadTypes instead — this module is
// server-only and reaches firebase-admin.
export * from "./leadTypes";

const COLLECTION = "leads";
export const LEADS_TAG = "leads";

/**
 * How many leads the admin dashboard pulls, and for how long that read is
 * reused.
 *
 * /admin is `force-dynamic`, so before this every visit to the panel's landing
 * page billed one document read per lead, up to 500 — and the admin lands
 * there after every save and every navigation. A morning's work could spend
 * the whole day's free quota on the same rows over and over.
 *
 * A minute of cache collapses that burst to one read, and `LEADS_TAG` is
 * cleared whenever a lead is created or its status changes, so an enquiry that
 * arrives while the admin is looking still shows up on the next render rather
 * than a minute later.
 */
const LEADS_PAGE = 200;
const LEADS_TTL_SECONDS = 60;

/* ----------------------------- validation ------------------------------ */

/** Indian mobile numbers: 10 digits starting 6-9, tolerant of +91 / spaces. */
export function normalisePhone(input: string): string | null {
  const digits = (input || "").replace(/\D/g, "");
  const local = digits.length > 10 ? digits.slice(-10) : digits;
  if (local.length !== 10) return null;
  if (!/^[6-9]/.test(local)) return null;
  return local;
}

export function validateLead(input: Partial<NewLead>): { ok: true; lead: NewLead } | { ok: false; error: string } {
  const name = (input.name ?? "").toString().trim();
  if (name.length < 2) return { ok: false, error: "Please enter your name." };
  if (name.length > 80) return { ok: false, error: "That name is too long." };

  const phone = normalisePhone((input.phone ?? "").toString());
  if (!phone) return { ok: false, error: "Please enter a valid 10-digit mobile number." };

  const emailRaw = (input.email ?? "").toString().trim();
  if (emailRaw && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(emailRaw)) {
    return { ok: false, error: "That email address doesn't look right." };
  }

  const source = input.source as LeadSource;
  if (!LEAD_SOURCES.includes(source)) return { ok: false, error: "Unknown form." };

  // Cap meta so a crafted request can't write unbounded data.
  const meta: Record<string, string> = {};
  for (const [k, v] of Object.entries(input.meta ?? {}).slice(0, 12)) {
    if (v === null || v === undefined) continue;
    meta[k.slice(0, 40)] = String(v).slice(0, 300);
  }

  return {
    ok: true,
    lead: {
      name,
      phone,
      email: emailRaw || null,
      city: (input.city ?? "")?.toString().trim().slice(0, 60) || null,
      course: (input.course ?? "")?.toString().trim().slice(0, 60) || null,
      meta,
      source,
      collegeSlug: (input.collegeSlug ?? "")?.toString().trim().slice(0, 120) || null,
    },
  };
}

/* -------------------------------- API ---------------------------------- */

export async function createLead(input: NewLead): Promise<Lead> {
  const lead: Lead = {
    ...input,
    id: crypto.randomUUID(),
    status: "new",
    createdAt: new Date().toISOString(),
  };

  const db = getAdminDb();
  if (db) {
    await db.collection(COLLECTION).doc(lead.id).set(lead);
    // Deliberately no updateTag here. This runs in the /api/leads route
    // handler, not a Server Action, and this is the path that captures the
    // business's leads — it must not risk throwing to save the dashboard sixty
    // seconds of staleness. The cache expires on its own that fast anyway.
    return lead;
  }

  throw new Error("Firebase is not configured. Leads require Firestore.");
}

/**
 * Empty rather than throwing: the admin page has a banner for exactly this
 * case, and it can't show it if reading the list takes the render down.
 */
export async function listLeads(limit = LEADS_PAGE): Promise<Lead[]> {
  const db = getAdminDb();
  if (!db) return [];

  // Keyed by limit so a caller asking for more does not read back a shorter
  // cached page.
  return unstable_cache(
    async () => {
      const snap = await db.collection(COLLECTION).orderBy("createdAt", "desc").limit(limit).get();
      return snap.docs.map((d) => d.data() as Lead);
    },
    ["leads", String(limit)],
    { tags: [LEADS_TAG], revalidate: LEADS_TTL_SECONDS },
  )();
}

export async function updateLeadStatus(id: string, status: LeadStatus): Promise<void> {
  const db = getAdminDb();
  if (db) {
    await db.collection(COLLECTION).doc(id).update({ status });
    updateTag(LEADS_TAG);
    return;
  }

  throw new Error("Firebase is not configured. Leads require Firestore.");
}

export function storageMode(): "firestore" | "file" {
  return isFirebaseConfigured() ? "firestore" : "file";
}
