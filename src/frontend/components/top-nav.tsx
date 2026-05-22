"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/*
 * G11: redesigned chrome.
 *   - Brand wordmark dropped its "verification layer" sublabel.
 *   - Roadmap removed from top nav (moved to footer; /ledger still routable).
 *   - Mono dot separators between links.
 *   - Session pill right-aligned (visual decoration; v1 has no live session state to bind).
 */
const NAV_LINKS: { href: string; label: string; match: (p: string) => boolean }[] = [
  { href: "/", label: "Home", match: (p) => p === "/" },
  {
    href: "/instructor",
    label: "Instructor",
    match: (p) => p === "/instructor" || p.startsWith("/instructor/"),
  },
  {
    href: "/student",
    label: "Student",
    match: (p) => p === "/student" || p.startsWith("/student/"),
  },
];

export function TopNav() {
  const pathname = usePathname() ?? "/";
  return (
    <nav className="top-nav" aria-label="Primary">
      <Link href="/" className="top-nav__brand" aria-label="Acta — home">
        <span className="top-nav__wordmark">ACTA</span>
      </Link>
      <ul className="top-nav__links">
        {NAV_LINKS.map((link) => {
          const active = link.match(pathname);
          return (
            <li key={link.href} className="top-nav__item">
              <Link
                href={link.href}
                className={active ? "top-nav__link top-nav__link--active" : "top-nav__link"}
                aria-current={active ? "page" : undefined}
              >
                {link.label}
              </Link>
            </li>
          );
        })}
      </ul>
      <span className="top-nav__session" aria-label="Session status">
        <span className="top-nav__session-dot" aria-hidden="true" />
        SESSION
      </span>
    </nav>
  );
}
