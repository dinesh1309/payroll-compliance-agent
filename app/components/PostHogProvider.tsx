"use client";

import { Suspense, useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import posthog from "posthog-js";
import { PostHogProvider as PHProvider, usePostHog } from "posthog-js/react";

// Product analytics for the demo. No-ops entirely when NEXT_PUBLIC_POSTHOG_KEY is unset.
// Autocapture (clicks, incl. the footer links) + manual pageviews + session replay (toggle on in
// the PostHog project). Every event is tagged app="payroll-compliance-agent" so it filters cleanly
// out of the shared PostHog project. No login here, so visitors stay anonymous.

const KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (!KEY || typeof window === "undefined" || posthog.__loaded) return;
    posthog.init(KEY, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com",
      capture_pageview: false, // captured manually below (App Router client nav)
      capture_pageleave: true,
      person_profiles: "identified_only",
    });
    posthog.register({ app: "payroll-compliance-agent" });
  }, []);

  if (!KEY) return <>{children}</>;
  return (
    <PHProvider client={posthog}>
      <Suspense fallback={null}>
        <PageView />
      </Suspense>
      {children}
    </PHProvider>
  );
}

function PageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const ph = usePostHog();
  useEffect(() => {
    if (!pathname || !ph) return;
    let url = window.origin + pathname;
    const qs = searchParams?.toString();
    if (qs) url += "?" + qs;
    ph.capture("$pageview", { $current_url: url });
  }, [pathname, searchParams, ph]);
  return null;
}

// Safe capture helper — no-ops if analytics isn't configured.
export function track(event: string, props?: Record<string, unknown>) {
  if (KEY && posthog.__loaded) posthog.capture(event, props);
}
