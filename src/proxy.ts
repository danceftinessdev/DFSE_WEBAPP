import { updateSession } from "@/lib/supabase/middleware";
import { type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Illeszkedik minden request path-ra, kivéve:
     * - _next/static (statikus fájlok)
     * - _next/image (kép optimalizáció)
     * - favicon.ico, manifest, ikonok
     * - képfájl kiterjesztések
     */
    "/((?!_next/static|_next/image|favicon.ico|manifest.json|icons|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
