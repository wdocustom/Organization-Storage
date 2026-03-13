export const TARGET_CITIES = [
  // --- Original 10 ---
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

  // --- User-requested ---
  "Omaha, NE",
  "Des Moines, IA",
  "Columbia, MO",
  "Chicago, IL",

  // --- 200k–1M population cities ---
  "Raleigh, NC",
  "Tampa, FL",
  "Tucson, AZ",
  "Mesa, AZ",
  "Kansas City, MO",
  "Atlanta, GA",
  "Colorado Springs, CO",
  "Tulsa, OK",
  "Minneapolis, MN",
  "Arlington, TX",
  "Bakersfield, CA",
  "Aurora, CO",
  "Wichita, KS",
  "St. Louis, MO",
  "Pittsburgh, PA",
  "Cincinnati, OH",
  "Lexington, KY",
  "Richmond, VA",
  "Boise, ID",
  "Spokane, WA",
  "Fort Wayne, IN",
  "Madison, WI",
  "Knoxville, TN",
  "Chattanooga, TN",
  "Little Rock, AR",
];

/** "Houston, TX" → "houston-tx" */
export function cityToSlug(city: string): string {
  return city
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/** "houston-tx" → "Houston, TX" (or null if not found) */
export function slugToCity(slug: string): string | null {
  return TARGET_CITIES.find((c) => cityToSlug(c) === slug) ?? null;
}
