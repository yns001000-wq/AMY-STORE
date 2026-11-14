import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { COOKIE_PARRAIN, DUREE_COOKIE_JOURS, normaliserCode } from "@/lib/parrainage";
import { parrainDuCode } from "@/lib/parrainage-serveur";

const pasDeCache = { "Cache-Control": "private, no-store" };

/** Bandeau « Invité par … » : prénom du parrain d'un code (lien suivi ou invitation gardée), rien d'autre. */
export async function GET(req: Request) {
  const jar = await cookies();
  const garde = normaliserCode(jar.get(COOKIE_PARRAIN)?.value);
  const code = normaliserCode(new URL(req.url).searchParams.get("code")) ?? garde;
  const parrain = code ? await parrainDuCode(code).catch(() => null) : null;
  return NextResponse.json(parrain ? { invite: true, prenom: parrain.prenom, code, garde: garde === code } : { invite: false }, { headers: pasDeCache });
}

/** Le visiteur accepte de garder son invitation 30 jours : dépôt du cookie de parrainage (consentement par un clic). */
export async function POST(req: Request) {
  const { code } = (await req.json().catch(() => ({}))) as { code?: string };
  const c = normaliserCode(code);
  if (!c || !(await parrainDuCode(c).catch(() => null))) return NextResponse.json({ erreur: "Code inconnu" }, { status: 400 });
  const r = NextResponse.json({ ok: true }, { headers: pasDeCache });
  r.cookies.set(COOKIE_PARRAIN, c, { maxAge: DUREE_COOKIE_JOURS * 86400, path: "/", sameSite: "lax", secure: process.env.NODE_ENV === "production" });
  return r;
}

/** Retrait du consentement : le cookie est supprimé. */
export async function DELETE() {
  const r = NextResponse.json({ ok: true }, { headers: pasDeCache });
  r.cookies.set(COOKIE_PARRAIN, "", { maxAge: 0, path: "/" });
  return r;
}
