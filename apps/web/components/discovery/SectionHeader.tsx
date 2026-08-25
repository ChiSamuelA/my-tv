import Link from "next/link";

export function SectionHeader({ title, description, href, action = "View all" }: {
  title: string;
  description?: string;
  href?: string;
  action?: string;
}) {
  return (
    <header className="section-header">
      <div><h2>{title}</h2>{description ? <p>{description}</p> : null}</div>
      {href ? <Link className="section-link" href={href}>{action} <span aria-hidden="true">→</span></Link> : null}
    </header>
  );
}
