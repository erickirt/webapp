import { z } from "zod";
import { eventSchemaMap, EventMap } from "./interfaces";

export const validateEvent = <K extends keyof EventMap>(
  eventName: K,
  properties: EventMap[K]
): { success: boolean; error?: z.ZodError } => {
  const schema = eventSchemaMap[eventName];
  return schema.safeParse(properties);
}; 