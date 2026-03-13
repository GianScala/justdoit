"use client";
import { useAuthRedirect } from "@/features/auth/hooks/useAuthRedirect";
import { useRouter } from "next/navigation";
import AuthHero from "@/components/auth/AuthHero";
import AuthCard from "@/components/auth/AuthCard";
import LoginForm from "@/components/auth/LoginForm";

export default function LoginPage() {
  const router = useRouter();
  const { isReady, shouldShow } = useAuthRedirect();

  if (!isReady || !shouldShow) {
    return <div className="auth-layout"><div className="muted" style={{ fontFamily: "var(--mono)", fontSize: "0.8rem" }}>{!isReady ? "Checking session…" : "Redirecting…"}</div></div>;
  }

  return (
    <div className="auth-layout">
      <div className="auth-grid">
        <AuthHero
          badge="AI Productivity Assistant"
          title={<>Let AI organize<br /><span>your work.</span></>}
          subtitle="Sign in and go straight to an AI-first workspace that plans, prioritizes, and organizes tasks for you."
          features={["Turn goals into plans", "See what matters now", "Keep tasks synced across devices"]}
        />
        <AuthCard
          title="Welcome Back"
          subtitle="Sign in to your AI assistant"
          footer={<p className="muted">No account? <button type="button" onClick={() => router.push("/auth/register")} className="auth-footer-link">Create one</button></p>}
        >
          <LoginForm />
        </AuthCard>
      </div>
    </div>
  );
}
