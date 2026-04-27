import {
  countDashboardStats,
  listDocumentsForUser,
} from "@/lib/services/documents/repository";
import { listRecentJobsForUser } from "@/lib/services/ingestion/jobs";

export async function getDashboardData(userId: number) {
  const [stats, recentJobs, documents] = await Promise.all([
    countDashboardStats(userId),
    listRecentJobsForUser(userId),
    listDocumentsForUser(userId),
  ]);

  return {
    stats,
    recentJobs,
    documents,
  };
}
