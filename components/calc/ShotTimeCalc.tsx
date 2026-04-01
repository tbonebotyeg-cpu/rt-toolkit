"use client";

import { useState, useEffect, useMemo } from "react";
import { ReferenceShot, FilmTypeSetting, SourceType, ShotTimeResult, ShootingTechnique } from "@/types";
import { calcShotTimeFromRef } from "@/lib/calculations/shotTime";
import { calcTimeFromChart, CHART_REF_SFD } from "@/lib/data/exposureChart";
import { minutesToMmSs } from "@/lib/calculations/ciSec";
import { loadShots } from "@/lib/storage/shots";
import { loadFilms } from "@/lib/storage/films";
import { loadSettings } from "@/lib/storage/settings";
import { calculateDecay } from "@/lib/calculations/decay";
import { PIPE_SCHEDULES } from "@/lib/data/pipeSchedules";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

type Mode = "manual" | "fromShot";

interface ManualResult {
  timeMinutes: number;
  timeDisplay: string;
  baseCiSec: number;
  islMultiplier: number;
  filmRatio: number;
  ciSec: number;
  wallIn: number;
  effectiveWall: number;
  technique: ShootingTechnique;
}

export default function ShotTimeCalc() {
  const [mode, setMode] = useState<Mode>("manual");
  const [films, setFilms] = useState<FilmTypeSetting[]>([]);
  const [shots, setShots] = useState<ReferenceShot[]>([]);

  // Manual mode inputs
  const [sourceType, setSourceType] = useState<SourceType>("Ir-192");
  const [nps, setNps] = useState("6");
  const [schedule, setSchedule] = useState("STD");
  const [wallOverride, setWallOverride] = useState("");
  const [activity, setActivity] = useState("80");
  const [reinforcement, setReinforcement] = useState("0.125");
  const [sfdOverride, setSfdOverride] = useState("");
  const [filmName, setFilmName] = useState("");
  const [shootingTechnique, setShootingTechnique] = useState<ShootingTechnique>("SWSI");

  // From Shot mode inputs
  const [selectedShotId, setSelectedShotId] = useState("");
  const [shotActivityNew, setShotActivityNew] = useState("");
  const [shotSfdNew, setShotSfdNew] = useState("");
  const [shotFilmName, setShotFilmName] = useState("");

  // Source info (for display)
  const [calActivityCi, setCalActivityCi] = useState<number>(0);

  // Results
  const [manualResult, setManualResult] = useState<ManualResult | null>(null);
  const [shotResult, setShotResult] = useState<ShotTimeResult | null>(null);
  const [error, setError] = useState("");

  // Pipe data
  const pipe = useMemo(() => PIPE_SCHEDULES.find((p) => p.nps === nps), [nps]);
  const schedules = useMemo(() => pipe?.schedules ?? [], [pipe]);
  const schedEntry = useMemo(
    () => schedules.find((s) => s.schedule === schedule),
    [schedules, schedule]
  );
  const wallThickness = wallOverride
    ? parseFloat(wallOverride)
    : schedEntry?.wall ?? 0;

  // Effective wall for exposure calculation
  const effectiveWall = shootingTechnique === "DWSI" ? wallThickness * 2 : wallThickness;

  // Auto-compute SFD = OD + 2 * reinforcement height
  const computedSfd = useMemo(() => {
    const r = parseFloat(reinforcement) || 0;
    const od = pipe?.od ?? 0;
    return od > 0 ? od + 2 * r : 0;
  }, [pipe, reinforcement]);

  const sfd = sfdOverride ? sfdOverride : (computedSfd > 0 ? computedSfd.toFixed(3) : "");

  // Load data on mount
  useEffect(() => {
    const f = loadFilms();
    const s = loadShots();
    const settings = loadSettings();
    setFilms(f);
    setShots(s);
    setSourceType(settings.pinnedSourceType);
    setCalActivityCi(settings.pinnedSourceActivityCi);

    try {
      const calDate = new Date(settings.pinnedSourceCalDate);
      const today = new Date();
      if (!isNaN(calDate.getTime()) && settings.pinnedSourceActivityCi > 0) {
        const decay = calculateDecay(settings.pinnedSourceActivityCi, calDate, today, settings.pinnedSourceType);
        setActivity(decay.activityAtTarget.toFixed(1));
      } else {
        setActivity(String(settings.pinnedSourceActivityCi));
      }
    } catch {
      setActivity(String(settings.pinnedSourceActivityCi));
    }

    const defaultFilm = f.find((film) => film.isDefault) ?? f[0];
    if (defaultFilm) {
      setFilmName(defaultFilm.filmName);
      setShotFilmName(defaultFilm.filmName);
    }
  }, []);

  // Reset schedule when NPS changes
  useEffect(() => {
    if (schedules.length > 0 && !schedules.find((s) => s.schedule === schedule)) {
      setSchedule(schedules[0].schedule);
    }
  }, [schedules, schedule]);

  // Auto-populate when selecting a reference shot
  useEffect(() => {
    if (mode !== "fromShot" || !selectedShotId) return;
    const shot = shots.find((s) => s.id === selectedShotId);
    if (!shot) return;
    setShotActivityNew(String(shot.sourceActivityCi));
    setShotSfdNew(String(shot.sfd));
    if (shot.filmType) setShotFilmName(shot.filmType);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedShotId]);

  // Recalculate manual mode
  useEffect(() => {
    if (mode !== "manual") return;
    calcManual();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sourceType, wallThickness, activity, sfd, sfdOverride, computedSfd, filmName, mode, films, shootingTechnique]);

  // Recalculate from-shot mode
  useEffect(() => {
    if (mode !== "fromShot") return;
    calcFromShot();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedShotId, shotActivityNew, shotSfdNew, shotFilmName, mode, films, shots]);

  function calcManual() {
    setError("");
    const a = parseFloat(activity);
    const s = parseFloat(sfd);
    const film = films.find((f) => f.filmName === filmName);
    const r = film?.rFactor ?? 1.0;

    if (isNaN(a) || isNaN(s) || !wallThickness || wallThickness <= 0) {
      setManualResult(null);
      return;
    }

    try {
      const res = calcTimeFromChart(effectiveWall, sourceType, a, s, r);
      const ciSec = a * res.timeMinutes * 60;
      setManualResult({
        timeMinutes: res.timeMinutes,
        timeDisplay: minutesToMmSs(res.timeMinutes),
        baseCiSec: res.baseCiSec,
        islMultiplier: res.islMultiplier,
        filmRatio: res.filmRatio,
        ciSec,
        wallIn: wallThickness,
        effectiveWall,
        technique: shootingTechnique,
      });
    } catch (e) {
      setError(String(e));
      setManualResult(null);
    }
  }

  function calcFromShot() {
    setError("");
    const shot = shots.find((s) => s.id === selectedShotId);
    if (!shot) {
      setShotResult(null);
      return;
    }
    const aNew = parseFloat(shotActivityNew);
    const sNew = parseFloat(shotSfdNew);
    const film = films.find((f) => f.filmName === shotFilmName);
    const rNew = film?.rFactor ?? 1.0;

    if (isNaN(aNew) || isNaN(sNew)) {
      setShotResult(null);
      return;
    }

    try {
      const refFilm = films.find((f) => f.filmName === shot.filmType);
      const rRef = refFilm?.rFactor ?? 1.0;
      setShotResult(
        calcShotTimeFromRef(
          shot.exposureTimeMinutes,
          shot.sourceActivityCi,
          aNew,
          shot.sfd,
          sNew,
          rRef,
          rNew
        )
      );
    } catch (e) {
      setError(String(e));
      setShotResult(null);
    }
  }

  const selectedShot = shots.find((s) => s.id === selectedShotId);

  return (
    <div className="p-4 space-y-4">
      {/* Mode Toggle */}
      <div className="flex gap-1 p-1 rounded-xl bg-white/[0.04]">
        {(["manual", "fromShot"] as Mode[]).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={cn(
              "flex-1 py-2.5 text-xs font-medium transition-all duration-200 rounded-lg",
              mode === m
                ? "bg-blue-500/25 text-blue-300 shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-white/[0.04]"
            )}
          >
            {m === "manual" ? "Exposure Chart" : "From Shot"}
          </button>
        ))}
      </div>

      {/* ───── Manual / Exposure Chart Mode ───── */}
      {mode === "manual" && (
        <div className="space-y-4">
          {/* Formula */}
          <div className="formula-box">
            <p className="text-xs text-muted-foreground font-mono">
              T = (CI·sec<sub>chart</sub> / (A × 60)) × (SFD / {CHART_REF_SFD})² × R
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Built-in chart (steel, density ~2.0). Ref SFD = {CHART_REF_SFD}&quot;
            </p>
          </div>

          {/* ── Shooting Technique Toggle ── */}
          <div>
            <Label className="text-xs text-muted-foreground mb-2 block uppercase tracking-wide">
              Shooting Technique
            </Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setShootingTechnique("SWSI")}
                className={cn(
                  "p-4 rounded-xl border text-left transition-all duration-200",
                  shootingTechnique === "SWSI"
                    ? "bg-emerald-900/30 border-emerald-500/50"
                    : "border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12] hover:bg-white/[0.04]"
                )}
              >
                <p className={cn(
                  "font-bold text-base tracking-wide",
                  shootingTechnique === "SWSI" ? "text-emerald-300" : "text-muted-foreground"
                )}>SWSI</p>
                <p className={cn(
                  "text-xs mt-0.5 font-medium",
                  shootingTechnique === "SWSI" ? "text-emerald-400/80" : "text-muted-foreground/70"
                )}>Source Inside</p>
                <p className={cn(
                  "text-[10px] mt-1 tabular-nums",
                  shootingTechnique === "SWSI" ? "text-emerald-500/70" : "text-muted-foreground/50"
                )}>1× wall thickness</p>
              </button>
              <button
                onClick={() => setShootingTechnique("DWSI")}
                className={cn(
                  "p-4 rounded-xl border text-left transition-all duration-200",
                  shootingTechnique === "DWSI"
                    ? "bg-amber-900/30 border-amber-500/50"
                    : "border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12] hover:bg-white/[0.04]"
                )}
              >
                <p className={cn(
                  "font-bold text-base tracking-wide",
                  shootingTechnique === "DWSI" ? "text-amber-300" : "text-muted-foreground"
                )}>DWSI</p>
                <p className={cn(
                  "text-xs mt-0.5 font-medium",
                  shootingTechnique === "DWSI" ? "text-amber-400/80" : "text-muted-foreground/70"
                )}>Source Outside</p>
                <p className={cn(
                  "text-[10px] mt-1 tabular-nums",
                  shootingTechnique === "DWSI" ? "text-amber-500/70" : "text-muted-foreground/50"
                )}>2× wall thickness</p>
              </button>
            </div>
          </div>

          {/* Source + NPS + Schedule */}
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
              <Label className="text-xs text-muted-foreground mb-1.5 block uppercase tracking-wide">NPS</Label>
              <Select value={nps} onValueChange={(v) => v && setNps(v)}>
                <SelectTrigger className="h-12 input-dark">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-60 select-dropdown">
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
                <SelectContent className="max-h-60 select-dropdown">
                  {schedules.map((s) => (
                    <SelectItem key={s.schedule} value={s.schedule} className="py-2">
                      {s.schedule}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Wall thickness + Effective Wall */}
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <Label className="text-xs text-muted-foreground mb-1.5 block uppercase tracking-wide">
                  Wall Thickness (in)
                </Label>
                <Input
                  type="number"
                  value={wallOverride || (wallThickness ? wallThickness.toFixed(3) : "")}
                  onChange={(e) => setWallOverride(e.target.value)}
                  placeholder={schedEntry?.wall.toFixed(3) ?? "0.000"}
                  className="h-12 text-base tabular-nums input-dark"
                />
              </div>
              {!wallOverride && schedEntry && (
                <Badge variant="secondary" className="mt-5 text-[10px] shrink-0">
                  {schedule} — {schedEntry.wall.toFixed(3)}&quot;
                </Badge>
              )}
            </div>

            {/* Effective Wall Display */}
            {wallThickness > 0 && (
              <div className={cn(
                "flex items-center justify-between px-3 py-2.5 rounded-lg text-sm",
                shootingTechnique === "DWSI"
                  ? "bg-amber-900/20 border border-amber-500/30"
                  : "bg-emerald-900/15 border border-emerald-500/25"
              )}>
                <div className="flex items-center gap-2">
                  <Badge className={cn(
                    "text-[10px] font-bold",
                    shootingTechnique === "DWSI"
                      ? "bg-amber-800/60 text-amber-300 border-amber-600/50"
                      : "bg-emerald-800/60 text-emerald-300 border-emerald-600/50"
                  )}>
                    {shootingTechnique}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {shootingTechnique === "DWSI"
                      ? `2 × ${wallThickness.toFixed(3)}"`
                      : `1 × ${wallThickness.toFixed(3)}"`}
                  </span>
                </div>
                <span className={cn(
                  "font-bold tabular-nums",
                  shootingTechnique === "DWSI" ? "text-amber-300" : "text-emerald-300"
                )}>
                  Eff. {effectiveWall.toFixed(3)}&quot;
                </span>
              </div>
            )}
          </div>

          {/* Activity */}
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block uppercase tracking-wide">
              Activity (Ci)
            </Label>
            <Input
              type="number"
              value={activity}
              onChange={(e) => setActivity(e.target.value)}
              placeholder="80"
              className="h-12 text-base tabular-nums input-dark"
            />
            {calActivityCi > 0 && parseFloat(activity) !== calActivityCi && (
              <p className="text-[10px] text-muted-foreground mt-1 tabular-nums">
                Decayed from {calActivityCi} Ci cal — {sourceType}
              </p>
            )}
          </div>

          {/* SFD */}
          <div className="formula-box space-y-2.5">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">
                SFD (Source-to-Film)
              </p>
              <p className="tabular-nums font-bold text-base text-white">
                {sfd ? `${parseFloat(sfd).toFixed(3)}"` : "—"}
              </p>
            </div>
            {pipe && computedSfd > 0 && !sfdOverride && (
              <p className="text-[11px] text-muted-foreground tabular-nums">
                OD {pipe.od.toFixed(3)}&quot; + 2 × {(parseFloat(reinforcement) || 0).toFixed(3)}&quot; reinf = {computedSfd.toFixed(3)}&quot;
              </p>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-[10px] text-muted-foreground mb-1 block uppercase tracking-wide">
                  Reinforcement (in)
                </Label>
                <Input
                  type="number"
                  value={reinforcement}
                  onChange={(e) => { setReinforcement(e.target.value); setSfdOverride(""); }}
                  placeholder="0.125"
                  className="h-10 text-sm tabular-nums input-dark"
                />
              </div>
              <div>
                <Label className="text-[10px] text-muted-foreground mb-1 block uppercase tracking-wide">
                  Override SFD (in)
                </Label>
                <Input
                  type="number"
                  value={sfdOverride}
                  onChange={(e) => setSfdOverride(e.target.value)}
                  placeholder={computedSfd > 0 ? computedSfd.toFixed(3) : "manual"}
                  className="h-10 text-sm tabular-nums input-dark"
                />
              </div>
            </div>
          </div>

          {/* Film */}
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block uppercase tracking-wide">
              Film Type
            </Label>
            <Select value={filmName} onValueChange={(v) => v && setFilmName(v)}>
              <SelectTrigger className="h-12 input-dark">
                <SelectValue placeholder="Select film" />
              </SelectTrigger>
              <SelectContent className="select-dropdown">
                {films.map((f) => (
                  <SelectItem key={f.id} value={f.filmName} className="py-2">
                    {f.filmName} (R={f.rFactor})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Manual Result */}
          {manualResult && (
            <Card className="overflow-hidden animate-result glass-card-elevated" style={{
              boxShadow: "0 0 32px rgba(6, 182, 212, 0.07), 0 4px 24px rgba(0,0,0,0.3)"
            }}>
              {/* Colored top band */}
              <div className={cn(
                "h-1",
                manualResult.technique === "DWSI"
                  ? "bg-gradient-to-r from-amber-500 to-amber-600"
                  : "bg-gradient-to-r from-cyan-500 to-blue-500"
              )} />
              <div className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                      Exposure Time
                    </p>
                    <p className="result-value-lg tabular-nums text-cyan-300">
                      {manualResult.timeDisplay}
                    </p>
                    <p className="text-muted-foreground text-sm">
                      {manualResult.timeMinutes.toFixed(2)} min
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <Badge className={cn(
                      "text-xs font-bold",
                      manualResult.timeMinutes > 30
                        ? "bg-amber-900 text-amber-300 border-amber-700"
                        : "bg-green-900 text-green-300 border-green-700"
                    )}>
                      {sourceType}
                    </Badge>
                    <Badge className={cn(
                      "text-[10px] font-bold",
                      manualResult.technique === "DWSI"
                        ? "bg-amber-900/60 text-amber-300 border-amber-700/50"
                        : "bg-emerald-900/60 text-emerald-300 border-emerald-700/50"
                    )}>
                      {manualResult.technique}
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 border-t border-border pt-3">
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">Base CI·sec</p>
                    <p className="tabular-nums font-semibold text-sm mt-0.5">
                      {manualResult.baseCiSec.toFixed(0)}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      @ 1Ci, {CHART_REF_SFD}&quot;
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">ISL (SFD)</p>
                    <p className="tabular-nums font-semibold text-sm mt-0.5">
                      {manualResult.islMultiplier.toFixed(3)}×
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">Film (R)</p>
                    <p className="tabular-nums font-semibold text-sm mt-0.5">
                      {manualResult.filmRatio.toFixed(2)}×
                    </p>
                  </div>
                </div>

                <div className={cn(
                  "flex items-center justify-between px-2.5 py-2 rounded-lg text-xs border-t border-border pt-3"
                )}>
                  <span className="text-muted-foreground">
                    Nominal: {manualResult.wallIn.toFixed(3)}&quot;
                    {manualResult.technique === "DWSI" && (
                      <span className="text-amber-400/80"> → Eff: {manualResult.effectiveWall.toFixed(3)}&quot;</span>
                    )}
                  </span>
                  <span className="text-muted-foreground tabular-nums">
                    CI·sec: {manualResult.ciSec.toFixed(0)}
                  </span>
                </div>

                <p className="text-[10px] text-muted-foreground italic">
                  Approximate — verify against your company exposure charts
                </p>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* ───── From Shot Mode ───── */}
      {mode === "fromShot" && (
        <div className="space-y-3">
          <div className="formula-box">
            <p className="text-xs text-muted-foreground font-mono">
              T₂ = T₁ × (A₁ / A₂) × (D₂ / D₁)² × (R₂ / R₁)
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Recalculate from a logged reference shot with new parameters
            </p>
          </div>

          {shots.length === 0 ? (
            <div className="formula-box text-center">
              <p className="text-sm text-muted-foreground">No reference shots logged.</p>
              <p className="text-xs text-muted-foreground mt-1">
                Add a shot in the Shots tab to use this mode.
              </p>
            </div>
          ) : (
            <>
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block uppercase tracking-wide">
                  Reference Shot
                </Label>
                <Select value={selectedShotId} onValueChange={(v) => v && setSelectedShotId(v)}>
                  <SelectTrigger className="h-12 input-dark">
                    <SelectValue placeholder="Select a shot" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60 select-dropdown">
                    {shots.map((s) => (
                      <SelectItem key={s.id} value={s.id} className="py-2">
                        {s.name} — {minutesToMmSs(s.exposureTimeMinutes)} @ {s.sourceActivityCi} Ci
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedShot && (
                <div className="formula-box">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2 font-semibold">
                    Reference
                  </p>
                  <div className="grid grid-cols-5 gap-2">
                    <MiniStat label="Time" value={minutesToMmSs(selectedShot.exposureTimeMinutes)} />
                    <MiniStat label="Activity" value={`${selectedShot.sourceActivityCi} Ci`} />
                    <MiniStat label="SFD" value={`${selectedShot.sfd}"`} />
                    <MiniStat label="Film" value={selectedShot.filmType} />
                    <MiniStat label="CI·sec" value={selectedShot.ciSec.toFixed(0)} />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5 block uppercase tracking-wide">
                    New Activity (Ci)
                  </Label>
                  <Input
                    type="number"
                    value={shotActivityNew}
                    onChange={(e) => setShotActivityNew(e.target.value)}
                    className="h-12 text-base tabular-nums input-dark"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5 block uppercase tracking-wide">
                    New SFD (in)
                  </Label>
                  <Input
                    type="number"
                    value={shotSfdNew}
                    onChange={(e) => setShotSfdNew(e.target.value)}
                    className="h-12 text-base tabular-nums input-dark"
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block uppercase tracking-wide">
                  New Film Type
                </Label>
                <Select value={shotFilmName} onValueChange={(v) => v && setShotFilmName(v)}>
                  <SelectTrigger className="h-12 input-dark">
                    <SelectValue placeholder="Select film" />
                  </SelectTrigger>
                  <SelectContent className="select-dropdown">
                    {films.map((f) => (
                      <SelectItem key={f.id} value={f.filmName} className="py-2">
                        {f.filmName} (R={f.rFactor})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* From Shot Result */}
              {shotResult && (
                <Card className="overflow-hidden animate-result glass-card-elevated" style={{
                  boxShadow: "0 0 32px rgba(59,130,246,0.07), 0 4px 24px rgba(0,0,0,0.3)"
                }}>
                  <div className="h-1 bg-gradient-to-r from-blue-500 to-violet-500" />
                  <div className="p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                          New Exposure Time
                        </p>
                        <p className="result-value-lg tabular-nums text-cyan-300">
                          {shotResult.newTimeDisplay}
                        </p>
                        <p className="text-muted-foreground text-sm">
                          {shotResult.newTimeMinutes.toFixed(2)} min
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Combined ×</p>
                        <p className="tabular-nums font-bold text-xl text-blue-300 mt-0.5">
                          {shotResult.combinedMultiplier.toFixed(3)}×
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 border-t border-border pt-3">
                      <FactorStat label="Activity" value={`${shotResult.activityRatio.toFixed(3)}×`} />
                      <FactorStat label="ISL (SFD)" value={`${shotResult.islMultiplier.toFixed(3)}×`} />
                      <FactorStat label="Film (R)" value={`${shotResult.filmRatio.toFixed(3)}×`} />
                    </div>

                    <div className="flex justify-between items-center border-t border-border pt-2">
                      <p className="text-xs text-muted-foreground">CI·sec</p>
                      <p className="tabular-nums font-semibold text-sm">
                        {shotResult.ciSec.toFixed(0)}
                      </p>
                    </div>
                  </div>
                </Card>
              )}
            </>
          )}
        </div>
      )}

      {error && (
        <p className="text-destructive text-sm border border-destructive rounded p-2">
          {error}
        </p>
      )}
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <p className="text-[10px] text-muted-foreground">{label}</p>
      <p className="text-xs font-semibold tabular-nums truncate">{value}</p>
    </div>
  );
}

function FactorStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="tabular-nums font-semibold text-sm mt-0.5">{value}</p>
    </div>
  );
}
