"use client";

import type { FolderRecord, TaskWithFolder } from "@/types/task";

interface Props {
  folders: FolderRecord[];
  activeFolder: string;
  onSelect: (id: string) => void;
  onCreate: () => void;
  onDelete?: (id: string) => void;
  allTasks?: TaskWithFolder[];
  overallCount?: number;
}

function getActiveCount(folder: FolderRecord, allTasks?: TaskWithFolder[]): number {
  if (allTasks) {
    return allTasks.filter(
      (t) => t.folderId === folder.id && (t.status === "todo" || t.status === "inprogress")
    ).length;
  }
  return (folder.counts?.todo ?? 0) + (folder.counts?.inprogress ?? 0);
}

function hasDueToday(folderId: string, allTasks?: TaskWithFolder[]): boolean {
  if (!allTasks) return false;
  const today = new Date().toISOString().slice(0, 10);
  return allTasks.some(
    (t) => t.folderId === folderId && t.deadline === today && t.status !== "completed"
  );
}

export default function FolderNav({
  folders, activeFolder, onSelect, onCreate, onDelete, allTasks, overallCount,
}: Props) {
  const totalActive =
    overallCount ?? folders.reduce((sum, f) => sum + getActiveCount(f, allTasks), 0);

  return (
    <div className="folder-nav-bleed">
      <nav className="folder-nav" aria-label="Folders">
        <button
          type="button"
          className={`folder-tab${activeFolder === "overall" ? " active" : ""}`}
          onClick={() => onSelect("overall")}
        >
          <span className="folder-tab-name">Overall</span>
          <span className="folder-tab-count">[{totalActive}]</span>
        </button>

        {folders.map((folder) => {
          const count = getActiveCount(folder, allTasks);
          const dueToday = hasDueToday(folder.id, allTasks);

          return (
            <button
              key={folder.id}
              type="button"
              className={`folder-tab${activeFolder === folder.id ? " active" : ""}`}
              onClick={() => onSelect(folder.id)}
            >
              <span className="folder-tab-name">{folder.name}</span>
              <span className="folder-tab-count">[{count}]</span>
              {dueToday && (
                <span className="folder-due-badge" title="Has tasks due today">!</span>
              )}

              {!folder.locked && onDelete && (
                <span
                  className="folder-delete"
                  role="button"
                  tabIndex={0}
                  aria-label={`Delete ${folder.name}`}
                  onClick={(e) => { e.stopPropagation(); onDelete(folder.id); }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault(); e.stopPropagation(); onDelete(folder.id);
                    }
                  }}
                >
                  ×
                </span>
              )}
            </button>
          );
        })}

        <button type="button" className="folder-tab folder-add" onClick={onCreate}>
          + New Folder
        </button>
      </nav>
    </div>
  );
}
