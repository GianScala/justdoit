"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { emailSignUpAndCreateProfile, getFirebaseAuth } from "@/lib/firebase";
import { getFirebaseErrorMessage } from "@/lib/validations";
import { PENDING_KEY, PENDING_COOKIE } from "@/lib/constants";
import { signOut } from "firebase/auth";
import { useAuth } from "@/context/AuthContext";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Alert from "@/components/ui/Alert";

type InfoState = { email: string; userId: string };

function setPending(p: { email: string; userId: string; username: string }) {
  document.cookie = `${PENDING_COOKIE}=1; Max-Age=1800; Path=/; SameSite=Lax`;
  try { sessionStorage.setItem(PENDING_KEY, JSON.stringify({ ...p, timestamp: Date.now() })); } catch {}
}

function readPending() {
  try { const r = sessionStorage.getItem(PENDING_KEY); return r ? JSON.parse(r) : null; } catch { return null; }
}

export default function RegisterForm() {
  const router = useRouter();
  const { clearPendingVerification } = useAuth();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<InfoState | null>(null);

  useEffect(() => {
    const p = readPending();
    if (p?.email && p?.userId) { setInfo({ email: p.email, userId: p.userId }); setUsername(p.username || ""); }
  }, []);

  const handleSubmit = useCallback(async (e: FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setError(null); setInfo(null);
    if (!username.trim()) { setError("Please enter a username."); return; }
    if (!email.trim()) { setError("Please enter your email."); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }

    try {
      setSubmitting(true);
      document.cookie = `${PENDING_COOKIE}=1; Max-Age=1800; Path=/; SameSite=Lax`;
      const cred = await emailSignUpAndCreateProfile(email.trim(), password, username.trim());
      try { await signOut(getFirebaseAuth()); } catch {}
      setPending({ email: cred.user.email ?? email.trim(), userId: cred.user.uid, username: username.trim() });
      setInfo({ email: cred.user.email ?? email.trim(), userId: cred.user.uid });
      setPassword("");
    } catch (err: any) {
      try { sessionStorage.removeItem(PENDING_KEY); document.cookie = `${PENDING_COOKIE}=; Max-Age=0; Path=/; SameSite=Lax`; } catch {}
      setError(getFirebaseErrorMessage(err?.code || ""));
    } finally { setSubmitting(false); }
  }, [email, username, password, submitting]);

  if (info) {
    return (
      <div className="stack">
        <Alert variant="success">
          <strong>Check your email</strong>
          <div style={{ marginTop: 8 }}>We sent a verification link to <strong>{info.email}</strong>.</div>
          <div style={{ marginTop: 8 }}>Click the link, then come back to sign in.</div>
        </Alert>
        <Button onClick={() => { clearPendingVerification(); router.push("/auth/login"); }}>Go to Sign In</Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="stack">
      <Input label="Username" placeholder="Your name or alias" value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="name" />
      <Input label="Email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
      <Input label="Password" type="password" placeholder="Min 6 characters" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
      {error && <Alert variant="error">{error}</Alert>}
      <Button type="submit" disabled={submitting}>{submitting ? "Creating account..." : "Create Account"}</Button>
    </form>
  );
}
