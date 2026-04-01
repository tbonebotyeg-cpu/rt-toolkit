import { Camera } from "@/types";

const KEY = "rt_cameras";

export function loadCameras(): Camera[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveCamera(camera: Camera): void {
  if (typeof window === "undefined") return;
  const cameras = loadCameras();
  const idx = cameras.findIndex((c) => c.id === camera.id);
  if (idx >= 0) {
    cameras[idx] = camera;
  } else {
    cameras.push(camera);
  }
  localStorage.setItem(KEY, JSON.stringify(cameras));
}

export function deleteCamera(id: string): void {
  if (typeof window === "undefined") return;
  const cameras = loadCameras().filter((c) => c.id !== id);
  localStorage.setItem(KEY, JSON.stringify(cameras));
}
