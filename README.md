# Kredith
> **Build Reputation. Unlock Capital.** > A decentralized application (dApp) on **IOTA Rebased** that turns MSME (UMKM) revenue history into a verifiable, evolving **Dynamic NFT**.

<img width="1900" height="872" alt="Cuplikan layar 2025-12-14 171410" src="https://github.com/user-attachments/assets/50a90ee0-a1c9-4aec-b133-282c7d622c52" />
<img width="1897" height="880" alt="Cuplikan layar 2025-12-14 171439" src="https://github.com/user-attachments/assets/172b47ba-a1bd-4922-b2db-d7e15e77d74e" />

## 📍 Contract Address

**Network**: Testnet
**Package ID**: `0x8f412472693c878a83e21547fa9c37f0a8db8df11be1db6e265809d4d56ffd8c`
**Explorer**: [View on Explorer](https://iotascan.com/testnet/object/0x8f412472693c878a83e21547fa9c37f0a8db8df11be1db6e265809d4d56ffd8c/contracts)

## 📖 Overview

**Kredith** helps unbanked businesses build a credit history on the blockchain. Instead of relying on traditional bank statements, businesses record their revenue on-chain.

The core innovation is the **Dynamic Identity NFT**:
* ** 🌱 Bronze Tier:** Newly registered business.
* ** 🥈 Silver Tier:** Revenue > 10,000,000 IDR.
* ** 👑 Gold Tier:** Revenue > 100,000,000 IDR.

The NFT image and metadata **automatically evolve** via Smart Contract logic as the business grows.

## ✨ Key Features

* **⚡ Instant Registration:** Mint a unique "Kredith Score" NFT (Object) on the IOTA network.
* **📈 Real-time Recording:** Input daily revenue directly to the blockchain.
* **🦎 Dynamic Evolution:** The NFT Tier and Image update automatically based on accumulated revenue.
* **🔐 Auto-Login:** The app automatically detects if your wallet already owns a Business Object and redirects you to the dashboard.
* **🔎 Verifiable:** Every transaction includes a direct link to the IOTA Explorer.
* **🎨 Neo-Brutalist UI:** A bold, high-contrast interface designed for clarity and impact.

## 🛠️ Tech Stack

* **Blockchain:** IOTA Rebased (Testnet)
* **Smart Contract:** Move Language
* **Frontend:** Next.js 14, React, Tailwind CSS
* **Integration:** `@iota/dapp-kit`, `@iota/iota-sdk`
* **State Management:** React Query

## 🚀 Getting Started

1. **Install dependencies:**
   ```bash
   npm install --legacy-peer-deps
   ```

2. **Run the development server:**
   ```bash
   npm run dev
   ```

3. **Open [http://localhost:3000](http://localhost:3000)** in your browser

## 📝 Next Steps

### 1. Deploy Your Move Contract

```bash
cd contract/<your-project-name>
iota move build
iota client publish
```

Then manually copy the package ID and update `lib/config.ts`:

```typescript
export const TESTNET_PACKAGE_ID = "0xYOUR_PACKAGE_ID"
```

### 2. Customize Your dApp
- Adjust `Provider.tsx` for the default environment of your dApp.
- Adjust `useContracts.ts` for methods to interact with your contract. 
- Adjust `components/sample.tsx` to customize how your dApp looks.


## 🔧 Advanced Configuration

### Network Configuration

Edit `lib/config.ts` to configure different networks:

```typescript
export const TESTNET_PACKAGE_ID = "0x..."
export const DEVNET_PACKAGE_ID = "0x..."
export const MAINNET_PACKAGE_ID = "0x..."
```

## 📚 Additional Resources

- [IOTA Documentation](https://wiki.iota.org/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Move Language Documentation](https://move-language.github.io/move/)

