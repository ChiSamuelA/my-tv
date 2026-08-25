import type { Channel } from "../../../../scripts/data/schema";
import { ChannelLogo } from "@/components/channel/ChannelLogo";

export function HeroLogoStage({ channels }: { channels: Channel[] }) {
  return (
    <div aria-label="Featured channel logos" className="hero-logo-stage">
      {channels.slice(0, 4).map((channel) => (
        <div className="hero-logo-tile" key={channel.id}>
          <ChannelLogo eager logo={channel.logo} name={channel.name} />
        </div>
      ))}
    </div>
  );
}
