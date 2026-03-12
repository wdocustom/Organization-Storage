import Link from "next/link";
import { supabase } from "@/lib/supabase";
import ArticleCard from "@/components/ArticleCard";
import { TARGET_CITIES, cityToSlug } from "@/lib/cities";

export const revalidate = 3600;

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-dashed border-slate-800 py-16 text-center">
      <p className="text-slate-600">{message}</p>
    </div>
  );
}

export default async function HomePage() {
  // During build without env vars, skip DB queries
  const { data: articles } = process.env.NEXT_PUBLIC_SUPABASE_URL
    ? await supabase
        .from("articles")
        .select("slug, title, category, target_city, published_at")
        .order("published_at", { ascending: false })
        .limit(24)
    : { data: null };

  const installerGuides = (articles ?? []).filter(
    (a) => a.category === "local-guide"
  );
  const homeownerGuides = (articles ?? []).filter(
    (a) => a.category === "homeowner-guide"
  );

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

      {/* Homeowner Guides */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <h2 className="mb-2 text-2xl font-black text-white sm:text-3xl">
          Garage Organization for Homeowners
        </h2>
        <p className="mb-10 text-slate-500">
          Real talk about tote storage, hiring installers, and getting your
          garage back.
        </p>

        {homeownerGuides.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {homeownerGuides.map((article) => (
              <ArticleCard key={article.slug} article={article} />
            ))}
          </div>
        ) : (
          <EmptyState message="Homeowner guides coming soon." />
        )}
      </section>

      {/* Installer Guides */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="mb-10 border-t border-slate-800 pt-16">
          <h2 className="mb-2 text-2xl font-black text-white sm:text-3xl">
            Installer & Contractor Guides
          </h2>
          <p className="text-slate-500">
            Expert tips on storage builds, margin tracking, and local market
            strategies.
          </p>
        </div>

        {installerGuides.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {installerGuides.map((article) => (
              <ArticleCard key={article.slug} article={article} />
            ))}
          </div>
        ) : (
          <EmptyState message="Installer guides coming soon." />
        )}
      </section>

      {/* City Pages */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="mb-10 border-t border-slate-800 pt-16">
          <h2 className="mb-2 text-2xl font-black text-white sm:text-3xl">
            Browse by City
          </h2>
          <p className="text-slate-500">
            Custom garage storage guides for your area.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {TARGET_CITIES.map((city) => (
            <Link
              key={city}
              href={`/city/${cityToSlug(city)}`}
              className="rounded-lg border border-slate-800 bg-slate-900/50 px-4 py-3 text-center text-sm font-medium text-white transition-all hover:border-slate-700 hover:text-safety-orange"
            >
              {city}
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
