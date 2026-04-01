"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Calculator, Pipette, BookOpen, Settings, Activity, Clock, Atom, Radiation, ChevronRight } from "lucide-react";
import { loadSettings } from "@/lib/storage/settings";
import { loadShots } from "@/lib/storage/shots";
import { calculateDecay, formatActivity } from "@/lib/calculations/decay";
import { AppSettings } from "@/types";
import { cn } from "@/lib/utils";

const QUICK_LINKS = [
  {
    href: "/calc",
    label: "Calculators",
    desc: "Decay · Ug · ISL · CI·sec · Shot Time",
    icon: Calculator,
    accentColor: "rgba(59,130,246,0.2)",
    iconColor: "text-blue-400",
    borderColor: "rgba(59,130,246,0.15)",
  },
  {
    href: "/pipe",
    label: "Pipe Schedules",
    desc: "Wall thickness & IQI requirements",
    icon: Pipette,
    accentColor: "rgba(16,185,129,0.18)",
    iconColor: "text-emerald-400",
    borderColor: "rgba(16,185,129,0.12)",
  },
  {
    href: "/shots",
    label: "Shot Log",
    desc: "Reference exposure library",
    icon: BookOpen,
    accentColor: "rgba(245,158,11,0.18)",
    iconColor: "text-amber-400",
    borderColor: "rgba(245,158,11,0.12)",
  },
  {
    href: "/settings",
    label: "Settings",
    desc: "Source, film, units",
    icon: Settings,
    accentColor: "rgba(148,163,184,0.12)",
    iconColor: "text-slate-400",
    borderColor: "rgba(148,163,184,0.08)",
  },
];

export default function HomePage() {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [shotCount, setShotCount] = useState(0);
  const [todayActivity, setTodayActivity] = useState<number | null>(null);

  useEffect(() => {
    const s = loadSettings();
    setSettings(s);
    setShotCount(loadShots().length);
    try {
      const calDate = new Date(s.pinnedSourceCalDate);
      const today = new Date();
      if (!isNaN(calDate.getTime())) {
        const result = calculateDecay(s.pinnedSourceActivityCi, calDate, today, s.pinnedSourceType);
        setTodayActivity(result.activityAtTarget);
      }
    } catch { /* ignore */ }
  }, []);

  const activityLevel = todayActivity !== null
    ? todayActivity >= 50 ? "high"
    : todayActivity >= 20 ? "mid"
    : "low"
    : null;

  const activityBarColor = activityLevel === "high"
    ? "linear-gradient(90deg, #10b981, #059669)"
    : activityLevel === "mid"
    ? "linear-gradient(90deg, #f59e0b, #d97706)"
    : "linear-gradient(90deg, #ef4444, #dc2626)";

  const activityTextColor = activityLevel === "high"
    ? "text-emerald-400"
    : activityLevel === "mid"
    ? "text-amber-400"
    : "text-red-400";

  return (
    <div className="px-4 pt-4 pb-4 space-y-5">
      {/* ── App Header ── */}
      <div className="flex items-center gap-3 pt-1">
        <div
          className="w-11 h-11 rounded-2xl flex items-center justify-center shadow-lg"
          style={{
            background: "linear-gradient(145deg, rgba(59,130,246,0.9), rgba(37,99,235,0.95))",
            boxShadow: "0 4px 16px rgba(59,130,246,0.3), 0 1px 4px rgba(0,0,0,0.3)",
          }}
        >
          <Radiation size={22} className="text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">RT Toolkit</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Radiographic testing · field tools
          </p>
        </div>
      </div>

      {/* ── Source Status Card ── */}
      {settings && todayActivity !== null && (
        <div className="glass-card-elevated rounded-2xl overflow-hidden gradient-border">
          <div className="h-1" style={{ background: activityBarColor }} />
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-500/20 flex items-center justify-center">
                  <Atom size={14} className="text-blue-400" />
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold leading-none">
                    {settings.pinnedSourceType}
                  </p>
                  {settings.cameraSerial && (
                    <p className="text-[10px] text-muted-foreground tabular-nums mt-0.5">
                      S/N {settings.cameraSerial}
                    </p>
                  )}
                </div>
              </div>
              <Link
                href="/settings"
                className="text-[10px] text-muted-foreground hover:text-foreground transition-colors flex items-center gap-0.5"
              >
                Configure <ChevronRight size={10} />
              </Link>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5">Today</p>
                <p className={cn("text-xl font-extrabold tabular-nums", activityTextColor)}>
                  {formatActivity(todayActivity)}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5">Cal</p>
                <p className="text-lg font-bold tabular-nums">
                  {settings.pinnedSourceActivityCi} Ci
                </p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5">Cal Date</p>
                <p className="text-sm font-semibold tabular-nums mt-0.5">
                  {settings.pinnedSourceCalDate}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Quick Stats ── */}
      <div className="grid grid-cols-2 gap-3">
        <div className="glass-card rounded-xl p-3.5 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/15 flex items-center justify-center shrink-0">
            <Activity size={17} className="text-emerald-400" />
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Logged Shots</p>
            <p className="text-xl font-bold tabular-nums">{shotCount}</p>
          </div>
        </div>
        <div className="glass-card rounded-xl p-3.5 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-500/15 flex items-center justify-center shrink-0">
            <Clock size={17} className="text-blue-400" />
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Today</p>
            <p className="text-sm font-semibold tabular-nums">
              {new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "2-digit" })}
            </p>
          </div>
        </div>
      </div>

      {/* ── Navigation Grid ── */}
      <div>
        <p className="section-label mb-3">Tools</p>
        <div className="grid grid-cols-2 gap-3">
          {QUICK_LINKS.map(({ href, label, desc, icon: Icon, accentColor, iconColor, borderColor }) => (
            <Link key={href} href={href} className="group">
              <div
                className="p-4 h-full rounded-2xl border transition-all duration-200 group-active:scale-[0.96]"
                style={{
                  background: "linear-gradient(145deg, rgba(22,22,36,0.9), rgba(14,14,24,0.95))",
                  borderColor,
                }}
              >
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center mb-3 transition-transform duration-200 group-hover:scale-105"
                  style={{ background: accentColor }}
                >
                  <Icon size={20} className={iconColor} />
                </div>
                <p className="font-semibold text-sm">{label}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
