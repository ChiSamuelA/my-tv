import type { Metadata } from "next";
import { CountriesScreen } from "@/components/countries/CountriesScreen";
import { getCountriesPageData, type CountrySearchParams } from "@/lib/server/countries";

export const metadata: Metadata = { title: "Countries | my\u00b7tv" };

export default async function CountriesPage({ searchParams }: { searchParams: Promise<CountrySearchParams> }) {
  const data = await getCountriesPageData(await searchParams);
  return <CountriesScreen data={data} />;
}
