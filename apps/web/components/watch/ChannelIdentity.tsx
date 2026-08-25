import { ChannelLogo } from "@/components/channel/ChannelLogo";
import type { WatchPageData } from "@/lib/server/watch";
import { PlaybackNotice } from "./PlaybackNotice";

export function ChannelIdentity({ data }: { data: WatchPageData }) {
  return (
    <section className="watch-channel-identity">
      <div className="watch-profile-logo"><ChannelLogo logo={data.channel.logo} name={data.channel.name} /></div>
      <div><h2>{data.channel.name}</h2><p>{[...data.channel.categories, data.channel.country, ...data.channel.languages].join(" · ")}</p>{data.guideAvailable ? <span className="guide-available">Guide source available</span> : null}<PlaybackNotice source={data.selectedSource} /></div>
    </section>
  );
}
