import { countDashboardStats } from "@/lib/services/documents/repository";
import { listRecentJobsForUser } from "@/lib/services/ingestion/jobs";

export async function getDashboardData(userId: number) {
  const [stats, recentJobs] = await Promise.all([
    countDashboardStats(userId),
    listRecentJobsForUser(userId),
  ]);

  return {
    stats,
    recentJobs,
  };
}
