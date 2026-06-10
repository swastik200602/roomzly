import { createFileRoute } from "@tanstack/react-router";

import { SeoLandingPage } from "@/components/static/SeoLandingPage";

export const Route = createFileRoute("/rooms-in-dehradun")({
  head: () => ({
    meta: [
      { title: "Rooms in Dehradun - Roomzly" },
      { name: "description", content: "Find rooms for rent in Dehradun with verified owner contact, photos, pricing, WhatsApp, private chat, and booking request tools on Roomzly." },
      { property: "og:title", content: "Rooms in Dehradun for rent - Roomzly" },
      { property: "og:description", content: "Browse rooms in Dehradun with photos, rent details, trusted owner contact, and Roomzly private chat." },
    ],
  }),
  component: () => (
    <SeoLandingPage
      eyebrow="Dehradun rentals"
      title="Rooms in Dehradun"
      intro="Find rooms for rent across Dehradun with listing photos, rent details, owner chat, WhatsApp contact, saved-property tools, and verification signals that help you shortlist faster."
      city="Dehradun"
      category="Rooms and shared stays"
      exploreTo="/explore?city=Dehradun"
      highlights={[
        "Shortlist rooms in Dehradun by locality, monthly rent, beds, furnishing, and amenities.",
        "Use chat, phone, WhatsApp, sharing, and saved properties from each listing detail page.",
        "Prioritize owners and listings with verification badges when trust matters most.",
      ]}
    />
  ),
});
