import { createFileRoute } from "@tanstack/react-router";
import { InfoPage } from "@/components/static/InfoPage";

export const Route = createFileRoute("/security")({
  head: () => ({ meta: [{ title: "Security Policy - Roomzly" }, { name: "description", content: "Roomzly security practices for verification, uploads, chat, and admin access." }] }),
  component: () => (
    <InfoPage
      eyebrow="Trust"
      title="Security Policy"
      intro="Roomzly is built around protected accounts, verified documents, role-based access, and moderation auditability."
      sections={[
        { title: "Access control", body: "Dashboard, owner, chat, verification, report, and admin routes use authenticated API checks." },
        { title: "Documents", body: "Verification document files are stored with provider-backed upload security and reviewed through admin-only signed URLs." },
        { title: "Reports", body: "Users can report suspicious listings. Admin decisions are logged for accountability." },
        { title: "Contact", body: "Report suspected vulnerabilities to security@roomzly.com with enough detail to reproduce the issue." },
      ]}
    />
  ),
});
