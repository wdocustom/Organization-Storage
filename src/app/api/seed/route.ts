import { NextRequest, NextResponse } from "next/server";

/**
 * Manual seed endpoint — hit this to trigger article generation on demand.
 * Usage: GET /api/seed?secret=YOUR_CRON_SECRET
 *
 * This calls the cron/generate endpoint internally so you don't have to
 * wait for the scheduled cron to fire.
 */
export async function GET(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get("secret");

  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Invalid secret" }, { status: 401 });
  }

  // Build the internal URL for the cron endpoint
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL
    || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null)
    || "http://localhost:3000";

  console.log("[seed] Triggering cron/generate at:", baseUrl);

  try {
    const res = await fetch(`${baseUrl}/api/cron/generate`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${process.env.CRON_SECRET}`,
      },
    });

    const data = await res.json();
    console.log("[seed] Cron response:", JSON.stringify(data));

    return NextResponse.json({
      status: res.status,
      ...data,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[seed] Error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
