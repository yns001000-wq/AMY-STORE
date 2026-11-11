import { ImageResponse } from "next/og";

export const alt = "MySite : vendez des sites web aux commerces de votre ville";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Image affichée quand le lien du site est partagé (réseaux sociaux, messageries). */
export default function Image() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", padding: 80, color: "#fff", background: "linear-gradient(120deg,#6d4aff 0%,#3b5bfd 45%,#0ea5c6 100%)" }}>
        <div style={{ fontSize: 44, fontWeight: 700, opacity: 0.92 }}>MySite</div>
        <div style={{ fontSize: 84, fontWeight: 800, lineHeight: 1.08, marginTop: 24, letterSpacing: -2 }}>Vendez des sites web aux commerces de votre ville.</div>
        <div style={{ fontSize: 36, marginTop: 36, opacity: 0.92 }}>Trouver · Contacter · Montrer · Signer · Encaisser</div>
      </div>
    ),
    size,
  );
}
