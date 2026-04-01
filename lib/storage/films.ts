import { FilmTypeSetting } from "@/types";
import { FILM_DEFAULTS } from "@/lib/data/filmDefaults";

const KEY = "rt_toolkit_v1_films";

export function loadFilms(): FilmTypeSetting[] {
  if (typeof window === "undefined") return FILM_DEFAULTS;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) {
      // First launch — seed defaults
      saveFilms(FILM_DEFAULTS);
      return FILM_DEFAULTS;
    }
    return JSON.parse(raw);
  } catch {
    return FILM_DEFAULTS;
  }
}

export function saveFilms(films: FilmTypeSetting[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(films));
}

export function addFilm(film: FilmTypeSetting): void {
  const films = loadFilms();
  films.push(film);
  saveFilms(films);
}

export function updateFilm(updated: FilmTypeSetting): void {
  const films = loadFilms().map((f) => (f.id === updated.id ? updated : f));
  saveFilms(films);
}

export function deleteFilm(id: string): void {
  saveFilms(loadFilms().filter((f) => f.id !== id));
}

export function getDefaultFilm(): FilmTypeSetting | undefined {
  return loadFilms().find((f) => f.isDefault);
}
