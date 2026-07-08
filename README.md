# Base Proof Booth

## Purpose

Use Base Proof Booth when you need a clean Base surface for proof cards. The main operation is to publishing a small claim; the result is a proof card.

## Verification checklist

- Build ID: `6a048d6eacef3c7a49b15f2c`
- Builder Wallet: `0xC3c8712609171e2eB86b6E7a7e981074e3628f34`
- Builder Code: `bc_awms62af`
- Live deployment: https://base-proof-booth.vercel.app
- Repository: https://github.com/insubstantial0006/base-proof-booth-base-dapp
- Chain: Base

## Operator steps

1. Install dependencies.
2. Start the development server.
3. Connect a wallet in the browser.
4. Confirm the `/builder` proof values.

```bash
npm install
npm run dev
```

## Implementation

React app router, wallet hooks, Base network config, Vercel deployment.

## Secret policy

Do not commit `.env`, private keys, seed phrases, RPC keys, GitHub tokens, or Vercel tokens. Use `.env.example` only for placeholders.

MIT.
