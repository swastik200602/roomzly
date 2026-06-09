import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/journal")({
  head: () => ({ meta: [{ title: "Roomzly Journal" }, { name: "description", content: "Roomzly articles about rentals, PGs, verification, and housing search." }] }),
  component: JournalPage,
});

const posts = [
  { title: "How to verify a rental owner before paying a token", href: "/security", body: "A practical checklist for avoiding fake listings and rushed payments." },
  { title: "PG or flat: choosing the right first home", href: "/pg-in-dehradun", body: "Compare convenience, privacy, cost, and flexibility before you move." },
  { title: "What makes a property listing trustworthy", href: "/verified-owners", body: "Photos, documents, owner identity, reviews, and responsive communication." },
];

function JournalPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14 sm:py-20 animate-fade-in">
      <p className="text-mono-eyebrow mb-3">Journal</p>
      <h1 className="font-display text-4xl sm:text-6xl tracking-tighter font-bold">Guides for finding a better home.</h1>
      <div className="grid md:grid-cols-3 gap-px bg-border border border-border mt-10">
        {posts.map((post) => (
          <Link key={post.title} to={post.href} className="bg-background p-6 hover:bg-surface-hi transition-colors">
            <h2 className="font-display text-xl tracking-tight">{post.title}</h2>
            <p className="text-sm text-muted-foreground mt-3 leading-relaxed">{post.body}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
