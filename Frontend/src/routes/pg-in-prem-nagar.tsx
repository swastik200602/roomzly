import { createFileRoute } from "@tanstack/react-router";

import { SeoLandingPage } from "@/components/static/SeoLandingPage";

export const Route = createFileRoute("/pg-in-prem-nagar")({
  head: () => ({
    meta: [
      { title: "PG in Prem Nagar, Dehradun - Student PGs | Roomzly" },
      { name: "description", content: "Find PG in Prem Nagar, Dehradun near colleges and transport with photos, rent details, amenities, verified owner contact, and Roomzly chat." },
      { property: "og:title", content: "PG in Prem Nagar, Dehradun - Roomzly" },
      { property: "og:description", content: "Browse student PGs and hostels near Prem Nagar with locality-aware Roomzly search." },
    ],
  }),
  component: () => (
    <SeoLandingPage
      eyebrow="Prem Nagar PGs"
      title="PG in Prem Nagar"
      intro="Explore PGs, hostels, and managed stays in Prem Nagar, Dehradun with locality-aware search, owner contact actions, saved listings, amenities, and map-ready property locations."
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
