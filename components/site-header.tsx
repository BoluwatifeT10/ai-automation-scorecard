"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { useAssessment } from "@/context/assessment-context";
import { Logo } from "@/components/logo";
import { cn } from "@/components/ui";

const links = [
  { href: "/#how-it-works", label: "How it works" },
  { href: "/methodology", label: "Methodology" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const { draft, hydrated } = useAssessment();
  const [open, setOpen] = useState(false);
  const hasReport = hydrated && Boolean(draft.assessedAt);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header className="no-print sticky top-0 z-40 border-b border-line bg-background">
      <div className="mx-auto flex max-w-content items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
          <Logo />
          <span className="text-sm font-semibold tracking-tight sm:text-base">AI Automation Scorecard</span>
        </Link>
        <nav className="hidden items-center gap-6 md:flex" aria-label="Primary">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-muted transition-colors hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              aria-current={pathname === link.href ? "page" : undefined}
            >
              {link.label}
            </Link>
          ))}
          {hasReport ? (
            <Link href="/results" className="text-sm text-muted hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
              View report
            </Link>
          ) : null}
          <Link
            href="/assess"
            className="inline-flex min-h-11 items-center rounded-md bg-accent-strong px-4 text-sm font-semibold text-white hover:bg-[#1d49be] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            Start assessment
          </Link>
        </nav>
        <button
          type="button"
          className="inline-flex h-11 w-11 items-center justify-center rounded-md border border-line text-text md:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          aria-expanded={open}
          aria-controls="mobile-nav"
          onClick={() => setOpen((value) => !value)}
        >
          <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
          {open ? <X aria-hidden="true" size={18} /> : <Menu aria-hidden="true" size={18} />}
        </button>
      </div>
      <div id="mobile-nav" hidden={!open} className={cn("border-t border-line md:hidden", open ? "block" : "hidden")}>
        <nav className="mx-auto flex max-w-content flex-col gap-1 px-4 py-3" aria-label="Mobile">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="rounded-md px-2 py-3 text-sm text-text hover:bg-elevated">
              {link.label}
            </Link>
          ))}
          {hasReport ? (
            <Link href="/results" className="rounded-md px-2 py-3 text-sm text-text hover:bg-elevated">
              View report
            </Link>
          ) : null}
          <Link href="/assess" className="mt-2 inline-flex min-h-11 items-center justify-center rounded-md bg-accent-strong px-4 text-sm font-semibold text-white">
            Start assessment
          </Link>
        </nav>
      </div>
    </header>
  );
}
