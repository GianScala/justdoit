"use client";

import { useState } from "react";
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
  defaultCollapsed?: boolean;
}

export default function TaskColumn({
  status,
  tasks,
  onRefresh,
  showFolder,
  folderNames,
  defaultCollapsed = false,
}: Props) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const sorted =
    status === "completed"
      ? [...tasks].sort((a, b) => (b.updatedAt || "").localeCompare(a.updatedAt || ""))
      : sortByDeadline(tasks);

  const config = STATUS_CONFIG[status];
  const displayTasks = collapsed ? sorted.slice(0, 1) : sorted;

  return (
    <section className="task-section">
      <div className="task-column-header">
        <div className="task-column-header-left">
          <span className={`task-status-dot ${config.dotClass}`} />
          <h3>{config.label}</h3>
          <span className="task-count">({sorted.length})</span>
        </div>
        {sorted.length > 1 && (
          <button
            type="button"
            className="task-collapse-btn"
            onClick={() => setCollapsed((c) => !c)}
            aria-label={collapsed ? "Expand section" : "Collapse section"}
          >
            <span className={`task-collapse-arrow ${collapsed ? "is-collapsed" : ""}`}>▾</span>
          </button>
        )}
      </div>

      {sorted.length === 0 ? (
        <div className="empty-msg">No tasks here</div>
      ) : (
        <>
          <div className="task-list">
            {displayTasks.map((task) => (
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
          {collapsed && sorted.length > 1 && (
            <button
              type="button"
              className="task-show-more"
              onClick={() => setCollapsed(false)}
            >
              +{sorted.length - 1} more task{sorted.length - 1 > 1 ? "s" : ""}
            </button>
          )}
        </>
      )}
    </section>
  );
}
