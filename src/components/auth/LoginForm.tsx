"use client";

import { FormEvent, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { emailSignIn, signInWithGoogleAndCreateProfile, getFirebaseAuth, getFirebaseDb } from "@/lib/firebase";
import { getFirebaseErrorMessage } from "@/lib/validations";
import { signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Alert from "@/components/ui/Alert";
import GoogleIcon from "@/components/icons/GoogleIcon";

export default function LoginForm() {
  const router = useRouter();
  const { clearPendingVerification, isPendingVerification, pendingVerification } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleGoogle = useCallback(async () => {
    if (submitting) return;
    try {
      setSubmitting(true); setError(null);
      const result = await signInWithGoogleAndCreateProfile();
      if (result) { clearPendingVerification(); router.replace("/dashboard"); }
    } catch (err: any) {
      if (err?.code === "auth/popup-closed-by-user" || err?.code === "auth/cancelled-popup-request") { setSubmitting(false); return; }
      setError(getFirebaseErrorMessage(err?.code || ""));
      setSubmitting(false);
    }
  }, [submitting, clearPendingVerification, router]);

  const handleSubmit = useCallback(async (e: FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setError(null);
    if (!email.trim()) { setError("Please enter your email."); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }

    try {
      setSubmitting(true);
      const cred = await emailSignIn(email.trim(), password);
      const userDoc = await getDoc(doc(getFirebaseDb(), "users", cred.user.uid));

      if (userDoc.exists() && !userDoc.data().emailVerified) {
        setError("Please verify your email first. Check your inbox.");
        await signOut(getFirebaseAuth());
        setSubmitting(false);
        return;
      }
      clearPendingVerification();
      router.replace("/dashboard");
    } catch (err: any) {
      setError(getFirebaseErrorMessage(err?.code || ""));
      setSubmitting(false);
    }
  }, [email, password, submitting, clearPendingVerification, router]);

  return (
    <>
      {isPendingVerification && (
        <Alert variant="success" className="stack mb-4">
          <div>Please verify your email{pendingVerification?.email && <> ({pendingVerification.email})</>}, then sign in.</div>
          <button type="button" onClick={clearPendingVerification} className="auth-footer-link" style={{ marginTop: 8, fontSize: 13 }}>Dismiss</button>
        </Alert>
      )}

      <Button variant="secondary" onClick={handleGoogle} disabled={submitting} style={{ display: "flex" }}>
        <GoogleIcon /> {submitting ? "Connecting..." : "Continue with Google"}
      </Button>

      <div className="auth-divider">or using email</div>

      <form onSubmit={handleSubmit} className="stack">
        <Input label="Email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
        <div>
          <div className="row">
            <label className="label" style={{ marginBottom: 0 }}>Password</label>
            <button type="button" onClick={() => router.push("/auth/forgot-password")} className="auth-footer-link" style={{ fontFamily: "var(--mono)", fontSize: "0.7rem" }}>Forgot?</button>
          </div>
          <input className="input" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" minLength={6} style={{ marginTop: 6 }} />
        </div>
        {error && <Alert variant="error">{error}</Alert>}
        <Button type="submit" disabled={submitting}>{submitting ? "Signing in..." : "Sign In"}</Button>
      </form>
    </>
  );
}
