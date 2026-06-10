import { createFileRoute } from "@tanstack/react-router";

import { SeoLandingPage } from "@/components/static/SeoLandingPage";

export const Route = createFileRoute("/pg-in-dehradun")({
  head: () => ({
    meta: [
      { title: "PG in Dehradun - Hostels and managed stays | Roomzly" },
      { name: "description", content: "Search PG in Dehradun for students and working professionals with meals, WiFi, laundry, security, photos, and verified owner contact." },
      { property: "og:title", content: "PG in Dehradun - Roomzly" },
      { property: "og:description", content: "Find PGs and hostels in Dehradun with meals, WiFi, photos, rent details, and trusted contact tools." },
    ],
  }),
  component: () => (
    <SeoLandingPage
      eyebrow="Managed stays"
      title="PG in Dehradun"
      intro="Browse PGs, hostels, and managed stays in Dehradun for students and working professionals with clear pricing, meals, WiFi, laundry, security, photos, and contact actions built for quick decisions."
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
