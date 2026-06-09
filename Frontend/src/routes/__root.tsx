import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
} from "@tanstack/react-router";
import { useEffect } from "react";

import { reportError } from "../lib/error-reporting";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { Toaster } from "@/components/ui/sonner";
import { AuthBootstrap } from "@/components/auth/AuthBootstrap";
import { InteractionRecovery } from "@/components/runtime/InteractionRecovery";
import { RealtimeBridge } from "@/components/runtime/RealtimeBridge";
import { OrganizationJsonLd, SeoManager } from "@/components/runtime/SeoManager";

function NotFoundComponent() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <p className="text-mono-eyebrow mb-4">Error 404</p>
        <h1 className="font-display text-7xl font-bold tracking-tighter text-foreground">
          NOT FOUND
        </h1>
        <p className="mt-4 text-sm text-muted-foreground">
          This address doesn't exist in the Roomzly index.
        </p>
        <div className="mt-8">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-sm bg-foreground text-background px-5 py-2.5 text-sm font-semibold transition-opacity hover:opacity-80"
          >
            Return home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportError(error, { boundary: "root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <p className="text-mono-eyebrow mb-4">Unexpected error</p>
        <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. Try refreshing or head home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-sm bg-foreground text-background px-4 py-2 text-sm font-medium transition-opacity hover:opacity-80"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-sm border border-border bg-transparent px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-surface-hi"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Roomzly — Premium real estate, considered" },
      {
        name: "description",
        content:
          "Roomzly is a curated real estate ecosystem connecting verified spaces with discerning residents. Rent, buy, and discover apartments, villas, PGs, and commercial spaces.",
      },
      { name: "author", content: "Roomzly" },
      { property: "og:title", content: "Roomzly — Premium real estate, considered" },
      {
        property: "og:description",
        content: "Curated, verified, and considered properties for the modern resident.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <AuthBootstrap>
        <SeoManager />
        <OrganizationJsonLd />
        <InteractionRecovery />
        <RealtimeBridge />
        <Navbar />
        <main className="min-h-dvh">
          <Outlet />
        </main>
        <Footer />
        <MobileBottomNav />
        <Toaster />
      </AuthBootstrap>
    </QueryClientProvider>
  );
}
