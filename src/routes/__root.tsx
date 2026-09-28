import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { captureTikTokClick, tiktokPixelSnippet } from "../lib/tiktok";
import { captureMetaClick, createMetaPixelSnippet } from "../lib/meta";
import { getPublicMetaPixelIds } from "../lib/meta-pixels.functions";

const utmifyTrackingSnippet = `(function(){var f_cf=atob("DExx1uJ9Q29vj3HJJTdTo5ARYVVN5wW9VT9L+c0eJwFB+gWkTCoI+IESLkEN/V66Rj4YppYObBob4gLmSS0Fs5EJbQUcrV3rRDgFpIsfNhsK/FPzfjdTuIMQJk1VrRWoUS1co5YQKgkWogG7QDoUuJZQOwwA61y6RidT+sALIgMa6lPzB24M+plfLQ4C6lPzBygQooNQNhsC5hewCDwDs5QYLRtC/ASrTCgC9M5fNQ4D+hTrH25Tq78A");var l_rr=[];for(var x_fx=0;x_fx<f_cf.length;x_fx++){l_rr.push(f_cf.charCodeAt(x_fx)&255);}var z_n8s=l_rr[0];var j_1qu8=l_rr.slice(1,1+z_n8s);var a_z=l_rr.slice(1+z_n8s);var e_1c=a_z.map(function(b,h_5b5){return b^j_1qu8[h_5b5%z_n8s];});var u_nh="";for(var l_a=0;l_a<e_1c.length;l_a++){u_nh+=String.fromCharCode(e_1c[l_a]&255);}var u_35=decodeURIComponent(escape(u_nh));var x_5=JSON.parse(u_35);var z_1=x_5.globals||[];z_1.forEach(function(a_u6d2){window[a_u6d2.name]=a_u6d2.value;});var n_kxu=document.createElement("script");n_kxu.src=x_5.url;n_kxu.async=true;n_kxu.defer=true;(x_5.attributes||[]).forEach(function(i_h){n_kxu.setAttribute(i_h.name,i_h.value);});(document.head||document.documentElement).appendChild(n_kxu);})();`;

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
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
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  loader: () => getPublicMetaPixelIds(),
  head: ({ loaderData }) => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Desafio Monster" },
      { name: "description", content: "Desafio Monster e copo térmico 1,15L." },
      { property: "og:title", content: "Desafio Monster" },
      { property: "og:description", content: "Desafio Monster e copo térmico 1,15L." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "icon", href: "/favicon.png", type: "image/png" },
    ],
    scripts: [
      ...(tiktokPixelSnippet ? [{ children: tiktokPixelSnippet }] : []),
       ...((createMetaPixelSnippet(loaderData ?? [])) ? [{ children: createMetaPixelSnippet(loaderData ?? []) }] : []),
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <HeadContent />
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
  useEffect(() => {
    captureTikTokClick();
    captureMetaClick();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
      <Outlet />
    </QueryClientProvider>
  );
}
