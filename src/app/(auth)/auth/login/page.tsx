"use client";
import { useAuth } from "@/context/AuthContext";
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
          badge="Task Automation Scheduler"
          title={<>Automate your<br /><span>productivity.</span></>}
          subtitle="Schedule tasks, set priorities, and track progress — all from one simple dashboard."
          features={["Smart folder organization", "Priority-based task scheduling", "Real-time cloud sync across devices"]}
        />
        <AuthCard
          title="Welcome Back"
          subtitle="Sign in to your task scheduler"
          footer={<p className="muted">No account? <button type="button" onClick={() => router.push("/auth/register")} className="auth-footer-link">Create one</button></p>}
        >
          <LoginForm />
        </AuthCard>
      </div>
    </div>
  );
}
