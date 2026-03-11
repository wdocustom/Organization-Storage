import Link from "next/link";

interface ArticleCardProps {
  article: {
    slug: string;
    title: string;
    category: string;
    target_city: string | null;
    published_at: string;
  };
}

export default function ArticleCard({ article }: ArticleCardProps) {
  return (
    <Link
      href={`/${article.slug}`}
      className="group rounded-lg border border-slate-800 bg-slate-900/50 p-6 transition-all hover:border-slate-700 hover:bg-slate-900"
    >
      <div className="mb-3 flex items-center gap-2">
        <span className="rounded bg-slate-800 px-2 py-0.5 text-xs font-medium uppercase text-slate-400">
          {article.category}
        </span>
        {article.target_city && (
          <span className="rounded bg-slate-800 px-2 py-0.5 text-xs font-medium text-safety-orange">
            {article.target_city}
          </span>
        )}
      </div>
      <h3 className="mb-2 text-lg font-bold text-white transition-colors group-hover:text-safety-orange">
        {article.title}
      </h3>
      <time className="text-sm text-slate-600">
        {new Date(article.published_at).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        })}
      </time>
    </Link>
  );
}
