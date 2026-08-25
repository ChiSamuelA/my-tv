import { ChannelGrid } from "@/components/discovery/ChannelGrid";
import { Pagination } from "@/components/discovery/Pagination";
import { PageContainer } from "@/components/layout/PageContainer";
import type { LivePageData } from "@/lib/server/live";
import { LiveEmptyState } from "./LiveEmptyState";
import { LiveFilters, liveHref } from "./LiveFilters";
import { LiveHeader } from "./LiveHeader";

export function LiveScreen({ data }: { data: LivePageData }) {
  const { facets, filters, results } = data;
  return (
    <main id="main-content">
      <PageContainer className="live-content">
        <LiveHeader />
        <LiveFilters categories={facets.categories} countries={facets.countries} filters={filters} languages={facets.languages} />
        <div className="sports-results-head" aria-live="polite">
          <p><strong>{results.totalItems.toLocaleString("en")}</strong> {results.totalItems === 1 ? "channel" : "channels"}</p>
        </div>
        {results.items.length > 0 ? (
          <>
            <ChannelGrid channels={results.items} />
            <Pagination hrefForPage={(page) => liveHref(filters, { page })} label="Live TV results pages" page={results.page} totalPages={results.totalPages} />
          </>
        ) : <LiveEmptyState />}
      </PageContainer>
    </main>
  );
}
