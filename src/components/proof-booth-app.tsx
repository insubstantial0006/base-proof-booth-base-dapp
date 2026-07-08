"use client";

import {
  FileBadge,
  Loader2,
  Printer,
  ReceiptText,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import { useMemo, useState } from "react";
import type { Address } from "viem";
import {
  useAccount,
  useConnect,
  useDisconnect,
  useReadContract,
  useSwitchChain,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { base } from "wagmi/chains";
import {
  MAX_PROOF_STATEMENT_LENGTH,
  MAX_PROOF_TITLE_LENGTH,
  proofBoothAbi,
  proofBoothContractAddress,
} from "@/lib/proof-booth";

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

function shortAddress(address?: Address) {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function dateLabel(createdAt?: bigint) {
  if (!createdAt) return "--";
  return new Date(Number(createdAt) * 1000).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function ProofBoothApp() {
  const [proofIdInput, setProofIdInput] = useState("1");
  const [title, setTitle] = useState("Builder promise");
  const [statement, setStatement] = useState(
    "I will ship the thing, not just talk about it, and I want the receipt to prove I said that out loud.",
  );
  const [status, setStatus] = useState(
    "Print one short promise or statement and lock it into an onchain proof receipt.",
  );
  const [walletStatus, setWalletStatus] = useState("");

  const { address, chainId, connector, isConnected } = useAccount();
  const { connectors, connectAsync, isPending: connecting } = useConnect();
  const { disconnectAsync, isPending: disconnecting } = useDisconnect();
  const { switchChain, isPending: switching } = useSwitchChain();
  const {
    data: hash,
    writeContract,
    isPending: writing,
    error: writeError,
  } = useWriteContract();

  const { isLoading: confirming, isSuccess: confirmed } =
    useWaitForTransactionReceipt({ hash });

  const availableConnectors = useMemo(
    () =>
      connectors
        .filter((item) => item.type !== "mock")
        .sort((a, b) => {
          const score = (item: (typeof connectors)[number]) => {
            if (item.id === "baseAccount" || item.name === "Base Account") {
              return 0;
            }
            if (item.type === "injected") return 1;
            return 2;
          };

          return score(a) - score(b);
        }),
    [connectors],
  );

  async function connectWallet() {
    const errors: string[] = [];
    setWalletStatus("Opening wallet...");

    for (const item of availableConnectors) {
      try {
        await connectAsync({ connector: item, chainId: base.id });
        setWalletStatus("");
        return;
      } catch (error) {
        errors.push(
          error instanceof Error
            ? `${item.name}: ${error.message}`
            : `${item.name}: connection failed`,
        );
      }
    }

    setWalletStatus(
      errors[0] ??
        "No wallet connector is available. Open this app inside Base App or install a wallet.",
    );
  }

  async function disconnectWallet() {
    try {
      if (connector) {
        await disconnectAsync({ connector });
      } else {
        await disconnectAsync();
      }
      setWalletStatus("Wallet disconnected. Tap Connect to reconnect.");
    } catch (error) {
      setWalletStatus(
        error instanceof Error ? error.message : "Could not disconnect wallet.",
      );
    }
  }
  const parsedProofId = BigInt(Math.max(1, Number(proofIdInput || "1")));

  const proofQuery = useReadContract({
    abi: proofBoothAbi,
    address: proofBoothContractAddress,
    functionName: "getProof",
    args: [parsedProofId],
    query: {
      enabled: Boolean(proofBoothContractAddress),
      refetchInterval: 12000,
    },
  });

  const proofTuple = proofQuery.data as
    | readonly [Address, string, string, bigint]
    | undefined;

  const proof = useMemo(
    () =>
      proofTuple
        ? {
            author: proofTuple[0],
            title: proofTuple[1],
            statement: proofTuple[2],
            createdAt: proofTuple[3],
          }
        : undefined,
    [proofTuple],
  );

  const canPost =
    Boolean(proofBoothContractAddress) &&
    isConnected &&
    chainId === base.id &&
    title.trim().length > 0 &&
    title.trim().length <= MAX_PROOF_TITLE_LENGTH &&
    statement.trim().length > 0 &&
    statement.trim().length <= MAX_PROOF_STATEMENT_LENGTH;

  const statusText = confirmed
    ? "Transaction confirmed on Base."
    : writeError
      ? writeError.message
      : status;

  function postProof() {
    if (!proofBoothContractAddress) return;
    setStatus("Confirm the proof receipt in your wallet.");
    writeContract({
      address: proofBoothContractAddress,
      abi: proofBoothAbi,
      functionName: "postProof",
      args: [title.trim(), statement.trim()],
      chainId: base.id,
    });
  }

  return (
    <main className="min-h-screen bg-[#f5f2eb] text-[#151515]">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-4 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between border-b border-[#151515]/15 pb-3">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-[14px] border border-[#151515] bg-white shadow-[0_10px_24px_rgba(0,0,0,0.08)]">
              <Printer className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.28em] text-[#5c5c5c]">
                Base Proof Booth
              </p>
              <h1 className="text-xl font-black sm:text-2xl">
                Print one statement. Keep the receipt.
              </h1>
            </div>
          </div>

          {isConnected ? (
            <div className="flex items-center gap-2">
              <span className="rounded-full border border-[#151515]/15 bg-white px-3 py-2 text-sm font-semibold">
                {shortAddress(address)}
              </span>
              <button
                className="rounded-full border border-[#151515] bg-[#151515] px-4 py-2 text-sm font-semibold text-white"
                onClick={disconnectWallet}
              >{disconnecting ? "Disconnecting" : "Disconnect"}</button>
            </div>
          ) : (
            <button
              className="inline-flex items-center gap-2 rounded-full border border-[#151515] bg-[#151515] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              disabled={availableConnectors.length === 0 || connecting}
              onClick={connectWallet}
            >
              {connecting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Wallet className="h-4 w-4" />
              )}
              Connect
            </button>
          )}
        {walletStatus ? (
            <p className="w-full text-right text-xs font-semibold opacity-75">
              {walletStatus}
            </p>
          ) : null}
        </header>

        <div className="grid flex-1 gap-4 py-4 lg:grid-cols-[minmax(0,1fr)_420px]">
          <section className="rounded-[28px] border border-[#151515] bg-[linear-gradient(180deg,#ffffff_0%,#efebe4_100%)] p-5 shadow-[0_24px_60px_rgba(0,0,0,0.08)]">
            <div className="max-w-3xl">
              <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#151515] bg-white px-3 py-1 text-xs font-black uppercase tracking-[0.18em]">
                <ShieldCheck className="h-3.5 w-3.5" />
                Onchain proof receipt
              </p>
              <h2 className="font-[system-ui] text-4xl font-black leading-tight sm:text-6xl">
                A clean proof slip for promises, goals, and public statements.
              </h2>
              <p className="mt-4 max-w-2xl text-base leading-7 text-[#555] sm:text-lg">
                Write one short statement, print it to Base, and keep a
                retrievable receipt that shows who said it and when.
              </p>
            </div>

            <div className="mt-8 rounded-[24px] border border-dashed border-[#151515] bg-white p-5">
              <div className="border-b border-dashed border-[#151515] pb-4">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-[#7a7a7a]">
                  Proof Receipt
                </p>
                <h3 className="mt-2 text-3xl font-black">
                  {proof?.title || "Builder promise"}
                </h3>
              </div>

              <div className="border-b border-dashed border-[#151515] py-4">
                <p className="text-sm leading-7 text-[#252525]">
                  {proof?.statement ||
                    "I will ship the thing, not just talk about it, and I want the receipt to prove I said that out loud."}
                </p>
              </div>

              <div className="grid gap-3 pt-4 sm:grid-cols-3">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#7a7a7a]">
                    Author
                  </p>
                  <p className="mt-2 text-sm font-semibold">
                    {proof?.author && proof.author !== ZERO_ADDRESS
                      ? shortAddress(proof.author)
                      : "--"}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#7a7a7a]">
                    Date
                  </p>
                  <p className="mt-2 text-sm font-semibold">
                    {dateLabel(proof?.createdAt)}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#7a7a7a]">
                    Status
                  </p>
                  <p className="mt-2 text-sm font-semibold">Stored on Base</p>
                </div>
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <div className="rounded-[20px] border border-[#151515] bg-white/80 p-4">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[#666]">
                  Step 1
                </p>
                <p className="mt-2 text-lg font-semibold">Write statement</p>
              </div>
              <div className="rounded-[20px] border border-[#151515] bg-white/80 p-4">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[#666]">
                  Step 2
                </p>
                <p className="mt-2 text-lg font-semibold">Print receipt</p>
              </div>
              <div className="rounded-[20px] border border-[#151515] bg-white/80 p-4">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[#666]">
                  Step 3
                </p>
                <p className="mt-2 text-lg font-semibold">Look it up</p>
              </div>
            </div>
          </section>

          <aside className="flex flex-col gap-4">
            <section className="rounded-[28px] border border-[#151515] bg-white p-5 shadow-[0_24px_60px_rgba(0,0,0,0.08)]">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-full bg-[#f0ede8]">
                  <FileBadge className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-2xl font-black">New proof</h3>
                  <p className="text-sm text-[#555]">
                    Print one short commitment or declaration.
                  </p>
                </div>
              </div>

              <div className="mt-4 grid gap-3">
                <label className="grid gap-2">
                  <span className="text-xs font-black uppercase tracking-[0.18em] text-[#666]">
                    Title
                  </span>
                  <input
                    className="rounded-2xl border border-[#151515]/15 bg-[#faf8f5] px-4 py-3 outline-none"
                    maxLength={MAX_PROOF_TITLE_LENGTH}
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                  />
                </label>
                <label className="grid gap-2">
                  <span className="text-xs font-black uppercase tracking-[0.18em] text-[#666]">
                    Statement
                  </span>
                  <textarea
                    className="min-h-28 rounded-2xl border border-[#151515]/15 bg-[#faf8f5] px-4 py-3 outline-none"
                    maxLength={MAX_PROOF_STATEMENT_LENGTH}
                    value={statement}
                    onChange={(event) => setStatement(event.target.value)}
                  />
                </label>
              </div>

              {chainId !== base.id && isConnected ? (
                <button
                  className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#151515] px-4 py-3 font-semibold text-white disabled:opacity-60"
                  disabled={switching}
                  onClick={() => switchChain({ chainId: base.id })}
                >
                  {switching ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Wallet className="h-4 w-4" />
                  )}
                  Switch to Base
                </button>
              ) : (
                <button
                  className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#151515] px-4 py-3 font-semibold text-white disabled:opacity-50"
                  disabled={!canPost || writing || confirming}
                  onClick={postProof}
                >
                  {writing || confirming ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Printer className="h-4 w-4" />
                  )}
                  Print on Base
                </button>
              )}
            </section>

            <section className="rounded-[28px] border border-[#151515] bg-white p-5 shadow-[0_24px_60px_rgba(0,0,0,0.08)]">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-full bg-[#f0ede8]">
                  <ReceiptText className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-2xl font-black">Receipt lookup</h3>
                  <p className="text-sm text-[#555]">
                    Load one proof receipt by ID.
                  </p>
                </div>
              </div>

              <div className="mt-4 grid gap-3">
                <label className="grid gap-2">
                  <span className="text-xs font-black uppercase tracking-[0.18em] text-[#666]">
                    Proof ID
                  </span>
                  <input
                    className="rounded-2xl border border-[#151515]/15 bg-[#faf8f5] px-4 py-3 outline-none"
                    value={proofIdInput}
                    onChange={(event) => setProofIdInput(event.target.value)}
                  />
                </label>
              </div>

              <div className="mt-4 rounded-[22px] border border-dashed border-[#151515] bg-[#faf8f5] p-4">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[#777]">
                  Current receipt
                </p>
                <p className="mt-3 text-xl font-black">
                  {proof?.title || "Load a proof to preview it here."}
                </p>
                <p className="mt-3 text-sm leading-6 text-[#444]">
                  {proof?.statement ||
                    "A proof receipt keeps the statement, author, and day together."}
                </p>
              </div>
            </section>

            <section className="rounded-[28px] border border-[#151515] bg-[#151515] p-5 text-white shadow-[0_24px_60px_rgba(0,0,0,0.08)]">
              <h3 className="text-2xl font-black">Print feed</h3>
              <p className="mt-4 min-h-16 text-sm leading-6 text-[#d8d8d8]">
                {statusText}
              </p>

              {!proofBoothContractAddress ? (
                <p className="rounded-[18px] border border-white/10 bg-white/5 p-3 text-xs leading-6 text-[#d8d8d8]">
                  Add `NEXT_PUBLIC_PROOF_BOOTH_CONTRACT_ADDRESS` after
                  deploying the proof booth contract, then redeploy Vercel.
                </p>
              ) : null}
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}
