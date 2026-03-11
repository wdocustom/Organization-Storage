import { NextRequest, NextResponse } from "next/server";

/**
 * Manual seed endpoint — trigger article generation on demand.
 *
 * Usage:
 *   GET /api/seed?secret=YOUR_CRON_SECRET              → runs installer pipeline
 *   GET /api/seed?secret=YOUR_CRON_SECRET&type=homeowner → runs homeowner pipeline
 *   GET /api/seed?secret=YOUR_CRON_SECRET&type=both      → runs both
 */
export async function GET(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get("secret");
  const type = request.nextUrl.searchParams.get("type") ?? "installer";

  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Invalid secret" }, { status: 401 });
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL
    || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null)
    || "http://localhost:3000";

  const headers = { Authorization: `Bearer ${process.env.CRON_SECRET}` };
  const results: Record<string, unknown> = {};

  try {
    if (type === "installer" || type === "both") {
      console.log("[seed] Triggering installer pipeline...");
      const res = await fetch(`${baseUrl}/api/cron/generate`, { headers });
      results.installer = { status: res.status, ...(await res.json()) };
    }

    if (type === "homeowner" || type === "both") {
      console.log("[seed] Triggering homeowner pipeline...");
      const res = await fetch(`${baseUrl}/api/cron/generate-homeowner`, { headers });
      results.homeowner = { status: res.status, ...(await res.json()) };
    }

    console.log("[seed] Results:", JSON.stringify(results));
    return NextResponse.json(results);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[seed] Error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
