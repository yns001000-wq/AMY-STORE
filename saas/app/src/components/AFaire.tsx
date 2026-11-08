/** Information à compléter avant la mise en ligne (surlignée pour ne pas l'oublier). */
export function AFaire({ children }: { children: React.ReactNode }) {
  return <span className="a-completer">[{children}]</span>;
}
