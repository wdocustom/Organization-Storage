import Link from "next/link";
import { supabase } from "@/lib/supabase";

interface RelatedArticlesProps {
  currentSlug: string;
  category: string;
}

export default async function RelatedArticles({
  currentSlug,
  category,
}: RelatedArticlesProps) {
  // Fetch a mix: prefer different categories to avoid "same title, different city" look
  const { data: mixedArticles } = await supabase
    .from("articles")
    .select("slug, title, category, target_city, published_at, content")
    .neq("slug", currentSlug)
    .neq("category", category)
    .order("published_at", { ascending: false })
    .limit(3);

  let articles = mixedArticles ?? [];

  // If not enough cross-category articles, backfill with same category but different city
  if (articles.length < 3) {
    const exclude = [currentSlug, ...articles.map((a) => a.slug)];
    const { data: backfill } = await supabase
      .from("articles")
      .select("slug, title, category, target_city, published_at, content")
      .not("slug", "in", `(${exclude.join(",")})`)
      .order("published_at", { ascending: false })
      .limit(3 - articles.length);

    articles = [...articles, ...(backfill ?? [])];
  }

  if (articles.length === 0) return null;

  return (
    <section className="mt-16 border-t border-slate-800 pt-10">
      <h2 className="mb-1 text-sm font-bold uppercase tracking-wider text-slate-500">
        Keep Reading
      </h2>
      <div className="mt-4 divide-y divide-slate-800/60">
        {articles.slice(0, 3).map((article) => {
          const excerpt = getExcerpt(article.content);
          return (
            <Link
              key={article.slug}
              href={`/${article.slug}`}
              className="group block py-5 transition-colors"
            >
              <p className="mb-1 text-base font-semibold text-white transition-colors group-hover:text-safety-orange">
                {article.title}
              </p>
              {excerpt && (
                <p className="line-clamp-2 text-sm leading-relaxed text-slate-500">
                  {excerpt}
                </p>
              )}
            </Link>
          );
        })}
      </div>
    </section>
  );
}

/** Pull a plain-text excerpt from the markdown content */
function getExcerpt(content: string): string {
  // Strip the leading title, then find first real paragraph
  const withoutTitle = content.replace(/^#\s+.+\n+/, "");
  const lines = withoutTitle.split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    // Skip headings, empty lines, list items
    if (!trimmed || trimmed.startsWith("#") || trimmed.startsWith("-")) continue;
    // Strip markdown formatting
    const plain = trimmed
      .replace(/\*\*(.+?)\*\*/g, "$1")
      .replace(/\*(.+?)\*/g, "$1")
      .replace(/\[(.+?)\]\(.+?\)/g, "$1")
      .replace(/`(.+?)`/g, "$1");
    if (plain.length > 40) return plain;
  }
  return "";
}
