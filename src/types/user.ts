export type UserProfile = {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string;
  provider: string;
  emailVerified: boolean;
  tokensUsedToday?: number;
  tokensRemainingToday?: number;
  lastTokenResetDate?: string;
  subscriptionType?: "free" | "pro_monthly" | "pro_yearly";
  subscriptionStatus?: "inactive" | "active" | "past_due" | "canceled";
  subscriptionStartDate?: string | null;
  subscriptionRenewalDate?: string | null;
  createdAt?: unknown;
  updatedAt?: unknown;
};
