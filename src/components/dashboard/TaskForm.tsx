"use client";

import { FormEvent, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { createTask } from "@/features/tasks/utils/firestore";
import type { TaskPriority } from "@/types/task";

interface Props {
  folderId: string;
  onCreated: () => Promise<void> | void;
}

export default function TaskForm({ folderId, onCreated }: Props) {
  const { user } = useAuth();

  const [name, setName] = useState("");
  const [deadline, setDeadline] = useState("");
  const [tag, setTag] = useState<TaskPriority>("standard");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim() || submitting || !user) return;

    try {
      setSubmitting(true);

      await createTask(user.uid, folderId, {
        name: name.trim(),
        deadline: deadline || null,
        tag,
      });

      setName("");
      setDeadline("");
      setTag("standard");
      await onCreated();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="task-form">
      <div className="task-form-grid">
        <div className="task-form-field task-form-name">
          <label className="label">Task Name</label>
          <input
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="What needs to be done?"
            maxLength={200}
          />
        </div>

        <div className="task-form-field task-form-deadline">
          <label className="label">Deadline</label>
          <input
            className="input"
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
          />
        </div>

        <div className="task-form-field task-form-priority">
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

        <div className="task-form-field task-form-submit">
          <label className="label label-spacer">Action</label>
          <button className="task-form-button" type="submit" disabled={submitting}>
            {submitting ? "Adding..." : "+ Add Task"}
          </button>
        </div>
      </div>
    </form>
  );
}