import type { Metadata } from "next";
import Link from "next/link";
import { Noto_Sans_JP, Space_Grotesk } from "next/font/google";
import { LegalLinks } from "@/components/legal/legal-links";
import "./globals.css";

const notoSansJp = Noto_Sans_JP({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["500", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "Smart Buzzer",
    template: "%s | Smart Buzzer",
  },
  description:
    "Smart Buzzer は、クイズやイベント向けにホストが早押しルームを作成し、参加者がスマートフォンから参加できるサブスクリプション型Webアプリです。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ja"
      data-scroll-behavior="smooth"
      className={`${notoSansJp.variable} ${spaceGrotesk.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <div className="relative min-h-screen overflow-hidden">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.2),_transparent_32%),radial-gradient(circle_at_bottom_right,_rgba(251,146,60,0.16),_transparent_28%),linear-gradient(180deg,_#08111f_0%,_#0f172a_50%,_#111827_100%)]" />
          <div className="relative z-10 flex min-h-screen flex-col">
            <header className="sticky top-0 z-20 border-b border-white/10 bg-slate-950/55 backdrop-blur-xl">
              <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6 lg:px-8">
                <Link
                  href="/"
                  className="font-display text-lg font-semibold tracking-[0.18em] text-white"
                >
                  SMART BUZZER
                </Link>
                <nav className="flex flex-wrap items-center gap-2 text-sm">
                  {[
                    ["/join/DEMO42", "Join"],
                    ["/pricing", "Pricing"],
                    ["/legal/tokushoho", "Legal"],
                  ].map(([href, label]) => (
                    <Link
                      key={href}
                      href={href}
                      className="rounded-full border border-white/10 px-3 py-2 text-slate-100 transition hover:border-cyan-300/40 hover:bg-white/5"
                    >
                      {label}
                    </Link>
                  ))}
                </nav>
              </div>
            </header>
            <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-6 sm:px-6 lg:px-8">
              {children}
            </main>
            <footer className="border-t border-white/10 bg-slate-950/55">
              <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-6 sm:px-6 lg:px-8 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-sm font-medium uppercase tracking-[0.24em] text-cyan-300">
                    Legal
                  </p>
                  <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-300">
                    料金、解約方法、返金方針、個人情報の取扱いは以下の法務ページから確認できます。
                  </p>
                </div>
                <LegalLinks variant="footer" />
              </div>
            </footer>
          </div>
        </div>
      </body>
    </html>
  );
}
