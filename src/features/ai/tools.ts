/**
 * AI Assistant — Tool definitions for Claude tool-use.
 */

export const AI_TOOLS = [
  {
    name: "get_user_tasks",
    description:
      "Retrieve all tasks for the authenticated user across every project/folder. Returns task id, name, deadline, priority (tag), status, and the folderId it belongs to.",
    input_schema: {
      type: "object" as const,
      properties: {
        status_filter: {
          type: "string",
          enum: ["todo", "inprogress", "completed", "all"],
          description: "Optional filter by status. Use 'all' or omit to return every task.",
        },
      },
      required: [],
    },
  },
  {
    name: "update_task",
    description:
      "Update fields of an existing task. Can change name (title), deadline, status, or priority (tag). Use for single-task edits only.",
    input_schema: {
      type: "object" as const,
      properties: {
        folder_id: { type: "string", description: "The folder/project that contains the task." },
        task_id: { type: "string", description: "The unique id of the task to update." },
        name: { type: "string", description: "New title (optional)." },
        deadline: { type: "string", description: "New deadline YYYY-MM-DD, or null to remove (optional)." },
        status: { type: "string", enum: ["todo", "inprogress", "completed"], description: "New status (optional)." },
        tag: { type: "string", enum: ["standard", "important", "urgent"], description: "New priority (optional)." },
      },
      required: ["folder_id", "task_id"],
    },
  },
  {
    name: "move_task",
    description: "Move a task from one project/folder to another.",
    input_schema: {
      type: "object" as const,
      properties: {
        source_folder_id: { type: "string", description: "Current folder id of the task." },
        task_id: { type: "string", description: "The unique id of the task to move." },
        target_folder_id: { type: "string", description: "Destination folder id." },
      },
      required: ["source_folder_id", "task_id", "target_folder_id"],
    },
  },
  {
    name: "create_task",
    description:
      "Create a single new task. For multi-step goals or plans with 2+ tasks, use propose_plan instead.",
    input_schema: {
      type: "object" as const,
      properties: {
        folder_id: { type: "string", description: "Target folder id. Defaults to 'personal-tasks'." },
        name: { type: "string", description: "Title of the new task." },
        deadline: { type: "string", description: "Deadline YYYY-MM-DD, or null." },
        tag: { type: "string", enum: ["standard", "important", "urgent"], description: "Priority. Defaults to 'standard'." },
      },
      required: ["name"],
    },
  },
  {
    name: "create_project",
    description:
      "Create a new project (folder). If you need to create a project AND tasks, use propose_plan.",
    input_schema: {
      type: "object" as const,
      properties: {
        name: { type: "string", description: "Name for the new project/folder." },
      },
      required: ["name"],
    },
  },
  {
    name: "propose_plan",
    description: `Propose a structured plan requiring user validation before execution.
ALWAYS use this tool instead of direct creation/modification when:
- Creating 2+ tasks
- Creating a project with tasks
- Reorganising / rescheduling multiple tasks
- Bulk changes to deadlines, statuses, etc.
- Breaking a goal into steps
- Fixing a week / schedule
The plan is shown as a preview. The user must approve before changes apply.`,
    input_schema: {
      type: "object" as const,
      properties: {
        plan_title: { type: "string", description: "Short title, e.g. 'Ferrari Interview Prep'" },
        plan_summary: { type: "string", description: "1-2 sentence explanation." },
        actions: {
          type: "array",
          description: "Ordered list of actions to execute after approval.",
          items: {
            type: "object",
            properties: {
              tool: {
                type: "string",
                enum: ["create_task", "create_project", "update_task", "move_task"],
              },
              params: { type: "object", description: "Parameters for the tool call." },
              description: { type: "string", description: "Human-readable step label." },
            },
            required: ["tool", "params", "description"],
          },
        },
      },
      required: ["plan_title", "plan_summary", "actions"],
    },
  },
] as const;

/* ── Types ────────────────────────────────────────────── */

export type ToolCall = {
  id: string;
  name: string;
  input: Record<string, unknown>;
};

export interface PlanAction {
  tool: string;
  params: Record<string, unknown>;
  description: string;
}

export interface ProposedPlan {
  plan_title: string;
  plan_summary: string;
  actions: PlanAction[];
}

export type AiResponse = {
  message: string;
  toolCalls: ToolCall[];
  plan?: ProposedPlan | null;
};

function normalizePlanAction(value: unknown): PlanAction | null {
  if (!value || typeof value !== "object") return null;

  const raw = value as Record<string, unknown>;
  const tool =
    typeof raw.tool === "string"
      ? raw.tool
      : typeof raw.tool_name === "string"
        ? raw.tool_name
        : typeof raw.type === "string"
          ? raw.type
          : null;

  const description =
    typeof raw.description === "string"
      ? raw.description
      : typeof raw.title === "string"
        ? raw.title
        : typeof raw.name === "string"
          ? raw.name
          : typeof raw.summary === "string"
            ? raw.summary
            : null;

  const paramsCandidate =
    raw.params && typeof raw.params === "object" && !Array.isArray(raw.params)
      ? raw.params
      : raw.input && typeof raw.input === "object" && !Array.isArray(raw.input)
        ? raw.input
        : raw.arguments && typeof raw.arguments === "object" && !Array.isArray(raw.arguments)
          ? raw.arguments
          : null;

  const inferredParams = Object.fromEntries(
    Object.entries(raw).filter(
      ([key]) =>
        ![
          "tool",
          "tool_name",
          "type",
          "description",
          "title",
          "name",
          "summary",
          "params",
          "input",
          "arguments",
        ].includes(key),
    ),
  );

  const params =
    paramsCandidate ??
    (Object.keys(inferredParams).length > 0 ? inferredParams : null);

  if (!tool || !description || !params) {
    return null;
  }

  return {
    tool,
    description,
    params: params as Record<string, unknown>,
  };
}

export function normalizeProposedPlan(value: unknown): ProposedPlan | null {
  if (!value || typeof value !== "object") return null;

  const candidate = value as {
    plan_title?: unknown;
    plan_summary?: unknown;
    actions?: unknown;
    steps?: unknown;
    items?: unknown;
    tasks?: unknown;
  };

  const planTitle =
    typeof candidate.plan_title === "string"
      ? candidate.plan_title
      : typeof (value as Record<string, unknown>).title === "string"
        ? ((value as Record<string, unknown>).title as string)
        : null;

  const planSummary =
    typeof candidate.plan_summary === "string"
      ? candidate.plan_summary
      : typeof (value as Record<string, unknown>).summary === "string"
        ? ((value as Record<string, unknown>).summary as string)
        : null;

  if (!planTitle || !planSummary) {
    return null;
  }

  const rawActions = [candidate.actions, candidate.steps, candidate.items, candidate.tasks]
    .find((entry) => Array.isArray(entry));

  const actions = Array.isArray(rawActions)
    ? rawActions
        .map((action) => normalizePlanAction(action))
        .filter((action): action is PlanAction => action !== null)
    : [];

  return {
    plan_title: planTitle,
    plan_summary: planSummary,
    actions,
  };
}
