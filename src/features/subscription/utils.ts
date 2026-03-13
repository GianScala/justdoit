import type { UserProfile } from "@/types/user";

export function hasProAccess(profile: UserProfile | null | undefined): boolean {
  if (!profile) return false;

  return (
    profile.subscriptionStatus === "active" &&
    (profile.subscriptionType === "pro_monthly" ||
      profile.subscriptionType === "pro_yearly")
  );
}
