import { createFileRoute } from "@tanstack/react-router";

import { SeoLandingPage } from "@/components/static/SeoLandingPage";

export const Route = createFileRoute("/pg-in-dehradun")({
  head: () => ({
    meta: [
      { title: "PG in Dehradun - Roomzly" },
      { name: "description", content: "Explore PG and hostel stays in Dehradun with owner contact, amenities, and verified listing signals." },
      { property: "og:title", content: "PG in Dehradun - Roomzly" },
      { property: "og:description", content: "Find PGs and hostels in Dehradun using Roomzly search and trusted contact tools." },
    ],
  }),
  component: () => (
    <SeoLandingPage
      eyebrow="Managed stays"
      title="PG in Dehradun"
      intro="Browse PGs, hostels, and managed stays in Dehradun with clear pricing, amenities, photos, and contact actions built for quick decisions."
      city="Dehradun"
      category="PG / Hostels"
      exploreTo="/explore?city=Dehradun&cat=pg"
      highlights={[
        "Filter for PG and hostel listings without leaving the main search experience.",
        "Save shortlisted stays and compare details before contacting the owner.",
        "Report suspicious listings directly so moderation can review them.",
      ]}
    />
  ),
});
