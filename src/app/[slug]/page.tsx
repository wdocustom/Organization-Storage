import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";
import CTABlock from "@/components/CTABlock";
import ArticleJsonLd from "@/components/ArticleJsonLd";
import BreadcrumbJsonLd from "@/components/BreadcrumbJsonLd";
import RelatedArticles from "@/components/RelatedArticles";
import { SITE_URL } from "@/lib/constants";
import { cityToSlug } from "@/lib/cities";
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
    .select("title, category, target_city, published_at, content")
    .eq("slug", params.slug)
    .single();

  if (!article) return {};

  const description = article.target_city
    ? `${article.title} — Custom storage solutions in ${article.target_city}.`
    : article.title;

  const url = `${SITE_URL}/${params.slug}`;

  return {
    title: `${article.title} | Storage Network`,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: article.title,
      description,
      url,
      siteName: "Storage Network",
      type: "article",
      publishedTime: article.published_at,
    },
    twitter: {
      card: "summary",
      title: article.title,
      description,
    },
  };
}

export async function generateStaticParams() {
  const { data: articles } = await supabase.from("articles").select("slug");
  return (articles ?? []).map((a) => ({ slug: a.slug }));
}

function stripLeadingTitle(content: string): string {
  // Remove the first `# ...` heading if it exists (it duplicates the page <h1>)
  return content.replace(/^#\s+.+\n+/, "");
}

function splitContentWithCTA(content: string) {
  const cleaned = stripLeadingTitle(content);
  const lines = cleaned.split("\n");
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

  const breadcrumbs = [
    { name: "Home", href: "/" },
    ...(article.target_city
      ? [{ name: article.target_city, href: `/city/${cityToSlug(article.target_city)}` }]
      : []),
    { name: article.title },
  ];

  return (
    <>
      <ArticleJsonLd
        title={article.title}
        slug={article.slug}
        publishedAt={article.published_at}
        description={
          article.target_city
            ? `${article.title} — Custom storage solutions in ${article.target_city}.`
            : article.title
        }
      />
      <BreadcrumbJsonLd items={breadcrumbs} />

      {/* Hero header */}
      <header className="border-b border-slate-800 bg-gradient-to-b from-slate-900 to-black">
        <div className="mx-auto max-w-3xl px-4 pb-10 pt-8 sm:px-6">
          <nav aria-label="Breadcrumb" className="mb-8 text-sm text-slate-500">
            <ol className="flex flex-wrap items-center gap-1">
              <li>
                <a href="/" className="transition-colors hover:text-safety-orange">Home</a>
              </li>
              {article.target_city && (
                <>
                  <li><span className="mx-1 text-slate-700">/</span></li>
                  <li>
                    <a
                      href={`/city/${cityToSlug(article.target_city)}`}
                      className="transition-colors hover:text-safety-orange"
                    >
                      {article.target_city}
                    </a>
                  </li>
                </>
              )}
            </ol>
          </nav>

          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-safety-orange/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-safety-orange">
              {article.category.replace("-", " ")}
            </span>
            {article.target_city && (
              <span className="rounded-full border border-slate-700 px-3 py-1 text-xs font-medium text-slate-400">
                {article.target_city}
              </span>
            )}
          </div>

          <h1 className="mb-4 text-3xl font-black leading-tight text-white sm:text-4xl lg:text-5xl">
            {article.title}
          </h1>

          <time className="text-sm text-slate-500">
            {new Date(article.published_at).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </time>
        </div>
      </header>

      {/* Article body */}
      <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <div className="prose prose-lg prose-slate prose-invert max-w-none prose-headings:font-bold prose-headings:text-white prose-p:leading-relaxed prose-p:text-slate-300 prose-a:text-safety-orange prose-a:no-underline hover:prose-a:text-safety-yellow prose-strong:text-white prose-code:text-safety-yellow prose-li:text-slate-300">
          <div dangerouslySetInnerHTML={{ __html: markdownToHtml(firstHalf) }} />
        </div>

        <CTABlock category={article.category} />

        <div className="prose prose-lg prose-slate prose-invert max-w-none prose-headings:font-bold prose-headings:text-white prose-p:leading-relaxed prose-p:text-slate-300 prose-a:text-safety-orange prose-a:no-underline hover:prose-a:text-safety-yellow prose-strong:text-white prose-code:text-safety-yellow prose-li:text-slate-300">
          <div dangerouslySetInnerHTML={{ __html: markdownToHtml(secondHalf) }} />
        </div>

        <CTABlock category={article.category} />

        <RelatedArticles
          currentSlug={article.slug}
          category={article.category}
          targetCity={article.target_city}
        />
      </article>
    </>
  );
}

function markdownToHtml(md: string): string {
  const html = md
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
