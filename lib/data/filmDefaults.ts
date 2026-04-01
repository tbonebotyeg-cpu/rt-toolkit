import { FilmTypeSetting } from "@/types";

/**
 * Default film type presets. These are seeded on first launch if localStorage is empty.
 * All values are editable by the user.
 */
export const FILM_DEFAULTS: FilmTypeSetting[] = [
  {
    id: "default-agfa-d3",
    filmName: "Agfa D3",
    targetDensityMin: 2.0,
    targetDensityMax: 3.5,
    rFactor: 6.30,
    developerTempF: 75,
    developerTimeMin: 5,
    notes: "Ultra fine grain. High contrast.",
    isDefault: false,
  },
  {
    id: "default-agfa-d4",
    filmName: "Agfa D4",
    targetDensityMin: 2.0,
    targetDensityMax: 3.5,
    rFactor: 4.00,
    developerTempF: 75,
    developerTimeMin: 5,
    notes: "Fine grain. Good for gamma ray sources.",
    isDefault: false,
  },
  {
    id: "default-agfa-d5",
    filmName: "Agfa D5",
    targetDensityMin: 2.0,
    targetDensityMax: 3.5,
    rFactor: 2.50,
    developerTempF: 75,
    developerTimeMin: 4,
    notes: "Medium grain. General purpose.",
    isDefault: false,
  },
  {
    id: "default-agfa-d7",
    filmName: "Agfa D7",
    targetDensityMin: 2.0,
    targetDensityMax: 3.5,
    rFactor: 1.00,
    developerTempF: 75,
    developerTimeMin: 3.5,
    notes: "Baseline R-factor (1.00). Fast, coarse grain.",
    isDefault: true,
  },
  {
    id: "default-kodak-t200",
    filmName: "Kodak T200",
    targetDensityMin: 2.0,
    targetDensityMax: 3.5,
    rFactor: 1.20,
    developerTempF: 75,
    developerTimeMin: 3,
    notes: "Kodak AA equivalent.",
    isDefault: false,
  },
];
