import { Link, useRouterState } from "@tanstack/react-router";

const COLS = [
  {
    title: "Discover",
    links: [
      { to: "/rooms-in-dehradun", label: "Rooms in Dehradun" },
      { to: "/pg-in-dehradun", label: "PG in Dehradun" },
      { to: "/pg-in-prem-nagar", label: "PG in Prem Nagar" },
      { to: "/flats-in-dehradun", label: "Flats in Dehradun" },
      { to: "/search-map", label: "Search Map" },
      { to: "/properties-in-uttarakhand", label: "Properties in Uttarakhand" },
    ],
  },
  {
    title: "Trust",
    links: [
      { to: "/verified-owners", label: "Verified Owners" },
      { to: "/premium-homes", label: "Premium Homes" },
      { to: "/pg-hostels", label: "PG / Hostels" },
    ],
  },
  {
    title: "Company",
    links: [
      { to: "/about", label: "Our Story" },
      { to: "/careers", label: "Careers" },
      { to: "/press", label: "Press" },
      { to: "/journal", label: "Journal" },
    ],
  },
  {
    title: "Legal",
    links: [
      { to: "/privacy", label: "Privacy" },
      { to: "/terms", label: "Terms" },
      { to: "/cookies", label: "Cookie Policy" },
      { to: "/security", label: "Security" },
    ],
  },
] as const;

export function Footer() {
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  if (pathname.startsWith("/dashboard") || pathname.startsWith("/auth")) return null;

  return (
    <footer className="border-t border-border py-16 mt-16 sm:py-20 sm:mt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-8 sm:gap-12">
        <div className="col-span-2 sm:col-span-3 md:col-span-2">
          <span className="font-display text-2xl font-bold tracking-tighter uppercase mb-4 block">
            Roomzly
          </span>
          <p className="text-muted-foreground text-sm max-w-xs leading-relaxed">
            Find rooms, PGs, flats, hostels, and rental properties with verified owner contact,
            private chat, photos, and booking tools.
          </p>
        </div>
        {COLS.map((c) => (
          <div key={c.title}>
            <h5 className="text-mono-eyebrow mb-4 sm:mb-6">{c.title}</h5>
            <ul className="space-y-2 sm:space-y-3 text-sm text-muted-foreground">
              {c.links.map((l, i) => (
                <li key={i}>
                  <Link to={l.to} preload={false} className="hover:text-foreground transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-12 sm:mt-20 pt-8 border-t border-border flex flex-col sm:flex-row justify-between items-center gap-4 text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
        <p>© 2026 Roomzly International Inc.</p>
        <div className="flex gap-6 sm:gap-8">
          <a href="https://www.instagram.com/" target="_blank" rel="noreferrer" className="hover:text-foreground">Instagram</a>
          <a href="https://www.linkedin.com/company/roomzly/" target="_blank" rel="noreferrer" className="hover:text-foreground">LinkedIn</a>
          <a href="https://x.com/" target="_blank" rel="noreferrer" className="hover:text-foreground">X / Twitter</a>
        </div>
      </div>
    </footer>
  );
}
