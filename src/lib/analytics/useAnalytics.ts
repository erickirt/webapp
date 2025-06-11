"use client";

import { useContext } from "react";
import { AnalyticsContext } from "./context";
import { EventMap } from "./interfaces";
import { validateEvent } from "./validation";
import { saveIdentity, loadIdentity } from "./identity";
import { useParams } from "next/navigation";
import useTeam from "@/lib/swr/use-team";

export const useAnalytics = () => {
  const context = useContext(AnalyticsContext);
  if (!context) {
    throw new Error("useAnalytics must be used within an AnalyticsProvider");
  }
  const { provider, config, isReady } = context;
  const params = useParams();
  const { activeTeam } = useTeam();

  const track = async <K extends keyof EventMap>(
    event: K,
    properties: EventMap[K],
  ) => {
    if (!isReady || !config.enabled) return;

    if (config.validateEvents) {
      const validationResult = validateEvent(event, properties);
      if (!validationResult.success) {
        console.error("Analytics event validation failed:", validationResult.error?.errors);
        if (config.environment !== "development") {
          // In production, you might want to stop here
          return;
        }
      }
    }

    // Enrich with identity and context
    const { userId, traits } = loadIdentity();
    const teamId = activeTeam?._id;
    const teamSlug = params?.team_slug as string | undefined;

    const enrichedProperties: Record<string, any> = {
      ...properties,
      ...traits,
      userId,
      teamId,
      teamSlug,
      // remove undefined/null values
    };

    Object.keys(enrichedProperties).forEach(key => {
      if (enrichedProperties[key] === undefined || enrichedProperties[key] === null) {
        delete enrichedProperties[key];
      }
    });

    if (config.debug) {
      console.log(`[Analytics] Track: ${event}`, enrichedProperties);
    }
    await provider.track(event, enrichedProperties as EventMap[K]);
  };

  const identify = async (userId: string, traits?: Record<string, any>) => {
    if (!isReady || !config.enabled) return;
    saveIdentity(userId, traits); // Persist identity
    if (config.debug) {
      console.log(`[Analytics] Identify: ${userId}`, traits);
    }
    await provider.identify(userId, traits);
  };

  const page = async (path: string, properties?: Record<string, any>) => {
    if (!isReady || !config.enabled) return;
    if (config.debug) {
      console.log(`[Analytics] Page: ${path}`, properties);
    }
    await provider.page(path, properties);
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