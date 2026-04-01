"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Pipette, Calculator, BookOpen, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/pipe", label: "Pipe", icon: Pipette },
  { href: "/calc", label: "Calc", icon: Calculator },
  { href: "/shots", label: "Shots", icon: BookOpen },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/[0.06]"
      style={{
        background: "linear-gradient(180deg, rgba(14, 14, 22, 0.88), rgba(10, 10, 18, 0.98))",
        backdropFilter: "blur(20px) saturate(1.2)",
        WebkitBackdropFilter: "blur(20px) saturate(1.2)",
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
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-1 text-xs transition-all duration-200",
                active
                  ? "text-blue-400"
                  : "text-gray-500 active:text-gray-300"
              )}
            >
              <div className="relative">
                <Icon
                  size={22}
                  strokeWidth={active ? 2.5 : 1.8}
                  className={cn(
                    "transition-all duration-200",
                    active && "drop-shadow-[0_0_8px_rgba(59,130,246,0.4)]"
                  )}
                />
                {active && (
                  <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-blue-400 shadow-[0_0_6px_rgba(59,130,246,0.6)]" />
                )}
              </div>
              <span
                className={cn(
                  "text-[10px] transition-all duration-200",
                  active ? "font-semibold text-blue-400" : "font-medium"
                )}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
