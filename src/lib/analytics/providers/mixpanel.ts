"use client";

import mixpanel from "mixpanel-browser";
import {
  AnalyticsProvider,
  EventMap,
  QueuedEvent,
  AnalyticsConfig,
} from "../interfaces";
import { RetryManager } from "../retryManager";

export class MixpanelAnalytics implements AnalyticsProvider {
  private eventQueue: QueuedEvent[] = [];
  private isOnline: boolean = true;
  private isInitialized: boolean = false;
  private retryManager: RetryManager;

  constructor(private token: string, private config: Partial<AnalyticsConfig>) {
    this.setupOfflineHandling();
    this.initialize();
    this.retryManager = new RetryManager({
      maxRetries: this.config.retryAttempts
    });
  }

  private async initialize(): Promise<void> {
    if (typeof window === "undefined" || this.isInitialized) return;

    try {
      console.log("Initializing Mixpanel with token:", this.token);
      mixpanel.init(this.token, {
        debug: this.config.debug,
        persistence: "localStorage",
        batch_requests: true,
        batch_size: this.config.batchSize,
        batch_flush_interval_ms: this.config.flushInterval,
      });
      this.isInitialized = true;
      await this.flushQueue();
    } catch (error) {
      console.error("Failed to initialize Mixpanel:", error);
    }
  }

  private setupOfflineHandling(): void {
    if (typeof window === "undefined") return;

    window.addEventListener("online", () => {
      this.isOnline = true;
      this.flushQueue();
    });

    window.addEventListener("offline", () => {
      this.isOnline = false;
    });
  }

  private queueEvent(event: QueuedEvent): void {
    if (this.eventQueue.length >= (this.config.maxQueueSize ?? 1000)) {
      this.eventQueue.shift();
    }
    this.eventQueue.push(event);
  }

  async track<K extends keyof EventMap>(
    event: K,
    properties: EventMap[K],
  ): Promise<void> {
    const eventData: QueuedEvent = {
      id: crypto.randomUUID(),
      event: event as string,
      properties,
      timestamp: Date.now(),
      retryCount: 0,
    };

    if (this.isInitialized && this.isOnline) {
      try {
        mixpanel.track(eventData.event, eventData.properties);
      } catch (error) {
        this.queueEvent(eventData);
        this.onError?.(error as Error, {
          event: eventData.event,
          properties: eventData.properties,
          timestamp: Date.now(),
          provider: "mixpanel",
        });
      }
    } else {
      this.queueEvent(eventData);
    }
  }

  async identify(userId: string, properties?: Record<string, any>): Promise<void> {
    if (this.isInitialized) {
      mixpanel.identify(userId);
      if (properties) {
        console.log("Identifying user:", { userId, properties });
        mixpanel.people.set(properties);
      }
    }
  }

  async page(path: string, properties?: Record<string, any>): Promise<void> {
    if (this.isInitialized) {
      mixpanel.track("page_viewed", { path, ...properties });
    }
  }

  async group(groupId: string, properties?: Record<string, any>): Promise<void> {
    if (this.isInitialized) {
      // mixpanel.group doesn't exist in the browser SDK, using register
      mixpanel.register({ group_id: groupId, ...properties });
    }
  }

  async reset(): Promise<void> {
    if (this.isInitialized) {
      mixpanel.reset();
    }
    this.clearQueue();
  }

  async flushQueue(): Promise<void> {
    if (!this.isInitialized || !this.isOnline || this.eventQueue.length === 0) {
      return;
    }

    const eventsToFlush = [...this.eventQueue];
    this.eventQueue = [];

    for (const event of eventsToFlush) {
      try {
        await this.retryManager.executeWithRetry(
          () => this.sendEventToMixpanel(event),
          `track:${event.event}`
        );
      } catch (error) {
        console.error(`Failed to send event ${event.event} after retries.`, error);
      }
    }
  }

  private sendEventToMixpanel(event: QueuedEvent): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        mixpanel.track(event.event, event.properties, (err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      } catch (error) {
        reject(error)
      }
    });
  }

  getQueueSize(): number {
    return this.eventQueue.length;
  }

  clearQueue(): void {
    this.eventQueue = [];
  }

  isHealthy(): boolean {
    return this.isInitialized && this.eventQueue.length < (this.config.maxQueueSize ?? 1000);
  }

  onError?: (error: Error, context: import("../interfaces").AnalyticsErrorContext) => void;
} 