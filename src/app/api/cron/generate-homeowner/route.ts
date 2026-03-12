import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { TOTE, TOTE_BRANDS, EXAMPLE_15_TOTE } from "@/lib/build-specs";

import { TARGET_CITIES } from "@/lib/cities";

// ---------- Topic rotation per city ----------
const TOPICS = [
  {
    angle: "garage-declutter",
    prompt: (city: string) =>
      `Write about how a homeowner in ${city} can finally get their garage under control with a tote rack system. Talk about the specific stuff people in ${city} are storing — sports gear, holiday decorations, tools, kids stuff. Be specific to ${city} climate and lifestyle. Why totes on a rack beat plastic bins stacked on the floor or flimsy wire shelving.`,
  },
  {
    angle: "hiring-installer",
    prompt: (city: string) =>
      `Write about what a homeowner in ${city} should look for when hiring someone to build custom garage shelving. Red flags, fair pricing ($600-800 for a 15-tote unit), questions to ask, why custom wood racks are worth it vs the garbage wire kits from big box stores. Be specific to ${city} — mention local pricing expectations, neighborhoods where this is popular, etc.`,
  },
  {
    angle: "cost-breakdown",
    prompt: (city: string) =>
      `Write a transparent cost breakdown for a homeowner in ${city} considering custom tote storage shelving for their garage. Cover materials cost vs install cost, what's fair, what's a ripoff, and why the 27-gallon tote rack system is the sweet spot. Reference ${city}-specific lumber pricing if relevant and local big box stores.`,
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

// ---------- Pick next city + topic ----------
async function pickCityAndTopic(): Promise<{
  city: string;
  angle: string;
  prompt: string;
} | null> {
  const { data: existing } = await supabaseAdmin
    .from("articles")
    .select("target_city, category")
    .eq("category", "homeowner-guide");

  const usedCities = new Set(
    (existing ?? []).map((row) => row.target_city)
  );

  // Cycle through cities, then topics within each city
  for (const city of TARGET_CITIES) {
    // For now: one article per city, first topic
    if (!usedCities.has(city)) {
      const topic = TOPICS[0];
      return { city, angle: topic.angle, prompt: topic.prompt(city) };
    }
  }

  return null;
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
    const next = await pickCityAndTopic();
    console.log("[cron/generate-homeowner] Next:", next?.city ?? "ALL COVERED", next?.angle);

    if (!next) {
      return NextResponse.json({
        message: "All target cities have been covered for homeowner guides.",
      });
    }

    console.log("[cron/generate-homeowner] Generating for:", next.city);
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
      throw new Error(`Supabase insert failed: ${error.message}`);
    }

    console.log("[cron/generate-homeowner] Inserted successfully");

    return NextResponse.json({ success: true, city: next.city, title, slug });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[cron/generate-homeowner] ERROR:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
