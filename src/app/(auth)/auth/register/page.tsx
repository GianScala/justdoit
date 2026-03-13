"use client";
import { useRouter } from "next/navigation";
import AuthHero from "@/components/auth/AuthHero";
import AuthCard from "@/components/auth/AuthCard";
import RegisterForm from "@/components/auth/RegisterForm";

export default function RegisterPage() {
  const router = useRouter();
  return (
    <div className="auth-layout">
      <div className="auth-grid">
        <AuthHero badge="Get Started" title={<>Stop planning.<br /><span>Start moving.</span></>} subtitle="Create your free account and let AI turn the work on your mind into a plan in under a minute." />
        <AuthCard title="Create Account" subtitle="Start free and reach your first AI plan fast." footer={<p className="muted">Already have an account? <button type="button" onClick={() => router.push("/auth/login")} className="auth-footer-link">Sign in</button></p>}>
          <RegisterForm />
        </AuthCard>
      </div>
    </div>
  );
}
