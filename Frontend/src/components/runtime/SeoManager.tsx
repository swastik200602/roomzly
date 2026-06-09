import { useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";

const SITE_URL = "https://roomzly.in";
const SITE_NAME = "Roomzly";
const DEFAULT_TITLE = "Roomzly - Verified homes, PGs, and rentals";
const DEFAULT_DESCRIPTION =
  "Roomzly helps you discover verified rooms, PGs, apartments, villas, and premium rentals with trusted owner contact.";
const DEFAULT_IMAGE = `${SITE_URL}/og-image.svg`;

const PAGE_SEO: Record<string, { title: string; description: string }> = {
  "/": {
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
  },
  "/explore": {
    title: "Explore verified properties - Roomzly",
    description: "Browse verified rooms, PGs, apartments, villas, and commercial rentals on Roomzly.",
  },
  "/rooms-in-dehradun": {
    title: "Rooms in Dehradun - Roomzly",
    description: "Find verified rooms for rent in Dehradun with owner contact, booking requests, and Roomzly chat.",
  },
  "/pg-in-dehradun": {
    title: "PG in Dehradun - Roomzly",
    description: "Discover verified PGs and managed hostels in Dehradun for students and working professionals.",
  },
  "/pg-in-prem-nagar": {
    title: "PG in Prem Nagar - Roomzly",
    description: "Find PG accommodation in Prem Nagar, Dehradun with verified owners and practical rental details.",
  },
  "/flats-in-dehradun": {
    title: "Flats in Dehradun - Roomzly",
    description: "Browse verified flats and apartments for rent in Dehradun across budgets and neighborhoods.",
  },
  "/properties-in-uttarakhand": {
    title: "Properties in Uttarakhand - Roomzly",
    description: "Explore verified rooms, PGs, flats, villas, and rental properties across Uttarakhand.",
  },
  "/verified-owners": {
    title: "Verified Owners - Roomzly",
    description: "Browse Roomzly listings backed by owner verification and trust-focused marketplace tools.",
  },
  "/premium-homes": {
    title: "Premium Homes - Roomzly",
    description: "Explore premium homes, apartments, and villas listed on Roomzly.",
  },
  "/pg-hostels": {
    title: "PG and Hostels - Roomzly",
    description: "Find PGs, hostels, and managed co-living spaces with Roomzly.",
  },
  "/search-map": {
    title: "Search Map - Roomzly",
    description: "Explore Roomzly properties on an interactive map.",
  },
  "/about": {
    title: "About Roomzly",
    description: "Roomzly helps people discover verified homes, PGs, and premium rentals with trusted owners.",
  },
  "/contact": {
    title: "Contact Roomzly",
    description: "Contact Roomzly for support, partnerships, press, and owner onboarding.",
  },
  "/journal": {
    title: "Roomzly Journal",
    description: "Roomzly articles about rentals, PGs, verification, and housing search.",
  },
  "/security": {
    title: "Security Policy - Roomzly",
    description: "Roomzly security practices for verification, uploads, chat, and admin access.",
  },
  "/privacy": {
    title: "Privacy Policy - Roomzly",
    description: "How Roomzly handles account, listing, verification, and communication data.",
  },
  "/terms": {
    title: "Terms and Conditions - Roomzly",
    description: "Roomzly platform terms for residents, owners, and admins.",
  },
  "/cookies": {
    title: "Cookie Policy - Roomzly",
    description: "Roomzly cookie and session policy.",
  },
};

function setMeta(selector: string, attribute: "content" | "href", value: string) {
  const element = document.querySelector<HTMLMetaElement | HTMLLinkElement>(selector);
  if (element) element.setAttribute(attribute, value);
}

function routeSeo(pathname: string) {
  if (pathname.startsWith("/listing/")) {
    return {
      title: "Property listing - Roomzly",
      description: "View Roomzly property details, owner contact options, booking requests, amenities, and location.",
    };
  }

  if (pathname.startsWith("/auth/") || pathname.startsWith("/dashboard")) {
    return {
      title: "Roomzly",
      description: DEFAULT_DESCRIPTION,
      noindex: true,
    };
  }

  return PAGE_SEO[pathname] ?? {
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
  };
}

export function SeoManager() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  useEffect(() => {
    const seo = routeSeo(pathname);
    const canonical = `${SITE_URL}${pathname === "/" ? "/" : pathname}`;

    document.title = seo.title;
    setMeta('meta[name="description"]', "content", seo.description);
    setMeta('meta[property="og:title"]', "content", seo.title);
    setMeta('meta[property="og:description"]', "content", seo.description);
    setMeta('meta[property="og:url"]', "content", canonical);
    setMeta('meta[property="og:image"]', "content", DEFAULT_IMAGE);
    setMeta('meta[name="twitter:title"]', "content", seo.title);
    setMeta('meta[name="twitter:description"]', "content", seo.description);
    setMeta('meta[name="twitter:image"]', "content", DEFAULT_IMAGE);
    setMeta('link[rel="canonical"]', "href", canonical);

    const robots = document.querySelector<HTMLMetaElement>('meta[name="robots"]');
    if (seo.noindex) {
      if (robots) {
        robots.content = "noindex,nofollow";
      } else {
        const tag = document.createElement("meta");
        tag.name = "robots";
        tag.content = "noindex,nofollow";
        document.head.appendChild(tag);
      }
    } else {
      robots?.remove();
    }
  }, [pathname]);

  return null;
}

export function OrganizationJsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/favicon-512.png`,
    sameAs: [SITE_URL],
  };

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}
