import { supabase } from "@/lib/supabase";
import ArticleCard from "./ArticleCard";

interface RelatedArticlesProps {
  currentSlug: string;
  category: string;
  targetCity: string | null;
}

export default async function RelatedArticles({
  currentSlug,
  category,
  targetCity,
}: RelatedArticlesProps) {
  // Prefer same-city articles, then same-category
  let query = supabase
    .from("articles")
    .select("slug, title, category, target_city, published_at")
    .neq("slug", currentSlug)
    .eq("category", category)
    .order("published_at", { ascending: false })
    .limit(6);

  if (targetCity) {
    query = query.eq("target_city", targetCity);
  }

  const { data: sameCityArticles } = await query;

  let articles = sameCityArticles ?? [];

  // If we don't have enough same-city results, backfill with same-category
  if (articles.length < 3 && targetCity) {
    const slugsToExclude = [currentSlug, ...articles.map((a) => a.slug)];
    const { data: backfill } = await supabase
      .from("articles")
      .select("slug, title, category, target_city, published_at")
      .eq("category", category)
      .not("slug", "in", `(${slugsToExclude.join(",")})`)
      .order("published_at", { ascending: false })
      .limit(3 - articles.length);

    articles = [...articles, ...(backfill ?? [])];
  }

  if (articles.length === 0) return null;

  return (
    <section className="mt-16 border-t border-slate-800 pt-12">
      <h2 className="mb-6 text-xl font-bold text-white">Related Articles</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {articles.slice(0, 3).map((article) => (
          <ArticleCard key={article.slug} article={article} />
        ))}
      </div>
    </section>
  );
}
