"use client";

import { useState, useEffect } from "react";
import { AppSettings, Camera, FilmTypeSetting, SourceType } from "@/types";
import { loadSettings, saveSettings, resetAllData } from "@/lib/storage/settings";
import { loadFilms, addFilm, updateFilm, deleteFilm } from "@/lib/storage/films";
import { loadCameras, saveCamera, deleteCamera } from "@/lib/storage/cameras";
import { generateId } from "@/lib/storage/shots";
import { calculateDecay, formatActivity } from "@/lib/calculations/decay";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Trash2, Plus, Star, Pencil, Film, Sliders, Database, CheckCircle, Video } from "lucide-react";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [films, setFilms] = useState<FilmTypeSetting[]>([]);
  const [saved, setSaved] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [filmSheetOpen, setFilmSheetOpen] = useState(false);
  const [editingFilm, setEditingFilm] = useState<FilmTypeSetting | null>(null);
  const [cameraSheetOpen, setCameraSheetOpen] = useState(false);
  const [editingCamera, setEditingCamera] = useState<Camera | null>(null);

  useEffect(() => {
    const s = loadSettings();
    setSettings(s);
    setCameras(loadCameras());
    setFilms(loadFilms());
  }, []);

  const selectedCamera = cameras.find((c) => c.id === settings?.pinnedCameraId) ?? null;

  const todayActivity = (() => {
    if (!selectedCamera) return null;
    try {
      const calDate = new Date(selectedCamera.calDate);
      const today = new Date();
      if (!isNaN(calDate.getTime()) && selectedCamera.calActivityCi > 0) {
        return calculateDecay(selectedCamera.calActivityCi, calDate, today, selectedCamera.sourceType).activityAtTarget;
      }
    } catch { /* noop */ }
    return null;
  })();

  function pinCamera(cameraId: string) {
    if (!settings) return;
    const cam = cameras.find((c) => c.id === cameraId);
    const updated: AppSettings = {
      ...settings,
      pinnedCameraId: cameraId,
      cameraSerial: cam?.serial ?? settings.cameraSerial,
      pinnedSourceType: cam?.sourceType ?? settings.pinnedSourceType,
      pinnedSourceActivityCi: cam?.calActivityCi ?? settings.pinnedSourceActivityCi,
      pinnedSourceCalDate: cam?.calDate ?? settings.pinnedSourceCalDate,
    };
    setSettings(updated);
  }

  function handleSave() {
    if (!settings) return;
    saveSettings(settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  function handleReset() {
    resetAllData();
    const s = loadSettings();
    setSettings(s);
    setCameras(loadCameras());
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

  function handleSaveCamera(camera: Camera) {
    saveCamera(camera);
    const updated = loadCameras();
    setCameras(updated);
    // Auto-pin if first camera or was already pinned
    if (updated.length === 1 || settings?.pinnedCameraId === camera.id) {
      pinCamera(camera.id);
    }
    setCameraSheetOpen(false);
    setEditingCamera(null);
  }

  function handleDeleteCamera(id: string) {
    deleteCamera(id);
    const updated = loadCameras();
    setCameras(updated);
    if (settings?.pinnedCameraId === id) {
      const next = updated[0];
      if (next) pinCamera(next.id);
      else if (settings) setSettings({ ...settings, pinnedCameraId: "" });
    }
  }

  if (!settings) return null;

  const activityColor = todayActivity !== null
    ? todayActivity >= 50 ? "text-emerald-400"
    : todayActivity >= 20 ? "text-amber-400"
    : "text-red-400"
    : "text-muted-foreground";

  return (
    <div className="p-4 space-y-6 pb-8">
      {/* Header */}
      <div className="pt-2">
        <h1 className="text-xl font-bold tracking-tight">Settings</h1>
        <p className="text-xs text-muted-foreground mt-0.5">Cameras, film, and preferences</p>
      </div>

      {/* ── Cameras ── */}
      <section className="space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="section-heading">
            <Video size={12} className="text-blue-400 opacity-100 mr-[-2px]" />
            Cameras
          </div>
          <Sheet open={cameraSheetOpen} onOpenChange={(open) => {
            setCameraSheetOpen(open);
            if (!open) setEditingCamera(null);
          }}>
            <Button
              variant="secondary"
              size="sm"
              className="gap-1.5 h-9"
              onClick={() => { setEditingCamera(null); setCameraSheetOpen(true); }}
            >
              <Plus size={14} />
              Add Camera
            </Button>
            <SheetContent side="bottom" className="h-[85vh] overflow-y-auto sheet-bg">
              <SheetHeader>
                <SheetTitle>{editingCamera ? "Edit Camera" : "Add Camera"}</SheetTitle>
              </SheetHeader>
              <CameraForm
                key={editingCamera?.id ?? "new"}
                initial={editingCamera}
                onSave={handleSaveCamera}
              />
            </SheetContent>
          </Sheet>
        </div>

        {cameras.length === 0 ? (
          <div className="empty-state">
            <Video size={24} className="text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No cameras configured</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Tap &quot;Add Camera&quot; to get started.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Selected camera activity banner */}
            {selectedCamera && todayActivity !== null && (
              <div className="glass-card-elevated rounded-2xl overflow-hidden">
                <div className="px-4 py-3 border-b border-white/[0.05]"
                  style={{ background: "linear-gradient(135deg, rgba(18,18,32,0.9), rgba(14,14,24,0.95))" }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Today&apos;s Activity</p>
                      <p className={cn("text-2xl font-extrabold tabular-nums", activityColor)}>
                        {formatActivity(todayActivity)}
                      </p>
                    </div>
                    <div className="text-right space-y-1">
                      <Badge className={cn(
                        "text-xs font-bold",
                        selectedCamera.sourceType === "Ir-192"
                          ? "bg-blue-900/60 text-blue-300 border-blue-700/50"
                          : "bg-purple-900/60 text-purple-300 border-purple-700/50"
                      )}>
                        {selectedCamera.sourceType}
                      </Badge>
                      <p className="text-[10px] text-muted-foreground tabular-nums">
                        Fs {selectedCamera.focalSpotMm} mm
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Camera list */}
            <div className="space-y-2">
              {cameras.map((cam) => (
                <div key={cam.id} className={cn(
                  "glass-card rounded-xl p-3.5",
                  cam.id === settings.pinnedCameraId && "border border-blue-500/40"
                )}>
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="font-semibold text-sm">{cam.serial || "Unnamed"}</p>
                        {cam.id === settings.pinnedCameraId && (
                          <Badge className="text-[10px] bg-blue-900/50 text-blue-300 border-blue-700/50">Active</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {cam.sourceType} &middot; {cam.calActivityCi} Ci &middot; Fs {cam.focalSpotMm} mm &middot; Cal {cam.calDate}
                      </p>
                    </div>
                    <div className="flex items-center gap-0.5 shrink-0 ml-2">
                      {cam.id !== settings.pinnedCameraId && (
                        <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => pinCamera(cam.id)} title="Set active">
                          <Star size={14} className="text-muted-foreground" />
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => { setEditingCamera(cam); setCameraSheetOpen(true); }}>
                        <Pencil size={14} className="text-muted-foreground" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => handleDeleteCamera(cam.id)}>
                        <Trash2 size={14} className="text-red-400" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* ── Display Preferences ── */}
      <section className="space-y-2.5">
        <div className="section-heading">
          <Sliders size={12} className="text-purple-400 opacity-100 mr-[-2px]" />
          Preferences
        </div>

        <div className="glass-card rounded-xl p-4">
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
        </div>
      </section>

      {/* Save Button */}
      <Button
        onClick={handleSave}
        className={cn(
          "w-full h-12 text-base font-semibold gap-2 transition-all duration-300",
          saved && "bg-emerald-600 hover:bg-emerald-600"
        )}
      >
        {saved ? (
          <><CheckCircle size={16} /> Saved!</>
        ) : (
          "Save Settings"
        )}
      </Button>

      <Separator className="opacity-30" />

      {/* ── Film Types ── */}
      <section className="space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="section-heading">
            <Film size={12} className="text-amber-400 opacity-100 mr-[-2px]" />
            Film Types
          </div>
          <Sheet open={filmSheetOpen} onOpenChange={(open) => {
            setFilmSheetOpen(open);
            if (!open) setEditingFilm(null);
          }}>
            <Button
              variant="secondary"
              size="sm"
              className="gap-1.5 h-9"
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

        {films.length === 0 ? (
          <div className="empty-state">
            <Film size={24} className="text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No films configured</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Tap &quot;Add Film&quot; to get started.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {films.map((film) => (
              <div key={film.id} className="glass-card rounded-xl p-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="font-semibold text-sm">{film.filmName}</p>
                      {film.isDefault && (
                        <Badge className="text-[10px] bg-blue-900/50 text-blue-300 border-blue-700/50">
                          Default
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      R={film.rFactor} &middot; Density {film.targetDensityMin}–{film.targetDensityMax} &middot;{" "}
                      {film.developerTempF}°F / {film.developerTimeMin}min
                    </p>
                  </div>
                  <div className="flex items-center gap-0.5 shrink-0 ml-2">
                    {!film.isDefault && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9"
                        onClick={() => handleSetDefault(film.id)}
                        title="Set as default"
                      >
                        <Star size={14} className="text-muted-foreground" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9"
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
                      className="h-9 w-9"
                      onClick={() => handleDeleteFilm(film.id)}
                    >
                      <Trash2 size={14} className="text-red-400" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <Separator className="opacity-30" />

      {/* ── Data Management ── */}
      <section className="space-y-2.5 pb-4">
        <div className="section-heading">
          <Database size={12} className="text-red-400 opacity-100 mr-[-2px]" />
          Data Management
        </div>

        <div className="glass-card rounded-xl p-4 space-y-2">
          <p className="text-sm text-muted-foreground">
            Erase all shots, film settings, and app configuration from this device. This cannot be undone.
          </p>
          <Dialog open={confirmReset} onOpenChange={setConfirmReset}>
            <Button
              variant="destructive"
              className="w-full h-12"
              onClick={() => setConfirmReset(true)}
            >
              Reset All Data
            </Button>
            <DialogContent className="glass-card-elevated mx-4">
              <DialogHeader>
                <DialogTitle>Reset All Data?</DialogTitle>
              </DialogHeader>
              <p className="text-sm text-muted-foreground">
                All shots, film types, cameras, and settings will be permanently deleted. This cannot be undone.
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
                  Reset Everything
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </section>
    </div>
  );
}

function CameraForm({
  initial,
  onSave,
}: {
  initial: Camera | null;
  onSave: (camera: Camera) => void;
}) {
  const [serial, setSerial] = useState(initial?.serial ?? "");
  const [sourceType, setSourceType] = useState<SourceType>(initial?.sourceType ?? "Ir-192");
  const [calActivity, setCalActivity] = useState(String(initial?.calActivityCi ?? "100"));
  const [calDate, setCalDate] = useState(initial?.calDate ?? new Date().toISOString().split("T")[0]);
  const [focalSpot, setFocalSpot] = useState(String(initial?.focalSpotMm ?? "3.0"));

  function handleSubmit() {
    onSave({
      id: initial?.id ?? generateId(),
      serial,
      sourceType,
      calActivityCi: parseFloat(calActivity) || 0,
      calDate,
      focalSpotMm: parseFloat(focalSpot) || 3.0,
    });
  }

  return (
    <div className="space-y-4 pt-4">
      <div>
        <Label className="text-xs text-muted-foreground mb-1.5 block uppercase tracking-wide">Camera Serial Number</Label>
        <Input
          value={serial}
          onChange={(e) => setSerial(e.target.value)}
          placeholder="e.g. IR-2045"
          className="h-12 input-dark"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs text-muted-foreground mb-1.5 block uppercase tracking-wide">Source Type</Label>
          <Select value={sourceType} onValueChange={(v) => v && setSourceType(v as SourceType)}>
            <SelectTrigger className="h-12 input-dark">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="select-dropdown">
              <SelectItem value="Ir-192" className="py-3">Ir-192</SelectItem>
              <SelectItem value="Co-60" className="py-3">Co-60</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs text-muted-foreground mb-1.5 block uppercase tracking-wide">Focal Spot (mm)</Label>
          <Input
            type="number"
            value={focalSpot}
            onChange={(e) => setFocalSpot(e.target.value)}
            placeholder="3.0"
            className="h-12 text-base tabular-nums input-dark"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs text-muted-foreground mb-1.5 block uppercase tracking-wide">Cal Activity (Ci)</Label>
          <Input
            type="number"
            value={calActivity}
            onChange={(e) => setCalActivity(e.target.value)}
            placeholder="100"
            className="h-12 text-base tabular-nums input-dark"
          />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground mb-1.5 block uppercase tracking-wide">Cal Date</Label>
          <Input
            type="date"
            value={calDate}
            onChange={(e) => setCalDate(e.target.value)}
            className="h-12 input-dark"
          />
        </div>
      </div>

      <Button onClick={handleSubmit} className="w-full h-12 text-base font-semibold">
        {initial ? "Update Camera" : "Add Camera"}
      </Button>
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
