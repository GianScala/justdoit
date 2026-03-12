/**
 * Snapshot system — saves/restores full task+folder state for undo.
 *
 * Snapshots are held in memory (one per session).
 * When the AI executes a validated plan, the pre-plan state is saved.
 * "Undo" restores that snapshot by writing back to Firestore.
 */

import {
  readAllTasks,
  readFolders,
  createTask,
  updateTask,
  deleteTask,
  createFolder,
  deleteFolder,
} from "@/features/tasks/utils/firestore";
import type { TaskWithFolder, FolderRecord, TaskPriority } from "@/types/task";

export interface Snapshot {
  timestamp: number;
  label: string;
  tasks: TaskWithFolder[];
  folders: FolderRecord[];
}

let _snapshot: Snapshot | null = null;

/** Take a snapshot of the current state before a big operation. */
export async function takeSnapshot(uid: string, label: string): Promise<Snapshot> {
  const [tasks, folders] = await Promise.all([
    readAllTasks(uid),
    readFolders(uid),
  ]);
  _snapshot = { timestamp: Date.now(), label, tasks, folders };
  return _snapshot;
}

/** Get the current snapshot without consuming it. */
export function getSnapshot(): Snapshot | null {
  return _snapshot;
}

/** Clear the current snapshot. */
export function clearSnapshot() {
  _snapshot = null;
}

/**
 * Restore the saved snapshot.
 *
 * Strategy:
 *  1. Read current state.
 *  2. Delete any tasks/folders that were not in the snapshot.
 *  3. Re-create any tasks/folders that were in the snapshot but are now missing.
 *  4. Update any tasks whose fields differ from the snapshot.
 */
export async function restoreSnapshot(uid: string): Promise<boolean> {
  if (!_snapshot) return false;

  const snap = _snapshot;
  const currentTasks = await readAllTasks(uid);
  const currentFolders = await readFolders(uid);

  /* Build lookup maps */
  const snapTaskMap = new Map<string, TaskWithFolder>();
  snap.tasks.forEach((t) => snapTaskMap.set(t.id, t));

  const snapFolderMap = new Map<string, FolderRecord>();
  snap.folders.forEach((f) => snapFolderMap.set(f.id, f));

  const currentTaskMap = new Map<string, TaskWithFolder>();
  currentTasks.forEach((t) => currentTaskMap.set(t.id, t));

  const currentFolderMap = new Map<string, FolderRecord>();
  currentFolders.forEach((f) => currentFolderMap.set(f.id, f));

  /* Ensure all snapshot folders exist */
  for (const sf of snap.folders) {
    if (!currentFolderMap.has(sf.id) && !sf.locked) {
      try {
        await createFolder(uid, sf.name);
      } catch {
        /* folder may already exist with same slug */
      }
    }
  }

  /* Delete tasks that weren't in the snapshot */
  for (const ct of currentTasks) {
    if (!snapTaskMap.has(ct.id)) {
      try {
        await deleteTask(uid, ct.folderId, ct.id);
      } catch { /* ignore */ }
    }
  }

  /* Restore/update tasks from snapshot */
  for (const st of snap.tasks) {
    const current = currentTaskMap.get(st.id);
    if (!current) {
      /* Task was deleted — recreate it */
      try {
        await createTask(uid, st.folderId, {
          name: st.name,
          deadline: st.deadline,
          tag: st.tag as TaskPriority,
        });
      } catch { /* ignore */ }
    } else if (
      current.name !== st.name ||
      current.deadline !== st.deadline ||
      current.tag !== st.tag ||
      current.status !== st.status
    ) {
      /* Task fields changed — update */
      try {
        await updateTask(uid, current.folderId, current.id, {
          name: st.name,
          deadline: st.deadline,
          tag: st.tag as TaskPriority,
          status: st.status,
        });
      } catch { /* ignore */ }
    }
  }

  /* Delete folders that weren't in the snapshot (non-locked only) */
  for (const cf of currentFolders) {
    if (!snapFolderMap.has(cf.id) && !cf.locked) {
      try {
        await deleteFolder(uid, cf.id);
      } catch { /* ignore */ }
    }
  }

  _snapshot = null;
  return true;
}
