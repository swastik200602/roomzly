import { createFileRoute } from "@tanstack/react-router";
import { InfoPage } from "@/components/static/InfoPage";

export const Route = createFileRoute("/terms")({
  head: () => ({ meta: [{ title: "Terms and Conditions - Roomzly" }, { name: "description", content: "Roomzly platform terms for residents, owners, and admins." }] }),
  component: () => (
    <InfoPage
      eyebrow="Legal"
      title="Terms and Conditions"
      intro="These terms describe how residents, owners, and property managers may use Roomzly during launch."
      sections={[
        { title: "Marketplace", body: "Roomzly provides discovery, communication, verification, and reporting tools. Listings remain the responsibility of owners." },
        { title: "Users", body: "Users must provide accurate information, avoid fraud, and use chat/reporting systems responsibly." },
        { title: "Owners", body: "Owners must keep pricing, availability, ownership details, documents, and contact details accurate." },
        { title: "Moderation", body: "Roomzly may hide listings, restrict accounts, review documents, and resolve reports to protect marketplace trust." },
      ]}
    />
  ),
});
