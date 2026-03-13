"use client";

import { doc, getDoc, runTransaction, serverTimestamp, setDoc } from "firebase/firestore";
import { getFirebaseDb } from "@/features/auth/utils/firebase";
import { DAILY_AI_TOKEN_LIMIT } from "@/lib/constants";

export const AI_USAGE_LIMIT_MESSAGE =
  "You've reached today's AI usage limit. Your quota will reset tomorrow.";

export interface AiUsageStats {
  tokensUsedToday: number;
  tokensRemainingToday: number;
  lastTokenResetDate: string;
}

function getTodayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function normalizeAiUsage(data: Record<string, unknown> | undefined): AiUsageStats {
  const today = getTodayKey();
  const lastTokenResetDate =
    typeof data?.lastTokenResetDate === "string" ? data.lastTokenResetDate : today;

  if (lastTokenResetDate !== today) {
    return {
      tokensUsedToday: 0,
      tokensRemainingToday: DAILY_AI_TOKEN_LIMIT,
      lastTokenResetDate: today,
    };
  }

  const tokensUsedToday =
    typeof data?.tokensUsedToday === "number" ? data.tokensUsedToday : 0;
  const tokensRemainingToday =
    typeof data?.tokensRemainingToday === "number"
      ? data.tokensRemainingToday
      : Math.max(0, DAILY_AI_TOKEN_LIMIT - tokensUsedToday);

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

    if (normalized.tokensRemainingToday <= 0) {
      throw new Error(AI_USAGE_LIMIT_MESSAGE);
    }

    const nextUsed = Math.min(
      DAILY_AI_TOKEN_LIMIT,
      normalized.tokensUsedToday + tokensToConsume,
    );
    const nextRemaining = Math.max(0, DAILY_AI_TOKEN_LIMIT - nextUsed);
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
