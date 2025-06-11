export interface EventMap {
  user_signup: { method: "email" | "google" | "github"; source?: string };
  user_login: {
    method: "email" | "google" | "github";
    remember_me: boolean;
  };
  page_view: { path: string; referrer?: string; load_time?: number };
  button_click: { button_id: string; location: string; context?: string };
  form_submit: { form_id: string; form_type: string; success: boolean };
  modal_open: { modal_id: string; trigger: string };
  modal_close: { modal_id: string; method: "click" | "escape" | "backdrop" };
  api_call: {
    endpoint: string;
    method: string;
    status_code: number;
    duration: number;
  };
  error_occurred: {
    error_type: string;
    error_message: string;
    stack_trace?: string;
  };
}

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