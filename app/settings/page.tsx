"use client";

import { useState, useEffect } from "react";
import { AppSettings, FilmTypeSetting } from "@/types";
import { loadSettings, saveSettings, resetAllData } from "@/lib/storage/settings";
import { loadFilms, addFilm, updateFilm, deleteFilm } from "@/lib/storage/films";
import { generateId } from "@/lib/storage/shots";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Trash2, Plus, Star, Pencil } from "lucide-react";

export default function SettingsPage() {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [films, setFilms] = useState<FilmTypeSetting[]>([]);
  const [saved, setSaved] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [filmSheetOpen, setFilmSheetOpen] = useState(false);
  const [editingFilm, setEditingFilm] = useState<FilmTypeSetting | null>(null);

  useEffect(() => {
    setSettings(loadSettings());
    setFilms(loadFilms());
  }, []);

  function handleSave() {
    if (!settings) return;
    saveSettings(settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function handleReset() {
    resetAllData();
    setSettings(loadSettings());
    setFilms(loadFilms());
    setConfirmReset(false);
  }

  function handleSetDefault(filmId: string) {
    const updated = films.map((f) => ({ ...f, isDefault: f.id === filmId }));
    updated.forEach((f) => updateFilm(f));
    setFilms(loadFilms());
  }

  function handleDeleteFilm(filmId: string) {
    deleteFilm(filmId);
    setFilms(loadFilms());
  }

  function handleSaveFilm(film: FilmTypeSetting) {
    if (films.find((f) => f.id === film.id)) {
      updateFilm(film);
    } else {
      addFilm(film);
    }
    setFilms(loadFilms());
    setFilmSheetOpen(false);
    setEditingFilm(null);
  }

  if (!settings) return null;

  return (
    <div className="p-4 space-y-6">
      <div className="pt-0">
        <h1 className="text-xl font-bold tracking-tight">Settings</h1>
      </div>

      {/* Units */}
      <section className="space-y-3">
        <h2 className="section-label">
          Preferences
        </h2>
        <Card className="p-4 glass-card">
          <Label className="text-xs text-muted-foreground mb-1.5 block uppercase tracking-wide">
            Default Units
          </Label>
          <Select
            value={settings.unitsPreference}
            onValueChange={(v) =>
              v && setSettings({ ...settings, unitsPreference: v as "imperial" | "metric" })
            }
          >
            <SelectTrigger className="h-12 input-dark">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="select-dropdown">
              <SelectItem value="imperial" className="py-3">Imperial (inches)</SelectItem>
              <SelectItem value="metric" className="py-3">Metric (mm)</SelectItem>
            </SelectContent>
          </Select>
        </Card>
      </section>

      <Button
        onClick={handleSave}
        className="w-full h-12 text-base font-semibold"
      >
        {saved ? "Saved!" : "Save Settings"}
      </Button>

      <Separator />

      {/* Film Types */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="section-label">
            Film Types
          </h2>
          <Sheet open={filmSheetOpen} onOpenChange={(open) => {
            setFilmSheetOpen(open);
            if (!open) setEditingFilm(null);
          }}>
            <Button
              variant="secondary"
              size="sm"
              className="gap-1.5"
              onClick={() => {
                setEditingFilm(null);
                setFilmSheetOpen(true);
              }}
            >
              <Plus size={14} />
              Add Film
            </Button>
            <SheetContent
              side="bottom"
              className="h-[85vh] overflow-y-auto sheet-bg"
            >
              <SheetHeader>
                <SheetTitle>{editingFilm ? "Edit Film" : "Add Film Type"}</SheetTitle>
              </SheetHeader>
              <FilmForm
                key={editingFilm?.id ?? "new"}
                initial={editingFilm}
                onSave={handleSaveFilm}
              />
            </SheetContent>
          </Sheet>
        </div>

        <div className="space-y-2">
          {films.map((film) => (
            <Card key={film.id} className="p-3 glass-card">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-sm">{film.filmName}</p>
                    {film.isDefault && (
                      <Badge className="text-[10px] bg-blue-900 text-blue-300 border-blue-700">
                        Default
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    R={film.rFactor} &middot; Density {film.targetDensityMin}–{film.targetDensityMax} &middot;{" "}
                    {film.developerTempF}°F / {film.developerTimeMin}min
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0 ml-2">
                  {!film.isDefault && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleSetDefault(film.id)}
                      title="Set as default"
                    >
                      <Star size={14} className="text-muted-foreground" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => {
                      setEditingFilm(film);
                      setFilmSheetOpen(true);
                    }}
                  >
                    <Pencil size={14} className="text-muted-foreground" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleDeleteFilm(film.id)}
                  >
                    <Trash2 size={14} className="text-red-400" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      <Separator />

      {/* Reset */}
      <section className="space-y-3 pb-4">
        <h2 className="section-label">
          Data
        </h2>
        <Dialog open={confirmReset} onOpenChange={setConfirmReset}>
          <Button variant="destructive" className="w-full h-12" onClick={() => setConfirmReset(true)}>
            Reset All Data
          </Button>
          <DialogContent className="glass-card-elevated">
            <DialogHeader>
              <DialogTitle>Reset All Data?</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">
              This will delete all shots, film settings, and app settings. This cannot be undone.
            </p>
            <div className="flex gap-3 mt-4">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => setConfirmReset(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={handleReset}
              >
                Reset
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </section>
    </div>
  );
}

function FilmForm({
  initial,
  onSave,
}: {
  initial: FilmTypeSetting | null;
  onSave: (film: FilmTypeSetting) => void;
}) {
  const [filmName, setFilmName] = useState(initial?.filmName ?? "");
  const [rFactor, setRFactor] = useState(String(initial?.rFactor ?? "1.00"));
  const [densityMin, setDensityMin] = useState(String(initial?.targetDensityMin ?? "2.0"));
  const [densityMax, setDensityMax] = useState(String(initial?.targetDensityMax ?? "3.5"));
  const [devTemp, setDevTemp] = useState(String(initial?.developerTempF ?? "75"));
  const [devTime, setDevTime] = useState(String(initial?.developerTimeMin ?? "5"));
  const [notes, setNotes] = useState(initial?.notes ?? "");

  function handleSubmit() {
    onSave({
      id: initial?.id ?? generateId(),
      filmName,
      rFactor: parseFloat(rFactor) || 1,
      targetDensityMin: parseFloat(densityMin) || 2.0,
      targetDensityMax: parseFloat(densityMax) || 3.5,
      developerTempF: parseFloat(devTemp) || 75,
      developerTimeMin: parseFloat(devTime) || 5,
      notes,
      isDefault: initial?.isDefault ?? false,
    });
  }

  return (
    <div className="space-y-4 pt-4">
      <div>
        <Label className="text-xs text-muted-foreground mb-1.5 block uppercase tracking-wide">Film Name</Label>
        <Input
          value={filmName}
          onChange={(e) => setFilmName(e.target.value)}
          placeholder="e.g. Agfa D5"
          className="h-12 input-dark"
        />
      </div>
      <div>
        <Label className="text-xs text-muted-foreground mb-1.5 block uppercase tracking-wide">R-Factor</Label>
        <Input
          type="number"
          value={rFactor}
          onChange={(e) => setRFactor(e.target.value)}
          className="h-12 text-base tabular-nums input-dark"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs text-muted-foreground mb-1.5 block uppercase tracking-wide">Density Min</Label>
          <Input
            type="number"
            value={densityMin}
            onChange={(e) => setDensityMin(e.target.value)}
            className="h-12 text-base tabular-nums input-dark"
          />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground mb-1.5 block uppercase tracking-wide">Density Max</Label>
          <Input
            type="number"
            value={densityMax}
            onChange={(e) => setDensityMax(e.target.value)}
            className="h-12 text-base tabular-nums input-dark"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs text-muted-foreground mb-1.5 block uppercase tracking-wide">Dev Temp (°F)</Label>
          <Input
            type="number"
            value={devTemp}
            onChange={(e) => setDevTemp(e.target.value)}
            className="h-12 text-base tabular-nums input-dark"
          />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground mb-1.5 block uppercase tracking-wide">Dev Time (min)</Label>
          <Input
            type="number"
            value={devTime}
            onChange={(e) => setDevTime(e.target.value)}
            className="h-12 text-base tabular-nums input-dark"
          />
        </div>
      </div>
      <div>
        <Label className="text-xs text-muted-foreground mb-1.5 block uppercase tracking-wide">Notes</Label>
        <Input
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Optional notes"
          className="h-12 input-dark"
        />
      </div>
      <Button onClick={handleSubmit} className="w-full h-12 text-base font-semibold">
        {initial ? "Update Film" : "Add Film"}
      </Button>
    </div>
  );
}
