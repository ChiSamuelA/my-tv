import type { HomeData } from "@/lib/server/home";
import { ChannelCard } from "@/components/channel/ChannelCard";
import { SectionHeader } from "@/components/discovery/SectionHeader";
import { PageContainer } from "@/components/layout/PageContainer";
import { CategoryDiscovery } from "./CategoryDiscovery";
import { ChannelRail } from "./ChannelRail";
import { CountryDiscovery } from "./CountryDiscovery";
import { HomeHero } from "./HomeHero";

function HomeChannelSection({ title, description, href, channels }: {
  title: string;
  description: string;
  href: string;
  channels: HomeData["sportsChannels"];
}) {
  return (
    <section className="home-section">
      <SectionHeader description={description} href={href} title={title} />
      <ChannelRail label={title}>
        {channels.map((channel) => <span className="rail-item" key={channel.id} role="listitem"><ChannelCard channel={channel} /></span>)}
      </ChannelRail>
    </section>
  );
}

export function HomeScreen({ data }: { data: HomeData }) {
  return (
    <main id="main-content">
      <HomeHero channels={data.heroChannels} />
      <PageContainer className="home-content">
        <HomeChannelSection channels={data.sportsChannels} description="Live sports channels from around the world" href="/sports" title="Sports" />
        <HomeChannelSection channels={data.newsChannels} description="Global and regional news channels" href="/live?category=news" title="News" />
        <CountryDiscovery countries={data.countries} />
        <HomeChannelSection channels={data.entertainmentChannels} description="Channels for film, series and culture" href="/live?category=movies" title="Movies & Entertainment" />
        <CategoryDiscovery categories={data.categories} />
      </PageContainer>
    </main>
  );
}
