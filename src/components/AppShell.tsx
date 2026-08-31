"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";

const LINKS = [
  { href: "/", label: "Week" },
  { href: "/recipes", label: "Recipes" },
  { href: "/import", label: "Import" },
  { href: "/shop", label: "Shop" },
  { href: "/staples", label: "Staples" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data } = useSession();
  if (pathname === "/login") {
    return <>{children}</>;
  }

  return (
    <div className="min-h-full flex flex-col">
      <header className="sticky top-0 z-20 border-b border-line bg-paper-2/95 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3">
          <Link href="/" className="font-serif text-lg tracking-tight">
            Weekly Meals
          </Link>
          <div className="flex items-center gap-2 text-sm text-muted">
            <span className="hidden sm:inline">{data?.user?.displayName}</span>
            <button
              type="button"
              className="rounded-full border border-line px-3 py-1 text-ink"
              onClick={() => signOut({ callbackUrl: "/login" })}
            >
              Sign out
            </button>
          </div>
        </div>
        <nav className="mx-auto flex max-w-3xl gap-1 overflow-x-auto px-3 pb-2">
          {LINKS.map((link) => {
            const active = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-full px-3 py-2 text-sm whitespace-nowrap ${
                  active ? "bg-sage text-white" : "text-ink"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </header>
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-5">{children}</main>
    </div>
  );
}
