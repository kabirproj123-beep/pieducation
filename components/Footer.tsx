"use client";

import Link from "next/link";
import { site } from "@/lib/content";
import { COURSES, EXAMS } from "@/lib/catalog";
import { PRIMARY_STREAMS } from "@/lib/colleges";
import { SocialLinks } from "./SocialLinks";

const COLUMNS = [
  {
    title: "Colleges",
    links: PRIMARY_STREAMS.map((s) => ({
      label: `${s} colleges`,
      href: `/colleges?stream=${encodeURIComponent(s)}`,
    })),
  },
  {
    title: "Courses",
    links: COURSES.map((c) => ({ label: c.name, href: `/colleges?stream=${encodeURIComponent(c.stream)}` })),
  },
  {
    title: "Exams",
    links: EXAMS.slice(0, 5).map((e) => ({ label: e.name, href: "/exams" })),
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Counselling", href: "/counselling" },
      { label: "Study abroad", href: "/study-abroad" },
      { label: "Contact", href: "/contact" },
    ],
  },
];

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-navy text-white">
      <div className="container-x py-14">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_repeat(4,1fr)]">
          <div className="max-w-xs">
            <Link href="/" className="flex items-center gap-2.5">
              <span className="grid size-9 place-items-center rounded-lg bg-brand-600 font-display text-lg font-extrabold text-white">
                {site.name.charAt(0)}
              </span>
              <span className="font-display text-lg font-extrabold">{site.name}</span>
            </Link>
            <p className="mt-4 text-sm leading-relaxed text-on-navy-dim">{site.description}</p>
            <ul className="mt-5 space-y-1.5 text-sm text-on-navy-dim">
              <li>
                <a href={`tel:${site.whatsapp}`} className="hover:text-white">
                  {site.phone}
                </a>
              </li>
              <li>
                <a href={`mailto:${site.email}`} className="hover:text-white">
                  {site.email}
                </a>
              </li>
              <li>{site.address}</li>
            </ul>

            <SocialLinks className="mt-6" />

            {/* The office on a map. Google's `output=embed` form needs no API
                key, and the same query drives the "Get directions" link so the
                pin and the link can never point at different places. */}
            <div className="mt-6 overflow-hidden rounded-xl border border-line-navy">
              <iframe
                src={`https://maps.google.com/maps?q=${encodeURIComponent(site.address)}&z=16&output=embed`}
                title={`${site.name} office location on Google Maps`}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="block h-44 w-full border-0"
              />
            </div>
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(site.address)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-brand hover:text-white"
            >
              Get directions
              <svg aria-hidden viewBox="0 0 20 20" fill="currentColor" className="size-3.5">
                <path d="M11 3a1 1 0 1 0 0 2h2.6l-6.3 6.3a1 1 0 1 0 1.4 1.4L15 6.4V9a1 1 0 1 0 2 0V4a1 1 0 0 0-1-1h-5Z" />
                <path d="M5 5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-3a1 1 0 1 0-2 0v3H5V7h3a1 1 0 0 0 0-2H5Z" />
              </svg>
            </a>
          </div>

          {COLUMNS.map((col) => (
            <nav key={col.title} aria-label={col.title}>
              <h3 className="font-display text-xs font-bold uppercase tracking-widest text-brand">
                {col.title}
              </h3>
              <ul className="mt-4 space-y-2">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link href={l.href} className="text-sm text-on-navy-dim hover:text-white">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-line-navy pt-7 text-xs text-on-navy-dim sm:flex-row">
          <p>
            © {year} {site.name}. All rights reserved.
          </p>
          <p>
            College data compiled from public disclosures and ranking reports. Verify before you
            decide.
          </p>
        </div>
      </div>
    </footer>
  );
}
