"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Calculator, Pipette, BookOpen, Settings, Activity, Clock, Atom, Radiation } from "lucide-react";
import { Card } from "@/components/ui/card";
import { loadSettings } from "@/lib/storage/settings";
import { loadShots } from "@/lib/storage/shots";
import { calculateDecay, formatActivity } from "@/lib/calculations/decay";
import { AppSettings } from "@/types";

const QUICK_LINKS = [
  {
    href: "/calc",
    label: "Calculators",
    desc: "Decay, Ug, ISL, CI\u00b7sec",
    icon: Calculator,
    gradient: "from-blue-500/20 to-blue-600/5",
    iconColor: "text-blue-400",
    glowClass: "group-hover:shadow-[0_0_20px_rgba(59,130,246,0.1)]",
  },
  {
    href: "/pipe",
    label: "Pipe Schedules",
    desc: "Wall thickness & IQI",
    icon: Pipette,
    gradient: "from-emerald-500/20 to-emerald-600/5",
    iconColor: "text-emerald-400",
    glowClass: "group-hover:shadow-[0_0_20px_rgba(16,185,129,0.1)]",
  },
  {
    href: "/shots",
    label: "Shot Log",
    desc: "Reference exposures",
    icon: BookOpen,
    gradient: "from-amber-500/20 to-amber-600/5",
    iconColor: "text-amber-400",
    glowClass: "group-hover:shadow-[0_0_20px_rgba(245,158,11,0.1)]",
  },
  {
    href: "/settings",
    label: "Settings",
    desc: "Source, film, units",
    icon: Settings,
    gradient: "from-gray-400/15 to-gray-500/5",
    iconColor: "text-gray-400",
    glowClass: "group-hover:shadow-[0_0_20px_rgba(156,163,175,0.06)]",
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
    } catch {
      // ignore
    }
  }, []);

  return (
    <div className="p-4 space-y-5">
      {/* Header */}
      <div className="pt-3 pb-1">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Radiation size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">RT Toolkit</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Radiographic testing tools for the field
            </p>
          </div>
        </div>
      </div>

      {/* Source Status Card */}
      {settings && todayActivity !== null && (
        <div className="rounded-xl overflow-hidden glass-card-elevated gradient-border">
          {/* Colored accent bar based on activity level */}
          <div
            className="h-1"
            style={{
              background: todayActivity >= 50
                ? "linear-gradient(90deg, #22c55e, #16a34a)"
                : todayActivity >= 20
                ? "linear-gradient(90deg, #f59e0b, #d97706)"
                : "linear-gradient(90deg, #ef4444, #dc2626)",
            }}
          />
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-blue-500/20 flex items-center justify-center">
                  <Atom size={14} className="text-blue-400" />
                </div>
                <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">
                  {settings.pinnedSourceType}
                </p>
              </div>
              {settings.cameraSerial && (
                <p className="text-[10px] text-muted-foreground tabular-nums">
                  S/N {settings.cameraSerial}
                </p>
              )}
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Today</p>
                <p className={`text-xl font-extrabold tabular-nums mt-0.5 ${
                  todayActivity >= 50 ? "text-emerald-400" : todayActivity >= 20 ? "text-amber-400" : "text-red-400"
                }`}>
                  {formatActivity(todayActivity)}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Cal Activity</p>
                <p className="text-lg font-bold tabular-nums mt-0.5">
                  {settings.pinnedSourceActivityCi} Ci
                </p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Cal Date</p>
                <p className="text-sm font-semibold tabular-nums mt-1">
                  {settings.pinnedSourceCalDate}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="glass-card rounded-xl p-3.5 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/15 flex items-center justify-center shrink-0">
            <Activity size={18} className="text-emerald-400" />
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Logged Shots</p>
            <p className="text-xl font-bold tabular-nums">{shotCount}</p>
          </div>
        </div>
        <div className="glass-card rounded-xl p-3.5 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-500/15 flex items-center justify-center shrink-0">
            <Clock size={18} className="text-blue-400" />
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Date</p>
            <p className="text-sm font-semibold tabular-nums">
              {new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Grid */}
      <div className="space-y-3">
        <p className="section-label px-0.5">Tools</p>
        <div className="grid grid-cols-2 gap-3">
          {QUICK_LINKS.map(({ href, label, desc, icon: Icon, gradient, iconColor, glowClass }) => (
            <Link key={href} href={href} className="group">
              <Card
                className={`p-4 h-full transition-all duration-200 border-transparent hover:border-white/10 ${glowClass} group-active:scale-[0.97]`}
                style={{ background: "linear-gradient(145deg, rgba(24, 24, 37, 0.9), rgba(14, 14, 22, 0.95))" }}
              >
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center mb-3 transition-transform duration-200 group-hover:scale-110`}>
                  <Icon size={20} className={iconColor} />
                </div>
                <p className="font-semibold text-sm">{label}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{desc}</p>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
