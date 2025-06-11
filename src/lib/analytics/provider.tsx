"use client";

import React, { useEffect, useMemo, useState } from "react";
import { AnalyticsContext } from "./context";
import { AnalyticsConfig, AnalyticsProvider } from "./interfaces";
import { MixpanelAnalytics } from "./providers/mixpanel";

const defaultConfig: AnalyticsConfig = {
  enabled: true, //process.env.NODE_ENV === "production",
  debug: process.env.NEXT_PUBLIC_VERCEL_ENV === "production", //process.env.NODE_ENV !== "production",
  batchSize: 20,
  flushInterval: 10000,
  retryAttempts: 3,
  environment: process.env.NODE_ENV,
  validateEvents: true,
  enableOfflineQueue: true,
  maxQueueSize: 1000,
  provider: "mixpanel",
};

export const AnalyticsProviderComponent: React.FC<{
  children: React.ReactNode;
  config?: Partial<AnalyticsConfig>;
}> = ({ children, config }) => {
  const [isReady, setIsReady] = useState(false);

  const finalConfig = useMemo(
    () => ({ ...defaultConfig, ...config }),
    [config],
  );

  const provider = useMemo(() => {
    if (
      typeof window !== "undefined" &&
      process.env.NEXT_PUBLIC_MIXPANEL_TOKEN
    ) {
      return new MixpanelAnalytics(
        process.env.NEXT_PUBLIC_MIXPANEL_TOKEN,
        finalConfig,
      );
    }
    // Return a no-op provider if on server or no token
    const noOpProvider: AnalyticsProvider = {
      track: async () => {},
      identify: async () => {},
      page: async () => {},
      group: async () => {},
      reset: async () => {},
      flushQueue: async () => {},
      getQueueSize: () => 0,
      clearQueue: () => {},
      isHealthy: () => true,
    };
    return noOpProvider;
  }, [finalConfig]);

  useEffect(() => {
    if (provider) {
      setIsReady(true);
    }
  }, [provider]);

  return (
    <AnalyticsContext.Provider
      value={{
        provider,
        config: finalConfig,
        isReady,
      }}
    >
      {children}
    </AnalyticsContext.Provider>
  );
};
