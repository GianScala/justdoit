"use client";

import { FormEvent, useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { updateTask, deleteTask } from "@/features/tasks/utils/firestore";
import { formatDate, daysUntil, daysLabel } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import type { TaskPriority, TaskStatus, TaskWithFolder } from "@/types/task";
import Modal from "@/components/ui/Modal";

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

  const [editOpen, setEditOpen] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);

  const [name, setName] = useState(task.name);
  const [deadline, setDeadline] = useState(task.deadline ?? "");
  const [tag, setTag] = useState<TaskPriority>(task.tag);

  useEffect(() => {
    if (!editOpen) {
      setName(task.name);
      setDeadline(task.deadline ?? "");
      setTag(task.tag);
    }
  }, [task, editOpen]);

  function resetEditForm() {
    setName(task.name);
    setDeadline(task.deadline ?? "");
    setTag(task.tag);
  }

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

  async function saveEdit() {
    if (!user || !name.trim() || savingEdit) return;

    try {
      setSavingEdit(true);

      await updateTask(user.uid, task.folderId, task.id, {
        name: name.trim(),
        deadline: deadline || null,
        tag,
      });

      setEditOpen(false);
      await onRefresh();
    } finally {
      setSavingEdit(false);
    }
  }

  async function handleEditSubmit(e: FormEvent) {
    e.preventDefault();
    await saveEdit();
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

  const folderLabel = folderNames[task.folderId] || task.folderId;

  return (
    <>
      <article
        className={cn(
          "task-card",
          pClass,
          status === "completed" && "is-completed"
        )}
      >
        <div className="task-card-main">
          <div className="task-card-info">
            <div className="task-card-topline">
              <span className={cn("priority-badge", pClass)}>{task.tag}</span>

              {showFolder && (
                <span className="overall-folder-chip">{folderLabel}</span>
              )}
            </div>

            <h4 className="task-card-name">{task.name}</h4>

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
        </div>

        <div className="task-actions">
          {status === "todo" && (
            <>
              <button
                className="task-action-btn"
                onClick={() => moveTo("inprogress")}
                type="button"
              >
                <span className="task-action-icon">▶</span>
                <span>Start</span>
              </button>

              <button
                className="task-action-btn"
                onClick={() => moveTo("completed")}
                type="button"
              >
                <span className="task-action-icon">✓</span>
                <span>Done</span>
              </button>
            </>
          )}

          {status === "inprogress" && (
            <>
              <button
                className="task-action-btn"
                onClick={() => moveTo("todo")}
                type="button"
              >
                <span className="task-action-icon">◀</span>
                <span>Back</span>
              </button>

              <button
                className="task-action-btn"
                onClick={() => moveTo("completed")}
                type="button"
              >
                <span className="task-action-icon">✓</span>
                <span>Done</span>
              </button>
            </>
          )}

          {status === "completed" && (
            <button
              className="task-action-btn"
              onClick={() => moveTo("todo")}
              type="button"
            >
              <span className="task-action-icon">↺</span>
              <span>Reopen</span>
            </button>
          )}

          <button
            className="task-action-btn"
            onClick={() => setEditOpen(true)}
            type="button"
          >
            <span className="task-action-icon">✎</span>
            <span>Edit</span>
          </button>

          <button
            className="task-action-btn task-action-btn-danger"
            onClick={remove}
            type="button"
            aria-label={`Delete ${task.name}`}
            title="Delete task"
          >
            <span className="task-action-icon">×</span>
          </button>
        </div>
      </article>

      <Modal
        open={editOpen}
        onClose={() => {
          if (!savingEdit) {
            setEditOpen(false);
            resetEditForm();
          }
        }}
        title="Edit Task"
      >
        <form onSubmit={handleEditSubmit} className="task-modal-form">
          <div className="task-form-field">
            <label className="label">Task Name</label>
            <input
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="What needs to be done?"
              maxLength={200}
              autoFocus
            />
          </div>

          <div className="task-modal-row">
            <div className="task-form-field">
              <label className="label">Deadline</label>
              <input
                className="input"
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
              />
            </div>

            <div className="task-form-field">
              <label className="label">Priority</label>
              <select
                className="input"
                value={tag}
                onChange={(e) => setTag(e.target.value as TaskPriority)}
              >
                <option value="standard">Standard</option>
                <option value="important">Important</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>

          <div className="task-modal-actions">
            <button
              type="button"
              className="task-form-button-secondary"
              onClick={() => {
                setEditOpen(false);
                resetEditForm();
              }}
              disabled={savingEdit}
            >
              Cancel
            </button>

            <button className="task-form-button" type="submit" disabled={savingEdit}>
              {savingEdit ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}