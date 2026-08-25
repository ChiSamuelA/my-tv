import Link from "next/link";
import type { CountrySummary } from "@/lib/server/countries";

export function CountryHeader({ country }: { country: CountrySummary }) {
  return (
    <header className="country-detail-header">
      <Link className="country-back" href="/countries">{"\u2190"} All countries</Link>
      <div className="country-title-row">
        <span aria-hidden="true" className="country-detail-flag">{country.flag}</span>
        <div><p className="eyebrow">Country channels</p><h1>{country.name}</h1><p>{country.channelCount.toLocaleString("en")} {country.channelCount === 1 ? "channel" : "channels"}</p></div>
      </div>
    </header>
  );
}
