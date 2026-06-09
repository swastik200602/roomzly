import { createFileRoute } from "@tanstack/react-router";

import { SeoLandingPage } from "@/components/static/SeoLandingPage";

export const Route = createFileRoute("/properties-in-uttarakhand")({
  head: () => ({
    meta: [
      { title: "Properties in Uttarakhand - Roomzly" },
      { name: "description", content: "Find rental properties in Uttarakhand with Roomzly search, verified owners, saved properties, and contact tools." },
      { property: "og:title", content: "Properties in Uttarakhand - Roomzly" },
      { property: "og:description", content: "Explore homes, PGs, and apartments in Uttarakhand with Roomzly." },
    ],
  }),
  component: () => (
    <SeoLandingPage
      eyebrow="Uttarakhand discovery"
      title="Properties in Uttarakhand"
      intro="Explore rooms, PGs, apartments, studios, and premium homes across Uttarakhand using Roomzly's search, verification, and contact experience."
      city="Uttarakhand"
      category="All property types"
      exploreTo="/explore"
      highlights={[
        "Start broad, then narrow results with city, category, price, and amenity filters.",
        "Use verified owner and premium home pages when trust or quality signals are important.",
        "Share listings with family or roommates and keep saved properties in one place.",
      ]}
    />
  ),
});
