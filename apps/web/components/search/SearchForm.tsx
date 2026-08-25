import Link from "next/link";

export function SearchForm({ query }: { query: string }) {
  return (
    <form action="/search" className="global-search-form" role="search">
      <svg aria-hidden="true" className="search-icon" viewBox="0 0 24 24"><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 4.2 4.2" /></svg>
      <label className="visually-hidden" htmlFor="global-search">Search live TV channels</label>
      <input defaultValue={query} id="global-search" name="q" placeholder="Search by channel name" type="search" />
      {query ? <Link aria-label="Clear search" className="global-search-clear" href="/search">{"\u00d7"}</Link> : null}
      <button type="submit">Search</button>
    </form>
  );
}
