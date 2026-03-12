"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
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
import type { ToolCall, ProposedPlan, PlanAction } from "@/features/ai/tools";
import type { TaskWithFolder } from "@/types/task";

/* ── Types ────────────────────────────────────────────── */

interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  plan?: ProposedPlan | null;
  planStatus?: "pending" | "approved" | "rejected";
}

/* ── Component ────────────────────────────────────────── */

export default function AiChat() {
  const { user } = useAuth();
  const { refresh } = useTasks();
  const searchParams = useSearchParams();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [initDone, setInitDone] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const hasSnap = !!getSnapshot();

  /* Auto-scroll */
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  /* Auto-resize textarea */
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 120) + "px";
  }, [input]);

  /* ── Gather context ──────────────────────────────────── */
  const gatherContext = useCallback(async () => {
    if (!user) return { tasks: [] as any[], folders: [] as any[] };
    const [tasks, folders] = await Promise.all([
      readAllTasks(user.uid),
      readFolders(user.uid),
    ]);
    return {
      tasks: tasks.map((t) => ({
        id: t.id, name: t.name, deadline: t.deadline,
        tag: t.tag, status: t.status, folderId: t.folderId,
      })),
      folders: folders.map((f) => ({
        id: f.id, name: f.name, locked: f.locked,
      })),
    };
  }, [user]);

  /* ── Execute single tool call ────────────────────────── */
  const executeTool = useCallback(
    async (toolName: string, inp: Record<string, unknown>) => {
      if (!user) return;
      switch (toolName) {
        case "update_task": {
          const updates: Record<string, unknown> = {};
          if (inp.name) updates.name = inp.name;
          if (inp.deadline !== undefined) updates.deadline = inp.deadline;
          if (inp.status) updates.status = inp.status;
          if (inp.tag) updates.tag = inp.tag;
          await fsUpdateTask(user.uid, inp.folder_id as string, inp.task_id as string, updates as any);
          break;
        }
        case "move_task": {
          const allTasks = await readAllTasks(user.uid);
          const task = allTasks.find((t) => t.id === inp.task_id && t.folderId === inp.source_folder_id);
          if (task) {
            await fsCreateTask(user.uid, inp.target_folder_id as string, {
              name: task.name, deadline: task.deadline, tag: task.tag,
            });
            await fsDeleteTask(user.uid, inp.source_folder_id as string, inp.task_id as string);
          }
          break;
        }
        case "create_task": {
          const fid = (inp.folder_id as string) || "personal-tasks";
          await fsCreateTask(user.uid, fid, {
            name: inp.name as string,
            deadline: (inp.deadline as string) || null,
            tag: (inp.tag as any) || "standard",
          });
          break;
        }
        case "create_project": {
          await fsCreateFolder(user.uid, inp.name as string);
          break;
        }
      }
    },
    [user]
  );

  /* ── Execute tool calls + refresh ────────────────────── */
  const executeToolCalls = useCallback(
    async (toolCalls: ToolCall[]) => {
      for (const tool of toolCalls) {
        try { await executeTool(tool.name, tool.input); }
        catch (err) { console.error(`Tool ${tool.name} failed:`, err); }
      }
      await refresh();
    },
    [executeTool, refresh]
  );

  /* ── Execute a validated plan ────────────────────────── */
  const executePlan = useCallback(
    async (plan: ProposedPlan) => {
      if (!user) return;
      /* Take snapshot before applying */
      await takeSnapshot(user.uid, plan.plan_title);
      for (const action of plan.actions) {
        try { await executeTool(action.tool, action.params); }
        catch (err) { console.error(`Plan step failed:`, err); }
      }
      await refresh();
    },
    [user, executeTool, refresh]
  );

  /* ── Undo last plan ─────────────────────────────────── */
  const handleUndo = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const success = await restoreSnapshot(user.uid);
      await refresh();
      const msg: ChatMessage = {
        id: crypto.randomUUID(), role: "assistant", timestamp: new Date(),
        content: success
          ? "Done — I've restored your tasks to the state before the last plan was applied."
          : "No snapshot available to restore.",
      };
      setMessages((prev) => [...prev, msg]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: "assistant", timestamp: new Date(), content: "Something went wrong while restoring. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  }, [user, refresh]);

  /* ── Send API request ────────────────────────────────── */
  const sendToApi = useCallback(
    async (action: string, userMessage?: string, addToChat = true) => {
      if (loading || !user) return;
      if (addToChat && userMessage) {
        const userMsg: ChatMessage = {
          id: crypto.randomUUID(), role: "user", content: userMessage, timestamp: new Date(),
        };
        setMessages((prev) => [...prev, userMsg]);
      }
      setLoading(true);
      try {
        const context = await gatherContext();
        const history = messages.slice(-20).map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));
        const res = await fetch("/api/ai-assistant", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action, message: userMessage, context, conversationHistory: history }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: "Unknown error" }));
          throw new Error(err.error || `HTTP ${res.status}`);
        }
        const data = await res.json();

        /* Execute any direct tool calls */
        if (data.toolCalls?.length) {
          await executeToolCalls(data.toolCalls);
        }

        const assistantMsg: ChatMessage = {
          id: crypto.randomUUID(), role: "assistant", timestamp: new Date(),
          content: data.message || "Done!",
          plan: data.plan || null,
          planStatus: data.plan ? "pending" : undefined,
        };
        setMessages((prev) => [...prev, assistantMsg]);
      } catch (err: any) {
        setMessages((prev) => [
          ...prev,
          { id: crypto.randomUUID(), role: "assistant", timestamp: new Date(), content: `Something went wrong: ${err.message}` },
        ]);
      } finally {
        setLoading(false);
      }
    },
    [loading, user, messages, gatherContext, executeToolCalls]
  );

  /* ── Send chat message ───────────────────────────────── */
  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text) return;
    /* Check for undo command */
    if (/^(undo|restore previous|undo last change)/i.test(text)) {
      setInput("");
      const userMsg: ChatMessage = { id: crypto.randomUUID(), role: "user", content: text, timestamp: new Date() };
      setMessages((prev) => [...prev, userMsg]);
      await handleUndo();
      return;
    }
    setInput("");
    await sendToApi("chat", text, true);
  }, [input, sendToApi, handleUndo]);

  /* ── Handle plan approval/rejection ──────────────────── */
  const handlePlanDecision = useCallback(
    async (msgId: string, approved: boolean) => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === msgId ? { ...m, planStatus: approved ? "approved" : "rejected" } : m
        )
      );
      const msg = messages.find((m) => m.id === msgId);
      if (approved && msg?.plan) {
        setLoading(true);
        try {
          await executePlan(msg.plan);
          setMessages((prev) => [
            ...prev,
            {
              id: crypto.randomUUID(), role: "assistant", timestamp: new Date(),
              content: `Plan "${msg.plan!.plan_title}" applied successfully. You can say "undo" to revert these changes.`,
            },
          ]);
        } catch {
          setMessages((prev) => [
            ...prev,
            { id: crypto.randomUUID(), role: "assistant", timestamp: new Date(), content: "Something went wrong applying the plan." },
          ]);
        } finally {
          setLoading(false);
        }
      } else if (!approved) {
        setMessages((prev) => [
          ...prev,
          { id: crypto.randomUUID(), role: "assistant", timestamp: new Date(), content: "Plan discarded. Let me know if you'd like me to adjust it." },
        ]);
      }
    },
    [messages, executePlan]
  );

  /* ── Quick actions ───────────────────────────────────── */
  const handleQuickAction = useCallback(
    (action: string) => {
      const labels: Record<string, string> = {
        start_my_day: "☀️ Start My Day",
        what_now: "🎯 What should I do now?",
        fix_week: "🔧 Fix my week",
      };
      const userMsg: ChatMessage = {
        id: crypto.randomUUID(), role: "user",
        content: labels[action] || action, timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMsg]);
      sendToApi(action, undefined, false);
    },
    [sendToApi]
  );

  /* ── Proactive opening + auto-action from URL params ─── */
  useEffect(() => {
    if (initDone || !user) return;
    setInitDone(true);

    const urlAction = searchParams.get("action");
    if (urlAction && ["start_my_day", "what_now", "fix_week"].includes(urlAction)) {
      handleQuickAction(urlAction);
    } else {
      /* Send proactive opening message */
      (async () => {
        setLoading(true);
        try {
          const context = await gatherContext();
          const res = await fetch("/api/ai-assistant", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "proactive", context }),
          });
          if (res.ok) {
            const data = await res.json();
            if (data.message) {
              setMessages([{
                id: crypto.randomUUID(), role: "assistant",
                content: data.message, timestamp: new Date(),
              }]);
            }
          }
        } catch { /* silent */ }
        finally { setLoading(false); }
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, initDone]);

  /* ── Keyboard ────────────────────────────────────────── */
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  /* ── Render plan preview ─────────────────────────────── */
  const renderPlan = (msg: ChatMessage) => {
    if (!msg.plan) return null;
    const p = msg.plan;
    const isPending = msg.planStatus === "pending";

    return (
      <div className={`ai-plan ${isPending ? "" : "ai-plan-decided"}`}>
        <div className="ai-plan-header">
          <span className="ai-plan-icon">📋</span>
          <span className="ai-plan-title">{p.plan_title}</span>
        </div>
        <div className="ai-plan-summary">{p.plan_summary}</div>
        <div className="ai-plan-steps">
          {p.actions.map((a, i) => (
            <div key={i} className="ai-plan-step">
              <span className="ai-plan-step-num">{i + 1}</span>
              <span className="ai-plan-step-text">{a.description}</span>
            </div>
          ))}
        </div>
        {isPending && (
          <div className="ai-plan-actions">
            <button
              className="ai-plan-btn ai-plan-approve"
              onClick={() => handlePlanDecision(msg.id, true)}
              disabled={loading}
            >
              ✓ Apply Plan
            </button>
            <button
              className="ai-plan-btn ai-plan-reject"
              onClick={() => handlePlanDecision(msg.id, false)}
              disabled={loading}
            >
              ✕ Discard
            </button>
          </div>
        )}
        {msg.planStatus === "approved" && (
          <div className="ai-plan-status ai-plan-status-ok">✓ Applied</div>
        )}
        {msg.planStatus === "rejected" && (
          <div className="ai-plan-status ai-plan-status-no">✕ Discarded</div>
        )}
      </div>
    );
  };

  /* ── Render ──────────────────────────────────────────── */
  return (
    <div className="ai-chat">
      {/* Messages */}
      <div className="ai-chat-messages" ref={scrollRef}>
        {messages.length === 0 && !loading && (
          <div className="ai-chat-empty">
            <div className="ai-chat-empty-icon">⚡</div>
            <div className="ai-chat-empty-title">AI Assistant</div>
            <div className="ai-chat-empty-text">
              Your personal AI project manager. I plan, organise, and keep you on track.
            </div>
          </div>
        )}

        {messages.map((m) => (
          <div key={m.id} className={`ai-chat-bubble ai-chat-bubble-${m.role}`}>
            <div className="ai-chat-bubble-label">
              {m.role === "user" ? "You" : "Assistant"}
            </div>
            <div className="ai-chat-bubble-content">{m.content}</div>
            {m.plan && renderPlan(m)}
          </div>
        ))}

        {loading && (
          <div className="ai-chat-bubble ai-chat-bubble-assistant">
            <div className="ai-chat-bubble-label">Assistant</div>
            <div className="ai-chat-bubble-content">
              <span className="ai-chat-typing"><span /><span /><span /></span>
            </div>
          </div>
        )}
      </div>

      {/* Quick actions + undo */}
      <div className="ai-chat-quick-bar">
        <button className="ai-quick-btn" onClick={() => handleQuickAction("start_my_day")} disabled={loading}>
          ☀️ Start My Day
        </button>
        <button className="ai-quick-btn" onClick={() => handleQuickAction("what_now")} disabled={loading}>
          🎯 What Now?
        </button>
        <button className="ai-quick-btn" onClick={() => handleQuickAction("fix_week")} disabled={loading}>
          🔧 Fix Week
        </button>
        {hasSnap && (
          <button className="ai-quick-btn ai-quick-undo" onClick={handleUndo} disabled={loading}>
            ↺ Undo
          </button>
        )}
      </div>

      {/* Input */}
      <div className="ai-chat-input-area">
        <div className="ai-chat-input-row">
          <textarea
            ref={inputRef}
            className="ai-chat-input"
            placeholder="Tell me your goals or ask about tasks…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            disabled={loading}
          />
          <button
            className="ai-chat-send"
            onClick={sendMessage}
            disabled={!input.trim() || loading}
            aria-label="Send message"
          >
            ↑
          </button>
        </div>
      </div>
    </div>
  );
}
