"use client";

import { useState } from "react";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";
import { parseUnits, isAddress, type Address } from "viem";
import { createStream } from "ouways-sdk";
import { net } from "@/lib/config";

type Status = { kind: "idle" | "busy" | "err"; msg?: string };

const DURATIONS = [
  { label: "1 hour", secs: 3600 },
  { label: "1 day", secs: 86400 },
  { label: "30 days", secs: 2592000 },
];

export function CreateStream({ onCreated }: { onCreated: (id: bigint) => void }) {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("10");
  const [duration, setDuration] = useState(3600);
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  const rate = Number(amount || "0") / duration;

  async function submit() {
    if (!publicClient || !walletClient || !address) return;
    if (!isAddress(recipient)) {
      setStatus({ kind: "err", msg: "Enter a valid recipient address." });
      return;
    }
    setStatus({ kind: "busy", msg: "Approving and opening the stream…" });
    try {
      const now = Math.floor(Date.now() / 1000);
      const { streamId } = await createStream(
        { net, publicClient, walletClient, account: address },
        { recipient: recipient as Address, deposit: parseUnits(amount, 6), startTime: now, stopTime: now + duration },
      );
      setStatus({ kind: "idle" });
      onCreated(streamId);
    } catch (e) {
      const m = e instanceof Error ? e.message : String(e);
      setStatus({ kind: "err", msg: /rejected|denied/i.test(m) ? "Rejected in wallet." : m.slice(0, 150) });
    }
  }

  return (
    <div className="panel rounded-3xl p-6">
      <h3 className="text-[22px] font-extrabold tracking-tight">Open a stream</h3>
      <p className="mt-1 text-[14px] text-[var(--color-muted)]">USDC that flows every second until it runs dry.</p>

      <div className="mt-6 space-y-5">
        <Field label="Recipient">
          <input
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            placeholder="0x…"
            spellCheck={false}
            className="mono w-full rounded-xl border border-[var(--color-line)] bg-[var(--color-canvas-2)] px-4 py-3 text-[13px] text-[var(--color-ink)] outline-none placeholder:text-[var(--color-muted)] focus:border-[var(--color-mint)]"
          />
        </Field>

        <Field label="Amount (USDC)">
          <div className="flex items-center rounded-xl border border-[var(--color-line)] bg-[var(--color-canvas-2)] px-4 focus-within:border-[var(--color-mint)]">
            <input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              inputMode="decimal"
              className="mono w-full bg-transparent py-3 text-[20px] font-bold text-[var(--color-ink)] outline-none"
            />
            <span className="mono text-[13px] text-[var(--color-muted)]">USDC</span>
          </div>
        </Field>

        <Field label="Over">
          <div className="grid grid-cols-3 gap-2">
            {DURATIONS.map((d) => (
              <button
                key={d.secs}
                onClick={() => setDuration(d.secs)}
                className={`btn rounded-xl border px-2 py-2.5 text-[13px] font-bold ${
                  duration === d.secs
                    ? "border-transparent bg-[var(--color-mint)] text-[var(--color-canvas)]"
                    : "border-[var(--color-line)] bg-[var(--color-canvas-2)] text-[var(--color-muted)] hover:text-[var(--color-ink)]"
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </Field>

        <div className="flex items-center justify-between rounded-xl bg-[var(--color-canvas-2)] px-4 py-3">
          <span className="text-[13px] text-[var(--color-muted)]">Flow rate</span>
          <span className="mono text-[14px] font-bold value-gradient">
            {rate > 0 ? `${rate.toFixed(rate < 0.01 ? 6 : 4)} USDC/s` : "—"}
          </span>
        </div>

        <button
          onClick={submit}
          disabled={status.kind === "busy" || !address}
          className="btn mint-glow w-full rounded-xl bg-[var(--color-mint)] px-4 py-3.5 text-[15px] font-bold text-[var(--color-canvas)] disabled:opacity-40 disabled:shadow-none"
        >
          {status.kind === "busy" ? "Opening…" : address ? "Start streaming" : "Connect a wallet first"}
        </button>
        {status.kind === "err" && (
          <p className="text-[13px] font-semibold" style={{ color: "var(--color-warn)" }}>
            {status.msg}
          </p>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--color-muted)]">
        {label}
      </span>
      {children}
    </label>
  );
}
