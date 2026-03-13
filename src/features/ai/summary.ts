import { daysUntil } from "@/lib/formatters";
import type { TaskWithFolder } from "@/types/task";

export interface AssistantSummary {
  fingerprint: string;
  generatedAt: string;
  todaysFocus: string[];
  upcoming: string[];
  isEmpty: boolean;
}

function compareTasks(a: TaskWithFolder, b: TaskWithFolder): number {
  const scoreDelta = getTaskScore(b) - getTaskScore(a);
  if (scoreDelta !== 0) return scoreDelta;

  if (a.deadline && b.deadline) {
    return a.deadline.localeCompare(b.deadline);
  }

  if (a.deadline) return -1;
  if (b.deadline) return 1;
  return a.name.localeCompare(b.name);
}

function getTaskScore(task: TaskWithFolder): number {
  let score = 0;

  if (task.status === "inprogress") score += 30;
  if (task.tag === "urgent") score += 24;
  if (task.tag === "important") score += 12;

  if (task.deadline) {
    const delta = daysUntil(task.deadline);
    if (delta < 0) score += 40;
    else if (delta === 0) score += 28;
    else if (delta === 1) score += 18;
    else if (delta <= 3) score += 12;
    else if (delta <= 7) score += 6;
  }

  return score;
}

function formatTask(task: TaskWithFolder, folderNames: Record<string, string>): string {
  const metadata: string[] = [];

  if (task.deadline) {
    const delta = daysUntil(task.deadline);
    metadata.push(
      delta < 0
        ? `${Math.abs(delta)}d overdue`
        : delta === 0
        ? "due today"
        : delta === 1
        ? "due tomorrow"
        : `due in ${delta}d`,
    );
  } else {
    metadata.push("no deadline");
  }

  if (task.tag !== "standard") {
    metadata.push(task.tag);
  }

  if (task.status === "inprogress") {
    metadata.push("in progress");
  }

  const folderLabel = folderNames[task.folderId];
  if (folderLabel) {
    metadata.push(folderLabel);
  }

  return `${task.name} — ${metadata.join(" • ")}`;
}

export function getAssistantSummaryFingerprint(
  tasks: TaskWithFolder[],
  folderNames: Record<string, string>,
): string {
  return [
    tasks
      .map(
        (task) =>
          `${task.id}:${task.status}:${task.deadline ?? "none"}:${task.tag}:${task.updatedAt}`,
      )
      .sort()
      .join("|"),
    Object.entries(folderNames)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([id, name]) => `${id}:${name}`)
      .join("|"),
  ].join("::");
}

export function buildAssistantSummary(
  tasks: TaskWithFolder[],
  folderNames: Record<string, string>,
): AssistantSummary {
  const activeTasks = tasks
    .filter((task) => task.status !== "completed")
    .sort(compareTasks);

  const fingerprint = getAssistantSummaryFingerprint(tasks, folderNames);

  if (activeTasks.length === 0) {
    return {
      fingerprint,
      generatedAt: new Date().toISOString(),
      todaysFocus: [
        "Nothing is scheduled yet.",
        "Tell me what you need to work on and I will turn it into a plan.",
      ],
      upcoming: ["No upcoming tasks yet."],
      isEmpty: true,
    };
  }

  const focusTasks = activeTasks.slice(0, 3);
  const upcomingTasks = activeTasks
    .filter((task) => !focusTasks.some((focusTask) => focusTask.id === task.id))
    .slice(0, 2);

  return {
    fingerprint,
    generatedAt: new Date().toISOString(),
    todaysFocus: focusTasks.map((task) => formatTask(task, folderNames)),
    upcoming: (upcomingTasks.length ? upcomingTasks : focusTasks.slice(0, 1)).map((task) =>
      formatTask(task, folderNames),
    ),
    isEmpty: false,
  };
}

export function buildStartMyDayMessage(
  tasks: TaskWithFolder[],
  folderNames: Record<string, string>,
): string {
  const summary = buildAssistantSummary(tasks, folderNames);

  return [
    "Today's Focus",
    "",
    ...summary.todaysFocus.map((item) => `• ${item}`),
    "",
    "Upcoming",
    "",
    ...summary.upcoming.map((item) => `• ${item}`),
  ].join("\n");
}
