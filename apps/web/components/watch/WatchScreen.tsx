import { PageContainer } from "@/components/layout/PageContainer";
import type { WatchPageData } from "@/lib/server/watch";
import { ChannelIdentity } from "./ChannelIdentity";
import { PlayerShell } from "./PlayerShell";
import { RelatedChannels } from "./RelatedChannels";
import { SourceSelector } from "./SourceSelector";
import { WatchHeader } from "./WatchHeader";

export function WatchScreen({ data }: { data: WatchPageData }) {
  return (
    <main id="main-content">
      <PageContainer className="watch-content">
        <WatchHeader />
        <div className={`watch-layout${data.relatedChannels.length === 0 ? " without-related" : ""}`}>
          <div className="watch-primary">
            <PlayerShell data={data} />
            <div className="watch-details"><ChannelIdentity data={data} /><SourceSelector data={data} /></div>
          </div>
          <RelatedChannels channels={data.relatedChannels} />
        </div>
      </PageContainer>
    </main>
  );
}
