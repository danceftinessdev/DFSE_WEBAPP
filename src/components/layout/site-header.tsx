import Link from "next/link";
import { Menu } from "lucide-react";

import { AuthButton } from "@/components/shared/auth-button";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { getCurrentUser } from "@/lib/rbac";

const NAV_LINKS = [
  { href: "/hirek", label: "Hírek" },
  { href: "/rolunk", label: "Rólunk" },
  { href: "/versenyzoink", label: "Versenyzőink" },
  { href: "/orarend", label: "Órarend" },
  { href: "/kapcsolat", label: "Kapcsolat" },
];

export async function SiteHeader() {
  const user = await getCurrentUser();
  const isStaff = !!user && (user.roles.includes("admin") || user.roles.includes("coach"));

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="text-lg font-bold tracking-tight">
          Dance Fitness <span className="text-primary">SE</span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <div className="hidden md:block">
            <AuthButton
              isLoggedIn={!!user}
              isStaff={isStaff}
              displayName={user?.profile?.display_name ?? undefined}
            />
          </div>
          <Sheet>
            <SheetTrigger
              render={
                <Button variant="ghost" size="icon" className="md:hidden" aria-label="Menü megnyitása" />
              }
            >
              <Menu className="size-5" />
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <SheetHeader>
                <SheetTitle>Menü</SheetTitle>
              </SheetHeader>
              <nav className="mt-4 flex flex-col gap-4 px-4">
                {NAV_LINKS.map((link) => (
                  <Link key={link.href} href={link.href} className="text-base font-medium">
                    {link.label}
                  </Link>
                ))}
                <div className="mt-4 border-t pt-4">
                  <AuthButton
                    isLoggedIn={!!user}
                    isStaff={isStaff}
                    displayName={user?.profile?.display_name ?? undefined}
                  />
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
