import { createFileRoute } from "@tanstack/react-router";

import { MarketplaceDiscoveryPage } from "@/components/discovery/MarketplaceDiscoveryPage";

export const Route = createFileRoute("/verified-owners")({
  head: () => ({ meta: [{ title: "Verified Owners - Roomzly" }, { name: "description", content: "Browse listings from verified Roomzly owners." }] }),
  component: () => (
    <MarketplaceDiscoveryPage
      eyebrow="Verified owners"
      title="Homes from owners with reviewed identity signals."
      intro="Start with listings connected to owners and properties carrying Roomzly trust signals, then filter by type, price, beds, and amenities."
      seoDescription="Browse Roomzly listings from verified owners with trust indicators, filters, and property cards."
      baseParams={{ ownerVerified: true }}
      preset="verified"
      categoryName="Verified owner listings"
      highlights={["Verified badges", "Owner trust", "Report controls"]}
    />
  ),
});
