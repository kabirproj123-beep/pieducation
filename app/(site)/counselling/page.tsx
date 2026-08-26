import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { LeadForm } from "@/components/LeadForm";
import { Reveal } from "@/components/Motion";
import { getAllColleges } from "@/lib/collegeStore";
import { site } from "@/lib/content";

export const metadata: Metadata = {
  title: "Our Services | Career Counselling & Admission Guidance",
  description:
    "Comprehensive career counselling and admission guidance tailored to your stage and goals — career counselling after 12th, B.Tech admissions and MBA/PGDM guidance across Pune, Mumbai and Maharashtra.",
};

/**
 * The three services the consultancy actually sells, in the order a student
 * meets them: pick a stream, get into an engineering college, come back years
 * later for the MBA.
 *
 * Each one renders as a full-width band with a photograph on one side and the
 * copy on the other, alternating sides down the page so the eye zig-zags
 * instead of running down a single column. `flip` is what alternates it.
 *
 * The `features` are the three things we do; the `covers` list is the detail a
 * parent scans for before booking. Keeping both on one record means a service
 * can never end up with a heading but no checklist.
 */
type Service = {
  id: string;
  eyebrow: string;
  title: string;
  intro: string;
  features: { title: string; body: string }[];
  coversTitle: string;
  covers: string[];
  cta: string;
  image: { src: string; alt: string };
  flip: boolean;
};

const SERVICES: Service[] = [
  {
    id: "after-12th",
    eyebrow: "Step one",
    title: "Career counselling after 12th",
    intro:
      "The decision that sets up the next ten years, usually made in a fortnight with half the information. We slow it down and work through it properly — with the parents in the room.",
    features: [
      {
        title: "Stream clarity",
        body: "Science, Commerce, or Arts? We help you choose based on your interests, strengths, and future career options.",
      },
      {
        title: "Branch selection",
        body: "Computer, IT, Mechanical, Civil or the newer AI and Data Science branches — what each one actually leads to, and who it suits.",
      },
      {
        title: "Entrance exam guidance",
        body: "Strategic advice on MHT-CET, JEE, BITSAT, VITEEE and other entrance exams to maximise your college options.",
      },
    ],
    coversTitle: "What we cover",
    covers: [
      "Understanding aptitude and interests",
      "Exploring career paths for each stream",
      "Job roles and salary trends by branch",
      "College selection strategy",
      "Parent–student alignment",
    ],
    cta: "Book free session",
    image: {
      src: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=70",
      alt: "Three students talking through college options over laptops and notes",
    },
    flip: false,
  },
  {
    id: "btech",
    eyebrow: "Admissions",
    title: "B.Tech admissions guidance",
    intro:
      "Scores are done; now the score has to be spent well. Choice filling is where good ranks get wasted, and it is the part almost nobody gets a second attempt at.",
    features: [
      {
        title: "Pune & Mumbai college expertise",
        body: "Deep knowledge of colleges like COEP, VJTI, PICT, SPIT, DJ Sanghvi and others — including the ones that punch above their ranking.",
      },
      {
        title: "Smart college shortlisting",
        body: "Based on your MHT-CET/JEE score, budget, location and career goals — not just rankings.",
      },
      {
        title: "CAP counselling support",
        body: "Strategic guidance on choice filling and seat allocation through Maharashtra's competitive CAP rounds.",
      },
    ],
    coversTitle: "What we provide",
    covers: [
      "College shortlisting based on marks and budget",
      "Placement records and alumni network analysis",
      "CAP counselling support (Pune & Mumbai)",
      "Document preparation guidance",
      "College website navigation and deadlines",
      "Post-admission planning",
    ],
    cta: "Schedule consultation",
    image: {
      src: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=1200&q=70",
      alt: "Engineering student working at a laptop in a robotics laboratory",
    },
    flip: true,
  },
  {
    id: "mba",
    eyebrow: "Postgraduate",
    title: "MBA / PGDM admissions guidance",
    intro:
      "An MBA or PGDM is a significant investment. We help you evaluate programmes, compare ROI, and choose a specialisation that aligns with your career goals.",
    features: [
      {
        title: "Profile evaluation",
        body: "Where your academics, work experience and percentile actually place you, and which calls are realistic.",
      },
      {
        title: "College comparison & ROI",
        body: "Fees against median package, two years of foregone salary included — the number that decides whether a programme is worth it.",
      },
      {
        title: "Specialisation mapping",
        body: "Finance, marketing, operations, analytics or HR, matched to where you want to be five years after graduating.",
      },
    ],
    coversTitle: "How we help",
    covers: [
      "MBA entrance exam strategy (CAT, MAH MBA CET, GMAT)",
      "College shortlisting and eligibility analysis",
      "Application essay and interview prep guidance",
      "Salary trends and placement outcomes analysis",
      "Corporate connections and network insights",
      "Specialisation advice",
    ],
    cta: "Get MBA guidance",
    image: {
      src: "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1200&q=70",
      alt: "MBA students working through a strategy session in a classroom",
    },
    flip: false,
  },
];

/** The names people arrive already asking about. Each chip searches for it. */
const SPECIALIST_COLLEGES = [
  "COEP Pune",
  "VJTI Mumbai",
  "PICT Pune",
  "SPIT Mumbai",
  "DJ Sanghvi",
  "KJ Somaiya",
  "NMIMS",
  "MIT WPU",
  "VIT Pune",
  "Symbiosis",
  "Jindal Global Law School",
  "Christ University",
];

/**
 * The exam-by-exam work that sits under the three headline services. It stays
 * on the page because a NEET or CLAT student arriving from search needs to see
 * their own exam named before they will believe the rest applies to them.
 */
const ALSO_COVERED = [
  {
    title: "MHT-CET & state counselling",
    body: "Choice filling for Maharashtra engineering and pharmacy seats, with domicile and category advantages worked into your preference list.",
  },
  {
    title: "JEE / JoSAA guidance",
    body: "Preference lists for IITs, NITs and IIITs built around branch-versus-college trade-offs rather than guesswork.",
  },
  {
    title: "NEET & medical admissions",
    body: "All India Quota and Maharashtra state quota support for MBBS and BDS, including deemed universities.",
  },
  {
    title: "Law admissions",
    body: "CLAT and MH CET Law counselling across national law universities and Maharashtra's government law colleges.",
  },
  {
    title: "MBA admissions",
    body: "CAT and MAH MBA CET guidance across Maharashtra's business schools, mapped to your percentile and budget.",
  },
  {
    title: "Category & document audit",
    body: "Making sure EWS, OBC-NCL and SC/ST certificates are valid and in the current format before the window closes.",
  },
];

function Check() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 20 20"
      className="mt-0.5 size-4 shrink-0 text-success"
      fill="currentColor"
    >
      <path
        fillRule="evenodd"
        d="M16.7 5.3a1 1 0 0 1 0 1.4l-7.5 7.5a1 1 0 0 1-1.4 0L3.3 9.7a1 1 0 1 1 1.4-1.4l3.8 3.8 6.8-6.8a1 1 0 0 1 1.4 0Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

export default async function CounsellingPage() {
  const total = (await getAllColleges()).length;

  return (
    <div className="bg-paper-2">
      {/* Hero — photograph under a navy wash so the type stays readable. */}
      <section className="relative isolate overflow-hidden border-b border-line bg-navy text-white">
        <Image
          src="https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=1600&q=70"
          alt=""
          fill
          priority
          sizes="100vw"
          className="-z-10 object-cover opacity-25"
        />
        <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-r from-navy via-navy/90 to-navy/60" />

        <div className="container-x py-16 sm:py-20">
          <p className="eyebrow text-brand">Our services</p>
          <h1 className="display-lg mt-2 max-w-3xl font-display">
            Comprehensive career counselling and admission guidance
          </h1>
          <p className="mt-4 max-w-2xl text-on-navy-dim">
            Tailored to your stage and your goals — from choosing a stream after 12th, to filling
            the CAP choice list, to weighing up an MBA. One-to-one, with your {total} college
            options on the table and nothing sold to you.
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            <a href="#book" className="btn btn-primary px-5 py-2.5 text-sm">
              Book free consultation
            </a>
            {/* .btn-ghost is white-on-ink for light backgrounds; on navy it has
                to be inverted or it disappears into itself. */}
            <a
              href={`tel:${site.whatsapp}`}
              className="btn btn-ghost border-white/30 bg-transparent px-5 py-2.5 text-sm text-white hover:bg-white/10"
            >
              Call {site.phone}
            </a>
          </div>

          <dl className="mt-10 grid max-w-2xl grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-3">
            {[
              { v: site.yearsGuiding, l: "Years guiding students" },
              { v: `${total}`, l: "Colleges on file" },
              { v: "Free", l: "First consultation" },
            ].map((s) => (
              <div key={s.l}>
                <dt className="font-display text-2xl font-extrabold text-white">{s.v}</dt>
                <dd className="mt-0.5 text-xs text-on-navy-dim">{s.l}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* The booking form, kept high on the page rather than parked at the
          bottom where it reads as part of the footer. Every service CTA
          below anchors back up to it. */}
      <section id="book" className="scroll-mt-24 border-b border-line bg-paper">
        <div className="container-x grid items-start gap-10 py-14 lg:grid-cols-[1fr_24rem]">
          <div className="max-w-xl">
            <p className="eyebrow text-brand">Free consultation</p>
            <h2 className="display-md mt-2 font-display font-extrabold text-ink">
              Book your free counselling session
            </h2>
            <p className="mt-3 text-muted">
              Get personalised guidance for your specific situation. Tell us your exam and score —
              a counsellor calls you back within 24 hours.
            </p>

            <ul className="mt-6 space-y-2 text-sm text-muted">
              {[
                "One-to-one, not a group webinar",
                "Parents welcome on the call",
                "No obligation, no college is paying us to recommend it",
              ].map((p) => (
                <li key={p} className="flex items-start gap-2">
                  <Check />
                  {p}
                </li>
              ))}
            </ul>

            <p className="mt-6 text-sm text-muted">
              Prefer to talk now?{" "}
              <a href={`tel:${site.whatsapp}`} className="font-semibold text-ink hover:text-brand-700">
                {site.phone}
              </a>
            </p>
          </div>

          {/* Raised so the form reads as the thing to do on this page, not a
              box beside the copy. */}
          <div className="card-raised p-5">
            <h3 className="font-display text-lg font-bold">Book free counselling</h3>
            <p className="mt-1 mb-4 text-sm text-muted">
              A counsellor will call within 24 hours.
            </p>
            <LeadForm
              source="counselling"
              compact
              submitLabel="Book my free session"
              extraFields={[
                {
                  name: "exam",
                  label: "Which exam?*",
                  type: "select",
                  required: true,
                  options: [
                    "MHT-CET",
                    "JEE Main / Advanced",
                    "NEET UG",
                    "CAT / MAH MBA CET",
                    "CLAT / MH CET Law",
                    "Not decided yet",
                  ],
                },
                { name: "score", label: "Score / rank / percentile (if known)" },
              ]}
            />
          </div>
        </div>
      </section>

      {/* The three services, alternating photo side. */}
      {SERVICES.map((s, i) => (
        <section
          key={s.id}
          id={s.id}
          className={i % 2 === 1 ? "border-b border-line bg-paper" : "border-b border-line"}
        >
          <div className="container-x py-14 sm:py-16">
            <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
              <Reveal className={s.flip ? "lg:order-2" : ""}>
                <div className="relative aspect-[4/3] overflow-hidden rounded-2xl shadow-lg ring-1 ring-line">
                  <Image
                    src={s.image.src}
                    alt={s.image.alt}
                    fill
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    className="object-cover"
                  />
                </div>
              </Reveal>

              <Reveal delay={0.08} className={s.flip ? "lg:order-1" : ""}>
                <p className="eyebrow text-brand">{s.eyebrow}</p>
                <h2 className="display-md mt-2 font-display font-extrabold text-ink">{s.title}</h2>
                <p className="mt-3 leading-relaxed text-muted">{s.intro}</p>

                <div className="mt-6 space-y-4">
                  {s.features.map((f) => (
                    <div key={f.title} className="flex gap-3">
                      <Check />
                      <div>
                        <h3 className="font-display text-sm font-bold text-ink">{f.title}</h3>
                        <p className="mt-1 text-sm leading-relaxed text-muted">{f.body}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="card mt-7 p-5">
                  <h3 className="font-display text-xs font-bold uppercase tracking-widest text-brand">
                    {s.coversTitle}
                  </h3>
                  <ul className="mt-3 grid gap-1.5 sm:grid-cols-2">
                    {s.covers.map((c) => (
                      <li key={c} className="flex items-start gap-2 text-sm text-muted">
                        <Check />
                        {c}
                      </li>
                    ))}
                  </ul>
                </div>

                <a href="#book" className="btn btn-primary mt-6 px-5 py-2.5 text-sm">
                  {s.cta}
                </a>
              </Reveal>
            </div>
          </div>
        </section>
      ))}

      {/* Colleges we specialise in. */}
      <section className="border-b border-line bg-paper">
        <div className="container-x py-14 text-center">
          <h2 className="display-md font-display font-extrabold text-ink">
            Colleges we specialise in
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-muted">
            Deep expertise with the institutes students in Pune and Mumbai ask about most — and
            data on {total} more.
          </p>

          <ul className="mx-auto mt-7 flex max-w-4xl flex-wrap justify-center gap-2.5">
            {SPECIALIST_COLLEGES.map((name) => (
              <li key={name}>
                <Link
                  href={`/colleges?q=${encodeURIComponent(name)}`}
                  className="chip chip-brand px-4 py-2 text-sm font-semibold transition-colors hover:bg-brand hover:text-white"
                >
                  {name}
                </Link>
              </li>
            ))}
          </ul>

          <Link href="/colleges" className="btn btn-ghost mt-8 px-5 py-2.5 text-sm">
            Browse all colleges
          </Link>
        </div>
      </section>

      {/* Exam-level work, kept compact under the headline services. */}
      <section className="border-b border-line">
        <div className="container-x py-14">
          <h2 className="display-md font-display font-extrabold text-ink">Also covered</h2>
          <p className="mt-2 max-w-2xl text-muted">
            The exam-by-exam detail behind the three services above.
          </p>

          <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {ALSO_COVERED.map((d) => (
              <div key={d.title} className="card p-5">
                <h3 className="font-display text-base font-bold text-ink">{d.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{d.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Closing CTA. Buttons only — the form itself is up at #book, so the
          page does not end on a second one sitting against the footer. */}
      <section className="bg-navy text-white">
        <div className="container-x flex flex-col items-start gap-6 py-14 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-xl">
            <h2 className="display-md font-display font-extrabold">
              Ready to explore your options?
            </h2>
            <p className="mt-2 text-on-navy-dim">
              Book a free consultation and get personalised guidance for your specific situation.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <a href="#book" className="btn btn-primary px-5 py-2.5 text-sm">
              Book free consultation
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
