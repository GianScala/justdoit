"use client";

import { useState, useRef, useEffect, useCallback, type KeyboardEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useTasks } from "@/context/TaskContext";
import {
  readAllTasks,
  readFolders,
  createTask as fsCreateTask,
  updateTask as fsUpdateTask,
  deleteTask as fsDeleteTask,
  createFolder as fsCreateFolder,
} from "@/features/tasks/utils/firestore";
import { takeSnapshot, restoreSnapshot, getSnapshot } from "@/features/ai/snapshots";
import {
  readChatSession,
  writeChatSession,
  clearChatSession,
  type ChatMessage,
} from "@/features/ai/chat-storage";
import {
  AI_USAGE_LIMIT_MESSAGE,
  type AiUsageStats,
  consumeAiTokens,
  syncAiUsage,
} from "@/features/ai/usage";
import { buildStartMyDayMessage } from "@/features/ai/summary";
import { hasProAccess, hasUnlimitedAiTokens } from "@/features/subscription/utils";
import {
  normalizeProposedPlan,
  type ToolCall,
  type ProposedPlan,
} from "@/features/ai/tools";
import UpgradeProModal from "@/components/subscription/UpgradeProModal";

const URL_ACTIONS = new Set(["start_my_day", "what_now", "fix_week"]);

function createMessage(
  role: ChatMessage["role"],
  content: string,
  extras?: Partial<ChatMessage>,
): ChatMessage {
  return {
    id: crypto.randomUUID(),
    role,
    content,
    timestamp: new Date(),
    ...extras,
  };
}

export default function AiChat() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, profile, refreshProfile } = useAuth();
  const { folders, folderNames, overallTasks, refresh, dataLoading } = useTasks();
  const canUseAi = !!user;
  const hasUnlimitedTokens = hasUnlimitedAiTokens(profile);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [storageReady, setStorageReady] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [usageStats, setUsageStats] = useState<AiUsageStats | null>(null);

  const chatRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesRef = useRef<ChatMessage[]>([]);
  const handledUrlActionRef = useRef<string | null>(null);
  const initializedSessionRef = useRef(false);

  const hasSnap = !!getSnapshot();

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const setSessionMessages = useCallback((nextMessages: ChatMessage[]) => {
    messagesRef.current = nextMessages;
    setMessages(nextMessages);
  }, []);

  const appendMessage = useCallback((message: ChatMessage) => {
    setMessages((prev) => {
      const nextMessages = [...prev, message];
      messagesRef.current = nextMessages;
      return nextMessages;
    });
  }, []);

  const showQuotaReachedNotice = useCallback(() => {
    const alreadyShown = messagesRef.current.some(
      (message) =>
        message.role === "assistant" &&
        message.content === AI_USAGE_LIMIT_MESSAGE,
    );

    if (!alreadyShown) {
      appendMessage(createMessage("assistant", AI_USAGE_LIMIT_MESSAGE));
    }
  }, [appendMessage]);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    const container = scrollRef.current;
    if (!container) return;

    requestAnimationFrame(() => {
      container.scrollTo({ top: container.scrollHeight, behavior });
    });
  }, []);

  useEffect(() => {
    scrollToBottom(messages.length > 1 ? "smooth" : "auto");
  }, [messages, loading, scrollToBottom]);

  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;

    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 180)}px`;
  }, [input]);

  useEffect(() => {
    if (!user) {
      setSessionMessages([]);
      setStorageReady(false);
      setUsageStats(null);
      initializedSessionRef.current = false;
      handledUrlActionRef.current = null;
      return;
    }

    setSessionMessages(readChatSession(user.uid));
    setStorageReady(true);
  }, [user, setSessionMessages]);

  useEffect(() => {
    if (!user || !storageReady || !canUseAi) return;
    writeChatSession(user.uid, messages);
  }, [user, storageReady, messages, canUseAi]);

  useEffect(() => {
    if (!user || !canUseAi) return;
    void syncAiUsage(user.uid)
      .then((usage) => {
        setUsageStats(usage);
        return refreshProfile();
      })
      .catch(() => {});
  }, [user, canUseAi, refreshProfile]);

  useEffect(() => {
    if (typeof window === "undefined" || !window.visualViewport || !chatRef.current) return;

    const viewport = window.visualViewport;
    const updateKeyboardOffset = () => {
      if (!chatRef.current) return;
      const keyboardOffset = Math.max(
        0,
        window.innerHeight - viewport.height - viewport.offsetTop,
      );
      chatRef.current.style.setProperty("--ai-keyboard-offset", `${keyboardOffset}px`);
    };

    updateKeyboardOffset();
    viewport.addEventListener("resize", updateKeyboardOffset);
    viewport.addEventListener("scroll", updateKeyboardOffset);

    return () => {
      viewport.removeEventListener("resize", updateKeyboardOffset);
      viewport.removeEventListener("scroll", updateKeyboardOffset);
    };
  }, []);

  const showUpgradeModal = useCallback(() => {
    setUpgradeOpen(true);
  }, []);

  const initializeFreshSession = useCallback(() => {
    if (!canUseAi) return;

    const initialMessage = createMessage(
      "assistant",
      buildStartMyDayMessage(overallTasks, folderNames),
    );
    setSessionMessages([initialMessage]);
  }, [canUseAi, overallTasks, folderNames, setSessionMessages]);

  useEffect(() => {
    if (!user || !storageReady || !canUseAi || dataLoading) return;
    if (messagesRef.current.length > 0 || initializedSessionRef.current) return;

    initializedSessionRef.current = true;
    initializeFreshSession();
  }, [user, storageReady, canUseAi, dataLoading, initializeFreshSession]);

  const gatherContext = useCallback(async () => {
    if (!user) {
      return {
        tasks: [] as Array<Record<string, unknown>>,
        folders: [] as Array<Record<string, unknown>>,
      };
    }

    if (!dataLoading && folders.length > 0) {
      return {
        tasks: overallTasks.map((task) => ({
          id: task.id,
          name: task.name,
          deadline: task.deadline,
          tag: task.tag,
          status: task.status,
          folderId: task.folderId,
        })),
        folders: folders.map((folder) => ({
          id: folder.id,
          name: folder.name,
          locked: folder.locked,
        })),
      };
    }

    const [freshTasks, freshFolders] = await Promise.all([
      readAllTasks(user.uid),
      readFolders(user.uid),
    ]);

    return {
      tasks: freshTasks.map((task) => ({
        id: task.id,
        name: task.name,
        deadline: task.deadline,
        tag: task.tag,
        status: task.status,
        folderId: task.folderId,
      })),
      folders: freshFolders.map((folder) => ({
        id: folder.id,
        name: folder.name,
        locked: folder.locked,
      })),
    };
  }, [user, dataLoading, folders, overallTasks]);

  const executeTool = useCallback(
    async (toolName: string, toolInput: Record<string, unknown>) => {
      if (!user) return;

      switch (toolName) {
        case "update_task": {
          const updates: Record<string, unknown> = {};
          if (toolInput.name !== undefined) updates.name = toolInput.name;
          if (toolInput.deadline !== undefined) updates.deadline = toolInput.deadline;
          if (toolInput.status !== undefined) updates.status = toolInput.status;
          if (toolInput.tag !== undefined) updates.tag = toolInput.tag;
          await fsUpdateTask(
            user.uid,
            toolInput.folder_id as string,
            toolInput.task_id as string,
            updates,
          );
          break;
        }
        case "move_task": {
          const allTasks = await readAllTasks(user.uid);
          const task = allTasks.find(
            (candidate) =>
              candidate.id === toolInput.task_id &&
              candidate.folderId === toolInput.source_folder_id,
          );

          if (task) {
            await fsCreateTask(user.uid, toolInput.target_folder_id as string, {
              name: task.name,
              deadline: task.deadline,
              tag: task.tag,
            });
            await fsDeleteTask(
              user.uid,
              toolInput.source_folder_id as string,
              toolInput.task_id as string,
            );
          }
          break;
        }
        case "create_task": {
          await fsCreateTask(user.uid, (toolInput.folder_id as string) || "personal-tasks", {
            name: toolInput.name as string,
            deadline: (toolInput.deadline as string) || null,
            tag: (toolInput.tag as "standard" | "important" | "urgent") || "standard",
          });
          break;
        }
        case "create_project": {
          await fsCreateFolder(user.uid, toolInput.name as string);
          break;
        }
      }
    },
    [user],
  );

  const executeToolCalls = useCallback(
    async (toolCalls: ToolCall[]) => {
      for (const tool of toolCalls) {
        try {
          await executeTool(tool.name, tool.input);
        } catch (err) {
          console.error(`Tool ${tool.name} failed:`, err);
        }
      }

      await refresh("overall");
    },
    [executeTool, refresh],
  );

  const executePlan = useCallback(
    async (plan: ProposedPlan) => {
      if (!user) return;

      await takeSnapshot(user.uid, plan.plan_title);

      for (const action of plan.actions) {
        try {
          await executeTool(action.tool, action.params);
        } catch (err) {
          console.error(`Plan step failed:`, err);
        }
      }

      await refresh("overall");
    },
    [user, executeTool, refresh],
  );

  const quotaReached =
    !hasUnlimitedTokens &&
    !!usageStats &&
    usageStats.tokensRemainingToday <= 0;

  useEffect(() => {
    if (!quotaReached) return;
    showQuotaReachedNotice();
  }, [quotaReached, showQuotaReachedNotice]);

  const handleUndo = useCallback(async () => {
    if (!user) return;

    setLoading(true);

    try {
      const success = await restoreSnapshot(user.uid);
      await refresh("overall");

      appendMessage(
        createMessage(
          "assistant",
          success
            ? "Previous AI changes restored."
            : "No AI snapshot is available to restore.",
        ),
      );
    } catch {
      appendMessage(
        createMessage("assistant", "Something went wrong while restoring your last changes."),
      );
    } finally {
      setLoading(false);
    }
  }, [user, refresh, appendMessage]);

  const sendToApi = useCallback(
    async (action: string, userMessage?: string, addUserMessage = true) => {
      if (loading || !user) return;

      if (!canUseAi) {
        return;
      }

      const pendingMessages = messagesRef.current;
      let nextHistory = pendingMessages;

      if (addUserMessage && userMessage) {
        const newUserMessage = createMessage("user", userMessage);
        nextHistory = [...pendingMessages, newUserMessage];
        setSessionMessages(nextHistory);
      }

      const usage = await syncAiUsage(user.uid);
      setUsageStats(usage);
      if (!hasUnlimitedTokens && usage.tokensRemainingToday <= 0) {
        showQuotaReachedNotice();
        await refreshProfile();
        return;
      }

      setLoading(true);

      try {
        const context = await gatherContext();
        const conversationHistory = nextHistory
          .slice(-20)
          .filter((message) => message.role !== "system")
          .map((message) => ({
            role: message.role as "user" | "assistant",
            content: message.content,
          }));

        const response = await fetch("/api/ai-assistant", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action,
            message: userMessage,
            context,
            conversationHistory,
          }),
        });

        const data = await response.json().catch(() => null);
        if (!response.ok) {
          throw new Error(data?.error || `HTTP ${response.status}`);
        }

        if (data?.usage?.totalTokens) {
          const updatedUsage = await consumeAiTokens(user.uid, data.usage.totalTokens);
          setUsageStats(updatedUsage);
          await refreshProfile();
        }

        if (data.toolCalls?.length) {
          await executeToolCalls(data.toolCalls);
        }

        const plan = normalizeProposedPlan(data?.plan);

        appendMessage(
          createMessage("assistant", data.message || "Done.", {
            plan,
            planStatus: plan ? "pending" : undefined,
          }),
        );
      } catch (err) {
        appendMessage(
          createMessage(
            "assistant",
            err instanceof Error && err.message === AI_USAGE_LIMIT_MESSAGE
              ? AI_USAGE_LIMIT_MESSAGE
              : `Something went wrong: ${err instanceof Error ? err.message : "Unknown error"}`,
          ),
        );
      } finally {
        setLoading(false);
      }
    },
    [
      loading,
      user,
      canUseAi,
      setSessionMessages,
      refreshProfile,
      gatherContext,
      executeToolCalls,
      appendMessage,
      hasUnlimitedTokens,
      showQuotaReachedNotice,
    ],
  );

  const handleQuickAction = useCallback(
    async (action: "start_my_day" | "what_now" | "fix_week") => {
      if (!canUseAi || quotaReached) {
        return;
      }

      if (action === "start_my_day") {
        appendMessage(createMessage("assistant", buildStartMyDayMessage(overallTasks, folderNames)));
        return;
      }

      const userLabel =
        action === "what_now" ? "What should I do now?" : "Fix my week";
      await sendToApi(action, userLabel, true);
    },
    [canUseAi, quotaReached, overallTasks, folderNames, appendMessage, sendToApi],
  );

  const refreshChat = useCallback(() => {
    if (!user) return;

    clearChatSession(user.uid);
    initializedSessionRef.current = true;
    setSessionMessages([]);
    setInput("");

    if (canUseAi) {
      const freshMessage = createMessage(
        "assistant",
        buildStartMyDayMessage(overallTasks, folderNames),
      );
      setSessionMessages([freshMessage]);
    }
  }, [user, canUseAi, overallTasks, folderNames, setSessionMessages]);

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text) return;

    if (!canUseAi || quotaReached) {
      return;
    }

    if (/^(undo|restore previous|undo last change)/i.test(text)) {
      setInput("");
      appendMessage(createMessage("user", text));
      await handleUndo();
      return;
    }

    setInput("");
    await sendToApi("chat", text, true);
  }, [input, canUseAi, quotaReached, appendMessage, handleUndo, sendToApi]);

  const handlePlanDecision = useCallback(
    async (messageId: string, approved: boolean) => {
      setMessages((prev) =>
        prev.map((message) =>
          message.id === messageId
            ? { ...message, planStatus: approved ? "approved" : "rejected" }
            : message,
        ),
      );

      const message = messagesRef.current.find((entry) => entry.id === messageId);
      const plan = normalizeProposedPlan(message?.plan);
      if (!plan) return;

      if (approved) {
        setLoading(true);

        try {
          await executePlan(plan);
          appendMessage(
            createMessage(
              "assistant",
              `Plan "${plan.plan_title}" applied. Say "undo" to revert it.`,
            ),
          );
        } catch {
          appendMessage(
            createMessage("assistant", "Something went wrong while applying that plan."),
          );
        } finally {
          setLoading(false);
        }

        return;
      }

      appendMessage(createMessage("assistant", "Plan discarded."));
    },
    [executePlan, appendMessage],
  );

  useEffect(() => {
    if (!user || !storageReady) return;

    const urlAction = searchParams.get("action");
    if (!urlAction || !URL_ACTIONS.has(urlAction)) {
      handledUrlActionRef.current = null;
      return;
    }

    if (handledUrlActionRef.current === urlAction) return;
    handledUrlActionRef.current = urlAction;

    router.replace("/dashboard/ai-assistant");
    void handleQuickAction(urlAction as "start_my_day" | "what_now" | "fix_week");
  }, [user, storageReady, searchParams, router, handleQuickAction]);

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void sendMessage();
    }
  };

  const renderPlan = (message: ChatMessage) => {
    const plan = normalizeProposedPlan(message.plan);
    if (!plan) return null;

    const isPending = message.planStatus === "pending";
    const actions = plan.actions;

    return (
      <div className={`ai-plan ${isPending ? "" : "ai-plan-decided"}`}>
        <div className="ai-plan-header">
          <span className="ai-plan-icon">📋</span>
          <span className="ai-plan-title">{plan.plan_title}</span>
        </div>
        <div className="ai-plan-summary">{plan.plan_summary}</div>
        <div className="ai-plan-steps">
          {actions.length > 0 ? (
            actions.map((action, index) => (
              <div key={`${message.id}-${index}`} className="ai-plan-step">
                <span className="ai-plan-step-num">{index + 1}</span>
                <span className="ai-plan-step-text">{action.description}</span>
              </div>
            ))
          ) : (
            <div className="ai-plan-step ai-plan-step-fallback">
              <span className="ai-plan-step-text">
                This plan preview is missing steps. Ask me to regenerate it.
              </span>
            </div>
          )}
        </div>
        {isPending && (
          <div className="ai-plan-actions">
            <button
              className="ai-plan-btn ai-plan-approve"
              onClick={() => void handlePlanDecision(message.id, true)}
              disabled={loading}
            >
              Apply Plan
            </button>
            <button
              className="ai-plan-btn ai-plan-reject"
              onClick={() => void handlePlanDecision(message.id, false)}
              disabled={loading}
            >
              Discard
            </button>
          </div>
        )}
        {message.planStatus === "approved" && (
          <div className="ai-plan-status ai-plan-status-ok">Applied</div>
        )}
        {message.planStatus === "rejected" && (
          <div className="ai-plan-status ai-plan-status-no">Discarded</div>
        )}
      </div>
    );
  };

  const emptyStateText = quotaReached
    ? "You've used today's free AI quota. Switch to Pro for unlimited tokens."
    : "Fresh daily focus will appear here when your session starts.";

  return (
    <>
      <div className="ai-chat" ref={chatRef}>
        <div className="ai-chat-messages" ref={scrollRef}>
          {messages.length === 0 && !loading && (
            <div className="ai-chat-empty">
              <div className="ai-chat-empty-icon">⚡</div>
              <div className="ai-chat-empty-title">Today's Focus</div>
              <div className="ai-chat-empty-text">{emptyStateText}</div>
              {quotaReached && (
                <button
                  type="button"
                  className="ai-quick-btn"
                  onClick={showUpgradeModal}
                >
                  Switch to Pro Plan for unlimited tokens
                </button>
              )}
            </div>
          )}

          {messages.map((message) => (
            <div key={message.id} className={`ai-chat-bubble ai-chat-bubble-${message.role}`}>
              <div className="ai-chat-bubble-label">
                {message.role === "assistant" ? "Assistant" : "You"}
              </div>
              <div className="ai-chat-bubble-content">{message.content}</div>
              {message.plan && renderPlan(message)}
            </div>
          ))}

          {loading && (
            <div className="ai-chat-bubble ai-chat-bubble-assistant">
              <div className="ai-chat-bubble-label">Assistant</div>
              <div className="ai-chat-bubble-content">
                <span className="ai-chat-typing">
                  <span />
                  <span />
                  <span />
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="ai-chat-footer">
          {quotaReached && (
            <div className="ai-chat-upgrade-banner">
              <div className="ai-chat-upgrade-copy">{AI_USAGE_LIMIT_MESSAGE}</div>
              <button
                type="button"
                className="ai-chat-upgrade-btn"
                onClick={showUpgradeModal}
              >
                Switch to Pro Plan for unlimited tokens
              </button>
            </div>
          )}

          <div className="ai-chat-quick-bar">
            <button
              className="ai-quick-btn"
              onClick={() => void handleQuickAction("start_my_day")}
              disabled={loading || quotaReached}
            >
              Start My Day
            </button>
            <button
              className="ai-quick-btn"
              onClick={() => void handleQuickAction("what_now")}
              disabled={loading || quotaReached}
            >
              What should I do now
            </button>
            <button
              className="ai-quick-btn"
              onClick={() => void handleQuickAction("fix_week")}
              disabled={loading || quotaReached}
            >
              Fix my week
            </button>
            <button
              className="ai-quick-btn"
              onClick={refreshChat}
              disabled={loading}
            >
              Refresh
            </button>
            {hasSnap && (
              <button
                className="ai-quick-btn ai-quick-undo"
                onClick={() => void handleUndo()}
                disabled={loading}
              >
                Undo
              </button>
            )}
          </div>

          <div className="ai-chat-input-area">
            <div className="ai-chat-input-row">
              <textarea
                ref={inputRef}
                className="ai-chat-input"
                placeholder={
                  quotaReached
                    ? "Free quota reached. Upgrade to Pro for unlimited tokens."
                    : "Ask AI to plan your work, fix your week, or break down a goal..."
                }
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={() => {
                  scrollToBottom("auto");
                }}
                rows={1}
                disabled={loading || quotaReached}
              />
              <button
                className="ai-chat-send"
                onClick={() => void sendMessage()}
                disabled={!input.trim() || loading || quotaReached}
                aria-label="Send message"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      </div>

      {user && (
        <UpgradeProModal
          open={upgradeOpen}
          onClose={() => setUpgradeOpen(false)}
          uid={user.uid}
          email={user.email}
          title={hasProAccess(profile) ? "Upgrade to Pro" : "Switch to Pro Plan for unlimited tokens"}
          description="Let AI organize your work automatically with unlimited tokens."
        />
      )}
    </>
  );
}
