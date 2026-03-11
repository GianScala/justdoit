export type TaskStatus = "todo" | "inprogress" | "completed";

export type TaskPriority = "standard" | "important" | "urgent";

export type TaskRecord = {
  id: string;
  name: string;
  deadline: string | null;
  tag: TaskPriority;
  status: TaskStatus;
  createdAt: string;
  updatedAt: string;
};

export type TaskWithFolder = TaskRecord & {
  folderId: string;
};

export type TaskCounts = {
  todo: number;
  inprogress: number;
  completed: number;
};

export type FolderRecord = {
  id: string;
  name: string;
  locked?: boolean;
  createdAt?: string;
  counts?: TaskCounts;
};