"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

function SearchIcon() {
  return (
    <svg aria-hidden="true" className="search-icon" viewBox="0 0 24 24">
      <circle cx="10.8" cy="10.8" r="6.8" />
      <path d="m16 16 4.2 4.2" />
    </svg>
  );
}

const navigation = [["/", "Home"], ["/sports", "Sports"], ["/live", "Live TV"], ["/countries", "Countries"]] as const;

export function AppHeader() {
  const pathname = usePathname();
  const isActive = (href: string) => href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header className="app-header">
      <Link className="wordmark" href="/">my<span>{"\u00b7"}</span>tv</Link>
      <nav className="desktop-nav" aria-label="Primary navigation">
        {navigation.map(([href, label]) => (
          <Link aria-current={isActive(href) ? "page" : undefined} className={`nav-link${isActive(href) ? " active" : ""}`} href={href} key={href}>
            {label}
          </Link>
        ))}
      </nav>
      <Link aria-current={pathname.startsWith("/search") ? "page" : undefined} className={`header-search${pathname.startsWith("/search") ? " active" : ""}`} href="/search" aria-label="Search channels">
        <SearchIcon /><span>Search</span>
      </Link>
    </header>
  );
}
