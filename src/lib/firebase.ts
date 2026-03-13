import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  signInWithPopup,
  createUserWithEmailAndPassword,
  type Auth,
  type UserCredential,
} from "firebase/auth";
import { getFirestore, doc, getDoc, setDoc, serverTimestamp, type Firestore } from "firebase/firestore";
import { DAILY_AI_TOKEN_LIMIT } from "@/lib/constants";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

function validateFirebaseConfig() {
  const missing = Object.entries(firebaseConfig)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missing.length > 0) {
    throw new Error(
      `Missing Firebase env vars: ${missing.join(", ")}. Check your .env.local file.`,
    );
  }
}

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;

function initFirebase() {
  if (!app) {
    validateFirebaseConfig();

    app = getApps().length ? getApp() : initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
  }

  return { app, auth, db };
}

export function getFirebaseApp() {
  return initFirebase().app;
}

export function getFirebaseAuth() {
  return initFirebase().auth;
}

export function getFirebaseDb() {
  return initFirebase().db;
}

export async function emailSignIn(email: string, password: string): Promise<UserCredential> {
  const firebaseAuth = getFirebaseAuth();
  return signInWithEmailAndPassword(firebaseAuth, email, password);
}

export async function emailSignUpAndCreateProfile(
  email: string,
  password: string,
  displayName?: string,
): Promise<UserCredential> {
  const firebaseAuth = getFirebaseAuth();
  const firebaseDb = getFirebaseDb();

  const result = await createUserWithEmailAndPassword(firebaseAuth, email, password);
  const user = result.user;

  const userRef = doc(firebaseDb, "users", user.uid);

  await setDoc(userRef, {
    uid: user.uid,
    email: user.email ?? email,
    displayName: displayName ?? "",
    photoURL: "",
    provider: "password",
    emailVerified: !!user.emailVerified,
    tokensUsedToday: 0,
    tokensRemainingToday: DAILY_AI_TOKEN_LIMIT,
    lastTokenResetDate: new Date().toISOString().slice(0, 10),
    subscriptionType: "free",
    subscriptionStatus: "inactive",
    subscriptionStartDate: null,
    subscriptionRenewalDate: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return result;
}

export async function signInWithGoogleAndCreateProfile(): Promise<UserCredential> {
  const firebaseAuth = getFirebaseAuth();
  const firebaseDb = getFirebaseDb();

  const provider = new GoogleAuthProvider();
  provider.addScope("email");
  provider.addScope("profile");

  const result = await signInWithPopup(firebaseAuth, provider);
  const user = result.user;

  const userRef = doc(firebaseDb, "users", user.uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    await setDoc(userRef, {
      uid: user.uid,
      email: user.email ?? "",
      displayName: user.displayName ?? "",
      photoURL: user.photoURL ?? "",
      provider: "google.com",
      emailVerified: !!user.emailVerified,
      tokensUsedToday: 0,
      tokensRemainingToday: DAILY_AI_TOKEN_LIMIT,
      lastTokenResetDate: new Date().toISOString().slice(0, 10),
      subscriptionType: "free",
      subscriptionStatus: "inactive",
      subscriptionStartDate: null,
      subscriptionRenewalDate: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  return result;
}
