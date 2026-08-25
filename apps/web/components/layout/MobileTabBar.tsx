import Link from "next/link";

const items = [
  { href: "/", label: "Home", glyph: "⌂", active: true },
  { href: "/sports", label: "Sports", glyph: "◇", active: false },
  { href: "/live", label: "Live", glyph: "▣", active: false },
  { href: "/search", label: "Search", glyph: "⌕", active: false },
];

export function MobileTabBar() {
  return (
    <nav className="mobile-tab-bar" aria-label="Mobile navigation">
      {items.map((item) => (
        <Link
          aria-current={item.active ? "page" : undefined}
          className={item.active ? "active" : undefined}
          href={item.href}
          key={item.href}
        >
          <span aria-hidden="true" className="tab-glyph">{item.glyph}</span>
          <span>{item.label}</span>
        </Link>
      ))}
    </nav>
  );
}
