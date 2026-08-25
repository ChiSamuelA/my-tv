import Link from "next/link";

export function SearchInitialState() {
  return (
    <div className="search-initial-state">
      <div className="search-state-mark" aria-hidden="true">{"\u2315"}</div>
      <h2>Find television without browsing everything</h2>
      <p>Enter a broadcaster or channel name above, or explore the complete Live TV catalog.</p>
      <Link className="secondary-button" href="/live">Browse Live TV</Link>
    </div>
  );
}
