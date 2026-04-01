"use client";

import { useState, useMemo } from "react";
import { PIPE_SCHEDULES } from "@/lib/data/pipeSchedules";
import { ScheduleEntry } from "@/types";
import { calculateIqi } from "@/lib/data/iqiWires";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clipboard, ClipboardCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export default function PipeTable() {
  const [selectedNps, setSelectedNps] = useState<string>("8");
  const [copiedSchedule, setCopiedSchedule] = useState<string | null>(null);
  const [expandedSchedule, setExpandedSchedule] = useState<string | null>(null);

  const pipe = useMemo(
    () => PIPE_SCHEDULES.find((p) => p.nps === selectedNps),
    [selectedNps]
  );

  function handleCopy(entry: ScheduleEntry) {
    const text = `Wall: ${entry.wall.toFixed(3)}"`;
    navigator.clipboard.writeText(text).then(() => {
      setCopiedSchedule(entry.schedule);
      if (navigator.vibrate) navigator.vibrate(30);
      setTimeout(() => setCopiedSchedule(null), 2000);
    });
  }

  function handleScheduleClick(entry: ScheduleEntry) {
    handleCopy(entry);
    setExpandedSchedule(
      expandedSchedule === entry.schedule ? null : entry.schedule
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div>
        <label className="text-xs text-muted-foreground mb-1.5 block font-medium uppercase tracking-wide">
          NPS Size
        </label>
        <Select value={selectedNps} onValueChange={(v) => v && setSelectedNps(v)}>
          <SelectTrigger className="h-12 text-base" style={{ backgroundColor: "#1a1a24" }}>
            <SelectValue placeholder="Select NPS" />
          </SelectTrigger>
          <SelectContent style={{ backgroundColor: "#1a1a24" }}>
            {PIPE_SCHEDULES.map((p) => (
              <SelectItem key={p.nps} value={p.nps} className="text-base py-3">
                NPS {p.npsDisplay} — OD {p.od.toFixed(3)}&quot;
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {pipe && (
        <>
          {/* OD Info Card */}
          <Card className="p-4" style={{ backgroundColor: "#1a1a24" }}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                  Outer Diameter
                </p>
                <p
                  className="tabular-nums font-bold"
                  style={{ fontSize: "2rem", color: "#fff" }}
                >
                  {pipe.od.toFixed(3)}&quot;
                </p>
                <p className="text-muted-foreground text-sm mt-0.5">
                  {(pipe.od * 25.4).toFixed(2)} mm
                </p>
              </div>
              <div className="flex flex-col items-end gap-2">
                {pipe.odNominalEqual ? (
                  <Badge className="bg-green-900 text-green-300 border-green-700 text-xs">
                    NPS = OD
                  </Badge>
                ) : (
                  <Badge className="bg-amber-900 text-amber-300 border-amber-700 text-xs">
                    OD ≠ NPS
                  </Badge>
                )}
                <p className="text-xs text-muted-foreground text-right">
                  NPS {pipe.npsDisplay}
                </p>
              </div>
            </div>
            {!pipe.odNominalEqual && (
              <p className="text-amber-400 text-xs mt-2 border-t border-border pt-2">
                OD is NOT equal to NPS designation. Nominal size only — verify OD before calculating.
              </p>
            )}
          </Card>

          {/* Schedule List */}
          <div>
            <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wide">
              Tap schedule to copy wall thickness
            </p>
            <div className="space-y-2">
              {pipe.schedules.map((entry) => {
                const isCopied = copiedSchedule === entry.schedule;
                const isExpanded = expandedSchedule === entry.schedule;
                const iqi =
                  isExpanded
                    ? calculateIqi(entry.wall, "SWE/SWV", "Source Side")
                    : null;

                return (
                  <div key={entry.schedule}>
                    <button
                      onClick={() => handleScheduleClick(entry)}
                      className={cn(
                        "w-full flex items-center justify-between p-4 rounded-lg border transition-all text-left",
                        isExpanded
                          ? "border-blue-500 bg-blue-950/30"
                          : "border-border hover:border-blue-700"
                      )}
                      style={{ backgroundColor: isExpanded ? undefined : "#1a1a24" }}
                    >
                      <div>
                        <p className="font-semibold text-sm text-foreground">
                          {entry.schedule}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {(entry.wall * 25.4).toFixed(2)} mm
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className="tabular-nums font-bold"
                          style={{ fontSize: "1.25rem", color: "#fff" }}
                        >
                          {entry.wall.toFixed(3)}&quot;
                        </span>
                        {isCopied ? (
                          <ClipboardCheck size={16} className="text-green-400" />
                        ) : (
                          <Clipboard size={16} className="text-muted-foreground" />
                        )}
                      </div>
                    </button>

                    {/* Inline IQI Quick Reference */}
                    {isExpanded && iqi && (
                      <div
                        className="rounded-b-lg border border-t-0 border-blue-500 p-4 space-y-2 animate-result"
                        style={{ backgroundColor: "#1e2030" }}
                      >
                        <p className="text-xs font-semibold text-blue-300 uppercase tracking-wide">
                          IQI Quick Reference
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Based on parent material wall:{" "}
                          <span className="text-white font-semibold">
                            {entry.wall.toFixed(3)}&quot;
                          </span>
                          {" "}— reinforcement excluded per ASME V T-274.2
                        </p>
                        <div className="flex items-center justify-between pt-1">
                          <div>
                            <p className="text-xs text-muted-foreground">SWE/SWV Source Side</p>
                            <p className="font-bold text-white">
                              Wire #{iqi.essentialWireNumber} — Set {iqi.set}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {iqi.essentialWireDiam.toFixed(4)}&quot; ({(iqi.essentialWireDiam * 25.4).toFixed(2)} mm)
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground">Film Side</p>
                            <p className="font-bold text-amber-300">
                              Wire #{iqi.essentialWireNumber + 1}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
