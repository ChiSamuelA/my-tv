import { ChannelLogo } from "@/components/channel/ChannelLogo";
import type { WatchPageData } from "@/lib/server/watch";
import { PlaybackNotice } from "./PlaybackNotice";

export function ChannelIdentity({ data }: { data: WatchPageData }) {
  const metadata = [data.channel.country, ...data.channel.languages.slice(0, 2), ...data.channel.categories.slice(0, 1)];
  const sourceSummary = data.selectedSource
    ? [data.selectedSource.label, data.selectedSource.format, data.selectedSource.quality].filter(Boolean).join(" · ")
    : "No source available";

  return (
    <section className="watch-channel-identity">
      <div className="watch-profile-logo"><ChannelLogo logo={data.channel.logo} name={data.channel.name} /></div>
      <div className="watch-identity-copy">
        <h1>{data.channel.name}</h1>
        <p>{metadata.join(" · ")}</p>
        <p className="watch-source-summary">{sourceSummary}</p>
        {data.guideAvailable ? <span className="guide-available">Guide source available</span> : null}
        <PlaybackNotice source={data.selectedSource} />
      </div>
    </section>
  );
}
