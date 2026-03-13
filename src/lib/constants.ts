export const PENDING_KEY = "pending_email_verification";
export const PENDING_COOKIE = "pv";
export const PENDING_EXPIRY_MS = 30 * 60 * 1000;
export const FREE_DAILY_AI_TOKEN_LIMIT = 10000;
export const UNLIMITED_AI_TOKENS = -1;

export const DEFAULT_FOLDERS = [
  { id: "personal-tasks", name: "Personal Tasks", locked: true },
  { id: "work-stuff", name: "Work Stuff", locked: true },
] as const;

export const STATUS_ORDER = ["inprogress", "todo", "completed"] as const;

export const STATUS_CONFIG = {
  inprogress: { label: "In Progress", dotClass: "dot-inprogress" },
  todo: { label: "To Do", dotClass: "dot-todo" },
  completed: { label: "Completed", dotClass: "dot-completed" },
} as const;
