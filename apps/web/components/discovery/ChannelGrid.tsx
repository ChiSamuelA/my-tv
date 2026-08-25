import type { Channel } from "../../../../scripts/data/schema";
import { ChannelCard } from "../channel/ChannelCard";

export function ChannelGrid({ channels }: { channels: Channel[] }) {
  return <div className="channel-grid">{channels.map((channel) => <ChannelCard channel={channel} key={channel.id} />)}</div>;
}
