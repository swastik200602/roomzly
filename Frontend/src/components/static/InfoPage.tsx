import { Link } from "@tanstack/react-router";

type InfoPageProps = {
  eyebrow: string;
  title: string;
  intro: string;
  sections: { title: string; body: string }[];
  cta?: { label: string; to: string };
};

export function InfoPage({ eyebrow, title, intro, sections, cta }: InfoPageProps) {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-14 sm:py-20 animate-fade-in">
      <header className="border-b border-border pb-8 sm:pb-10">
        <p className="text-mono-eyebrow mb-3">{eyebrow}</p>
        <h1 className="font-display text-4xl sm:text-6xl tracking-tighter font-bold max-w-4xl">{title}</h1>
        <p className="text-muted-foreground mt-5 max-w-2xl leading-relaxed">{intro}</p>
        {cta && (
          <Link
            to={cta.to}
            className="mt-7 inline-flex bg-foreground text-background px-5 py-2.5 text-sm font-semibold rounded-sm hover:opacity-80 transition-opacity"
          >
            {cta.label}
          </Link>
        )}
      </header>
      <div className="divide-y divide-border">
        {sections.map((section) => (
          <section key={section.title} className="grid gap-3 sm:grid-cols-[220px_1fr] py-7 sm:py-9">
            <h2 className="text-mono-eyebrow">{section.title}</h2>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">{section.body}</p>
          </section>
        ))}
      </div>
    </div>
  );
}

export function SeoJsonLd({ data }: { data: unknown }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}
