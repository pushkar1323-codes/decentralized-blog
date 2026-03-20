Contract Link:
<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/7420bad3-d007-4fdb-957c-0f476c1e423a" />

UI Screensort:
<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/241576d6-35ce-4f67-84b3-a36aef3a8f94" />

# Decentralized Blog on THE Blockchain

## 📌 Project Description

BlogChain is a decentralized application (dApp) that brings publishing to the blockchain. Every post, comment, and like is an on-chain Soroban transaction — immutable, unstoppable, and owned entirely by the author. There is no central server, no content moderation layer, and no privileged owner key. Once deployed, the contract governs itself.

Built on **Stellar Soroban** — a Rust-based smart contract platform designed for high throughput, low fees, and developer-friendly tooling — BlogChain demonstrates what truly permissionless publishing looks like in practice.

---

## ⚙️ What It Does

BlogChain lets anyone with a Stellar wallet publish blog posts directly to the Soroban blockchain. Readers can engage through likes and comments, and tip authors directly in XLM with zero platform fee. Every interaction is a signed transaction; every post is permanent.

The frontend connects to your Freighter browser wallet, simulates transactions before submission, and submits them to Soroban Mainnet via the public RPC. No backend. No database. No intermediary.

---

## 🚀 Features

### ✍️ Writing & Publishing

* Permissionless publishing — any Stellar address can publish a post; no allowlist, no approval, no admin gate
* On-chain storage — post title, tag, and content are stored directly in Soroban contract state
* Tag system — categorize posts (DeFi, DAOs, ZK Proofs, Soroban, Open Source, etc.)

### 📖 Reading & Discovery

* Latest feed — posts sorted by ledger timestamp
* Trending feed — posts ranked by on-chain like count
* My Posts — filter to your own wallet's published posts

### 💬 Engagement

* Likes — toggle-like any post; stored per address to prevent double-counting; fully on-chain
* Comments — leave a comment on any post, signed by your Freighter wallet and emitted as a Soroban event
* Direct XLM tips — tip an author in 1, 10, or 100 XLM; funds go directly to the author's Stellar address with no platform cut and no escrow

### 🔗 Wallet & Chain Integration

* Freighter wallet — connect your browser wallet to sign and submit transactions
* Simulate before submit — every write transaction is simulated via `server.simulateTransaction()` before asking for a signature
* Soroban Mainnet RPC — live connection to `mainnet.sorobanrpc.com`
* Transaction explorer links — every published post links directly to its transaction on Stellar Expert

### 🧠 Contract Design

* No owner variable — the deployer retains zero special privileges after deployment
* No `onlyAdmin` / `onlyOwner` modifiers — every function is callable by any address
* No pause / unpause — the contract cannot be stopped
* No upgrade proxy — logic is immutable
* No whitelist — publishing, liking, and commenting require only a valid Stellar keypair

---

## 📦 Tech Stack

* Soroban (Stellar Smart Contracts)
* Rust
* Stellar Mainnet
* Soroban RPC (`mainnet.sorobanrpc.com`)
* Freighter Wallet
* `stellar-sdk` v13.3.0
* Vanilla HTML/CSS/JS · Playfair Display · DM Mono

---

## 🔗 Deployed Smart Contract Link

https://stellar.expert/explorer/testnet/contract/CDPN45ELKRJMMCSAVE2ZMQKKR3DICNMDO7I4MIF4CROYWUIDKYALAUXH
---

## 📍 Addresses

**Contract Address (Soroban):**
CDPN45ELKRJMMCSAVE2ZMQKKR3DICNMDO7I4MIF4CROYWUIDKYALAUXH

**Freighter / Deployer Address:**
GBMCURKBG6BHGRUY7BRAYTYJA5FXLIFG4F5AICOZL2IO3OOST3XVWQCJ

---

## ⚠️ Limitations

* No central moderation (content cannot be removed once published)
* Immutable contract (no upgrade mechanism)
* Fully on-chain storage may increase cost with scale
* No backend indexing (depends on client-side or explorer queries)

---

## 🔮 Future Improvements

* Add better indexing for faster querying
* Improve frontend UX for large datasets
* Introduce optional off-chain storage (hybrid model)
* Enhance discovery (search, filters, ranking algorithms)

---

## 🧠 Learning Outcome

* Understanding Soroban smart contract architecture
* Handling on-chain storage and events
* Wallet-based authentication using Stellar
* Building fully decentralized applications without backend
