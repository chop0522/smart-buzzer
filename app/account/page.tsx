import Link from "next/link";
import { BillingPanel } from "@/components/account/billing-panel";
import { getHostSession } from "@/lib/host-auth";
import { isStripeConfigured } from "@/lib/env";
import { getHostAccount } from "@/lib/room-store";

export default async function AccountPage() {
  const session = await getHostSession();

  if (!session) {
    return (
      <section className="mx-auto flex w-full max-w-xl flex-col gap-4 rounded-[2rem] border border-white/15 bg-slate-950/70 p-6 shadow-[0_24px_80px_-28px_rgba(15,23,42,0.8)] backdrop-blur">
        <p className="text-sm font-medium uppercase tracking-[0.24em] text-cyan-300">
          Account
        </p>
        <h1 className="text-3xl font-semibold text-white">契約状況ページ</h1>
        <p className="text-sm leading-7 text-slate-300">
          ホストだけログインして閲覧できます。参加者はゲスト参加です。
        </p>
        <Link
          href="/host"
          className="rounded-2xl bg-cyan-300 px-4 py-4 text-center text-base font-semibold text-slate-950 transition hover:bg-cyan-200"
        >
          ホストログインへ
        </Link>
      </section>
    );
  }

  const account = getHostAccount(session.hostId);

  return (
    <BillingPanel account={account} stripeEnabled={isStripeConfigured()} />
  );
}
