import { notFound } from "next/navigation";
import { WatchScreen } from "@/components/watch/WatchScreen";
import { getWatchPageData, type WatchSearchParams } from "@/lib/server/watch";

export default async function WatchPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<WatchSearchParams> }) {
  const { id } = await params;
  const data = await getWatchPageData(id, await searchParams);
  if (!data) notFound();
  return <WatchScreen data={data} />;
}
