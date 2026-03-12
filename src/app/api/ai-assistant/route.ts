import { NextRequest, NextResponse } from "next/server";
import { AI_TOOLS } from "@/features/ai/tools";
import type { ProposedPlan } from "@/features/ai/tools";

/* ── Types ────────────────────────────────────────────── */

interface TaskCtx {
  id: string;
  name: string;
  deadline: string | null;
  tag: string;
  status: string;
  folderId: string;
}

interface FolderCtx {
  id: string;
  name: string;
  locked?: boolean;
}

interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
}

interface RequestBody {
  action: "chat" | "proactive" | "start_my_day" | "what_now" | "fix_week";
  message?: string;
  context: { tasks: TaskCtx[]; folders: FolderCtx[] };
  conversationHistory?: ConversationMessage[];
}

/* ── Helpers ──────────────────────────────────────────── */

function greetingTime(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function buildSystemPrompt(folders: FolderCtx[], tasks: TaskCtx[]): string {
  const today = new Date().toISOString().slice(0, 10);

  const folderList = folders
    .map((f) => `  - "${f.name}" (id: ${f.id}${f.locked ? ", default" : ""})`)
    .join("\n");

  const active = tasks.filter((t) => t.status !== "completed");
  const overdue = active.filter(
    (t) => t.deadline && t.deadline < today
  );
  const dueToday = active.filter((t) => t.deadline === today);
  const upcoming = active
    .filter((t) => t.deadline && t.deadline > today)
    .sort((a, b) => a.deadline!.localeCompare(b.deadline!))
    .slice(0, 15);

  const taskBlock = (label: string, arr: TaskCtx[]) =>
    arr.length === 0
      ? `${label}: none`
      : `${label} (${arr.length}):\n` +
        arr
          .map(
            (t) =>
              `  - [${t.status}] "${t.name}" | deadline: ${t.deadline || "none"} | priority: ${t.tag} | folder: ${t.folderId} | id: ${t.id}`
          )
          .join("\n");

  const todoCount = tasks.filter((t) => t.status === "todo").length;
  const ipCount = tasks.filter((t) => t.status === "inprogress").length;
  const doneCount = tasks.filter((t) => t.status === "completed").length;

  return `You are the JustDoIt AI Assistant — a proactive personal AI project manager.
Today: ${today}. ${greetingTime()}.

USER'S DATA:
${tasks.length} tasks total (${todoCount} to-do, ${ipCount} in-progress, ${doneCount} completed) across ${folders.length} projects.

Projects:
${folderList}

${taskBlock("OVERDUE", overdue)}

${taskBlock("DUE TODAY", dueToday)}

${taskBlock("UPCOMING (next 15)", upcoming)}

YOUR ROLE:
You are NOT a simple CRUD chatbot. You are a personal AI project manager.
- Interpret goals and turn them into actionable plans.
- Proactively surface what matters: overdue items, today's priorities, workload issues.
- When the user describes a goal (like "I need to prepare a Ferrari interview"), break it into steps, choose or create the right project, and set smart deadlines.
- Keep answers SHORT, action-oriented, and calm. No walls of text.
- Use plain text, not markdown. Use line breaks for readability.

CRITICAL RULES:
1. ALWAYS use propose_plan when creating 2+ tasks, creating a project with tasks, reorganizing multiple tasks, or fixing a schedule. NEVER directly create multiple items without a plan.
2. For single simple actions (mark done, rename one task, create one task), use the direct tools.
3. Never invent task IDs or folder IDs — match from context above.
4. For date arithmetic (e.g. "postpone by one week"), calculate from the task's current deadline.
5. If ambiguous, ask for clarification — but prefer making smart assumptions over asking too many questions.
6. When proposing a plan, include realistic deadlines spread across days, not all on the same day.`;
}

function buildProactivePrompt(folders: FolderCtx[], tasks: TaskCtx[]): string {
  const today = new Date().toISOString().slice(0, 10);
  const active = tasks.filter((t) => t.status !== "completed");
  const overdue = active.filter((t) => t.deadline && t.deadline < today);
  const dueToday = active.filter((t) => t.deadline === today);
  const urgent = active.filter((t) => t.tag === "urgent");
  const inProgress = active.filter((t) => t.status === "inprogress");

  return `Generate a proactive opening message for the user. Be their AI project manager.
Today: ${today}. ${greetingTime()}.

Stats: ${active.length} active tasks, ${overdue.length} overdue, ${dueToday.length} due today, ${urgent.length} urgent, ${inProgress.length} in progress.

${overdue.length > 0 ? "Overdue tasks:\n" + overdue.map((t) => `- "${t.name}" (was due ${t.deadline})`).join("\n") : "No overdue tasks."}
${dueToday.length > 0 ? "Due today:\n" + dueToday.map((t) => `- "${t.name}" [${t.tag}]`).join("\n") : "Nothing due today."}
${urgent.length > 0 ? "Urgent:\n" + urgent.map((t) => `- "${t.name}" (due ${t.deadline || "no date"})`).join("\n") : ""}

Write 2-4 SHORT sentences. Be specific about task names. Mention the most important thing first.
Format: plain text, line breaks for clarity. No markdown. No bullet points.
If everything is calm, say so and offer to help plan ahead.
End with one brief, actionable offer — not a list of options.`;
}

function buildStartMyDayPrompt(folders: FolderCtx[], tasks: TaskCtx[]): string {
  const today = new Date().toISOString().slice(0, 10);
  const active = tasks.filter((t) => t.status !== "completed");
  const overdue = active.filter((t) => t.deadline && t.deadline < today);
  const dueToday = active.filter((t) => t.deadline === today);
  const dueSoon = active
    .filter((t) => t.deadline && t.deadline > today && t.deadline <= new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10))
    .sort((a, b) => a.deadline!.localeCompare(b.deadline!));
  const inProgress = active.filter((t) => t.status === "inprogress");

  return `Generate a "Start My Day" briefing. Be a calm, focused AI project manager.
Today: ${today}.

Active: ${active.length} tasks. Overdue: ${overdue.length}. Due today: ${dueToday.length}. Due within 3 days: ${dueSoon.length}. In-progress: ${inProgress.length}.

${overdue.map((t) => `OVERDUE: "${t.name}" (${t.deadline}) [${t.tag}] in ${t.folderId}`).join("\n")}
${dueToday.map((t) => `TODAY: "${t.name}" [${t.tag}] in ${t.folderId}`).join("\n")}
${dueSoon.map((t) => `SOON: "${t.name}" (${t.deadline}) [${t.tag}]`).join("\n")}
${inProgress.map((t) => `IN PROGRESS: "${t.name}" [${t.tag}]`).join("\n")}

Write a concise daily briefing:
1. Top priority (one task, be specific)
2. Today's focus list (2-4 items max, with task names)
3. One warning if there are overdue items or conflicts
4. One actionable suggestion

Keep it SHORT — this is a quick daily glance, not a report.
Use plain text with line breaks. No markdown, no bullet points, no headers.`;
}

function buildWhatNowPrompt(tasks: TaskCtx[]): string {
  const today = new Date().toISOString().slice(0, 10);
  const active = tasks.filter((t) => t.status !== "completed");
  const overdue = active.filter((t) => t.deadline && t.deadline < today);
  const dueToday = active.filter((t) => t.deadline === today);
  const urgent = active.filter((t) => t.tag === "urgent" && t.status !== "completed");
  const inProgress = active.filter((t) => t.status === "inprogress");

  const candidates = [...overdue, ...dueToday, ...urgent, ...inProgress, ...active].slice(0, 10);

  return `Pick exactly ONE task the user should work on right now. Be decisive.
Today: ${today}.

Candidates (priority order):
${candidates.map((t) => `- "${t.name}" | status: ${t.status} | deadline: ${t.deadline || "none"} | priority: ${t.tag} | folder: ${t.folderId}`).join("\n")}

Priority logic: overdue > due today > urgent > in-progress > upcoming.
Tie-break by deadline (sooner first), then priority (urgent > important > standard).

Respond in 1-2 sentences MAX. Name the specific task and why.
If applicable, suggest a quick action like "Start it now?" or "Mark it done?".
Plain text only. No markdown.`;
}

function buildFixWeekPrompt(folders: FolderCtx[], tasks: TaskCtx[]): string {
  const today = new Date().toISOString().slice(0, 10);
  const weekEnd = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
  const active = tasks.filter((t) => t.status !== "completed");
  const overdue = active.filter((t) => t.deadline && t.deadline < today);
  const thisWeek = active.filter(
    (t) => t.deadline && t.deadline >= today && t.deadline <= weekEnd
  );

  return `The user wants to fix their week. Analyze their schedule and propose a reorganization plan using the propose_plan tool.
Today: ${today}. End of week: ${weekEnd}.

Projects: ${folders.map((f) => `"${f.name}" (${f.id})`).join(", ")}

Overdue (${overdue.length}):
${overdue.map((t) => `- "${t.name}" (due ${t.deadline}) [${t.tag}] id:${t.id} folder:${t.folderId}`).join("\n") || "none"}

This week (${thisWeek.length}):
${thisWeek.map((t) => `- "${t.name}" (due ${t.deadline}) [${t.tag}] status:${t.status} id:${t.id} folder:${t.folderId}`).join("\n") || "none"}

All active (${active.length}):
${active.map((t) => `- "${t.name}" (due ${t.deadline || "none"}) [${t.tag}] status:${t.status} id:${t.id} folder:${t.folderId}`).join("\n")}

Create a propose_plan that:
1. Reschedules overdue tasks to realistic dates this week or next
2. Spreads out tasks that are all due on the same day
3. Prioritises urgent/important items for earlier dates
4. Keeps in-progress tasks mostly stable

Add a brief plain-text summary explaining what you changed and why. Be specific.`;
}

function resolveGetTasks(tasks: TaskCtx[], input: Record<string, unknown>): string {
  const filter = (input.status_filter as string) || "all";
  const filtered = filter === "all" ? tasks : tasks.filter((t) => t.status === filter);
  return JSON.stringify(filtered, null, 2);
}

/* ── Call Claude ──────────────────────────────────────── */

async function callClaude(
  apiKey: string,
  system: string,
  messages: Array<{ role: string; content: unknown }>,
  useTools: boolean
): Promise<any> {
  const body: any = {
    model: "claude-sonnet-4-20250514",
    max_tokens: 1500,
    system,
    messages,
  };
  if (useTools) body.tools = AI_TOOLS as any;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error("Claude API error:", res.status, errText);
    throw new Error(`Claude API error: ${res.status}`);
  }

  return res.json();
}

/* ── Main handler ─────────────────────────────────────── */

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY is not configured on the server." },
      { status: 500 }
    );
  }

  let body: RequestBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { action, message, context, conversationHistory } = body;
  if (!context) {
    return NextResponse.json({ error: "Missing context." }, { status: 400 });
  }

  try {
    /* ── Proactive opening message ─────────────────── */
    if (action === "proactive") {
      const prompt = buildProactivePrompt(context.folders, context.tasks);
      const data = await callClaude(apiKey, prompt, [{ role: "user", content: "Generate my opening briefing." }], false);
      const text = (data.content ?? [])
        .filter((b: any) => b.type === "text")
        .map((b: any) => b.text)
        .join("\n");
      return NextResponse.json({ message: text, toolCalls: [], plan: null });
    }

    /* ── Start My Day ──────────────────────────────── */
    if (action === "start_my_day") {
      const prompt = buildStartMyDayPrompt(context.folders, context.tasks);
      const data = await callClaude(apiKey, prompt, [{ role: "user", content: "Give me my daily briefing." }], false);
      const text = (data.content ?? [])
        .filter((b: any) => b.type === "text")
        .map((b: any) => b.text)
        .join("\n");
      return NextResponse.json({ message: text, toolCalls: [], plan: null });
    }

    /* ── What should I do now? ─────────────────────── */
    if (action === "what_now") {
      const prompt = buildWhatNowPrompt(context.tasks);
      const data = await callClaude(apiKey, prompt, [{ role: "user", content: "What should I do right now?" }], false);
      const text = (data.content ?? [])
        .filter((b: any) => b.type === "text")
        .map((b: any) => b.text)
        .join("\n");
      return NextResponse.json({ message: text, toolCalls: [], plan: null });
    }

    /* ── Fix my week ───────────────────────────────── */
    if (action === "fix_week") {
      const systemPrompt = buildFixWeekPrompt(context.folders, context.tasks);
      const messages: Array<{ role: string; content: unknown }> = [
        { role: "user", content: "Fix my week. Reorganize my schedule." },
      ];

      /* Run tool loop for fix_week since it uses propose_plan */
      return await runToolLoop(apiKey, systemPrompt, messages, context);
    }

    /* ── Regular chat ──────────────────────────────── */
    if (!message) {
      return NextResponse.json({ error: "Missing message." }, { status: 400 });
    }

    const systemPrompt = buildSystemPrompt(context.folders, context.tasks);
    const messages: Array<{ role: string; content: unknown }> = [];

    for (const msg of conversationHistory ?? []) {
      messages.push({ role: msg.role, content: msg.content });
    }
    messages.push({ role: "user", content: message });

    return await runToolLoop(apiKey, systemPrompt, messages, context);
  } catch (err: any) {
    console.error("AI route error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to reach Claude API." },
      { status: 502 }
    );
  }
}

/* ── Tool-use loop ────────────────────────────────────── */

async function runToolLoop(
  apiKey: string,
  systemPrompt: string,
  messages: Array<{ role: string; content: unknown }>,
  context: { tasks: TaskCtx[]; folders: FolderCtx[] }
) {
  const MAX_LOOPS = 6;
  const pendingToolCalls: Array<{ id: string; name: string; input: Record<string, unknown> }> = [];
  let plan: ProposedPlan | null = null;
  let finalText = "";

  for (let i = 0; i < MAX_LOOPS; i++) {
    const data = await callClaude(apiKey, systemPrompt, messages, true);
    const contentBlocks: any[] = data.content ?? [];
    const textParts: string[] = [];
    const toolUseBlocks: Array<{ id: string; name: string; input: Record<string, unknown> }> = [];

    for (const block of contentBlocks) {
      if (block.type === "text") textParts.push(block.text);
      else if (block.type === "tool_use") {
        toolUseBlocks.push({ id: block.id, name: block.name, input: block.input });
      }
    }

    if (toolUseBlocks.length === 0 || data.stop_reason === "end_turn") {
      finalText = textParts.join("\n");
      break;
    }

    /* Process tool calls */
    messages.push({ role: "assistant", content: contentBlocks });

    const toolResults: Array<{ type: "tool_result"; tool_use_id: string; content: string }> = [];

    for (const tool of toolUseBlocks) {
      if (tool.name === "get_user_tasks") {
        toolResults.push({
          type: "tool_result",
          tool_use_id: tool.id,
          content: resolveGetTasks(context.tasks, tool.input),
        });
      } else if (tool.name === "propose_plan") {
        /* Capture plan for client-side validation */
        plan = tool.input as unknown as ProposedPlan;
        toolResults.push({
          type: "tool_result",
          tool_use_id: tool.id,
          content: JSON.stringify({
            status: "plan_proposed",
            message: "Plan has been presented to the user for validation. Awaiting approval.",
          }),
        });
      } else {
        /* Single write operation */
        pendingToolCalls.push(tool);
        toolResults.push({
          type: "tool_result",
          tool_use_id: tool.id,
          content: JSON.stringify({ success: true, executed: "client-side" }),
        });
      }
    }

    messages.push({ role: "user", content: toolResults });

    if (textParts.length) finalText = textParts.join("\n");
  }

  return NextResponse.json({ message: finalText, toolCalls: pendingToolCalls, plan });
}
