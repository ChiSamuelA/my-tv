export function SportsHeader({ total }: { total: number }) {
  return (
    <section className="sports-banner" aria-labelledby="sports-heading">
      <p className="eyebrow">Live sports</p>
      <h1 id="sports-heading">Sports</h1>
      <p>{total.toLocaleString("en")} authoritative Sports channels from around the world.</p>
    </section>
  );
}
