"use client";
import { FormEvent, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { sendResetEmail } from "@/features/auth/utils/firebase";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Alert from "@/components/ui/Alert";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState(""); const [submitting, setSubmitting] = useState(false); const [error, setError] = useState<string | null>(null); const [success, setSuccess] = useState(false);

  const handleSubmit = useCallback(async (e: FormEvent) => {
    e.preventDefault(); if (submitting) return; setError(null);
    if (!email.trim()) { setError("Please enter your email."); return; }
    try { setSubmitting(true); await sendResetEmail(email.trim()); setSuccess(true); } catch (err: any) { setError(err.message || "Failed to send."); } finally { setSubmitting(false); }
  }, [email, submitting]);

  return (
    <div className="auth-layout"><div style={{ width: "100%", maxWidth: 460 }}><div className="auth-card">
      <Link href="/auth/login" className="muted" style={{ fontFamily: "var(--mono)", fontSize: "0.75rem" }}>← Back to sign in</Link>
      <div className="center" style={{ margin: "20px 0 24px" }}><h2 className="auth-heading">Reset Password</h2><p className="auth-subheading">We&apos;ll send you a reset link</p></div>
      {success ? <Alert variant="success" className="center"><strong>Check your email</strong><div style={{ marginTop: 8 }}>Reset link sent to <strong>{email}</strong></div><div style={{ marginTop: 16 }}><Button variant="secondary" onClick={() => router.push("/auth/login")}>Back to Sign In</Button></div></Alert> :
      <form onSubmit={handleSubmit} className="stack"><Input label="Email" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" autoFocus />{error && <Alert variant="error">{error}</Alert>}<Button type="submit" disabled={submitting}>{submitting ? "Sending..." : "Send Reset Link"}</Button></form>}
    </div></div></div>
  );
}
