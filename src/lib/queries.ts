import { asc } from "drizzle-orm";
import { getDb } from "@/db";
import { interviews, type Interview } from "@/db/schema";

/**
 * Plain server-side read, deliberately not a server action — it should not be
 * reachable as a callable endpoint from the client.
 */
export async function getInterviews(): Promise<Interview[]> {
  return getDb().select().from(interviews).orderBy(asc(interviews.id));
}
