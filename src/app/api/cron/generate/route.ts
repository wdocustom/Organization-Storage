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

import { TARGET_CITIES } from "@/lib/cities";

// ---------- Topic rotation per city ----------
const TOPICS = [
  {
    angle: "start-business",
    prompt: (city: string) =>
      `Write a highly specific, localized SEO article about starting a custom garage shelving business in ${city}. Make it sound like local advice from someone who actually works in the ${city} market. Reference local housing styles, climate challenges, big box store availability, and what the local competition looks like.`,
  },
  {
    angle: "pricing-strategy",
    prompt: (city: string) =>
      `Write about pricing strategy for a garage shelving installer working in ${city}. Cover how to quote jobs, what customers in ${city} expect to pay, how to handle price objections, when to walk away from lowball customers, and how lumber costs in the ${city} area affect your margins. Be specific to ${city} neighborhoods and income levels.`,
  },
  {
    angle: "marketing-leads",
    prompt: (city: string) =>
      `Write about how a garage shelving contractor gets customers in ${city}. Cover what actually works — yard signs in ${city} neighborhoods, Nextdoor posts, Facebook Marketplace, word of mouth, leaving cards at local hardware stores. What doesn't work. How to get your first 10 customers in ${city} with zero ad budget. Be hyper-local.`,
  },
  {
    angle: "build-mistakes",
    prompt: (city: string) =>
      `Write about the most expensive mistakes new garage shelving installers make in ${city}. Bad lumber math, wrong tote measurements, not accounting for garage floor slopes in ${city} homes, undersizing for the customer's wall, not checking for obstacles. Real job-site horror stories. How each mistake eats your profit margin.`,
  },
  {
    angle: "scaling-up",
    prompt: (city: string) =>
      `Write about going from weekend side hustle to full-time garage shelving business in ${city}. When to quit your day job, how many jobs per week you need in the ${city} market, getting a business license in ${city}, insurance, hiring a helper, buying a trailer. The real numbers from someone who did it in a market like ${city}.`,
  },
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
TITLE: [Punchy, highly clickable title including the city name. Use the current year (${new Date().getFullYear()}) if you include a year — never use an outdated year.]
SLUG: [url-friendly-slug-with-city-name]
CONTENT:
[Your Markdown article goes here. Use H2s, H3s, bullet points, and bold text for scannability.]`;

// ---------- Auth guard ----------
function isAuthorized(request: NextRequest): boolean {
  // Support both Authorization header (Vercel cron) and query param (manual testing)
  const authHeader = request.headers.get("authorization");
  const querySecret = request.nextUrl.searchParams.get("secret");

  if (authHeader) {
    const token = authHeader.replace("Bearer ", "");
    return token === process.env.CRON_SECRET;
  }

  if (querySecret) {
    return querySecret === process.env.CRON_SECRET;
  }

  return false;
}

// ---------- AI content generation ----------
async function generateArticle(city: string, topicPrompt: string) {
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
      messages: [{ role: "user", content: topicPrompt }],
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

// ---------- How many articles to generate per cron invocation ----------
const BATCH_SIZE = 3;

// ---------- Pick next N city+topic pairs ----------
async function pickBatch(): Promise<
  { city: string; angle: string; prompt: string }[]
> {
  const { data: existing } = await supabaseAdmin
    .from("articles")
    .select("target_city")
    .eq("category", "local-guide");

  // Count articles per city to determine which topic index to use
  const countByCity: Record<string, number> = {};
  for (const row of existing ?? []) {
    countByCity[row.target_city] = (countByCity[row.target_city] || 0) + 1;
  }

  const batch: { city: string; angle: string; prompt: string }[] = [];

  for (const city of TARGET_CITIES) {
    if (batch.length >= BATCH_SIZE) break;
    const count = countByCity[city] || 0;
    if (count < TOPICS.length) {
      const topic = TOPICS[count];
      batch.push({ city, angle: topic.angle, prompt: topic.prompt(city) });
      countByCity[city] = count + 1; // track within batch
    }
  }

  return batch;
}

// ---------- Route handler ----------
export async function GET(request: NextRequest) {
  console.log("[cron/generate] Hit — checking auth...");

  // Auth check
  if (!isAuthorized(request)) {
    console.log("[cron/generate] Auth FAILED — no valid secret found");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  console.log("[cron/generate] Auth OK");

  try {
    const batch = await pickBatch();
    console.log("[cron/generate] Batch size:", batch.length);

    if (batch.length === 0) {
      return NextResponse.json({
        message: "All target cities and topics have been covered.",
      });
    }

    const results: { city: string; angle: string; title: string; slug: string }[] = [];

    for (const next of batch) {
      console.log("[cron/generate] Generating for:", next.city, next.angle);
      const { title, slug, content } = await generateArticle(next.city, next.prompt);
      console.log("[cron/generate] Generated:", { title, slug, contentLen: content.length });

      const { error } = await supabaseAdmin.from("articles").insert({
        slug,
        title,
        content,
        category: "local-guide",
        target_city: next.city,
        published_at: new Date().toISOString(),
      });

      if (error) {
        console.error("[cron/generate] Insert failed for", next.city, ":", error.message);
        continue; // skip this one, keep going
      }

      console.log("[cron/generate] Inserted:", title);
      results.push({ city: next.city, angle: next.angle, title, slug });
    }

    return NextResponse.json({ success: true, generated: results.length, results });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[cron/generate] ERROR:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
