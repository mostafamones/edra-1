import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: any[]) {
          cookiesToSet.forEach(({ name, value, options }: any) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }: any) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // refreshing the auth token
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isPublicRoute = (path: string) => {
    return path === "/login" || path === "/signup" || path === "/";
  };

  const pathname = request.nextUrl.pathname;

  // Protect all non-public routes (e.g. /dashboard and /api)
  if (!user && !isPublicRoute(pathname) && !pathname.startsWith('/_next/') && !pathname.includes('.')) {
    // If it's an API route, return 401 instead of redirecting
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // no user, potentially respond by redirecting the user to the login page
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Prevent logged in users from visiting login page
  if (user && isPublicRoute(pathname) && pathname !== '/') {
    // We don't have a reliable single dashboard at the root anymore.
    // Let the AuthProvider (Client Component) determine which academy dashboard it should load.
    // For now, redirecting to / ensures the AuthProvider can catch the user and route them.
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is.
  // If you're creating a new response object with NextResponse.next() inside
  // your routing config, make sure to forward the headers and cookies from the
  // supabaseResponse object.
  return supabaseResponse;
}
