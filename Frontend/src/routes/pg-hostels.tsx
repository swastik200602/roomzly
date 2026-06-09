import { createFileRoute } from "@tanstack/react-router";

import { MarketplaceDiscoveryPage } from "@/components/discovery/MarketplaceDiscoveryPage";

export const Route = createFileRoute("/pg-hostels")({
  head: () => ({ meta: [{ title: "PG and Hostels - Roomzly" }, { name: "description", content: "Find PGs, hostels, and managed co-living spaces on Roomzly." }] }),
  component: () => (
    <MarketplaceDiscoveryPage
      eyebrow="PG / Hostels"
      title="Managed stays for students and working professionals."
      intro="Compare PGs, hostels, and managed co-living rooms with PG-specific amenities, owner contact, saved-property tools, and listing cards."
      seoDescription="Find PGs, hostels, and managed co-living spaces on Roomzly with filters and real listings."
      baseParams={{ cat: "pg" }}
      preset="pg"
      categoryName="PG / Hostels"
      highlights={["Meals", "Wifi", "Housekeeping"]}
    />
  ),
});
