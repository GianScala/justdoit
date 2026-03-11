"use client";
import { FormEvent, useState, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { confirmReset } from "@/features/auth/utils/firebase";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";
import Spinner from "@/components/ui/Spinner";

export default function ResetPasswordPage() { return <Suspense fallback={<Spinner />}><Inner /></Suspense>; }

function Inner() {
  const router = useRouter(); const sp = useSearchParams(); const oob = sp.get("oobCode");
  const [pw, setPw] = useState(""); const [pw2, setPw2] = useState(""); const [submitting, setSubmitting] = useState(false); const [error, setError] = useState<string|null>(null); const [success, setSuccess] = useState(false);

  const handleSubmit = useCallback(async (e: FormEvent) => {
    e.preventDefault(); if (submitting) return; setError(null);
    if (!oob) { setError("Invalid reset code."); return; } if (pw.length < 6) { setError("Min 6 characters."); return; } if (pw !== pw2) { setError("Passwords don't match."); return; }
    try { setSubmitting(true); await confirmReset(oob, pw); setSuccess(true); } catch (err: any) { setError(err.message || "Failed."); } finally { setSubmitting(false); }
  }, [oob, pw, pw2, submitting]);

  return (
    <div className="auth-layout"><div style={{ width: "100%", maxWidth: 460 }}><div className="auth-card">
      <div className="center" style={{ marginBottom: 24 }}><h2 className="auth-heading">Set New Password</h2></div>
      {success ? <Alert variant="success" className="center"><strong>Password updated.</strong><div style={{ marginTop: 16 }}><Button onClick={() => router.push("/auth/login")}>Continue to Sign In</Button></div></Alert> :
      <form onSubmit={handleSubmit} className="stack">
        <div><label className="label">New Password</label><input className="input" type="password" value={pw} onChange={e => setPw(e.target.value)} placeholder="Minimum 6 characters" /></div>
        <div><label className="label">Confirm Password</label><input className="input" type="password" value={pw2} onChange={e => setPw2(e.target.value)} placeholder="Repeat" /></div>
        {error && <Alert variant="error">{error}</Alert>}
        <Button type="submit" disabled={submitting}>{submitting ? "Updating..." : "Update Password"}</Button>
      </form>}
    </div></div></div>
  );
}
