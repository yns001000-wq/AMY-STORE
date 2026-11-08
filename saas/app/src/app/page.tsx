import Link from "next/link";
import { Tarifs } from "@/components/Tarifs";
import { SECTEURS } from "@/lib/secteurs";

export default function Accueil() {
  return (
    <>
      <section style={{ padding: "3rem 0 2rem" }}>
        <h1>Vos prochains clients sont à côté de chez vous.</h1>
        <p style={{ fontSize: "1.2rem", maxWidth: "40rem" }}>
          Choisissez votre secteur et votre région : MySite trouve les commerces et artisans à démarcher dans les registres publics,
          rédige vos messages, prépare une maquette de site pour chacun et suit vos ventes, au même endroit.
        </p>
        <p style={{ display: "flex", gap: ".75rem", flexWrap: "wrap" }}>
          <Link className="btn p" href="/connexion">Commencer gratuitement</Link>
          <Link className="btn" href="#tarifs">Voir les tarifs</Link>
        </p>
        <p className="note">Sans carte bancaire. Aucune promesse de revenus : MySite vous fait gagner du temps, les ventes restent votre travail.</p>
      </section>
      <section className="grille" aria-label="Comment ça marche">
        {[["1. Votre zone", "Secteur, départements : MySite cherche les entreprises actives qui correspondent, dans la base officielle Sirene."],
          ["2. Vos messages", "L'IA rédige un premier message adapté à chaque commerce : métier, ville, besoin. Vous relisez, vous envoyez."],
          ["3. Vos maquettes", "Une maquette de site pour chaque prospect, à montrer en rendez-vous. C'est souvent elle qui déclenche la vente."],
          ["4. Votre suivi", "Pipeline, rappels, carte de vos prospects : vous savez toujours qui rappeler et quand."]].map(([t, d]) => (
          <div key={t} className="carte"><h3>{t}</h3><p className="note">{d}</p></div>))}
      </section>
      <section style={{ padding: "2.5rem 0" }}>
        <h2>Secteurs disponibles</h2>
        <p className="note">{SECTEURS.map((s) => s.nom).join(" · ")}</p>
      </section>
      <section id="tarifs" style={{ padding: "1rem 0 2rem" }}>
        <h2>Tarifs</h2>
        <p className="note">Prix TTC. Sans engagement : vous changez d&apos;offre ou résiliez en quelques clics depuis votre espace. Essai Premium de 7 jours offert, sans carte.</p>
        <Tarifs action={(id) => <Link className={`btn${id === "premium" ? " p" : ""}`} href="/connexion">{id === "gratuit" ? "Commencer gratuitement" : `Choisir ${id === "pro" ? "Pro" : id === "premium" ? "Premium" : "Ultra"}`}</Link>} />
      </section>
    </>
  );
}
