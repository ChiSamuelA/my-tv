import type { CountrySummary } from "@/lib/server/countries";
import { CountryTile } from "./CountryTile";

export function CountryGrid({ countries }: { countries: CountrySummary[] }) {
  return <div className="countries-directory-grid">{countries.map((country) => <CountryTile country={country} key={country.code} />)}</div>;
}
