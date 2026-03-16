## Boutique

Boutique is a self-hosted, non-custodial Ordinals marketplace for tracked collections. It is a Bitcoin inscription transaction coordinator, not an exchange, escrow layer, or custody service. The marketplace implements a 0% protocol fee model, making settlement buyer-to-seller plus miner fee only.

> Note: The bundled Metadata/ manifests and media assets in this export are synthetic placeholders included only so the public repository can be deployed without publishing private collection files.

## Scope

- tracked collections are declared in [`boutique/collection-registry.js`](./boutique/collection-registry.js) and bound to committed manifests under [`Metadata/`](./Metadata)
- the current marketplace surface is item listings, item purchases, and item offers only
- marketplace state is persisted locally under `boutique/.data/`
- the marketplace runtime lives under [`boutique/`](./boutique)

## Setup

1. `cd boutique && npm install`
2. Create `boutique/.env` from [`boutique/.env.example`](./boutique/.env.example) and point it at local `ord` and `bitcoind`.
3. Start the runtime with `npm start`.

## Mechanism

Listings are published by hashing a canonical payload and binding that hash to a one-time wallet authorization challenge. The backend verifies the signature, verifies that the signer public key controls the seller address, and then validates the listing against local `ord` and `bitcoind`.

A live listing is valid only if:

- `ord` resolves the inscription to the advertised outpoint
- `bitcoind` returns the same prevout script and value
- the prevout is controlled by the seller ordinals address
- the seller PSBT matches that prevout exactly
- the seller PSBT is a single-input, single-output `SIGHASH_SINGLE|ANYONECANPAY` fragment

Settlement is buyer-constructed and server-validated. Before relay, the backend verifies that the transaction matches exactly one active listing, preserves the inscription output value, transfers the inscription to the buyer ordinals address, pays the seller payout address exactly `price + inscription output value`, rejects unexpected recipients, and enforces a fee-rate safety cap. No marketplace payout output is inserted. Valid transactions are broadcast through local `bitcoind`.

Offers are off-chain item bids. The current offer flow is `offer-create`, `offer-cancel`, `offer-accept-prepare`, and `offer-accept`. Public reads do not expose the stored buyer bid PSBT. The seller authenticates `offer-accept-prepare`, retrieves the stored buyer PSBT, signs the completion PSBT, and the backend finalizes and broadcasts the transaction if the structure still matches.

Wallet signing is delegated to browser wallets such as UniSat and Xverse using ECDSA or BIP-322. Private keys never touch the backend.

## Security

- Boutique is non-custodial, not trustless. The operator still controls the web origin, API, manifests, and runtime.
- `ord` and `bitcoind` are the trust anchors for listing validity and settlement checks. If either service is stale, dishonest, or misconfigured, marketplace decisions will be wrong.
- collection membership, listings, offers, and sales ledgers are off-chain application state
- external services are optional enrichment or fallback only and are not the settlement trust path
- `/boutique/content/:inscriptionId` proxies inscription content from `ord` and should be treated as untrusted remote content

## Disclaimer

This repository is an open-source marketplace implementation, not a production warranty. It should be independently audited before public deployment or material value transfer.

