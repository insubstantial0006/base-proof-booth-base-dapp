import type { Address } from "viem";

export const MAX_PROOF_TITLE_LENGTH = 48;
export const MAX_PROOF_STATEMENT_LENGTH = 180;

export const proofBoothAbi = [
  {
    type: "function",
    name: "postProof",
    stateMutability: "nonpayable",
    inputs: [
      { name: "title", type: "string" },
      { name: "statement", type: "string" },
    ],
    outputs: [{ name: "proofId", type: "uint256" }],
  },
  {
    type: "function",
    name: "getProof",
    stateMutability: "view",
    inputs: [{ name: "proofId", type: "uint256" }],
    outputs: [
      { name: "author", type: "address" },
      { name: "title", type: "string" },
      { name: "statement", type: "string" },
      { name: "createdAt", type: "uint256" },
    ],
  },
] as const;

export type ProofData = {
  author: Address;
  title: string;
  statement: string;
  createdAt: bigint;
};

export const proofBoothContractAddress = process.env
  .NEXT_PUBLIC_PROOF_BOOTH_CONTRACT_ADDRESS as Address | undefined;
