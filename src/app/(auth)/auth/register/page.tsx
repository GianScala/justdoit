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
        <AuthHero badge="Get Started" title={<>Take control of<br />your <span>schedule</span></>} subtitle="Create your free account and start organizing tasks, setting priorities, and hitting deadlines." />
        <AuthCard title="Create Account" subtitle="Less than a minute to get started." footer={<p className="muted">Already have an account? <button type="button" onClick={() => router.push("/auth/login")} className="auth-footer-link">Sign in</button></p>}>
          <RegisterForm />
        </AuthCard>
      </div>
    </div>
  );
}
