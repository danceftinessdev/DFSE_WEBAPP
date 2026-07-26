"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LayoutDashboard, LogOut, User } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { createClient } from "@/lib/supabase/client";

interface AuthButtonProps {
  isLoggedIn: boolean;
  isStaff: boolean;
  displayName?: string;
}

/**
 * Feltételesen renderelt "Bejelentkezés / Profilom / Admin" gomb.
 * A szerver oldali session/role állapotot props-ban kapja (Server Component
 * olvassa ki), a kijelentkezés interakciója kliens oldali.
 */
export function AuthButton({ isLoggedIn, isStaff, displayName }: AuthButtonProps) {
  const router = useRouter();

  if (!isLoggedIn) {
    return (
      <Button size="sm" render={<Link href="/login" />}>
        Bejelentkezés
      </Button>
    );
  }

  const initials =
    displayName
      ?.split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() ?? "U";

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" size="sm" className="gap-2">
            <Avatar className="size-6">
              <AvatarFallback className="text-xs">{initials}</AvatarFallback>
            </Avatar>
            {displayName}
          </Button>
        }
      />
      <DropdownMenuContent align="end">
        <DropdownMenuItem render={<Link href="/profilom" />}>
          <User className="mr-2 size-4" /> Profilom
        </DropdownMenuItem>
        {isStaff && (
          <DropdownMenuItem render={<Link href="/admin/dashboard" />}>
            <LayoutDashboard className="mr-2 size-4" /> Admin
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} variant="destructive">
          <LogOut className="mr-2 size-4" /> Kijelentkezés
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
