import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isAppRoute = path.startsWith("/dashboard") || path.startsWith("/clients") ||
    path.startsWith("/produits") || path.startsWith("/ventes") ||
    path.startsWith("/depenses") || path.startsWith("/dettes") || path.startsWith("/admin") ||
    path.startsWith("/fournisseurs") || path.startsWith("/livraisons") ||
    path.startsWith("/employes") || path.startsWith("/plus") || path.startsWith("/assistant");

  if (isAppRoute && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Un utilisateur déjà connecté ne doit plus jamais retomber sur l'onboarding
  // ou les écrans de connexion/inscription — il reste connecté tant qu'il ne
  // se déconnecte pas explicitement.
  const isAuthEntryRoute = path === "/" || path.startsWith("/login") || path.startsWith("/register");
  if (isAuthEntryRoute && user) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|manifest.json|icons|sw.js).*)"],
};
