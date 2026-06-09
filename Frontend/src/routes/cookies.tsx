import { createFileRoute } from "@tanstack/react-router";
import { InfoPage } from "@/components/static/InfoPage";

export const Route = createFileRoute("/cookies")({
  head: () => ({ meta: [{ title: "Cookie Policy - Roomzly" }, { name: "description", content: "Roomzly cookie and session policy." }] }),
  component: () => (
    <InfoPage
      eyebrow="Legal"
      title="Cookie Policy"
      intro="Roomzly uses cookies and browser storage for authentication, preferences, saved properties, and platform security."
      sections={[
        { title: "Essential cookies", body: "Refresh session cookies keep users signed in securely and are required for authenticated areas." },
        { title: "Local storage", body: "Wishlist and comparison preferences may be stored locally to keep the browsing experience fast." },
        { title: "Analytics", body: "Production analytics should be configured to measure platform usage while respecting privacy controls." },
      ]}
    />
  ),
});
