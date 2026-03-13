"use client";

import type { ProposedPlan } from "@/features/ai/tools";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  plan?: ProposedPlan | null;
  planStatus?: "pending" | "approved" | "rejected";
}

interface StoredChatMessage {
  id: string;
  role: ChatMessage["role"];
  content: string;
  timestamp: string;
  plan?: ProposedPlan | null;
  planStatus?: ChatMessage["planStatus"];
}

interface StoredChatSession {
  version: 1;
  messages: StoredChatMessage[];
}

const STORAGE_PREFIX = "justdoit:ai-chat:v1:";
const MAX_STORED_MESSAGES = 80;

function getStorageKey(uid: string): string {
  return `${STORAGE_PREFIX}${uid}`;
}

export function readChatSession(uid: string): ChatMessage[] {
  if (typeof window === "undefined") return [];

  try {
    const storageKey = getStorageKey(uid);
    const raw = window.sessionStorage.getItem(storageKey);
    window.localStorage.removeItem(storageKey);
    if (!raw) return [];

    const parsed = JSON.parse(raw) as StoredChatSession;
    if (parsed?.version !== 1 || !Array.isArray(parsed.messages)) return [];

    return parsed.messages
      .filter((message) => message && typeof message.id === "string" && typeof message.content === "string")
      .map((message) => ({
        id: message.id,
        role: message.role,
        content: message.content,
        timestamp: new Date(message.timestamp),
        plan: message.plan ?? null,
        planStatus: message.planStatus,
      }));
  } catch {
    return [];
  }
}

export function writeChatSession(uid: string, messages: ChatMessage[]) {
  if (typeof window === "undefined") return;

  const payload: StoredChatSession = {
    version: 1,
    messages: messages.slice(-MAX_STORED_MESSAGES).map((message) => ({
      id: message.id,
      role: message.role,
      content: message.content,
      timestamp: message.timestamp.toISOString(),
      plan: message.plan ?? null,
      planStatus: message.planStatus,
    })),
  };

  try {
    window.sessionStorage.setItem(getStorageKey(uid), JSON.stringify(payload));
  } catch {
    /* Ignore storage failures so chat remains usable. */
  }
}

export function clearChatSession(uid: string) {
  if (typeof window === "undefined") return;

  const storageKey = getStorageKey(uid);
  try {
    window.sessionStorage.removeItem(storageKey);
    window.localStorage.removeItem(storageKey);
  } catch {
    /* Ignore storage failures so reset remains safe. */
  }
}
