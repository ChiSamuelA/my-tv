import Link from "next/link";

export function SearchEmptyState({ query }: { query: string }) {
  return (
    <div className="search-empty-state">
      <div className="search-state-mark" aria-hidden="true">{"\u2315"}</div>
      <h2>No channels found for “{query}”</h2>
      <p>Try another exact channel name or ID. Search does not currently correct spelling.</p>
      <div className="search-state-actions"><Link className="primary-button" href="/search">Clear search</Link><Link className="secondary-button" href="/live">Browse Live TV</Link></div>
    </div>
  );
}
