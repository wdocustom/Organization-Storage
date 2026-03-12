import { notFound } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import ArticleCard from "@/components/ArticleCard";
import BreadcrumbJsonLd from "@/components/BreadcrumbJsonLd";
import { TARGET_CITIES, cityToSlug, slugToCity } from "@/lib/cities";
import { SITE_URL } from "@/lib/constants";
import type { Metadata } from "next";

export const revalidate = 3600;

interface CityPageProps {
  params: { city: string };
}

export async function generateMetadata({
  params,
}: CityPageProps): Promise<Metadata> {
  const city = slugToCity(params.city);
  if (!city) return {};

  const title = `Custom Garage Storage in ${city} | Storage Network`;
  const description = `Find guides on garage tote shelving, custom storage installations, and local installers in ${city}.`;

  return {
    title,
    description,
    alternates: { canonical: `${SITE_URL}/city/${params.city}` },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/city/${params.city}`,
      siteName: "Storage Network",
      type: "website",
    },
  };
}

export function generateStaticParams() {
  return TARGET_CITIES.map((city) => ({ city: cityToSlug(city) }));
}

export default async function CityPage({ params }: CityPageProps) {
  const city = slugToCity(params.city);
  if (!city) notFound();

  const { data: articles } = process.env.NEXT_PUBLIC_SUPABASE_URL
    ? await supabase
        .from("articles")
        .select("slug, title, category, target_city, published_at")
        .eq("target_city", city)
        .order("published_at", { ascending: false })
    : { data: null };

  const homeownerGuides = (articles ?? []).filter(
    (a) => a.category === "homeowner-guide"
  );
  const installerGuides = (articles ?? []).filter(
    (a) => a.category === "local-guide"
  );

  const breadcrumbs = [
    { name: "Home", href: "/" },
    { name: city },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <BreadcrumbJsonLd items={breadcrumbs} />

      <nav aria-label="Breadcrumb" className="mb-6 text-sm text-slate-500">
        <ol className="flex items-center gap-1">
          <li>
            <Link href="/" className="hover:text-safety-orange">
              Home
            </Link>
          </li>
          <li>
            <span className="mx-1">/</span>
          </li>
          <li className="text-slate-400">{city}</li>
        </ol>
      </nav>

      <h1 className="mb-3 text-3xl font-black text-white sm:text-4xl lg:text-5xl">
        Garage Storage in {city}
      </h1>
      <p className="mb-12 max-w-2xl text-lg text-slate-400">
        Everything you need to know about custom tote shelving and garage
        organization in {city} — whether you&apos;re a homeowner or an
        installer.
      </p>

      {homeownerGuides.length > 0 && (
        <section className="mb-16">
          <h2 className="mb-6 text-xl font-bold text-white">
            For Homeowners
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {homeownerGuides.map((article) => (
              <ArticleCard key={article.slug} article={article} />
            ))}
          </div>
        </section>
      )}

      {installerGuides.length > 0 && (
        <section className="mb-16">
          <h2 className="mb-6 text-xl font-bold text-white">
            For Installers & Contractors
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {installerGuides.map((article) => (
              <ArticleCard key={article.slug} article={article} />
            ))}
          </div>
        </section>
      )}

      {(articles ?? []).length === 0 && (
        <div className="rounded-lg border border-dashed border-slate-800 py-16 text-center">
          <p className="text-slate-600">
            Guides for {city} are coming soon.
          </p>
        </div>
      )}
    </div>
  );
}
