"use client";

import { useCallback, useEffect, useState } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";
import { CreateStream } from "@/components/CreateStream";
import { StreamCard } from "@/components/StreamCard";
import { FlowField } from "@/components/FlowField";
import { net } from "@/lib/config";

const KEY = "rill.streams";
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
  const add = useCallback((id: bigint) => persist([id, ...ids.filter((x) => x !== id)]), [ids, persist]);
  const remove = useCallback((id: bigint) => persist(ids.filter((x) => x !== id)), [ids, persist]);

  return (
    <div className="relative min-h-dvh">
      {/* Hero with the live current behind it */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <FlowField />
        </div>
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, transparent 40%, var(--color-canvas) 96%), radial-gradient(120% 80% at 50% -10%, transparent 40%, color-mix(in oklch, var(--color-canvas) 60%, transparent))",
          }}
          aria-hidden
        />

        <div className="relative mx-auto max-w-6xl px-5 sm:px-8">
          <header className="flex items-center justify-between py-6">
            <div className="flex items-center gap-2.5">
              <Mark />
              <span className="text-[18px] font-extrabold tracking-tight">Rill</span>
            </div>
            <ConnectButton showBalance={false} chainStatus="icon" />
          </header>

          <div className="rise max-w-3xl py-16 sm:py-24">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[var(--color-line)] bg-[var(--color-surface)] px-3 py-1 text-[12px] font-semibold text-[var(--color-mint)] backdrop-blur">
              <span className="pulse h-1.5 w-1.5 rounded-full bg-[var(--color-mint)]" />
              Live on {net.name}
            </div>
            <h1 className="text-balance text-[clamp(2.8rem,8vw,5.5rem)] font-extrabold leading-[0.92] tracking-[-0.04em]">
              Money that moves
              <br />
              like a <span className="value-gradient">current</span>.
            </h1>
            <p className="mt-6 max-w-[46ch] text-[17px] font-medium leading-relaxed text-[var(--color-muted)] sm:text-[19px]">
              Rill streams USDC by the second on Arc. Lock it once and it flows to
              the recipient continuously, payroll, vesting, and grants that arrive
              like water, not in lump sums.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-4">
              <a
                href="#app"
                className="btn mint-glow rounded-full bg-[var(--color-mint)] px-6 py-3 text-[15px] font-bold text-[var(--color-canvas)]"
              >
                Open a stream
              </a>
              <span className="mono flex items-center gap-2 text-[13px] text-[var(--color-muted)]">
                {short(net.streamPay)}
                <span className="inline-block h-1 w-1 rounded-full bg-[var(--color-muted)]" />
                per-second vesting
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* App */}
      <section id="app" className="relative mx-auto max-w-6xl scroll-mt-8 px-5 pb-24 sm:px-8">
        <div className="grid items-start gap-6 lg:grid-cols-[0.85fr_1.15fr]">
          <CreateStream onCreated={add} />
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-[20px] font-bold tracking-tight">Your streams</h2>
              <span className="mono text-[12px] text-[var(--color-muted)]">{ids.length} tracked</span>
            </div>
            {!isConnected ? (
              <Empty>Connect a wallet on {net.name} to open and track streams.</Empty>
            ) : ids.length === 0 ? (
              <Empty>No streams yet. Open one and watch it fill, live, right here.</Empty>
            ) : (
              <div className="space-y-4">
                {ids.map((id) => (
                  <StreamCard key={id.toString()} id={id} onGone={remove} />
                ))}
              </div>
            )}
          </div>
        </div>

        <footer className="mt-20 flex flex-col items-start justify-between gap-2 border-t border-[var(--color-line)] pt-6 text-[13px] text-[var(--color-muted)] sm:flex-row sm:items-center">
          <span className="flex items-center gap-2">
            <Mark size={16} /> <span className="font-bold text-[var(--color-ink)]">Rill</span> USDC streams on Arc
          </span>
          <span className="mono">StreamPay {short(net.streamPay)}</span>
        </footer>
      </section>
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div className="panel rounded-2xl px-6 py-12 text-center text-[14px] text-[var(--color-muted)]">
      {children}
    </div>
  );
}

function Mark({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden>
      <path d="M3 20c5 0 5-8 10-8s5 8 10 8 6-8 6-8" stroke="var(--color-mint)" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M3 13c5 0 5-6 10-6s5 6 10 6 6-6 6-6" stroke="var(--color-amber)" strokeWidth="1.8" strokeLinecap="round" opacity="0.7" />
    </svg>
  );
}
