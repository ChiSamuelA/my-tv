import Link from "next/link";
import type { Channel } from "../../../../scripts/data/schema";
import { HeroLogoStage } from "./HeroLogoStage";

function SearchIcon() {
  return <svg aria-hidden="true" className="search-icon" viewBox="0 0 24 24"><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 4.2 4.2" /></svg>;
}

export function HomeHero({ channels }: { channels: Channel[] }) {
  return (
    <section className="home-hero">
      <div className="hero-copy">
        <p className="eyebrow">Television, simply</p>
        <h1>Live television,<br />without the noise.</h1>
        <p className="hero-lede">Find the channels you care about and start watching. No clutter, no endless menus.</p>
        <form action="/search" className="hero-search" role="search">
          <SearchIcon />
          <input aria-label="Search channels" name="q" placeholder="Search channels" type="search" />
        </form>
        <div className="hero-actions">
          <Link className="primary-button" href="/sports">Browse Sports <span aria-hidden="true">→</span></Link>
          <Link className="secondary-button" href="/live">Explore Live TV</Link>
        </div>
      </div>
      <HeroLogoStage channels={channels} />
    </section>
  );
}
