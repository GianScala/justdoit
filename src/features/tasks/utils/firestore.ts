"use client";
import { collection, doc, getDocs, getDoc, setDoc, updateDoc, deleteDoc, query, orderBy, serverTimestamp, Timestamp } from "firebase/firestore";
import { getFirebaseDb } from "@/features/auth/utils/firebase";
import { slugify } from "@/lib/utils";
import { DEFAULT_FOLDERS } from "@/lib/constants";
import type { FolderRecord, TaskRecord, TaskPriority, TaskWithFolder } from "@/types/task";

function foldersCol(uid: string) { return collection(getFirebaseDb(), "users", uid, "folders"); }
function tasksCol(uid: string, fid: string) { return collection(getFirebaseDb(), "users", uid, "folders", fid, "tasks"); }
function toIso(v: unknown): string { if (!v) return new Date().toISOString(); if (v instanceof Timestamp) return v.toDate().toISOString(); if (typeof v === "string") return v; return new Date().toISOString(); }

export async function ensureDefaultFolders(uid: string) {
  const col = foldersCol(uid); const snap = await getDocs(col);
  if (snap.empty) { for (const f of DEFAULT_FOLDERS) { await setDoc(doc(col, f.id), { name: f.name, locked: f.locked, createdAt: serverTimestamp() }); } }
}

export async function readFolders(uid: string): Promise<FolderRecord[]> {
  await ensureDefaultFolders(uid);
  const snap = await getDocs(query(foldersCol(uid), orderBy("createdAt", "asc")));
  return snap.docs.map(d => ({ id: d.id, name: d.data().name, locked: d.data().locked ?? false, createdAt: toIso(d.data().createdAt) }));
}

export async function createFolder(uid: string, name: string): Promise<FolderRecord> {
  const id = slugify(name); if (!id) throw new Error("Invalid folder name.");
  const existing = await getDoc(doc(foldersCol(uid), id)); if (existing.exists()) throw new Error("Folder already exists.");
  await setDoc(doc(foldersCol(uid), id), { name, locked: false, createdAt: serverTimestamp() });
  return { id, name, locked: false };
}

export async function deleteFolder(uid: string, fid: string) {
  const d = await getDoc(doc(foldersCol(uid), fid));
  if (!d.exists()) throw new Error("Folder not found."); if (d.data().locked) throw new Error("Default folders cannot be deleted.");
  const tSnap = await getDocs(tasksCol(uid, fid)); for (const t of tSnap.docs) await deleteDoc(t.ref);
  await deleteDoc(doc(foldersCol(uid), fid));
}

export async function readTasks(uid: string, fid: string): Promise<TaskRecord[]> {
  const snap = await getDocs(query(tasksCol(uid, fid), orderBy("createdAt", "desc")));
  return snap.docs.map(d => ({ id: d.id, name: d.data().name, deadline: d.data().deadline ?? null, tag: d.data().tag ?? "standard", status: d.data().status ?? "todo", createdAt: toIso(d.data().createdAt), updatedAt: toIso(d.data().updatedAt) }));
}

export async function readAllTasks(uid: string): Promise<TaskWithFolder[]> {
  const folders = await readFolders(uid);
  return (await Promise.all(folders.map(async f => (await readTasks(uid, f.id)).map(t => ({ ...t, folderId: f.id }))))).flat();
}

export async function createTask(uid: string, fid: string, p: { name: string; deadline: string | null; tag: TaskPriority }): Promise<TaskRecord> {
  const id = crypto.randomUUID(); const now = serverTimestamp();
  await setDoc(doc(tasksCol(uid, fid), id), { name: p.name, deadline: p.deadline, tag: p.tag, status: "todo", createdAt: now, updatedAt: now });
  return { id, ...p, status: "todo", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
}

export async function updateTask(uid: string, fid: string, tid: string, updates: Partial<Pick<TaskRecord, "name" | "deadline" | "tag" | "status">>) {
  await updateDoc(doc(tasksCol(uid, fid), tid), { ...updates, updatedAt: serverTimestamp() });
}

export async function deleteTask(uid: string, fid: string, tid: string) { await deleteDoc(doc(tasksCol(uid, fid), tid)); }
