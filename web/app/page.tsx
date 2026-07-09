"use client";

import { useCallback, useEffect, useState } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";
import { CreateStream } from "@/components/CreateStream";
import { StreamCard } from "@/components/StreamCard";
import { ThemeToggle } from "@/components/ThemeToggle";
import { net } from "@/lib/config";

const KEY = "ouways.streams";
const short = (a: string) => `${a.slice(0, 6)}…${a.slice(-4)}`;

export default function Home() {
  const { isConnected } = useAccount();
  const [ids, setIds] = useState<bigint[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setIds((JSON.parse(raw) as string[]).map(BigInt));
    } catch {
      /* ignore */
    }
  }, []);

  const persist = useCallback((next: bigint[]) => {
    setIds(next);
    localStorage.setItem(KEY, JSON.stringify(next.map((n) => n.toString())));
  }, []);

  const add = useCallback(
    (id: bigint) => persist([id, ...ids.filter((x) => x !== id)]),
    [ids, persist],
  );
  const remove = useCallback(
    (id: bigint) => persist(ids.filter((x) => x !== id)),
    [ids, persist],
  );

  return (
    <div className="relative min-h-dvh overflow-x-clip">
      <div className="bloom pointer-events-none absolute inset-x-0 top-0 h-[440px]" aria-hidden />
      <div className="relative mx-auto max-w-5xl px-5 sm:px-8">
        <header className="flex items-center justify-between py-5">
          <div className="flex items-center gap-2.5">
            <Mark />
            <span className="text-[15px] font-bold tracking-tight">ouways</span>
            <span className="ml-1 hidden rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-0.5 text-[11px] font-semibold text-[var(--color-muted)] sm:inline">
              {net.name}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <ConnectButton showBalance={false} chainStatus="icon" />
            <ThemeToggle />
          </div>
        </header>

        <section className="rise py-10 sm:py-14">
          <h1 className="max-w-[18ch] text-balance text-[clamp(2.2rem,5.5vw,3.8rem)] font-extrabold leading-[1.0] tracking-[-0.03em]">
            Stream USDC by the second on Arc.
          </h1>
          <p className="mt-4 max-w-[54ch] text-[16px] leading-relaxed text-[var(--color-muted)] sm:text-[17px]">
            Payroll, vesting, and grants that flow continuously instead of in
            lump sums. Lock USDC once, it vests to the recipient every second,
            and either party can withdraw or cancel at any moment.
          </p>
          <div className="mt-6 flex flex-wrap gap-x-8 gap-y-2 font-mono text-[13px] text-[var(--color-muted)]">
            <span>Contract <span className="text-[var(--color-ink)]">{short(net.streamPay)}</span></span>
            <span>USDC 6 decimals</span>
            <span>Per-second vesting</span>
          </div>
        </section>

        <section className="grid items-start gap-6 pb-20 lg:grid-cols-[0.9fr_1.1fr]">
          <CreateStream onCreated={add} />

          <div>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-[15px] font-bold tracking-tight">Your streams</h2>
              <span className="text-[12px] text-[var(--color-muted)]">{ids.length} tracked</span>
            </div>
            {!isConnected ? (
              <Empty>Connect a wallet on {net.name} to open and track streams.</Empty>
            ) : ids.length === 0 ? (
              <Empty>No streams yet. Open one on the left and it appears here, ticking live.</Empty>
            ) : (
              <div className="space-y-4">
                {ids.map((id) => (
                  <StreamCard key={id.toString()} id={id} onGone={remove} />
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface-2)] px-5 py-10 text-center text-[14px] text-[var(--color-muted)]">
      {children}
    </div>
  );
}

function Mark() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="1.5" y="1.5" width="21" height="21" rx="6" stroke="var(--color-accent)" strokeWidth="1.6" />
      <path d="M5 14c3 0 3-4 6-4s3 4 6 4" stroke="var(--color-accent)" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M5 10c3 0 3-4 6-4s3 4 6 4" stroke="var(--color-accent-strong)" strokeWidth="1.4" strokeLinecap="round" opacity="0.5" />
    </svg>
  );
}
