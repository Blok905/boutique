export const BOUTIQUE_AUTH_ACTION = 'publish-listings';
export const BOUTIQUE_BROADCAST_AUTH_ACTION = 'broadcast-transaction';
export const AUTH_CHALLENGE_TTL_SECONDS = 300;
export const BOUTIQUE_SIGNABLE_ACTIONS = new Set([
    'publish-listings',
    'profile-update',
    'offer-create',
    'offer-cancel',
    'offer-accept-prepare',
    'offer-accept'
]);

export function stripAuthEnvelope(payload) {
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
        return payload;
    }

    const { auth, ...manifest } = payload;
    return manifest;
}

export async function hashManifestPayload(payload) {
    return sha256Hex(stableStringify(stripAuthEnvelope(payload)));
}

export async function sha256Hex(value) {
    const source = typeof value === 'string' ? value : stableStringify(value);
    const bytes = new TextEncoder().encode(source);
    const digest = await crypto.subtle.digest('SHA-256', bytes);
    return bytesToHex(new Uint8Array(digest));
}

export function buildPublishAuthMessage({
    action = BOUTIQUE_AUTH_ACTION,
    sellerAddress,
    sellerPublicKey,
    manifestHash,
    nonce,
    issuedAt,
    origin = '',
    walletProvider = '',
    signatureMethod = ''
}) {
    return buildActionAuthMessage({
        action,
        address: sellerAddress,
        publicKey: sellerPublicKey,
        payloadHash: manifestHash,
        nonce,
        issuedAt,
        origin,
        walletProvider,
        signatureMethod
    });
}

export function buildActionAuthMessage({
    action,
    address,
    publicKey,
    payloadHash,
    nonce,
    issuedAt,
    origin = '',
    walletProvider = '',
    signatureMethod = ''
}) {
    return [
        'Blok Boutique Authorization',
        `action: ${String(action || BOUTIQUE_AUTH_ACTION).trim() || BOUTIQUE_AUTH_ACTION}`,
        `origin: ${String(origin || '').trim() || 'unknown'}`,
        `wallet_provider: ${String(walletProvider || '').trim() || 'unknown'}`,
        `signature_method: ${String(signatureMethod || '').trim() || 'ecdsa'}`,
        `wallet_address: ${String(address || '').trim()}`,
        `wallet_public_key: ${String(publicKey || '').trim()}`,
        `payload_hash: ${String(payloadHash || '').trim()}`,
        `nonce: ${String(nonce || '').trim()}`,
        `issued_at: ${String(issuedAt || '').trim()}`
    ].join('\n');
}

export function buildBroadcastAuthMessage({
    buyerAddress,
    buyerPublicKey,
    txid,
    nonce,
    issuedAt,
    origin = '',
    walletProvider = '',
    signatureMethod = '',
    buyerOrdinalsAddress = ''
}) {
    return [
        'Blok Boutique Broadcast Authorization',
        `action: ${BOUTIQUE_BROADCAST_AUTH_ACTION}`,
        `origin: ${String(origin || '').trim() || 'unknown'}`,
        `wallet_provider: ${String(walletProvider || '').trim() || 'unknown'}`,
        `signature_method: ${String(signatureMethod || '').trim() || 'ecdsa'}`,
        `buyer_address: ${String(buyerAddress || '').trim()}`,
        `buyer_public_key: ${String(buyerPublicKey || '').trim()}`,
        `buyer_ordinals_address: ${String(buyerOrdinalsAddress || '').trim()}`,
        `txid: ${String(txid || '').trim()}`,
        `nonce: ${String(nonce || '').trim()}`,
        `issued_at: ${String(issuedAt || '').trim()}`
    ].join('\n');
}

export function stableStringify(value) {
    if (value === null || typeof value !== 'object') {
        return JSON.stringify(value);
    }

    if (Array.isArray(value)) {
        return `[${value.map((entry) => stableStringifyArrayValue(entry)).join(',')}]`;
    }

    const entries = Object.keys(value)
        .sort()
        .flatMap((key) => {
            const entry = value[key];
            if (entry === undefined || typeof entry === 'function' || typeof entry === 'symbol') {
                return [];
            }

            return [`${JSON.stringify(key)}:${stableStringify(entry)}`];
        });

    return `{${entries.join(',')}}`;
}

export function randomHex(byteLength = 16) {
    const size = Math.max(1, Number(byteLength) || 16);
    const bytes = new Uint8Array(size);
    crypto.getRandomValues(bytes);
    return bytesToHex(bytes);
}

function stableStringifyArrayValue(value) {
    if (value === undefined || typeof value === 'function' || typeof value === 'symbol') {
        return 'null';
    }

    return stableStringify(value);
}

function bytesToHex(bytes) {
    return Array.from(bytes, (value) => value.toString(16).padStart(2, '0')).join('');
}

