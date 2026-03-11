"use client";
import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { getFirebaseDb, applyVerificationCode } from "@/features/auth/utils/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { PENDING_KEY, PENDING_COOKIE } from "@/lib/constants";
import Button from "@/components/ui/Button";
import Spinner from "@/components/ui/Spinner";

function clear() { try { sessionStorage.removeItem(PENDING_KEY); } catch {} try { document.cookie = `${PENDING_COOKIE}=; Max-Age=0; Path=/; SameSite=Lax`; } catch {} }

export default function VerifyEmailPage() { return <Suspense fallback={<Spinner />}><Inner /></Suspense>; }

function Inner() {
  const sp = useSearchParams(); const router = useRouter();
  const [status, setStatus] = useState<"loading"|"success"|"error">("loading");
  const [msg, setMsg] = useState("Verifying your email...");

  useEffect(() => { setTimeout(() => verify(), 150); }, []);

  async function verify() {
    let code = sp.get("oobCode"); let mode = sp.get("mode");
    if ((!code || !mode) && typeof window !== "undefined") { const u = new URLSearchParams(window.location.search); code = u.get("oobCode"); mode = u.get("mode"); }
    if (!code || mode !== "verifyEmail") { setStatus("error"); setMsg("Invalid verification link."); return; }
    try { await applyVerificationCode(code); const r = sessionStorage.getItem(PENDING_KEY); const p = r ? JSON.parse(r) : null; if (p?.userId) await updateDoc(doc(getFirebaseDb(), "users", p.userId), { emailVerified: true }); clear(); setStatus("success"); setMsg("Email verified! Redirecting..."); setTimeout(() => router.push("/auth/login"), 2500); }
    catch { setStatus("error"); setMsg("Failed to verify email."); }
  }

  return (
    <div className="auth-layout"><div style={{ width: "100%", maxWidth: 460 }}><div className="auth-card center">
      <h2 className="auth-heading">{status === "loading" ? "Verifying" : status === "success" ? "Verified" : "Failed"}</h2>
      <p className="auth-subheading">{msg}</p>
      {status === "error" && <div className="stack" style={{ marginTop: 20 }}><Button onClick={() => router.push("/auth/register")}>New Verification</Button><Button variant="secondary" onClick={() => router.push("/auth/login")}>Sign In</Button></div>}
      {status === "success" && <div style={{ marginTop: 20 }}><Button onClick={() => router.push("/auth/login")}>Continue</Button></div>}
    </div></div></div>
  );
}
