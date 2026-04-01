export type SourceType = "Ir-192" | "Co-60";

export type Technique = "SWE/SWV" | "DWE/SWV" | "DWE/DWV" | "Panoramic";

export type IqiPlacement = "Source Side" | "Film Side";

export interface ScheduleEntry {
  schedule: string;
  wall: number; // inches
}

export interface PipeEntry {
  nps: string;          // "1/2", "2", "12", "14"
  npsDisplay: string;   // '1/2"', '2"', etc.
  od: number;           // outer diameter in inches
  odNominalEqual: boolean; // true for NPS ≥ 14"
  schedules: ScheduleEntry[];
}

export interface IqiWire {
  wireNumber: number;
  diameterIn: number;  // inches
  diameterMm: number;  // mm
  set: "A" | "B" | "C";
}

export interface IqiResult {
  wallUsed: number;           // inches — the thickness used for selection (parent material only)
  essentialWireNumber: number;
  essentialWireDiam: number;  // inches
  set: "A" | "B" | "C";
  holeTypeEquiv: string;      // e.g. "12-2T"
  filmSideWireNumber?: number; // if film-side placement, +1 wire
  technique: Technique;
  placement: IqiPlacement;
}

export interface ReferenceShot {
  id: string;
  name: string;
  createdAt: string; // ISO date

  // Material / Pipe
  nps: string;
  schedule: string;
  wallThickness: number; // inches, from pipe data or manual
  material: string;

  // Technique
  technique: Technique;
  sfd: number; // Source-to-Film Distance in inches

  // Source at time of shot
  sourceType: SourceType;
  sourceActivityCi: number;
  sourceDate: string; // ISO date of calibration

  // Exposure
  exposureTimeMinutes: number;
  ciSec: number; // computed: sourceActivityCi × exposureTimeMinutes × 60

  // Film & Processing
  filmType: string;
  developerTempF: number;
  developerTimeMin: number;

  // Results
  densityAchieved: number;
  iqi: string; // e.g. "Set B, Wire #7 — Source Side (SWE/SWV)"

  // Notes
  notes: string;
}

export interface FilmTypeSetting {
  id: string;
  filmName: string;
  targetDensityMin: number;
  targetDensityMax: number;
  rFactor: number;
  developerTempF: number;
  developerTimeMin: number;
  notes: string;
  isDefault: boolean;
}

export interface AppSettings {
  pinnedSourceType: SourceType;
  pinnedSourceActivityCi: number;
  pinnedSourceCalDate: string; // ISO date
  cameraSerial: string;
  unitsPreference: "imperial" | "metric";
  defaultFilmId: string;
}

export interface DecayResult {
  activityAtTarget: number;
  daysElapsed: number;
  decayPercent: number;
  projections: { label: string; activity: number }[];
}

export interface UgResult {
  ug: number;        // mm
  ugInches: number;
  pass: boolean;
  limit: number;     // mm — ASME limit
}

export interface IslResult {
  newExposure: number;
  multiplier: number;
}

export interface CiSecResult {
  newTimeMinutes: number;
  newTimeDisplay: string; // "MM:SS"
  ciSec: number;
}

export interface ShotTimeResult {
  newTimeMinutes: number;
  newTimeDisplay: string;    // "MM:SS"
  ciSec: number;             // resulting CI·sec
  activityRatio: number;     // A_ref / A_new
  islMultiplier: number;     // (SFD_new / SFD_ref)²
  filmRatio: number;         // R_new / R_ref
  combinedMultiplier: number;// product of all ratios
}
