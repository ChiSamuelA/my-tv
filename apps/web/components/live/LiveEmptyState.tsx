import Link from "next/link";

export function LiveEmptyState() {
  return (
    <div className="sports-empty">
      <div className="empty-mark" aria-hidden="true">{"\u25a3"}</div>
      <h2>No channels found</h2>
      <p>No channels match this combination of search and filters.</p>
      <Link className="primary-button" href="/live">Clear filters</Link>
    </div>
  );
}
