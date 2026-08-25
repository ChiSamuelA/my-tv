import type { WatchSource } from "@/lib/server/watch";

export function PlaybackNotice({ source }: { source: WatchSource | null }) {
  if (!source) return <p className="playback-notice warning">No catalog source is currently available for this channel.</p>;
  const notices = [
    !source.isSecure ? "HTTP source: browsers may block it on secure pages." : null,
    source.availability.includes("geo-blocked") ? "The catalog marks this source as geographically restricted." : null,
    source.availability.includes("not-24-7") ? "The catalog marks this source as not available 24/7." : null,
    !["HTTP", "HTTPS"].includes(source.protocol) ? `${source.protocol} requires playback support not included yet.` : null,
  ].filter((value): value is string => Boolean(value));
  if (notices.length === 0) return null;
  return <div className="playback-notices">{notices.map((notice) => <p className="playback-notice warning" key={notice}>{notice}</p>)}</div>;
}
