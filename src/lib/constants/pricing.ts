interface PlanLimits {
  workspaces: number | null;
  pages: number | null;
  users: number | null;
}

interface PlanPrice {
  monthly: number | null;
  yearly: number | null;
  ids: string[];
}

interface PlanColors {
  bg: string;
  text: string;
}

interface PlanCTA {
  text: string;
  shortText?: string;
  href: string;
  color: string;
}

interface PlanFeature {
  text: string;
  footnote?: string | {
    title: string;
    cta: string;
    href: string;
  };
}

interface Plan {
  name: string;
  tagline: string;
  link?: string;
  price: PlanPrice;
  limits: PlanLimits;
  colors: PlanColors;
  cta: PlanCTA;
  featureTitle: string;
  features: PlanFeature[];
}

export const FREE_TEAMS_LIMIT = 2;


interface BusinessPlanConfig {
  name?: string;
  monthly?: number;
  yearly?: number;
  workspaces?: number;
  pages?: number;
  users?: number;
  ids?: string[];
}


const createBusinessPlan = (config: BusinessPlanConfig = {}): Plan => {
  const {
    name = "Business",
    monthly = 12,
    yearly = 10,
    workspaces = 20,
    pages = 200,
    users = 12,
    ids = [],
  } = config;

  return {
    name,
    tagline: "For larger teams with increased usage",
    link: "#",
    price: {
      monthly,
      yearly,
      ids,
    },
    limits: {
      workspaces,
      pages,
      users,
    },
    colors: {
      bg: "bg-sky-900",
      text: "text-sky-900",
    },
    cta: {
      text: "Get started with Business",
      shortText: "Get started",
      href: "#",
      color: "bg-sky-900 border-sky-900 hover:text-sky-900",
    },
    featureTitle: "Everything in Pro, plus:",
    features: [
      { text: `${users} users` },
      { text: `${workspaces} workspaces` },
      {
        text: `${pages} pages`,
        footnote: {
          title: "Counted as the total number of collections and pages.",
          cta: "Learn more.",
          href: "#",
        },
      },
      { text: "Email and chat support", footnote: "Email and chat support." },
    ],
  };
};

export const PLANS: Plan[] = [
  {
    name: "Free",
    tagline: "For hobby & side projects",
    price: {
      monthly: 0,
      yearly: 0,
      ids: [],
    },
    limits: {
      workspaces: 3,
      pages: 30,
      users: 1,
    },
    colors: {
      bg: "bg-black",
      text: "text-black",
    },
    cta: {
      text: "Start for free",
      href: "#",
      color: "bg-black border-black hover:text-black",
    },
    featureTitle: "What's included:",
    features: [
      { text: "1 user" },
      { text: "Up to 3 Workspaces" },
      { text: "Up to 30 pages" },
      {
        text: "Community support",
        footnote: "Help center + GitHub discussions.",
      },
    ],
  },
  {
    name: "Pro",
    tagline: "For startups & small businesses",
    price: {
      monthly: 24,
      yearly: 19,
      ids: [
        'pri_01j1d2wt5755sy0891nwev4jbs', // Monthly
        'pri_01j1d34bwgh6c3fx33hq0kbat6', // Yearly
        'pri_01j0tq0tb7g3e8mwe0rfgr43r2', // Monthly
        'pri_01j11nqqw758hpfkkdkp5ejngz' // Yearly
      ],
    },
    limits: {
      workspaces: 10,
      pages: 200,
      users: 5,
    },
    colors: {
      bg: "bg-violet-600",
      text: "text-violet-600",
    },
    cta: {
      text: "Contact us",
      href: "/enterprise",
      color: "bg-violet-600 border-violet-600 hover:text-violet-600",
    },
    featureTitle: "Everything in Free, plus:",
    features: [
      { text: "5 users" },
      { text: "10 Workspaces" },
      { text: "200 pages" },
      { text: "Email support", footnote: "Basic email support." },
    ],
  },
  createBusinessPlan({
    name: "Business",
    monthly: 59,
    yearly: 49,
    users: 10,
    pages: 600,
    workspaces: 30,
    ids: [
      'pri_01j1d383r3rynxr3v5k9w1t7j9', // Monthly
      'pri_01j1d39wx7x4kxadhmnmy30x3t', // Yearly
      'pri_01j11p1sga7scd3tn59pv8zzq6', // Monthly
      'pri_01j11pf34t068ntj7533t35sad'  // Yearly
    ]
  }),
  {
    name: "Enterprise",
    tagline:
      "Tailored plans for large corporations are available. Whether you are managing a multinational company or a local business, it is important to have a plan that fits your specific needs and goals. Our team of experts will work with you to create a customized strategy that maximizes efficiency and drives success in your industry",
    link: "https://organise.in/enterprise",
    price: {
      monthly: null,
      yearly: null,
      ids: [],
    },
    limits: {
      workspaces: null,
      pages: null,
      users: null,
    },
    colors: {
      bg: "bg-violet-600",
      text: "text-violet-600",
    },
    cta: {
      text: "Contact us",
      href: "/enterprise",
      color: "bg-violet-600 border-violet-600 hover:text-violet-600",
    },
    featureTitle: "Everything in Business, plus:",
    features: [
      { text: "Custom usage limits" },
      { text: "Dedicated success manager" },
      { text: "Priority support" },
      { text: "Dedicated Slack channel" },
    ],
  },
];

export const FREE_PLAN = PLANS.find((plan) => plan.name === "Free")!;
export const PRO_PLAN = PLANS.find((plan) => plan.name === "Pro")!;
export const BUSINESS_PLAN = PLANS.find((plan) => plan.name === "Business")!;
export const ENTERPRISE_PLAN = PLANS.find((plan) => plan.name === "Enterprise")!;

export const PUBLIC_PLANS = [
  FREE_PLAN,
  PRO_PLAN,
  BUSINESS_PLAN,
  ENTERPRISE_PLAN,
];

export const SELF_SERVE_PAID_PLANS = PLANS.filter(
  (plan) => plan.name !== "Free" && plan.name !== "Enterprise",
);
export const getPlanFromPriceId = (priceId: string): Plan | null => {
  return PLANS.find((plan) => plan.price.ids.includes(priceId)) || null;
};

export const getPlanDetails = (planName: string): Plan | undefined => {
  return SELF_SERVE_PAID_PLANS.find(
    (plan) => plan.name.toLowerCase() === planName.toLowerCase(),
  );
};

export const getNextPlan = (currentPlanName?: string | null): Plan | undefined => {
  if (!currentPlanName) return PRO_PLAN;

  const currentIndex = PLANS.findIndex(
    (plan) => plan.name.toLowerCase() === currentPlanName.toLowerCase()
  );

  return currentIndex >= 0 && currentIndex < PLANS.length - 1
    ? PLANS[currentIndex + 1]
    : undefined;
};
