import Link from "next/link";

function SearchIcon() {
  return (
    <svg aria-hidden="true" className="search-icon" viewBox="0 0 24 24">
      <circle cx="10.8" cy="10.8" r="6.8" />
      <path d="m16 16 4.2 4.2" />
    </svg>
  );
}

export function AppHeader() {
  return (
    <header className="app-header">
      <Link className="wordmark" href="/">my<span>·</span>tv</Link>
      <nav className="desktop-nav" aria-label="Primary navigation">
        <Link aria-current="page" className="nav-link active" href="/">Home</Link>
        <Link className="nav-link" href="/sports">Sports</Link>
        <Link className="nav-link" href="/live">Live TV</Link>
        <Link className="nav-link" href="/countries">Countries</Link>
      </nav>
      <Link className="header-search" href="/search" aria-label="Search channels">
        <SearchIcon /><span>Search</span>
      </Link>
    </header>
  );
}
