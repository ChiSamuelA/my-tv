import type { Metadata } from "next";
import { SearchScreen } from "@/components/search/SearchScreen";
import { getSearchPageData, type SearchParams } from "@/lib/server/search";

export const metadata: Metadata = { title: "Search | my\u00b7tv" };

export default async function SearchPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const data = await getSearchPageData(await searchParams);
  return <SearchScreen data={data} />;
}
