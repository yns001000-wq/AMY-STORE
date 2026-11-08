import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { hoteDeSite } from "@/lib/publication";

const PROTEGE = /^\/(espace|connexion|auth|impression)(\/|$)/;

/** Rafraîchit la session Supabase et protège l'espace privé (/espace). La vraie vérification se fait aussi côté serveur. */
export async function proxy(req: NextRequest) {
  // Sites publiés : sous-domaine MySite ou nom de domaine d'un client → le site, jamais l'application.
  const site = hoteDeSite(req.headers.get("host") ?? "");
  if (site) {
    const url = req.nextUrl.clone();
    url.pathname = "slug" in site ? `/s/${site.slug}` : `/d/${site.domaine}`;
    url.search = `?chemin=${encodeURIComponent(req.nextUrl.pathname)}`;
    return NextResponse.rewrite(url);
  }
  if (!PROTEGE.test(req.nextUrl.pathname)) return NextResponse.next();
  let res = NextResponse.next({ request: req });
  const sb = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll: () => req.cookies.getAll(),
      setAll: (liste) => {
        liste.forEach(({ name, value }) => req.cookies.set(name, value));
        res = NextResponse.next({ request: req });
        liste.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
      },
    },
  });
  const { data } = await sb.auth.getUser();
  if (!data.user && req.nextUrl.pathname.startsWith("/espace")) {
    const url = req.nextUrl.clone(); url.pathname = "/connexion"; url.searchParams.set("suite", req.nextUrl.pathname);
    return NextResponse.redirect(url);
  }
  return res;
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"] };
