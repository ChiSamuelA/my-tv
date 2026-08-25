import { SearchForm } from "./SearchForm";

export function SearchHeader({ query }: { query: string }) {
  return (
    <header className="global-search-header">
      <p className="eyebrow">Find a channel</p>
      <h1>Search live TV</h1>
      <p>Search the catalog by channel name or channel ID.</p>
      <SearchForm query={query} />
    </header>
  );
}
