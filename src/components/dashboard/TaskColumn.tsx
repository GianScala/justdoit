"use client";

import { STATUS_CONFIG } from "@/lib/constants";
import TaskCard from "./TaskCard";
import type { TaskWithFolder, TaskStatus } from "@/types/task";

function sortByDeadline(tasks: TaskWithFolder[]) {
  return [...tasks].sort((a, b) => {
    if (!a.deadline && b.deadline) return 1;
    if (a.deadline && !b.deadline) return -1;
    if (!a.deadline && !b.deadline) return 0;
    return new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime();
  });
}

interface Props {
  status: TaskStatus;
  tasks: TaskWithFolder[];
  onRefresh: () => void;
  showFolder: boolean;
  folderNames: Record<string, string>;
}

export default function TaskColumn({
  status,
  tasks,
  onRefresh,
  showFolder,
  folderNames,
}: Props) {
  const sorted =
    status === "completed"
      ? [...tasks].sort((a, b) => (b.updatedAt || "").localeCompare(a.updatedAt || ""))
      : sortByDeadline(tasks);

  const config = STATUS_CONFIG[status];

  return (
    <section className="task-section">
      <div className="task-column-header">
        <div className="task-column-header-left">
          <span className={`task-status-dot ${config.dotClass}`} />
          <h3>{config.label}</h3>
          <span className="task-count">({sorted.length})</span>
        </div>
      </div>

      {sorted.length === 0 ? (
        <div className="empty-msg">No tasks here</div>
      ) : (
        <div className="task-list">
          {sorted.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              status={status}
              onRefresh={onRefresh}
              showFolder={showFolder}
              folderNames={folderNames}
            />
          ))}
        </div>
      )}
    </section>
  );
}