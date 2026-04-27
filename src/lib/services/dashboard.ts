import {
  countDashboardStats,
  listDocumentsForUser,
} from "@/lib/services/documents/repository";

export async function getDashboardData(userId: number) {
  const [stats, documents] = await Promise.all([
    countDashboardStats(userId),
    listDocumentsForUser(userId),
  ]);

  return {
    stats,
    documents,
  };
}
