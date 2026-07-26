import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * A middleware.ts hívja meg minden requestnél: frissíti a Supabase auth
 * session cookie-kat, hogy a Server Component-ek mindig friss session-t
 * lássanak.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Fontos: ne szúrj be logikát a createServerClient és a getUser() hívás közé,
  // mert az megszakíthatja a session frissítést.
  await supabase.auth.getUser();

  return supabaseResponse;
}
