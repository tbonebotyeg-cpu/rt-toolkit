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
        background: "linear-gradient(180deg, rgba(9,9,16,0.88) 0%, rgba(7,7,13,0.99) 100%)",
        backdropFilter: "blur(28px) saturate(1.6)",
        WebkitBackdropFilter: "blur(28px) saturate(1.6)",
        borderTop: "1px solid rgba(255,255,255,0.06)",
        boxShadow: "0 -1px 0 rgba(255,255,255,0.03), 0 -8px 32px rgba(0,0,0,0.4)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      <div className="flex h-[4.5rem]">
        {TABS.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className="flex flex-1 flex-col items-center justify-center gap-1 transition-all duration-200 active:scale-95"
            >
              {/* Active top indicator */}
              <div className={cn(
                "absolute top-0 h-[2px] rounded-full transition-all duration-300",
                active ? "w-8 bg-blue-400/70" : "w-0 bg-transparent"
              )} style={{ position: "relative" }} />

              <div className={cn(
                "flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all duration-200",
                active ? "bg-blue-500/15" : "bg-transparent"
              )}>
                <Icon
                  size={active ? 22 : 21}
                  strokeWidth={active ? 2.2 : 1.6}
                  className={cn(
                    "transition-all duration-200",
                    active
                      ? "text-blue-400 drop-shadow-[0_0_12px_rgba(96,165,250,0.55)]"
                      : "text-slate-500"
                  )}
                />
                <span className={cn(
                  "text-[10px] leading-none transition-all duration-200",
                  active ? "text-blue-400 font-semibold" : "text-slate-500 font-medium"
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
