import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Everything requires a signed-in Clerk session except the auth pages and
// /api/mcp — that route has no browser session to check; it authenticates
// each request itself via a personal access token in the Authorization
// header (see src/app/api/mcp/route.ts).
const isPublicRoute = createRouteMatcher(["/sign-in(.*)", "/sign-up(.*)", "/api/mcp(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) await auth.protect();
});

export const config = {
  matcher: [
    // manifest.json is matched explicitly (not just added to the extension
    // list below) because that list deliberately excludes plain ".json" via
    // a negative lookahead, so a dynamic *.json route can never accidentally
    // skip auth — this PWA manifest is the one legitimate static exception.
    "/((?!_next|manifest\\.json|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
    "/__clerk/:path*",
  ],
};
