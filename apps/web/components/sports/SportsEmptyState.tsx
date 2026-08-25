import Link from "next/link";

export function SportsEmptyState() {
  return (
    <div className="sports-empty">
      <div className="empty-mark" aria-hidden="true">{"\u25c7"}</div>
      <h2>No Sports channels found</h2>
      <p>No channels match this combination of search and filters.</p>
      <Link className="primary-button" href="/sports">Clear filters</Link>
    </div>
  );
}
