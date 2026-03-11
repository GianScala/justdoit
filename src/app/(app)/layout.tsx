"use client";
import { TaskProvider } from "@/context/TaskContext";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <TaskProvider>{children}</TaskProvider>;
}
