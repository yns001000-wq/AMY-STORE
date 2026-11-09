import React from "react";
import { naviguer } from "./routeur";

/** Remplace next/link : les liens internes changent de vue sans recharger la page. */
export default function Link({ href, children, ...reste }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string; prefetch?: boolean }) {
  const interne = typeof href === "string" && href.startsWith("/");
  return (
    <a href={interne ? "#" : href} {...reste} onClick={(e) => { if (interne) { e.preventDefault(); naviguer(href); } reste.onClick?.(e); }}>{children}</a>
  );
}
