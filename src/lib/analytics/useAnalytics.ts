"use client";

import { useContext } from "react";
import { AnalyticsContext } from "./context";
import { EventMap } from "./interfaces";
import { validateEventProperties } from "./validation";

export const useAnalytics = () => {
  const context = useContext(AnalyticsContext);

  if (!context) {
    throw new Error("useAnalytics must be used within an AnalyticsProvider");
  }

  const { provider, isReady, config } = context;

  const track = <K extends keyof EventMap>(
    event: K,
    properties: EventMap[K],
  ) => {
    if (isReady) {
      if (config.validateEvents) {
        const validation = validateEventProperties(event, properties);
        if (!validation.success) {
          console.error(`Analytics event validation failed for ${event}:`, validation.errors);
          if (config.environment !== 'production') {
            throw new Error(`Analytics event validation failed: ${validation.errors?.join(', ')}`);
          }
          // In production, we can choose to drop the event or send it anyway.
          // For now, we'll just log the error and not send the event.
          return Promise.resolve();
        }
      }
      return provider.track(event, properties);
    }
    return Promise.resolve();
  };

  const identify = (userId: string, properties?: Record<string, any>) => {
    if (isReady) {
      return provider.identify(userId, properties);
    }
    return Promise.resolve();
  };

  const page = (path: string, properties?: Record<string, any>) => {
    if (isReady) {
      return provider.page(path, properties);
    }
    return Promise.resolve();
  };

  const group = (groupId: string, properties?: Record<string, any>) => {
    if (isReady) {
      return provider.group(groupId, properties);
    }
    return Promise.resolve();
  };

  const reset = () => {
    if (isReady) {
      return provider.reset();
    }
    return Promise.resolve();
  };

  return {
    track,
    identify,
    page,
    group,
    reset,
    isReady,
    getQueueSize: provider.getQueueSize,
    flush: provider.flushQueue,
  };
}; 