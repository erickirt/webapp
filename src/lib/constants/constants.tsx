// Environment detection and configuration
export const getEnvironment = () => {
  const vercelEnv = process.env.NEXT_PUBLIC_VERCEL_ENV;
  switch (vercelEnv) {
    case "production":
      return "production";
    case "preview":
      return "staging";
    default:
      return "development";
  }
};

const isProduction = () => process.env.NEXT_PUBLIC_VERCEL_ENV === "production";
const isPreview = () => process.env.NEXT_PUBLIC_VERCEL_ENV === "preview";

// Domain configuration
const BASE_DOMAIN = process.env.NEXT_PUBLIC_APP_DOMAIN;

const buildDomain = (subdomain?: string, staging = false): string => {
  if (!BASE_DOMAIN) return "http://localhost:3000";

  const prefix = subdomain ? `${subdomain}${staging ? "-staging" : ""}.` : "";
  return `https://${prefix}${BASE_DOMAIN}`;
};

const buildLocalDomain = (subdomain?: string, port = "3000"): string => {
  return subdomain
    ? `http://${subdomain}.localhost:${port}`
    : `http://localhost:${port}`;
};

// App configuration
export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "Orgnise";

export const environment = getEnvironment();

// Domain constants
export const HOME_DOMAIN = buildDomain();

export const APP_DOMAIN = isProduction()
  ? buildDomain("app")
  : isPreview()
    ? buildDomain("app", true)
    : buildLocalDomain();

export const API_DOMAIN = isProduction()
  ? buildDomain("api")
  : isPreview()
    ? buildDomain("api", true)
    : buildLocalDomain("api", "8888");

export const API_HOSTNAMES = new Set([
  `api.${BASE_DOMAIN}`,
  `api-staging.${BASE_DOMAIN}`,
  "api.localhost:8888",
]);

// Time constants (in seconds)
export const TIME_CONSTANTS = {
  TWO_WEEKS: 60 * 60 * 24 * 14,
} as const;

// Legacy export for backward compatibility
export const TWO_WEEKS_IN_SECONDS = TIME_CONSTANTS.TWO_WEEKS;

// External resources
export const EXTERNAL_RESOURCES = {
  LOGO: "https://pub-3152a61af92e4405922f4ec571534d9b.r2.dev/website%2Flogo.png",
  DICEBEAR_AVATAR_BASE:
    "https://api.dicebear.com/8.x/initials/svg?backgroundType=gradientLinear&fontFamily=Helvetica&fontSize=40&size=40&seed=",
} as const;

// Legacy exports for backward compatibility
export const ORGNISE_LOGO = EXTERNAL_RESOURCES.LOGO;
export const DICEBEAR_AVATAR_URL = EXTERNAL_RESOURCES.DICEBEAR_AVATAR_BASE;

// Application routes and redirects
const BASE_APP_URL = "https://app.orgnise.in";
const BASE_SITE_URL = "https://orgnise.in";

export const DEFAULT_REDIRECTS = {
  // Main site
  home: BASE_SITE_URL,
  orgnise: BASE_SITE_URL,

  // Authentication
  signin: `${BASE_APP_URL}/signin`,
  login: `${BASE_APP_URL}/login`,
  register: `${BASE_APP_URL}/signup`,
  signup: `${BASE_APP_URL}/register`,

  // Application pages
  app: BASE_APP_URL,
  dashboard: BASE_APP_URL,
  links: `${BASE_APP_URL}/links`,
  settings: `${BASE_APP_URL}/settings`,
  welcome: `${BASE_APP_URL}/welcome`,
  invites: `${BASE_APP_URL}/invites`,
  create: `${BASE_APP_URL}/create`,
  new: `${BASE_APP_URL}/new`,

  // Legal pages
  policy: `${BASE_SITE_URL}/policy`,
  terms: `${BASE_SITE_URL}/terms`,
} as const;
