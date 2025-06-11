import { z } from "zod";
import { EventMap } from "./interfaces";

const eventSchemas = {
  user_signup: z.object({
    method: z.enum(["email", "google", "github"]),
    source: z.string().optional(),
  }),
  user_login: z.object({
    method: z.enum(["email", "google", "github"]),
    remember_me: z.boolean(),
  }),
  page_view: z.object({
    path: z.string().min(1),
    referrer: z.string().optional(),
    load_time: z.number().positive().optional(),
  }),
  button_click: z.object({
    button_id: z.string().min(1),
    location: z.string().min(1),
    context: z.string().optional(),
  }),
  form_submit: z.object({
    form_id: z.string().min(1),
    form_type: z.string().min(1),
    success: z.boolean(),
  }),
  modal_open: z.object({
    modal_id: z.string().min(1),
    trigger: z.string().min(1),
  }),
  modal_close: z.object({
    modal_id: z.string().min(1),
    method: z.enum(["click", "escape", "backdrop"]),
  }),
  api_call: z.object({
    endpoint: z.string().min(1),
    method: z.string().min(1),
    status_code: z.number().int().min(100).max(599),
    duration: z.number().positive(),
  }),
  error_occurred: z.object({
    error_type: z.string().min(1),
    error_message: z.string().min(1),
    stack_trace: z.string().optional(),
  }),
} as const;

export const validateEventProperties = <K extends keyof EventMap>(
  event: K,
  properties: EventMap[K],
): { success: boolean; errors?: string[] } => {
  const schema = eventSchemas[event];
  const result = schema.safeParse(properties);

  if (result.success) {
    return { success: true };
  }

  const errors = result.error.errors.map(
    (err) => `${err.path.join(".")}: ${err.message}`
  );

  return { success: false, errors };
}; 