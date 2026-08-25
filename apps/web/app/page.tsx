import {
  getCatalogStats,
  getChannels,
} from "@/lib/server/catalog";

export default async function Home() {
  const [stats, sports] = await Promise.all([
    getCatalogStats(),
    getChannels({ category: "sports", page: 1, limit: 5 }),
  ]);

  return (
    <main className="mx-auto max-w-2xl p-8 font-sans">
      <h1 className="text-2xl font-semibold">Catalog development check</h1>
      <p>{stats.channelCount.toLocaleString()} channels</p>
      <p>{stats.streamCount.toLocaleString()} streams</p>
      <p>{sports.totalItems.toLocaleString()} Sports channels</p>
      <h2 className="mt-6 font-semibold">First 5 Sports channels</h2>
      <ol className="list-decimal pl-6">
        {sports.items.map((channel) => <li key={channel.id}>{channel.name}</li>)}
      </ol>
    </main>
  );
}
