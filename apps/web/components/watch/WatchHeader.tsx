import Link from "next/link";

export function WatchHeader() {
  return <header className="watch-heading"><Link className="watch-back" href="/live">{"\u2190"} Back to Live TV</Link></header>;
}
