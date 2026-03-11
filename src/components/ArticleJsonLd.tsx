import { SITE_URL } from "@/lib/constants";

interface ArticleJsonLdProps {
  title: string;
  slug: string;
  publishedAt: string;
  description: string;
}

export default function ArticleJsonLd({
  title,
  slug,
  publishedAt,
  description,
}: ArticleJsonLdProps) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description,
    url: `${SITE_URL}/${slug}`,
    datePublished: publishedAt,
    publisher: {
      "@type": "Organization",
      name: "Storage Network",
      url: "https://www.storage-network.app",
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
