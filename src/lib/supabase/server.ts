import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types/database.types";

/**
 * Supabase kliens Server Component / Server Action / Route Handler oldali használatra.
 * A cookie-kat a Next.js `cookies()` API-ján keresztül olvassa/írja, hogy a
 * session mindig szinkronban legyen a middleware-rel.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options as CookieOptions);
            });
          } catch {
            // Server Component-ből hívva a cookie írás nem engedélyezett;
            // ilyenkor a middleware gondoskodik a session frissítéséről.
          }
        },
      },
    },
  );
}
