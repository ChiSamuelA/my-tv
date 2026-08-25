import { ChannelGrid } from "@/components/discovery/ChannelGrid";
import { Pagination } from "@/components/discovery/Pagination";
import { PageContainer } from "@/components/layout/PageContainer";
import type { SearchPageData } from "@/lib/server/search";
import { SearchEmptyState } from "./SearchEmptyState";
import { SearchHeader } from "./SearchHeader";
import { SearchInitialState } from "./SearchInitialState";

function searchHref(query: string, page: number): string {
  const params = new URLSearchParams({ q: query });
  if (page > 1) params.set("page", String(page));
  return `/search?${params.toString()}`;
}

export function SearchScreen({ data }: { data: SearchPageData }) {
  return (
    <main id="main-content">
      <PageContainer className="global-search-content">
        <SearchHeader query={data.query} />
        {data.results === null ? <SearchInitialState /> : data.results.items.length === 0 ? <SearchEmptyState query={data.query} /> : (
          <section className="search-results" aria-labelledby="search-results-heading">
            <div className="search-results-heading"><h2 id="search-results-heading"><strong>{data.results.totalItems.toLocaleString("en")}</strong> {data.results.totalItems === 1 ? "result" : "results"} for “{data.query}”</h2></div>
            <ChannelGrid channels={data.results.items} />
            <Pagination hrefForPage={(page) => searchHref(data.query, page)} label="Search result pages" page={data.results.page} totalPages={data.results.totalPages} />
          </section>
        )}
      </PageContainer>
    </main>
  );
}
