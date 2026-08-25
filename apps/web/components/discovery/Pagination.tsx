import Link from "next/link";

interface PaginationProps { page: number; totalPages: number; hrefForPage: (page: number) => string; }

function visiblePages(page: number, totalPages: number): Array<number | "ellipsis"> {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, index) => index + 1);
  const pages = [...new Set([1, totalPages, page - 1, page, page + 1])].filter((value) => value >= 1 && value <= totalPages).sort((a, b) => a - b);
  const result: Array<number | "ellipsis"> = [];
  pages.forEach((value, index) => {
    if (index > 0 && value - pages[index - 1] > 1) result.push("ellipsis");
    result.push(value);
  });
  return result;
}

export function Pagination({ page, totalPages, hrefForPage }: PaginationProps) {
  if (totalPages <= 1) return null;
  return (
    <nav className="pagination" aria-label="Sports results pages">
      {page > 1 ? <Link className="page-button page-arrow" href={hrefForPage(page - 1)} aria-label="Previous page">{"\u2190"}</Link> : <span className="page-button page-arrow disabled" aria-hidden="true">{"\u2190"}</span>}
      {visiblePages(page, totalPages).map((value, index) => value === "ellipsis"
        ? <span className="page-ellipsis" key={`ellipsis-${index}`} aria-hidden="true">{"\u2026"}</span>
        : <Link aria-current={value === page ? "page" : undefined} className={`page-button${value === page ? " active" : ""}`} href={hrefForPage(value)} key={value}>{value}</Link>)}
      {page < totalPages ? <Link className="page-button page-arrow" href={hrefForPage(page + 1)} aria-label="Next page">{"\u2192"}</Link> : <span className="page-button page-arrow disabled" aria-hidden="true">{"\u2192"}</span>}
    </nav>
  );
}
