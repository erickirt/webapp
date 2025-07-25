import { z } from "zod";

// Schemas for each event
export const eventSchemaMap = {
  button_click: z.object({
    button_id: z.string(),
    location: z.string(),
  }),
  form_submission: z.object({
    form_id: z.string(),
    status: z.enum(["success", "failure"]),
  }),
  page_view: z.object({
    path: z.string(),
    referrer: z.string().optional(),
    load_time: z.number().optional(),
  }),
  user_login: z.object({
    method: z.enum(["email", "google", "github"]),
    remember_me: z.boolean(),
  }),
  user_signup: z.object({
    method: z.enum(["email", "google", "github"]),
    source: z.string().optional(),
  }),
  file_upload: z.object({
    file_type: z.string(),
    file_size: z.number(),
  }),
  item_created: z.object({
    item_type: z.string(),
    collection_id: z.string(),
  }),
  item_deleted: z.object({
    item_type: z.string(),
    collection_id: z.string(),
  }),
  dashboard_viewed: z.object({}),
};

// This generates the EventMap type from the schemas
export type EventMap = {
  [K in keyof typeof eventSchemaMap]: z.infer<typeof eventSchemaMap[K]>;
};

export interface AnalyticsErrorContext {
  event?: string;
  properties?: any;
  timestamp: number;
  provider: string;
  retryCount?: number;
}

export interface AnalyticsProvider {
  identify(userId: string, properties?: Record<string, any>): Promise<void>;
  track<K extends keyof EventMap>(
    event: K,
    properties: EventMap[K],
  ): Promise<void>;
  page(path: string, properties?: Record<string, any>): Promise<void>;
  group(groupId: string, properties?: Record<string, any>): Promise<void>;
  reset(): Promise<void>;
  flushQueue(): Promise<void>;
  getQueueSize(): number;
  clearQueue(): void;
  isHealthy(): boolean;
  onError?: (error: Error, context: AnalyticsErrorContext) => void;
}

export interface AnalyticsConfig {
  enabled: boolean;
  debug: boolean;
  batchSize: number;
  flushInterval: number;
  retryAttempts: number;
  environment: "development" | "staging" | "production" | "test";
  validateEvents: boolean;
  enableOfflineQueue: boolean;
  maxQueueSize: number;
  provider: "mixpanel" | "log" | "segment" | "google-analytics";
}

export interface AnalyticsContextValue {
  provider: AnalyticsProvider;
  config: AnalyticsConfig;
  isReady: boolean;
  error?: Error;
}

export interface QueuedEvent {
  id: string;
  event: string;
  properties: any;
  timestamp: number;
  retryCount: number;
}

export type UserTraits = {
  name?: string;
  email?: string;
  [key: string]: any;
}; 