import { createFileRoute } from "@tanstack/react-router";
import { InfoPage } from "@/components/static/InfoPage";

export const Route = createFileRoute("/press")({
  head: () => ({ meta: [{ title: "Roomzly Press" }, { name: "description", content: "Roomzly press and media information." }] }),
  component: () => (
    <InfoPage
      eyebrow="Press"
      title="A modern housing platform built around verification and direct owner contact."
      intro="Roomzly helps residents discover homes, PGs, and premium rentals with verification, chat, reporting, and owner workflows."
      sections={[
        { title: "Media contact", body: "For founder notes, screenshots, marketplace data, or product background, write to press@roomzly.com." },
        { title: "Positioning", body: "Roomzly sits between property discovery and trust operations: search, save, contact, verify, report, and moderate." },
        { title: "Assets", body: "Brand assets and product screenshots are available on request while the platform prepares for launch." },
      ]}
      cta={{ label: "Explore Roomzly", to: "/" }}
    />
  ),
});
