"use client";

import { createContext } from "react";
import { AnalyticsContextValue } from "./interfaces";

export const AnalyticsContext = createContext<AnalyticsContextValue | null>(null); 