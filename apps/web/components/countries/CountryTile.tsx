import Link from "next/link";
import type { CountrySummary } from "@/lib/server/countries";

export function CountryTile({ country }: { country: CountrySummary }) {
  return (
    <Link className="country-directory-tile" href={`/countries/${encodeURIComponent(country.code)}`}>
      <span aria-hidden="true" className="country-directory-flag">{country.flag}</span>
      <span>
        <span className="country-directory-name">{country.name}</span>
        <span className="country-directory-count">{country.channelCount.toLocaleString("en")} {country.channelCount === 1 ? "channel" : "channels"}</span>
      </span>
      <span aria-hidden="true" className="country-directory-arrow">{"\u2192"}</span>
    </Link>
  );
}
