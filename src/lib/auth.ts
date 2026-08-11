import { currentUser } from "@clerk/nextjs/server";

/**
 * Every row in the database is scoped by this. Email, not the Clerk user id,
 * because it also has to be typeable into a local MCP config by hand — see
 * the Help page. Middleware already guarantees a session exists everywhere
 * this runs, so a missing user here means something is wrong, not that the
 * visitor should be quietly treated as anonymous.
 */
export async function getOwnerId(): Promise<string> {
  const user = await currentUser();
  const email = user?.primaryEmailAddress?.emailAddress ?? user?.emailAddresses[0]?.emailAddress;
  if (!email) throw new Error("Signed in but no email on the Clerk user — cannot scope data.");
  return email;
}
