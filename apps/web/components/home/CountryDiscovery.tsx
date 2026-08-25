import Link from "next/link";
import type { HomeCountry } from "@/lib/server/home";
import { SectionHeader } from "@/components/discovery/SectionHeader";

export function CountryDiscovery({ countries }: { countries: HomeCountry[] }) {
  return (
    <section className="home-section">
      <SectionHeader action="See all" description="Find familiar channels and discover new ones" href="/countries" title="Browse by country" />
      <div className="country-grid">
        {countries.map((country) => (
          <Link className="country-tile" href={`/countries/${country.code}`} key={country.code}>
            <span aria-hidden="true" className="country-flag">{country.flag}</span>
            <span><span className="country-name">{country.name}</span><span className="country-count">{country.channelCount.toLocaleString("en-US")} channels</span></span>
          </Link>
        ))}
      </div>
    </section>
  );
}
