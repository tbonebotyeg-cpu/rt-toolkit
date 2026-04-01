import { UgResult } from "@/types";

/**
 * Geometric Unsharpness per ASME Section V, T-274.2
 *
 * Formula: Ug = (Fs × t) / D
 *   Fs = source focal spot size (mm)
 *   t  = distance from source-side of object to film (object-to-film distance, mm)
 *   D  = source-to-object distance (SOD) — from source to the near surface of object (mm)
 *
 * ASME V T-274.2 limit: Ug ≤ 0.020" (0.51 mm) for most welds
 */
export const UG_LIMIT_MM = 0.51; // 0.020 inches

export function calculateUg(Fs: number, t: number, D: number): UgResult {
  if (D <= 0) throw new Error("SOD (D) must be greater than zero");
  if (Fs <= 0) throw new Error("Source size (Fs) must be greater than zero");
  if (t < 0) throw new Error("Object-to-film distance (t) cannot be negative");

  const ug = (Fs * t) / D;
  return {
    ug,
    ugInches: ug / 25.4,
    pass: ug <= UG_LIMIT_MM,
    limit: UG_LIMIT_MM,
  };
}

export function inToMm(inches: number): number {
  return inches * 25.4;
}

export function mmToIn(mm: number): number {
  return mm / 25.4;
}
