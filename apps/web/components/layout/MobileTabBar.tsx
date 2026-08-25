"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/", label: "Home", glyph: "\u2302" },
  { href: "/sports", label: "Sports", glyph: "\u25c7" },
  { href: "/live", label: "Live", glyph: "\u25a3" },
  { href: "/search", label: "Search", glyph: "\u2315" },
];

export function MobileTabBar() {
  const pathname = usePathname();
  return (
    <nav className="mobile-tab-bar" aria-label="Mobile navigation">
      {items.map((item) => {
        const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        return (
          <Link aria-current={active ? "page" : undefined} className={active ? "active" : undefined} href={item.href} key={item.href}>
            <span aria-hidden="true" className="tab-glyph">{item.glyph}</span>
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
