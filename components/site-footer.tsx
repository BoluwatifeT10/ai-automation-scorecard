import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="no-print border-t border-line">
      <div className="mx-auto flex max-w-content flex-col gap-4 px-4 py-8 text-sm text-muted sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p>Estimates stay in this browser. The score is an internal framework, not a certified benchmark.</p>
        <nav className="flex flex-wrap gap-x-4 gap-y-2" aria-label="Footer">
          <Link href="/methodology" className="hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
            Methodology
          </Link>
          <Link href="/about" className="hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
            About
          </Link>
          <Link href="/privacy" className="hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
            Privacy
          </Link>
          <Link href="/assess" className="hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
            Start assessment
          </Link>
        </nav>
      </div>
    </footer>
  );
}
