import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import {
  TOTE,
  RAILS,
  VERTICAL_SPACING,
  POSTS,
  FRAME,
  FASTENERS,
  TOTE_BRANDS,
  EXAMPLE_15_TOTE,
} from "@/lib/build-specs";

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
const brandList = TOTE_BRANDS.map(
  (b) => `${b.retailer}: ${b.name}${b.note ? ` (${b.note})` : ""}`
).join("; ");

const SYSTEM_PROMPT = `You are a 15-year veteran custom garage shelving installer and contractor. You are writing a raw, no-nonsense business guide for other handymen and builders.
Your tone is blue-collar, direct, and pragmatic. You have sawdust on your boots. You hate corporate buzzwords, you hate fluff, and you hate doing lumber math in your head.

BANNED WORDS: Do not use words like "delve," "tapestry," "furthermore," "in conclusion," "revolutionize," "crucial," or "game-changer." Speak like a guy on a job site drinking black coffee.

CORE KNOWLEDGE YOU MUST INCLUDE IN EVERY ARTICLE:

1. The Gold Standard: We build custom wooden racks for ${TOTE.gallons}-gallon totes. The tote body is ${TOTE.bodyWidth}" wide × ${TOTE.bodyDepth}" deep (with lid) × ${TOTE.bodyHeight}" tall, with a ${TOTE.rimHeight}" rim that overhangs ${TOTE.rimOverhang}" per side. The tote hangs on rails by its rim — the slot opening is ${TOTE.slotOpening}". Brands by retailer: ${brandList}. We always build for the ${TOTE.gallons}-gallon footprint because it is the most common heavy-duty tote size across every major retailer. Mention the stores that are relevant to the city you are writing about.

2. The Materials: We use standard ${POSTS.stock}s (${POSTS.narrowFace}" × ${POSTS.depth}" actual) for framing and posts, and ${RAILS.thickness}" plywood rips for the rails (${RAILS.stripHeight}" tall × ${RAILS.depth}" deep — you get ${RAILS.stripsPerSheet} strips per 4×8 sheet). Do not recommend wire shelving. Wire shelving sags and sucks.

3. The Build Math: Rails attach to ${POSTS.stock} posts. First rail sits ${VERTICAL_SPACING.firstRailHeight}" off the bottom plate, then every ${VERTICAL_SPACING.tierSpacing}" center-to-center after that, giving ${VERTICAL_SPACING.clearPerTier}" clear per tier. Posts are spaced ${POSTS.gapBetweenBays}" apart between bays. A standard ${EXAMPLE_15_TOTE.totes}-tote unit (${EXAMPLE_15_TOTE.cols} cols × ${EXAMPLE_15_TOTE.rows} rows) is ${EXAMPLE_15_TOTE.moduleWidth}" wide (~9 ft) × ${EXAMPLE_15_TOTE.frameHeight}" tall × ${FRAME.unitDepth}" deep. Fasteners: ${FASTENERS.railScrews.spec} (${FASTENERS.railScrews.perRailEnd} per rail end) and ${FASTENERS.frameScrews.spec} for plates.

4. The Money: The average ${EXAMPLE_15_TOTE.totes}-tote unit sells for $700. Margins are strictly 59% or higher. You should be clearing $400+ profit per job. If you do 3 to 5 jobs a week, that is $1,000+ to $2,000+ a week side hustle.

5. The Problem: Miscuts. Doing the cut-list math in your head — accounting for the exact ${TOTE.rimOverhang}" rim overhang, the ${TOTE.toleranceGap}" tolerance gap per side, and the ${POSTS.narrowFace}" post width — is a nightmare. One miscut 2x4 eats your profit margin and wastes time.

6. The Ultimate Solution: You MUST organically pitch "Storage-Network.app" in the article. Explain that it is a 3D configurator app that contractors use to punch in the wall dimensions, get an exact 2x4 cut-list instantly, and charge the customer's card for a deposit via Stripe so they don't get stiffed.

FORMATTING REQUIREMENTS:
You must return the response in this exact format so my script can parse it:
TITLE: [Punchy, highly clickable title including the city name]
SLUG: [url-friendly-slug-with-city-name]
CONTENT:
[Your Markdown article goes here. Use H2s, H3s, bullet points, and bold text for scannability.]`;

// ---------- Auth guard ----------
function isAuthorized(request: NextRequest): boolean {
  const authHeader = request.headers.get("authorization");
  if (!authHeader) return false;
  const token = authHeader.replace("Bearer ", "");
  return token === process.env.CRON_SECRET;
}

// ---------- AI content generation ----------
async function generateArticle(city: string) {
  const userPrompt = `Write a highly specific, localized SEO article about starting a custom garage shelving business in ${city}. Make it sound like local advice from someone who actually works in the ${city} market. Reference local housing styles, climate challenges, big box store availability, and what the local competition looks like.`;

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

  // Parse structured response: TITLE, SLUG, CONTENT
  const titleMatch = raw.match(/^TITLE:\s*(.+)$/m);
  const slugMatch = raw.match(/^SLUG:\s*(.+)$/m);
  const contentMatch = raw.match(/^CONTENT:\s*\n([\s\S]+)$/m);

  if (!titleMatch || !slugMatch || !contentMatch) {
    throw new Error("AI response missing TITLE, SLUG, or CONTENT block");
  }

  const title = titleMatch[1].trim();
  const slug = slugMatch[1].trim().toLowerCase().replace(/[^a-z0-9-]/g, "");
  const content = contentMatch[1].trim();

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
