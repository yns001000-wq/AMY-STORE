import { CircleCheck, MapPin, Sparkles } from "lucide-react";

/** Illustration du produit (données fictives, à titre de démonstration). */
const LIGNES = [
  ["PB", "Pizzeria Bella", "Restaurant · Lyon 3e", "#6d4aff", "Nouveau"],
  ["LC", "Le Comptoir", "Snack · Villeurbanne", "#0ea5c6", "Rappel jeudi"],
  ["SA", "Salon Azur", "Coiffure · Bron", "#ec4899", "Maquette prête"],
  ["MR", "Maison Roux", "Boulangerie · Oullins", "#f97316", "Devis envoyé"],
];

export function ApercuCockpit() {
  return (
    <div style={{ position: "relative" }} aria-label="Aperçu du cockpit MySite (exemple fictif)" role="img">
      <div className="apercu"><div className="apercu-in">
        <div className="apercu-barre"><i /><i /><i /><span>mysite · Mon cockpit</span></div>
        <div className="apercu-corps">
          <div className="mini-stats">
            <div className="mini-stat"><b>128</b><small>prospects</small></div>
            <div className="mini-stat"><b>34</b><small>messages IA</small></div>
            <div className="mini-stat"><b>9</b><small>maquettes</small></div>
          </div>
          <div className="mini-liste">
            {LIGNES.map(([ini, nom, sous, coul, st]) => (
              <div className="mini-ligne" key={nom}>
                <span className="avatar" style={{ background: coul }}>{ini}</span>
                <span><strong>{nom}</strong><small>{sous}</small></span>
                <span className="statut" style={{ color: coul, background: `color-mix(in srgb, ${coul} 14%, transparent)` }}>{st}</span>
              </div>
            ))}
          </div>
        </div>
      </div></div>
      <div className="flottant f1"><Sparkles style={{ color: "var(--violet)" }} aria-hidden />Message rédigé en 4 s</div>
      <div className="flottant f2"><MapPin style={{ color: "var(--rose)" }} aria-hidden />12 nouveaux à Lyon<CircleCheck style={{ color: "var(--vert)" }} aria-hidden /></div>
    </div>
  );
}
