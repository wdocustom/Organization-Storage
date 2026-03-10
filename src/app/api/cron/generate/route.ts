import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

// ---------- City rotation ----------
const TARGET_CITIES = [
  "Houston, TX",
  "Phoenix, AZ",
  "Nashville, TN",
  "Denver, CO",
  "Charlotte, NC",
  "Columbus, OH",
  "Indianapolis, IN",
  "San Antonio, TX",
  "Jacksonville, FL",
  "Oklahoma City, OK",
];

// ---------- System prompt ----------
const SYSTEM_PROMPT = `You are a 15-year veteran contractor who installs custom garage shelving and storage systems for a living. You've driven 200,000 miles in your work van, you've miscut more 2x4s than you can count, and you know exactly what a 27-gallon yellow-top tote costs at every big box within 40 miles.

Write like you talk on the jobsite — direct, practical, no corporate fluff. You say things like "Look," and "Here's the deal." You reference real lumber dimensions, real hardware, real tote sizes. You talk about profit margins, material waste, and what separates a weekend warrior from a pro who clears $800/day.

NEVER use phrases like "In conclusion," "It's important to note," "In today's world," or "Whether you're a seasoned pro or just starting out." That's AI garbage. Write like a guy who has sawdust on his boots.

Format all output as Markdown with proper ## headings, bullet lists, and bold text for emphasis. Keep paragraphs short — 2-3 sentences max. Contractors don't read walls of text.`;

// ---------- Auth guard ----------
function isAuthorized(request: NextRequest): boolean {
  const authHeader = request.headers.get("authorization");
  if (!authHeader) return false;
  const token = authHeader.replace("Bearer ", "");
  return token === process.env.CRON_SECRET;
}

// ---------- AI content generation ----------
async function generateArticle(city: string) {
  const userPrompt = `Write a Local Garage Shelving Installation Guide for ${city}. Cover:

1. Why homeowners in ${city} specifically need garage storage (climate, housing styles, local culture)
2. The exact materials list for a standard 8-foot garage wall shelving unit (lumber sizes, screws, brackets — be specific)
3. Step-by-step build instructions a homeowner could follow but would be better off hiring a pro for
4. What a contractor should charge in the ${city} market and what margins look like
5. Common mistakes you see DIYers in ${city} make

Title the article something a homeowner in ${city} would actually Google. Return it in this exact format:

TITLE: [your title here]
SLUG: [url-friendly-slug]

[Full markdown article content below]`;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY!,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Anthropic API error (${response.status}): ${err}`);
  }

  const data = await response.json();
  const raw: string = data.content[0].text;

  // Parse structured response
  const titleMatch = raw.match(/^TITLE:\s*(.+)$/m);
  const slugMatch = raw.match(/^SLUG:\s*(.+)$/m);

  if (!titleMatch || !slugMatch) {
    throw new Error("AI response missing TITLE or SLUG");
  }

  const title = titleMatch[1].trim();
  const slug = slugMatch[1].trim().toLowerCase().replace(/[^a-z0-9-]/g, "");

  // Everything after the SLUG line is content
  const contentStart = raw.indexOf(slugMatch[0]) + slugMatch[0].length;
  const content = raw.slice(contentStart).trim();

  return { title, slug, content };
}

// ---------- Pick next city ----------
async function pickCity(): Promise<string | null> {
  // Check which cities already have articles
  const { data: existing } = await supabaseAdmin
    .from("articles")
    .select("target_city")
    .eq("category", "local-guide");

  const usedCities = new Set(
    (existing ?? []).map((row) => row.target_city)
  );

  const available = TARGET_CITIES.filter((city) => !usedCities.has(city));
  if (available.length === 0) return null;

  return available[0];
}

// ---------- Route handler ----------
export async function GET(request: NextRequest) {
  // Auth check
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Pick a city that hasn't been covered yet
    const city = await pickCity();

    if (!city) {
      return NextResponse.json({
        message: "All target cities have been covered.",
      });
    }

    // Generate the article
    const { title, slug, content } = await generateArticle(city);

    // Insert into Supabase
    const { error } = await supabaseAdmin.from("articles").insert({
      slug,
      title,
      content,
      category: "local-guide",
      target_city: city,
      published_at: new Date().toISOString(),
    });

    if (error) {
      throw new Error(`Supabase insert failed: ${error.message}`);
    }

    return NextResponse.json({
      success: true,
      city,
      title,
      slug,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Cron generate error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
