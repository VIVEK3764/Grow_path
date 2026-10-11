"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Compass, Route, ChartNoAxesCombined, User } from "lucide-react";
import type { ReactNode } from "react";
const nav = [
  ["Home", Home, "/"],
  ["Explore", Compass, "/explore"],
  ["Path", Route, "/path"],
  ["Investments", ChartNoAxesCombined, "/investments"],
  ["You", User, "/profile"],
] as const;
export function Shell({ children }: { children: ReactNode }) {
  const path = usePathname();
  const active =
    path.startsWith("/goals") ||
    path.startsWith("/decode") ||
    path.startsWith("/onboarding") ||
    path.startsWith("/learn")
      ? "/path"
      : path;
  const links = nav.map(([label, Icon, url]) => (
    <Link
      key={url}
      href={url}
      className={active === url ? "active" : ""}
      aria-current={active === url ? "page" : undefined}
    >
      <Icon size={21} strokeWidth={1.7} />
      <span>{label}</span>
    </Link>
  ));
  return (
    <div className="app">
      <header className="topbar">
        <Link className="brand" href="/" aria-label="Groww Path home">
          <span className="brand-mark">
            <svg viewBox="0 0 32 32" aria-hidden="true">
              <path d="M2 21L10 12l7 7L29 7" />
              <path d="M2 26l8-8 7 7 12-12" />
            </svg>
          </span>
          Groww
        </Link>
        <div className="desktop-products">
          <Link href="/explore">Explore</Link>
          <Link href="/path" className="selected">
            Path
          </Link>
        </div>
        <Link className="top-profile" href="/profile" aria-label="Your profile">
          <User size={21} />
        </Link>
      </header>
      <div className="layout">
        <aside className="sidebar">
          <div className="workspace-label">YOUR GROWW</div>
          <nav>{links}</nav>
          <div className="sidebar-note">
            <Link href="/learn/safety">Your money, your pace</Link>
          </div>
        </aside>
        <main
          className={
            "main " + (path.startsWith("/onboarding") ? "onboarding" : "")
          }
        >
          {children}
        </main>
      </div>
      <nav className="bottom-nav" aria-label="Main navigation">
        {links}
      </nav>
    </div>
  );
}
