import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { ExtendedDatabase } from "@/types/database.coach.types";
import { permissionForPath } from "@/lib/permissions";

const PROTECTED_PREFIX = "/admin";

/**
 * Refreshes the Supabase auth session cookies on every request and redirects
 * unauthenticated visitors away from /admin. Called from src/proxy.ts.
 */
export async function updateSession(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    if (pathname.startsWith(PROTECTED_PREFIX)) {
      const url = request.nextUrl.clone();
      url.pathname = "/signin";
      url.searchParams.set("redirectedFrom", pathname);
      return NextResponse.redirect(url);
    }

    return NextResponse.next();
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient<ExtendedDatabase>(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: avoid writing logic between createServerClient and getUser().
  // A simple mistake could make it very hard to debug session refresh issues.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (pathname.startsWith(PROTECTED_PREFIX) && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/signin";
    url.searchParams.set("redirectedFrom", pathname);
    return NextResponse.redirect(url);
  }

  if (user && pathname.startsWith(PROTECTED_PREFIX)) {
    const requiredPermission = permissionForPath(pathname);
    if (requiredPermission) {
      const adminResult = await supabase.rpc("is_admin");
      const roleResult = !adminResult.data
        ? await supabase.rpc("has_role", { _role: "admin" })
        : { data: true, error: null };
      const permissionResult = adminResult.data || roleResult.data
        ? { data: true, error: null }
        : await supabase.rpc("has_permission", { _code: requiredPermission });
      if (permissionResult.error || !permissionResult.data) {
        const url = request.nextUrl.clone();
        url.pathname = "/admin/hozzaferes-megtagadva";
        url.searchParams.set("from", pathname);
        return NextResponse.redirect(url);
      }
    }
  }

  return supabaseResponse;
}
