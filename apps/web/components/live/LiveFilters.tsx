import Link from "next/link";
import type { LiveFacet, LiveFiltersState } from "@/lib/server/live";

interface LiveFiltersProps {
  filters: LiveFiltersState;
  categories: LiveFacet[];
  countries: LiveFacet[];
  languages: LiveFacet[];
}

type FilterChange = Partial<Record<"search" | "category" | "country" | "language" | "page", string | number | undefined>>;

export function liveHref(filters: LiveFiltersState, changes: FilterChange): string {
  const next = { search: filters.search || undefined, category: filters.category, country: filters.country, language: filters.language, page: filters.page, ...changes };
  const params = new URLSearchParams();
  if (next.search) params.set("search", String(next.search));
  if (next.category) params.set("category", String(next.category));
  if (next.country) params.set("country", String(next.country));
  if (next.language) params.set("language", String(next.language));
  if (next.page && Number(next.page) > 1) params.set("page", String(next.page));
  const query = params.toString();
  return query ? `/live?${query}` : "/live";
}

export function LiveFilters({ filters, categories, countries, languages }: LiveFiltersProps) {
  const quickOrder = ["news", "sports", "movies", "entertainment", "music", "kids"];
  const quickCategories = quickOrder.map((id) => categories.find((item) => item.value === id)).filter((item): item is LiveFacet => Boolean(item));
  const quickSet = new Set(quickCategories.map((item) => item.value));
  const moreCategories = categories.filter((item) => !quickSet.has(item.value));
  const active = Boolean(filters.search || filters.category || filters.country || filters.language);

  return (
    <div className="live-filter-bar">
      <div className="live-filter-top">
        <form action="/live" className="sports-search live-search" role="search">
          <svg aria-hidden="true" className="search-icon" viewBox="0 0 24 24"><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 4.2 4.2" /></svg>
          <label className="visually-hidden" htmlFor="live-search">Find a channel</label>
          <input defaultValue={filters.search} id="live-search" name="search" placeholder="Find a channel" type="search" />
          {filters.category ? <input name="category" type="hidden" value={filters.category} /> : null}
          {filters.country ? <input name="country" type="hidden" value={filters.country} /> : null}
          {filters.language ? <input name="language" type="hidden" value={filters.language} /> : null}
          <button type="submit">Search</button>
        </form>
        <form action="/live" className="live-selectors">
          {filters.search ? <input name="search" type="hidden" value={filters.search} /> : null}
          {filters.category ? <input name="category" type="hidden" value={filters.category} /> : null}
          <label className="visually-hidden" htmlFor="live-country">Filter by country</label>
          <select className="sports-select" defaultValue={filters.country ?? ""} id="live-country" name="country">
            <option value="">All countries</option>
            {countries.map((country) => <option key={country.value} value={country.value}>{country.label}</option>)}
          </select>
          <label className="visually-hidden" htmlFor="live-language">Filter by language</label>
          <select className="sports-select" defaultValue={filters.language ?? ""} id="live-language" name="language">
            <option value="">All languages</option>
            {languages.map((language) => <option key={language.value} value={language.value}>{language.label}</option>)}
          </select>
          <button className="filter-apply" type="submit">Apply</button>
        </form>
      </div>
      <div className="live-category-row" aria-label="Filter channels by category">
        <div className="live-category-chips">
          <Link aria-current={!filters.category ? "true" : undefined} className={`filter-chip${!filters.category ? " active" : ""}`} href={liveHref(filters, { category: undefined, page: undefined })}>All</Link>
          {quickCategories.map((category) => <Link aria-current={filters.category === category.value ? "true" : undefined} className={`filter-chip${filters.category === category.value ? " active" : ""}`} href={liveHref(filters, { category: category.value, page: undefined })} key={category.value}>{category.label}</Link>)}
        </div>
        {moreCategories.length > 0 ? (
          <form action="/live" className="more-category-form">
            {filters.search ? <input name="search" type="hidden" value={filters.search} /> : null}
            {filters.country ? <input name="country" type="hidden" value={filters.country} /> : null}
            {filters.language ? <input name="language" type="hidden" value={filters.language} /> : null}
            <label className="visually-hidden" htmlFor="live-category">More categories</label>
            <select className="sports-select compact" defaultValue={quickSet.has(filters.category ?? "") ? "" : filters.category ?? ""} id="live-category" name="category">
              <option value="">More categories</option>
              {moreCategories.map((category) => <option key={category.value} value={category.value}>{category.label}</option>)}
            </select>
            <button className="filter-apply" type="submit">Apply</button>
          </form>
        ) : null}
        {active ? <Link className="clear-filters" href="/live">Clear filters</Link> : null}
      </div>
    </div>
  );
}
