import { createFileRoute } from "@tanstack/react-router";

import { SeoLandingPage } from "@/components/static/SeoLandingPage";

export const Route = createFileRoute("/flats-in-dehradun")({
  head: () => ({
    meta: [
      { title: "Flats in Dehradun for rent - Apartments | Roomzly" },
      { name: "description", content: "Browse flats and apartments for rent in Dehradun by budget, locality, bedrooms, amenities, photos, and verified owner contact on Roomzly." },
      { property: "og:title", content: "Flats in Dehradun for rent - Roomzly" },
      { property: "og:description", content: "Discover rental flats in Dehradun with photos, filters, saved listings, maps, and owner contact." },
    ],
  }),
  component: () => (
    <SeoLandingPage
      eyebrow="Apartments"
      title="Flats in Dehradun"
      intro="Search flats and apartments for rent in Dehradun with responsive galleries, useful filters, direct owner contact, maps, and saved listings for a smoother rental search."
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
