import type { UserProfile } from "@/types/user";
import {
  FREE_DAILY_AI_TOKEN_LIMIT,
  UNLIMITED_AI_TOKENS,
} from "@/lib/constants";

export function hasProAccess(profile: UserProfile | null | undefined): boolean {
  if (!profile) return false;

  return (
    profile.subscriptionStatus === "active" &&
    (profile.subscriptionType === "pro_monthly" ||
      profile.subscriptionType === "pro_yearly")
  );
}

export function getAiTokenLimit(profile: UserProfile | null | undefined): number {
  return hasProAccess(profile) ? UNLIMITED_AI_TOKENS : FREE_DAILY_AI_TOKEN_LIMIT;
}

export function hasUnlimitedAiTokens(profile: UserProfile | null | undefined): boolean {
  return getAiTokenLimit(profile) === UNLIMITED_AI_TOKENS;
}
