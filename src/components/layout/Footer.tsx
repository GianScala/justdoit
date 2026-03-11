"use client";

import Link from "next/link";

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <span className="footer-name">JustDoIt</span>
        </div>
        <nav className="footer-links">
          <Link href="/privacy" className="footer-link">Privacy Policy</Link>
          <Link href="/terms" className="footer-link">Terms of Service</Link>
        </nav>
        <div className="footer-copy">&copy; {year} JustDoIt</div>
      </div>
    </footer>
  );
}
