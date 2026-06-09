import { createFileRoute } from "@tanstack/react-router";

import { SeoLandingPage } from "@/components/static/SeoLandingPage";

export const Route = createFileRoute("/pg-in-prem-nagar")({
  head: () => ({
    meta: [
      { title: "PG in Prem Nagar - Roomzly" },
      { name: "description", content: "Find PG and hostel stays in Prem Nagar with Roomzly location search and owner contact tools." },
      { property: "og:title", content: "PG in Prem Nagar - Roomzly" },
      { property: "og:description", content: "Browse PGs near Prem Nagar using location-aware Roomzly search." },
    ],
  }),
  component: () => (
    <SeoLandingPage
      eyebrow="Prem Nagar PGs"
      title="PG in Prem Nagar"
      intro="Explore PGs and managed stays in Prem Nagar with locality-aware search, owner contact actions, saved listings, and map-ready property locations."
      city="Prem Nagar, Dehradun"
      category="PG / Hostels"
      exploreTo="/explore?city=Dehradun&locality=Prem%20Nagar&cat=pg"
      highlights={[
        "Search focuses on Prem Nagar locality data instead of only matching text in a description.",
        "Useful for students and working professionals looking near colleges, offices, and transport links.",
        "Open property detail pages to view exact pins and Google Maps directions when coordinates are available.",
      ]}
    />
  ),
});
