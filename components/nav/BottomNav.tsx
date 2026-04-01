"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Pipette, Calculator, BookOpen, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/",        label: "Home",     icon: Home },
  { href: "/pipe",    label: "Pipe",     icon: Pipette },
  { href: "/calc",    label: "Calc",     icon: Calculator },
  { href: "/shots",   label: "Shots",    icon: BookOpen },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50"
      style={{
        background: "linear-gradient(180deg, rgba(10, 10, 18, 0.82) 0%, rgba(8, 8, 14, 0.98) 100%)",
        backdropFilter: "blur(24px) saturate(1.4)",
        WebkitBackdropFilter: "blur(24px) saturate(1.4)",
        borderTop: "1px solid rgba(255,255,255,0.055)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      <div className="flex h-[4.25rem]">
        {TABS.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className="flex flex-1 flex-col items-center justify-center gap-1 transition-all duration-200 active:opacity-70"
            >
              <div className={cn(
                "flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all duration-200",
                active && "bg-blue-500/12"
              )}>
                <Icon
                  size={22}
                  strokeWidth={active ? 2.2 : 1.7}
                  className={cn(
                    "transition-all duration-200",
                    active
                      ? "text-blue-400 drop-shadow-[0_0_10px_rgba(96,165,250,0.5)]"
                      : "text-slate-500"
                  )}
                />
                <span className={cn(
                  "text-[10px] font-medium transition-all duration-200 leading-none",
                  active ? "text-blue-400 font-semibold" : "text-slate-500"
                )}>
                  {label}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
