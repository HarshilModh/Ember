import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { resolveOwnerFromToken } from "@/db/queries";
import { createEmberMcpServer } from "@/mcp/tools";

// Needs the Postgres driver and Node's crypto — not edge-compatible, and
// doesn't need to be.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * The remote counterpart to the local stdio server. There's no Clerk session
 * here — a caller proves who it's acting for with a personal access token
 * (Settings → Remote MCP access), the same way the stdio server trusts
 * whatever EMBER_OWNER_EMAIL it was started with. Everything downstream
 * (every tool, every query) is identical either way; only how ownerId gets
 * resolved differs.
 *
 * Stateless by design: a fresh server and transport per request, since
 * different callers (different tokens) mean different owners, and Vercel
 * gives no guarantee a warm instance is even the same caller next time.
 */
async function handle(req: Request): Promise<Response> {
  const auth = req.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : null;
  if (!token) {
    return Response.json({ error: "Missing Authorization: Bearer <token> header." }, { status: 401 });
  }

  const ownerId = await resolveOwnerFromToken(token);
  if (!ownerId) {
    return Response.json({ error: "Invalid or revoked token." }, { status: 401 });
  }

  const server = createEmberMcpServer(ownerId);
  const transport = new WebStandardStreamableHTTPServerTransport({ sessionIdGenerator: undefined });
  await server.connect(transport);
  return transport.handleRequest(req);
}

export { handle as GET, handle as POST, handle as DELETE };
