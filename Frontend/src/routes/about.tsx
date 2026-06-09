import { createFileRoute } from "@tanstack/react-router";
import { InfoPage } from "@/components/static/InfoPage";

export const Route = createFileRoute("/about")({
  head: () => ({ meta: [{ title: "About Roomzly" }, { name: "description", content: "Roomzly helps people discover verified homes, PGs, and premium rentals with trusted owners." }] }),
  component: () => (
    <InfoPage
      eyebrow="Company"
      title="Roomzly is building a trust-first home discovery platform."
      intro="We connect residents with verified owners, clear listings, secure conversations, and marketplace workflows that make finding a home less uncertain."
      sections={[
        { title: "Mission", body: "Make rental and housing discovery transparent, fast, and accountable for residents, owners, and property managers." },
        { title: "Trust", body: "Owner verification, property verification, saved listings, reports, and admin moderation are built into the platform rather than bolted on later." },
        { title: "Experience", body: "Roomzly prioritizes practical discovery: search, compare, contact, save, chat, and request bookings from one coherent interface." },
      ]}
      cta={{ label: "Explore properties", to: "/explore" }}
    />
  ),
});
