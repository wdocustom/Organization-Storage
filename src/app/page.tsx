import Link from "next/link";
import { supabase } from "@/lib/supabase";

export const revalidate = 3600;

export default async function HomePage() {
  const { data: articles } = await supabase
    .from("articles")
    .select("slug, title, category, target_city, published_at")
    .order("published_at", { ascending: false })
    .limit(12);

  return (
    <>
      {/* Hero */}
      <section className="border-b border-slate-800 bg-black">
        <div className="mx-auto max-w-7xl px-4 py-20 text-center sm:px-6 sm:py-28">
          <span className="mb-4 inline-block rounded-full border border-slate-700 bg-slate-900 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-safety-orange">
            Built for Custom Shelving Installers
          </span>
          <h1 className="mx-auto mb-6 max-w-4xl text-4xl font-black leading-tight text-white sm:text-5xl lg:text-6xl">
            Stop Guessing. Start Building with{" "}
            <span className="text-safety-orange">Precision.</span>
          </h1>
          <p className="mx-auto mb-8 max-w-2xl text-lg text-slate-400 sm:text-xl">
            Auto-generate cut-lists, 3D storage models, and material estimates
            in seconds. The only tool built specifically for custom shelving
            professionals.
          </p>
          <a
            href="https://www.storage-network.app"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block rounded-md bg-safety-orange px-8 py-4 text-lg font-bold uppercase tracking-wide text-black shadow-lg shadow-safety-orange/25 transition-all hover:bg-safety-yellow hover:shadow-safety-yellow/30"
          >
            Generate Your First Cut-List Free
          </a>
        </div>
      </section>

      {/* Articles Grid */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <h2 className="mb-2 text-2xl font-black text-white sm:text-3xl">
          Latest Guides & Resources
        </h2>
        <p className="mb-10 text-slate-500">
          Expert tips on storage builds, margin tracking, and local market
          strategies.
        </p>

        {articles && articles.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {articles.map((article) => (
              <Link
                key={article.slug}
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
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-slate-800 py-20 text-center">
            <p className="text-slate-600">
              No articles yet. Content coming soon.
            </p>
          </div>
        )}
      </section>
    </>
  );
}
