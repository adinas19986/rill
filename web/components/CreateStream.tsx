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

  async function submit() {
    if (!publicClient || !walletClient || !address) return;
    if (!isAddress(recipient)) {
      setStatus({ kind: "err", msg: "Enter a valid recipient address." });
      return;
    }
    setStatus({ kind: "busy", msg: "Approving and creating the stream…" });
    try {
      const now = Math.floor(Date.now() / 1000);
      const { streamId } = await createStream(
        { net, publicClient, walletClient, account: address },
        {
          recipient: recipient as Address,
          deposit: parseUnits(amount, 6),
          startTime: now,
          stopTime: now + duration,
        },
      );
      setStatus({ kind: "idle" });
      onCreated(streamId);
    } catch (e) {
      const m = e instanceof Error ? e.message : String(e);
      setStatus({ kind: "err", msg: /rejected|denied/i.test(m) ? "Rejected in wallet." : m.slice(0, 160) });
    }
  }

  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 sm:p-6">
      <h3 className="text-lg font-extrabold tracking-tight">Open a stream</h3>
      <p className="mt-1 text-[14px] text-[var(--color-muted)]">
        Lock USDC that flows to the recipient every second.
      </p>

      <div className="mt-5 space-y-4">
        <Field label="Recipient">
          <input
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            placeholder="0x…"
            spellCheck={false}
            className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3 py-2 font-mono text-[13px] outline-none focus:border-[var(--color-accent)]"
          />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Amount (USDC)">
            <input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              inputMode="decimal"
              className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3 py-2 font-mono text-[14px] outline-none focus:border-[var(--color-accent)]"
            />
          </Field>
          <Field label="Duration">
            <div className="flex gap-1.5">
              {DURATIONS.map((d) => (
                <button
                  key={d.secs}
                  onClick={() => setDuration(d.secs)}
                  className={`btn-anim flex-1 rounded-md border px-2 py-2 text-[12px] font-semibold ${
                    duration === d.secs
                      ? "border-[var(--color-accent)] bg-[var(--color-accent)] text-[var(--color-accent-ink)]"
                      : "border-[var(--color-border)] bg-[var(--color-surface-2)] text-[var(--color-muted)]"
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </Field>
        </div>

        <button
          onClick={submit}
          disabled={status.kind === "busy" || !address}
          className="btn-anim w-full rounded-md bg-[var(--color-accent)] px-4 py-2.5 text-[15px] font-semibold text-[var(--color-accent-ink)] hover:bg-[var(--color-accent-strong)] disabled:opacity-50"
        >
          {status.kind === "busy" ? "Creating…" : address ? "Create stream" : "Connect a wallet first"}
        </button>
        {status.kind === "err" && (
          <p className="text-[13px]" style={{ color: "var(--color-warn)" }}>
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
      <span className="mb-1.5 block text-[12px] font-semibold uppercase tracking-wide text-[var(--color-muted)]">
        {label}
      </span>
      {children}
    </label>
  );
}
