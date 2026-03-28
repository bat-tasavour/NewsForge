"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = {
  label: string;
  href: string;
};

type PublicHeaderProps = {
  siteName: string;
  currentDate: string;
  navItems: NavItem[];
};

function isActive(pathname: string, href: string): boolean {
  if (href === "/") {
    return pathname === "/";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function PublicHeader({ siteName, currentDate, navItems }: PublicHeaderProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="template1-topbar">
        <div className="container template1-topbar__inner">
          <p className="template1-topbar__date">{currentDate}</p>
        </div>
      </div>

      <header className="template1-masthead">
        <div className="container template1-masthead__inner">
          <button
            type="button"
            className="template1-menu-btn"
            aria-label={open ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={open}
            aria-controls="template1-mobile-drawer"
            onClick={() => setOpen((value) => !value)}
          >
            ☰
          </button>

          <Link href="/" className="template1-brand">
            {siteName}
          </Link>

          <div className="template1-adslot" role="complementary" aria-label="Advertisement">
            <span>Advertisement</span>
            <strong>728 × 90</strong>
          </div>
        </div>
      </header>

      <div className="template1-navwrap">
        <div className="container">
          <nav className="template1-nav" aria-label="Primary">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={isActive(pathname, item.href) ? "is-active" : undefined}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      <div
        className={`template1-mobile-drawer ${open ? "is-open" : ""}`}
        id="template1-mobile-drawer"
        aria-hidden={!open}
      >
        <div className="template1-mobile-drawer__panel">
          <div className="template1-mobile-drawer__top">
            <p>Menu</p>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close menu">
              ✕
            </button>
          </div>

          <nav className="template1-mobile-nav" aria-label="Mobile primary">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} onClick={() => setOpen(false)}>
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <button
          type="button"
          aria-label="Close menu overlay"
          className="template1-mobile-drawer__overlay"
          onClick={() => setOpen(false)}
        />
      </div>
    </>
  );
}
