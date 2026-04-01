import { AppSettings } from "@/types";

const KEY = "rt_toolkit_v1_settings";

const DEFAULT_SETTINGS: AppSettings = {
  pinnedSourceType: "Ir-192",
  pinnedSourceActivityCi: 100,
  pinnedSourceCalDate: new Date().toISOString().split("T")[0],
  unitsPreference: "imperial",
  defaultFilmId: "default-agfa-d7",
};

export function loadSettings(): AppSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: AppSettings): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(settings));
}

export function updateSettings(partial: Partial<AppSettings>): void {
  saveSettings({ ...loadSettings(), ...partial });
}

export function resetAllData(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem("rt_toolkit_v1_shots");
  localStorage.removeItem("rt_toolkit_v1_films");
  localStorage.removeItem("rt_toolkit_v1_settings");
}
