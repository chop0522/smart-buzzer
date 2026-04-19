import Link from "next/link";
import { LEGAL_LINKS } from "@/lib/legal";

export function LegalLinks({
  variant = "inline",
}: {
  variant?: "inline" | "footer";
}) {
  const wrapperClass =
    variant === "footer"
      ? "flex flex-wrap items-center justify-center gap-2 sm:justify-end"
      : "flex flex-wrap items-center gap-2";
  const linkClass =
    variant === "footer"
      ? "rounded-full border border-white/10 px-3 py-2 text-xs text-slate-300 transition hover:border-cyan-300/40 hover:bg-white/5 hover:text-white"
      : "rounded-full border border-white/10 px-3 py-2 text-xs text-cyan-100 transition hover:border-cyan-300/40 hover:bg-white/5 hover:text-white";

  return (
    <nav className={wrapperClass} aria-label="Legal links">
      {LEGAL_LINKS.map((item) => (
        <Link key={item.href} href={item.href} className={linkClass}>
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
