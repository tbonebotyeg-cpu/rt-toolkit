"use client";

import { useState, useEffect } from "react";
import { ReferenceShot, SourceType, Technique, ShootingTechnique } from "@/types";
import { loadShots, addShot, deleteShot, generateId } from "@/lib/storage/shots";
import { loadSettings } from "@/lib/storage/settings";
import { loadFilms } from "@/lib/storage/films";
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
import { Plus, Trash2, ChevronDown, ChevronUp, BookOpen } from "lucide-react";

export default function ShotsPage() {
  const [shots, setShots] = useState<ReferenceShot[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [formKey, setFormKey] = useState(0);

  useEffect(() => {
    setShots(loadShots());
  }, []);

  function handleDelete(id: string) {
    deleteShot(id);
    setShots(loadShots());
    if (expanded === id) setExpanded(null);
  }

  function handleAdd(shot: ReferenceShot) {
    addShot(shot);
    setShots(loadShots());
    setSheetOpen(false);
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
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <Button size="sm" className="gap-1.5" onClick={() => { setFormKey(k => k + 1); setSheetOpen(true); }}>
            <Plus size={16} />
            New
          </Button>
          <SheetContent
            side="bottom"
            className="h-[90vh] overflow-y-auto sheet-bg"
          >
            <SheetHeader>
              <SheetTitle>Log Reference Shot</SheetTitle>
            </SheetHeader>
            <NewShotForm key={formKey} onSave={handleAdd} />
          </SheetContent>
        </Sheet>
      </div>

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
      ) : (
        <div className="px-4 pb-4 space-y-2">
          {shots.map((shot) => (
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
                <div className="px-3 pb-3 space-y-2 border-t border-border pt-2">
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
                  <Row label="IQI" value={shot.iqi} />
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
                  <Button
                    variant="destructive"
                    size="sm"
                    className="w-full gap-1.5 mt-1"
                    onClick={() => handleDelete(shot.id)}
                  >
                    <Trash2 size={14} />
                    Delete Shot
                  </Button>
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

function NewShotForm({ onSave }: { onSave: (shot: ReferenceShot) => void }) {
  const settings = loadSettings();
  const films = loadFilms();
  const [name, setName] = useState("");
  const [nps, setNps] = useState("6");
  const [schedule, setSchedule] = useState("STD");
  const [wallOverride, setWallOverride] = useState("");
  const [material, setMaterial] = useState("Carbon Steel");
  const [technique, setTechnique] = useState<Technique>("SWE/SWV");
  const [shootingTechnique, setShootingTechnique] = useState<ShootingTechnique>("SWSI");
  const [sfd, setSfd] = useState("36");
  const [sourceType, setSourceType] = useState<SourceType>(settings.pinnedSourceType);
  const [sourceActivity, setSourceActivity] = useState(String(settings.pinnedSourceActivityCi));
  const [sourceDate, setSourceDate] = useState(settings.pinnedSourceCalDate);
  const [exposureTime, setExposureTime] = useState("2.5");
  const [filmType, setFilmType] = useState(films.find((f) => f.isDefault)?.filmName ?? films[0]?.filmName ?? "");
  const [devTemp, setDevTemp] = useState("75");
  const [devTime, setDevTime] = useState("5");
  const [density, setDensity] = useState("2.5");
  const [iqi, setIqi] = useState("");
  const [notes, setNotes] = useState("");

  // Derive wall thickness from pipe data
  const pipe = PIPE_SCHEDULES.find((p) => p.nps === nps);
  const schedEntry = pipe?.schedules.find((s) => s.schedule === schedule);
  const wallThickness = wallOverride ? parseFloat(wallOverride) : (schedEntry?.wall ?? 0);

  function handleSubmit() {
    const actCi = parseFloat(sourceActivity);
    const timeMins = parseFloat(exposureTime);
    const shot: ReferenceShot = {
      id: generateId(),
      name: name || `${nps}" ${schedule} — ${technique}`,
      createdAt: new Date().toISOString(),
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

  return (
    <div className="space-y-4 pt-4">
      {/* Name */}
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

      {/* Technique & SFD */}
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

      <Separator />

      {/* Source + Shooting Technique */}
      <div className="grid grid-cols-2 gap-3">
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
          <Label className="text-xs text-muted-foreground mb-1.5 block uppercase tracking-wide">Shooting Technique</Label>
          <Select value={shootingTechnique} onValueChange={(v) => v && setShootingTechnique(v as ShootingTechnique)}>
            <SelectTrigger className="h-12 input-dark">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="select-dropdown">
              <SelectItem value="SWSI" className="py-3">SWSI</SelectItem>
              <SelectItem value="DWSI" className="py-3">DWSI</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Activity + Source Date */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs text-muted-foreground mb-1.5 block uppercase tracking-wide">Activity (Ci)</Label>
          <Input
            type="number"
            value={sourceActivity}
            onChange={(e) => setSourceActivity(e.target.value)}
            className="h-12 text-base tabular-nums input-dark"
          />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground mb-1.5 block uppercase tracking-wide">Source Date</Label>
          <Input
            type="date"
            value={sourceDate}
            onChange={(e) => setSourceDate(e.target.value)}
            className="h-12 input-dark"
          />
        </div>
      </div>

      {/* Exposure */}
      <div>
        <Label className="text-xs text-muted-foreground mb-1.5 block uppercase tracking-wide">
          Exposure Time (min)
        </Label>
        <Input
          type="number"
          value={exposureTime}
          onChange={(e) => setExposureTime(e.target.value)}
          className="h-12 text-base tabular-nums input-dark"
        />
      </div>

      <Separator />

      {/* Film */}
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

      {/* Results */}
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
        Save Shot
      </Button>
    </div>
  );
}
