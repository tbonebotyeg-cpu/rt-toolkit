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
      className="fixed bottom-0 left-0 right-0 z-50 border-t"
      style={{
        backgroundColor: "#1a1a24",
        borderColor: "#2a2a38",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      <div className="flex h-16">
        {TABS.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-0.5 text-xs transition-colors",
                active
                  ? "text-blue-400"
                  : "text-gray-500 hover:text-gray-300"
              )}
            >
              <Icon size={22} strokeWidth={active ? 2.5 : 1.8} />
              <span className={cn("text-[10px]", active && "font-semibold")}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
