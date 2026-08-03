import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Cookie-aware client for Server Components and Route Handlers — respects
 * the signed-in user's session (unlike the service-role client in
 * ../supabase.ts, which bypasses auth entirely). Use this to find out WHO
 * is logged in; use the service-role client to WRITE data on their behalf.
 */
export async function createServerSupabaseClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: any }>) {
          try {
            cookiesToSet.forEach(({ name, value, options }: { name: string; value: string; options?: any }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from a Server Component during render — the middleware
            // below handles refreshing the session instead. Safe to ignore.
          }
        },
      },
    }
  );
}

/** Returns the signed-in user, or null. Use in Server Components/routes. */
export async function getUser() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}
