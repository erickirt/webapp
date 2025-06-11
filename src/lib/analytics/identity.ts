import { UserTraits } from "./interfaces";

const USER_ID_KEY = "analytics_user_id";
const USER_TRAITS_KEY = "analytics_user_traits";

export const saveIdentity = (userId: string, traits?: UserTraits) => {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(USER_ID_KEY, userId);
    if (traits) {
      window.localStorage.setItem(USER_TRAITS_KEY, JSON.stringify(traits));
    }
  }
};

export const loadIdentity = (): { userId: string | null; traits: UserTraits | null } => {
  if (typeof window !== "undefined") {
    const userId = window.localStorage.getItem(USER_ID_KEY);
    const traitsString = window.localStorage.getItem(USER_TRAITS_KEY);
    const traits = traitsString ? JSON.parse(traitsString) : null;
    return { userId, traits };
  }
  return { userId: null, traits: null };
};

export const clearIdentity = () => {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(USER_ID_KEY);
    window.localStorage.removeItem(USER_TRAITS_KEY);
  }
}; 