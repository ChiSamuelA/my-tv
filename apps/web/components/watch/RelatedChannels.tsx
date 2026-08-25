import type { WatchRelatedChannel } from "@/lib/server/watch";
import { RelatedChannelCard } from "./RelatedChannelCard";

export function RelatedChannels({ channels }: { channels: WatchRelatedChannel[] }) {
  if (channels.length === 0) return null;
  return (
    <aside className="related-channels" aria-labelledby="related-channels-heading">
      <h2 id="related-channels-heading">Related channels</h2>
      <div className="related-channel-list">
        {channels.map((channel) => <RelatedChannelCard channel={channel} key={channel.id} />)}
      </div>
    </aside>
  );
}
