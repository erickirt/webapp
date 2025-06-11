"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { useAnalytics } from "./useAnalytics";

export const PageViewTracker = () => {
  const analytics = useAnalytics();
  const pathname = usePathname();

  useEffect(() => {
    if (analytics.isReady && pathname) {
      analytics.page(pathname, {
        referrer: document.referrer,
      });
    }
  }, [pathname, analytics.isReady, analytics]);

  return null;
};
