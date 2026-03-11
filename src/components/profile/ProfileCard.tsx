"use client";
import { getInitials } from "@/lib/formatters";
import type { UserProfile } from "@/types/user";
import type { User } from "firebase/auth";

interface Props { user: User; profile: UserProfile | null; }

export default function ProfileCard({ user, profile }: Props) {
  const initials = getInitials(profile?.displayName || user.email || "U");
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
        <div className="profile-field"><div className="profile-label">User ID</div><div className="profile-value muted" style={{ fontSize: "0.72rem", fontFamily: "var(--mono)" }}>{user.uid}</div></div>
      </div>
    </>
  );
}
