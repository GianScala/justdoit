"use client";

import type { FolderRecord, TaskWithFolder } from "@/types/task";

interface Props {
  folders: FolderRecord[];
  activeFolder: string;
  onSelect: (id: string) => void;
  onCreate: () => void;
  onDelete?: (id: string) => void;
  /** All tasks across all folders — used to compute live counts */
  allTasks?: TaskWithFolder[];
  /** Optional fallback override for the Overall tab count */
  overallCount?: number;
}

/**
 * Count todo + inprogress tasks for a given folder.
 * Prefers the live `allTasks` array; falls back to `folder.counts`.
 */
function getActiveCount(
  folder: FolderRecord,
  allTasks?: TaskWithFolder[],
): number {
  if (allTasks) {
    return allTasks.filter(
      (t) =>
        t.folderId === folder.id &&
        (t.status === "todo" || t.status === "inprogress"),
    ).length;
  }
  return (folder.counts?.todo ?? 0) + (folder.counts?.inprogress ?? 0);
}

export default function FolderNav({
  folders,
  activeFolder,
  onSelect,
  onCreate,
  onDelete,
  allTasks,
  overallCount,
}: Props) {
  const totalActive =
    overallCount ??
    folders.reduce((sum, f) => sum + getActiveCount(f, allTasks), 0);

  return (
    <div className="folder-nav-bleed">
      <nav className="folder-nav" aria-label="Folders">
        {/* ── Overall tab ─────────────────────────────── */}
        <button
          type="button"
          className={`folder-tab${activeFolder === "overall" ? " active" : ""}`}
          onClick={() => onSelect("overall")}
        >
          <span className="folder-tab-name">Overall</span>
          <span className="folder-tab-count">[{totalActive}]</span>
        </button>

        {/* ── Per-folder tabs ─────────────────────────── */}
        {folders.map((folder) => {
          const count = getActiveCount(folder, allTasks);

          return (
            <button
              key={folder.id}
              type="button"
              className={`folder-tab${activeFolder === folder.id ? " active" : ""}`}
              onClick={() => onSelect(folder.id)}
            >
              <span className="folder-tab-name">{folder.name}</span>
              <span className="folder-tab-count">[{count}]</span>

              {!folder.locked && onDelete && (
                <span
                  className="folder-delete"
                  role="button"
                  tabIndex={0}
                  aria-label={`Delete ${folder.name}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(folder.id);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      e.stopPropagation();
                      onDelete(folder.id);
                    }
                  }}
                >
                  ×
                </span>
              )}
            </button>
          );
        })}

        {/* ── Add folder ──────────────────────────────── */}
        <button
          type="button"
          className="folder-tab folder-add"
          onClick={onCreate}
        >
          + New Folder
        </button>
      </nav>
    </div>
  );
}