import Link from "next/link";
import { ChannelLogo } from "@/components/channel/ChannelLogo";
import type { WatchRelatedChannel } from "@/lib/server/watch";

export function RelatedChannelCard({ channel }: { channel: WatchRelatedChannel }) {
  return (
    <Link className="related-channel-card" href={`/watch/${encodeURIComponent(channel.id)}`}>
      <span className="related-channel-media"><ChannelLogo logo={channel.logo} name={channel.name} /></span>
      <span className="related-channel-copy">
        <strong>{channel.name}</strong>
        <span>{channel.country}</span>
        {channel.category ? <span>{channel.category}</span> : null}
      </span>
    </Link>
  );
}
