import Link from "next/link";
import type { WatchPageData, WatchSource } from "@/lib/server/watch";

function sourceDescription(source: WatchSource): string {
  return [source.label, source.feedName, source.format, source.quality, source.protocol].filter(Boolean).join(" · ");
}

export function SourceSelector({ data }: { data: WatchPageData }) {
  if (data.sources.length === 0) return <section className="source-panel"><h2>Sources</h2><p className="single-source-note">No sources available</p></section>;
  if (data.sources.length === 1) return null;
  const route = `/watch/${encodeURIComponent(data.channel.id)}`;
  return (
    <section className="source-panel" aria-labelledby="sources-heading">
      <h2 id="sources-heading">Sources</h2>
      <div className="source-list">
        {data.sources.map((source) => {
          const selected = source.id === data.selectedSource?.id;
          return <Link aria-current={selected ? "true" : undefined} className={`source-option${selected ? " active" : ""}`} href={`${route}?source=${encodeURIComponent(source.id)}`} key={source.id}><span className="source-dot" aria-hidden="true" /><span>{sourceDescription(source)}</span><span className="source-status">{selected ? "Selected" : "Choose"}</span></Link>;
        })}
      </div>
    </section>
  );
}
