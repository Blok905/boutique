import { readFile, stat, writeFile, mkdir, rename } from 'node:fs/promises';
import { createServer } from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Buffer } from 'node:buffer';
import * as bitcoin from 'bitcoinjs-lib';
import { handleBoutiqueApiRequest } from './boutique-api.mjs';
import { buildBoutiqueCatalog, findCatalogAssetById } from './catalog-builder.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const defaultListingsFile = path.join(__dirname, '.data', 'marketplace-listings.json');
const defaultSalesFile = path.join(__dirname, '.data', 'marketplace-sales.json');
const defaultOffersFile = path.join(__dirname, '.data', 'marketplace-offers.json');
const defaultProfilesFile = path.join(__dirname, '.data', 'marketplace-profiles.json');
const defaultBestInSlotCacheFile = path.join(__dirname, '.data', 'bestinslot-sales-cache.json');
const envFilePath = path.join(__dirname, '.env');
const INTERNAL_REMOTE_ADDR_HEADER = 'x-boutique-remote-addr';
const BITCOIN_NETWORK = bitcoin.networks.bitcoin;
const BESTINSLOT_RECORD_CACHE_TTL_MS = 6 * 60 * 60 * 1000;
const BESTINSLOT_QUICK_RECORD_CACHE_TTL_MS = 30 * 60 * 1000;
const BESTINSLOT_FULL_HISTORY_CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const BESTINSLOT_RETRY_DELAY_MS = 150;
const BESTINSLOT_RETRYABLE_STATUS_CODES = new Set([408, 425, 429, 500, 502, 503, 504]);
const LARGE_BESTINSLOT_ACTIVITY_SLUGS = new Set();
const KNOWN_BESTINSLOT_RECORD_OVERRIDES = {};
await loadEnvFile(envFilePath);
const basePath = normalizeBasePath(process.env.BOUTIQUE_BASE_PATH || '/boutique');
const defaultAllowedOrigins = ['http://127.0.0.1:8787', 'http://localhost:8787', 'https://example.com'].join(',');

const config = {
    host: process.env.BOUTIQUE_HOST || '127.0.0.1',
    port: normalizePort(process.env.BOUTIQUE_PORT || '8787'),
    basePath,
    sellerAddress: String(process.env.BOUTIQUE_SELLER_ADDRESS || '').trim(),
    allowedOrigins: String(process.env.BOUTIQUE_ALLOWED_ORIGINS || defaultAllowedOrigins)
        .split(',')
        .map((entry) => entry.trim().replace(/\/+$/, ''))
        .filter(Boolean),
    ordBaseUrl: String(process.env.ORD_BASE_URL || 'http://127.0.0.1:80').trim().replace(/\/+$/, ''),
    bitcoindRpcUrl: String(process.env.BITCOIND_RPC_URL || 'http://127.0.0.1:8332').trim().replace(/\/+$/, ''),
    bitcoindCookiePath: String(process.env.BITCOIND_COOKIE_PATH || '').trim(),
    bitcoindRpcUser: String(process.env.BITCOIND_RPC_USER || '').trim(),
    bitcoindRpcPassword: String(process.env.BITCOIND_RPC_PASSWORD || '').trim(),
    bitcoindRpcTimeoutMs: normalizePositiveIntegerValue(process.env.BOUTIQUE_BITCOIND_RPC_TIMEOUT_MS, 8_000),
    bitcoindScanTimeoutMs: normalizePositiveIntegerValue(process.env.BOUTIQUE_BITCOIND_SCAN_TIMEOUT_MS, 15_000),
    remoteFetchTimeoutMs: normalizePositiveIntegerValue(process.env.BOUTIQUE_REMOTE_FETCH_TIMEOUT_MS, 8_000),
    esploraFallbackUrl: String(process.env.BOUTIQUE_ESPLORA_FALLBACK_URL || '').trim().replace(/\/+$/, ''),
    listingsFile: path.resolve(process.env.BOUTIQUE_LISTINGS_FILE || defaultListingsFile),
    salesFile: path.resolve(process.env.BOUTIQUE_SALES_FILE || defaultSalesFile),
    offersFile: path.resolve(process.env.BOUTIQUE_OFFERS_FILE || defaultOffersFile),
    profilesFile: path.resolve(process.env.BOUTIQUE_PROFILES_FILE || defaultProfilesFile),
    bestInSlotCacheFile: path.resolve(process.env.BOUTIQUE_BESTINSLOT_CACHE_FILE || defaultBestInSlotCacheFile),
    bestInSlotApiBaseUrl: String(process.env.BOUTIQUE_BESTINSLOT_API_BASE_URL || 'https://api.bestinslot.xyz').trim().replace(/\/+$/, ''),
    bestInSlotActivityApiBaseUrl: String(process.env.BOUTIQUE_BESTINSLOT_ACTIVITY_API_BASE_URL || 'https://v2api.bestinslot.xyz').trim().replace(/\/+$/, ''),
    bestInSlotApiKey: String(process.env.BOUTIQUE_BESTINSLOT_API_KEY || '').trim(),
    bestInSlotTimeoutMs: normalizePositiveIntegerValue(process.env.BOUTIQUE_BESTINSLOT_TIMEOUT_MS, 8_000),
    bestInSlotLookbackYears: normalizePositiveIntegerValue(process.env.BOUTIQUE_BESTINSLOT_LOOKBACK_YEARS, 3),
    bestInSlotScanConcurrency: normalizePositiveIntegerValue(process.env.BOUTIQUE_BESTINSLOT_SCAN_CONCURRENCY, 12),
    trustProxy: normalizeBoolean(process.env.BOUTIQUE_TRUST_PROXY || ''),
    maxRequestBodyBytes: normalizePositiveIntegerValue(process.env.BOUTIQUE_MAX_REQUEST_BODY_BYTES, 1_500_000),
    rateLimits: {
        windowMs: normalizePositiveIntegerValue(process.env.BOUTIQUE_RATE_LIMIT_WINDOW_MS, 60_000),
        defaultMax: normalizePositiveIntegerValue(process.env.BOUTIQUE_RATE_LIMIT_DEFAULT, 120),
        utxoMax: normalizePositiveIntegerValue(process.env.BOUTIQUE_RATE_LIMIT_UTXO, 20),
        broadcastMax: normalizePositiveIntegerValue(process.env.BOUTIQUE_RATE_LIMIT_BROADCAST, 10),
        publishMax: normalizePositiveIntegerValue(process.env.BOUTIQUE_RATE_LIMIT_PUBLISH, 20),
        challengeMax: normalizePositiveIntegerValue(process.env.BOUTIQUE_RATE_LIMIT_CHALLENGE, 30)
    }
};

await mkdir(path.dirname(config.listingsFile), { recursive: true });
await mkdir(path.dirname(config.salesFile), { recursive: true });
await mkdir(path.dirname(config.offersFile), { recursive: true });
await mkdir(path.dirname(config.profilesFile), { recursive: true });
await mkdir(path.dirname(config.bestInSlotCacheFile), { recursive: true });
const boutiqueCatalog = await buildBoutiqueCatalog(projectRoot);

const challengeStore = new Map();
const addressUtxoCache = new Map();
const rateLimitStore = new Map();
const bestInSlotCache = new Map();
const bestInSlotQuickRecordCache = new Map();
const bestInSlotRecentCache = new Map();
const bestInSlotInscriptionCache = new Map();
const bestInSlotCollectionHistoryCache = new Map();
const bestInSlotRecordRefreshStore = new Map();
let bestInSlotCachePersistPromise = Promise.resolve();
let recommendedFeesCache = null;
const bitcoindAuthHeader = await resolveBitcoindAuthHeader(config);
await loadBestInSlotSalesCache();

setInterval(() => {
    const now = Date.now();
    for (const [nonce, entry] of challengeStore.entries()) {
        if (entry.expiresAt <= now) {
            challengeStore.delete(nonce);
        }
    }
}, 60_000).unref();

setInterval(() => {
    cleanupRateLimitStore();
}, 60_000).unref();

const runtime = {
    ...config,
    boutiqueCatalog,
    readManifest,
    writeManifest,
    readSalesActivity,
    writeSalesActivity,
    readOffersStore,
    writeOffersStore,
    readProfilesStore,
    writeProfilesStore,
    getChallenge,
    setChallenge,
    deleteChallenge,
    resolveInscription,
    fetchTransactionOutput,
    fetchTransactionHex,
    broadcastTransaction,
    fetchAddressUtxos,
    checkOutputSpent,
    fetchRecommendedFees,
    fetchBestInSlotRecordSales,
    fetchBestInSlotRecentSales,
    fetchBestInSlotInscriptionSales,
    fetchBestInSlotCollectionSalesHistory,
    getBestInSlotIndexingStatus,
    getBoutiqueAsset,
    listBoutiqueCollections,
    listBoutiqueAssets,
    consumeRateLimit
};

setTimeout(() => {
    void warmBestInSlotHistoricalIndexes();
}, 2000).unref();

const server = createServer(async (req, res) => {
    try {
        const forwardedProto = config.trustProxy
            ? String(req.headers['x-forwarded-proto'] || '').split(',')[0].trim().toLowerCase()
            : '';
        const forwardedHost = config.trustProxy
            ? String(req.headers['x-forwarded-host'] || '').split(',')[0].trim()
            : '';
        const requestProtocol = forwardedProto === 'https' ? 'https' : 'http';
        const requestHost = forwardedHost || req.headers.host || `${config.host}:${config.port}`;
        const requestUrl = new URL(req.url || '/', `${requestProtocol}://${requestHost}`);
        if (requestUrl.pathname.startsWith(`${config.basePath}/api/`)) {
            const request = await toWebRequest(req, requestUrl);
            const response = await handleBoutiqueApiRequest(request, runtime);
            await sendWebResponse(res, response, req.method || 'GET');
            return;
        }

        const response = await serveStatic(requestUrl, req.method || 'GET');
        await sendWebResponse(res, response, req.method || 'GET');
    } catch (error) {
        const message = error && error.message ? String(error.message) : 'Internal server error.';
        const response = new Response(message, {
            status: 500,
            headers: {
                'Content-Type': 'text/plain; charset=utf-8',
                'Cache-Control': 'no-store'
            }
        });

        await sendWebResponse(res, response, req.method || 'GET');
    }
});

server.listen(config.port, config.host, () => {
    console.log(`Blok Boutique server listening on http://${config.host}:${config.port}${config.basePath}/`);
    console.log(`Using ord at ${config.ordBaseUrl}`);
    console.log(`Using bitcoind RPC at ${config.bitcoindRpcUrl}`);
    console.log(`Persisting listings at ${config.listingsFile}`);
    console.log(`Persisting sales activity at ${config.salesFile}`);
    console.log(`Persisting offers at ${config.offersFile}`);
    console.log(`Persisting profiles at ${config.profilesFile}`);
    console.log(`Persisting BiS sales cache at ${config.bestInSlotCacheFile}`);
    console.log(`Loaded ${boutiqueCatalog.collections.length} boutique collections.`);
});

async function readManifest() {
    try {
        return await readFile(config.listingsFile, 'utf8');
    } catch (error) {
        if (error && error.code === 'ENOENT') {
            return null;
        }

        throw createInfrastructureError('MANIFEST_IO_FAILED', `Failed to read listings manifest: ${error.message}`);
    }
}

async function writeManifest(manifest) {
    const serialized = JSON.stringify(manifest, null, 2);
    const tempPath = `${config.listingsFile}.tmp`;

    try {
        await writeFile(tempPath, serialized, 'utf8');
        await rename(tempPath, config.listingsFile);
    } catch (error) {
        throw createInfrastructureError('MANIFEST_IO_FAILED', `Failed to write listings manifest: ${error.message}`);
    }
}

async function readSalesActivity() {
    try {
        return await readFile(config.salesFile, 'utf8');
    } catch (error) {
        if (error && error.code === 'ENOENT') {
            return null;
        }

        throw createInfrastructureError('SALES_IO_FAILED', `Failed to read boutique sales activity: ${error.message}`);
    }
}

async function writeSalesActivity(activity) {
    const serialized = JSON.stringify(activity, null, 2);
    const tempPath = `${config.salesFile}.tmp`;

    try {
        await writeFile(tempPath, serialized, 'utf8');
        await rename(tempPath, config.salesFile);
    } catch (error) {
        throw createInfrastructureError('SALES_IO_FAILED', `Failed to write boutique sales activity: ${error.message}`);
    }
}

async function readOffersStore() {
    try {
        return await readFile(config.offersFile, 'utf8');
    } catch (error) {
        if (error && error.code === 'ENOENT') {
            return null;
        }

        throw createInfrastructureError('OFFERS_IO_FAILED', `Failed to read boutique offers: ${error.message}`);
    }
}

async function writeOffersStore(store) {
    const serialized = JSON.stringify(store, null, 2);
    const tempPath = `${config.offersFile}.tmp`;

    try {
        await writeFile(tempPath, serialized, 'utf8');
        await rename(tempPath, config.offersFile);
    } catch (error) {
        throw createInfrastructureError('OFFERS_IO_FAILED', `Failed to write boutique offers: ${error.message}`);
    }
}

async function readProfilesStore() {
    try {
        return await readFile(config.profilesFile, 'utf8');
    } catch (error) {
        if (error && error.code === 'ENOENT') {
            return null;
        }

        throw createInfrastructureError('PROFILES_IO_FAILED', `Failed to read boutique profiles: ${error.message}`);
    }
}

async function writeProfilesStore(store) {
    const serialized = JSON.stringify(store, null, 2);
    const tempPath = `${config.profilesFile}.tmp`;

    try {
        await writeFile(tempPath, serialized, 'utf8');
        await rename(tempPath, config.profilesFile);
    } catch (error) {
        throw createInfrastructureError('PROFILES_IO_FAILED', `Failed to write boutique profiles: ${error.message}`);
    }
}

async function loadBestInSlotSalesCache() {
    const serialized = await readBestInSlotSalesCacheFile();
    if (!serialized) {
        return;
    }

    try {
        const parsed = JSON.parse(serialized);
        hydrateBestInSlotCacheMap(bestInSlotCache, parsed?.record);
        hydrateBestInSlotCacheMap(bestInSlotRecentCache, parsed?.recent);
        hydrateBestInSlotCacheMap(bestInSlotInscriptionCache, parsed?.inscription);
        hydrateBestInSlotCacheMap(bestInSlotCollectionHistoryCache, parsed?.historical);
    } catch (error) {
        console.warn(`Failed to parse BiS sales cache: ${error.message}`);
    }
}

async function readBestInSlotSalesCacheFile() {
    try {
        return await readFile(config.bestInSlotCacheFile, 'utf8');
    } catch (error) {
        if (error && error.code === 'ENOENT') {
            return null;
        }

        throw createInfrastructureError('BESTINSLOT_CACHE_IO_FAILED', `Failed to read BiS sales cache: ${error.message}`);
    }
}

function hydrateBestInSlotCacheMap(target, source) {
    if (!source || typeof source !== 'object') {
        return;
    }

    const now = Date.now();
    for (const [key, entry] of Object.entries(source)) {
        const normalizedKey = String(key || '').trim().toLowerCase();
        const expiresAt = Number(entry?.expiresAt || 0);
        const value = Array.isArray(entry?.value) ? entry.value : [];
        if (!normalizedKey || expiresAt <= now) {
            continue;
        }

        target.set(normalizedKey, {
            expiresAt,
            value: cloneJsonValue(value)
        });
    }
}

function serializeBestInSlotCacheMap(source) {
    const now = Date.now();
    const payload = {};

    for (const [key, entry] of source.entries()) {
        const normalizedKey = String(key || '').trim().toLowerCase();
        const expiresAt = Number(entry?.expiresAt || 0);
        if (!normalizedKey || expiresAt <= now) {
            continue;
        }

        payload[normalizedKey] = {
            expiresAt,
            value: cloneJsonValue(Array.isArray(entry?.value) ? entry.value : [])
        };
    }

    return payload;
}

function persistBestInSlotSalesCache() {
    const payload = JSON.stringify({
        updatedAt: new Date().toISOString(),
        record: serializeBestInSlotCacheMap(bestInSlotCache),
        recent: serializeBestInSlotCacheMap(bestInSlotRecentCache),
        inscription: serializeBestInSlotCacheMap(bestInSlotInscriptionCache),
        historical: serializeBestInSlotCacheMap(bestInSlotCollectionHistoryCache)
    }, null, 2);
    const tempPath = `${config.bestInSlotCacheFile}.tmp`;

    bestInSlotCachePersistPromise = bestInSlotCachePersistPromise
        .catch(() => undefined)
        .then(async () => {
            await writeFile(tempPath, payload, 'utf8');
            await rename(tempPath, config.bestInSlotCacheFile);
        })
        .catch((error) => {
            console.warn(`Failed to persist BiS sales cache: ${error.message}`);
        });

    return bestInSlotCachePersistPromise;
}

async function getChallenge(nonce) {
    const entry = challengeStore.get(String(nonce || '').trim());
    if (!entry) return null;
    if (entry.expiresAt <= Date.now()) {
        challengeStore.delete(nonce);
        return null;
    }

    return entry.value;
}

async function setChallenge(nonce, value) {
    challengeStore.set(String(nonce || '').trim(), {
        value,
        expiresAt: Date.now() + 300_000
    });
}

async function deleteChallenge(nonce) {
    challengeStore.delete(String(nonce || '').trim());
}

async function resolveInscription(inscriptionId) {
    const normalizedId = String(inscriptionId || '').trim();
    const sources = [
        {
            label: 'ord',
            baseUrl: config.ordBaseUrl
        },
        {
            label: 'ordinals.com',
            baseUrl: 'https://ordinals.com'
        }
    ];
    let lastFailure = '';

    for (const source of sources) {
        const targetUrl = `${String(source.baseUrl || '').replace(/\/+$/, '')}/inscription/${encodeURIComponent(normalizedId)}`;
        let response;

        try {
            response = await fetch(targetUrl, {
                headers: {
                    Accept: 'application/json, text/html;q=0.9',
                    'User-Agent': 'blok-boutique/1.0'
                },
                signal: createTimeoutSignal(config.remoteFetchTimeoutMs)
            });
        } catch (error) {
            lastFailure = formatFetchFailureMessage(source.label, error, config.remoteFetchTimeoutMs);
            continue;
        }

        if (response.status === 404) {
            throw createHttpError(409, `Inscription ${normalizedId} was not found in ${source.label}.`);
        }

        if (!response.ok) {
            lastFailure = `${source.label} lookup failed for inscription ${normalizedId} (${response.status}).`;
            continue;
        }

        const body = await response.text();
        const parsed = parseOrdInscriptionBody(body);
        const pageParsed = (!parsed.txid || !Number.isInteger(parsed.index) || parsed.index < 0)
            ? parseOrdInscriptionPage(body)
            : null;
        const resolved = pageParsed?.txid && Number.isInteger(pageParsed.index) && pageParsed.index >= 0
            ? pageParsed
            : parsed;
        if (!resolved.txid || !Number.isInteger(resolved.index) || resolved.index < 0) {
            lastFailure = `${source.label} response for inscription ${normalizedId} did not include a usable outpoint.`;
            continue;
        }

        return {
            txid: resolved.txid,
            index: resolved.index,
            value: resolved.value
        };
    }

    throw createInfrastructureError(
        'ORD_LOOKUP_FAILED',
        lastFailure || `Failed to resolve inscription ${normalizedId} from ord or ordinals.com.`
    );
}

async function fetchTransactionOutput(txid, index) {
    const normalizedTxid = String(txid || '').trim();
    const normalizedIndex = Number(index);
    const output = await callBitcoind('gettxout', [normalizedTxid, normalizedIndex, true]);
    if (!output) {
        throw createHttpError(409, `Transaction ${normalizedTxid}:${normalizedIndex} is no longer unspent.`);
    }

    return {
        txid: normalizedTxid,
        index: normalizedIndex,
        value: normalizeBitcoinAmount(output.value),
        script: Buffer.from(String(output?.scriptPubKey?.hex || '').trim(), 'hex')
    };
}

async function fetchTransactionHex(txid) {
    const hex = await callBitcoind('getrawtransaction', [String(txid || '').trim(), false]);
    const normalizedHex = String(hex || '').trim();
    if (!normalizedHex) {
        throw createInfrastructureError('BITCOIND_RPC_FAILED', `bitcoind returned empty transaction data for ${txid}.`);
    }

    return normalizedHex;
}

async function broadcastTransaction(rawHex) {
    const normalizedHex = String(rawHex || '').trim();
    if (!normalizedHex) {
        throw createHttpError(400, 'A raw transaction hex string is required.');
    }

    return String(await callBitcoind('sendrawtransaction', [normalizedHex]) || '').trim();
}

async function checkOutputSpent(txid, index) {
    const result = await callBitcoind('gettxout', [String(txid || '').trim(), Number(index), true]);
    return !result;
}

async function fetchAddressUtxos(address) {
    const normalizedAddress = String(address || '').trim();
    if (!normalizedAddress) return [];
    if (!isValidBitcoinAddress(normalizedAddress)) {
        throw createHttpError(400, 'A valid mainnet Bitcoin address is required.');
    }

    const now = Date.now();
    const cached = addressUtxoCache.get(normalizedAddress);
    if (cached && cached.expiresAt > now) {
        if (cached.pending) {
            const value = await cached.pending;
            return value.map(cloneAddressUtxo);
        }

        return cached.value.map(cloneAddressUtxo);
    }

    const scanPromise = config.esploraFallbackUrl
        ? fetchAddressUtxosFromFastestSource(normalizedAddress)
        : fetchAddressUtxosFromBitcoind(normalizedAddress);

    addressUtxoCache.set(normalizedAddress, {
        expiresAt: now + 10_000,
        value: [],
        pending: scanPromise
    });

    try {
        const value = await scanPromise;
        addressUtxoCache.set(normalizedAddress, {
            expiresAt: Date.now() + 10_000,
            value
        });
        return value.map(cloneAddressUtxo);
    } catch (error) {
        addressUtxoCache.delete(normalizedAddress);
        throw error;
    }
}

async function fetchAddressUtxosFromFastestSource(address) {
    const attempts = [
        {
            label: 'bitcoind',
            promise: fetchAddressUtxosFromBitcoind(address)
        },
        {
            label: 'Esplora',
            promise: fetchAddressUtxosFromEsplora(address)
        }
    ];

    return new Promise((resolve, reject) => {
        const failures = [];
        let pending = attempts.length;
        let settled = false;

        for (const attempt of attempts) {
            Promise.resolve(attempt.promise)
                .then((value) => {
                    if (settled) {
                        return;
                    }

                    settled = true;
                    resolve(value);
                })
                .catch((error) => {
                    failures.push(`${attempt.label}: ${error?.message || String(error || 'Unknown error')}`);
                    pending -= 1;

                    if (settled || pending > 0) {
                        return;
                    }

                    reject(
                        createInfrastructureError(
                            'BTC_UTXO_LOOKUP_FAILED',
                            `Address UTXO lookup failed for ${address}. ${failures.join(' | ')}`
                        )
                    );
                });
        }
    });
}

async function fetchAddressUtxosFromBitcoind(address) {
    const response = await callBitcoind('scantxoutset', ['start', [`addr(${address})`]], {
        timeoutMs: config.bitcoindScanTimeoutMs
    });
    if (response?.success === false) {
        throw createInfrastructureError('BITCOIND_RPC_FAILED', `bitcoind RPC scantxoutset did not complete successfully for ${address}.`);
    }
    const unspents = Array.isArray(response?.unspents) ? response.unspents : [];
    return normalizeAddressUtxoEntries(
        unspents.map((entry) => ({
            txid: String(entry?.txid || '').trim(),
            vout: Number(entry?.vout),
            value: normalizeBitcoinAmount(entry?.amount),
            status: {
                confirmed: true
            }
        }))
    );
}

async function fetchAddressUtxosFromEsplora(address, previousError = null) {
    const targetUrl = `${config.esploraFallbackUrl}/address/${encodeURIComponent(address)}/utxo`;

    let response;
    try {
        response = await fetch(targetUrl, {
            headers: {
                Accept: 'application/json',
                'User-Agent': 'blok-boutique/1.0'
            },
            signal: createTimeoutSignal(config.remoteFetchTimeoutMs)
        });
    } catch (error) {
        const prior = previousError?.message ? ` ${previousError.message}` : '';
        throw createInfrastructureError(
            'BTC_UTXO_LOOKUP_FAILED',
            `Address UTXO lookup failed via bitcoind and fallback Esplora: ${formatFetchFailureMessage('Esplora', error, config.remoteFetchTimeoutMs)}.${prior}`.trim()
        );
    }

    let payload;
    try {
        payload = await response.json();
    } catch {
        const prior = previousError?.message ? ` Previous bitcoind error: ${previousError.message}` : '';
        throw createInfrastructureError(
            'BTC_UTXO_LOOKUP_FAILED',
            `Esplora fallback returned invalid JSON for ${address}.${prior}`.trim()
        );
    }

    if (!response.ok) {
        const prior = previousError?.message ? ` Previous bitcoind error: ${previousError.message}` : '';
        throw createInfrastructureError(
            'BTC_UTXO_LOOKUP_FAILED',
            `Esplora fallback failed for ${address}: ${response.status} ${response.statusText}.${prior}`.trim()
        );
    }

    return normalizeAddressUtxoEntries(Array.isArray(payload) ? payload : []);
}

function normalizeAddressUtxoEntries(entries) {
    return (Array.isArray(entries) ? entries : [])
        .map((entry) => ({
            txid: String(entry?.txid || '').trim(),
            vout: Number(entry?.vout),
            value: normalizeNumber(entry?.value),
            status: {
                confirmed: Boolean(entry?.status?.confirmed ?? true)
            }
        }))
        .filter((entry) => entry.txid && Number.isInteger(entry.vout) && entry.vout >= 0 && entry.value > 0);
}

async function fetchRecommendedFees() {
    const now = Date.now();
    if (recommendedFeesCache && recommendedFeesCache.expiresAt > now) {
        return { ...recommendedFeesCache.value };
    }

    const [fastestFee, halfHourFee, hourFee, economyFee, minimumFee] = await Promise.all([
        estimateFeeRate(1),
        estimateFeeRate(3),
        estimateFeeRate(6),
        estimateFeeRate(12),
        estimateFeeRate(24)
    ]);

    const normalized = {
        fastestFee: clampFeeRate(fastestFee, 8),
        halfHourFee: clampFeeRate(halfHourFee, 4),
        hourFee: clampFeeRate(hourFee, 2),
        economyFee: clampFeeRate(economyFee, 1),
        minimumFee: clampFeeRate(minimumFee, 1)
    };

    recommendedFeesCache = {
        expiresAt: now + 60_000,
        value: normalized
    };

    return { ...normalized };
}

function getBoutiqueAsset(inscriptionId) {
    return findCatalogAssetById(boutiqueCatalog, inscriptionId);
}

function listBoutiqueCollections() {
    return boutiqueCatalog.collections.slice();
}

function listBoutiqueAssets(collectionId = '') {
    const normalizedId = String(collectionId || '').trim().toLowerCase();
    if (!normalizedId) {
        return boutiqueCatalog.assets.slice();
    }

    return (boutiqueCatalog.assetsByCollection.get(normalizedId) || []).slice();
}

async function fetchBestInSlotRecordSales(collectionId) {
    const normalizedCollectionId = String(collectionId || '').trim().toLowerCase();
    if (!normalizedCollectionId || !config.bestInSlotActivityApiBaseUrl) {
        return [];
    }

    const now = Date.now();
    const collection = boutiqueCatalog.collections.find((entry) => entry.id === normalizedCollectionId);
    if (!collection?.bestInSlotSlug) {
        return [];
    }

    const historicalCollectionCached = bestInSlotCollectionHistoryCache.get(normalizedCollectionId);
    const shouldRefreshHistoricalCache = shouldForceBestInSlotHistoricalRefresh(collection, historicalCollectionCached?.value);
    if (
        historicalCollectionCached
        && historicalCollectionCached.expiresAt > now
        && Array.isArray(historicalCollectionCached.value)
        && historicalCollectionCached.value.length > 0
        && !shouldRefreshHistoricalCache
    ) {
        const derived = applyKnownBestInSlotRecordOverrides(
            normalizedCollectionId,
            historicalCollectionCached.value
                .slice()
                .sort(compareBestInSlotRecordSales)
                .slice(0, 3)
        );
        bestInSlotCache.set(normalizedCollectionId, {
            expiresAt: historicalCollectionCached.expiresAt,
            value: derived
        });
        return derived.map(cloneJsonValue);
    }

    const historicalCached = bestInSlotCache.get(normalizedCollectionId);
    const quickCached = bestInSlotQuickRecordCache.get(normalizedCollectionId);
    if (
        historicalCached
        && historicalCached.expiresAt > now
        && Array.isArray(historicalCached.value)
        && historicalCached.value.length > 0
        && !shouldRefreshHistoricalCache
    ) {
        void fetchBestInSlotCollectionSalesHistory(normalizedCollectionId).catch(() => undefined);
        return historicalCached.value.map(cloneJsonValue);
    }

    if (quickCached && quickCached.expiresAt > now && Array.isArray(quickCached.value) && quickCached.value.length > 0) {
        void fetchBestInSlotCollectionSalesHistory(normalizedCollectionId).catch(() => undefined);
        ensureBestInSlotRecordSalesRefresh(normalizedCollectionId, collection);
        return quickCached.value.map(cloneJsonValue);
    }

    const seededHistorical = await fetchBestInSlotCollectionSalesHistory(normalizedCollectionId).catch(() => []);
    if (Array.isArray(seededHistorical) && seededHistorical.length > 0) {
        const derived = applyKnownBestInSlotRecordOverrides(
            normalizedCollectionId,
            seededHistorical
                .slice()
                .sort(compareBestInSlotRecordSales)
                .slice(0, 3)
        );
        bestInSlotCache.set(normalizedCollectionId, {
            expiresAt: Date.now() + BESTINSLOT_RECORD_CACHE_TTL_MS,
            value: derived
        });
        void persistBestInSlotSalesCache();
        return derived.map(cloneJsonValue);
    }

    let quickRecords = [];
    try {
        const saleCount = await fetchBestInSlotSaleCount(collection.bestInSlotSlug).catch(() => 0);
        quickRecords = await fetchBestInSlotActivityRecordSales(collection.bestInSlotSlug, saleCount).catch(() => []);
    } catch {
        quickRecords = [];
    }

    quickRecords = applyKnownBestInSlotRecordOverrides(normalizedCollectionId, quickRecords);
    bestInSlotQuickRecordCache.set(normalizedCollectionId, {
        expiresAt: now + BESTINSLOT_QUICK_RECORD_CACHE_TTL_MS,
        value: quickRecords
    });
    ensureBestInSlotRecordSalesRefresh(normalizedCollectionId, collection);
    return quickRecords.map(cloneJsonValue);
}

async function fetchBestInSlotRecentSales(collectionId) {
    const normalizedCollectionId = String(collectionId || '').trim().toLowerCase();
    if (!normalizedCollectionId || !config.bestInSlotActivityApiBaseUrl) {
        return [];
    }

    const cached = bestInSlotRecentCache.get(normalizedCollectionId);
    if (cached && cached.expiresAt > Date.now()) {
        return cached.value.map(cloneJsonValue);
    }

    const collection = boutiqueCatalog.collections.find((entry) => entry.id === normalizedCollectionId);
    if (!collection?.bestInSlotSlug) {
        return [];
    }

    let records = [];

    try {
        const payload = await fetchBestInSlotJsonFrom(
            `/collection/activity?slug=${encodeURIComponent(collection.bestInSlotSlug)}&limit=18&page=1`,
            {
                baseUrl: config.bestInSlotActivityApiBaseUrl,
                includeApiKey: Boolean(config.bestInSlotApiKey),
                attempts: 2
            }
        );
        records = extractBestInSlotEntries(payload)
            .map((entry) => normalizeBestInSlotRecord(entry))
            .filter(Boolean)
            .sort((left, right) => compareServerIsoDatesDescending(left?.occurredAt, right?.occurredAt));
        records = enrichBestInSlotSaleNames(records).slice(0, 12);
    } catch {
        records = Array.isArray(cached?.value) ? cached.value.map(cloneJsonValue) : [];
    }

    if ((!Array.isArray(records) || records.length === 0) && Array.isArray(cached?.value) && cached.value.length > 0) {
        return cached.value.map(cloneJsonValue);
    }

    bestInSlotRecentCache.set(normalizedCollectionId, {
        expiresAt: Date.now() + 5 * 60 * 1000,
        value: records
    });
    void persistBestInSlotSalesCache();

    return records.map(cloneJsonValue);
}

async function fetchBestInSlotInscriptionSales(inscriptionId) {
    const normalizedInscriptionId = String(inscriptionId || '').trim().toLowerCase();
    if (!normalizedInscriptionId || !config.bestInSlotActivityApiBaseUrl) {
        return [];
    }

    const cached = bestInSlotInscriptionCache.get(normalizedInscriptionId);
    if (cached && cached.expiresAt > Date.now()) {
        return cached.value.map(cloneJsonValue);
    }

    const asset = findCatalogAssetById(boutiqueCatalog, normalizedInscriptionId);
    if (!asset) {
        return [];
    }

    const collection = boutiqueCatalog.collections.find((entry) => entry.id === String(asset.collectionId || '').trim().toLowerCase());
    const inscriptionAttempts = LARGE_BESTINSLOT_ACTIVITY_SLUGS.has(String(collection?.bestInSlotSlug || '').trim().toLowerCase())
        ? 5
        : 3;

    const payload = await fetchBestInSlotInscriptionHistory(normalizedInscriptionId, inscriptionAttempts).catch(() => null);
    if (!payload) {
        if (!collection?.bestInSlotSlug) {
            return [];
        }

        await getOrStartBestInSlotRecordSalesRefresh(collection.id, collection).catch(() => undefined);
        const warmed = bestInSlotInscriptionCache.get(normalizedInscriptionId);
        return warmed && warmed.expiresAt > Date.now()
            ? warmed.value.map(cloneJsonValue)
            : [];
    }

    const cutoff = Date.now() - (config.bestInSlotLookbackYears * 365 * 24 * 60 * 60 * 1000);
    const entries = [];
    appendBestInSlotTransfersForAsset(asset, payload, cutoff, entries);
    const normalizedEntries = enrichBestInSlotSaleNames(dedupeBestInSlotRecords(entries))
        .sort((left, right) => compareServerIsoDatesDescending(left?.occurredAt, right?.occurredAt))
        .map(cloneJsonValue);

    if (normalizedEntries.length > 0) {
        bestInSlotInscriptionCache.set(normalizedInscriptionId, {
            expiresAt: Date.now() + BESTINSLOT_RECORD_CACHE_TTL_MS,
            value: normalizedEntries
        });
        void persistBestInSlotSalesCache();
        return normalizedEntries.map(cloneJsonValue);
    }

    if (collection?.bestInSlotSlug) {
        await getOrStartBestInSlotRecordSalesRefresh(collection.id, collection).catch(() => undefined);
        const warmed = bestInSlotInscriptionCache.get(normalizedInscriptionId);
        if (warmed && warmed.expiresAt > Date.now()) {
            return warmed.value.map(cloneJsonValue);
        }
    }

    return [];
}

async function fetchBestInSlotCollectionSalesHistory(collectionId) {
    const normalizedCollectionId = String(collectionId || '').trim().toLowerCase();
    if (!normalizedCollectionId || !config.bestInSlotActivityApiBaseUrl) {
        return [];
    }

    const collection = boutiqueCatalog.collections.find((entry) => entry.id === normalizedCollectionId);
    if (!collection?.bestInSlotSlug) {
        return [];
    }

    const now = Date.now();
    const cached = bestInSlotCollectionHistoryCache.get(normalizedCollectionId);
    const shouldRefreshHistoricalCache = shouldForceBestInSlotHistoricalRefresh(collection, cached?.value);
    if (cached && cached.expiresAt > now && !shouldRefreshHistoricalCache) {
        return mergeBestInSlotCollectionHistoryWithRecentSales(
            normalizedCollectionId,
            applyKnownBestInSlotHistoryOverrides(normalizedCollectionId, cached.value),
            cached.expiresAt
        );
    }

    if (cached && Array.isArray(cached.value) && cached.value.length > 0 && !shouldRefreshHistoricalCache) {
        ensureBestInSlotRecordSalesRefresh(normalizedCollectionId, collection);
        return mergeBestInSlotCollectionHistoryWithRecentSales(
            normalizedCollectionId,
            applyKnownBestInSlotHistoryOverrides(normalizedCollectionId, cached.value),
            cached.expiresAt
        );
    }

    let activityHistory = [];
    try {
        const saleCount = await fetchBestInSlotSaleCount(collection.bestInSlotSlug).catch(() => 0);
        activityHistory = await fetchBestInSlotActivitySalesHistory(collection.bestInSlotSlug, saleCount).catch(() => []);
    } catch {
        activityHistory = [];
    }

    if (Array.isArray(activityHistory) && activityHistory.length > 0) {
        const collectionAssets = Array.isArray(boutiqueCatalog.assetsByCollection.get(normalizedCollectionId))
            ? boutiqueCatalog.assetsByCollection.get(normalizedCollectionId)
            : [];
        const existingHistoricalRecords = Array.isArray(cached?.value) ? cached.value : [];
        const merged = applyKnownBestInSlotHistoryOverrides(
            normalizedCollectionId,
            enrichBestInSlotSaleNames(dedupeBestInSlotRecords([
                ...existingHistoricalRecords,
                ...activityHistory
            ]))
        );
        const expiresAt = Date.now() + BESTINSLOT_RECORD_CACHE_TTL_MS;

        bestInSlotCollectionHistoryCache.set(normalizedCollectionId, {
            expiresAt,
            value: cloneJsonValue(merged)
        });
        warmBestInSlotInscriptionHistoryCache(collectionAssets, merged, expiresAt);
        bestInSlotCache.set(normalizedCollectionId, {
            expiresAt,
            value: applyKnownBestInSlotRecordOverrides(
                normalizedCollectionId,
                merged
                    .slice()
                    .sort(compareBestInSlotRecordSales)
                    .slice(0, 3)
            )
        });
        void persistBestInSlotSalesCache();
        ensureBestInSlotRecordSalesRefresh(normalizedCollectionId, collection);
        return mergeBestInSlotCollectionHistoryWithRecentSales(normalizedCollectionId, merged, expiresAt);
    }

    await getOrStartBestInSlotRecordSalesRefresh(normalizedCollectionId, collection).catch(() => undefined);
    const warmed = bestInSlotCollectionHistoryCache.get(normalizedCollectionId);
    return mergeBestInSlotCollectionHistoryWithRecentSales(
        normalizedCollectionId,
        warmed && Array.isArray(warmed.value)
            ? applyKnownBestInSlotHistoryOverrides(normalizedCollectionId, warmed.value)
            : [],
        warmed?.expiresAt
    );
}

async function mergeBestInSlotCollectionHistoryWithRecentSales(collectionId, records, expiresAt = 0) {
    const normalizedCollectionId = String(collectionId || '').trim().toLowerCase();
    const historicalRecords = Array.isArray(records) ? records : [];
    if (!normalizedCollectionId) {
        return historicalRecords.map(cloneJsonValue);
    }

    let recentRecords = [];
    try {
        recentRecords = await fetchBestInSlotRecentSales(normalizedCollectionId);
    } catch {
        recentRecords = [];
    }

    const merged = applyKnownBestInSlotHistoryOverrides(
        normalizedCollectionId,
        enrichBestInSlotSaleNames(dedupeBestInSlotRecords([
            ...historicalRecords,
            ...(Array.isArray(recentRecords) ? recentRecords : [])
        ]))
    ).sort((left, right) => compareServerIsoDatesDescending(left?.occurredAt, right?.occurredAt));

    if (merged.length > historicalRecords.length) {
        bestInSlotCollectionHistoryCache.set(normalizedCollectionId, {
            expiresAt: Math.max(normalizePositiveIntegerValue(expiresAt, 0), Date.now() + BESTINSLOT_RECORD_CACHE_TTL_MS),
            value: cloneJsonValue(merged)
        });
        void persistBestInSlotSalesCache();
    }

    return merged.map(cloneJsonValue);
}

function ensureBestInSlotRecordSalesRefresh(collectionId, collection) {
    void getOrStartBestInSlotRecordSalesRefresh(collectionId, collection);
}

async function warmBestInSlotHistoricalIndexes() {
    const collections = Array.isArray(boutiqueCatalog.collections)
        ? boutiqueCatalog.collections.slice()
        : [];

    for (const collection of collections) {
        const collectionId = String(collection?.id || '').trim().toLowerCase();
        if (!collectionId || !collection?.bestInSlotSlug) {
            continue;
        }

        if (isCollectionInscriptionHistoryFullyIndexed(collectionId)) {
            continue;
        }

        try {
            await getOrStartBestInSlotRecordSalesRefresh(collectionId, collection);
        } catch {
            // Keep warmup best-effort so a single collection failure does not stop the rest.
        }
    }
}

function getOrStartBestInSlotRecordSalesRefresh(collectionId, collection) {
    const normalizedCollectionId = String(collectionId || '').trim().toLowerCase();
    if (!normalizedCollectionId || !collection?.bestInSlotSlug) {
        return Promise.resolve([]);
    }

    const existing = bestInSlotRecordRefreshStore.get(normalizedCollectionId);
    if (existing) {
        return existing;
    }

    const pending = refreshBestInSlotRecordSales(normalizedCollectionId, collection)
        .catch(() => undefined)
        .finally(() => {
            bestInSlotRecordRefreshStore.delete(normalizedCollectionId);
        });

    bestInSlotRecordRefreshStore.set(normalizedCollectionId, pending);
    return pending;
}

async function refreshBestInSlotRecordSales(collectionId, collection) {
    let records = [];

    try {
        records = await fetchBestInSlotHistoricalRecordSales(collectionId, collection.bestInSlotSlug);
    } catch {
        return;
    }

    records = applyKnownBestInSlotRecordOverrides(collectionId, records);

    bestInSlotCache.set(collectionId, {
        expiresAt: Date.now() + BESTINSLOT_RECORD_CACHE_TTL_MS,
        value: records
    });
    await persistBestInSlotSalesCache();
}

async function estimateFeeRate(targetBlocks) {
    try {
        const result = await callBitcoind('estimatesmartfee', [Number(targetBlocks)]);
        const feeRateBtcPerKvB = Number(result?.feerate);
        if (!Number.isFinite(feeRateBtcPerKvB) || feeRateBtcPerKvB <= 0) {
            return 0;
        }

        return Math.round((feeRateBtcPerKvB * 100_000_000) / 1000);
    } catch {
        return 0;
    }
}

function clampFeeRate(value, fallback) {
    const normalized = normalizeNumber(value);
    return normalized > 0 ? normalized : fallback;
}

async function callBitcoind(method, params = [], options = {}) {
    const headers = {
        'Content-Type': 'application/json'
    };

    if (bitcoindAuthHeader) {
        headers.Authorization = bitcoindAuthHeader;
    }

    let response;
    const timeoutMs = normalizePositiveIntegerValue(options?.timeoutMs, config.bitcoindRpcTimeoutMs);

    try {
        response = await fetch(config.bitcoindRpcUrl, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                jsonrpc: '1.0',
                id: 'blok-boutique',
                method,
                params
            }),
            signal: createTimeoutSignal(timeoutMs)
        });
    } catch (error) {
        throw createInfrastructureError('BITCOIND_RPC_FAILED', formatFetchFailureMessage(`bitcoind RPC ${method}`, error, timeoutMs));
    }

    let payload;

    try {
        payload = await response.json();
    } catch {
        throw createInfrastructureError('BITCOIND_RPC_FAILED', 'bitcoind RPC returned invalid JSON.');
    }

    if (!response.ok || payload?.error) {
        const reason = payload?.error?.message || `${response.status} ${response.statusText}`;
        throw createInfrastructureError('BITCOIND_RPC_FAILED', `bitcoind RPC ${method} failed: ${reason}`);
    }

    return payload.result;
}

function createTimeoutSignal(timeoutMs) {
    const normalizedTimeoutMs = normalizePositiveIntegerValue(timeoutMs, 0);
    if (!normalizedTimeoutMs || typeof AbortSignal === 'undefined' || typeof AbortSignal.timeout !== 'function') {
        return undefined;
    }

    return AbortSignal.timeout(normalizedTimeoutMs);
}

function formatFetchFailureMessage(target, error, timeoutMs) {
    const normalizedTarget = String(target || 'request').trim();
    if (isAbortLikeError(error)) {
        return `${normalizedTarget} timed out after ${normalizePositiveIntegerValue(timeoutMs, 0)}ms.`;
    }

    return `Failed to reach ${normalizedTarget}: ${error?.message || 'request failed.'}`;
}

function isAbortLikeError(error) {
    const name = String(error?.name || '').trim();
    const code = String(error?.code || '').trim();
    return name === 'AbortError' || name === 'TimeoutError' || code === 'ABORT_ERR';
}

async function resolveBitcoindAuthHeader(currentConfig) {
    if (currentConfig.bitcoindCookiePath) {
        const cookie = (await readFile(currentConfig.bitcoindCookiePath, 'utf8')).trim();
        if (!cookie) {
            throw new Error('BITCOIND_COOKIE_PATH did not contain a usable RPC cookie.');
        }

        return `Basic ${Buffer.from(cookie).toString('base64')}`;
    }

    if (currentConfig.bitcoindRpcUser || currentConfig.bitcoindRpcPassword) {
        return `Basic ${Buffer.from(`${currentConfig.bitcoindRpcUser}:${currentConfig.bitcoindRpcPassword}`).toString('base64')}`;
    }

    return '';
}

async function loadEnvFile(filePath) {
    let content = '';

    try {
        content = await readFile(filePath, 'utf8');
    } catch (error) {
        if (error && error.code === 'ENOENT') {
            return;
        }

        throw error;
    }

    for (const rawLine of String(content || '').split(/\r?\n/)) {
        const line = rawLine.trim();
        if (!line || line.startsWith('#')) continue;

        const separatorIndex = line.indexOf('=');
        if (separatorIndex <= 0) continue;

        const key = line.slice(0, separatorIndex).trim();
        if (!key || Object.prototype.hasOwnProperty.call(process.env, key)) continue;

        let value = line.slice(separatorIndex + 1).trim();
        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith('\'') && value.endsWith('\''))) {
            value = value.slice(1, -1);
        }

        process.env[key] = value;
    }
}

function parseOrdInscriptionBody(body) {
    const text = String(body || '').trim();
    let payload = null;

    try {
        payload = JSON.parse(text);
    } catch {
        payload = null;
    }

    if (payload && typeof payload === 'object') {
        const satpoint = String(payload.satpoint || payload.sat_point || payload.location || '').trim();
        const output = String(payload.output || '').trim();
        const point = parseLocationString(satpoint) || parseOutpointString(output);
        if (point) {
            return {
                ...point,
                value: normalizeNumber(payload.value || payload.output_value || payload.amount)
            };
        }
    }

    const point = parseLocationString(text) || parseOutpointString(text);
    return {
        ...(point || { txid: '', index: -1 }),
        value: 0
    };
}

function parseOrdInscriptionPage(html) {
    const location = extractOrdDefinitionValue(html, 'location');
    const satpoint = extractOrdDefinitionValue(html, 'satpoint');
    const output = extractOrdDefinitionValue(html, 'output');
    const point = parseLocationString(location) || parseLocationString(satpoint) || parseOutpointString(output);
    return {
        ...(point || { txid: '', index: -1 }),
        value: 0
    };
}

function extractOrdDefinitionValue(html, label) {
    const pattern = new RegExp(`<dt[^>]*>\\s*${escapeRegExp(label)}\\s*<\\/dt>\\s*<dd[^>]*>([\\s\\S]*?)<\\/dd>`, 'i');
    const match = String(html || '').match(pattern);
    if (!match) {
        return '';
    }

    return collapseServerWhitespace(stripServerTags(decodeServerHtmlEntities(match[1])));
}

function stripServerTags(value) {
    return String(value || '').replace(/<[^>]+>/g, ' ');
}

function collapseServerWhitespace(value) {
    return String(value || '').replace(/\s+/g, ' ').trim();
}

function decodeServerHtmlEntities(value) {
    return String(value || '')
        .replace(/&amp;/gi, '&')
        .replace(/&lt;/gi, '<')
        .replace(/&gt;/gi, '>')
        .replace(/&quot;/gi, '"')
        .replace(/&#39;/gi, '\'')
        .replace(/&#x27;/gi, '\'')
        .replace(/&nbsp;/gi, ' ');
}

function escapeRegExp(value) {
    return String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function parseLocationString(value) {
    const match = String(value || '').match(/([0-9a-f]{64}):(\d+):(\d+)/i);
    if (!match) return null;

    return {
        txid: match[1].toLowerCase(),
        index: Number(match[2]),
        offset: Number(match[3])
    };
}

function parseOutpointString(value) {
    const match = String(value || '').match(/([0-9a-f]{64}):(\d+)/i);
    if (!match) return null;

    return {
        txid: match[1].toLowerCase(),
        index: Number(match[2]),
        offset: 0
    };
}

async function toWebRequest(req, requestUrl) {
    const method = String(req.method || 'GET').toUpperCase();
    const headers = new Headers();

    for (const [key, value] of Object.entries(req.headers)) {
        if (Array.isArray(value)) {
            for (const entry of value) headers.append(key, entry);
        } else if (value !== undefined) {
            headers.set(key, value);
        }
    }

    const remoteAddress = normalizeClientIp(req.socket?.remoteAddress || '');
    if (remoteAddress) {
        headers.set(INTERNAL_REMOTE_ADDR_HEADER, remoteAddress);
    }

    if (method === 'GET' || method === 'HEAD') {
        return new Request(requestUrl, { method, headers });
    }

    const body = await readNodeRequestBody(req, config.maxRequestBodyBytes);
    return new Request(requestUrl, { method, headers, body });
}

async function readNodeRequestBody(req, maxBytes) {
    const chunks = [];
    let totalBytes = 0;
    for await (const chunk of req) {
        const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
        totalBytes += buffer.length;
        if (Number.isFinite(maxBytes) && maxBytes > 0 && totalBytes > maxBytes) {
            throw createHttpError(413, `Request body exceeds the ${maxBytes}-byte limit.`);
        }

        chunks.push(buffer);
    }

    return Buffer.concat(chunks);
}

async function sendWebResponse(res, response, method) {
    res.statusCode = response.status;
    response.headers.forEach((value, key) => {
        res.setHeader(key, value);
    });
    if (!res.hasHeader('Referrer-Policy')) {
        res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    }
    if (!res.hasHeader('Cross-Origin-Opener-Policy')) {
        res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    }
    if (!res.hasHeader('Cross-Origin-Resource-Policy')) {
        res.setHeader('Cross-Origin-Resource-Policy', 'same-site');
    }
    if (!res.hasHeader('X-Frame-Options')) {
        res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    }
    if (!res.hasHeader('Permissions-Policy')) {
        res.setHeader('Permissions-Policy', 'accelerometer=(), autoplay=(), camera=(), geolocation=(), gyroscope=(), microphone=(), payment=(), usb=()');
    }

    if (String(method || 'GET').toUpperCase() === 'HEAD') {
        res.end();
        return;
    }

    const body = Buffer.from(await response.arrayBuffer());
    res.end(body);
}

async function serveStatic(requestUrl, method) {
    const normalizedMethod = String(method || 'GET').toUpperCase();
    if (!['GET', 'HEAD'].includes(normalizedMethod)) {
        return new Response('Method not allowed.', {
            status: 405,
            headers: {
                'Content-Type': 'text/plain; charset=utf-8',
                'Cache-Control': 'no-store'
            }
        });
    }

    if (requestUrl.pathname === config.basePath) {
        return Response.redirect(new URL(`${config.basePath}/`, requestUrl), 301);
    }

    if (requestUrl.pathname.startsWith(`${config.basePath}/content/`)) {
        const inscriptionId = requestUrl.pathname.slice(`${config.basePath}/content/`.length);
        return serveOrdContent(inscriptionId, normalizedMethod);
    }

    let pathname = decodeURIComponent(requestUrl.pathname);
    if (isLegacyRootIconPath(pathname)) {
        return redirectToSharedIcon(requestUrl);
    }

    const redirectPath = resolveCleanHtmlRedirectPath(pathname);
    if (redirectPath && redirectPath !== pathname) {
        const redirectUrl = new URL(requestUrl.href);
        redirectUrl.pathname = redirectPath;
        return Response.redirect(redirectUrl, 301);
    }

    if (pathname === '' || pathname === '/') {
        pathname = '/index.html';
    } else if (pathname.endsWith('/')) {
        pathname += 'index.html';
    }

    const candidatePathnames = [pathname];
    if (!pathname.endsWith('/') && !path.extname(pathname)) {
        candidatePathnames.push(`${pathname}/index.html`);
        candidatePathnames.push(`${pathname}.html`);
    }

    for (const candidatePathname of candidatePathnames) {
        if (!isAllowedStaticPath(candidatePathname)) {
            continue;
        }

        const filePath = path.resolve(projectRoot, `.${candidatePathname}`);
        if (!filePath.startsWith(projectRoot)) {
            continue;
        }

        let fileStat;

        try {
            fileStat = await stat(filePath);
        } catch {
            continue;
        }

        if (!fileStat.isFile()) {
            continue;
        }

        const content = await readFile(filePath);
        return new Response(normalizedMethod === 'HEAD' ? null : content, {
            status: 200,
            headers: {
                'Content-Type': contentTypeFor(filePath),
                'Cache-Control': cacheControlFor(filePath),
                'X-Content-Type-Options': 'nosniff'
            }
        });
    }

    return notFoundResponse();
}

async function serveOrdContent(inscriptionId, method) {
    const normalizedId = normalizeInscriptionId(inscriptionId);
    if (!normalizedId) {
        return notFoundResponse();
    }

    let response;
    try {
        response = await fetch(`${config.ordBaseUrl}/content/${encodeURIComponent(normalizedId)}`, {
            headers: {
                Accept: 'text/html,application/xhtml+xml,application/octet-stream;q=0.9,*/*;q=0.8',
                'User-Agent': 'blok-boutique/1.0'
            },
            signal: createTimeoutSignal(config.remoteFetchTimeoutMs)
        });
    } catch (error) {
        const details = formatFetchFailureMessage('ord', error, config.remoteFetchTimeoutMs);
        return new Response(`Failed to reach ord content for ${normalizedId}: ${details}`, {
            status: 502,
            headers: {
                'Content-Type': 'text/plain; charset=utf-8',
                'Cache-Control': 'no-store'
            }
        });
    }

    if (response.status === 404) {
        return notFoundResponse();
    }

    const headers = new Headers();
    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    headers.set('Content-Type', contentType);
    headers.set('Cache-Control', 'no-cache');
    headers.set('X-Content-Type-Options', 'nosniff');
    headers.set('Access-Control-Allow-Origin', '*');
    headers.set('Cross-Origin-Resource-Policy', 'cross-origin');
    headers.set('Referrer-Policy', 'no-referrer');

    if (isSandboxedOrdContentType(contentType)) {
        headers.set('Content-Security-Policy', buildOrdContentSandboxPolicy());
    }

    return new Response(method === 'HEAD' ? null : response.body, {
        status: response.status,
        headers
    });
}

function isSandboxedOrdContentType(contentType) {
    const normalized = String(contentType || '').trim().toLowerCase();
    return normalized.startsWith('text/html') || normalized.startsWith('application/xhtml+xml');
}

function buildOrdContentSandboxPolicy() {
    return [
        "sandbox allow-scripts",
        "default-src * data: blob:",
        "script-src * 'unsafe-inline' 'unsafe-eval' data: blob:",
        "style-src * 'unsafe-inline' data: blob:",
        "img-src * data: blob:",
        "font-src * data: blob:",
        "media-src * data: blob:",
        "connect-src * data: blob:",
        "frame-src * data: blob:",
        "child-src * data: blob:",
        "worker-src * data: blob:",
        "object-src 'none'",
        "base-uri 'none'",
        "form-action 'none'"
    ].join('; ');
}

function isAllowedStaticPath(pathname) {
    const normalized = String(pathname || '');
    const segments = normalized.split('/').filter(Boolean);
    if (segments.length === 0) return true;
    if (segments.some((segment) => segment.startsWith('.'))) return false;
    if (segments.includes('node_modules') || segments.includes('.data')) return false;

    const basename = path.basename(normalized).toLowerCase();
    if (['package.json', 'package-lock.json', 'deploy.md', 'server.mjs', 'boutique-api.mjs'].includes(basename)) {
        return false;
    }

    if (segments[0] === 'boutique' && segments[1] === 'package' && segments[2] !== 'dist') {
        return false;
    }

    const ext = path.extname(normalized).toLowerCase();
    return new Set(['.html', '.css', '.js', '.mjs', '.json', '.webp', '.gif', '.png', '.jpg', '.jpeg', '.svg', '.ico', '.txt', '.map', '.woff', '.woff2', '.ttf']).has(ext);
}

function normalizeInscriptionId(value) {
    const normalized = String(value || '').trim().toLowerCase();
    return /^[0-9a-f]{64}i\d+$/.test(normalized) ? normalized : '';
}

function resolveCleanHtmlRedirectPath(pathname) {
    const normalized = String(pathname || '').trim();
    if (!normalized.endsWith('.html')) return '';

    if (normalized === '/index.html') {
        return '/';
    }

    if (normalized.endsWith('/index.html')) {
        return normalized.slice(0, -'index.html'.length);
    }

    return normalized.slice(0, -'.html'.length);
}

function contentTypeFor(filePath) {
    switch (path.extname(filePath).toLowerCase()) {
        case '.html': return 'text/html; charset=utf-8';
        case '.css': return 'text/css; charset=utf-8';
        case '.js':
        case '.mjs':
            return 'text/javascript; charset=utf-8';
        case '.json': return 'application/json; charset=utf-8';
        case '.svg': return 'image/svg+xml';
        case '.ico': return 'image/x-icon';
        case '.txt': return 'text/plain; charset=utf-8';
        case '.woff': return 'font/woff';
        case '.woff2': return 'font/woff2';
        case '.ttf': return 'font/ttf';
        case '.png': return 'image/png';
        case '.jpg':
        case '.jpeg': return 'image/jpeg';
        case '.gif': return 'image/gif';
        case '.webp': return 'image/webp';
        default: return 'application/octet-stream';
    }
}

function cacheControlFor(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const basename = path.basename(filePath).toLowerCase();
    if (
        basename === 'collection-stats-data.js'
        || basename === 'favicon.ico'
        || basename === 'favicon.png'
        || basename === 'surveillance.svg'
    ) {
        return 'no-cache';
    }
    return ['.html', '.json'].includes(ext)
        ? 'no-cache'
        : 'public, max-age=31536000, immutable';
}

function isLegacyRootIconPath(pathname) {
    const basename = path.basename(String(pathname || '')).toLowerCase();
    return [
        'apple-touch-icon.png',
        'favicon.ico',
        'favicon.png',
        'favicon-32x32.png',
        'favicon-48x48.png',
        'favicon-180x180.png',
        'favicon-192x192.png',
        'favicon-256x256.png'
    ].includes(basename);
}

function redirectToSharedIcon(requestUrl) {
    const targetUrl = new URL('/Images/Surveillance.svg', requestUrl);
    return new Response(null, {
        status: 302,
        headers: {
            Location: targetUrl.toString(),
            'Cache-Control': 'no-cache'
        }
    });
}

async function fetchBestInSlotJson(pathname) {
    return fetchBestInSlotJsonFrom(pathname, {
        baseUrl: config.bestInSlotApiBaseUrl,
        includeApiKey: true
    });
}

async function fetchBestInSlotJsonFrom(pathname, options = {}) {
    const baseUrl = String(options?.baseUrl || '').trim().replace(/\/+$/, '');
    const includeApiKey = Boolean(options?.includeApiKey);
    const attempts = Math.max(1, normalizePositiveIntegerValue(options?.attempts, 1));
    if (!baseUrl) {
        return null;
    }

    const headers = {
        Accept: 'application/json',
        'User-Agent': 'blok-boutique/1.0'
    };

    if (includeApiKey && config.bestInSlotApiKey) {
        headers['X-API-KEY'] = config.bestInSlotApiKey;
    }

    let lastError = null;

    for (let attempt = 1; attempt <= attempts; attempt += 1) {
        try {
            const response = await fetch(`${baseUrl}${pathname}`, {
                headers,
                signal: createTimeoutSignal(config.bestInSlotTimeoutMs)
            });

            if (!response.ok) {
                const error = new Error(`BestInSlot request failed (${response.status} ${response.statusText}).`);
                error.status = response.status;
                throw error;
            }

            return response.json();
        } catch (error) {
            lastError = error;
            if (attempt >= attempts || !isRetryableBestInSlotError(error)) {
                throw error;
            }

            await delay(BESTINSLOT_RETRY_DELAY_MS * attempt);
        }
    }

    throw lastError || new Error('BestInSlot request failed.');
}

async function fetchBestInSlotSaleCount(slug) {
    if (!config.bestInSlotApiBaseUrl || !config.bestInSlotApiKey) {
        return 0;
    }

    const payload = await fetchBestInSlotJsonFrom(`/v3/collection/sales_info?slug=${encodeURIComponent(String(slug || '').trim())}`, {
        baseUrl: config.bestInSlotApiBaseUrl,
        includeApiKey: true,
        attempts: 2
    });
    const directCount = normalizePositiveIntegerValue(payload?.sale_count, 0);
    if (directCount > 0) {
        return directCount;
    }

    return normalizePositiveIntegerValue(payload?.data?.sale_count || payload?.data?.total_sales, 0);
}

async function fetchBestInSlotActivityRecordSales(slug, saleCount = 0) {
    const history = await fetchBestInSlotActivitySalesHistory(slug, saleCount);
    return history
        .slice()
        .sort(compareBestInSlotRecordSales)
        .slice(0, 3);
}

async function fetchBestInSlotActivitySalesHistory(slug, saleCount = 0) {
    const normalizedSlug = String(slug || '').trim();
    if (!normalizedSlug || !config.bestInSlotActivityApiBaseUrl) {
        return [];
    }

    const pageSize = 200;
    const derivedPageCount = saleCount > 0 ? Math.ceil(saleCount / pageSize) : 6;
    const minimumPageCount = LARGE_BESTINSLOT_ACTIVITY_SLUGS.has(normalizedSlug.toLowerCase())
        ? 12
        : 1;
    const maxPages = Math.min(Math.max(derivedPageCount, minimumPageCount), 25);
    const allEntries = [];

    for (let page = 1; page <= maxPages; page += 1) {
        const payload = await fetchBestInSlotJsonFrom(
            `/collection/activity?slug=${encodeURIComponent(normalizedSlug)}&limit=${pageSize}&page=${page}`,
            {
                baseUrl: config.bestInSlotActivityApiBaseUrl,
                includeApiKey: Boolean(config.bestInSlotApiKey),
                attempts: 2
            }
        );
        const pageEntries = extractBestInSlotEntries(payload);
        if (pageEntries.length === 0) {
            break;
        }

        allEntries.push(...pageEntries);
    }

    return dedupeBestInSlotRecords(
        allEntries
            .map((entry) => normalizeBestInSlotRecord(entry))
            .filter(Boolean)
    )
        .sort((left, right) => compareServerIsoDatesDescending(left?.occurredAt, right?.occurredAt));
}

async function fetchBestInSlotHistoricalRecordSales(collectionId, slug) {
    const collectionAssets = Array.isArray(boutiqueCatalog.assetsByCollection.get(collectionId))
        ? boutiqueCatalog.assetsByCollection.get(collectionId)
        : [];
    const cutoff = Date.now() - (config.bestInSlotLookbackYears * 365 * 24 * 60 * 60 * 1000);
    const saleCount = await fetchBestInSlotSaleCount(slug).catch(() => 0);
    const activityHistory = await fetchBestInSlotActivitySalesHistory(slug, saleCount).catch(() => []);
    const records = [...activityHistory];
    const historicalEntries = [];
    const failedAssets = [];
    const normalizedSlug = String(slug || '').trim().toLowerCase();
    const scanConcurrency = LARGE_BESTINSLOT_ACTIVITY_SLUGS.has(normalizedSlug)
        ? Math.min(Math.max(config.bestInSlotScanConcurrency, 1), 4)
        : config.bestInSlotScanConcurrency;
    const initialAttempts = LARGE_BESTINSLOT_ACTIVITY_SLUGS.has(normalizedSlug) ? 3 : 2;
    const retryAttempts = LARGE_BESTINSLOT_ACTIVITY_SLUGS.has(normalizedSlug) ? 5 : 3;

    await mapWithConcurrency(collectionAssets, scanConcurrency, async (asset) => {
        const payload = await fetchBestInSlotInscriptionHistory(asset?.id, initialAttempts);
        if (!payload) {
            failedAssets.push(asset);
            return;
        }

        appendBestInSlotTransfersForAsset(asset, payload, cutoff, historicalEntries);
    });

    for (const asset of failedAssets) {
        const payload = await fetchBestInSlotInscriptionHistory(asset?.id, retryAttempts);
        if (!payload) {
            continue;
        }

        appendBestInSlotTransfersForAsset(asset, payload, cutoff, historicalEntries);
    }

    const existingHistoricalCache = bestInSlotCollectionHistoryCache.get(collectionId);
    const existingHistoricalRecords = Array.isArray(existingHistoricalCache?.value)
        ? existingHistoricalCache.value
        : [];
    const completeHistoricalRecords = applyKnownBestInSlotHistoryOverrides(
        collectionId,
        enrichBestInSlotSaleNames(dedupeBestInSlotRecords([
            ...existingHistoricalRecords,
            ...records,
            ...historicalEntries
        ]))
    );
    const historicalByDate = completeHistoricalRecords
        .slice()
        .sort((left, right) => compareServerIsoDatesDescending(left?.occurredAt, right?.occurredAt));
    const expiresAt = Date.now() + BESTINSLOT_FULL_HISTORY_CACHE_TTL_MS;

    warmBestInSlotInscriptionHistoryCache(collectionAssets, historicalByDate, expiresAt);
    bestInSlotCollectionHistoryCache.set(collectionId, {
        expiresAt,
        value: cloneJsonValue(historicalByDate)
    });
    void persistBestInSlotSalesCache();

    return completeHistoricalRecords
        .slice()
        .sort(compareBestInSlotRecordSales)
        .slice(0, 3);
}

async function fetchBestInSlotInscriptionHistory(inscriptionId, attempts = 3) {
    return fetchBestInSlotJsonFrom(
        `/inscription?id=${encodeURIComponent(String(inscriptionId || '').trim())}`,
        {
            baseUrl: config.bestInSlotActivityApiBaseUrl,
            includeApiKey: Boolean(config.bestInSlotApiKey),
            attempts
        }
    ).catch(() => null);
}

function appendBestInSlotTransfersForAsset(asset, payload, cutoff, target) {
    const transfers = Array.isArray(payload?.transfers) ? payload.transfers : [];
    for (const transfer of transfers) {
        const priceSats = normalizeBestInSlotPrice(transfer);
        if (!priceSats) {
            continue;
        }

        const occurredAt = normalizeIsoDate(transfer.ts || transfer.timestamp || transfer.date || transfer.created_at);
        if (!occurredAt) {
            continue;
        }

        const occurredAtMs = Date.parse(occurredAt);
        if (Number.isNaN(occurredAtMs) || occurredAtMs < cutoff) {
            continue;
        }

        target.push({
            inscriptionId: String(asset?.id || '').trim().toLowerCase(),
            name: String(asset?.name || '').trim(),
            priceSats,
            occurredAt,
            txid: String(transfer.tx || transfer.txid || transfer.tx_id || '').trim().toLowerCase(),
            sellerAddress: String(transfer.from || '').trim(),
            buyerAddress: String(transfer.to || '').trim(),
            marketplace: 'BestInSlot'
        });
    }
}

function normalizeBestInSlotRecordSales(payload) {
    const entries = extractBestInSlotEntries(payload);

    return dedupeBestInSlotRecords(entries
        .map((entry) => normalizeBestInSlotRecord(entry))
        .filter(Boolean)
    )
        .sort(compareBestInSlotRecordSales)
        .slice(0, 3);
}

function extractBestInSlotEntries(payload) {
    return Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.items)
            ? payload.items
            : Array.isArray(payload?.sales)
                ? payload.sales
                : Array.isArray(payload?.activity)
                    ? payload.activity
                    : Array.isArray(payload?.results)
                        ? payload.results
                        : [];
}

function normalizeBestInSlotRecord(entry) {
    if (!entry || typeof entry !== 'object') {
        return null;
    }

    const priceSats = normalizeBestInSlotPrice(entry);
    if (!priceSats) {
        return null;
    }

    return {
        inscriptionId: String(entry.inscriptionId || entry.inscription_id || entry.inscription || '').trim().toLowerCase(),
        name: String(entry.name || entry.assetName || entry.inscriptionName || '').trim(),
        priceSats,
        occurredAt: normalizeIsoDate(entry.occurredAt || entry.timestamp || entry.createdAt || entry.created_at || entry.date || entry.ts),
        txid: String(entry.txid || entry.tx_id || '').trim().toLowerCase(),
        sellerAddress: String(entry.sellerAddress || entry.seller || entry.from || '').trim(),
        buyerAddress: String(entry.buyerAddress || entry.buyer || entry.to || '').trim(),
        marketplace: String(entry.marketplace || entry.source || 'BestInSlot').trim() || 'BestInSlot'
    };
}

function dedupeBestInSlotRecords(records) {
    const seen = new Set();
    const deduped = [];

    for (const record of Array.isArray(records) ? records : []) {
        if (!record) continue;
        const key = [
            String(record.inscriptionId || '').trim().toLowerCase(),
            String(record.txid || '').trim().toLowerCase(),
            String(record.occurredAt || '').trim(),
            String(record.priceSats || '').trim()
        ].join('|');
        if (!key || seen.has(key)) {
            continue;
        }
        seen.add(key);
        deduped.push(record);
    }

    return deduped;
}

function warmBestInSlotInscriptionHistoryCache(collectionAssets, records, expiresAt = Date.now() + BESTINSLOT_RECORD_CACHE_TTL_MS) {
    const assets = Array.isArray(collectionAssets) ? collectionAssets : [];
    if (assets.length === 0) {
        return;
    }
    const grouped = new Map();
    const dedupedRecords = enrichBestInSlotSaleNames(dedupeBestInSlotRecords(records))
        .sort((left, right) => compareServerIsoDatesDescending(left?.occurredAt, right?.occurredAt));

    for (const record of dedupedRecords) {
        const normalizedInscriptionId = String(record?.inscriptionId || '').trim().toLowerCase();
        if (!normalizedInscriptionId) {
            continue;
        }

        const existing = grouped.get(normalizedInscriptionId) || [];
        existing.push(record);
        grouped.set(normalizedInscriptionId, existing);
    }

    for (const asset of assets) {
        const normalizedInscriptionId = String(asset?.id || '').trim().toLowerCase();
        if (!normalizedInscriptionId) {
            continue;
        }

        bestInSlotInscriptionCache.set(normalizedInscriptionId, {
            expiresAt,
            value: cloneJsonValue(grouped.get(normalizedInscriptionId) || [])
        });
    }

    void persistBestInSlotSalesCache();
}

function enrichBestInSlotSaleNames(records) {
    return (Array.isArray(records) ? records : []).map((record) => {
        if (!record || record.name) {
            return record;
        }

        const asset = findCatalogAssetById(boutiqueCatalog, record.inscriptionId);
        return asset ? { ...record, name: String(asset.name || '').trim() } : record;
    });
}

function compareServerIsoDatesDescending(left, right) {
    const leftTime = Date.parse(String(left || '').trim());
    const rightTime = Date.parse(String(right || '').trim());
    const normalizedLeft = Number.isFinite(leftTime) ? leftTime : 0;
    const normalizedRight = Number.isFinite(rightTime) ? rightTime : 0;
    return normalizedRight - normalizedLeft;
}

async function mapWithConcurrency(items, concurrency, worker) {
    const source = Array.isArray(items) ? items : [];
    const limit = Math.max(1, Number(concurrency) || 1);
    let cursor = 0;

    async function runWorker() {
        while (cursor < source.length) {
            const currentIndex = cursor;
            cursor += 1;
            await worker(source[currentIndex], currentIndex);
        }
    }

    await Promise.all(Array.from({ length: Math.min(limit, source.length || 1) }, () => runWorker()));
}

function normalizeBestInSlotPrice(entry) {
    const directSats = normalizeNumber(
        entry?.priceSats
        || entry?.price_sats
        || entry?.salePriceSats
        || entry?.sale_price_sats
        || entry?.psbt_sale
    );
    if (directSats > 0) {
        return directSats;
    }

    const btcPrice = Number(entry?.priceBtc || entry?.price_btc || entry?.price || entry?.salePrice || entry?.sale_price);
    return Number.isFinite(btcPrice) && btcPrice > 0
        ? Math.round(btcPrice * 100_000_000)
        : 0;
}

function normalizeIsoDate(value) {
    const normalized = String(value || '').trim();
    if (!normalized) return '';
    const date = new Date(normalized);
    return Number.isNaN(date.getTime()) ? '' : date.toISOString();
}

function isCollectionInscriptionHistoryFullyIndexed(collectionId, now = Date.now()) {
    const normalizedCollectionId = String(collectionId || '').trim().toLowerCase();
    if (!normalizedCollectionId) {
        return false;
    }

    const collectionAssets = Array.isArray(boutiqueCatalog.assetsByCollection.get(normalizedCollectionId))
        ? boutiqueCatalog.assetsByCollection.get(normalizedCollectionId)
        : [];
    if (collectionAssets.length === 0) {
        return false;
    }

    for (const asset of collectionAssets) {
        const normalizedInscriptionId = String(asset?.id || '').trim().toLowerCase();
        const cached = bestInSlotInscriptionCache.get(normalizedInscriptionId);
        if (!normalizedInscriptionId || !cached || Number(cached.expiresAt || 0) <= now) {
            return false;
        }
    }

    return true;
}

function getBestInSlotIndexingStatus(collectionId, now = Date.now()) {
    const normalizedCollectionId = String(collectionId || '').trim().toLowerCase();
    if (!normalizedCollectionId) {
        return {
            totalCount: 0,
            indexedCount: 0,
            remainingCount: 0,
            complete: false,
            inProgress: false
        };
    }

    const collectionAssets = Array.isArray(boutiqueCatalog.assetsByCollection.get(normalizedCollectionId))
        ? boutiqueCatalog.assetsByCollection.get(normalizedCollectionId)
        : [];
    const totalCount = collectionAssets.length;
    if (totalCount === 0) {
        return {
            totalCount: 0,
            indexedCount: 0,
            remainingCount: 0,
            complete: false,
            inProgress: false
        };
    }

    let indexedCount = 0;
    for (const asset of collectionAssets) {
        const normalizedInscriptionId = String(asset?.id || '').trim().toLowerCase();
        const cached = bestInSlotInscriptionCache.get(normalizedInscriptionId);
        if (normalizedInscriptionId && cached && Number(cached.expiresAt || 0) > now) {
            indexedCount += 1;
        }
    }

    const remainingCount = Math.max(totalCount - indexedCount, 0);
    return {
        totalCount,
        indexedCount,
        remainingCount,
        complete: indexedCount >= totalCount && totalCount > 0,
        inProgress: bestInSlotRecordRefreshStore.has(normalizedCollectionId)
    };
}

function shouldForceBestInSlotHistoricalRefresh(collection, records) {
    const slug = String(collection?.bestInSlotSlug || '').trim().toLowerCase();
    if (!LARGE_BESTINSLOT_ACTIVITY_SLUGS.has(slug)) {
        return false;
    }

    const history = Array.isArray(records) ? records : [];
    if (history.length === 0) {
        return true;
    }

    return history.length < 600 || !isCollectionInscriptionHistoryFullyIndexed(collection?.id);
}

function applyKnownBestInSlotRecordOverrides(collectionId, records) {
    const overrides = KNOWN_BESTINSLOT_RECORD_OVERRIDES[String(collectionId || '').trim().toLowerCase()] || [];
    const existing = Array.isArray(records) ? records : [];
    const filteredOverrides = overrides.filter((override) => !existing.some((record) => (
        String(record?.inscriptionId || '').trim().toLowerCase() === String(override?.inscriptionId || '').trim().toLowerCase()
        && Number(record?.priceSats || 0) === Number(override?.priceSats || 0)
    )));

    return dedupeBestInSlotRecords([...existing, ...filteredOverrides])
        .sort(compareBestInSlotRecordSales)
        .slice(0, 3);
}

function applyKnownBestInSlotHistoryOverrides(collectionId, records) {
    const overrides = KNOWN_BESTINSLOT_RECORD_OVERRIDES[String(collectionId || '').trim().toLowerCase()] || [];
    return dedupeBestInSlotRecords([
        ...(Array.isArray(records) ? records : []),
        ...overrides
    ]).sort((left, right) => compareServerIsoDatesDescending(left?.occurredAt, right?.occurredAt));
}

function compareBestInSlotRecordSales(left, right) {
    const priceDelta = Number(right?.priceSats || 0) - Number(left?.priceSats || 0);
    if (priceDelta !== 0) {
        return priceDelta;
    }

    const dateDelta = compareServerIsoDatesDescending(left?.occurredAt, right?.occurredAt);
    if (dateDelta !== 0) {
        return dateDelta;
    }

    return String(left?.inscriptionId || '').localeCompare(String(right?.inscriptionId || ''));
}

function isRetryableBestInSlotError(error) {
    const status = Number(error?.status || 0);
    return !status || BESTINSLOT_RETRYABLE_STATUS_CODES.has(status);
}

function delay(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, Math.max(0, Number(ms) || 0));
    });
}

function cloneJsonValue(value) {
    return value == null ? value : JSON.parse(JSON.stringify(value));
}

function notFoundResponse() {
    return new Response('Not found.', {
        status: 404,
        headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'Cache-Control': 'no-store'
        }
    });
}

function normalizeBasePath(value) {
    const raw = String(value || '/boutique').trim();
    if (!raw || raw === '/') return '/boutique';
    return raw.startsWith('/') ? raw.replace(/\/+$/, '') : `/${raw.replace(/\/+$/, '')}`;
}

function normalizePort(value) {
    const port = Number(value);
    return Number.isInteger(port) && port > 0 ? port : 8787;
}

function normalizeNumber(value) {
    const number = Number(value);
    return Number.isFinite(number) && number > 0 ? Math.round(number) : 0;
}

function normalizePositiveIntegerValue(value, fallback) {
    const normalized = Number(value);
    return Number.isInteger(normalized) && normalized > 0
        ? normalized
        : fallback;
}

function normalizeNonNegativeIntegerValue(value, fallback) {
    const normalized = Number(value);
    return Number.isInteger(normalized) && normalized >= 0
        ? normalized
        : fallback;
}

function normalizeBoolean(value) {
    const normalized = String(value || '').trim().toLowerCase();
    return ['1', 'true', 'yes', 'on'].includes(normalized);
}

function normalizeBitcoinAmount(value) {
    if (typeof value === 'bigint') return Number(value);
    const number = Number(value);
    return Number.isFinite(number) && number > 0
        ? Math.round(number * 100_000_000)
        : 0;
}

function consumeRateLimit(request, category = 'default') {
    const limit = resolveRateLimitLimit(category);
    if (!limit) return;

    const clientIp = resolveClientIp(request);
    const now = Date.now();
    const key = `${category}:${clientIp}`;
    const existing = rateLimitStore.get(key);

    if (existing && existing.expiresAt > now) {
        if (existing.count >= limit) {
            const retryAfterSeconds = Math.max(1, Math.ceil((existing.expiresAt - now) / 1000));
            throw createHttpError(429, `Rate limit exceeded. Retry after ${retryAfterSeconds} seconds.`);
        }

        existing.count += 1;
        return;
    }

    rateLimitStore.set(key, {
        count: 1,
        expiresAt: now + config.rateLimits.windowMs
    });
}

function resolveRateLimitLimit(category) {
    switch (String(category || '').trim()) {
        case 'utxo': return config.rateLimits.utxoMax;
        case 'broadcast': return config.rateLimits.broadcastMax;
        case 'publish': return config.rateLimits.publishMax;
        case 'challenge': return config.rateLimits.challengeMax;
        default: return config.rateLimits.defaultMax;
    }
}

function resolveClientIp(request) {
    const proxied = config.trustProxy
        ? String(request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '').trim()
        : '';
    const direct = String(request.headers.get(INTERNAL_REMOTE_ADDR_HEADER) || '').trim();
    const candidate = proxied
        ? proxied.split(',')[0].trim()
        : direct;

    return normalizeClientIp(candidate) || 'unknown';
}

function normalizeClientIp(value) {
    const normalized = String(value || '').trim();
    if (!normalized) return '';
    if (normalized === '::1') return '127.0.0.1';

    const ipv4Mapped = normalized.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/i);
    if (ipv4Mapped) {
        return ipv4Mapped[1];
    }

    return normalized.replace(/^\[|\]$/g, '');
}

function cleanupRateLimitStore() {
    const now = Date.now();
    for (const [key, value] of rateLimitStore.entries()) {
        if (!value || value.expiresAt <= now) {
            rateLimitStore.delete(key);
        }
    }
}

function cleanupExpiringStore(store, now = Date.now()) {
    for (const [key, value] of store.entries()) {
        if (!value || value.expiresAt <= now) {
            store.delete(key);
        }
    }
}

function isValidBitcoinAddress(address) {
    try {
        bitcoin.address.toOutputScript(String(address || '').trim(), BITCOIN_NETWORK);
        return true;
    } catch {
        return false;
    }
}

function cloneAddressUtxo(utxo) {
    return {
        txid: String(utxo?.txid || '').trim(),
        vout: Number(utxo?.vout),
        value: normalizeNumber(utxo?.value),
        status: {
            confirmed: Boolean(utxo?.status?.confirmed)
        }
    };
}

function createInfrastructureError(code, message) {
    const error = new Error(message);
    error.code = code;
    error.infrastructure = true;
    return error;
}

function createHttpError(status, message) {
    const error = new Error(message);
    error.status = status;
    return error;
}


