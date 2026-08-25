import Link from "next/link";
import type { CountrySummary } from "@/lib/server/countries";

export function CountryEmptyState({ country }: { country: CountrySummary }) {
  return (
    <div className="sports-empty">
      <div className="empty-mark" aria-hidden="true">{country.flag}</div>
      <h2>No matching channels in {country.name}</h2>
      <p>Try a different search, category, or language.</p>
      <Link className="primary-button" href={`/countries/${encodeURIComponent(country.code)}`}>Clear filters</Link>
    </div>
  );
}
