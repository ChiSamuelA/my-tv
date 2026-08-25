import { ChannelGrid } from "@/components/discovery/ChannelGrid";
import { Pagination } from "@/components/discovery/Pagination";
import { PageContainer } from "@/components/layout/PageContainer";
import type { SportsPageData } from "@/lib/server/sports";
import { SportsEmptyState } from "./SportsEmptyState";
import { SportsFilters, sportsHref } from "./SportsFilters";
import { SportsHeader } from "./SportsHeader";

export function SportsScreen({ data }: { data: SportsPageData }) {
  const { facets, filters, results } = data;
  return (
    <main id="main-content">
      <SportsHeader total={facets.totalSports} />
      <PageContainer className="sports-content">
        <SportsFilters countries={facets.countries} filters={filters} languages={facets.languages} />
        <div className="sports-results-head" aria-live="polite">
          <p><strong>{results.totalItems.toLocaleString("en")}</strong> {results.totalItems === 1 ? "channel" : "channels"}</p>
        </div>
        {results.items.length > 0 ? (
          <>
            <ChannelGrid channels={results.items} />
            <Pagination hrefForPage={(page) => sportsHref(filters, { page })} page={results.page} totalPages={results.totalPages} />
          </>
        ) : <SportsEmptyState />}
      </PageContainer>
    </main>
  );
}
