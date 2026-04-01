"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Calculator, Pipette, BookOpen, Settings, Activity, Clock, Atom } from "lucide-react";
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
    color: "text-blue-400",
  },
  {
    href: "/pipe",
    label: "Pipe Schedules",
    desc: "Wall thickness & IQI",
    icon: Pipette,
    color: "text-emerald-400",
  },
  {
    href: "/shots",
    label: "Shot Log",
    desc: "Reference exposures",
    icon: BookOpen,
    color: "text-amber-400",
  },
  {
    href: "/settings",
    label: "Settings",
    desc: "Source, film, units",
    icon: Settings,
    color: "text-gray-400",
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
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="pt-2">
        <h1 className="text-2xl font-bold tracking-tight">RT Toolkit</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Radiographic testing tools for the field
        </p>
      </div>

      {/* Source Status Card */}
      {settings && todayActivity !== null && (
        <Card className="p-4" style={{ backgroundColor: "#1a1a24" }}>
          <div className="flex items-center gap-2 mb-3">
            <Atom size={16} className="text-blue-400" />
            <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">
              Pinned Source &mdash; {settings.pinnedSourceType}
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <p className="text-xs text-muted-foreground">Today</p>
              <p className="text-lg font-bold tabular-nums">
                {formatActivity(todayActivity)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Cal Activity</p>
              <p className="text-lg font-bold tabular-nums">
                {settings.pinnedSourceActivityCi} Ci
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Cal Date</p>
              <p className="text-sm font-semibold tabular-nums mt-0.5">
                {settings.pinnedSourceCalDate}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="p-3 flex items-center gap-3" style={{ backgroundColor: "#1a1a24" }}>
          <Activity size={18} className="text-emerald-400" />
          <div>
            <p className="text-xs text-muted-foreground">Logged Shots</p>
            <p className="text-lg font-bold tabular-nums">{shotCount}</p>
          </div>
        </Card>
        <Card className="p-3 flex items-center gap-3" style={{ backgroundColor: "#1a1a24" }}>
          <Clock size={18} className="text-blue-400" />
          <div>
            <p className="text-xs text-muted-foreground">Date</p>
            <p className="text-sm font-semibold tabular-nums">
              {new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </p>
          </div>
        </Card>
      </div>

      {/* Navigation Grid */}
      <div className="space-y-2">
        <h2 className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">
          Tools
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {QUICK_LINKS.map(({ href, label, desc, icon: Icon, color }) => (
            <Link key={href} href={href}>
              <Card
                className="p-4 hover:border-blue-800 transition-colors cursor-pointer h-full"
                style={{ backgroundColor: "#1a1a24" }}
              >
                <Icon size={22} className={color} />
                <p className="font-semibold text-sm mt-2">{label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
