import { HomeScreen } from "@/components/home/HomeScreen";
import { getHomeData } from "@/lib/server/home";

export default async function HomePage() {
  const data = await getHomeData();
  return <HomeScreen data={data} />;
}
