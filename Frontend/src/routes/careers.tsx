import { createFileRoute } from "@tanstack/react-router";
import { InfoPage } from "@/components/static/InfoPage";

export const Route = createFileRoute("/careers")({
  head: () => ({ meta: [{ title: "Careers at Roomzly" }, { name: "description", content: "Work with Roomzly on trust-first housing discovery." }] }),
  component: () => (
    <InfoPage
      eyebrow="Careers"
      title="Build the housing marketplace people can actually trust."
      intro="Roomzly is early-stage and focused. We are looking for people who care about product quality, marketplace trust, and user empathy."
      sections={[
        { title: "Open roles", body: "We are not listing open roles publicly yet. Send a short note and portfolio to careers@roomzly.com." },
        { title: "Functions", body: "Product engineering, marketplace operations, owner onboarding, trust and safety, and city growth." },
        { title: "Culture", body: "Small team, high ownership, practical execution, and respect for the complexity of finding a real home." },
      ]}
      cta={{ label: "Contact us", to: "/contact" }}
    />
  ),
});
