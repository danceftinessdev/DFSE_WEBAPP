import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t bg-muted/30">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-10 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
        <p>© {new Date().getFullYear()} Dance Fitness SE. Minden jog fenntartva.</p>
        <div className="flex gap-4">
          <Link href="/kapcsolat" className="hover:text-foreground">
            Kapcsolat
          </Link>
          <Link href="/orarend" className="hover:text-foreground">
            Órarend
          </Link>
          <Link href="/hirek" className="hover:text-foreground">
            Hírek
          </Link>
        </div>
      </div>
    </footer>
  );
}
