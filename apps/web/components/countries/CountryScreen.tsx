import { ChannelGrid } from "@/components/discovery/ChannelGrid";
import { Pagination } from "@/components/discovery/Pagination";
import { PageContainer } from "@/components/layout/PageContainer";
import type { CountryPageData } from "@/lib/server/countries";
import { CountryEmptyState } from "./CountryEmptyState";
import { CountryFilters, countryHref } from "./CountryFilters";
import { CountryHeader } from "./CountryHeader";

export function CountryScreen({ data }: { data: CountryPageData }) {
  const { country, filters, results } = data;
  return (
    <main id="main-content">
      <PageContainer className="country-detail-content">
        <CountryHeader country={country} />
        <CountryFilters country={country} filters={filters} />
        <div className="sports-results-head" aria-live="polite"><p><strong>{results.totalItems.toLocaleString("en")}</strong> {results.totalItems === 1 ? "channel" : "channels"}</p></div>
        {results.items.length > 0 ? <><ChannelGrid channels={results.items} /><Pagination hrefForPage={(page) => countryHref(country, filters, { page })} label={`${country.name} channel result pages`} page={results.page} totalPages={results.totalPages} /></> : <CountryEmptyState country={country} />}
      </PageContainer>
    </main>
  );
}
