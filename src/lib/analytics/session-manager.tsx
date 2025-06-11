"use client";

import { useSession } from "next-auth/react";
import { useEffect, useRef } from "react";
import { loadIdentity } from "./identity";
import { useAnalytics } from "./useAnalytics";

export const AnalyticsSessionManager = () => {
  const { data: session, status } = useSession();
  const { identify } = useAnalytics();
  const identifiedOnce = useRef(false);

  useEffect(() => {
    // Prevent multiple identify calls on re-renders
    if (status === "loading" || identifiedOnce.current) {
      return;
    }

    const analyticsUser = loadIdentity();

    if (session?.user?.id && session.user.id !== analyticsUser.userId) {
      const { id, name, email } = session.user;
      identify(id, { name, email });
      identifiedOnce.current = true;
    }
  }, [session, status, identify]);

  return null; // This component does not render anything
};
