"use client";

import { useState, useEffect, useMemo } from "react";
import { ReferenceShot, FilmTypeSetting, SourceType, ShotTimeResult } from "@/types";
import { calcShotTimeFromRef } from "@/lib/calculations/shotTime";
import { calcTimeFromChart, CHART_REF_SFD } from "@/lib/data/exposureChart";
import { minutesToMmSs } from "@/lib/calculations/ciSec";
import { loadShots } from "@/lib/storage/shots";
import { loadFilms } from "@/lib/storage/films";
import { loadSettings } from "@/lib/storage/settings";
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
  const [sfd, setSfd] = useState("36");
  const [filmId, setFilmId] = useState("");

  // From Shot mode inputs
  const [selectedShotId, setSelectedShotId] = useState("");
  const [shotActivityNew, setShotActivityNew] = useState("");
  const [shotSfdNew, setShotSfdNew] = useState("");
  const [shotFilmId, setShotFilmId] = useState("");

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

  // Load data on mount
  useEffect(() => {
    const f = loadFilms();
    const s = loadShots();
    const settings = loadSettings();
    setFilms(f);
    setShots(s);
    setSourceType(settings.pinnedSourceType);
    setActivity(String(settings.pinnedSourceActivityCi));
    const defaultFilm = f.find((film) => film.isDefault) ?? f[0];
    if (defaultFilm) {
      setFilmId(defaultFilm.id);
      setShotFilmId(defaultFilm.id);
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
    const matchedFilm = films.find((f) => f.filmName === shot.filmType);
    if (matchedFilm) setShotFilmId(matchedFilm.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedShotId]);

  // Recalculate manual mode
  useEffect(() => {
    if (mode !== "manual") return;
    calcManual();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sourceType, wallThickness, activity, sfd, filmId, mode, films]);

  // Recalculate from-shot mode
  useEffect(() => {
    if (mode !== "fromShot") return;
    calcFromShot();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedShotId, shotActivityNew, shotSfdNew, shotFilmId, mode, films, shots]);

  function calcManual() {
    setError("");
    const a = parseFloat(activity);
    const s = parseFloat(sfd);
    const film = films.find((f) => f.id === filmId);
    const r = film?.rFactor ?? 1.0;

    if (isNaN(a) || isNaN(s) || !wallThickness || wallThickness <= 0) {
      setManualResult(null);
      return;
    }

    try {
      const res = calcTimeFromChart(wallThickness, sourceType, a, s, r);
      const ciSec = a * res.timeMinutes * 60;
      setManualResult({
        timeMinutes: res.timeMinutes,
        timeDisplay: minutesToMmSs(res.timeMinutes),
        baseCiSec: res.baseCiSec,
        islMultiplier: res.islMultiplier,
        filmRatio: res.filmRatio,
        ciSec,
        wallIn: wallThickness,
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
    const film = films.find((f) => f.id === shotFilmId);
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
      <div className="flex border-b" style={{ borderColor: "#2a2a38" }}>
        <button
          onClick={() => setMode("manual")}
          className={cn(
            "flex-1 py-2.5 text-sm font-medium transition-colors min-h-0",
            mode === "manual"
              ? "text-blue-400 border-b-2 border-blue-400"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          Exposure Chart
        </button>
        <button
          onClick={() => setMode("fromShot")}
          className={cn(
            "flex-1 py-2.5 text-sm font-medium transition-colors min-h-0",
            mode === "fromShot"
              ? "text-blue-400 border-b-2 border-blue-400"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          From Shot
        </button>
      </div>

      {/* ───── Manual / Exposure Chart Mode ───── */}
      {mode === "manual" && (
        <div className="space-y-3">
          {/* Formula */}
          <div className="rounded-lg p-3 border border-border" style={{ backgroundColor: "#1e2030" }}>
            <p className="text-xs text-muted-foreground font-mono">
              T = (CI·sec<sub>chart</sub> / (A × 60)) × (SFD / {CHART_REF_SFD})² × R
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Uses built-in exposure chart (steel, density ~2.0). Ref SFD = {CHART_REF_SFD}&quot;
            </p>
          </div>

          {/* Source + NPS + Schedule */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block uppercase tracking-wide">
                Source
              </Label>
              <Select value={sourceType} onValueChange={(v) => v && setSourceType(v as SourceType)}>
                <SelectTrigger className="h-12" style={{ backgroundColor: "#1a1a24" }}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent style={{ backgroundColor: "#1a1a24" }}>
                  <SelectItem value="Ir-192" className="py-3">Ir-192</SelectItem>
                  <SelectItem value="Co-60" className="py-3">Co-60</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block uppercase tracking-wide">
                NPS
              </Label>
              <Select value={nps} onValueChange={(v) => v && setNps(v)}>
                <SelectTrigger className="h-12" style={{ backgroundColor: "#1a1a24" }}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent style={{ backgroundColor: "#1a1a24" }} className="max-h-60">
                  {PIPE_SCHEDULES.map((p) => (
                    <SelectItem key={p.nps} value={p.nps} className="py-2">
                      {p.npsDisplay}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block uppercase tracking-wide">
                Schedule
              </Label>
              <Select value={schedule} onValueChange={(v) => v && setSchedule(v)}>
                <SelectTrigger className="h-12" style={{ backgroundColor: "#1a1a24" }}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent style={{ backgroundColor: "#1a1a24" }} className="max-h-60">
                  {schedules.map((s) => (
                    <SelectItem key={s.schedule} value={s.schedule} className="py-2">
                      {s.schedule}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Wall thickness display + override */}
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
                className="h-12 text-base tabular-nums"
                style={{ backgroundColor: "#1a1a24" }}
              />
            </div>
            {!wallOverride && schedEntry && (
              <Badge variant="secondary" className="mt-5 text-[10px] shrink-0">
                {schedule} — {schedEntry.wall.toFixed(3)}&quot;
              </Badge>
            )}
          </div>

          {/* Activity + SFD */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block uppercase tracking-wide">
                Activity (Ci)
              </Label>
              <Input
                type="number"
                value={activity}
                onChange={(e) => setActivity(e.target.value)}
                placeholder="80"
                className="h-12 text-base tabular-nums"
                style={{ backgroundColor: "#1a1a24" }}
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block uppercase tracking-wide">
                SFD (in)
              </Label>
              <Input
                type="number"
                value={sfd}
                onChange={(e) => setSfd(e.target.value)}
                placeholder="36"
                className="h-12 text-base tabular-nums"
                style={{ backgroundColor: "#1a1a24" }}
              />
            </div>
          </div>

          {/* Film */}
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block uppercase tracking-wide">
              Film Type
            </Label>
            <Select value={filmId} onValueChange={(v) => v && setFilmId(v)}>
              <SelectTrigger className="h-12" style={{ backgroundColor: "#1a1a24" }}>
                <SelectValue placeholder="Select film" />
              </SelectTrigger>
              <SelectContent style={{ backgroundColor: "#1a1a24" }}>
                {films.map((f) => (
                  <SelectItem key={f.id} value={f.id} className="py-2">
                    {f.filmName} (R={f.rFactor})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Manual Result */}
          {manualResult && (
            <Card className="p-4 space-y-3 animate-result" style={{ backgroundColor: "#1a1a24" }}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                    Exposure Time
                  </p>
                  <p className="result-value-lg tabular-nums">
                    {manualResult.timeDisplay}
                  </p>
                  <p className="text-muted-foreground text-sm">
                    {manualResult.timeMinutes.toFixed(2)} min
                  </p>
                </div>
                <Badge
                  className={cn(
                    "text-xs",
                    manualResult.timeMinutes > 30
                      ? "bg-amber-900 text-amber-300 border-amber-700"
                      : "bg-green-900 text-green-300 border-green-700"
                  )}
                >
                  {sourceType}
                </Badge>
              </div>

              <div className="grid grid-cols-3 gap-2 border-t border-border pt-2">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Base CI·sec</p>
                  <p className="tabular-nums font-semibold text-sm">
                    {manualResult.baseCiSec.toFixed(0)}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    @ 1Ci, {CHART_REF_SFD}&quot;
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">ISL (SFD)</p>
                  <p className="tabular-nums font-semibold text-sm">
                    {manualResult.islMultiplier.toFixed(3)}×
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Film (R)</p>
                  <p className="tabular-nums font-semibold text-sm">
                    {manualResult.filmRatio.toFixed(2)}×
                  </p>
                </div>
              </div>

              <div className="flex justify-between items-center border-t border-border pt-2">
                <p className="text-xs text-muted-foreground">
                  Wall: {manualResult.wallIn.toFixed(3)}&quot; · CI·sec: {manualResult.ciSec.toFixed(0)}
                </p>
              </div>

              <p className="text-[10px] text-muted-foreground italic">
                Approximate — verify against your company exposure charts
              </p>
            </Card>
          )}
        </div>
      )}

      {/* ───── From Shot Mode ───── */}
      {mode === "fromShot" && (
        <div className="space-y-3">
          {/* Formula */}
          <div className="rounded-lg p-3 border border-border" style={{ backgroundColor: "#1e2030" }}>
            <p className="text-xs text-muted-foreground font-mono">
              T₂ = T₁ × (A₁ / A₂) × (D₂ / D₁)² × (R₂ / R₁)
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Recalculate from a logged reference shot with new parameters
            </p>
          </div>

          {shots.length === 0 ? (
            <div className="rounded-lg p-4 border border-border text-center" style={{ backgroundColor: "#1e2030" }}>
              <p className="text-sm text-muted-foreground">
                No reference shots logged.
              </p>
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
                  <SelectTrigger className="h-12" style={{ backgroundColor: "#1a1a24" }}>
                    <SelectValue placeholder="Select a shot" />
                  </SelectTrigger>
                  <SelectContent style={{ backgroundColor: "#1a1a24" }} className="max-h-60">
                    {shots.map((s) => (
                      <SelectItem key={s.id} value={s.id} className="py-2">
                        {s.name} — {minutesToMmSs(s.exposureTimeMinutes)} @ {s.sourceActivityCi} Ci
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedShot && (
                <div className="rounded-lg p-3 border border-border" style={{ backgroundColor: "#1e2030" }}>
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
                    className="h-12 text-base tabular-nums"
                    style={{ backgroundColor: "#1a1a24" }}
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
                    className="h-12 text-base tabular-nums"
                    style={{ backgroundColor: "#1a1a24" }}
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block uppercase tracking-wide">
                  New Film Type
                </Label>
                <Select value={shotFilmId} onValueChange={(v) => v && setShotFilmId(v)}>
                  <SelectTrigger className="h-12" style={{ backgroundColor: "#1a1a24" }}>
                    <SelectValue placeholder="Select film" />
                  </SelectTrigger>
                  <SelectContent style={{ backgroundColor: "#1a1a24" }}>
                    {films.map((f) => (
                      <SelectItem key={f.id} value={f.id} className="py-2">
                        {f.filmName} (R={f.rFactor})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* From Shot Result */}
              {shotResult && (
                <Card className="p-4 space-y-3 animate-result" style={{ backgroundColor: "#1a1a24" }}>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                        New Exposure Time
                      </p>
                      <p className="result-value-lg tabular-nums">
                        {shotResult.newTimeDisplay}
                      </p>
                      <p className="text-muted-foreground text-sm">
                        {shotResult.newTimeMinutes.toFixed(2)} min
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Combined</p>
                      <p className="tabular-nums font-bold text-xl text-blue-300">
                        {shotResult.combinedMultiplier.toFixed(3)}×
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 border-t border-border pt-2">
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
      <p className="tabular-nums font-semibold text-sm">{value}</p>
    </div>
  );
}
