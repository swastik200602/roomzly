import { createFileRoute } from "@tanstack/react-router";

import { SeoLandingPage } from "@/components/static/SeoLandingPage";

export const Route = createFileRoute("/flats-in-dehradun")({
  head: () => ({
    meta: [
      { title: "Flats in Dehradun - Roomzly" },
      { name: "description", content: "Search flats in Dehradun on Roomzly with verified owners, galleries, filters, and direct contact actions." },
      { property: "og:title", content: "Flats in Dehradun - Roomzly" },
      { property: "og:description", content: "Discover flats in Dehradun with photos, filters, saved listings, and owner contact." },
    ],
  }),
  component: () => (
    <SeoLandingPage
      eyebrow="Apartments"
      title="Flats in Dehradun"
      intro="Search Dehradun flats with responsive galleries, useful filters, direct owner contact, and saved listings for a smoother rental search."
      city="Dehradun"
      category="Apartments and flats"
      exploreTo="/explore?city=Dehradun&cat=apartment"
      highlights={[
        "Browse apartments by price, bed count, furnishing, and amenities.",
        "Open listing galleries on mobile, tablet, and desktop without losing access to uploaded images.",
        "Contact owners from the property page using chat, phone, or WhatsApp when available.",
      ]}
    />
  ),
});
