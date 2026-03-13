"use client";

import { doc, getDoc, runTransaction, serverTimestamp, setDoc } from "firebase/firestore";
import { getFirebaseDb } from "@/features/auth/utils/firebase";
import {
  FREE_DAILY_AI_TOKEN_LIMIT,
  UNLIMITED_AI_TOKENS,
} from "@/lib/constants";

export const AI_USAGE_LIMIT_MESSAGE =
  "You've reached your free AI quota for today.";

export interface AiUsageStats {
  tokensUsedToday: number;
  tokensRemainingToday: number;
  lastTokenResetDate: string;
}

function getDailyLimit(data: Record<string, unknown> | undefined): number {
  const subscriptionType = data?.subscriptionType;
  const subscriptionStatus = data?.subscriptionStatus;
  const isPro =
    subscriptionStatus === "active" &&
    (subscriptionType === "pro_monthly" || subscriptionType === "pro_yearly");

  return isPro ? UNLIMITED_AI_TOKENS : FREE_DAILY_AI_TOKEN_LIMIT;
}

function getTodayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function normalizeAiUsage(data: Record<string, unknown> | undefined): AiUsageStats {
  const today = getTodayKey();
  const dailyLimit = getDailyLimit(data);
  const lastTokenResetDate =
    typeof data?.lastTokenResetDate === "string" ? data.lastTokenResetDate : today;

  if (lastTokenResetDate !== today) {
    return {
      tokensUsedToday: 0,
      tokensRemainingToday:
        dailyLimit === UNLIMITED_AI_TOKENS ? UNLIMITED_AI_TOKENS : dailyLimit,
      lastTokenResetDate: today,
    };
  }

  const tokensUsedToday =
    typeof data?.tokensUsedToday === "number" ? data.tokensUsedToday : 0;

  if (dailyLimit === UNLIMITED_AI_TOKENS) {
    return {
      tokensUsedToday,
      tokensRemainingToday: UNLIMITED_AI_TOKENS,
      lastTokenResetDate,
    };
  }

  const tokensRemainingToday = Math.max(0, dailyLimit - tokensUsedToday);

  return {
    tokensUsedToday,
    tokensRemainingToday,
    lastTokenResetDate,
  };
}

export async function syncAiUsage(uid: string): Promise<AiUsageStats> {
  const ref = doc(getFirebaseDb(), "users", uid);
  const snap = await getDoc(ref);
  const normalized = normalizeAiUsage(snap.data() as Record<string, unknown> | undefined);

  const persisted =
    !snap.exists() ||
    normalized.lastTokenResetDate !== (snap.data()?.lastTokenResetDate ?? null) ||
    normalized.tokensUsedToday !== (snap.data()?.tokensUsedToday ?? null) ||
    normalized.tokensRemainingToday !== (snap.data()?.tokensRemainingToday ?? null);

  if (persisted) {
    await setDoc(
      ref,
      {
        ...normalized,
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );
  }

  return normalized;
}

export async function consumeAiTokens(uid: string, amount: number): Promise<AiUsageStats> {
  const ref = doc(getFirebaseDb(), "users", uid);
  const tokensToConsume = Math.max(0, Math.ceil(amount));

  return runTransaction(getFirebaseDb(), async (transaction) => {
    const snap = await transaction.get(ref);
    const normalized = normalizeAiUsage(snap.data() as Record<string, unknown> | undefined);
    const dailyLimit = getDailyLimit(snap.data() as Record<string, unknown> | undefined);

    if (dailyLimit !== UNLIMITED_AI_TOKENS && normalized.tokensRemainingToday <= 0) {
      throw new Error(AI_USAGE_LIMIT_MESSAGE);
    }

    const nextUsed =
      dailyLimit === UNLIMITED_AI_TOKENS
        ? normalized.tokensUsedToday + tokensToConsume
        : Math.min(dailyLimit, normalized.tokensUsedToday + tokensToConsume);
    const nextRemaining =
      dailyLimit === UNLIMITED_AI_TOKENS
        ? UNLIMITED_AI_TOKENS
        : Math.max(0, dailyLimit - nextUsed);
    const nextValue: AiUsageStats = {
      tokensUsedToday: nextUsed,
      tokensRemainingToday: nextRemaining,
      lastTokenResetDate: normalized.lastTokenResetDate,
    };

    transaction.set(
      ref,
      {
        ...nextValue,
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );

    return nextValue;
  });
}
