import Link from "next/link";
import type { SportsFacet, SportsFiltersState } from "@/lib/server/sports";

interface SportsFiltersProps {
  filters: SportsFiltersState;
  countries: SportsFacet[];
  languages: SportsFacet[];
}

function sportsHref(filters: SportsFiltersState, changes: Partial<Record<"search" | "country" | "language" | "page", string | number | undefined>>): string {
  const next = { search: filters.search || undefined, country: filters.country, language: filters.language, page: filters.page, ...changes };
  const params = new URLSearchParams();
  if (next.search) params.set("search", String(next.search));
  if (next.country) params.set("country", String(next.country));
  if (next.language) params.set("language", String(next.language));
  if (next.page && Number(next.page) > 1) params.set("page", String(next.page));
  const query = params.toString();
  return query ? `/sports?${query}` : "/sports";
}

export function SportsFilters({ filters, countries, languages }: SportsFiltersProps) {
  const quickOrder = ["US", "UK", "FR", "ES", "DE"];
  const quickCountries = quickOrder.map((code) => countries.find((item) => item.value.toUpperCase() === code)).filter((item): item is SportsFacet => Boolean(item));
  const quickSet = new Set(quickCountries.map((item) => item.value));
  const moreCountries = countries.filter((item) => !quickSet.has(item.value));
  const active = Boolean(filters.search || filters.country || filters.language);

  return (
    <div className="sports-filter-bar">
      <div className="sports-filter-top">
        <form action="/sports" className="sports-search" role="search">
          <svg aria-hidden="true" className="search-icon" viewBox="0 0 24 24"><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 4.2 4.2" /></svg>
          <label className="visually-hidden" htmlFor="sports-search">Search Sports channels</label>
          <input defaultValue={filters.search} id="sports-search" name="search" placeholder="Search Sports channels" type="search" />
          {filters.country ? <input name="country" type="hidden" value={filters.country} /> : null}
          {filters.language ? <input name="language" type="hidden" value={filters.language} /> : null}
          <button type="submit">Search</button>
        </form>
        <form action="/sports" className="language-form">
          {filters.search ? <input name="search" type="hidden" value={filters.search} /> : null}
          {filters.country ? <input name="country" type="hidden" value={filters.country} /> : null}
          <label className="visually-hidden" htmlFor="sports-language">Filter by language</label>
          <select className="sports-select" defaultValue={filters.language ?? ""} id="sports-language" name="language">
            <option value="">All languages</option>
            {languages.map((language) => <option key={language.value} value={language.value}>{language.label} ({language.count})</option>)}
          </select>
          <button className="filter-apply" type="submit">Apply</button>
        </form>
      </div>
      <div className="country-filter-row" aria-label="Filter Sports channels by country">
        <div className="sports-chips">
          <Link aria-current={!filters.country ? "true" : undefined} className={`filter-chip${!filters.country ? " active" : ""}`} href={sportsHref(filters, { country: undefined, page: undefined })}>All</Link>
          {quickCountries.map((country) => <Link aria-current={filters.country === country.value ? "true" : undefined} className={`filter-chip${filters.country === country.value ? " active" : ""}`} href={sportsHref(filters, { country: country.value, page: undefined })} key={country.value}>{country.value.toUpperCase()}</Link>)}
        </div>
        {moreCountries.length > 0 ? (
          <form action="/sports" className="more-country-form">
            {filters.search ? <input name="search" type="hidden" value={filters.search} /> : null}
            {filters.language ? <input name="language" type="hidden" value={filters.language} /> : null}
            <label className="visually-hidden" htmlFor="sports-country">More countries</label>
            <select className="sports-select compact" defaultValue={quickSet.has(filters.country ?? "") ? "" : filters.country ?? ""} id="sports-country" name="country">
              <option value="">More countries</option>
              {moreCountries.map((country) => <option key={country.value} value={country.value}>{country.label} ({country.count})</option>)}
            </select>
            <button className="filter-apply" type="submit">Apply</button>
          </form>
        ) : null}
        {active ? <Link className="clear-filters" href="/sports">Clear filters</Link> : null}
      </div>
    </div>
  );
}

export { sportsHref };
