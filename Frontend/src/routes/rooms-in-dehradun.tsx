import { createFileRoute } from "@tanstack/react-router";

import { SeoLandingPage } from "@/components/static/SeoLandingPage";

export const Route = createFileRoute("/rooms-in-dehradun")({
  head: () => ({
    meta: [
      { title: "Rooms in Dehradun - Roomzly" },
      { name: "description", content: "Find rooms in Dehradun with verified owners, saved listings, chat, and direct contact on Roomzly." },
      { property: "og:title", content: "Rooms in Dehradun - Roomzly" },
      { property: "og:description", content: "Browse rooms in Dehradun with trusted owner contact and clear listing details." },
    ],
  }),
  component: () => (
    <SeoLandingPage
      eyebrow="Dehradun rentals"
      title="Rooms in Dehradun"
      intro="Find practical rooms across Dehradun with listing photos, owner chat, saved-property tools, and details that help you shortlist faster."
      city="Dehradun"
      category="Rooms and shared stays"
      exploreTo="/explore?city=Dehradun"
      highlights={[
        "Shortlist by location, price, beds, furnishing, and amenities from the existing Roomzly search flow.",
        "Use chat, phone, WhatsApp, sharing, and saved properties from each listing detail page.",
        "Prioritize owners and listings with verification badges when trust matters most.",
      ]}
    />
  ),
});
