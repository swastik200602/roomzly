import { createFileRoute, Link } from "@tanstack/react-router";

import { MarketplaceDiscoveryPage } from "@/components/discovery/MarketplaceDiscoveryPage";
import { collegeBySlug } from "@/lib/college-discovery";

export const Route = createFileRoute("/colleges/$collegeSlug")({
  head: () => ({
    meta: [
      { title: "College housing - Roomzly" },
      {
        name: "description",
        content: "Browse verified rooms, PGs, flats, and student stays near major Dehradun colleges on Roomzly.",
      },
    ],
  }),
  component: CollegeDiscoveryPage,
});

function CollegeDiscoveryPage() {
  const { collegeSlug } = Route.useParams();
  const college = collegeBySlug(collegeSlug);

  if (!college) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-20 text-center">
        <p className="text-mono-eyebrow mb-3">College not found</p>
        <h1 className="font-display text-3xl tracking-tight">That college page is not available yet.</h1>
        <p className="mt-4 text-sm text-muted-foreground">
          Try the full explore page to browse verified student listings across Dehradun.
        </p>
        <Link
          to="/explore"
          className="mt-8 inline-flex bg-foreground px-5 py-3 text-sm font-semibold text-background transition-opacity hover:opacity-80"
        >
          Open explore
        </Link>
      </div>
    );
  }

  return (
    <MarketplaceDiscoveryPage
      eyebrow={`${college.shortName} housing`}
      title={`Rooms, PGs, and student stays near ${college.shortName}`}
      intro={`Browse verified listings around ${college.areaName}, compare trust signals, and see which rooms and PGs are closest to ${college.name}.`}
      seoDescription={`Find verified rooms, PGs, flats, and student rentals near ${college.name} in Dehradun on Roomzly.`}
      baseParams={{ collegeSlug: college.slug, verified: true }}
      preset="location"
      locationName={`${college.areaName}, ${college.city}`}
      categoryName={`Student rentals near ${college.shortName}`}
      highlights={[
        `${college.areaName} access`,
        "Verified owner signals",
        "Campus distance on cards",
      ]}
    />
  );
}
