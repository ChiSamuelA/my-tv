import Link from "next/link";
import type { WatchPageData } from "@/lib/server/watch";

export function WatchHeader({ data }: { data: WatchPageData }) {
  const metadata = [data.channel.country, ...data.channel.languages.slice(0, 2), ...data.channel.categories.slice(0, 1)];
  return (
    <header className="watch-heading">
      <Link className="watch-back" href="/live">{"\u2190"} Back to Live TV</Link>
      <div className="watch-title-row">
        <div><h1>{data.channel.name}</h1><p>{metadata.join(" · ")}</p></div>
        {data.selectedSource ? <span>{[data.selectedSource.label, data.selectedSource.format, data.selectedSource.quality].filter(Boolean).join(" · ")}</span> : null}
      </div>
    </header>
  );
}
