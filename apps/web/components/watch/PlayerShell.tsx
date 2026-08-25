import { ChannelLogo } from "@/components/channel/ChannelLogo";
import type { WatchPageData } from "@/lib/server/watch";
import { StreamPlayer } from "./StreamPlayer";

export function PlayerShell({ data }: { data: WatchPageData }) {
  if (!data.selectedPlayback) {
    return (
      <section className="player-shell state-unavailable" aria-label="Player unavailable">
        <div className="player-shell-content"><ChannelLogo eager logo={data.channel.logo} name={data.channel.name} /><h2>No source available</h2><p>This channel currently has no catalog source to play.</p></div>
      </section>
    );
  }
  if (["dash", "unsupported"].includes(data.selectedPlayback.kind)) {
    return (
      <section className="player-shell state-unsupported" aria-label="Unsupported player source">
        <div className="player-shell-content"><ChannelLogo eager logo={data.channel.logo} name={data.channel.name} /><h2>This source is not supported in the browser</h2><p>{data.selectedPlayback.kind === "dash" ? "MPEG-DASH playback is not included in this HLS-focused version." : `${data.selectedPlayback.protocol} requires a different playback system.`}</p></div>
      </section>
    );
  }
  return <section className="player-shell" aria-label={`${data.channel.name} video player`}><StreamPlayer channelName={data.channel.name} key={data.selectedPlayback.id} source={data.selectedPlayback} /></section>;
}
