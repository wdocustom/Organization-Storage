import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";
import CTABlock from "@/components/CTABlock";
import type { Metadata } from "next";

export const revalidate = 3600;

interface ArticlePageProps {
  params: { slug: string };
}

export async function generateMetadata({
  params,
}: ArticlePageProps): Promise<Metadata> {
  const { data: article } = await supabase
    .from("articles")
    .select("title, category, target_city")
    .eq("slug", params.slug)
    .single();

  if (!article) return {};

  const description = article.target_city
    ? `${article.title} — Custom storage solutions in ${article.target_city}.`
    : article.title;

  return {
    title: `${article.title} | Storage Network`,
    description,
  };
}

export async function generateStaticParams() {
  const { data: articles } = await supabase.from("articles").select("slug");
  return (articles ?? []).map((a) => ({ slug: a.slug }));
}

function splitContentWithCTA(content: string) {
  const lines = content.split("\n");
  const mid = Math.floor(lines.length / 2);
  const firstHalf = lines.slice(0, mid).join("\n");
  const secondHalf = lines.slice(mid).join("\n");
  return { firstHalf, secondHalf };
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { data: article } = await supabase
    .from("articles")
    .select("*")
    .eq("slug", params.slug)
    .single();

  if (!article) notFound();

  const { firstHalf, secondHalf } = splitContentWithCTA(article.content);

  return (
    <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      {article.target_city && (
        <span className="mb-3 inline-block rounded-full border border-slate-700 bg-slate-800 px-3 py-1 text-xs font-medium uppercase tracking-wider text-safety-orange">
          {article.target_city}
        </span>
      )}

      <h1 className="mb-2 text-3xl font-black leading-tight text-white sm:text-4xl lg:text-5xl">
        {article.title}
      </h1>

      <div className="mb-8 flex items-center gap-3 text-sm text-slate-500">
        <span className="rounded bg-slate-800 px-2 py-0.5 text-xs font-medium uppercase text-slate-400">
          {article.category}
        </span>
        <time>
          {new Date(article.published_at).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </time>
      </div>

      <div className="prose prose-slate prose-invert max-w-none prose-headings:text-white prose-a:text-safety-orange prose-a:no-underline hover:prose-a:text-safety-yellow prose-strong:text-white prose-code:text-safety-yellow">
        <div dangerouslySetInnerHTML={{ __html: markdownToHtml(firstHalf) }} />
      </div>

      <CTABlock />

      <div className="prose prose-slate prose-invert max-w-none prose-headings:text-white prose-a:text-safety-orange prose-a:no-underline hover:prose-a:text-safety-yellow prose-strong:text-white prose-code:text-safety-yellow">
        <div dangerouslySetInnerHTML={{ __html: markdownToHtml(secondHalf) }} />
      </div>

      <CTABlock />
    </article>
  );
}

function markdownToHtml(md: string): string {
  let html = md
    // Headings
    .replace(/^#### (.+)$/gm, "<h4>$1</h4>")
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/^# (.+)$/gm, "<h1>$1</h1>")
    // Bold and italic
    .replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    // Inline code
    .replace(/`(.+?)`/g, "<code>$1</code>")
    // Links
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>')
    // Unordered lists
    .replace(/^\- (.+)$/gm, "<li>$1</li>")
    // Paragraphs: wrap non-tag lines
    .split("\n\n")
    .map((block) => {
      const trimmed = block.trim();
      if (!trimmed) return "";
      if (/^<[hulo]/.test(trimmed)) return trimmed;
      // Wrap list items
      if (trimmed.includes("<li>")) return `<ul>${trimmed}</ul>`;
      return `<p>${trimmed}</p>`;
    })
    .join("\n");

  return html;
}
