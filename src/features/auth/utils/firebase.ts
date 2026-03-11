"use client";
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendEmailVerification, sendPasswordResetEmail, confirmPasswordReset, applyActionCode, signOut, updateProfile, getRedirectResult, signInWithRedirect } from "firebase/auth";
import { doc, getDoc, getFirestore, serverTimestamp, setDoc } from "firebase/firestore";

const cfg = { apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!, authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!, projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!, storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!, messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!, appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID! };
const app = getApps().length ? getApp() : initializeApp(cfg);

export function getFirebaseAuth() { return getAuth(app); }
export function getFirebaseDb() { return getFirestore(app); }

export async function ensureUserProfile(user: { uid: string; email: string | null; displayName: string | null; photoURL?: string | null; emailVerified: boolean; providerData?: Array<{ providerId?: string | null }>; }) {
  const db = getFirebaseDb(); const ref = doc(db, "users", user.uid); const snap = await getDoc(ref);
  const payload = { email: user.email ?? "", displayName: user.displayName ?? "", photoURL: user.photoURL ?? "", provider: user.providerData?.[0]?.providerId ?? "password", emailVerified: !!user.emailVerified, updatedAt: serverTimestamp() };
  if (!snap.exists()) await setDoc(ref, { ...payload, createdAt: serverTimestamp() }); else await setDoc(ref, payload, { merge: true });
}

export async function emailSignIn(email: string, password: string) { const auth = getFirebaseAuth(); const cred = await signInWithEmailAndPassword(auth, email, password); await cred.user.reload(); await ensureUserProfile(cred.user); return cred; }

export async function emailSignUpAndCreateProfile(email: string, password: string, username: string) {
  const auth = getFirebaseAuth(); const cred = await createUserWithEmailAndPassword(auth, email, password);
  if (username.trim()) await updateProfile(cred.user, { displayName: username.trim() });
  await ensureUserProfile({ ...cred.user, displayName: username.trim() || cred.user.displayName });
  await sendEmailVerification(cred.user, { url: `${window.location.origin}/auth/verify-email`, handleCodeInApp: false });
  return cred;
}

export async function signInWithGoogleAndCreateProfile() {
  const auth = getFirebaseAuth(); const provider = new GoogleAuthProvider(); provider.setCustomParameters({ prompt: "select_account" });
  const cred = await signInWithPopup(auth, provider); await ensureUserProfile(cred.user);
  const db = getFirebaseDb(); const snap = await getDoc(doc(db, "users", cred.user.uid));
  return { isNewUser: !snap.exists(), hasHandle: !!snap.data()?.displayName };
}

export async function checkGoogleRedirectResult() {
  const auth = getFirebaseAuth(); const result = await getRedirectResult(auth); if (!result?.user) return null;
  await ensureUserProfile(result.user); const db = getFirebaseDb(); const snap = await getDoc(doc(db, "users", result.user.uid));
  return { isNewUser: !snap.exists(), hasHandle: !!snap.data()?.displayName };
}

export async function sendResetEmail(email: string) { return sendPasswordResetEmail(getFirebaseAuth(), email, { url: `${window.location.origin}/auth/reset-password`, handleCodeInApp: false }); }
export async function confirmReset(code: string, password: string) { return confirmPasswordReset(getFirebaseAuth(), code, password); }
export async function applyVerificationCode(code: string) { return applyActionCode(getFirebaseAuth(), code); }
export async function signOutFirebase() { return signOut(getFirebaseAuth()); }
