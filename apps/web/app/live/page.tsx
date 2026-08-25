import { LiveScreen } from "@/components/live/LiveScreen";
import { getLivePageData, type LiveSearchParams } from "@/lib/server/live";

export default async function LivePage({ searchParams }: { searchParams: Promise<LiveSearchParams> }) {
  const data = await getLivePageData(await searchParams);
  return <LiveScreen data={data} />;
}
