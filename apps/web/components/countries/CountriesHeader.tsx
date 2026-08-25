export function CountriesHeader({ query, total }: { query: string; total: number }) {
  return (
    <div className="countries-intro">
      <p className="eyebrow">Around the world</p>
      <h1>Browse by country</h1>
      <p>Find local, national and international channels across {total.toLocaleString("en")} catalog countries.</p>
      <form action="/countries" className="countries-search" role="search">
        <svg aria-hidden="true" className="search-icon" viewBox="0 0 24 24"><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 4.2 4.2" /></svg>
        <label className="visually-hidden" htmlFor="country-search">Search countries</label>
        <input defaultValue={query} id="country-search" name="q" placeholder="Search countries" type="search" />
        <button type="submit">Search</button>
      </form>
    </div>
  );
}
