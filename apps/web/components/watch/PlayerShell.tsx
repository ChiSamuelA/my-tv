import { ChannelLogo } from "@/components/channel/ChannelLogo";
import type { WatchPageData } from "@/lib/server/watch";

const stateCopy = {
  ready: { title: "Channel source selected", detail: "Playback controls will be available here in the next step." },
  "insecure-source": { title: "Secure playback may be blocked", detail: "This source uses HTTP and may not work on a secure page." },
  unsupported: { title: "This source needs different playback support", detail: "Its protocol is not supported by the upcoming browser player yet." },
  unavailable: { title: "No source available", detail: "This channel currently has no catalog source to select." },
} as const;

export function PlayerShell({ data }: { data: WatchPageData }) {
  const copy = stateCopy[data.playbackState];
  return (
    <section className={`player-shell state-${data.playbackState}`} aria-label="Player preview">
      <div className="player-shell-content">
        <ChannelLogo eager logo={data.channel.logo} name={data.channel.name} />
        <h2>{copy.title}</h2>
        <p>{copy.detail}</p>
        {data.selectedSource ? <span className="player-source-summary">{[data.selectedSource.format, data.selectedSource.quality, data.selectedSource.protocol].filter(Boolean).join(" · ")}</span> : null}
      </div>
    </section>
  );
}
