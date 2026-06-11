import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  HeadContent,
  Scripts,
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
} from "@tanstack/react-router";
import { type ReactNode, useEffect } from "react";
import appStylesHref from "../styles.css?url";

import { reportError } from "../lib/error-reporting";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { Toaster } from "@/components/ui/sonner";
import { AuthBootstrap } from "@/components/auth/AuthBootstrap";
import { InteractionRecovery } from "@/components/runtime/InteractionRecovery";
import { RealtimeBridge } from "@/components/runtime/RealtimeBridge";
import { RouteTransition } from "@/components/runtime/RouteTransition";
import { RoomzlyLoadingOverlay } from "@/components/runtime/RoomzlyLoadingOverlay";
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
      { title: "Roomzly - Student rooms and PGs near colleges in Dehradun" },
      {
        name: "description",
        content:
          "Find verified rooms, PGs, flats, and student rentals near major Dehradun colleges with trust-focused discovery on Roomzly.",
      },
      { name: "author", content: "Roomzly" },
      { property: "og:title", content: "Roomzly - Student rooms and PGs near colleges in Dehradun" },
      {
        property: "og:description",
        content: "Browse by college, compare trust signals, and contact owners faster on Roomzly.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "stylesheet", href: appStylesHref }],
  }),
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootDocument({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Inter+Tight:wght@600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" type="image/png" sizes="192x192" href="/favicon-192.png" />
        <link rel="icon" type="image/png" sizes="512x512" href="/favicon-512.png" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/site.webmanifest" />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <RootDocument>
      <QueryClientProvider client={queryClient}>
        <AuthBootstrap>
          <SeoManager />
          <OrganizationJsonLd />
          <InteractionRecovery />
          <RealtimeBridge />
          <Navbar />
          <main className="min-h-dvh">
            <RouteTransition>
              <Outlet />
            </RouteTransition>
          </main>
          <Footer />
          <MobileBottomNav />
          <Toaster />
          <RoomzlyLoadingOverlay />
        </AuthBootstrap>
      </QueryClientProvider>
    </RootDocument>
  );
}
