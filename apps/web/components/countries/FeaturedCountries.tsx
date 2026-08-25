import type { CountrySummary } from "@/lib/server/countries";
import { CountryTile } from "./CountryTile";

export function FeaturedCountries({ countries }: { countries: CountrySummary[] }) {
  if (countries.length === 0) return null;
  return (
    <section className="featured-countries" aria-labelledby="featured-countries-heading">
      <h2 id="featured-countries-heading">Common destinations</h2>
      <div className="featured-country-grid">{countries.map((country) => <CountryTile country={country} key={country.code} />)}</div>
    </section>
  );
}
