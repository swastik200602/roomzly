import { MarketplaceDiscoveryPage } from "@/components/discovery/MarketplaceDiscoveryPage";
import type { PropertyListParams } from "@/lib/api/properties";

type SeoLandingPageProps = {
  eyebrow: string;
  title: string;
  intro: string;
  city: string;
  category: string;
  exploreTo: string;
  highlights: string[];
  params?: PropertyListParams;
};

function paramsFromExploreTo(exploreTo: string): PropertyListParams {
  const query = exploreTo.split("?")[1] ?? "";
  const search = new URLSearchParams(query);
  return {
    q: search.get("q") ?? undefined,
    city: search.get("city") ?? undefined,
    locality: search.get("locality") ?? undefined,
    state: search.get("state") ?? undefined,
    country: search.get("country") ?? undefined,
    cat: search.get("cat") ?? undefined,
  };
}

export function SeoLandingPage({ eyebrow, title, intro, city, category, exploreTo, highlights, params }: SeoLandingPageProps) {
  return (
    <MarketplaceDiscoveryPage
      eyebrow={eyebrow}
      title={title}
      intro={intro}
      seoDescription={intro}
      baseParams={params ?? paramsFromExploreTo(exploreTo)}
      preset="location"
      locationName={city}
      categoryName={category}
      highlights={highlights}
    />
  );
}
