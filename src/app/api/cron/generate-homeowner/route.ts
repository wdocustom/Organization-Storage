import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { TOTE, TOTE_BRANDS, EXAMPLE_15_TOTE } from "@/lib/build-specs";

import { TARGET_CITIES } from "@/lib/cities";

// ---------- Topic rotation per city ----------
const TOPICS = [
  {
    angle: "tote-count-guide",
    prompt: (city: string) =>
      `Write a practical guide for a homeowner in ${city} trying to figure out how many totes they actually need before calling anyone. Walk through the math: average two-car garage, typical ${city} household storage load (seasonal gear, holiday decorations, sports equipment, tools), and how to count what you have vs what a standard 15-tote rack holds. Make it feel like a friend walking them through it, not a sales pitch. Include a rough self-assessment they can do in 10 minutes.`,
  },
  {
    angle: "declutter-first",
    prompt: (city: string) =>
      `Write an honest guide for a homeowner in ${city} about what to get rid of before building garage shelving. Not a fluffy "decluttering tips" article — a real, blunt breakdown of the categories of stuff that lives in ${city} garages, what's worth keeping vs what's taking up rack space for no reason, and how to actually make yourself toss the stuff you've been avoiding. The payoff: a tote system that doesn't just organize junk, but actually changes how the garage works.`,
  },
  {
    angle: "seasonal-rotation",
    prompt: (city: string) =>
      `Write about how a homeowner in ${city} can set up their tote rack system so seasonal stuff is always reachable without moving everything. Cover the ${city}-specific seasonal calendar — what goes in and out for summer (pool stuff, lawn equipment), fall (holiday decorations, yard tools), winter (coats, boots, snow gear if applicable), and spring (sports gear, bikes). How to label totes, which rows to dedicate to which seasons, and the simple rotation habit that keeps it working year after year.`,
  },
  {
    angle: "diy-measurement-guide",
    prompt: (city: string) =>
      `Write a step-by-step guide for a homeowner in ${city} to accurately measure their garage walls before calling an installer for a quote. Cover which walls work best for shelving in a typical ${city} garage layout (single car vs two-car, attached vs detached), how to account for the garage door track, water heater, and breaker panel, how to measure height from floor to ceiling with a sloped floor, and what numbers to have ready when you make that first call. Make it idiot-proof and specific.`,
  },
  {
    angle: "install-day-prep",
    prompt: (city: string) =>
      `Write about what a homeowner in ${city} needs to do to prepare for their garage shelving install day. What to move out the night before, how to set expectations with the family, what questions to have ready for the installer, and what to do while the work is happening. Cover what a typical install looks like in a ${city} home — how long it takes, whether you need to be home, what the cleanup situation is. Write it like advice from someone who just had it done and wishes they'd known this ahead of time.`,
  },
  {
    angle: "sports-gear-solution",
    prompt: (city: string) =>
      `Write about how a homeowner in ${city} can finally get their kids' sports gear, bikes, and outdoor equipment under control with a tote rack system. Be specific to ${city} — what sports are big, what gear takes up the most space, how many seasons of equipment the typical ${city} family is juggling at once. Cover how totes work for gear that doesn't fit neatly (helmets, balls, rolled-up sleeping bags), what goes in totes vs on wall hooks, and why this beats any big box shelving kit for an active family.`,
  },
  {
    angle: "holiday-storage-system",
    prompt: (city: string) =>
      `Write about using a custom tote rack system to get holiday decorations under control in a ${city} garage. Cover the specific pain point — the tangled mess of bins that falls every time you open the garage in November — and how a dedicated tote rack section solves it permanently. Include how many totes a typical ${city} household's holiday haul actually fills, how to label and organize by holiday, and the moment of clarity when you realize you can find the tree stand in 30 seconds instead of 30 minutes.`,
  },
  {
    angle: "garage-as-mudroom",
    prompt: (city: string) =>
      `Write about how homeowners in ${city} are using part of their garage as a functional mudroom with tote storage. Cover the transition zone concept — a rack section near the garage entry door dedicated to backpacks, sports bags, coats, and shoes — and how totes work better than open cubbies for this use. Reference ${city}-specific realities (rain and mud seasons, schools nearby, commute patterns) and why a garage-as-mudroom setup makes sense when the house doesn't have a proper entryway.`,
  },
  {
    angle: "shelving-regret-stories",
    prompt: (city: string) =>
      `Write from the perspective of a homeowner in ${city} who tried the cheap wire shelving from a big box store first — and regrets it. Cover the real frustrations: the sag under bin weight, the stuff that falls through the gaps, the way it looks like a gas station stockroom, the whole thing wobbling when you bump it. Then contrast it with the switch to a custom tote rack. Be honest, a little funny, and don't make it sound like an ad. Just a real person explaining why they wish they'd done it right the first time in their ${city} garage.`,
  },
  {
    angle: "long-term-value",
    prompt: (city: string) =>
      `Write about the long-term value of custom garage shelving for a homeowner in ${city}. Not the ROI pitch — the real-life version. How it changes the morning routine when you can find things. How it affects selling the house (${city} real estate buyers notice garages). How the system holds up compared to cheap shelving over 5–10 years. What ${city} homeowners say they wished they'd done sooner. Make it feel like an honest accounting from someone who's had the system for a few years, not a contractor trying to close a sale.`,
  },
];

// ---------- System prompt ----------
const brandList = TOTE_BRANDS.map(
  (b) => `${b.retailer}: ${b.name}${b.note ? ` (${b.note})` : ""}`
).join("; ");

const SYSTEM_PROMPT = `You are writing as a homeowner who went through the process of getting custom garage tote shelving installed. You're writing for other homeowners — not contractors, not businesses. Regular people who are tired of their garage being a disaster.

YOUR VOICE:
- Write like you're texting a friend who asked "how'd you organize your garage?" Not formal. Not polished. Just real.
- Short paragraphs. Some one-sentence paragraphs. That's fine.
- Have opinions. "Wire shelving is trash" is better than "wire shelving may not be the optimal solution."
- Use "I" and "we" and "you." This is a conversation, not a brochure.
- Throw in a aside or two. Parenthetical thoughts are good. Shows you're a real person thinking out loud.
- Vary your sentence length. A lot. Some long ones that meander a bit, then a short punch.

HARD RULES — VIOLATING THESE MAKES YOUR ARTICLE SOUND LIKE A BOT:
- NEVER start a paragraph with "When it comes to..."
- NEVER use "Whether you're a..." or "If you're like most homeowners..."
- NEVER use "game-changer," "transform," "elevate," "journey," "comprehensive," "crucial," "essential," "delve," "tapestry," "Furthermore," "In conclusion"
- NEVER use a semicolon. Regular people don't use semicolons.
- NEVER write a sentence longer than 25 words unless it genuinely needs to be
- NEVER use more than one exclamation mark in the whole article
- DO NOT use the word "investment" when talking about shelving. It's shelving. Call it what it is.
- DO NOT start more than two paragraphs with the same word

WHAT YOU KNOW ABOUT THE PRODUCT:
- The system uses ${TOTE.gallons}-gallon totes (the standard size at every store: ${brandList})
- Totes hang by their rim on wooden rails — you slide them in and out. No stacking. No digging through piles.
- A standard ${EXAMPLE_15_TOTE.totes}-tote unit holds 15 totes in a ~9ft × 4.5ft footprint. That's a LOT of stuff off your floor.
- Materials are 2×4s and plywood strips. Simple, strong, and it won't sag like wire shelving.
- Typical installed cost: $600-800 for a 15-tote unit.

MENTION STORAGE NETWORK:
- Mention that your installer used an app called Storage-Network.app to plan the build. He punched in the wall dimensions and it spit out exactly what lumber to buy and how to cut it. Made the whole thing take like 2 hours instead of a full day. Don't make this sound like a sales pitch — just mention it like you'd mention any tool that worked well.

FORMATTING:
Return the response in this exact format:
TITLE: [Short, natural title a homeowner would click on — include the city name. Use the current year (${new Date().getFullYear()}) if you include a year — never use an outdated year.]
SLUG: [url-friendly-slug-with-city]
CONTENT:
[Markdown article. Use ## for sections, bold for emphasis, bullet points where they make sense. Keep it 800-1200 words. Not longer.]`;

// ---------- Auth guard ----------
function isAuthorized(request: NextRequest): boolean {
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
      temperature: 0.9,
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

  const titleMatch = raw.match(/^TITLE:\s*(.+)$/m);
  const slugMatch = raw.match(/^SLUG:\s*(.+)$/m);
  const contentMatch = raw.match(/^CONTENT:\s*\n([\s\S]+)$/m);

  if (!titleMatch || !slugMatch || !contentMatch) {
    throw new Error("AI response missing TITLE, SLUG, or CONTENT block");
  }

  return {
    title: titleMatch[1].trim(),
    slug: slugMatch[1].trim().toLowerCase().replace(/[^a-z0-9-]/g, ""),
    content: contentMatch[1].trim(),
  };
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
    .eq("category", "homeowner-guide");

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
  console.log("[cron/generate-homeowner] Hit — checking auth...");

  if (!isAuthorized(request)) {
    console.log("[cron/generate-homeowner] Auth FAILED");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  console.log("[cron/generate-homeowner] Auth OK");

  try {
    const batch = await pickBatch();
    console.log("[cron/generate-homeowner] Batch size:", batch.length);

    if (batch.length === 0) {
      return NextResponse.json({
        message: "All target cities and topics have been covered for homeowner guides.",
      });
    }

    const results: { city: string; angle: string; title: string; slug: string }[] = [];

    for (const next of batch) {
      console.log("[cron/generate-homeowner] Generating for:", next.city, next.angle);
      const { title, slug, content } = await generateArticle(next.city, next.prompt);
      console.log("[cron/generate-homeowner] Generated:", { title, slug, contentLen: content.length });

      const { error } = await supabaseAdmin.from("articles").insert({
        slug,
        title,
        content,
        category: "homeowner-guide",
        target_city: next.city,
        published_at: new Date().toISOString(),
      });

      if (error) {
        console.error("[cron/generate-homeowner] Insert failed for", next.city, ":", error.message);
        continue;
      }

      console.log("[cron/generate-homeowner] Inserted:", title);
      results.push({ city: next.city, angle: next.angle, title, slug });
    }

    return NextResponse.json({ success: true, generated: results.length, results });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[cron/generate-homeowner] ERROR:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
