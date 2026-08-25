import { SportsScreen } from "@/components/sports/SportsScreen";
import { getSportsPageData, type SportsSearchParams } from "@/lib/server/sports";

export default async function SportsPage({ searchParams }: { searchParams: Promise<SportsSearchParams> }) {
  const data = await getSportsPageData(await searchParams);
  return <SportsScreen data={data} />;
}
