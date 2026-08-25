import Link from "next/link";
import type { Channel } from "../../../../scripts/data/schema";
import { ChannelLogo } from "./ChannelLogo";

function exceptionalBadge(channel: Channel): string | null {
  if (channel.streams.length === 0) return null;
  if (channel.streams.every((stream) => stream.availability.includes("geo-blocked"))) return "Geo restricted";
  if (channel.streams.every((stream) => stream.availability.includes("not-24-7"))) return "Not 24/7";
  return null;
}

export function ChannelCard({ channel }: { channel: Channel }) {
  const badge = exceptionalBadge(channel);
  return (
    <Link className="channel-card" href={`/watch/${encodeURIComponent(channel.id)}`}>
      <span className="channel-media">
        <ChannelLogo logo={channel.logo} name={channel.name} />
        {badge ? <span className={badge === "Geo restricted" ? "channel-badge warning" : "channel-badge"}>{badge}</span> : null}
      </span>
      <span className="channel-copy">
        <span className="channel-name">{channel.name}</span>
        <span className="channel-country">{channel.country ?? "International"}</span>
      </span>
    </Link>
  );
}
