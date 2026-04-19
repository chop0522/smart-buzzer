import type { ReactNode } from "react";
import { getMissingLegalFields, LEGAL_LAST_UPDATED, LEGAL_WARNING_TEXT } from "@/lib/legal";
import { LegalLinks } from "./legal-links";

export function LegalPageShell({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  const missingFields = getMissingLegalFields();

  return (
    <div className="space-y-5">
      <section className="rounded-[2rem] border border-white/15 bg-slate-950/70 p-6 shadow-[0_24px_80px_-28px_rgba(15,23,42,0.8)] backdrop-blur">
        <p className="text-sm font-medium uppercase tracking-[0.24em] text-cyan-300">
          {eyebrow}
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-white">{title}</h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">
          {description}
        </p>
        <p className="mt-3 text-xs uppercase tracking-[0.18em] text-slate-400">
          Last updated {LEGAL_LAST_UPDATED}
        </p>
        {missingFields.length > 0 ? (
          <div className="mt-5 rounded-[1.5rem] border border-amber-300/30 bg-amber-300/10 p-4 text-sm leading-7 text-amber-50">
            <p className="font-semibold">公開前に差し替えが必要な項目があります。</p>
            <p className="mt-2">{LEGAL_WARNING_TEXT}</p>
            <p className="mt-2">
              未設定: {missingFields.map((item) => item.label).join(" / ")}
            </p>
          </div>
        ) : null}
      </section>

      {children}

      <section className="rounded-[2rem] border border-white/15 bg-slate-950/70 p-6 shadow-[0_24px_80px_-28px_rgba(15,23,42,0.8)] backdrop-blur">
        <p className="text-sm font-medium uppercase tracking-[0.24em] text-cyan-300">
          Legal Links
        </p>
        <p className="mt-3 text-sm leading-7 text-slate-300">
          課金条件、解約方法、返金方針、個人情報の取扱いは以下のページから確認できます。
        </p>
        <div className="mt-4">
          <LegalLinks />
        </div>
      </section>
    </div>
  );
}
