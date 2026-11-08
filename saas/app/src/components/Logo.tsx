import Link from "next/link";
import { Sparkles } from "lucide-react";
export function Logo() {
  return <Link className="marque" href="/"><span className="logo"><Sparkles aria-hidden /></span>MySite</Link>;
}
