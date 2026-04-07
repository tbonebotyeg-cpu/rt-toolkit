"use client";

import { useState, useEffect, useMemo } from "react";
import { ReferenceShot, SourceType, Technique, ShootingTechnique } from "@/types";
import { loadShots, addShot, updateShot, deleteShot, generateId } from "@/lib/storage/shots";
import { loadSettings } from "@/lib/storage/settings";
import { loadFilms } from "@/lib/storage/films";
import { calculateDecay } from "@/lib/calculations/decay";
import { PIPE_SCHEDULES } from "@/lib/data/pipeSchedules";
import { computeCiSec, minutesToMmSs } from "@/lib/calculations/ciSec";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Plus, Trash2, ChevronDown, ChevronUp, BookOpen, Search, X, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ShotsPage() {
  const [shots, setShots] = useState<ReferenceShot[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingShot, setEditingShot] = useState<ReferenceShot | null>(null);
  const [formKey, setFormKey] = useState(0);
  const [search, setSearch] = useState("");
  const [filterSource, setFilterSource] = useState<"all" | SourceType>("all");

  useEffect(() => {
    setShots(loadShots());
  }, []);

  const filteredShots = useMemo(() => {
    let result = shots;
    if (filterSource !== "all") {
      result = result.filter((s) => s.sourceType === filterSource);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.nps.includes(q) ||
          s.schedule.toLowerCase().includes(q) ||
          s.technique.toLowerCase().includes(q) ||
          s.material.toLowerCase().includes(q) ||
          s.filmType.toLowerCase().includes(q) ||
          s.notes.toLowerCase().includes(q)
      );
    }
    return result;
  }, [shots, search, filterSource]);

  function handleDelete(id: string) {
    deleteShot(id);
    setShots(loadShots());
    if (expanded === id) setExpanded(null);
  }

  function handleSave(shot: ReferenceShot) {
    if (editingShot) {
      updateShot(shot);
    } else {
      addShot(shot);
    }
    setShots(loadShots());
    setSheetOpen(false);
    setEditingShot(null);
  }

  function openNewShot() {
    setEditingShot(null);
    setFormKey((k) => k + 1);
    setSheetOpen(true);
  }

  function openEditShot(shot: ReferenceShot) {
    setEditingShot(shot);
    setFormKey((k) => k + 1);
    setSheetOpen(true);
  }

  return (
    <div>
      <div className="px-4 pt-4 pb-2 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Shot Log</h1>
          <p className="text-xs text-muted-foreground mt-1">
            {shots.length} reference exposure{shots.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Sheet open={sheetOpen} onOpenChange={(open) => {
          setSheetOpen(open);
          if (!open) setEditingShot(null);
        }}>
          <Button size="sm" className="gap-1.5" onClick={openNewShot}>
            <Plus size={16} />
            New
          </Button>
          <SheetContent
            side="bottom"
            className="h-[90vh] overflow-y-auto sheet-bg"
          >
            <SheetHeader>
              <SheetTitle>{editingShot ? "Edit Shot" : "Log Reference Shot"}</SheetTitle>
            </SheetHeader>
            <ShotForm key={formKey} initial={editingShot} onSave={handleSave} />
          </SheetContent>
        </Sheet>
      </div>

      {/* Search & Filter */}
      {shots.length > 0 && (
        <div className="px-4 pb-3 space-y-2">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search shots..."
              className="w-full h-10 pl-9 pr-9 rounded-xl text-sm input-dark border border-white/[0.07] bg-[#0e0e18] text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/15 transition-all"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground min-h-0 p-0"
              >
                <X size={14} />
              </button>
            )}
          </div>
          <div className="flex gap-1.5">
            {(["all", "Ir-192", "Co-60"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilterSource(f)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-medium transition-all min-h-0",
                  filterSource === f
                    ? f === "Ir-192"
                      ? "bg-blue-500/20 text-blue-300"
                      : f === "Co-60"
                        ? "bg-purple-500/20 text-purple-300"
                        : "bg-white/10 text-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/[0.04]"
                )}
              >
                {f === "all" ? "All" : f}
              </button>
            ))}
            {(search || filterSource !== "all") && (
              <span className="text-[10px] text-muted-foreground self-center ml-auto tabular-nums">
                {filteredShots.length} of {shots.length}
              </span>
            )}
          </div>
        </div>
      )}

      {shots.length === 0 ? (
        <div className="px-4 py-6">
          <div className="empty-state">
            <BookOpen size={32} className="text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm font-medium">No shots logged yet</p>
            <p className="text-muted-foreground/60 text-xs mt-1">
              Tap &quot;New&quot; to log your first reference exposure.
            </p>
          </div>
        </div>
      ) : filteredShots.length === 0 ? (
        <div className="px-4 py-6">
          <div className="empty-state">
            <Search size={28} className="text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm font-medium">No matches</p>
            <p className="text-muted-foreground/60 text-xs mt-1">
              Try adjusting your search or filter.
            </p>
          </div>
        </div>
      ) : (
        <div className="px-4 pb-4 space-y-2">
          {filteredShots.map((shot) => (
            <Card
              key={shot.id}
              className="overflow-hidden glass-card"
              style={{
                borderLeftWidth: "3px",
                borderLeftColor: shot.sourceType === "Ir-192" ? "rgba(96, 165, 250, 0.5)" : "rgba(168, 85, 247, 0.5)",
              }}
            >
              <button
                onClick={() => setExpanded(expanded === shot.id ? null : shot.id)}
                className="w-full p-3 flex items-center justify-between text-left min-h-0"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-sm truncate">{shot.name}</p>
                    <Badge className={`text-[10px] shrink-0 ${
                      shot.sourceType === "Ir-192"
                        ? "bg-blue-900/60 text-blue-300 border-blue-700/50"
                        : "bg-purple-900/60 text-purple-300 border-purple-700/50"
                    }`}>
                      {shot.sourceType}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {shot.nps}&quot; {shot.schedule} &middot; {shot.technique}
                    {shot.shootingTechnique && (
                      <span className={shot.shootingTechnique === "DWSI" ? " text-amber-400/80" : " text-emerald-400/80"}>
                        {" "}&middot; {shot.shootingTechnique}
                      </span>
                    )}
                    {" "}&middot; {minutesToMmSs(shot.exposureTimeMinutes)} @ {shot.sourceActivityCi.toFixed(1)} Ci
                  </p>
                </div>
                {expanded === shot.id ? (
                  <ChevronUp size={16} className="text-muted-foreground shrink-0 ml-2" />
                ) : (
                  <ChevronDown size={16} className="text-muted-foreground shrink-0 ml-2" />
                )}
              </button>

              {expanded === shot.id && (
                <div className="px-3 pb-3 space-y-2 border-t border-border pt-2 animate-result">
                  <Row label="Pipe" value={`NPS ${shot.nps}" ${shot.schedule} — ${shot.wallThickness.toFixed(3)}"`} />
                  <Row label="Material" value={shot.material} />
                  <Row label="Technique" value={shot.technique} />
                  {shot.shootingTechnique && (
                    <Row label="Shooting Technique" value={shot.shootingTechnique === "DWSI" ? "DWSI — 2× wall (source outside)" : "SWSI — 1× wall (source inside)"} />
                  )}
                  <Row label="SFD" value={`${shot.sfd}"`} />
                  <Separator />
                  <Row label="Source" value={`${shot.sourceType} — ${shot.sourceActivityCi} Ci`} />
                  <Row label="Source Date" value={shot.sourceDate} />
                  <Row label="Exposure" value={`${minutesToMmSs(shot.exposureTimeMinutes)} (${shot.exposureTimeMinutes.toFixed(2)} min)`} />
                  <Row label="CI·sec" value={shot.ciSec.toFixed(0)} />
                  <Separator />
                  <Row label="Film" value={shot.filmType} />
                  <Row label="Developer" value={`${shot.developerTempF}°F / ${shot.developerTimeMin} min`} />
                  <Row label="Density" value={shot.densityAchieved.toFixed(2)} />
                  <Row label="IQI" value={shot.iqi || "—"} />
                  {shot.notes && (
                    <>
                      <Separator />
                      <div>
                        <p className="text-xs text-muted-foreground">Notes</p>
                        <p className="text-sm mt-0.5">{shot.notes}</p>
                      </div>
                    </>
                  )}
                  <Separator />
                  <p className="text-xs text-muted-foreground">
                    Logged {new Date(shot.createdAt).toLocaleDateString()}
                  </p>
                  <div className="flex gap-2 mt-1">
                    <Button
                      variant="secondary"
                      size="sm"
                      className="flex-1 gap-1.5"
                      onClick={() => openEditShot(shot)}
                    >
                      <Pencil size={14} />
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="flex-1 gap-1.5"
                      onClick={() => handleDelete(shot.id)}
                    >
                      <Trash2 size={14} />
                      Delete
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-start gap-4">
      <p className="text-xs text-muted-foreground shrink-0">{label}</p>
      <p className="text-sm font-medium text-right tabular-nums">{value}</p>
    </div>
  );
}

function ShotForm({ initial, onSave }: { initial: ReferenceShot | null; onSave: (shot: ReferenceShot) => void }) {
  const settings = loadSettings();
  const films = loadFilms();

  // Compute today's decayed activity for auto-fill
  let todayActivity = settings.pinnedSourceActivityCi;
  try {
    const calDate = new Date(settings.pinnedSourceCalDate);
    const today = new Date();
    if (!isNaN(calDate.getTime()) && settings.pinnedSourceActivityCi > 0) {
      const decay = calculateDecay(settings.pinnedSourceActivityCi, calDate, today, settings.pinnedSourceType);
      todayActivity = parseFloat(decay.activityAtTarget.toFixed(1));
    }
  } catch { /* use cal activity */ }

  const [name, setName] = useState(initial?.name ?? "");
  const [nps, setNps] = useState(initial?.nps ?? "6");
  const [schedule, setSchedule] = useState(initial?.schedule ?? "STD");
  const [wallOverride, setWallOverride] = useState(initial ? String(initial.wallThickness) : "");
  const [material, setMaterial] = useState(initial?.material ?? "Carbon Steel");
  const [technique, setTechnique] = useState<Technique>(initial?.technique ?? "SWE/SWV");
  const [shootingTechnique, setShootingTechnique] = useState<ShootingTechnique>(initial?.shootingTechnique ?? "SWSI");
  const [sfd, setSfd] = useState(initial ? String(initial.sfd) : "36");
  const [sourceType, setSourceType] = useState<SourceType>(initial?.sourceType ?? settings.pinnedSourceType);
  const [sourceActivity, setSourceActivity] = useState(initial ? String(initial.sourceActivityCi) : String(todayActivity));
  const [sourceDate, setSourceDate] = useState(initial?.sourceDate ?? new Date().toISOString().split("T")[0]);
  const [exposureTime, setExposureTime] = useState(initial ? String(initial.exposureTimeMinutes) : "");
  const [filmType, setFilmType] = useState(initial?.filmType ?? films.find((f) => f.isDefault)?.filmName ?? films[0]?.filmName ?? "");
  const [devTemp, setDevTemp] = useState(initial ? String(initial.developerTempF) : "75");
  const [devTime, setDevTime] = useState(initial ? String(initial.developerTimeMin) : "5");
  const [density, setDensity] = useState(initial ? String(initial.densityAchieved) : "2.5");
  const [iqi, setIqi] = useState(initial?.iqi ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [error, setError] = useState("");

  const pipe = PIPE_SCHEDULES.find((p) => p.nps === nps);
  const schedEntry = pipe?.schedules.find((s) => s.schedule === schedule);
  const wallThickness = wallOverride ? parseFloat(wallOverride) : (schedEntry?.wall ?? 0);

  function handleSubmit() {
    const actCi = parseFloat(sourceActivity);
    const timeMins = parseFloat(exposureTime);

    if (!exposureTime || isNaN(timeMins) || timeMins <= 0) {
      setError("Exposure time is required");
      return;
    }
    if (isNaN(actCi) || actCi <= 0) {
      setError("Source activity is required");
      return;
    }

    setError("");
    const shot: ReferenceShot = {
      id: initial?.id ?? generateId(),
      name: name || `${nps}" ${schedule} — ${technique}`,
      createdAt: initial?.createdAt ?? new Date().toISOString(),
      nps,
      schedule,
      wallThickness,
      material,
      technique,
      shootingTechnique,
      sfd: parseFloat(sfd) || 0,
      sourceType,
      sourceActivityCi: actCi,
      sourceDate,
      exposureTimeMinutes: timeMins,
      ciSec: computeCiSec(actCi, timeMins),
      filmType,
      developerTempF: parseFloat(devTemp) || 75,
      developerTimeMin: parseFloat(devTime) || 5,
      densityAchieved: parseFloat(density) || 0,
      iqi,
      notes,
    };
    onSave(shot);
  }

  // Computed CI·sec preview
  const previewCiSec = (() => {
    const a = parseFloat(sourceActivity);
    const t = parseFloat(exposureTime);
    if (isNaN(a) || isNaN(t) || a <= 0 || t <= 0) return null;
    return computeCiSec(a, t);
  })();

  return (
    <div className="space-y-4 pt-4">
      {error && (
        <div className="p-3 rounded-lg bg-red-900/30 border border-red-500/30">
          <p className="text-red-300 text-sm">{error}</p>
        </div>
      )}

      <div>
        <Label className="text-xs text-muted-foreground mb-1.5 block uppercase tracking-wide">
          Shot Name (optional)
        </Label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder='e.g. "6\" STD Butt Weld"'
          className="h-12 input-dark"
        />
      </div>

      {/* Pipe */}
      <div className="form-section space-y-3">
        <p className="section-label">Pipe</p>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block uppercase tracking-wide">NPS</Label>
            <Select value={nps} onValueChange={(v) => v && setNps(v)}>
              <SelectTrigger className="h-12 input-dark">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="select-dropdown max-h-60">
                {PIPE_SCHEDULES.map((p) => (
                  <SelectItem key={p.nps} value={p.nps} className="py-2">
                    {p.npsDisplay}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block uppercase tracking-wide">Schedule</Label>
            <Select value={schedule} onValueChange={(v) => v && setSchedule(v)}>
              <SelectTrigger className="h-12 input-dark">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="select-dropdown max-h-60">
                {(pipe?.schedules ?? []).map((s) => (
                  <SelectItem key={s.schedule} value={s.schedule} className="py-2">
                    {s.schedule}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block uppercase tracking-wide">Wall (in)</Label>
            <Input
              type="number"
              value={wallOverride || (wallThickness ? wallThickness.toFixed(3) : "")}
              onChange={(e) => setWallOverride(e.target.value)}
              className="h-12 text-base tabular-nums input-dark"
            />
          </div>
        </div>
        <div>
          <Label className="text-xs text-muted-foreground mb-1.5 block uppercase tracking-wide">Material</Label>
          <Input
            value={material}
            onChange={(e) => setMaterial(e.target.value)}
            className="h-12 input-dark"
          />
        </div>
      </div>

      {/* Technique */}
      <div className="form-section space-y-3">
        <p className="section-label">Technique</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block uppercase tracking-wide">Technique</Label>
            <Select value={technique} onValueChange={(v) => v && setTechnique(v as Technique)}>
              <SelectTrigger className="h-12 input-dark">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="select-dropdown">
                <SelectItem value="SWE/SWV" className="py-3">SWE/SWV</SelectItem>
                <SelectItem value="DWE/SWV" className="py-3">DWE/SWV</SelectItem>
                <SelectItem value="DWE/DWV" className="py-3">DWE/DWV</SelectItem>
                <SelectItem value="Panoramic" className="py-3">Panoramic</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block uppercase tracking-wide">SFD (in)</Label>
            <Input
              type="number"
              value={sfd}
              onChange={(e) => setSfd(e.target.value)}
              className="h-12 text-base tabular-nums input-dark"
            />
          </div>
        </div>
        <div>
          <Label className="text-xs text-muted-foreground mb-2 block uppercase tracking-wide">Shooting Technique</Label>
          <div className="grid grid-cols-2 gap-2">
            {(["SWSI", "DWSI"] as ShootingTechnique[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setShootingTechnique(t)}
                className={`p-3 rounded-xl border text-left transition-all duration-200 ${
                  shootingTechnique === t
                    ? t === "DWSI"
                      ? "bg-amber-900/30 border-amber-500/50"
                      : "bg-emerald-900/30 border-emerald-500/50"
                    : "border-white/[0.06] bg-white/[0.02]"
                }`}
              >
                <p className={`font-bold text-sm ${
                  shootingTechnique === t
                    ? t === "DWSI" ? "text-amber-300" : "text-emerald-300"
                    : "text-muted-foreground"
                }`}>{t}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {t === "SWSI" ? "Source inside — 1× wall" : "Source outside — 2× wall"}
                </p>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Source */}
      <div className="form-section space-y-3">
        <p className="section-label">Source</p>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block uppercase tracking-wide">Source</Label>
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
            <Label className="text-xs text-muted-foreground mb-1.5 block uppercase tracking-wide">Activity (Ci)</Label>
            <Input
              type="number"
              value={sourceActivity}
              onChange={(e) => { setSourceActivity(e.target.value); setError(""); }}
              className="h-12 text-base tabular-nums input-dark"
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block uppercase tracking-wide">Date</Label>
            <Input
              type="date"
              value={sourceDate}
              onChange={(e) => setSourceDate(e.target.value)}
              className="h-12 input-dark"
            />
          </div>
        </div>
      </div>

      {/* Exposure */}
      <div className="form-section space-y-3">
        <p className="section-label">Exposure</p>
        <div>
          <Label className="text-xs text-muted-foreground mb-1.5 block uppercase tracking-wide">
            Exposure Time (min)
          </Label>
          <Input
            type="number"
            value={exposureTime}
            onChange={(e) => { setExposureTime(e.target.value); setError(""); }}
            placeholder="e.g. 2.5"
            className={cn("h-12 text-base tabular-nums input-dark", error && !exposureTime && "border-red-500/50")}
          />
        </div>
        {previewCiSec !== null && (
          <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.05]">
            <span className="text-xs text-muted-foreground">CI·sec</span>
            <span className="tabular-nums font-semibold text-sm text-cyan-300">{previewCiSec.toFixed(0)}</span>
          </div>
        )}
      </div>

      {/* Film & Results */}
      <div className="form-section space-y-3">
        <p className="section-label">Film &amp; Results</p>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block uppercase tracking-wide">Film</Label>
            <Select value={filmType} onValueChange={(v) => v && setFilmType(v)}>
              <SelectTrigger className="h-12 input-dark">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="select-dropdown">
                {films.map((f) => (
                  <SelectItem key={f.id} value={f.filmName} className="py-2">
                    {f.filmName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block uppercase tracking-wide">Dev °F</Label>
            <Input
              type="number"
              value={devTemp}
              onChange={(e) => setDevTemp(e.target.value)}
              className="h-12 text-base tabular-nums input-dark"
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block uppercase tracking-wide">Dev min</Label>
            <Input
              type="number"
              value={devTime}
              onChange={(e) => setDevTime(e.target.value)}
              className="h-12 text-base tabular-nums input-dark"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block uppercase tracking-wide">Density</Label>
            <Input
              type="number"
              value={density}
              onChange={(e) => setDensity(e.target.value)}
              className="h-12 text-base tabular-nums input-dark"
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block uppercase tracking-wide">IQI</Label>
            <Input
              value={iqi}
              onChange={(e) => setIqi(e.target.value)}
              placeholder="Set B, Wire #7"
              className="h-12 input-dark"
            />
          </div>
        </div>
      </div>

      <div>
        <Label className="text-xs text-muted-foreground mb-1.5 block uppercase tracking-wide">Notes</Label>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Additional notes..."
          className="min-h-[80px] input-dark"
        />
      </div>

      <Button onClick={handleSubmit} className="w-full h-12 text-base font-semibold">
        {initial ? "Update Shot" : "Save Shot"}
      </Button>
    </div>
  );
}
