"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  LayoutDashboard,
  Newspaper,
  Shirt,
  Trophy,
  Users,
  Wallet,
  Wand2,
} from "lucide-react";

import { cn } from "@/lib/utils";

const ADMIN_NAV = [
  { href: "/admin/dashboard", label: "Áttekintés", icon: LayoutDashboard },
  { href: "/admin/orarend", label: "Órarend", icon: CalendarDays },
  { href: "/admin/versenyek", label: "Versenyek", icon: Trophy },
  { href: "/admin/tagdijak", label: "Tagdíjak", icon: Wallet },
  { href: "/admin/versenyzok", label: "Versenyzők (CRM)", icon: Users },
  { href: "/admin/ruhatar", label: "Ruhatár", icon: Shirt },
  { href: "/admin/koreografiak", label: "Koreográfiák", icon: Wand2 },
  { href: "/admin/hirek", label: "Hírek", icon: Newspaper },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop oldalsáv */}
      <aside className="hidden w-60 shrink-0 border-r bg-sidebar md:block">
        <nav className="flex flex-col gap-1 p-4">
          {ADMIN_NAV.map((item) => {
            const active = pathname?.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent",
                )}
              >
                <item.icon className="size-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Mobil alsó navigáció - az edzők elsősorban telefonon használják */}
      <nav className="fixed inset-x-0 bottom-0 z-40 flex justify-around border-t bg-background/95 py-2 backdrop-blur md:hidden">
        {ADMIN_NAV.slice(0, 5).map((item) => {
          const active = pathname?.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 px-2 py-1 text-[10px] font-medium",
                active ? "text-primary" : "text-muted-foreground",
              )}
            >
              <item.icon className="size-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
