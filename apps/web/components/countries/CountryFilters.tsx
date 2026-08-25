import Link from "next/link";
import type { CountryFiltersState, CountrySummary } from "@/lib/server/countries";

interface Props { country: CountrySummary; filters: CountryFiltersState; }
type Changes = Partial<Record<"search" | "category" | "language" | "page", string | number | undefined>>;

export function countryHref(country: CountrySummary, filters: CountryFiltersState, changes: Changes): string {
  const next = { search: filters.search || undefined, category: filters.category, language: filters.language, page: filters.page, ...changes };
  const params = new URLSearchParams();
  if (next.search) params.set("search", String(next.search));
  if (next.category) params.set("category", String(next.category));
  if (next.language) params.set("language", String(next.language));
  if (next.page && Number(next.page) > 1) params.set("page", String(next.page));
  const query = params.toString();
  const route = `/countries/${encodeURIComponent(country.code)}`;
  return query ? `${route}?${query}` : route;
}

export function CountryFilters({ country, filters }: Props) {
  const quickOrder = ["news", "sports", "movies", "entertainment", "music", "kids"];
  const quick = quickOrder.map((id) => country.categories.find((item) => item.value === id)).filter((item): item is { value: string; label: string } => Boolean(item));
  const quickSet = new Set(quick.map((item) => item.value));
  const more = country.categories.filter((item) => !quickSet.has(item.value));
  const route = `/countries/${encodeURIComponent(country.code)}`;
  const active = Boolean(filters.search || filters.category || filters.language);
  return (
    <div className="country-detail-filters">
      <div className="country-filter-top">
        <form action={route} className="sports-search" role="search">
          <svg aria-hidden="true" className="search-icon" viewBox="0 0 24 24"><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 4.2 4.2" /></svg>
          <label className="visually-hidden" htmlFor="country-channel-search">Search channels in {country.name}</label>
          <input defaultValue={filters.search} id="country-channel-search" name="search" placeholder={`Search channels in ${country.name}`} type="search" />
          {filters.category ? <input name="category" type="hidden" value={filters.category} /> : null}
          {filters.language ? <input name="language" type="hidden" value={filters.language} /> : null}
          <button type="submit">Search</button>
        </form>
        <form action={route} className="language-form">
          {filters.search ? <input name="search" type="hidden" value={filters.search} /> : null}
          {filters.category ? <input name="category" type="hidden" value={filters.category} /> : null}
          <label className="visually-hidden" htmlFor="country-language">Filter by language</label>
          <select className="sports-select" defaultValue={filters.language ?? ""} id="country-language" name="language"><option value="">All languages</option>{country.languages.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select>
          <button className="filter-apply" type="submit">Apply</button>
        </form>
      </div>
      <div className="live-category-row" aria-label={`Filter ${country.name} channels by category`}>
        <div className="live-category-chips">
          <Link aria-current={!filters.category ? "true" : undefined} className={`filter-chip${!filters.category ? " active" : ""}`} href={countryHref(country, filters, { category: undefined, page: undefined })}>All</Link>
          {quick.map((item) => <Link aria-current={filters.category === item.value ? "true" : undefined} className={`filter-chip${filters.category === item.value ? " active" : ""}`} href={countryHref(country, filters, { category: item.value, page: undefined })} key={item.value}>{item.label}</Link>)}
        </div>
        {more.length > 0 ? <form action={route} className="more-category-form">{filters.search ? <input name="search" type="hidden" value={filters.search} /> : null}{filters.language ? <input name="language" type="hidden" value={filters.language} /> : null}<label className="visually-hidden" htmlFor="country-category">More categories</label><select className="sports-select compact" defaultValue={quickSet.has(filters.category ?? "") ? "" : filters.category ?? ""} id="country-category" name="category"><option value="">More categories</option>{more.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select><button className="filter-apply" type="submit">Apply</button></form> : null}
        {active ? <Link className="clear-filters" href={route}>Clear filters</Link> : null}
      </div>
    </div>
  );
}
