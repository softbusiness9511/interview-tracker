import { getInterviews } from "@/lib/queries";
import { Pipeline } from "@/components/pipeline";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const rows = await getInterviews();
  return <Pipeline initialRows={rows} />;
}
