import { createFileRoute } from "@tanstack/react-router";
import { Mail, Phone } from "lucide-react";

export const Route = createFileRoute("/contact")({
  head: () => ({ meta: [{ title: "Contact Roomzly" }, { name: "description", content: "Contact Roomzly for support, partnerships, press, and owner onboarding." }] }),
  component: ContactPage,
});

function ContactPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-14 sm:py-20 animate-fade-in">
      <p className="text-mono-eyebrow mb-3">Contact</p>
      <h1 className="font-display text-4xl sm:text-6xl tracking-tighter font-bold">Talk to Roomzly</h1>
      <p className="text-muted-foreground mt-5 max-w-2xl">For support, owner onboarding, partnerships, or press requests, reach the Roomzly team directly.</p>
      <div className="grid gap-px bg-border border border-border mt-10 sm:grid-cols-2">
        <a href="mailto:support@roomzly.com" className="bg-background p-6 hover:bg-surface-hi transition-colors">
          <Mail className="size-5 mb-4" />
          <p className="font-medium">support@roomzly.com</p>
          <p className="text-sm text-muted-foreground mt-2">User support and account help.</p>
        </a>
        <a href="tel:+919876510000" className="bg-background p-6 hover:bg-surface-hi transition-colors">
          <Phone className="size-5 mb-4" />
          <p className="font-medium">+91 98765 10000</p>
          <p className="text-sm text-muted-foreground mt-2">Owner onboarding and marketplace inquiries.</p>
        </a>
      </div>
    </div>
  );
}
