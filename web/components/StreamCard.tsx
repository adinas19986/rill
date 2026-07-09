"use client";

import { useCallback, useEffect, useState } from "react";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";
import { formatUnits } from "viem";
import {
  cancelStream,
  readStream,
  statusAt,
  streamedAt,
  withdraw,
  withdrawableAt,
  type Stream,
} from "ouways-sdk";
import { net } from "@/lib/config";

const fmt = (n: bigint) => Number(formatUnits(n, 6)).toFixed(4);

export function StreamCard({ id, onGone }: { id: bigint; onGone: (id: bigint) => void }) {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

  const [stream, setStream] = useState<Stream | null>(null);
  const [gone, setGone] = useState(false);
  const [now, setNow] = useState(() => Math.floor(Date.now() / 1000));
  const [busy, setBusy] = useState<"" | "withdraw" | "cancel">("");

  const load = useCallback(async () => {
    if (!publicClient) return;
    try {
      setStream(await readStream({ net, publicClient }, id));
    } catch {
      setGone(true);
      onGone(id);
    }
  }, [publicClient, id, onGone]);

  useEffect(() => {
    load();
  }, [load]);

  // Tick the live vested figure four times a second (pure local math).
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now() / 1000), 250);
    return () => clearInterval(t);
  }, []);

  if (gone || !stream) return null;

  const streamed = streamedAt(stream, now);
  const withdrawable = withdrawableAt(stream, now);
  const status = statusAt(stream, now);
  const pct = Number((streamed * 10000n) / stream.deposit) / 100;
  const isRecipient = address?.toLowerCase() === stream.recipient.toLowerCase();
  const isParty =
    isRecipient || address?.toLowerCase() === stream.sender.toLowerCase();

  async function doWithdraw() {
    if (!walletClient || !publicClient || !address) return;
    setBusy("withdraw");
    try {
      const amt = withdrawableAt(stream!, Math.floor(Date.now() / 1000));
      const tx = await withdraw({ net, publicClient, walletClient, account: address }, id, amt);
      await publicClient.waitForTransactionReceipt({ hash: tx });
      await load();
    } catch {
      /* surfaced by wallet */
    } finally {
      setBusy("");
    }
  }

  async function doCancel() {
    if (!walletClient || !publicClient || !address) return;
    setBusy("cancel");
    try {
      const tx = await cancelStream({ net, publicClient, walletClient, account: address }, id);
      await publicClient.waitForTransactionReceipt({ hash: tx });
      setGone(true);
      onGone(id);
    } catch {
      /* surfaced by wallet */
    } finally {
      setBusy("");
    }
  }

  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[13px] font-bold text-[var(--color-muted)]">
            #{id.toString()}
          </span>
          <StatusPill status={status} />
        </div>
        <span className="font-mono text-[12px] text-[var(--color-muted)]">
          {fmt(stream.deposit)} USDC total
        </span>
      </div>

      <div className="mt-4">
        <div className="flex items-end justify-between">
          <div>
            <div className="font-mono text-[28px] font-extrabold tabular-nums tracking-tight text-[var(--color-ink)]">
              {fmt(streamed)}
            </div>
            <div className="text-[12px] font-semibold uppercase tracking-wide text-[var(--color-muted)]">
              streamed
            </div>
          </div>
          <div className="text-right">
            <div className="font-mono text-[16px] font-bold text-[var(--color-accent)]">
              {fmt(withdrawable)}
            </div>
            <div className="text-[12px] font-semibold uppercase tracking-wide text-[var(--color-muted)]">
              withdrawable
            </div>
          </div>
        </div>

        <div className="mt-3 h-2 overflow-hidden rounded-full bg-[var(--color-surface-2)]">
          <div
            className={status === "streaming" ? "flow h-full" : "h-full bg-[var(--color-accent)]"}
            style={{ width: `${Math.min(100, Math.max(0, pct))}%`, transition: "width 0.25s linear" }}
          />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 text-[12px] text-[var(--color-muted)]">
        <span className="font-mono">to {stream.recipient.slice(0, 6)}…{stream.recipient.slice(-4)}</span>
        <span className="text-[var(--color-border)]">/</span>
        <span>{isRecipient ? "you receive" : "you send"}</span>
      </div>

      {isParty && (
        <div className="mt-4 flex gap-2">
          {isRecipient && (
            <button
              onClick={doWithdraw}
              disabled={busy !== "" || withdrawable === 0n}
              className="btn-anim flex-1 rounded-md bg-[var(--color-accent)] px-3 py-2 text-[13px] font-semibold text-[var(--color-accent-ink)] hover:bg-[var(--color-accent-strong)] disabled:opacity-40"
            >
              {busy === "withdraw" ? "Withdrawing…" : "Withdraw"}
            </button>
          )}
          <button
            onClick={doCancel}
            disabled={busy !== ""}
            className="btn-anim flex-1 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-[13px] font-semibold hover:border-[var(--color-warn)] disabled:opacity-40"
          >
            {busy === "cancel" ? "Cancelling…" : "Cancel"}
          </button>
        </div>
      )}
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, [string, string]> = {
    streaming: ["Streaming", "var(--color-ok)"],
    pending: ["Pending", "var(--color-muted)"],
    ended: ["Ended", "var(--color-muted)"],
  };
  const [label, color] = map[status] ?? ["", "var(--color-muted)"];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold"
      style={{ color, background: "color-mix(in oklch, currentColor 12%, transparent)" }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
}
