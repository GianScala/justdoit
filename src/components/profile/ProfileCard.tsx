"use client";
import { getInitials } from "@/lib/formatters";
import {
  getAiTokenLimit,
  hasUnlimitedAiTokens,
  hasProAccess,
} from "@/features/subscription/utils";
import type { UserProfile } from "@/types/user";
import type { User } from "firebase/auth";

interface Props { user: User; profile: UserProfile | null; }

export default function ProfileCard({ user, profile }: Props) {
  const initials = getInitials(profile?.displayName || user.email || "U");
  const tokensUsedToday = profile?.tokensUsedToday ?? 0;
  const tokensRemainingToday = profile?.tokensRemainingToday ?? getAiTokenLimit(profile);
  const subscriptionType = profile?.subscriptionType ?? "free";
  const subscriptionStatus = profile?.subscriptionStatus ?? "inactive";
  const unlimited = hasUnlimitedAiTokens(profile);
  return (
    <>
      <div className="profile-card" style={{ textAlign: "center" }}>
        <div className="profile-avatar">
          {profile?.photoURL ? <img src={profile.photoURL} alt={profile.displayName || "Avatar"} referrerPolicy="no-referrer" /> : initials}
        </div>
        <h1 style={{ fontFamily: "var(--mono)", fontSize: "1.2rem", fontWeight: 700, textTransform: "uppercase", marginBottom: 4 }}>{profile?.displayName || "User"}</h1>
        <p className="muted" style={{ fontFamily: "var(--mono)", fontSize: "0.78rem" }}>{user.email}</p>
      </div>
      <div className="profile-card" style={{ marginTop: 16 }}>
        <h2 style={{ fontFamily: "var(--mono)", fontSize: "0.8rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", marginBottom: 16 }}>Account Details</h2>
        <div className="profile-field"><div className="profile-label">Display Name</div><div className="profile-value">{profile?.displayName || "Not set"}</div></div>
        <div className="profile-field"><div className="profile-label">Email</div><div className="profile-value">{user.email}</div></div>
        <div className="profile-field"><div className="profile-label">Sign-in Method</div><div className="profile-value">{profile?.provider === "google.com" ? "Google" : profile?.provider === "password" ? "Email & Password" : profile?.provider || "Unknown"}</div></div>
        <div className="profile-field"><div className="profile-label">Email Verified</div><div className="profile-value">{user.emailVerified ? <span style={{ color: "var(--green)" }}>✓ Verified</span> : <span style={{ color: "var(--amber)" }}>Not verified</span>}</div></div>
        <div className="profile-field"><div className="profile-label">Subscription</div><div className="profile-value">{subscriptionType === "pro_monthly" ? "Pro Monthly" : subscriptionType === "pro_yearly" ? "Pro Yearly" : "Free"}{subscriptionStatus === "active" ? " • Active" : ""}</div></div>
        <div className="profile-field"><div className="profile-label">User ID</div><div className="profile-value muted" style={{ fontSize: "0.72rem", fontFamily: "var(--mono)" }}>{user.uid}</div></div>
      </div>
      <div className="profile-card" style={{ marginTop: 16 }}>
        <h2 style={{ fontFamily: "var(--mono)", fontSize: "0.8rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", marginBottom: 16 }}>AI Usage Today</h2>
        <div className="profile-field"><div className="profile-label">Used</div><div className="profile-value">{tokensUsedToday.toLocaleString()} tokens</div></div>
        <div className="profile-field"><div className="profile-label">Remaining</div><div className="profile-value">{unlimited ? "Unlimited" : `${Math.max(0, tokensRemainingToday).toLocaleString()} tokens`}</div></div>
        <div className="profile-field"><div className="profile-label">Daily Limit</div><div className="profile-value">{hasProAccess(profile) ? "Unlimited" : "10,000 tokens"}</div></div>
      </div>
    </>
  );
}
