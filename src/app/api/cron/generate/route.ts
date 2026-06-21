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
    angle: "tool-checklist",
    prompt: (city: string) =>
      `Write a detailed, practical article about the exact tools, materials, and supplies a garage shelving installer needs before their first job in ${city}. Go beyond the obvious — cover the right saw setup for cutting 2x4s on-site, which drill bits actually last, what you need for measuring sloped garage floors in ${city} homes, and the small stuff (knee pads, shop vac, pencil chalk line) that rookies forget. Be hyper-specific. This is a checklist someone can actually take to the hardware store.`,
  },
  {
    angle: "customer-consultation",
    prompt: (city: string) =>
      `Write about how a garage shelving installer in ${city} should run a proper in-home consultation. Walk through the whole process: what to look for when you first walk in, how to measure the wall correctly, how to read the customer's storage needs from what's piled on the floor, how to quote on the spot, and how to close without sounding pushy. Include how ${city} homeowners typically respond and what objections come up most in this market.`,
  },
  {
    angle: "upsell-add-ons",
    prompt: (city: string) =>
      `Write about the add-ons and upgrades that double the average job ticket for a garage shelving installer in ${city}. Cover bike hooks and wall-mounted bike storage, overhead ceiling platforms for seasonal gear, integrated workbench builds, slatwall panels for tools, and floor epoxy coordination. How to bring these up naturally without it feeling like a pitch. What ${city} homeowners are most likely to say yes to, and which add-ons have the best margin.`,
  },
  {
    angle: "material-sourcing",
    prompt: (city: string) =>
      `Write about where to actually buy lumber and materials for garage shelving in ${city} — and how to stop overpaying at big box stores. Cover the local lumber yards, building supply wholesalers, and any ${city}-area options that beat Home Depot or Lowe's on price or quality. Talk about buying in bulk, building supplier accounts, and how to manage material costs when lumber prices move. Be honest about what the markup looks like and how it hits your margins.`,
  },
  {
    angle: "seasonal-demand",
    prompt: (city: string) =>
      `Write about how demand for garage shelving work shifts through the seasons in ${city}. When does the phone ring most — spring cleanouts, pre-holiday panic, post-move-in rush? What's the slow season in ${city} and how do you fill the calendar? Cover how ${city}'s climate affects scheduling (heat in summer, rain in spring, cold garages in winter), and how to use the slow months to build pipeline so you're never slow again.`,
  },
  {
    angle: "referral-machine",
    prompt: (city: string) =>
      `Write about how a garage shelving installer builds a referral machine in ${city} with zero paid advertising. Cover what to say at the end of every job to plant the referral seed, how to use before/after photos on Nextdoor in ${city} neighborhoods, the power of leaving a business card in the finished rack, and how to stay top of mind with past customers. Include the math — what one happy customer is worth in ${city} if they refer even two more jobs over a year.`,
  },
  {
    angle: "install-day-breakdown",
    prompt: (city: string) =>
      `Write a detailed breakdown of what actually happens on a professional garage shelving install day in ${city}. Cover load-in, the first thing you do when you walk in, how you deal with the customer being home vs out, the exact build sequence, how long each phase takes, what to do when something doesn't line up right, and how you do the final walkthrough. Write it like a training guide for someone doing their second-ever job in a ${city} garage.`,
  },
  {
    angle: "difficult-garages",
    prompt: (city: string) =>
      `Write about how to handle the weird, difficult garages that pop up constantly in ${city}. Sloped concrete floors, low ceilings in older ${city} homes, walls that aren't square, water heaters and breaker panels in the way, stucco walls that won't hold a screw, garage door tracks that eat into your wall space. Real solutions — not "measure twice, cut once" platitudes — for the annoying stuff that comes up on jobs in this market.`,
  },
  {
    angle: "job-photography",
    prompt: (city: string) =>
      `Write about how a garage shelving installer in ${city} should photograph their work to get jobs on Instagram, Nextdoor, and Facebook Marketplace. Cover the before shot (how to make a chaotic garage look legitimately bad), the after shot (angles, lighting, staging totes for the photo), and how to caption posts for maximum reach in ${city} neighborhoods. Include what NOT to do — blurry phone shots, cluttered backgrounds, posting without asking the homeowner. This is marketing that costs nothing but time.`,
  },
  {
    angle: "customer-trust",
    prompt: (city: string) =>
      `Write about how a garage shelving installer builds enough trust in ${city} to charge what they're worth and get paid a deposit before the job. Cover the small signals that tell a customer you're a professional — showing up on time, a clean truck, a written quote, having a business name — and how a simple "we stand behind our work" guarantee actually increases your close rate. What ${city} homeowners are nervous about, and exactly what to say to put them at ease without underselling yourself.`,
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
const BATCH_SIZE = 8;

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
