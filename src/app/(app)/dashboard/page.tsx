"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useTasks } from "@/context/TaskContext";
import PageContainer from "@/components/layout/PageContainer";
import FolderNav from "@/components/dashboard/FolderNav";
import SummaryCard from "@/components/dashboard/SummaryCard";
import TaskForm from "@/components/dashboard/TaskForm";
import TaskColumn from "@/components/dashboard/TaskColumn";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Spinner from "@/components/ui/Spinner";
import { STATUS_ORDER } from "@/lib/constants";
import type { TaskStatus } from "@/types/task";

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const {
    folders,
    activeFolder,
    tasks,
    overallTasks,
    dataLoading,
    counts,
    folderNames,
    isOverall,
    setActiveFolder,
    refresh,
    createFolder,
    deleteFolder,
  } = useTasks();

  const [modalOpen, setModalOpen] = useState(false);
  const [folderName, setFolderName] = useState("");

  /* ── Auth guard ──────────────────────────────────── */
  useEffect(() => {
    if (!loading && !user) router.replace("/auth/login");
  }, [loading, user, router]);

  useEffect(() => {
    if (user) refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  if (loading || !user) return <Spinner />;

  /* ── Derived state ──────────────────────────────── */
  const currentTasks = isOverall
    ? overallTasks
    : tasks.map((t) => ({ ...t, folderId: activeFolder }));

  /* ── Handlers ───────────────────────────────────── */
  async function handleSelect(id: string) {
    setActiveFolder(id);
    await refresh(id);
  }

  async function handleCreate() {
    const name = folderName.trim();
    if (!name) return;
    try {
      const f = await createFolder(name);
      setFolderName("");
      setModalOpen(false);
      setActiveFolder(f.id);
    } catch (err: any) {
      alert(err.message);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this folder and all its tasks?")) return;
    try {
      await deleteFolder(id);
    } catch (err: any) {
      alert(err.message);
    }
  }

  /* ── Render ─────────────────────────────────────── */
  return (
    <PageContainer>
      <FolderNav
        folders={folders}
        activeFolder={activeFolder}
        onSelect={handleSelect}
        onCreate={() => setModalOpen(true)}
        onDelete={handleDelete}
        allTasks={overallTasks}
      />

      <SummaryCard counts={counts} />

      {!isOverall && (
        <TaskForm folderId={activeFolder} onCreated={() => refresh(activeFolder)} />
      )}

      {dataLoading ? (
        <div style={{ textAlign: "center", padding: 40 }}>
          <div className="spinner" style={{ margin: "0 auto" }} />
        </div>
      ) : (
        <div className="task-columns">
          {STATUS_ORDER.map((s) => (
            <TaskColumn
              key={s}
              status={s as TaskStatus}
              tasks={currentTasks.filter((t) => t.status === s)}
              onRefresh={() => refresh(activeFolder)}
              showFolder={isOverall}
              folderNames={folderNames}
            />
          ))}
        </div>
      )}

      {/* ── New-folder modal ───────────────────────── */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Create New Folder"
      >
        <div className="stack">
          <input
            className="input"
            placeholder="Folder name"
            value={folderName}
            onChange={(e) => setFolderName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            autoFocus
          />
          <div className="row">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate}>Create</Button>
          </div>
        </div>
      </Modal>
    </PageContainer>
  );
}