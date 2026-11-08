"use client";
import { Printer } from "lucide-react";

export function BoutonImprimer({ titre }: { titre: string }) {
  return (
    <div className="barre-impression">
      <span>{titre}</span>
      <button type="button" className="btn p" onClick={() => window.print()}><Printer aria-hidden />Imprimer ou enregistrer en PDF</button>
    </div>
  );
}
