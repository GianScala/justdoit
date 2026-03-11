"use client";

import { useAuth } from "@/context/AuthContext";
import { updateTask, deleteTask } from "@/features/tasks/utils/firestore";
import { formatDate, daysUntil, daysLabel } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import type { TaskWithFolder, TaskStatus } from "@/types/task";

interface Props {
  task: TaskWithFolder;
  status: TaskStatus;
  onRefresh: () => void;
  showFolder: boolean;
  folderNames: Record<string, string>;
}

export default function TaskCard({
  task,
  status,
  onRefresh,
  showFolder,
  folderNames,
}: Props) {
  const { user } = useAuth();

  async function moveTo(nextStatus: TaskStatus) {
    if (!user) return;
    await updateTask(user.uid, task.folderId, task.id, { status: nextStatus });
    onRefresh();
  }

  async function remove() {
    if (!user || !confirm("Delete this task?")) return;
    await deleteTask(user.uid, task.folderId, task.id);
    onRefresh();
  }

  const pClass =
    task.tag === "urgent"
      ? "priority-urgent"
      : task.tag === "important"
      ? "priority-important"
      : "priority-standard";

  const hasDeadline = !!task.deadline;
  const deadlineDelta = hasDeadline ? daysUntil(task.deadline!) : null;
  const deadlineInfo =
    hasDeadline && deadlineDelta !== null ? daysLabel(deadlineDelta) : null;

  return (
    <article className={cn("task-card", pClass, status === "completed" && "is-completed")}>
      <div className="task-card-main">
        <div className="task-card-info">
          <div className="task-card-topline">
            <span className={cn("priority-badge", pClass)}>{task.tag}</span>
            {showFolder && (
              <span className="overall-folder-chip">
                {folderNames[task.folderId] || task.folderId}
              </span>
            )}
          </div>

          <h4 className="task-card-name">{task.name}</h4>
        </div>

        <div className="task-meta">
          <span className="task-date">
            {hasDeadline ? formatDate(task.deadline!) : "No deadline"}
          </span>

          {deadlineInfo && (
            <span
              className={cn(
                "task-deadline-state",
                deadlineInfo.cls === "overdue" && "is-overdue",
                deadlineInfo.cls === "soon" && "is-soon"
              )}
            >
              {deadlineInfo.text}
            </span>
          )}
        </div>
      </div>

      <div className="task-actions">
        {status === "todo" && (
          <>
            <button
              className="btn btn-ghost btn-xs"
              onClick={() => moveTo("inprogress")}
              type="button"
            >
              ▶ Start
            </button>
            <button
              className="btn btn-ghost btn-xs"
              onClick={() => moveTo("completed")}
              type="button"
            >
              ✓ Done
            </button>
          </>
        )}

        {status === "inprogress" && (
          <>
            <button
              className="btn btn-ghost btn-xs"
              onClick={() => moveTo("todo")}
              type="button"
            >
              ◀ Back
            </button>
            <button
              className="btn btn-ghost btn-xs"
              onClick={() => moveTo("completed")}
              type="button"
            >
              ✓ Done
            </button>
          </>
        )}

        {status === "completed" && (
          <button
            className="btn btn-ghost btn-xs"
            onClick={() => moveTo("todo")}
            type="button"
          >
            ↺ Reopen
          </button>
        )}

        <button className="btn btn-danger btn-xs" onClick={remove} type="button">
          ✕
        </button>
      </div>
    </article>
  );
}