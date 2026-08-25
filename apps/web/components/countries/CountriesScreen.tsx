import Link from "next/link";
import { PageContainer } from "@/components/layout/PageContainer";
import type { CountriesPageData } from "@/lib/server/countries";
import { CountriesHeader } from "./CountriesHeader";
import { CountryGrid } from "./CountryGrid";
import { FeaturedCountries } from "./FeaturedCountries";

export function CountriesScreen({ data }: { data: CountriesPageData }) {
  return (
    <main id="main-content">
      <PageContainer className="countries-content">
        <CountriesHeader query={data.query} total={data.totalCountries} />
        <FeaturedCountries countries={data.featured} />
        <section className="all-countries" aria-labelledby="all-countries-heading">
          <div className="country-section-heading">
            <div><h2 id="all-countries-heading">{data.query ? "Search results" : "All countries"}</h2><p>{data.query ? `${data.countries.length} matching countries` : "Alphabetical directory"}</p></div>
            {data.query ? <Link className="clear-filters" href="/countries">Clear search</Link> : null}
          </div>
          {data.countries.length > 0 ? <CountryGrid countries={data.countries} /> : (
            <div className="countries-empty"><div className="empty-mark" aria-hidden="true">{"\u25ce"}</div><h2>No countries found</h2><p>Try a country name or its two-letter code.</p><Link className="primary-button" href="/countries">Show all countries</Link></div>
          )}
        </section>
      </PageContainer>
    </main>
  );
}
