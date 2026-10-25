# 🔒 TokenLocker dApp — BOT Chain

A decentralized, trustless, and non-custodial ERC-20 token locking and vesting dApp deployed on **BOT Chain Testnet (Chain ID: 968)**.

TokenLocker allows token holders, founders, and developers to lock tokens for a predetermined period as verifiable proof to their communities. Once locked, tokens are held in smart contract custody and **cannot be withdrawn** until the unlock conditions and timestamp are met.

---

## 📜 Deployed Contracts (BOT Chain Testnet)

| Contract | Address | BohrScan Explorer |
| :--- | :--- | :--- |
| **TokenLocker** | `0x5Ed2E76ef698cAdf1905C5FD8de89a4dA786ae52` | [View Contract](https://scan.bohr.life/address/0x5Ed2E76ef698cAdf1905C5FD8de89a4dA786ae52) |
| **MockERC20 (TEST)** | `0xBb6987f6981B31BE9e76829A6eBCa743634b8094` | [View Token](https://scan.bohr.life/address/0xBb6987f6981B31BE9e76829A6eBCa743634b8094) |

- **Network:** BOT Chain Testnet
- **Chain ID:** `968`
- **RPC Endpoint:** `https://rpc.bohr.life`
- **Block Explorer:** [https://scan.bohr.life/](https://scan.bohr.life/)
- **Native Gas Token:** BOT

---

## ✨ Key Features

1. **100% Non-Custodial & Trustless:** No admin or owner backdoor to withdraw user funds prematurely.
2. **Safe ERC-20 Handling:** Uses OpenZeppelin `SafeERC20`, `ReentrancyGuard`, and safe balance difference checks before/after deposits to support deflationary and fee-on-transfer tokens.
3. **Lock Duration Extension:** Lock owners can extend unlock timestamps into the future, but contract rules strictly forbid reducing them.
4. **Lock Ownership Transfer:** Owners can transfer beneficial ownership of a lock to another recipient address.
5. **Public Cryptographic Proof Card:** Anyone can inspect lock records in full transparency with direct shareable permalinks (`#lock-1`) and one-click sharing on X (Twitter).
6. **Live Real-Time Countdowns:** Second-by-second countdown tickers for all active locks.
7. **Built-in Testnet Faucet:** 1-click minting of 1,000 TEST tokens directly from the frontend to test the dApp immediately on BOT Chain.

---

## 🏗️ Project Architecture

```text
token-locker/
├── contracts/                     # Hardhat Smart Contracts
│   ├── contracts/
│   │   ├── TokenLocker.sol        # Core trustless locker logic
│   │   └── MockERC20.sol          # ERC-20 test token with public faucet
│   ├── test/
│   │   └── TokenLocker.test.ts    # Comprehensive automated test suite (12 tests)
│   ├── scripts/
│   │   └── deploy.ts              # Deployment script for BOT Chain
│   ├── hardhat.config.ts
│   └── package.json
│
└── frontend/                      # React + Vite Web3 dApp
    ├── src/
    │   ├── config/
    │   │   └── wagmi.ts           # Reown AppKit & BOT Chain definition
    │   ├── components/
    │   │   ├── Navbar.tsx         # Header, AppKit connect button, network indicator
    │   │   ├── LockForm.tsx       # 2-step approve & deposit, presets, token query
    │   │   ├── MyLocks.tsx        # Dashboard with live countdown & 1-click withdraw
    │   │   ├── VerifyLock.tsx     # Public verification certificate card
    │   │   └── FaucetModal.tsx    # Test token minting modal
    │   ├── contracts/
    │   │   ├── abis.ts            # Typed ABIs
    │   │   └── addresses.json     # Deployed contract addresses
    │   ├── App.tsx
    │   └── index.css              # Custom dark glassmorphism styling
    ├── package.json
    └── vite.config.ts
```

---

## 🚀 Getting Started

### 1. Smart Contracts

```bash
cd contracts
npm install

# Run automated tests (12 unit tests)
npm test

# Deploy to BOT Chain Testnet
npm run deploy:botchain
```

### 2. Frontend dApp

```bash
cd frontend
npm install

# Start local development server
npm run dev
```

Visit `http://localhost:5173/` in your browser.

---

## 🔒 Security Assurance

- **No Backdoors:** The contract does not implement any administrative withdrawal function.
- **Checks-Effects-Interactions:** State is updated (`isWithdrawn = true`) before transferring tokens to prevent reentrancy attacks.
- **Safe Transfers:** OpenZeppelin `SafeERC20` handles non-standard ERC-20 tokens that do not return boolean values.

---

## 📄 License

MIT License.
