"use client";
import { createContext, useContext, useEffect, useState, ReactNode, useCallback, useMemo } from "react";
import { onAuthStateChanged, User, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { getFirebaseAuth, getFirebaseDb, ensureUserProfile, checkGoogleRedirectResult } from "@/features/auth/utils/firebase";
import { PENDING_KEY, PENDING_COOKIE, PENDING_EXPIRY_MS } from "@/lib/constants";
import type { UserProfile } from "@/types/user";
import type { PendingVerification, RedirectResult } from "@/types/auth";

interface AuthContextValue {
  user: User | null; profile: UserProfile | null; loading: boolean;
  signOutUser: () => Promise<void>; refreshProfile: () => Promise<void>;
  redirectResult: RedirectResult; clearRedirectResult: () => void;
  pendingVerification: PendingVerification; isPendingVerification: boolean; clearPendingVerification: () => void;
}

function getCookie(n: string) { if (typeof document === "undefined") return null; try { const m = document.cookie.match(new RegExp("(^| )" + n + "=([^;]+)")); return m ? decodeURIComponent(m[2]) : null; } catch { return null; } }
function hasPendingCookie() { return getCookie(PENDING_COOKIE) === "1"; }
function clearPendingStorage() { if (typeof window === "undefined") return; try { sessionStorage.removeItem(PENDING_KEY); } catch {} try { document.cookie = `${PENDING_COOKIE}=; Max-Age=0; Path=/; SameSite=Lax`; } catch {} }
function readPending(): PendingVerification { if (typeof window === "undefined") return null; try { const r = sessionStorage.getItem(PENDING_KEY); if (!r) return null; const d = JSON.parse(r); if (d?.timestamp && Date.now() - d.timestamp > PENDING_EXPIRY_MS) { clearPendingStorage(); return null; } return d; } catch { return null; } }
function checkPending() { const c = hasPendingCookie(); const p = readPending(); if (c && !p) return { isPending: true, payload: { email: "", userId: "" } as PendingVerification }; return { isPending: c || !!p, payload: p }; }

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [redirectResult, setRedirectResult] = useState<RedirectResult>(null);
  const [pendingVerification, setPendingVerification] = useState<PendingVerification>(null);

  const isPendingVerification = useMemo(() => mounted ? !!pendingVerification || hasPendingCookie() : false, [pendingVerification, mounted]);

  const loadProfile = useCallback(async (u: User) => {
    try { const db = getFirebaseDb(); await ensureUserProfile(u); const s = await getDoc(doc(db, "users", u.uid)); if (s.exists()) setProfile({ id: u.uid, ...(s.data() as Omit<UserProfile, "id">) }); else setProfile(null); }
    catch { setProfile(null); }
  }, []);

  useEffect(() => {
    const auth = getFirebaseAuth(); let m = true; setMounted(true);
    setPendingVerification(checkPending().payload);
    checkGoogleRedirectResult().then(r => { if (r && m) setRedirectResult(r); }).catch(() => {});
    const unsub = onAuthStateChanged(auth, async (u) => { if (!m) return; setUser(u); if (u) await loadProfile(u); else setProfile(null); setPendingVerification(checkPending().payload); setLoading(false); });
    return () => { m = false; unsub(); };
  }, [loadProfile]);

  const refreshProfile = useCallback(async () => { if (user) await loadProfile(user); }, [user, loadProfile]);
  const signOutUser = useCallback(async () => { try { await signOut(getFirebaseAuth()); } finally { setProfile(null); setUser(null); } }, []);
  const clearRedirectResult = useCallback(() => setRedirectResult(null), []);
  const clearPendingVerification = useCallback(() => { clearPendingStorage(); setPendingVerification(null); }, []);

  const value = useMemo(() => ({ user, profile, loading, signOutUser, refreshProfile, redirectResult, clearRedirectResult, pendingVerification, isPendingVerification, clearPendingVerification }),
    [user, profile, loading, signOutUser, refreshProfile, redirectResult, clearRedirectResult, pendingVerification, isPendingVerification, clearPendingVerification]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() { const c = useContext(AuthContext); if (!c) throw new Error("useAuth must be used within AuthProvider"); return c; }
