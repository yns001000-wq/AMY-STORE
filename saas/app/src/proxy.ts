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
  // Le code d'un lien de parrainage (?ref=CODE) n'est jamais gardé automatiquement : le cookie n'est déposé que si le visiteur
  // l'accepte (bandeau « Garder mon invitation »), car la CNIL ne l'exempte pas de consentement (FAQ cookies, question 13).
  const chemin = req.nextUrl.pathname;
  // Page d'accueil : vérifiée seulement si un cookie de session existe (visiteur déjà connecté), pour l'emmener dans son cockpit.
  const sessionPresente = req.cookies.getAll().some((c) => c.name.startsWith("sb-") && c.name.includes("-auth-token"));
  if (!PROTEGE.test(chemin) && !(chemin === "/" && sessionPresente)) return NextResponse.next();
  let res = NextResponse.next({ request: req });
  const sb = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookieOptions: { secure: req.nextUrl.protocol === "https:" },
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
  // Redirection en gardant les cookies de session rafraîchis à l'instant.
  const vers = (url: URL) => { const r = NextResponse.redirect(url); res.cookies.getAll().forEach((c) => r.cookies.set(c)); return r; };
  if (!data.user && chemin.startsWith("/espace")) {
    const url = req.nextUrl.clone(); url.pathname = "/connexion"; url.search = ""; url.searchParams.set("suite", chemin);
    return vers(url);
  }
  // Déjà connecté : l'accueil et la page de connexion mènent directement au cockpit (on reste connecté, sans ressaisir son mot de passe).
  const q = req.nextUrl.searchParams;
  if (data.user && (chemin === "/" || (chemin === "/connexion" && q.get("mode") !== "oubli"))) {
    const suite = q.get("suite"), url = req.nextUrl.clone();
    url.pathname = suite && suite.startsWith("/espace") ? suite : "/espace"; url.search = "";
    return vers(url);
  }
  return res;
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"] };
