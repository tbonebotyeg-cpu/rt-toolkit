import { ReferenceShot } from "@/types";

const KEY = "rt_toolkit_v1_shots";

export function loadShots(): ReferenceShot[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveShots(shots: ReferenceShot[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(shots));
}

export function addShot(shot: ReferenceShot): void {
  const shots = loadShots();
  shots.unshift(shot);
  saveShots(shots);
}

export function updateShot(updated: ReferenceShot): void {
  const shots = loadShots().map((s) => (s.id === updated.id ? updated : s));
  saveShots(shots);
}

export function deleteShot(id: string): void {
  saveShots(loadShots().filter((s) => s.id !== id));
}

export function generateId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}
