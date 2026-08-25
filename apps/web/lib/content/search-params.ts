export type SearchParams = Record<string, string | string[] | undefined>;

function firstValue(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value ?? "").trim();
}

export function normalizeSearchParams(params: SearchParams): { query: string; page: number } {
  const query = firstValue(params.q).slice(0, 120);
  const pageValue = firstValue(params.page);
  const candidate = /^\d+$/.test(pageValue) ? Number(pageValue) : Number.NaN;
  const page = Number.isSafeInteger(candidate) && candidate > 0 ? candidate : 1;
  return { query, page };
}
