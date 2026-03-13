"use client";
import { createContext, useContext, useState, useCallback, useMemo, ReactNode } from "react";
import { useAuth } from "@/context/AuthContext";
import { readFolders, readTasks, readAllTasks, createFolder as createFolderFn, deleteFolder as deleteFolderFn } from "@/features/tasks/utils/firestore";
import type { FolderRecord, TaskRecord, TaskWithFolder, TaskCounts } from "@/types/task";

function mergeFolderTasks(
  existing: TaskWithFolder[],
  folderId: string,
  nextTasks: TaskRecord[],
): TaskWithFolder[] {
  const otherFolders = existing.filter((task) => task.folderId !== folderId);
  const updatedFolderTasks = nextTasks.map((task) => ({ ...task, folderId }));
  return [...otherFolders, ...updatedFolderTasks];
}

interface TaskContextValue {
  folders: FolderRecord[];
  activeFolder: string;
  tasks: TaskRecord[];
  overallTasks: TaskWithFolder[];
  dataLoading: boolean;
  counts: TaskCounts;
  folderNames: Record<string, string>;
  isOverall: boolean;
  setActiveFolder: (id: string) => void;
  refresh: (folderId?: string) => Promise<void>;
  createFolder: (name: string) => Promise<FolderRecord>;
  deleteFolder: (id: string) => Promise<void>;
}

const TaskContext = createContext<TaskContextValue | undefined>(undefined);

export function TaskProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [folders, setFolders] = useState<FolderRecord[]>([]);
  const [activeFolder, setActiveFolder] = useState("overall");
  const [tasks, setTasks] = useState<TaskRecord[]>([]);
  const [overallTasks, setOverallTasks] = useState<TaskWithFolder[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  const isOverall = activeFolder === "overall";

  const refresh = useCallback(async (folderId?: string) => {
    if (!user) return;
    const id = folderId ?? activeFolder;

    setDataLoading(true);

    try {
      if (id === "overall") {
        const [nextFolders, nextOverallTasks] = await Promise.all([
          readFolders(user.uid),
          readAllTasks(user.uid),
        ]);

        setFolders(nextFolders);
        setOverallTasks(nextOverallTasks);
        return;
      }

      const [nextFolders, nextTasks] = await Promise.all([
        readFolders(user.uid),
        readTasks(user.uid, id),
      ]);

      setFolders(nextFolders);
      setTasks(nextTasks);
      setOverallTasks((prev) => (prev.length ? mergeFolderTasks(prev, id, nextTasks) : prev));
    } finally {
      setDataLoading(false);
    }
  }, [user, activeFolder]);

  const createFolder = useCallback(async (name: string) => {
    if (!user) throw new Error("Not authenticated");
    const folder = await createFolderFn(user.uid, name);
    await refresh(folder.id);
    return folder;
  }, [user, refresh]);

  const deleteFolder = useCallback(async (id: string) => {
    if (!user) throw new Error("Not authenticated");
    await deleteFolderFn(user.uid, id);
    if (activeFolder === id) setActiveFolder("overall");
    await refresh("overall");
  }, [user, activeFolder, refresh]);

  const counts = useMemo<TaskCounts>(() => {
    const src = isOverall ? overallTasks : tasks;
    return { todo: src.filter(t => t.status === "todo").length, inprogress: src.filter(t => t.status === "inprogress").length, completed: src.filter(t => t.status === "completed").length };
  }, [isOverall, overallTasks, tasks]);

  const folderNames = useMemo(() => {
    const m: Record<string, string> = {};
    folders.forEach(f => { m[f.id] = f.name; });
    return m;
  }, [folders]);

  const value = useMemo(() => ({
    folders, activeFolder, tasks, overallTasks, dataLoading, counts, folderNames, isOverall,
    setActiveFolder, refresh, createFolder, deleteFolder,
  }), [folders, activeFolder, tasks, overallTasks, dataLoading, counts, folderNames, isOverall, refresh, createFolder, deleteFolder]);

  return <TaskContext.Provider value={value}>{children}</TaskContext.Provider>;
}

export function useTasks() {
  const ctx = useContext(TaskContext);
  if (!ctx) throw new Error("useTasks must be used within TaskProvider");
  return ctx;
}
