import type { MetadataRoute } from "next";
import { supabase } from "@/lib/supabase";
import { SITE_URL } from "@/lib/constants";
import { TARGET_CITIES, cityToSlug } from "@/lib/cities";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { data: articles } = process.env.NEXT_PUBLIC_SUPABASE_URL
    ? await supabase
        .from("articles")
        .select("slug, published_at")
        .order("published_at", { ascending: false })
    : { data: null };

  const articleEntries: MetadataRoute.Sitemap = (articles ?? []).map((a) => ({
    url: `${SITE_URL}/${a.slug}`,
    lastModified: a.published_at,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  const cityEntries: MetadataRoute.Sitemap = TARGET_CITIES.map((city) => ({
    url: `${SITE_URL}/city/${cityToSlug(city)}`,
    lastModified: new Date().toISOString(),
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [
    {
      url: SITE_URL,
      lastModified: new Date().toISOString(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    ...cityEntries,
    ...articleEntries,
  ];
}
