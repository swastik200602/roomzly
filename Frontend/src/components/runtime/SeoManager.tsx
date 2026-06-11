import { useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";

const SITE_URL = "https://roomzly.in";
const SITE_NAME = "Roomzly";
const DEFAULT_TITLE = "Roomzly - Student rooms and PGs near colleges in Dehradun";
const DEFAULT_DESCRIPTION =
  "Find verified rooms, PGs, flats, and student rentals near UPES, Graphic Era, DIT, JBIT, BFIT, DBS, and Tula's Institute on Roomzly.";
const DEFAULT_IMAGE = `${SITE_URL}/og-image.svg`;

type SeoConfig = {
  title: string;
  description: string;
  noindex?: boolean;
};

const PAGE_SEO: Record<string, SeoConfig> = {
  "/": {
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
  },
  "/explore": {
    title: "Explore student rentals near Dehradun colleges - Roomzly",
    description: "Browse verified rooms, PGs, flats, and student-friendly rentals by college, locality, budget, and trust signals on Roomzly.",
  },
  "/rooms-in-dehradun": {
    title: "Rooms in Dehradun for rent - Verified rooms | Roomzly",
    description: "Find rooms for rent in Dehradun with verified owner contact, photos, pricing, WhatsApp, private chat, and booking request tools on Roomzly.",
  },
  "/pg-in-dehradun": {
    title: "PG in Dehradun - Hostels and managed stays | Roomzly",
    description: "Search PG in Dehradun for students and working professionals with meals, WiFi, laundry, security, photos, and verified owner contact.",
  },
  "/pg-in-prem-nagar": {
    title: "PG in Prem Nagar, Dehradun - Student PGs | Roomzly",
    description: "Find PG accommodation in Prem Nagar, Dehradun near colleges and transport with photos, pricing, amenities, and owner contact.",
  },
  "/flats-in-dehradun": {
    title: "Flats in Dehradun for rent - Apartments | Roomzly",
    description: "Browse flats and apartments for rent in Dehradun by budget, locality, bedrooms, amenities, photos, and verified owner contact.",
  },
  "/properties-in-uttarakhand": {
    title: "Rental properties in Uttarakhand - Roomzly",
    description: "Explore rooms, PGs, flats, villas, and rental properties across Uttarakhand with search filters and trusted owner contact.",
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

function routeSeo(pathname: string): SeoConfig {
  if (pathname.startsWith("/colleges/")) {
    const slug = pathname.split("/")[2] ?? "";
    const readable = slug
      .split("-")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
    return {
      title: `Rooms and PGs near ${readable} - Roomzly`,
      description: `Browse verified rooms, PGs, flats, and student stays near ${readable} with campus-aware discovery and trust signals on Roomzly.`,
    };
  }

  if (pathname.startsWith("/listing/")) {
    return {
      title: "Property listing - Roomzly",
      description: "View Roomzly property details with photos, rent, amenities, owner contact, private chat, booking requests, and location.",
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
  const data = [
    {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/favicon-512.png`,
      image: `${SITE_URL}/favicon-512.png`,
      sameAs: ["https://www.linkedin.com/company/roomzly/"],
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: SITE_NAME,
      alternateName: ["Roomzly India", "Roomzly Rentals", "Roomzly Dehradun"],
      url: SITE_URL,
      potentialAction: {
        "@type": "SearchAction",
        target: `${SITE_URL}/explore?q={search_term_string}`,
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: "Roomzly important pages",
      itemListElement: [
        { "@type": "SiteNavigationElement", position: 1, name: "Rooms in Dehradun", url: `${SITE_URL}/rooms-in-dehradun` },
        { "@type": "SiteNavigationElement", position: 2, name: "PG in Dehradun", url: `${SITE_URL}/pg-in-dehradun` },
        { "@type": "SiteNavigationElement", position: 3, name: "Rooms near UPES", url: `${SITE_URL}/colleges/upes` },
        { "@type": "SiteNavigationElement", position: 4, name: "PG in Prem Nagar", url: `${SITE_URL}/pg-in-prem-nagar` },
        { "@type": "SiteNavigationElement", position: 5, name: "Explore Properties", url: `${SITE_URL}/explore` },
      ],
    },
  ];

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}
