import { createFileRoute } from "@tanstack/react-router";

import { MarketplaceDiscoveryPage } from "@/components/discovery/MarketplaceDiscoveryPage";

export const Route = createFileRoute("/premium-homes")({
  head: () => ({ meta: [{ title: "Premium Homes - Roomzly" }, { name: "description", content: "Browse premium homes and villas on Roomzly." }] }),
  component: () => (
    <MarketplaceDiscoveryPage
      eyebrow="Premium homes"
      title="Curated premium homes with stronger lifestyle signals."
      intro="Browse premium apartments, villas, and standout residences with elevated amenities, verified owner indicators, saved-property tools, and direct listing access."
      seoDescription="Browse premium homes on Roomzly with filters, verified owner indicators, and property cards linked to real listings."
      baseParams={{ premium: true }}
      preset="premium"
      categoryName="Premium homes"
      highlights={["Premium badges", "Owner trust signals", "Mapped listings"]}
    />
  ),
});
