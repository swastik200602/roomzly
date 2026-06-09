import { createFileRoute } from "@tanstack/react-router";
import { InfoPage } from "@/components/static/InfoPage";

export const Route = createFileRoute("/privacy")({
  head: () => ({ meta: [{ title: "Privacy Policy - Roomzly" }, { name: "description", content: "How Roomzly handles account, listing, verification, and communication data." }] }),
  component: () => (
    <InfoPage
      eyebrow="Legal"
      title="Privacy Policy"
      intro="Roomzly collects only the information needed to operate property discovery, verification, communication, reporting, and account security."
      sections={[
        { title: "Account data", body: "We store profile, contact, role, authentication, wishlist, booking, chat, and notification data to provide the platform." },
        { title: "Verification data", body: "Identity and property documents are used only for trust review. Normal users cannot access raw document URLs." },
        { title: "Sharing", body: "We do not sell personal data. We share data only with service providers required for hosting, uploads, email, analytics, and security." },
        { title: "Choices", body: "Users may update profile data, remove saved properties, and contact Roomzly for privacy requests at support@roomzly.com." },
      ]}
    />
  ),
});
