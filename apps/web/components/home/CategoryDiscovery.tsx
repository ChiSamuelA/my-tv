import Link from "next/link";
import { SectionHeader } from "@/components/discovery/SectionHeader";

export function CategoryDiscovery({ categories }: { categories: Array<{ id: string; label: string }> }) {
  return (
    <section className="home-section category-section">
      <SectionHeader description="More ways to browse live television" title="Explore categories" />
      <div className="category-links">
        {categories.map((category, index) => (
          <Link className={index === 0 ? "active" : undefined} href={`/live?category=${category.id}`} key={category.id}>{category.label}</Link>
        ))}
      </div>
    </section>
  );
}
