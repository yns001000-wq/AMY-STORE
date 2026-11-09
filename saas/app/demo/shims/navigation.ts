import { cheminCourant, naviguer, rafraichir, useEtat } from "./routeur";

/** Remplace next/navigation. */
export function useRouter() { return { push: naviguer, replace: naviguer, refresh: rafraichir, back: () => naviguer("/espace") }; }
export function usePathname() { useEtat(); return cheminCourant(); }
export function redirect(href: string): never { naviguer(href); throw new Error("redirection"); }
export function notFound(): never { throw new Error("introuvable"); }
