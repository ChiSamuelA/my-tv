import { notFound } from "next/navigation";
import { CountryScreen } from "@/components/countries/CountryScreen";
import { getCountryPageData, type CountrySearchParams } from "@/lib/server/countries";

export default async function CountryPage({ params, searchParams }: { params: Promise<{ code: string }>; searchParams: Promise<CountrySearchParams> }) {
  const { code } = await params;
  const data = await getCountryPageData(code, await searchParams);
  if (!data) notFound();
  return <CountryScreen data={data} />;
}
