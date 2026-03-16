import { Buffer } from 'node:buffer';
import { createRequire } from 'node:module';
import * as bitcoin from 'bitcoinjs-lib';
import bitcore from 'bitcore-lib';
import * as ecc from 'tiny-secp256k1';
import { secp256k1, schnorr } from '@noble/curves/secp256k1';
import {
    AUTH_CHALLENGE_TTL_SECONDS,
    BOUTIQUE_AUTH_ACTION,
    BOUTIQUE_BROADCAST_AUTH_ACTION,
    BOUTIQUE_SIGNABLE_ACTIONS,
    buildBroadcastAuthMessage,
    buildPublishAuthMessage,
    hashManifestPayload,
    randomHex,
    stripAuthEnvelope
} from './boutique-security.js';
import { normalizeCollectionId } from './collection-registry.js';

const require = createRequire(import.meta.url);
const { Verifier: BIP322Verifier } = require('bip322-js');

const NETWORK = bitcoin.networks.bitcoin;
const MAX_ITEMS = 5000;
const SIGHASH_SINGLE_ANYONECANPAY = 131;
const MAX_SAFE_BUY_FEE_RATE_MULTIPLIER = 5;
const MAX_SAFE_BUY_FEE_RATE_FLOOR = 75;
const BTC_USD_CACHE_TTL_MS = 60_000;
const INSCRIPTION_DETAILS_CACHE_TTL_MS = 60_000;
const SNAPSHOT_CACHE_TTL_MS = 60_000;
const REMOTE_FETCH_TIMEOUT_MS = 8_000;
const ALPHA_INSCRIPTION_IDS = new Set([
    '6bc3d7dab466d2714ef01bcbb274ca2dce345b40bb72f3ec435c680f3d4262a4i0'
]);
const SILK_ROAD_INSCRIPTION_IDS = new Set([
    '9ca50a87fd9aa7069e4729f1713d8de48b6c600f441b98c615aab09d9e378df2i0'
]);
const BLOCK_9_INSCRIPTION_IDS = new Set([
    '73d068ca64b5e23e4d723298a590cb7f5741a973a99fd4956b624e905e16c917i0'
]);
bitcoin.initEccLib(ecc);
let btcUsdQuoteCache = null;
const inscriptionDetailsCache = new Map();
let snapshotCache = null;
const JSON_HEADERS = {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'same-origin',
    'Cross-Origin-Resource-Policy': 'same-site'
};
const TEXT_HEADERS = {
    'Content-Type': 'text/plain; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'same-origin',
    'Cross-Origin-Resource-Policy': 'same-site'
};

export const EMPTY_MANIFEST = {
    version: 2,
    updatedAt: '',
    items: []
};

export const EMPTY_SALES_ACTIVITY = {
    version: 2,
    updatedAt: '',
    items: []
};

export const EMPTY_OFFERS_STORE = {
    version: 1,
    updatedAt: '',
    items: []
};

export const EMPTY_PROFILES_STORE = {
    version: 1,
    updatedAt: '',
    items: {}
};

export async function handleBoutiqueApiRequest(request, env) {
    const url = new URL(request.url);
    const apiPath = normalizeApiPath(url.pathname, env);

    if (request.method === 'OPTIONS') {
        const corsHeaders = buildCorsHeaders(request, env);
        if (request.headers.get('Origin') && !corsHeaders['Access-Control-Allow-Origin']) {
            return new Response('This origin is not allowed.', {
                status: 403,
                headers: {
                    ...TEXT_HEADERS,
                    Vary: 'Origin'
                }
            });
        }

        return new Response(null, {
            status: 204,
            headers: corsHeaders
        });
    }

    try {
        enforceRateLimitForRequest(request, env, apiPath);

        if (apiPath === '/collections') {
            if (request.method === 'GET') {
                return await handleGetCollections(request, env);
            }

            return jsonResponse({ error: 'Method not allowed.' }, 405, request, env);
        }

        if (apiPath === '/assets') {
            if (request.method === 'GET') {
                return await handleGetAssets(request, env);
            }

            return jsonResponse({ error: 'Method not allowed.' }, 405, request, env);
        }

        if (apiPath === '/listings') {
            if (request.method === 'GET') {
                return await handleGetListings(request, env);
            }

            if (request.method === 'POST') {
                return await handlePublishListings(request, env);
            }

            return jsonResponse({ error: 'Method not allowed.' }, 405, request, env);
        }

        if (apiPath === '/sales') {
            if (request.method === 'GET') {
                return await handleGetSalesActivity(request, env);
            }

            return jsonResponse({ error: 'Method not allowed.' }, 405, request, env);
        }

        if (apiPath === '/collection-sales-history') {
            if (request.method === 'GET') {
                return await handleGetCollectionSalesHistory(request, env);
            }

            return jsonResponse({ error: 'Method not allowed.' }, 405, request, env);
        }

        if (apiPath === '/offers') {
            if (request.method === 'GET') {
                return await handleGetOffers(request, env);
            }

            if (request.method === 'POST') {
                return await handlePostOffer(request, env);
            }

            return jsonResponse({ error: 'Method not allowed.' }, 405, request, env);
        }

        const offerMatch = apiPath.match(/^\/offers\/([^/]+)$/i);
        if (offerMatch) {
            if (request.method !== 'GET') {
                return jsonResponse({ error: 'Method not allowed.' }, 405, request, env);
            }

            return await handleGetOffer(request, env, offerMatch[1]);
        }

        const offerPrepareActionMatch = apiPath.match(/^\/offers\/([^/]+)\/prepare-accept$/i);
        if (offerPrepareActionMatch) {
            if (request.method !== 'POST') {
                return jsonResponse({ error: 'Method not allowed.' }, 405, request, env);
            }

            return await handlePrepareAcceptOffer(request, env, offerPrepareActionMatch[1]);
        }

        const offerActionMatch = apiPath.match(/^\/offers\/([^/]+)\/(cancel|accept)$/i);
        if (offerActionMatch) {
            if (request.method !== 'POST') {
                return jsonResponse({ error: 'Method not allowed.' }, 405, request, env);
            }

            if (offerActionMatch[2].toLowerCase() === 'cancel') {
                return await handleCancelOffer(request, env, offerActionMatch[1]);
            }

            return await handleAcceptOffer(request, env, offerActionMatch[1]);
        }

        const addressPortfolioMatch = apiPath.match(/^\/address\/(.+)\/portfolio$/i);
        if (addressPortfolioMatch) {
            if (request.method !== 'GET') {
                return jsonResponse({ error: 'Method not allowed.' }, 405, request, env);
            }

            return await handleGetAddressPortfolio(request, env, decodeURIComponent(addressPortfolioMatch[1]));
        }

        const profileMatch = apiPath.match(/^\/profiles\/(.+)$/i);
        if (profileMatch) {
            if (request.method === 'GET') {
                return await handleGetProfile(request, env, decodeURIComponent(profileMatch[1]));
            }

            if (request.method === 'PUT') {
                return await handlePutProfile(request, env, decodeURIComponent(profileMatch[1]));
            }

            return jsonResponse({ error: 'Method not allowed.' }, 405, request, env);
        }

        if (apiPath === '/auth/challenge') {
            if (request.method === 'POST') {
                return await handleCreatePublishChallenge(request, env);
            }

            return jsonResponse({ error: 'Method not allowed.' }, 405, request, env);
        }

        if (apiPath === '/auth/broadcast-challenge') {
            if (request.method === 'POST') {
                return await handleCreateBroadcastChallenge(request, env);
            }

            return jsonResponse({ error: 'Method not allowed.' }, 405, request, env);
        }

        if (apiPath === '/market/btc-usd') {
            if (request.method === 'GET') {
                return await handleGetBtcUsdQuote(request, env);
            }

            return jsonResponse({ error: 'Method not allowed.' }, 405, request, env);
        }

        const inscriptionDetailsMatch = apiPath.match(/^\/inscription\/([0-9a-f]{64}i\d+)\/details$/i);
        if (inscriptionDetailsMatch) {
            if (request.method === 'GET') {
                return await handleGetInscriptionDetails(request, env, inscriptionDetailsMatch[1]);
            }

            return jsonResponse({ error: 'Method not allowed.' }, 405, request, env);
        }

        const txHexMatch = apiPath.match(/^\/btc\/tx\/([0-9a-f]{64})\/hex$/i);
        if (txHexMatch) {
            if (request.method !== 'GET') {
                return jsonResponse({ error: 'Method not allowed.' }, 405, request, env);
            }

            return await handleGetTransactionHex(request, env, txHexMatch[1]);
        }

        const outspendMatch = apiPath.match(/^\/btc\/tx\/([0-9a-f]{64})\/outspend\/(\d+)$/i);
        if (outspendMatch) {
            if (request.method !== 'GET') {
                return jsonResponse({ error: 'Method not allowed.' }, 405, request, env);
            }

            return await handleGetOutspend(request, env, outspendMatch[1], Number(outspendMatch[2]));
        }

        const addressUtxoMatch = apiPath.match(/^\/btc\/address\/(.+)\/utxo$/i);
        if (addressUtxoMatch) {
            if (request.method !== 'GET') {
                return jsonResponse({ error: 'Method not allowed.' }, 405, request, env);
            }

            return await handleGetAddressUtxos(request, env, decodeURIComponent(addressUtxoMatch[1]));
        }

        if (apiPath === '/btc/fees/recommended') {
            if (request.method !== 'GET') {
                return jsonResponse({ error: 'Method not allowed.' }, 405, request, env);
            }

            return await handleGetRecommendedFees(request, env);
        }

        if (apiPath === '/btc/tx') {
            if (request.method !== 'POST') {
                return jsonResponse({ error: 'Method not allowed.' }, 405, request, env);
            }

            return await handleBroadcastTransaction(request, env);
        }

        return jsonResponse({ error: 'Not found.' }, 404, request, env);
    } catch (error) {
        return jsonResponse({ error: formatErrorMessage(error) }, inferStatusCode(error), request, env);
    }
}

async function handleGetListings(request, env) {
    const url = new URL(request.url);
    const collectionId = normalizeCollectionId(url.searchParams.get('collection'));
    const normalized = await loadNormalizedStoredManifest(env);
    const nextItems = [];
    let changed = false;
    const changedAt = new Date().toISOString();

    for (const item of normalized.items) {
        if (item.status !== 'active') {
            nextItems.push(item);
            continue;
        }

        const inspection = await inspectListingAvailability(item, env);
        if (inspection.live || inspection.indeterminate) {
            nextItems.push(item);
            continue;
        }

        nextItems.push({
            ...item,
            status: 'stale',
            updatedAt: changedAt
        });
        changed = true;
    }

    const nextManifest = changed
        ? normalizeManifest({
            ...normalized,
            updatedAt: changedAt,
            items: nextItems
        }, env)
        : normalized;

    if (changed) {
        await env.writeManifest(nextManifest);
        snapshotCache = null;
    }

    return jsonResponse({
        version: 2,
        updatedAt: nextManifest.updatedAt,
        items: nextItems
            .filter((entry) => entry.status === 'active')
            .filter((entry) => !collectionId || entry.collectionId === collectionId)
            .sort((left, right) => compareIsoDatesDescending(left.updatedAt, right.updatedAt))
    }, 200, request, env);
}

async function handleGetSalesActivity(request, env) {
    if (typeof env.readSalesActivity !== 'function') {
        return jsonResponse(EMPTY_SALES_ACTIVITY, 200, request, env);
    }

    const stored = await env.readSalesActivity();
    if (!stored) {
        return jsonResponse(EMPTY_SALES_ACTIVITY, 200, request, env);
    }

    let activity;

    try {
        activity = JSON.parse(stored);
    } catch {
        return jsonResponse(EMPTY_SALES_ACTIVITY, 200, request, env);
    }

    const url = new URL(request.url);
    const collectionId = normalizeCollectionId(url.searchParams.get('collection'));
    const normalized = normalizeSalesActivity(activity, env);

    return jsonResponse({
        version: normalized.version,
        updatedAt: normalized.updatedAt,
        items: normalized.items.filter((item) => !collectionId || item.collectionId === collectionId)
    }, 200, request, env);
}

async function handleGetCollectionSalesHistory(request, env) {
    const url = new URL(request.url);
    const collectionIds = Array.from(new Set(
        url.searchParams.getAll('collection')
            .flatMap((value) => String(value || '').split(','))
            .map((value) => normalizeCollectionId(value))
            .filter(Boolean)
    ));

    if (collectionIds.length === 0) {
        return jsonResponse({ error: 'At least one collection id is required.' }, 400, request, env);
    }

    const items = {};

    await Promise.all(collectionIds.map(async (collectionId) => {
        const history = typeof env.fetchBestInSlotCollectionSalesHistory === 'function'
            ? await env.fetchBestInSlotCollectionSalesHistory(collectionId).catch(() => [])
            : [];

        items[collectionId] = (Array.isArray(history) ? history : []).map((record) => ({
            inscriptionId: normalizeInscriptionId(record?.inscriptionId || record?.id),
            name: normalizeOptionalString(record?.name),
            priceSats: normalizePositiveInteger(record?.priceSats || record?.price),
            occurredAt: normalizeIsoDate(record?.occurredAt || record?.timestamp || record?.createdAt),
            txid: normalizeHex(record?.txid || record?.tx_id, 64)
        })).filter((record) => record.inscriptionId && record.priceSats > 0 && record.occurredAt);
    }));

    return jsonResponse({
        version: 1,
        updatedAt: new Date().toISOString(),
        items
    }, 200, request, env);
}

async function handleGetCollections(request, env) {
    const listingsStore = await loadNormalizedStoredManifest(env);
    const salesStore = await loadNormalizedStoredSalesActivity(env);
    const offersStore = await loadNormalizedOffersStore(env);
    const collections = Array.isArray(env.listBoutiqueCollections?.())
        ? env.listBoutiqueCollections()
        : [];

    const items = await Promise.all(collections.map(async (collection) => {
        const collectionId = normalizeCollectionId(collection.id);
        const activeListings = listingsStore.items.filter((item) => item.status === 'active' && item.collectionId === collectionId);
        const collectionSales = salesStore.items.filter((item) => item.collectionId === collectionId);
        const openOffers = offersStore.items.filter((item) => item.status === 'open' && item.collectionId === collectionId);
        const boutiqueSalesSummary = summarizeMarketplaceSales(collectionSales);
        const ownerCount = await countUniqueTrackedOwners(collectionId, env);

        return {
            id: collectionId,
            name: String(collection.name || '').trim(),
            description: normalizeOptionalString(collection.description),
            iconPath: normalizeOptionalString(collection.iconPath),
            imagePath: normalizeOptionalString(collection.imagePath),
            previewType: normalizeOptionalString(collection.previewType),
            previewPath: normalizeOptionalString(collection.previewPath),
            accentColor: normalizeOptionalString(collection.accentColor),
            metadataUrl: normalizeOptionalString(collection.metadataUrl),
            assetCount: normalizePositiveInteger(collection.assetCount),
            activeListingCount: activeListings.length,
            floorPriceSats: resolveFloorPrice(activeListings),
            openOfferCount: openOffers.length,
            latestSale: collectionSales[0] || null,
            ownerCount: ownerCount === null ? null : normalizePositiveInteger(ownerCount),
            boutiqueSales24hSats: boutiqueSalesSummary.volume24hSats,
            boutiqueSalesTotalSats: boutiqueSalesSummary.totalSats,
            forcedSatribute: collection.forcedSatribute || null
        };
    }));

    return jsonResponse({
        version: 1,
        updatedAt: new Date().toISOString(),
        items
    }, 200, request, env);
}

async function handleGetAssets(request, env) {
    const url = new URL(request.url);
    const collectionId = normalizeCollectionId(url.searchParams.get('collection'));
    if (!collectionId) {
        return jsonResponse({ error: 'A collection id is required.' }, 400, request, env);
    }

    const collection = getCatalogCollection(env, collectionId);
    if (!collection) {
        return jsonResponse({ error: 'Unknown collection.' }, 404, request, env);
    }

    const listingsStore = await loadNormalizedStoredManifest(env);
    const salesStore = await loadNormalizedStoredSalesActivity(env);
    const offersStore = await loadNormalizedOffersStore(env);
    const listingsById = new Map(
        listingsStore.items
            .filter((item) => item.status === 'active')
            .map((item) => [item.inscriptionId, item])
    );
    const openOffersByInscription = new Map();

    for (const offer of offersStore.items) {
        if (offer.status !== 'open' || offer.type !== 'item' || offer.collectionId !== collectionId || !offer.inscriptionId) {
            continue;
        }

        const existing = openOffersByInscription.get(offer.inscriptionId) || [];
        existing.push(offer);
        openOffersByInscription.set(offer.inscriptionId, existing);
    }

    const boutiqueCollectionSales = salesStore.items.filter((item) => item.collectionId === collectionId);
    const boutiqueSalesSummary = summarizeMarketplaceSales(boutiqueCollectionSales);
    const ownerCount = await countUniqueTrackedOwners(collectionId, env);
    const useLocalSalesHistory = useLocalBoutiqueSalesHistory(collectionId);
    const salesHistoryIndex = !useLocalSalesHistory && typeof env.getBestInSlotIndexingStatus === 'function'
        ? env.getBestInSlotIndexingStatus(collectionId)
        : null;
    const [collectionHistoricalSales, recordSalesFallback, recentSalesActivity] = useLocalSalesHistory
        ? [[], [], []]
        : await Promise.all([
            typeof env.fetchBestInSlotCollectionSalesHistory === 'function'
                ? env.fetchBestInSlotCollectionSalesHistory(collectionId).catch(() => [])
                : Promise.resolve([]),
            typeof env.fetchBestInSlotRecordSales === 'function'
                ? env.fetchBestInSlotRecordSales(collectionId).catch(() => [])
                : Promise.resolve([]),
            typeof env.fetchBestInSlotRecentSales === 'function'
                ? env.fetchBestInSlotRecentSales(collectionId).catch(() => [])
                : Promise.resolve([])
        ]);
    const recordSales = deriveRecordSalesFromHistory([
        ...collectionHistoricalSales,
        ...(Array.isArray(recordSalesFallback) ? recordSalesFallback : [])
    ]);
    const mergedSales = mergeHistoricalAndMarketplaceSales(collectionId, {
        recordSales,
        recentSalesActivity,
        marketplaceSales: boutiqueCollectionSales
    });
    const previousSaleLookup = buildPreviousSaleLookup([
        ...collectionHistoricalSales,
        ...boutiqueCollectionSales,
        ...mergedSales.recordSales,
        ...mergedSales.recentSalesActivity
    ]);
    const assets = (Array.isArray(env.listBoutiqueAssets?.(collectionId)) ? env.listBoutiqueAssets(collectionId) : [])
        .sort((left, right) => Number(left.sortOrder || 0) - Number(right.sortOrder || 0))
        .map((asset) => {
            const listing = listingsById.get(asset.id) || null;
            const itemOffers = (openOffersByInscription.get(asset.id) || []).sort((left, right) => Number(right.priceSats || 0) - Number(left.priceSats || 0));

            return {
                ...asset,
                previousSale: previousSaleLookup.get(normalizeInscriptionId(asset.id)) || null,
                listing: listing ? createListingSummary(listing) : null,
                topOffer: itemOffers[0] ? createOfferSummary(itemOffers[0]) : null,
                itemOfferCount: itemOffers.length
            };
        });

    return jsonResponse({
        version: 1,
        updatedAt: new Date().toISOString(),
        collection: {
            ...toPublicCollectionSummary(collection),
            recordSales: mergedSales.recordSales,
            recentSalesActivity: mergedSales.recentSalesActivity,
            ownerCount: ownerCount === null ? null : normalizePositiveInteger(ownerCount),
            boutiqueSales24hSats: boutiqueSalesSummary.volume24hSats,
            boutiqueSalesTotalSats: boutiqueSalesSummary.totalSats,
            salesHistoryIndex
        },
        recordSales: mergedSales.recordSales,
        recentSalesActivity: mergedSales.recentSalesActivity,
        items: assets
    }, 200, request, env);
}

async function handleGetOffers(request, env) {
    const url = new URL(request.url);
    const collectionId = normalizeCollectionId(url.searchParams.get('collection'));
    const inscriptionId = normalizeInscriptionId(url.searchParams.get('inscriptionId'));
    const address = normalizeAddress(url.searchParams.get('address'));
    const status = normalizeOptionalString(url.searchParams.get('status')).toLowerCase() || 'open';
    const store = await loadNormalizedOffersStore(env);

      const items = store.items
          .filter((offer) => !collectionId || offer.collectionId === collectionId)
          .filter((offer) => !inscriptionId || offer.inscriptionId === inscriptionId)
          .filter((offer) => !address || offer.buyerAddress === address || offer.buyerOrdinalsAddress === address || offer.sellerAddress === address)
          .filter((offer) => !status || offer.status === status)
          .sort((left, right) => compareIsoDatesDescending(left.updatedAt, right.updatedAt))
          .map(createOfferSummary);

    return jsonResponse({
        version: 1,
        updatedAt: store.updatedAt,
        items
    }, 200, request, env);
}

async function handleGetOffer(request, env, offerId) {
    const normalizedOfferId = normalizeOfferId(offerId);
    if (!normalizedOfferId) {
        return jsonResponse({ error: 'Offer id is required.' }, 400, request, env);
    }

    const store = await loadNormalizedOffersStore(env);
    const offer = store.items.find((entry) => entry.offerId === normalizedOfferId);
    if (!offer) {
        return jsonResponse({ error: 'Offer not found.' }, 404, request, env);
    }

    return jsonResponse({
        ...createOfferSummary(offer),
        sellerPaymentsAddress: normalizeAddress(offer.sellerPaymentsAddress)
    }, 200, request, env);
}

async function handlePostOffer(request, env) {
    enforceAllowedOrigin(request, env, true);

    let payload;
    try {
        payload = await request.json();
    } catch {
        return jsonResponse({ error: 'Request body must be valid JSON.' }, 400, request, env);
    }

    const offerPayload = stripAuthEnvelope(payload);
    let auth;
    let payloadHash;

    try {
        auth = normalizeGenericActionAuth(payload?.auth, 'offer-create');
        payloadHash = await hashManifestPayload(offerPayload);
        validateGenericActionEnvelope(auth, payloadHash, 'offer-create');
    } catch (error) {
        return jsonResponse({ error: formatErrorMessage(error) }, 400, request, env);
    }

    const storedChallenge = await env.getChallenge(auth.nonce);
    if (!storedChallenge) {
        return jsonResponse({ error: 'Offer authorization challenge is missing or expired.' }, 401, request, env);
    }

    try {
        const challenge = normalizeStoredGenericChallenge(storedChallenge);
        validateGenericActionChallenge(challenge, auth, payloadHash, request, 'offer-create');
    } catch (error) {
        return jsonResponse({ error: formatErrorMessage(error) }, 401, request, env);
    }

    let offer;
    try {
        offer = normalizeOfferRecord(offerPayload, auth, env);
    } catch (error) {
        return jsonResponse({ error: formatErrorMessage(error) }, 400, request, env);
    }

    const store = await loadNormalizedOffersStore(env);
    const nextStore = normalizeOffersStore({
        ...store,
        updatedAt: new Date().toISOString(),
        items: [
            offer,
            ...store.items.filter((entry) => entry.offerId !== offer.offerId)
        ]
    });

    await env.writeOffersStore(nextStore);
    snapshotCache = null;
    await env.deleteChallenge(auth.nonce);
    return jsonResponse(createOfferSummary(offer), 200, request, env);
}

async function handleCancelOffer(request, env, offerId) {
    enforceAllowedOrigin(request, env, true);

    let payload;
    try {
        payload = await request.json();
    } catch {
        return jsonResponse({ error: 'Request body must be valid JSON.' }, 400, request, env);
    }

    const authPayload = stripAuthEnvelope(payload);
    let auth;
    let payloadHash;

    try {
        auth = normalizeGenericActionAuth(payload?.auth, 'offer-cancel');
        payloadHash = await hashManifestPayload(authPayload);
        validateGenericActionEnvelope(auth, payloadHash, 'offer-cancel');
    } catch (error) {
        return jsonResponse({ error: formatErrorMessage(error) }, 400, request, env);
    }

    const storedChallenge = await env.getChallenge(auth.nonce);
    if (!storedChallenge) {
        return jsonResponse({ error: 'Offer cancel challenge is missing or expired.' }, 401, request, env);
    }

    try {
        const challenge = normalizeStoredGenericChallenge(storedChallenge);
        validateGenericActionChallenge(challenge, auth, payloadHash, request, 'offer-cancel');
    } catch (error) {
        return jsonResponse({ error: formatErrorMessage(error) }, 401, request, env);
    }

    const store = await loadNormalizedOffersStore(env);
    const target = store.items.find((entry) => entry.offerId === normalizeOfferId(offerId));
    if (!target) {
        return jsonResponse({ error: 'Offer not found.' }, 404, request, env);
    }

      if (target.buyerAddress !== auth.address && target.buyerOrdinalsAddress !== auth.address) {
          return jsonResponse({ error: 'Only the offer creator can cancel this offer.' }, 403, request, env);
      }

    const nextStore = normalizeOffersStore({
        ...store,
        updatedAt: new Date().toISOString(),
        items: store.items.map((entry) => entry.offerId === target.offerId
            ? {
                ...entry,
                status: 'cancelled',
                updatedAt: new Date().toISOString()
            }
            : entry)
    });

    await env.writeOffersStore(nextStore);
    snapshotCache = null;
    await env.deleteChallenge(auth.nonce);
    return jsonResponse({ ok: true }, 200, request, env);
}

async function handlePrepareAcceptOffer(request, env, offerId) {
    enforceAllowedOrigin(request, env, true);

    let payload;
    try {
        payload = await request.json();
    } catch {
        return jsonResponse({ error: 'Request body must be valid JSON.' }, 400, request, env);
    }

    const payloadInscriptionId = normalizeInscriptionId(payload?.inscriptionId || payload?.id);
    const authPayload = stripAuthEnvelope(payload);
    let auth;
    let payloadHash;

    try {
        auth = normalizeGenericActionAuth(payload?.auth, 'offer-accept-prepare');
        payloadHash = await hashManifestPayload(authPayload);
        validateGenericActionEnvelope(auth, payloadHash, 'offer-accept-prepare');
    } catch (error) {
        return jsonResponse({ error: formatErrorMessage(error) }, 400, request, env);
    }

    const storedChallenge = await env.getChallenge(auth.nonce);
    if (!storedChallenge) {
        return jsonResponse({ error: 'Offer acceptance challenge is missing or expired.' }, 401, request, env);
    }

    try {
        const challenge = normalizeStoredGenericChallenge(storedChallenge);
        validateGenericActionChallenge(challenge, auth, payloadHash, request, 'offer-accept-prepare');
    } catch (error) {
        return jsonResponse({ error: formatErrorMessage(error) }, 401, request, env);
    }

    let acceptanceContext;
    try {
        acceptanceContext = await resolveOfferAcceptanceContext(offerId, payloadInscriptionId, auth.address, env);
    } catch (error) {
        return jsonResponse({ error: formatErrorMessage(error) }, inferStatusCode(error), request, env);
    }

    const buyerSignedPsbt = normalizeBoundedString(acceptanceContext.target.buyerSignedPsbt || '', 120000);
    if (!buyerSignedPsbt) {
        return jsonResponse({ error: 'This offer does not contain a stored bid PSBT.' }, 409, request, env);
    }

    await env.deleteChallenge(auth.nonce);
    return jsonResponse({
        offerId: acceptanceContext.target.offerId,
        type: acceptanceContext.target.type,
        inscriptionId: acceptanceContext.acceptedInscriptionId,
        sellerAddress: normalizeAddress(acceptanceContext.target.sellerAddress),
        sellerPaymentsAddress: normalizeAddress(acceptanceContext.target.sellerPaymentsAddress),
        buyerSignedPsbt
    }, 200, request, env);
}

async function handleAcceptOffer(request, env, offerId) {
    enforceAllowedOrigin(request, env, true);

    let payload;
    try {
        payload = await request.json();
    } catch {
        return jsonResponse({ error: 'Request body must be valid JSON.' }, 400, request, env);
    }

    const manualTxid = normalizeHex(payload?.txid, 64);
    const signedPsbt = normalizeBoundedString(payload?.signedPsbt || payload?.sellerSignedPsbt || '', 200000);
    const payloadInscriptionId = normalizeInscriptionId(payload?.inscriptionId || payload?.id);
    if (!manualTxid && !signedPsbt) {
        return jsonResponse({ error: 'A broadcast transaction id is required.' }, 400, request, env);
    }

    const authPayload = stripAuthEnvelope(payload);
    let auth;
    let payloadHash;

    try {
        auth = normalizeGenericActionAuth(payload?.auth, 'offer-accept');
        payloadHash = await hashManifestPayload(authPayload);
        validateGenericActionEnvelope(auth, payloadHash, 'offer-accept');
    } catch (error) {
        return jsonResponse({ error: formatErrorMessage(error) }, 400, request, env);
    }

    const storedChallenge = await env.getChallenge(auth.nonce);
    if (!storedChallenge) {
        return jsonResponse({ error: 'Offer accept challenge is missing or expired.' }, 401, request, env);
    }

    try {
        const challenge = normalizeStoredGenericChallenge(storedChallenge);
        validateGenericActionChallenge(challenge, auth, payloadHash, request, 'offer-accept');
    } catch (error) {
        return jsonResponse({ error: formatErrorMessage(error) }, 401, request, env);
    }

    let acceptanceContext;
    try {
        acceptanceContext = await resolveOfferAcceptanceContext(offerId, payloadInscriptionId, auth.address, env);
    } catch (error) {
        return jsonResponse({ error: formatErrorMessage(error) }, inferStatusCode(error), request, env);
    }

    const { store, target, acceptedInscriptionId, acceptedAsset } = acceptanceContext;

    let txid = manualTxid;
    if (signedPsbt) {
        if (!target.buyerSignedPsbt) {
            return jsonResponse({ error: 'This offer does not contain a stored bid PSBT.' }, 409, request, env);
        }

        try {
            txid = await finalizeAcceptedOfferPsbt({
                buyerSignedPsbt: target.buyerSignedPsbt,
                signedPsbt,
                offer: target,
                inscriptionId: acceptedInscriptionId,
                env
            });
        } catch (error) {
            return jsonResponse({ error: formatErrorMessage(error) }, inferStatusCode(error), request, env);
        }
    }

    const nextStore = normalizeOffersStore({
        ...store,
        updatedAt: new Date().toISOString(),
        items: store.items.map((entry) => {
            if (entry.offerId === target.offerId) {
                return {
                    ...entry,
                    status: 'accepted',
                    updatedAt: new Date().toISOString(),
                    txid,
                    inscriptionId: acceptedInscriptionId,
                    name: normalizeOptionalString(acceptedAsset?.name || entry.name),
                    sellerAddress: auth.address,
                    sellerPaymentsAddress: normalizeAddress(entry.sellerPaymentsAddress || auth.address)
                };
            }

            if (entry.status !== 'open') {
                return entry;
            }

            if (entry.inscriptionId && entry.inscriptionId === acceptedInscriptionId) {
                return {
                    ...entry,
                    status: 'stale',
                    updatedAt: new Date().toISOString()
                };
            }

            return entry;
        })
    });

    await env.writeOffersStore(nextStore);
    try {
        await persistAcceptedOfferSale({
            offer: {
                ...target,
                txid,
                inscriptionId: acceptedInscriptionId,
                name: normalizeOptionalString(acceptedAsset?.name || target.name),
                sellerAddress: auth.address
            },
            env
        });
    } catch (error) {
        console.error('Failed to persist accepted offer sale:', error);
    }
    snapshotCache = null;
    await env.deleteChallenge(auth.nonce);
    return jsonResponse({
        ok: true,
        txid,
        inscriptionId: acceptedInscriptionId,
        name: normalizeOptionalString(acceptedAsset?.name || target.name),
        priceSats: normalizePositiveInteger(target.priceSats)
    }, 200, request, env);
}

async function resolveOfferAcceptanceContext(offerId, payloadInscriptionId, signerAddress, env) {
    const normalizedOfferId = normalizeOfferId(offerId);
    const normalizedSignerAddress = normalizeAddress(signerAddress);
    const store = await loadNormalizedOffersStore(env);
    const target = store.items.find((entry) => entry.offerId === normalizedOfferId);
    if (!target) {
        throw createHttpError(404, 'Offer not found.');
    }
    if (target.status !== 'open') {
        throw createHttpError(409, 'This offer is no longer open.');
    }

    if (target.type !== 'item') {
        throw createHttpError(409, 'Only item offers are supported.');
    }

    const acceptedInscriptionId = target.inscriptionId;
    if (!acceptedInscriptionId) {
        throw createHttpError(409, 'Item offers require an inscription id.');
    }
    if (payloadInscriptionId && payloadInscriptionId !== acceptedInscriptionId) {
        throw createHttpError(400, 'Accepted inscription does not match the item offer.');
    }
    const acceptedAsset = typeof env.getBoutiqueAsset === 'function'
        ? env.getBoutiqueAsset(acceptedInscriptionId)
        : null;

    const listingStore = await loadNormalizedStoredManifest(env);
    const activeListing = listingStore.items.find((entry) => entry.status === 'active' && entry.inscriptionId === acceptedInscriptionId);
    const activeListingPayoutAddress = normalizeAddress(
        activeListing?.sellerPaymentsAddress || activeListing?.listingData?.sellerPaymentsAddress
    );
    const storedOfferPayoutAddress = normalizeAddress(target.sellerPaymentsAddress || target.sellerAddress);
    const currentOwner = await resolveTrackedInscriptionOwner(acceptedInscriptionId, env).catch(() => null);
    const allowedAcceptors = new Set([
        normalizeAddress(activeListing?.sellerAddress),
        normalizeAddress(currentOwner?.address)
    ].filter(Boolean));

    if (!allowedAcceptors.has(normalizedSignerAddress)) {
        throw createHttpError(403, 'Only the current inscription owner can accept this offer.');
    }

    if (activeListingPayoutAddress && storedOfferPayoutAddress && activeListingPayoutAddress !== storedOfferPayoutAddress) {
        throw createHttpError(409, 'This offer was created with an outdated seller payout address and must be recreated.');
    }

    if (target.sellerAddress && normalizeAddress(target.sellerAddress) !== normalizedSignerAddress) {
        throw createHttpError(409, 'This item offer was targeted to a previous owner and can no longer be auto-accepted.');
    }

    return {
        store,
        target,
        acceptedInscriptionId,
        acceptedAsset
    };
}

async function handleGetProfile(request, env, address) {
    const normalizedAddress = normalizeAddress(address);
    if (!normalizedAddress) {
        return jsonResponse({ error: 'A wallet address is required.' }, 400, request, env);
    }

    const profilesStore = await loadNormalizedProfilesStore(env);
    return jsonResponse(profilesStore.items[normalizedAddress] || createEmptyProfile(normalizedAddress), 200, request, env);
}

async function handlePutProfile(request, env, address) {
    enforceAllowedOrigin(request, env, true);

    const normalizedAddress = normalizeAddress(address);
    if (!normalizedAddress) {
        return jsonResponse({ error: 'A wallet address is required.' }, 400, request, env);
    }

    let payload;
    try {
        payload = await request.json();
    } catch {
        return jsonResponse({ error: 'Request body must be valid JSON.' }, 400, request, env);
    }

    const profilePayload = stripAuthEnvelope(payload);
    let auth;
    let payloadHash;

    try {
        auth = normalizeGenericActionAuth(payload?.auth, 'profile-update');
        payloadHash = await hashManifestPayload(profilePayload);
        validateGenericActionEnvelope(auth, payloadHash, 'profile-update');
    } catch (error) {
        return jsonResponse({ error: formatErrorMessage(error) }, 400, request, env);
    }

    const storedChallenge = await env.getChallenge(auth.nonce);
    if (!storedChallenge) {
        return jsonResponse({ error: 'Profile authorization challenge is missing or expired.' }, 401, request, env);
    }

    try {
        const challenge = normalizeStoredGenericChallenge(storedChallenge);
        validateGenericActionChallenge(challenge, auth, payloadHash, request, 'profile-update');
    } catch (error) {
        return jsonResponse({ error: formatErrorMessage(error) }, 401, request, env);
    }

    if (normalizedAddress !== auth.address) {
        return jsonResponse({ error: 'Profile address does not match the signed wallet address.' }, 403, request, env);
    }

    const profilesStore = await loadNormalizedProfilesStore(env);
    let profile;
    try {
        profile = normalizeProfile({
            ...(profilesStore.items[normalizedAddress] || createEmptyProfile(normalizedAddress)),
            ...(profilePayload?.profile || profilePayload)
        }, auth);
    } catch (error) {
        return jsonResponse({ error: formatErrorMessage(error) }, 400, request, env);
    }

    const nextStore = normalizeProfilesStore({
        ...profilesStore,
        updatedAt: new Date().toISOString(),
        items: {
            ...profilesStore.items,
            [normalizedAddress]: profile
        }
    });

    await env.writeProfilesStore(nextStore);
    snapshotCache = null;
    await env.deleteChallenge(auth.nonce);
    return jsonResponse(profile, 200, request, env);
}

async function handleGetAddressPortfolio(request, env, address) {
    const normalizedAddress = normalizeAddress(address);
    if (!normalizedAddress) {
        return jsonResponse({ error: 'A wallet address is required.' }, 400, request, env);
    }

    const portfolio = await buildAddressPortfolio(normalizedAddress, env);
    return jsonResponse(portfolio, 200, request, env);
}

async function handleCreatePublishChallenge(request, env) {
    enforceAllowedOrigin(request, env, true);

    let payload;

    try {
        payload = await request.json();
    } catch {
        return jsonResponse({ error: 'Request body must be valid JSON.' }, 400, request, env);
    }

    let challengeRequest;

    try {
        challengeRequest = normalizeChallengeRequest(payload, env, request);
    } catch (error) {
        return jsonResponse({ error: formatErrorMessage(error) }, 400, request, env);
    }

    const challenge = {
        action: challengeRequest.action,
        nonce: randomHex(16),
        issuedAt: new Date().toISOString(),
        address: challengeRequest.sellerAddress,
        publicKey: challengeRequest.sellerPublicKey,
        payloadHash: challengeRequest.manifestHash,
        origin: challengeRequest.origin,
        walletProvider: challengeRequest.walletProvider,
        signatureMethod: challengeRequest.signatureMethod
    };

    const message = buildPublishAuthMessage({
        action: challenge.action,
        sellerAddress: challenge.address,
        sellerPublicKey: challenge.publicKey,
        manifestHash: challenge.payloadHash,
        nonce: challenge.nonce,
        issuedAt: challenge.issuedAt,
        origin: challenge.origin,
        walletProvider: challenge.walletProvider,
        signatureMethod: challenge.signatureMethod
    });

    await env.setChallenge(challenge.nonce, {
        ...challenge,
        message
    });

    return jsonResponse(
        {
            action: challenge.action,
            nonce: challenge.nonce,
            issuedAt: challenge.issuedAt,
            expiresAt: new Date(Date.now() + AUTH_CHALLENGE_TTL_SECONDS * 1000).toISOString(),
            message,
            walletProvider: challenge.walletProvider,
            signatureMethod: challenge.signatureMethod
        },
        200,
        request,
        env
    );
}

async function handleCreateBroadcastChallenge(request, env) {
    enforceAllowedOrigin(request, env, true);

    let payload;

    try {
        payload = await request.json();
    } catch {
        return jsonResponse({ error: 'Request body must be valid JSON.' }, 400, request, env);
    }

    let challengeRequest;

    try {
        challengeRequest = normalizeBroadcastChallengeRequest(payload, request);
    } catch (error) {
        return jsonResponse({ error: formatErrorMessage(error) }, 400, request, env);
    }

    try {
        await validateBroadcastCheckout(challengeRequest.rawHex, challengeRequest.buyerAddress, env, {
            buyerOrdinalsAddress: challengeRequest.buyerOrdinalsAddress
        });
    } catch (error) {
        return jsonResponse({ error: formatErrorMessage(error) }, inferStatusCode(error), request, env);
    }

    const challenge = {
        challengeType: 'broadcast',
        nonce: randomHex(16),
        issuedAt: new Date().toISOString(),
        buyerAddress: challengeRequest.buyerAddress,
        buyerPublicKey: challengeRequest.buyerPublicKey,
        buyerOrdinalsAddress: challengeRequest.buyerOrdinalsAddress,
        txid: challengeRequest.txid,
        origin: challengeRequest.origin,
        walletProvider: challengeRequest.walletProvider,
        signatureMethod: challengeRequest.signatureMethod
    };

    const message = buildBroadcastAuthMessage(challenge);

    await env.setChallenge(challenge.nonce, {
        ...challenge,
        message
    });

    return jsonResponse(
        {
            nonce: challenge.nonce,
            issuedAt: challenge.issuedAt,
            expiresAt: new Date(Date.now() + AUTH_CHALLENGE_TTL_SECONDS * 1000).toISOString(),
            message,
            txid: challenge.txid,
            walletProvider: challenge.walletProvider,
            signatureMethod: challenge.signatureMethod,
            buyerOrdinalsAddress: challenge.buyerOrdinalsAddress
        },
        200,
        request,
        env
    );
}

async function handleGetBtcUsdQuote(request, env) {
    const quote = await fetchBtcUsdQuote();
    return jsonResponse(quote, 200, request, env);
}

async function handleGetInscriptionDetails(request, env, inscriptionId) {
    const details = await fetchInscriptionDetails(inscriptionId, env);
    return jsonResponse(details, 200, request, env);
}

async function handlePublishListings(request, env) {
    enforceAllowedOrigin(request, env, true);

    let payload;

    try {
        payload = await request.json();
    } catch {
        return jsonResponse({ error: 'Request body must be valid JSON.' }, 400, request, env);
    }

    const manifestPayload = stripAuthEnvelope(payload);

    let auth;
    let manifestHash;

    try {
        auth = normalizePublishAuth(payload?.auth, env);
        manifestHash = await hashManifestPayload(manifestPayload);
        validatePublishAuthEnvelope(auth, manifestHash);
    } catch (error) {
        return jsonResponse({ error: formatErrorMessage(error) }, 400, request, env);
    }

    const storedChallenge = await env.getChallenge(auth.nonce);
    if (!storedChallenge) {
        return jsonResponse({ error: 'Publish authorization challenge is missing or expired.' }, 401, request, env);
    }

    let challenge;

    try {
        challenge = normalizeStoredChallenge(storedChallenge, env);
        validatePublishChallenge(challenge, auth, manifestHash, request);
    } catch (error) {
        return jsonResponse({ error: formatErrorMessage(error) }, 401, request, env);
    }

    let manifest;

    try {
        manifest = normalizeManifest(manifestPayload, env, challenge.sellerAddress);
        await validateManifestListings(manifest, env);
    } catch (error) {
        return jsonResponse({ error: formatErrorMessage(error) }, inferStatusCode(error), request, env);
    }

    const currentStore = await loadNormalizedStoredManifest(env);
    const nextManifest = await mergePublishedListings(currentStore, manifest, challenge.sellerAddress, {
        env,
        collectionId: normalizeCollectionId(manifestPayload?.collectionId || manifestPayload?.collection),
        replaceMissing: Boolean(manifestPayload?.replaceMissing || String(manifestPayload?.mode || '').trim().toLowerCase() === 'replace-seller')
    });

    await env.writeManifest(nextManifest);
    snapshotCache = null;
    await env.deleteChallenge(auth.nonce);
    return jsonResponse(nextManifest, 200, request, env);
}

async function handleGetTransactionHex(request, env, txid) {
    enforceAllowedOrigin(request, env, false);

    const hex = await env.fetchTransactionHex(txid);
    return new Response(hex, {
        status: 200,
        headers: {
            ...TEXT_HEADERS,
            ...buildCorsHeaders(request, env)
        }
    });
}

async function handleGetOutspend(request, env, txid, index) {
    enforceAllowedOrigin(request, env, false);

    const spent = await env.checkOutputSpent(txid, index);
    return jsonResponse({ spent }, 200, request, env);
}

async function handleGetAddressUtxos(request, env, address) {
    enforceAllowedOrigin(request, env, false);

    const utxos = await env.fetchAddressUtxos(address);
    return jsonResponse(utxos, 200, request, env);
}

async function handleGetRecommendedFees(request, env) {
    enforceAllowedOrigin(request, env, false);

    const fees = await env.fetchRecommendedFees();
    return jsonResponse(fees, 200, request, env);
}

async function handleBroadcastTransaction(request, env) {
    enforceAllowedOrigin(request, env, true);

    let payload;

    try {
        payload = await request.json();
    } catch {
        return jsonResponse({ error: 'Request body must be valid JSON.' }, 400, request, env);
    }

    const rawHex = normalizeTransactionHex(payload?.rawHex);
    if (!rawHex) {
        return jsonResponse({ error: 'A valid raw transaction hex string is required.' }, 400, request, env);
    }

    let auth;

    try {
        auth = normalizeBroadcastAuth(payload?.auth);
    } catch (error) {
        return jsonResponse({ error: formatErrorMessage(error) }, 400, request, env);
    }

    const storedChallenge = await env.getChallenge(auth.nonce);
    if (!storedChallenge) {
        return jsonResponse({ error: 'Broadcast authorization challenge is missing or expired.' }, 401, request, env);
    }

    let challenge;

    try {
        challenge = normalizeStoredBroadcastChallenge(storedChallenge);
        validateBroadcastChallenge(challenge, auth, rawHex, request);
    } catch (error) {
        return jsonResponse({ error: formatErrorMessage(error) }, 401, request, env);
    }

    let checkoutContext;

    try {
        checkoutContext = await validateBroadcastCheckout(rawHex, auth.buyerAddress, env, {
            buyerOrdinalsAddress: auth.buyerOrdinalsAddress
        });
    } catch (error) {
        return jsonResponse({ error: formatErrorMessage(error) }, inferStatusCode(error), request, env);
    }

    await env.deleteChallenge(auth.nonce);
    const txid = await env.broadcastTransaction(rawHex);

    try {
        await persistBroadcastSale(checkoutContext, txid, env);
    } catch (error) {
        console.error('Failed to persist boutique sales activity:', error);
    }

    return new Response(txid, {
        status: 200,
        headers: {
            ...TEXT_HEADERS,
            ...buildCorsHeaders(request, env)
        }
    });
}

function normalizeManifest(payload, env, expectedSellerAddress = '') {
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
        throw new Error('Manifest payload must be an object.');
    }

    const sellerAddress = normalizeAddress(payload.sellerAddress || payload.address || payload.walletAddress || expectedSellerAddress);
    const defaultCollectionId = normalizeCollectionId(payload.collectionId || payload.collection);
    const walletProvider = normalizeWalletProvider(payload.walletProvider || payload.provider);
    const signatureMethod = normalizeSignatureMethod(payload.signatureMethod || payload.signatureType || payload.scheme) || 'ecdsa';
    const items = Array.isArray(payload.items)
        ? payload.items
        : Array.isArray(payload.listings)
            ? payload.listings
            : [];

    if (items.length > MAX_ITEMS) {
        throw new Error(`A maximum of ${MAX_ITEMS} live listings is supported.`);
    }

    const seenIds = new Set();
    const normalizedItems = items.map((item) => {
        const normalizedItem = normalizeListingItem(item, {
            env,
            manifestSellerAddress: sellerAddress,
            expectedSellerAddress,
            defaultCollectionId,
            walletProvider,
            signatureMethod
        });
        if (seenIds.has(normalizedItem.inscriptionId)) {
            throw new Error(`Duplicate inscription ID: ${normalizedItem.inscriptionId}`);
        }

        seenIds.add(normalizedItem.inscriptionId);
        return normalizedItem;
    });

    return {
        version: 2,
        updatedAt: normalizeIsoDate(payload.updatedAt || payload.generatedAt) || new Date().toISOString(),
        items: normalizedItems
    };
}

function normalizeChallengeRequest(payload, env, request) {
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
        throw new Error('Challenge request must be an object.');
    }

    const action = normalizeSignableAction(payload.action || payload.authAction || BOUTIQUE_AUTH_ACTION);
    const sellerAddress = normalizeAddress(payload.sellerAddress || payload.address || payload.walletAddress);
    const sellerPublicKey = normalizeAuthPublicKey(payload.sellerPublicKey || payload.publicKey || payload.walletPublicKey);
    const manifestHash = normalizeHex(payload.manifestHash || payload.payloadHash, 64);
    const walletProvider = normalizeWalletProvider(payload.walletProvider || payload.provider);
    const signatureMethod = normalizeSignatureMethod(payload.signatureMethod || payload.signatureType || payload.scheme);
    const origin = normalizeOrigin(request.headers.get('Origin'));

    if (!action) {
        throw new Error('A supported authorization action is required.');
    }

    if (!sellerAddress) {
        throw new Error('A seller address is required.');
    }

    if (!sellerPublicKey) {
        throw new Error('A seller public key is required.');
    }

    if (!manifestHash) {
        throw new Error('A manifest hash is required.');
    }

    if (!signatureMethod) {
        throw new Error('A supported signature method is required.');
    }

    if (!publicKeyMatchesAddress(sellerPublicKey, sellerAddress)) {
        throw new Error('Seller public key does not control the connected seller address.');
    }

    return {
        action,
        sellerAddress,
        sellerPublicKey,
        manifestHash,
        origin,
        walletProvider,
        signatureMethod
    };
}

function normalizePublishAuth(auth, env) {
    const authPayload = normalizeGenericActionAuth(auth, BOUTIQUE_AUTH_ACTION);

    return {
        action: authPayload.action,
        sellerAddress: authPayload.address,
        sellerPublicKey: authPayload.publicKey,
        manifestHash: authPayload.payloadHash,
        nonce: authPayload.nonce,
        issuedAt: authPayload.issuedAt,
        message: authPayload.message,
        signature: authPayload.signature,
        walletProvider: authPayload.walletProvider,
        signatureMethod: authPayload.signatureMethod
    };
}

function normalizeBroadcastChallengeRequest(payload, request) {
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
        throw new Error('Broadcast challenge request must be an object.');
    }

    const buyerAddress = normalizeAddress(payload.buyerAddress ?? payload.address);
    const buyerPublicKey = normalizeAuthPublicKey(payload.buyerPublicKey ?? payload.publicKey);
    const buyerOrdinalsAddress = normalizeAddress(payload.buyerOrdinalsAddress ?? payload.ordinalsAddress ?? buyerAddress);
    const walletProvider = normalizeWalletProvider(payload.walletProvider || payload.provider);
    const signatureMethod = normalizeSignatureMethod(payload.signatureMethod || payload.signatureType || payload.scheme);
    const rawHex = normalizeTransactionHex(payload.rawHex);
    const origin = normalizeOrigin(request.headers.get('Origin'));

    if (!buyerAddress || !buyerPublicKey) {
        throw new Error('A buyer address and public key are required.');
    }

    if (!rawHex) {
        throw new Error('A valid raw transaction hex string is required.');
    }

    if (!signatureMethod) {
        throw new Error('A supported signature method is required.');
    }

    if (!publicKeyMatchesAddress(buyerPublicKey, buyerAddress)) {
        throw new Error('Buyer public key does not control the connected wallet address.');
    }

    return {
        buyerAddress,
        buyerPublicKey,
        buyerOrdinalsAddress,
        walletProvider,
        signatureMethod,
        rawHex,
        txid: parseTransactionId(rawHex),
        origin
    };
}

function normalizeBroadcastAuth(auth) {
    if (!auth || typeof auth !== 'object' || Array.isArray(auth)) {
        throw new Error('Broadcast authorization is required.');
    }

    const buyerAddress = normalizeAddress(auth.buyerAddress ?? auth.address);
    const buyerPublicKey = normalizeAuthPublicKey(auth.buyerPublicKey ?? auth.publicKey);
    const buyerOrdinalsAddress = normalizeAddress(auth.buyerOrdinalsAddress ?? auth.ordinalsAddress ?? buyerAddress);
    const walletProvider = normalizeWalletProvider(auth.walletProvider || auth.provider);
    const signatureMethod = normalizeSignatureMethod(auth.signatureMethod || auth.signatureType || auth.scheme);
    const txid = normalizeHex(auth.txid, 64);
    const nonce = normalizeHex(auth.nonce, [24, 32, 40, 48, 64]);
    const issuedAt = normalizeIsoDate(auth.issuedAt);
    const message = normalizeBoundedString(auth.message, 1024);
    const signature = normalizeBoundedString(auth.signature, 1024);

    if (!buyerAddress || !buyerPublicKey || !txid || !nonce || !issuedAt || !message || !signature || !signatureMethod) {
        throw new Error('Broadcast authorization is incomplete.');
    }

    if (!publicKeyMatchesAddress(buyerPublicKey, buyerAddress)) {
        throw new Error('Broadcast authorization public key does not control the connected wallet address.');
    }

    return {
        buyerAddress,
        buyerPublicKey,
        buyerOrdinalsAddress,
        walletProvider,
        signatureMethod,
        txid,
        nonce,
        issuedAt,
        message,
        signature
    };
}

function normalizeStoredChallenge(payload, env) {
    const challenge = normalizeStoredGenericChallenge(payload);

    if (challenge.action !== BOUTIQUE_AUTH_ACTION) {
        throw new Error('Stored publish challenge action is invalid.');
    }

    return {
        action: challenge.action,
        sellerAddress: challenge.address,
        sellerPublicKey: challenge.publicKey,
        manifestHash: challenge.payloadHash,
        nonce: challenge.nonce,
        issuedAt: challenge.issuedAt,
        message: challenge.message,
        origin: challenge.origin,
        walletProvider: challenge.walletProvider,
        signatureMethod: challenge.signatureMethod
    };
}

function normalizeStoredBroadcastChallenge(payload) {
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
        throw new Error('Stored broadcast challenge is invalid.');
    }

    const challengeType = normalizeBoundedString(payload.challengeType, 32);
    const buyerAddress = normalizeAddress(payload.buyerAddress);
    const buyerPublicKey = normalizeAuthPublicKey(payload.buyerPublicKey);
    const buyerOrdinalsAddress = normalizeAddress(payload.buyerOrdinalsAddress ?? payload.ordinalsAddress ?? buyerAddress);
    const walletProvider = normalizeWalletProvider(payload.walletProvider || payload.provider);
    const signatureMethod = normalizeSignatureMethod(payload.signatureMethod || payload.signatureType || payload.scheme);
    const txid = normalizeHex(payload.txid, 64);
    const nonce = normalizeHex(payload.nonce, [24, 32, 40, 48, 64]);
    const issuedAt = normalizeIsoDate(payload.issuedAt);
    const message = normalizeBoundedString(payload.message, 1024);
    const origin = normalizeOrigin(payload.origin);

    if (challengeType !== 'broadcast') {
        throw new Error('Stored broadcast challenge type is invalid.');
    }

    if (!buyerAddress || !buyerPublicKey || !txid || !nonce || !issuedAt || !message || !signatureMethod) {
        throw new Error('Stored broadcast challenge is incomplete.');
    }

    return {
        buyerAddress,
        buyerPublicKey,
        buyerOrdinalsAddress,
        walletProvider,
        signatureMethod,
        txid,
        nonce,
        issuedAt,
        message,
        origin
    };
}

function validatePublishAuthEnvelope(auth, manifestHash) {
    validateGenericActionEnvelope({
        ...auth,
        action: auth.action || BOUTIQUE_AUTH_ACTION,
        payloadHash: auth.manifestHash
    }, manifestHash, BOUTIQUE_AUTH_ACTION);
}

function validatePublishChallenge(challenge, auth, manifestHash, request) {
    validateGenericActionChallenge({
        ...challenge,
        action: challenge.action || BOUTIQUE_AUTH_ACTION,
        address: challenge.sellerAddress,
        publicKey: challenge.sellerPublicKey,
        payloadHash: challenge.manifestHash
    }, {
        ...auth,
        action: auth.action || BOUTIQUE_AUTH_ACTION,
        address: auth.sellerAddress,
        publicKey: auth.sellerPublicKey,
        payloadHash: auth.manifestHash
    }, manifestHash, request, BOUTIQUE_AUTH_ACTION);
}

function validateBroadcastChallenge(challenge, auth, rawHex, request) {
    const origin = normalizeOrigin(request.headers.get('Origin'));
    const txid = parseTransactionId(rawHex);
    const expectedMessage = buildBroadcastAuthMessage({
        buyerAddress: challenge.buyerAddress,
        buyerPublicKey: challenge.buyerPublicKey,
        buyerOrdinalsAddress: challenge.buyerOrdinalsAddress,
        txid: challenge.txid,
        nonce: challenge.nonce,
        issuedAt: challenge.issuedAt,
        origin: challenge.origin,
        walletProvider: challenge.walletProvider,
        signatureMethod: challenge.signatureMethod
    });

    if (challenge.nonce !== auth.nonce) {
        throw new Error('Broadcast authorization nonce does not match the stored challenge.');
    }

    if (challenge.buyerAddress !== auth.buyerAddress || challenge.buyerPublicKey !== auth.buyerPublicKey) {
        throw new Error('Broadcast authorization signer does not match the stored challenge.');
    }

    if (challenge.buyerOrdinalsAddress !== auth.buyerOrdinalsAddress) {
        throw new Error('Broadcast authorization ordinals receive address does not match the stored challenge.');
    }

    if (challenge.walletProvider !== auth.walletProvider || challenge.signatureMethod !== auth.signatureMethod) {
        throw new Error('Broadcast authorization wallet signature metadata does not match the stored challenge.');
    }

    if (challenge.txid !== auth.txid || challenge.txid !== txid) {
        throw new Error('Broadcast authorization does not match the submitted transaction.');
    }

    if (challenge.origin && challenge.origin !== origin) {
        throw new Error('Broadcast authorization origin does not match this storefront.');
    }

    if (auth.message !== expectedMessage || challenge.message !== expectedMessage) {
        throw new Error('Broadcast authorization message does not match the stored challenge.');
    }

    if (!verifySignedAuthorization(auth.buyerAddress, auth.buyerPublicKey, auth.signatureMethod, expectedMessage, auth.signature)) {
        throw new Error('Broadcast authorization signature is invalid.');
    }
}

function normalizeListingItem(item, context = {}) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
        throw new Error('Each listing item must be an object.');
    }

    const inscriptionId = normalizeInscriptionId(item.inscriptionId || item.id);
    const asset = typeof context.env?.getBoutiqueAsset === 'function'
        ? context.env.getBoutiqueAsset(inscriptionId)
        : null;
    const collectionId = normalizeCollectionId(item.collectionId || item.collection || asset?.collectionId || context.defaultCollectionId);
    const collection = getCatalogCollection(context.env, collectionId);
    const status = normalizeListingStatus(item.status || (item.active === false ? 'cancelled' : 'active'));
    const name = normalizeOptionalString(item.name || asset?.name);
    const sellerAddress = normalizeAddress(
        item.sellerAddress
        || item.sellerOrdinalsAddress
        || item?.listingData?.sellerOrdinalsSigner?.address
        || context.manifestSellerAddress
        || context.expectedSellerAddress
    );
    const sellerPaymentsAddress = normalizeAddress(item.sellerPaymentsAddress || item?.listingData?.sellerPaymentsAddress);
    const createdAt = normalizeIsoDate(item.createdAt) || new Date().toISOString();
    const updatedAt = normalizeIsoDate(item.updatedAt) || createdAt;
    const walletProvider = normalizeWalletProvider(item.walletProvider || context.walletProvider);
    const signatureMethod = normalizeSignatureMethod(item.signatureMethod || context.signatureMethod) || 'ecdsa';

    if (!inscriptionId) {
        throw new Error('Each listing item requires an inscription ID.');
    }

    if (!collectionId || !collection) {
        throw new Error(`Listing ${inscriptionId} does not belong to a tracked boutique collection.`);
    }

    if (!sellerAddress) {
        throw new Error(`Listing ${inscriptionId} requires a seller ordinals address.`);
    }

    if (context.expectedSellerAddress && sellerAddress !== context.expectedSellerAddress) {
        throw new Error(`Listing ${inscriptionId} does not match the publish authorization signer.`);
    }

    const baseRecord = {
        listingId: normalizeListingId(item.listingId || item.id || inscriptionId) || inscriptionId,
        collectionId,
        collectionName: normalizeOptionalString(item.collectionName || asset?.collectionName || collection.name),
        inscriptionId,
        name,
        sellerAddress,
        sellerPaymentsAddress,
        walletProvider,
        signatureMethod,
        status,
        createdAt,
        updatedAt
    };

    if (status !== 'active') {
        return {
            ...baseRecord,
            priceSats: normalizePositiveInteger(item.priceSats || item?.listingData?.price),
            sellerSignedPsbt: normalizeBoundedString(item.sellerSignedPsbt, 50000),
            listingData: item.listingData && typeof item.listingData === 'object' ? item.listingData : null,
            utxo: item.utxo && typeof item.utxo === 'object' ? normalizeUtxo(item.utxo, inscriptionId) : null
        };
    }

    const priceSats = normalizePositiveInteger(item.priceSats || item?.listingData?.price);
    const sellerSignedPsbt = normalizeBoundedString(item.sellerSignedPsbt, 50000);
    const utxo = normalizeUtxo(item.utxo, inscriptionId);
    const listingData = normalizeListingData(item.listingData, inscriptionId, priceSats, sellerAddress);

    if (!priceSats) {
        throw new Error(`Listing ${inscriptionId} requires a positive price.`);
    }

    if (!sellerSignedPsbt) {
        throw new Error(`Listing ${inscriptionId} is missing the seller-signed PSBT.`);
    }

    return {
        ...baseRecord,
        priceSats,
        sellerPaymentsAddress: listingData.sellerPaymentsAddress,
        sellerSignedPsbt,
        listingData,
        utxo
    };
}

function normalizeSalesActivity(payload, env) {
    const items = Array.isArray(payload?.items)
        ? payload.items
        : Array.isArray(payload?.sales)
            ? payload.sales
            : [];
    const byTxid = new Map();

    items.forEach((entry) => {
        const normalizedEntry = normalizeSaleRecord(entry, env);
        if (!normalizedEntry) {
            return;
        }

        const key = `${normalizedEntry.txid}:${normalizedEntry.inscriptionId}`;
        if (byTxid.has(key)) {
            return;
        }

        byTxid.set(key, normalizedEntry);
    });

    const normalizedItems = Array.from(byTxid.values())
        .sort((left, right) => compareIsoDatesDescending(left.occurredAt, right.occurredAt))
        .slice(0, MAX_ITEMS);

    return {
        version: 2,
        updatedAt: normalizeIsoDate(payload?.updatedAt) || normalizedItems[0]?.occurredAt || '',
        items: normalizedItems
    };
}

function normalizeSaleRecord(entry, env) {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
        return null;
    }

    try {
        const inscriptionId = normalizeInscriptionId(entry.inscriptionId || entry.id);
        const asset = typeof env?.getBoutiqueAsset === 'function'
            ? env.getBoutiqueAsset(inscriptionId)
            : null;
        const collectionId = normalizeCollectionId(entry.collectionId || entry.collection || asset?.collectionId);
        const txid = normalizeHex(entry.txid, 64);
        const priceSats = normalizePositiveInteger(entry.priceSats || entry.price);
        const occurredAt = normalizeIsoDate(entry.occurredAt || entry.soldAt || entry.timestamp || entry.createdAt);
        const buyerAddress = normalizeAddress(entry.buyerAddress);
        const buyerPaymentsAddress = normalizeAddress(entry.buyerPaymentsAddress);
        const sellerAddress = normalizeAddress(entry.sellerAddress);
        const sellerPaymentsAddress = normalizeAddress(entry.sellerPaymentsAddress);
        const name = normalizeOptionalString(entry.name || asset?.name);

        if (!inscriptionId || !collectionId || !txid || !priceSats || !occurredAt) {
            return null;
        }

        return {
            txid,
            inscriptionId,
            collectionId,
            collectionName: normalizeOptionalString(entry.collectionName || asset?.collectionName || getCatalogCollection(env, collectionId)?.name),
            priceSats,
            occurredAt,
            buyerAddress,
            buyerPaymentsAddress,
            sellerAddress,
            sellerPaymentsAddress,
            marketplace: normalizeOptionalString(entry.marketplace || 'Blok Boutique'),
            ...(name ? { name } : {})
        };
    } catch {
        return null;
    }
}

function isMarketplaceSalesMergeEnabled(collectionId) {
    return useLocalBoutiqueSalesHistory(collectionId);
}

function useLocalCollectionStats(collectionId) {
    return useLocalBoutiqueSalesHistory(collectionId);
}

function useLocalBoutiqueSalesHistory(collectionId) {
    return normalizeCollectionId(collectionId) === 'art-drops';
}

function summarizeMarketplaceSales(sales) {
    const normalizedSales = Array.isArray(sales) ? sales : [];
    const now = Date.now();
    const dayAgo = now - 86_400_000;
    let totalSats = 0;
    let volume24hSats = 0;

    for (const sale of normalizedSales) {
        const priceSats = normalizePositiveInteger(sale?.priceSats);
        if (!priceSats) {
            continue;
        }

        totalSats += priceSats;
        const occurredAtMs = Date.parse(String(sale?.occurredAt || '').trim());
        if (Number.isFinite(occurredAtMs) && occurredAtMs >= dayAgo) {
            volume24hSats += priceSats;
        }
    }

    return {
        totalSats,
        volume24hSats
    };
}

async function countUniqueTrackedOwners(collectionId, env) {
    if (!useLocalCollectionStats(collectionId)) {
        return null;
    }

    const assets = Array.isArray(env?.listBoutiqueAssets?.(collectionId))
        ? env.listBoutiqueAssets(collectionId)
        : [];
    if (!assets.length) {
        return 0;
    }

    const ownerAddresses = await mapWithConcurrency(assets, 4, async (asset) => {
        const localSnapshot = await fetchLocalOrdInscriptionSnapshot(asset?.id, env).catch(() => null);
        const localOwnerAddress = normalizeAddress(localSnapshot?.ownerAddress);
        if (localOwnerAddress) {
            return localOwnerAddress;
        }

        const owner = await resolveTrackedInscriptionOwner(asset?.id, env).catch(() => null);
        return normalizeAddress(owner?.address);
    });

    return new Set(ownerAddresses.filter(Boolean)).size;
}

function mergeHistoricalAndMarketplaceSales(collectionId, payload = {}) {
    const historicalRecordSales = Array.isArray(payload.recordSales) ? payload.recordSales : [];
    const historicalRecentSales = Array.isArray(payload.recentSalesActivity) ? payload.recentSalesActivity : [];
    const marketplaceSales = Array.isArray(payload.marketplaceSales) ? payload.marketplaceSales : [];

    if (!isMarketplaceSalesMergeEnabled(collectionId)) {
        return {
            recordSales: historicalRecordSales,
            recentSalesActivity: historicalRecentSales
        };
    }

    const mergedRecordSales = dedupeSaleRecords([
        ...marketplaceSales,
        ...historicalRecordSales
    ])
        .sort((left, right) => Number(right?.priceSats || 0) - Number(left?.priceSats || 0))
        .slice(0, 3);

    const mergedRecentSalesActivity = dedupeSaleRecords([
        ...marketplaceSales,
        ...historicalRecentSales
    ])
        .sort((left, right) => compareIsoDatesDescending(left?.occurredAt, right?.occurredAt))
        .slice(0, 16);

    return {
        recordSales: mergedRecordSales,
        recentSalesActivity: mergedRecentSalesActivity
    };
}

function deriveRecordSalesFromHistory(records) {
    return dedupeSaleRecords(Array.isArray(records) ? records : [])
        .filter((record) => normalizePositiveInteger(record?.priceSats || record?.price) > 0)
        .sort((left, right) => {
            const priceDelta = Number(right?.priceSats || right?.price || 0) - Number(left?.priceSats || left?.price || 0);
            if (priceDelta !== 0) {
                return priceDelta;
            }

            const dateDelta = compareIsoDatesDescending(left?.occurredAt || left?.timestamp || left?.createdAt, right?.occurredAt || right?.timestamp || right?.createdAt);
            if (dateDelta !== 0) {
                return dateDelta;
            }

            return String(left?.inscriptionId || '').localeCompare(String(right?.inscriptionId || ''));
        })
        .slice(0, 3)
        .map((record) => cloneJsonValue(record));
}

function buildPreviousSaleLookup(records) {
    const lookup = new Map();
    const sorted = dedupeSaleRecords(Array.isArray(records) ? records : [])
        .filter((record) => normalizePositiveInteger(record?.priceSats || record?.price) > 0)
        .sort((left, right) => compareIsoDatesDescending(left?.occurredAt || left?.timestamp || left?.createdAt, right?.occurredAt || right?.timestamp || right?.createdAt));

    for (const record of sorted) {
        const normalizedInscriptionId = normalizeInscriptionId(record?.inscriptionId || record?.id);
        if (!normalizedInscriptionId || lookup.has(normalizedInscriptionId)) {
            continue;
        }

        lookup.set(normalizedInscriptionId, cloneJsonValue(record));
    }

    return lookup;
}

function dedupeSaleRecords(records) {
    const bestByKey = new Map();
    for (const record of Array.isArray(records) ? records : []) {
        if (!record || typeof record !== 'object') {
            continue;
        }

        const inscriptionId = normalizeInscriptionId(record.inscriptionId || record.id);
        const txid = normalizeHex(record.txid, 64);
        const priceSats = normalizePositiveInteger(record.priceSats || record.price);
        const occurredAt = normalizeIsoDate(record.occurredAt || record.soldAt || record.timestamp || record.createdAt);
        const key = txid
            ? `${inscriptionId}|${txid}|${priceSats || 0}`
            : `${inscriptionId}|${occurredAt}|${priceSats || 0}`;

        if (!key) {
            continue;
        }

        const current = bestByKey.get(key);
        if (!current || scoreSaleRecord(record) > scoreSaleRecord(current)) {
            bestByKey.set(key, record);
        }
    }

    return Array.from(bestByKey.values());
}

function scoreSaleRecord(record) {
    let score = 0;
    if (normalizeHex(record?.txid, 64)) score += 4;
    if (normalizeIsoDate(record?.occurredAt || record?.timestamp || record?.createdAt)) score += 3;
    if (normalizeAddress(record?.sellerAddress)) score += 2;
    if (normalizeAddress(record?.buyerAddress)) score += 2;
    if (normalizeOptionalString(record?.name)) score += 1;
    if (normalizeOptionalString(record?.marketplace)) score += 1;
    return score;
}

function compareIsoDatesDescending(left, right) {
    const leftTime = new Date(left || '').getTime();
    const rightTime = new Date(right || '').getTime();
    const normalizedLeftTime = Number.isFinite(leftTime) ? leftTime : 0;
    const normalizedRightTime = Number.isFinite(rightTime) ? rightTime : 0;
    return normalizedRightTime - normalizedLeftTime;
}

function normalizeListingData(listingData, inscriptionId, priceSats, expectedSellerAddress = '') {
    if (!listingData || typeof listingData !== 'object' || Array.isArray(listingData)) {
        throw new Error(`Listing ${inscriptionId} is missing listing data.`);
    }

    const normalizedInscriptionId = normalizeInscriptionId(listingData.inscriptionId);
    const price = normalizePositiveInteger(listingData.price || priceSats);
    const sellerPaymentsAddress = normalizeAddress(listingData.sellerPaymentsAddress || expectedSellerAddress);
    const sellerOrdinalsSigner = listingData.sellerOrdinalsSigner;
    const signerAddress = normalizeAddress(sellerOrdinalsSigner?.address);
    const signerPublicKey = normalizeListingPublicKey(sellerOrdinalsSigner?.publicKey);

    if (normalizedInscriptionId !== inscriptionId) {
        throw new Error(`Listing ${inscriptionId} has mismatched listing data.`);
    }

    if (!price) {
        throw new Error(`Listing ${inscriptionId} has an invalid price.`);
    }

    if (!sellerPaymentsAddress) {
        throw new Error(`Listing ${inscriptionId} is missing a seller payment address.`);
    }

    if (!signerAddress || !signerPublicKey) {
        throw new Error(`Listing ${inscriptionId} is missing seller signer information.`);
    }

    if (expectedSellerAddress && signerAddress !== expectedSellerAddress) {
        throw new Error(`Listing ${inscriptionId} does not match the manifest seller address.`);
    }

    if (!publicKeyMatchesAddress(signerPublicKey, signerAddress)) {
        throw new Error(`Listing ${inscriptionId} signer public key does not control the seller address.`);
    }

    return {
        inscriptionId,
        sellerOrdinalsSigner: {
            address: signerAddress,
            publicKey: signerPublicKey
        },
        sellerPaymentsAddress,
        price
    };
}

async function validateManifestListings(manifest, env) {
    for (const item of manifest.items) {
        if (item.status !== 'active') {
            continue;
        }

        await validateListingAgainstNodes(item, env);
    }
}

async function validateBroadcastCheckout(rawHex, buyerAddress, env, options = {}) {
    const transaction = decodeTransaction(rawHex);
    const manifest = await loadNormalizedStoredManifest(env);
    const matches = findTransactionListingMatches(transaction, manifest);

    if (matches.length === 0) {
        throw createHttpError(409, 'Checkout transaction does not match any active boutique listing.');
    }

    if (matches.length > 1) {
        throw createHttpError(400, 'Checkout transaction includes multiple listings, which this storefront does not support.');
    }

    const match = matches[0];
    await validateListingAgainstNodes(match.item, env);

    const inputValues = await fetchTransactionInputValues(transaction, match, env);
    const buyerOrdinalsAddress = normalizeAddress(options.buyerOrdinalsAddress || buyerAddress);
    validateCheckoutRecipients(transaction, match.item, match.inputIndex, buyerAddress, buyerOrdinalsAddress);
    validateCheckoutCarrierOutput(transaction, match.item, match.inputIndex, buyerOrdinalsAddress, inputValues);
    await validateCheckoutFee(transaction, inputValues, env);

    return {
        transaction,
        manifest,
        match,
        buyerAddress: normalizeAddress(buyerAddress),
        buyerOrdinalsAddress
    };
}

async function loadNormalizedStoredManifest(env) {
    const stored = await env.readManifest();
    if (!stored) {
        return EMPTY_MANIFEST;
    }

    let manifest;

    try {
        manifest = JSON.parse(stored);
    } catch {
        throw createHttpError(503, 'Live listings manifest could not be decoded.');
    }

    if (!Array.isArray(manifest?.items) && !Array.isArray(manifest?.listings)) {
        return EMPTY_MANIFEST;
    }

    return normalizeManifest(manifest, env);
}

async function loadNormalizedStoredSalesActivity(env) {
    if (typeof env.readSalesActivity !== 'function') {
        return EMPTY_SALES_ACTIVITY;
    }

    const stored = await env.readSalesActivity();
    if (!stored) {
        return EMPTY_SALES_ACTIVITY;
    }

    let payload;

    try {
        payload = JSON.parse(stored);
    } catch {
        return EMPTY_SALES_ACTIVITY;
    }

    return normalizeSalesActivity(payload, env);
}

async function loadNormalizedOffersStore(env) {
    if (typeof env.readOffersStore !== 'function') {
        return EMPTY_OFFERS_STORE;
    }

    const stored = await env.readOffersStore();
    if (!stored) {
        return EMPTY_OFFERS_STORE;
    }

    let payload;

    try {
        payload = JSON.parse(stored);
    } catch {
        return EMPTY_OFFERS_STORE;
    }

    return normalizeOffersStore(payload);
}

async function loadNormalizedProfilesStore(env) {
    if (typeof env.readProfilesStore !== 'function') {
        return EMPTY_PROFILES_STORE;
    }

    const stored = await env.readProfilesStore();
    if (!stored) {
        return EMPTY_PROFILES_STORE;
    }

    let payload;

    try {
        payload = JSON.parse(stored);
    } catch {
        return EMPTY_PROFILES_STORE;
    }

    return normalizeProfilesStore(payload);
}

function normalizeOffersStore(payload) {
    const items = Array.isArray(payload?.items)
        ? payload.items
        : Array.isArray(payload?.offers)
            ? payload.offers
            : [];
    const byId = new Map();

    for (const entry of items) {
        const normalized = normalizeStoredOfferRecord(entry);
        if (!normalized || byId.has(normalized.offerId)) {
            continue;
        }

        byId.set(normalized.offerId, normalized);
    }

    return {
        version: 1,
        updatedAt: normalizeIsoDate(payload?.updatedAt) || Array.from(byId.values())[0]?.updatedAt || '',
        items: Array.from(byId.values())
            .sort((left, right) => compareIsoDatesDescending(left.updatedAt, right.updatedAt))
            .slice(0, MAX_ITEMS)
    };
}

function normalizeProfilesStore(payload) {
    const sourceItems = payload?.items && typeof payload.items === 'object' && !Array.isArray(payload.items)
        ? payload.items
        : Array.isArray(payload?.profiles)
            ? Object.fromEntries(
                payload.profiles
                    .map((entry) => [normalizeAddress(entry?.address), entry])
                    .filter(([address]) => address)
            )
            : {};
    const items = {};

    for (const [address, profile] of Object.entries(sourceItems)) {
        const normalizedAddress = normalizeAddress(address || profile?.address);
        if (!normalizedAddress) {
            continue;
        }

        items[normalizedAddress] = normalizeStoredProfileRecord({
            ...profile,
            address: normalizedAddress
        });
    }

    return {
        version: 1,
        updatedAt: normalizeIsoDate(payload?.updatedAt) || '',
        items
    };
}

function createListingSummary(listing) {
    if (!listing) return null;

    return {
        listingId: normalizeListingId(listing.listingId || listing.inscriptionId) || normalizeInscriptionId(listing.inscriptionId),
        inscriptionId: normalizeInscriptionId(listing.inscriptionId),
        collectionId: normalizeCollectionId(listing.collectionId),
        collectionName: normalizeOptionalString(listing.collectionName),
        name: normalizeOptionalString(listing.name),
        priceSats: normalizePositiveInteger(listing.priceSats),
        sellerAddress: normalizeAddress(listing.sellerAddress),
        sellerPaymentsAddress: normalizeAddress(listing.sellerPaymentsAddress || listing?.listingData?.sellerPaymentsAddress),
        status: normalizeListingStatus(listing.status),
        walletProvider: normalizeWalletProvider(listing.walletProvider),
        signatureMethod: normalizeSignatureMethod(listing.signatureMethod) || 'ecdsa',
        createdAt: normalizeIsoDate(listing.createdAt),
        updatedAt: normalizeIsoDate(listing.updatedAt)
    };
}

function createOfferSummary(offer) {
    if (!offer) return null;

    const normalizedInscriptionId = normalizeInscriptionId(offer.inscriptionId || offer.id);

    return {
        offerId: normalizeOfferId(offer.offerId),
        type: 'item',
        inscriptionId: normalizedInscriptionId,
        collectionId: normalizeCollectionId(offer.collectionId),
        collectionName: normalizeOptionalString(offer.collectionName),
        name: normalizeOptionalString(offer.name),
        priceSats: normalizePositiveInteger(offer.priceSats),
        status: normalizeOfferStatus(offer.status),
        buyerAddress: normalizeAddress(offer.buyerAddress),
        buyerOrdinalsAddress: normalizeAddress(offer.buyerOrdinalsAddress),
        sellerAddress: normalizeAddress(offer.sellerAddress),
        sellerPaymentsAddress: normalizeAddress(offer.sellerPaymentsAddress),
        feePreference: normalizeFeePreference(offer.feePreference),
        feeRate: normalizePositiveInteger(offer.feeRate),
        expiresAt: normalizeIsoDate(offer.expiresAt),
        createdAt: normalizeIsoDate(offer.createdAt),
        updatedAt: normalizeIsoDate(offer.updatedAt),
        txid: normalizeHex(offer.txid, 64)
    };
}

function resolveFloorPrice(activeListings) {
    const prices = (Array.isArray(activeListings) ? activeListings : [])
        .map((entry) => normalizePositiveInteger(entry?.priceSats))
        .filter((value) => value > 0);
    return prices.length > 0 ? Math.min(...prices) : 0;
}

function toPublicCollectionSummary(collection) {
    if (!collection) return null;

    return {
        id: normalizeCollectionId(collection.id),
        name: normalizeOptionalString(collection.name),
        description: normalizeOptionalString(collection.description),
        iconPath: normalizeOptionalString(collection.iconPath),
        imagePath: normalizeOptionalString(collection.imagePath),
        previewType: normalizeOptionalString(collection.previewType),
        previewPath: normalizeOptionalString(collection.previewPath),
        accentColor: normalizeOptionalString(collection.accentColor),
        metadataUrl: normalizeOptionalString(collection.metadataUrl),
        assetCount: normalizePositiveInteger(collection.assetCount),
        forcedSatribute: collection.forcedSatribute || null
    };
}

function getCatalogCollection(env, collectionId) {
    const normalizedId = normalizeCollectionId(collectionId);
    if (!normalizedId) {
        return null;
    }

    const collections = Array.isArray(env?.boutiqueCatalog?.collections)
        ? env.boutiqueCatalog.collections
        : Array.isArray(env?.listBoutiqueCollections?.())
            ? env.listBoutiqueCollections()
            : [];

    return collections.find((entry) => normalizeCollectionId(entry.id) === normalizedId) || null;
}

function normalizeOfferRecord(offerPayload, auth, env) {
    const payload = offerPayload?.offer && typeof offerPayload.offer === 'object' && !Array.isArray(offerPayload.offer)
        ? offerPayload.offer
        : offerPayload;

    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
        throw new Error('Offer payload must be an object.');
    }

    const inscriptionId = normalizeInscriptionId(payload.inscriptionId || payload.id);
    const asset = inscriptionId && typeof env?.getBoutiqueAsset === 'function'
        ? env.getBoutiqueAsset(inscriptionId)
        : null;
    const type = normalizeOfferType(payload.type || 'item');
    const collectionId = normalizeCollectionId(payload.collectionId || payload.collection || asset?.collectionId);
    const collection = getCatalogCollection(env, collectionId);
    const priceSats = normalizePositiveInteger(payload.priceSats || payload.price);
    const expiresAt = normalizeIsoDate(payload.expiresAt);
      const buyerAddress = normalizeAddress(
          payload.buyerAddress
          || payload.paymentAddress
          || payload.buyerPaymentsAddress
          || auth.address
      );
      const buyerOrdinalsAddress = normalizeAddress(
          payload.buyerOrdinalsAddress
          || payload.receiveAddress
          || payload.ordinalsAddress
          || auth.address
          || buyerAddress
      );
      const sellerAddress = normalizeAddress(payload.sellerAddress);
    const sellerPaymentsAddress = normalizeAddress(payload.sellerPaymentsAddress || payload.sellerPayoutAddress || sellerAddress);
    const feePreference = normalizeFeePreference(payload.feePreference || payload.feeTier);
    const feeRate = normalizePositiveInteger(payload.feeRate || payload.customFeeRate || payload.feeRateSatVb);
    const signedBidPsbt = normalizeBoundedString(payload.buyerSignedPsbt || payload.signedBidPsbt || '', 120000);
    const now = new Date().toISOString();

    if (!type) {
        throw new Error('Offer type must be "item".');
    }

    if (!collectionId || !collection) {
        throw new Error('Offer collection is missing or unknown.');
    }

    if (!asset) {
        throw new Error('Item offers require a tracked inscription ID.');
    }

      if (!priceSats) {
          throw new Error('Offer price must be a positive integer number of sats.');
      }

      if (auth.address && auth.address !== buyerAddress && auth.address !== buyerOrdinalsAddress) {
          throw new Error('Offer signer does not match the supplied buyer wallet addresses.');
      }

      return {
          offerId: normalizeOfferId(payload.offerId) || randomHex(16),
        type,
        collectionId,
        collectionName: normalizeOptionalString(payload.collectionName || asset?.collectionName || collection.name),
          inscriptionId,
          name: normalizeOptionalString(payload.name || asset?.name),
          priceSats,
          status: 'open',
          buyerAddress,
          buyerPublicKey: auth.publicKey,
          buyerOrdinalsAddress,
          sellerAddress,
        sellerPaymentsAddress,
        walletProvider: auth.walletProvider,
        signatureMethod: auth.signatureMethod,
        feePreference,
        feeRate,
        buyerSignedPsbt: signedBidPsbt,
        expiresAt,
        createdAt: now,
        updatedAt: now
    };
}

function normalizeProfile(profilePayload, auth) {
    if (!profilePayload || typeof profilePayload !== 'object' || Array.isArray(profilePayload)) {
        throw new Error('Profile payload must be an object.');
    }

    const now = new Date().toISOString();
    const username = normalizeBoundedString(profilePayload.username || profilePayload.handle || '', 40);
    const avatarUrl = normalizeSafeUrl(profilePayload.avatarUrl || profilePayload.avatar || profilePayload.image || '');
    const bio = normalizeBoundedString(profilePayload.bio || profilePayload.description || '', 280);
    const socialUrl = normalizeSafeUrl(profilePayload.socialUrl || profilePayload.social || profilePayload.website || '');
    const createdAt = normalizeIsoDate(profilePayload.createdAt) || now;

    return {
        address: auth.address,
        username,
        avatarUrl,
        bio,
        socialUrl,
        walletProvider: auth.walletProvider,
        signatureMethod: auth.signatureMethod,
        createdAt,
        updatedAt: now
    };
}

function createEmptyProfile(address) {
    return {
        address: normalizeAddress(address),
        username: '',
        avatarUrl: '',
        bio: '',
        socialUrl: '',
        walletProvider: '',
        signatureMethod: '',
        createdAt: '',
        updatedAt: ''
    };
}

async function buildAddressPortfolio(address, env) {
    const normalizedAddress = normalizeAddress(address);
    const snapshot = await buildMarketplaceSnapshot(env);
    const record = snapshot.addresses.find((entry) => entry.address === normalizedAddress);
    const profile = snapshot.profiles[normalizedAddress] || createEmptyProfile(normalizedAddress);

    return {
        version: 1,
        updatedAt: snapshot.updatedAt,
        address: normalizedAddress,
        profile,
        holdings: record?.holdings || [],
        activeListings: record?.activeListings || [],
        openOffers: record?.openOffers || [],
        recentSales: record?.recentSales || []
    };
}

function normalizeGenericActionAuth(auth, expectedAction = '') {
    if (!auth || typeof auth !== 'object' || Array.isArray(auth)) {
        throw new Error('Authorization payload is required.');
    }

    const action = normalizeSignableAction(auth.action || expectedAction || auth.authAction);
    const address = normalizeAddress(auth.address || auth.walletAddress || auth.sellerAddress || auth.buyerAddress);
    const publicKey = normalizeAuthPublicKey(auth.publicKey || auth.walletPublicKey || auth.sellerPublicKey || auth.buyerPublicKey);
    const payloadHash = normalizeHex(auth.payloadHash || auth.manifestHash, 64);
    const nonce = normalizeHex(auth.nonce, [24, 32, 40, 48, 64]);
    const issuedAt = normalizeIsoDate(auth.issuedAt);
    const message = normalizeBoundedString(auth.message, 2048);
    const signature = normalizeBoundedString(auth.signature, 2048);
    const walletProvider = normalizeWalletProvider(auth.walletProvider || auth.provider);
    const signatureMethod = normalizeSignatureMethod(auth.signatureMethod || auth.signatureType || auth.scheme);

    if (!action) {
        throw new Error('Authorization action is missing or unsupported.');
    }

    if (expectedAction && action !== expectedAction) {
        throw new Error('Authorization action does not match this request.');
    }

    if (!address || !publicKey || !payloadHash || !nonce || !issuedAt || !message || !signature || !signatureMethod) {
        throw new Error('Authorization payload is incomplete.');
    }

    if (!publicKeyMatchesAddress(publicKey, address)) {
        throw new Error('Authorization public key does not control the connected wallet address.');
    }

    return {
        action,
        address,
        publicKey,
        payloadHash,
        nonce,
        issuedAt,
        message,
        signature,
        walletProvider,
        signatureMethod
    };
}

function validateGenericActionEnvelope(auth, payloadHash, expectedAction) {
    if (expectedAction && auth.action !== expectedAction) {
        throw new Error('Authorization action does not match this request.');
    }

    if (auth.payloadHash !== payloadHash) {
        throw new Error('Authorization payload hash does not match the submitted payload.');
    }
}

function normalizeStoredGenericChallenge(payload) {
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
        throw new Error('Stored authorization challenge is invalid.');
    }

    const action = normalizeSignableAction(payload.action || payload.authAction || BOUTIQUE_AUTH_ACTION);
    const address = normalizeAddress(payload.address || payload.walletAddress || payload.sellerAddress);
    const publicKey = normalizeAuthPublicKey(payload.publicKey || payload.walletPublicKey || payload.sellerPublicKey);
    const payloadHash = normalizeHex(payload.payloadHash || payload.manifestHash, 64);
    const nonce = normalizeHex(payload.nonce, [24, 32, 40, 48, 64]);
    const issuedAt = normalizeIsoDate(payload.issuedAt);
    const message = normalizeBoundedString(payload.message, 2048);
    const origin = normalizeOrigin(payload.origin);
    const walletProvider = normalizeWalletProvider(payload.walletProvider || payload.provider);
    const signatureMethod = normalizeSignatureMethod(payload.signatureMethod || payload.signatureType || payload.scheme);

    if (!action || !address || !publicKey || !payloadHash || !nonce || !issuedAt || !message || !signatureMethod) {
        throw new Error('Stored authorization challenge is incomplete.');
    }

    return {
        action,
        address,
        publicKey,
        payloadHash,
        nonce,
        issuedAt,
        message,
        origin,
        walletProvider,
        signatureMethod
    };
}

function validateGenericActionChallenge(challenge, auth, payloadHash, request, expectedAction) {
    const origin = normalizeOrigin(request.headers.get('Origin'));
    const expectedMessage = buildPublishAuthMessage({
        action: challenge.action,
        sellerAddress: challenge.address,
        sellerPublicKey: challenge.publicKey,
        manifestHash: challenge.payloadHash,
        nonce: challenge.nonce,
        issuedAt: challenge.issuedAt,
        origin: challenge.origin,
        walletProvider: challenge.walletProvider,
        signatureMethod: challenge.signatureMethod
    });

    if (challenge.action !== auth.action || challenge.action !== expectedAction) {
        throw new Error('Authorization action does not match the stored challenge.');
    }

    if (challenge.nonce !== auth.nonce) {
        throw new Error('Authorization nonce does not match the stored challenge.');
    }

    if (challenge.address !== auth.address || challenge.publicKey !== auth.publicKey) {
        throw new Error('Authorization signer does not match the stored challenge.');
    }

    if (challenge.walletProvider !== auth.walletProvider || challenge.signatureMethod !== auth.signatureMethod) {
        throw new Error('Authorization wallet signature metadata does not match the stored challenge.');
    }

    if (challenge.payloadHash !== auth.payloadHash || challenge.payloadHash !== payloadHash) {
        throw new Error('Authorization payload hash does not match the stored challenge.');
    }

    if (challenge.origin && challenge.origin !== origin) {
        throw new Error('Authorization origin does not match this request.');
    }

    if (auth.message !== expectedMessage || challenge.message !== expectedMessage) {
        throw new Error('Authorization message does not match the stored challenge.');
    }

    if (!verifySignedAuthorization(auth.address, auth.publicKey, auth.signatureMethod, expectedMessage, auth.signature)) {
        throw new Error('Authorization signature is invalid.');
    }
}

function normalizeOfferId(value) {
    const normalized = String(value || '').trim().toLowerCase();
    return /^[a-z0-9_-]{8,128}$/.test(normalized) ? normalized : '';
}

async function mergePublishedListings(existingStore, publishedStore, sellerAddress, options = {}) {
    const now = new Date().toISOString();
    const nextItemsById = new Map(
        (Array.isArray(existingStore?.items) ? existingStore.items : [])
            .map((entry) => [entry.inscriptionId, entry])
    );
    const publishedIds = new Set();
    const touchedCollections = new Set([normalizeCollectionId(options.collectionId)].filter(Boolean));

    for (const item of Array.isArray(publishedStore?.items) ? publishedStore.items : []) {
        const existing = nextItemsById.get(item.inscriptionId);
        if (existing && existing.status === 'active' && existing.sellerAddress && existing.sellerAddress !== sellerAddress) {
            const existingAvailability = options.env
                ? await inspectListingAvailability(existing, options.env).catch(() => ({ live: true, indeterminate: true }))
                : { live: true, indeterminate: true };

            if (existingAvailability.live || existingAvailability.indeterminate) {
                throw new Error(`Listing ${item.inscriptionId} is already controlled by another seller.`);
            }

            nextItemsById.set(item.inscriptionId, {
                ...existing,
                status: 'cancelled',
                updatedAt: now
            });
        }

        touchedCollections.add(item.collectionId);
        publishedIds.add(item.inscriptionId);

        if (item.status !== 'active' && !existing) {
            continue;
        }

        const merged = normalizeListingItem({
            ...(existing || {}),
            ...item,
            sellerAddress,
            createdAt: existing?.createdAt || item.createdAt || now,
            updatedAt: now
        }, {
            env: options.env,
            manifestSellerAddress: sellerAddress,
            expectedSellerAddress: sellerAddress,
            defaultCollectionId: item.collectionId,
            walletProvider: item.walletProvider || existing?.walletProvider,
            signatureMethod: item.signatureMethod || existing?.signatureMethod
        });

        nextItemsById.set(item.inscriptionId, merged);
    }

    if (options.replaceMissing) {
        for (const [inscriptionId, item] of nextItemsById.entries()) {
            if (item.status !== 'active' || item.sellerAddress !== sellerAddress) {
                continue;
            }

            if (touchedCollections.size > 0 && !touchedCollections.has(item.collectionId)) {
                continue;
            }

            if (publishedIds.has(inscriptionId)) {
                continue;
            }

            nextItemsById.set(inscriptionId, {
                ...item,
                status: 'cancelled',
                updatedAt: now
            });
        }
    }

    return normalizeManifest({
        version: 2,
        updatedAt: now,
        items: Array.from(nextItemsById.values())
    }, options.env);
}

async function buildMarketplaceSnapshot(env) {
    const now = Date.now();
    if (snapshotCache && snapshotCache.expiresAt > now) {
        return snapshotCache.snapshot;
    }

    const [listingsStore, salesStore, offersStore, profilesStore] = await Promise.all([
        loadNormalizedStoredManifest(env),
        loadNormalizedStoredSalesActivity(env),
        loadNormalizedOffersStore(env),
        loadNormalizedProfilesStore(env)
    ]);
    const assets = Array.isArray(env?.boutiqueCatalog?.assets)
        ? env.boutiqueCatalog.assets.slice()
        : [];
    const activeListings = listingsStore.items.filter((entry) => entry.status === 'active');
    const openOffers = offersStore.items.filter((entry) => entry.status === 'open');
    const activeListingsByInscription = new Map(activeListings.map((entry) => [entry.inscriptionId, entry]));
    const topOffersByInscription = new Map();

    for (const offer of openOffers) {
        if (offer.type !== 'item' || !offer.inscriptionId) {
            continue;
        }

        const existing = topOffersByInscription.get(offer.inscriptionId);
        if (!existing || Number(offer.priceSats || 0) > Number(existing.priceSats || 0)) {
            topOffersByInscription.set(offer.inscriptionId, offer);
        }
    }

    const ownerEntries = await mapWithConcurrency(assets, 16, async (asset) => {
        const owner = await resolveTrackedInscriptionOwner(asset.id, env).catch(() => null);
        return owner?.address
            ? {
                asset,
                owner
            }
            : null;
    });
    const addressMap = new Map();

    function ensureAddressRecord(address) {
        const normalizedAddress = normalizeAddress(address);
        if (!normalizedAddress) {
            return null;
        }

        if (!addressMap.has(normalizedAddress)) {
            addressMap.set(normalizedAddress, {
                address: normalizedAddress,
                profile: profilesStore.items[normalizedAddress] || createEmptyProfile(normalizedAddress),
                holdings: [],
                activeListings: [],
                openOffers: [],
                recentSales: []
            });
        }

        return addressMap.get(normalizedAddress);
    }

    for (const ownerEntry of ownerEntries) {
        if (!ownerEntry) {
            continue;
        }

        const { asset, owner } = ownerEntry;
        const addressRecord = ensureAddressRecord(owner.address);
        if (!addressRecord) {
            continue;
        }

        const listing = activeListingsByInscription.get(asset.id) || null;
        addressRecord.holdings.push({
            ...asset,
            ownerAddress: owner.address,
            ownerOutpoint: normalizeOptionalString(owner.outpoint),
            ownerOutputValue: normalizePositiveInteger(owner.amount),
            listing: listing ? createListingSummary(listing) : null,
            topOffer: topOffersByInscription.get(asset.id) ? createOfferSummary(topOffersByInscription.get(asset.id)) : null
        });
    }

    for (const listing of activeListings) {
        const addressRecord = ensureAddressRecord(listing.sellerAddress);
        if (!addressRecord) {
            continue;
        }

        addressRecord.activeListings.push(createListingSummary(listing));
    }

    for (const offer of openOffers) {
        const addressRecord = ensureAddressRecord(offer.buyerOrdinalsAddress || offer.buyerAddress);
        if (!addressRecord) {
            continue;
        }

        addressRecord.openOffers.push(createOfferSummary(offer));
    }

    for (const sale of salesStore.items) {
        if (sale.buyerAddress) {
            const buyerRecord = ensureAddressRecord(sale.buyerAddress);
            if (buyerRecord) {
                pushBoundedSale(buyerRecord.recentSales, sale);
            }
        }

        if (sale.sellerAddress) {
            const sellerRecord = ensureAddressRecord(sale.sellerAddress);
            if (sellerRecord) {
                pushBoundedSale(sellerRecord.recentSales, sale);
            }
        }
    }

    const addresses = Array.from(addressMap.values())
        .map((record) => finalizeAddressRecord(record))
        .sort((left, right) => left.address.localeCompare(right.address));
    const snapshot = {
        updatedAt: new Date(now).toISOString(),
        profiles: profilesStore.items,
        addresses
    };

    snapshotCache = {
        expiresAt: now + SNAPSHOT_CACHE_TTL_MS,
        snapshot
    };

    return snapshot;
}

async function resolveTrackedInscriptionOwner(inscriptionId, env) {
    const normalizedId = normalizeInscriptionId(inscriptionId);
    if (!normalizedId) {
        return null;
    }

    const cached = typeof env.getHolderOwnerCache === 'function'
        ? await env.getHolderOwnerCache(normalizedId)
        : null;
    if (cached?.address) {
        return cached;
    }

    const location = await env.resolveInscription(normalizedId);
    const output = await env.fetchTransactionOutput(location.txid, location.index);
    const address = decodeOutputAddress(output.script);
    if (!address) {
        return null;
    }

    const snapshot = {
        address,
        outpoint: `${location.txid}:${location.index}`,
        amount: normalizePositiveInteger(output.value)
    };

    if (typeof env.setHolderOwnerCache === 'function') {
        await env.setHolderOwnerCache(normalizedId, snapshot);
    }

    return snapshot;
}

function finalizeAddressRecord(record) {
    return {
        address: record.address,
        profile: record.profile,
        holdings: record.holdings
            .sort((left, right) => {
                const listingDelta = Number(Boolean(right.listing)) - Number(Boolean(left.listing));
                if (listingDelta !== 0) {
                    return listingDelta;
                }

                return Number(left.sortOrder || 0) - Number(right.sortOrder || 0);
            }),
        activeListings: record.activeListings
            .sort((left, right) => compareIsoDatesDescending(left.updatedAt, right.updatedAt)),
        openOffers: record.openOffers
            .sort((left, right) => compareIsoDatesDescending(left.updatedAt, right.updatedAt)),
        recentSales: record.recentSales
            .sort((left, right) => compareIsoDatesDescending(left.occurredAt, right.occurredAt))
            .slice(0, 20)
    };
}

function pushBoundedSale(target, sale) {
    if (!Array.isArray(target) || !sale) {
        return;
    }

    target.push(sale);
    if (target.length > 20) {
        target.sort((left, right) => compareIsoDatesDescending(left.occurredAt, right.occurredAt));
        target.length = 20;
    }
}

async function mapWithConcurrency(items, limit, mapper) {
    const normalizedItems = Array.isArray(items) ? items : [];
    const normalizedLimit = Math.max(1, Number(limit) || 1);
    const results = new Array(normalizedItems.length);
    let cursor = 0;

    await Promise.all(
        Array.from({ length: Math.min(normalizedLimit, normalizedItems.length || normalizedLimit) }, async () => {
            while (cursor < normalizedItems.length) {
                const index = cursor;
                cursor += 1;
                results[index] = await mapper(normalizedItems[index], index);
            }
        })
    );

    return results;
}

async function persistBroadcastSale(checkoutContext, txid, env) {
    const normalizedTxid = normalizeHex(txid, 64);
    const item = checkoutContext?.match?.item;
    const manifest = checkoutContext?.manifest;

    if (!item?.inscriptionId || !normalizedTxid) {
        return;
    }

    const occurredAt = new Date().toISOString();

    if (typeof env.writeManifest === 'function' && Array.isArray(manifest?.items)) {
        const nextManifest = normalizeManifest({
            ...manifest,
            updatedAt: occurredAt,
            items: manifest.items.map((entry) => entry.inscriptionId === item.inscriptionId
                ? {
                    ...entry,
                    status: 'filled',
                    updatedAt: occurredAt
                }
                : entry)
        }, env);
        await env.writeManifest(nextManifest);
        snapshotCache = null;
    }

    if (typeof env.writeSalesActivity !== 'function') {
        return;
    }

    const currentActivity = await loadNormalizedStoredSalesActivity(env);
    const saleRecord = normalizeSaleRecord({
        txid: normalizedTxid,
        inscriptionId: item.inscriptionId,
        collectionId: item.collectionId,
        collectionName: item.collectionName,
        name: item.name,
        priceSats: item.priceSats,
        occurredAt,
        marketplace: 'Blok Boutique',
        buyerAddress: checkoutContext?.buyerOrdinalsAddress || checkoutContext?.buyerAddress,
        buyerPaymentsAddress: checkoutContext?.buyerAddress,
        sellerAddress: item?.sellerAddress,
        sellerPaymentsAddress: item?.listingData?.sellerPaymentsAddress || item?.sellerPaymentsAddress
    }, env);

    if (!saleRecord) {
        return;
    }

    const nextActivity = normalizeSalesActivity({
        ...currentActivity,
        updatedAt: occurredAt,
        items: [saleRecord, ...(Array.isArray(currentActivity.items) ? currentActivity.items : [])]
    }, env);

    await env.writeSalesActivity(nextActivity);
    snapshotCache = null;

    if (typeof env.writeOffersStore === 'function') {
        const offersStore = await loadNormalizedOffersStore(env);
        const nextOffersStore = normalizeOffersStore({
            ...offersStore,
            updatedAt: occurredAt,
            items: offersStore.items.map((entry) => (
                entry.status === 'open' && entry.inscriptionId === item.inscriptionId
                    ? {
                        ...entry,
                        status: 'stale',
                        updatedAt: occurredAt
                    }
                    : entry
            ))
        });
        await env.writeOffersStore(nextOffersStore);
        snapshotCache = null;
    }
}

async function finalizeAcceptedOfferPsbt({ buyerSignedPsbt, signedPsbt, offer, inscriptionId, env }) {
    let basePsbt;
    let sellerSignedPsbt;

    try {
        basePsbt = bitcoin.Psbt.fromBase64(String(buyerSignedPsbt || '').trim(), { network: NETWORK });
        sellerSignedPsbt = bitcoin.Psbt.fromBase64(String(signedPsbt || '').trim(), { network: NETWORK });
    } catch {
        throw createHttpError(400, 'Offer PSBT is invalid.');
    }

    if (!psbtStructureMatches(basePsbt, sellerSignedPsbt)) {
        throw createHttpError(400, 'Seller PSBT does not match the stored buyer bid.');
    }

    const sellerSignedInput = sellerSignedPsbt.data.inputs[0];
    if (!hasSellerSignature(sellerSignedInput)) {
        throw createHttpError(400, 'Accepted offer seller signature is missing.');
    }

    try {
        const signedInputFields = extractAcceptedOfferSignedInputFields(sellerSignedInput);
        if (Object.keys(signedInputFields).length > 0) {
            basePsbt.updateInput(0, signedInputFields);
        }
        finalizePendingPsbtInputs(basePsbt);
    } catch {
        throw createHttpError(400, 'Unable to finalize the accepted offer transaction.');
    }

    const transaction = basePsbt.extractTransaction();
    const rawHex = transaction.toHex();
    const txid = String(transaction.getId() || '').trim().toLowerCase();
    if (!normalizeHex(txid, 64)) {
        throw createHttpError(400, 'Accepted offer transaction id is invalid.');
    }

    validateAcceptedOfferTransaction(transaction, offer, inscriptionId);
    await env.broadcastTransaction(rawHex);
    return txid;
}

function extractAcceptedOfferSignedInputFields(psbtInput) {
    const signedFields = {};

    if (!psbtInput || typeof psbtInput !== 'object') {
        return signedFields;
    }

    if (psbtInput.finalScriptSig) {
        signedFields.finalScriptSig = psbtInput.finalScriptSig;
    }
    if (psbtInput.finalScriptWitness) {
        signedFields.finalScriptWitness = psbtInput.finalScriptWitness;
    }
    if (psbtInput.tapKeySig) {
        signedFields.tapKeySig = psbtInput.tapKeySig;
    }
    if (Array.isArray(psbtInput.tapScriptSig) && psbtInput.tapScriptSig.length > 0) {
        signedFields.tapScriptSig = psbtInput.tapScriptSig;
    }
    if (Array.isArray(psbtInput.partialSig) && psbtInput.partialSig.length > 0) {
        signedFields.partialSig = psbtInput.partialSig;
    }
    if (psbtInput.tapInternalKey) {
        signedFields.tapInternalKey = psbtInput.tapInternalKey;
    }
    if (Array.isArray(psbtInput.tapLeafScript) && psbtInput.tapLeafScript.length > 0) {
        signedFields.tapLeafScript = psbtInput.tapLeafScript;
    }

    return signedFields;
}

function finalizePendingPsbtInputs(psbt) {
    const inputCount = Number(psbt?.inputCount || 0);

    for (let index = 0; index < inputCount; index += 1) {
        const input = psbt.data.inputs[index];
        if (input?.finalScriptSig || input?.finalScriptWitness) {
            continue;
        }

        psbt.finalizeInput(index);
    }
}

async function persistAcceptedOfferSale({ offer, env }) {
    if (!offer?.inscriptionId || !offer?.txid) {
        return;
    }

    const occurredAt = new Date().toISOString();
    const normalizedInscriptionId = normalizeInscriptionId(offer.inscriptionId);

    if (typeof env.writeManifest === 'function') {
        const manifest = await loadNormalizedStoredManifest(env);
        const nextManifest = normalizeManifest({
            ...manifest,
            updatedAt: occurredAt,
            items: manifest.items.map((entry) => (
                entry.inscriptionId === normalizedInscriptionId && entry.status === 'active'
                    ? {
                        ...entry,
                        status: 'filled',
                        updatedAt: occurredAt
                    }
                    : entry
            ))
        }, env);
        await env.writeManifest(nextManifest);
        snapshotCache = null;
    }

    if (typeof env.writeSalesActivity === 'function') {
        const currentActivity = await loadNormalizedStoredSalesActivity(env);
        const saleRecord = normalizeSaleRecord({
            txid: offer.txid,
            inscriptionId: normalizedInscriptionId,
            collectionId: offer.collectionId,
            collectionName: offer.collectionName,
            name: offer.name,
            priceSats: offer.priceSats,
            occurredAt,
            marketplace: 'Blok Boutique',
            buyerAddress: offer.buyerOrdinalsAddress || offer.buyerAddress,
            buyerPaymentsAddress: offer.buyerAddress,
            sellerAddress: offer.sellerAddress,
            sellerPaymentsAddress: offer.sellerPaymentsAddress || offer.sellerAddress
        }, env);

        if (saleRecord) {
            const nextActivity = normalizeSalesActivity({
                ...currentActivity,
                updatedAt: occurredAt,
                items: [saleRecord, ...(Array.isArray(currentActivity.items) ? currentActivity.items : [])]
            }, env);
            await env.writeSalesActivity(nextActivity);
            snapshotCache = null;
        }
    }
}

function psbtStructureMatches(leftPsbt, rightPsbt) {
    if (!leftPsbt || !rightPsbt) {
        return false;
    }

    const leftShape = JSON.stringify({
        inputs: leftPsbt.txInputs.map((input) => ({
            txid: Buffer.from(input.hash).reverse().toString('hex'),
            index: Number(input.index),
            sequence: Number(input.sequence)
        })),
        outputs: leftPsbt.txOutputs.map((output) => ({
            value: Number(output.value || 0),
            script: Buffer.from(output.script || []).toString('hex')
        }))
    });
    const rightShape = JSON.stringify({
        inputs: rightPsbt.txInputs.map((input) => ({
            txid: Buffer.from(input.hash).reverse().toString('hex'),
            index: Number(input.index),
            sequence: Number(input.sequence)
        })),
        outputs: rightPsbt.txOutputs.map((output) => ({
            value: Number(output.value || 0),
            script: Buffer.from(output.script || []).toString('hex')
        }))
    });

    return leftShape === rightShape;
}

function validateAcceptedOfferTransaction(transaction, offer, inscriptionId) {
    if (!transaction || !offer) {
        throw createHttpError(400, 'Accepted offer transaction is invalid.');
    }

    const buyerReceiveAddress = normalizeAddress(offer.buyerOrdinalsAddress || offer.buyerAddress);
    const sellerPayoutAddress = normalizeAddress(offer.sellerPaymentsAddress || offer.sellerAddress);
    const priceSats = normalizePositiveInteger(offer.priceSats);
    const inscriptionAmount = normalizePositiveInteger(offer?.utxo?.amount || 0);

    if (!buyerReceiveAddress || !sellerPayoutAddress || !priceSats || !inscriptionId) {
        throw createHttpError(400, 'Accepted offer settlement is incomplete.');
    }

    const outputs = Array.isArray(transaction.outs) ? transaction.outs : [];
    const buyerOutput = outputs.find((output) => decodeOutputAddress(output.script) === buyerReceiveAddress);
    if (!buyerOutput) {
        throw createHttpError(400, `Accepted offer transaction does not deliver ${inscriptionId} to the buyer ordinals address.`);
    }

    const sellerOutput = outputs.find((output) => decodeOutputAddress(output.script) === sellerPayoutAddress);
    if (!sellerOutput) {
        throw createHttpError(400, 'Accepted offer transaction is missing the seller payout output.');
    }

    if (normalizePsbtValue(sellerOutput.value) < BigInt(priceSats)) {
        throw createHttpError(400, 'Accepted offer transaction payout is below the agreed sale price.');
    }

    if (inscriptionAmount && normalizePsbtValue(buyerOutput.value) !== BigInt(inscriptionAmount)) {
        throw createHttpError(400, 'Accepted offer transaction does not preserve the inscription output value.');
    }
}

function findTransactionListingMatches(transaction, manifest) {
    const inputIndexByOutpoint = new Map();

    transaction.ins.forEach((input, index) => {
        const outpoint = formatTransactionInputOutpoint(input);
        if (outpoint) {
            inputIndexByOutpoint.set(outpoint, index);
        }
    });

    return (Array.isArray(manifest?.items) ? manifest.items : [])
        .filter((item) => item.status === 'active' && item.utxo)
        .map((item) => ({
            item,
            inputIndex: inputIndexByOutpoint.get(`${item.utxo.txid}:${item.utxo.index}`)
        }))
        .filter((entry) => Number.isInteger(entry.inputIndex) && entry.inputIndex >= 0);
}

async function fetchTransactionInputValues(transaction, match, env) {
    const values = [];

    for (let index = 0; index < transaction.ins.length; index += 1) {
        if (index === match.inputIndex) {
            values.push(Number(match.item.utxo.amount));
            continue;
        }

        const outpoint = parseTransactionInputOutpoint(transaction.ins[index]);
        if (!outpoint) {
            throw createHttpError(400, 'Checkout transaction contains an invalid input outpoint.');
        }

        const prevout = await env.fetchTransactionOutput(outpoint.txid, outpoint.index);
        values.push(Number(prevout.value || 0));
    }

    return values;
}

function validateCheckoutRecipients(transaction, item, sellerInputIndex, buyerAddress, buyerOrdinalsAddress = buyerAddress) {
    const sellerAddress = item.listingData.sellerPaymentsAddress;
    const expectedSellerPayout = Number(item.priceSats) + Number(item.utxo.amount);
    const sellerOutput = transaction.outs[sellerInputIndex];

    if (!sellerOutput) {
        throw createHttpError(400, `Checkout transaction is missing the seller payout output for ${item.inscriptionId}.`);
    }

    const sellerOutputAddress = decodeOutputAddress(sellerOutput.script);
    const sellerOutputValue = normalizePsbtValue(sellerOutput.value);

    if (!sellerOutputAddress || sellerOutputAddress !== sellerAddress) {
        throw createHttpError(400, `Checkout transaction payout output does not match the live listing seller address for ${item.inscriptionId}.`);
    }

    if (sellerOutputValue !== expectedSellerPayout) {
        throw createHttpError(400, `Checkout transaction payout amount does not match the live listing price for ${item.inscriptionId}.`);
    }

    let totalToSeller = 0;
    const allowedBuyerAddresses = new Set([buyerAddress, buyerOrdinalsAddress].filter(Boolean));

    for (const output of transaction.outs) {
        const address = decodeOutputAddress(output.script);
        const value = normalizePsbtValue(output.value);

        if (!address) {
            throw createHttpError(400, 'Checkout transaction contains an unsupported output script.');
        }

        if (!allowedBuyerAddresses.has(address) && address !== sellerAddress) {
            throw createHttpError(400, 'Checkout transaction contains an unexpected recipient output.');
        }

        if (address === sellerAddress) {
            totalToSeller += value;
        }
    }

    if (!allowedBuyerAddresses.has(sellerAddress) && totalToSeller !== expectedSellerPayout) {
        throw createHttpError(400, `Checkout transaction pays the seller an unexpected total for ${item.inscriptionId}.`);
    }
}

function validateCheckoutCarrierOutput(transaction, item, sellerInputIndex, buyerOrdinalsAddress, inputValues) {
    const sellerStartOffset = inputValues
        .slice(0, sellerInputIndex)
        .reduce((sum, value) => sum + Number(value || 0), 0);
    const carrierIndex = findOutputIndexForOffset(transaction.outs, sellerStartOffset);

    if (carrierIndex < 0) {
        throw createHttpError(400, `Checkout transaction does not carry ${item.inscriptionId} to any output.`);
    }

    const carrierOutput = transaction.outs[carrierIndex];
    const carrierAddress = decodeOutputAddress(carrierOutput.script);
    const carrierValue = normalizePsbtValue(carrierOutput.value);

    if (!carrierAddress || carrierAddress !== buyerOrdinalsAddress) {
        throw createHttpError(400, `Checkout transaction does not send ${item.inscriptionId} to the buyer ordinals receive address.`);
    }

    if (carrierValue !== Number(item.utxo.amount)) {
        throw createHttpError(400, `Checkout transaction moves ${item.inscriptionId} into an unexpected output amount.`);
    }
}

async function validateCheckoutFee(transaction, inputValues, env) {
    const totalInputValue = inputValues.reduce((sum, value) => sum + Number(value || 0), 0);
    const totalOutputValue = transaction.outs.reduce((sum, output) => sum + normalizePsbtValue(output.value), 0);
    const fee = totalInputValue - totalOutputValue;

    if (!Number.isFinite(fee) || fee < 0) {
        throw createHttpError(400, 'Checkout transaction fee is invalid.');
    }

    const virtualSize = typeof transaction.virtualSize === 'function'
        ? Number(transaction.virtualSize())
        : Math.max(1, Math.ceil(transaction.byteLength()));
    let fastestFeeRate = 0;

    try {
        const recommendedFees = await env.fetchRecommendedFees();
        fastestFeeRate = normalizePositiveInteger(recommendedFees?.fastestFee);
    } catch {
        fastestFeeRate = 0;
    }

    const maxSafeFeeRate = Math.max(
        MAX_SAFE_BUY_FEE_RATE_FLOOR,
        fastestFeeRate * MAX_SAFE_BUY_FEE_RATE_MULTIPLIER
    );

    if (virtualSize > 0 && fee > virtualSize * maxSafeFeeRate) {
        throw createHttpError(400, `Checkout transaction fee exceeds the boutique safety cap (${Math.round(fee / virtualSize)} sat/vB).`);
    }
}

async function inspectListingAvailability(item, env) {
    try {
        await validateListingAgainstNodes(item, env);
        return { live: true, indeterminate: false };
    } catch (error) {
        if (isInfrastructureError(error)) {
            return { live: true, indeterminate: true };
        }

        return { live: false, indeterminate: false };
    }
}

async function validateListingAgainstNodes(item, env) {
    const inscription = await env.resolveInscription(item.inscriptionId);
    const prevout = await env.fetchTransactionOutput(item.utxo.txid, item.utxo.index);

    if (inscription.txid !== item.utxo.txid || inscription.index !== item.utxo.index) {
        throw createHttpError(409, `Listing ${item.inscriptionId} no longer points at the live inscription UTXO.`);
    }

    if (inscription.value && inscription.value !== item.utxo.amount) {
        throw createHttpError(409, `Listing ${item.inscriptionId} no longer matches the inscription output value.`);
    }

    if (prevout.value !== item.utxo.amount) {
        throw createHttpError(409, `Listing ${item.inscriptionId} does not match the current Bitcoin output value.`);
    }

    validatePrevoutBelongsToSeller(item, prevout);
    validateListingPsbt(item, prevout);
}

function validatePrevoutBelongsToSeller(item, prevout) {
    const expectedScript = bitcoin.address.toOutputScript(item.listingData.sellerOrdinalsSigner.address, NETWORK);

    if (!Buffer.from(prevout.script).equals(expectedScript)) {
        throw createHttpError(409, `Listing ${item.inscriptionId} is not controlled by the configured seller address anymore.`);
    }
}

function validateListingPsbt(item, prevout) {
    let psbt;

    try {
        psbt = bitcoin.Psbt.fromBase64(item.sellerSignedPsbt, { network: NETWORK });
    } catch {
        throw createHttpError(400, `Listing ${item.inscriptionId} has an invalid seller-signed PSBT.`);
    }

    if (psbt.txInputs.length !== 1 || psbt.txOutputs.length !== 1) {
        throw createHttpError(400, `Listing ${item.inscriptionId} must contain exactly one input and one output.`);
    }

    const txInput = psbt.txInputs[0];
    const psbtInput = psbt.data.inputs[0] || {};
    const inputTxid = Buffer.from(txInput.hash).reverse().toString('hex');
    const inputIndex = Number(txInput.index);

    if (inputTxid !== item.utxo.txid || inputIndex !== item.utxo.index) {
        throw createHttpError(400, `Listing ${item.inscriptionId} PSBT input does not match the inscription UTXO.`);
    }

    validatePsbtPrevout(psbtInput, prevout, item.inscriptionId);
    validatePsbtSighash(psbtInput, item.inscriptionId);
    validatePsbtSignature(psbt, psbtInput, item);
    validatePsbtSellerOutput(psbt, item);
}

function validatePsbtPrevout(psbtInput, prevout, inscriptionId) {
    if (psbtInput.witnessUtxo) {
        const script = Buffer.from(psbtInput.witnessUtxo.script);
        const value = normalizePsbtValue(psbtInput.witnessUtxo.value);

        if (!script.equals(prevout.script) || value !== prevout.value) {
            throw createHttpError(400, `Listing ${inscriptionId} PSBT prevout data does not match bitcoind.`);
        }

        return;
    }

    if (psbtInput.nonWitnessUtxo) {
        const tx = bitcoin.Transaction.fromBuffer(Buffer.from(psbtInput.nonWitnessUtxo));
        const output = tx.outs[prevout.index];

        if (!output || tx.getId() !== prevout.txid) {
            throw createHttpError(400, `Listing ${inscriptionId} PSBT non-witness UTXO does not match bitcoind.`);
        }

        if (!Buffer.from(output.script).equals(prevout.script) || normalizePsbtValue(output.value) !== prevout.value) {
            throw createHttpError(400, `Listing ${inscriptionId} PSBT non-witness output does not match bitcoind.`);
        }

        return;
    }

    throw createHttpError(400, `Listing ${inscriptionId} is missing trusted prevout data in the PSBT.`);
}

function validatePsbtSighash(psbtInput, inscriptionId) {
    if (Number.isFinite(Number(psbtInput.sighashType)) && Number(psbtInput.sighashType) !== SIGHASH_SINGLE_ANYONECANPAY) {
        throw createHttpError(400, `Listing ${inscriptionId} must use SIGHASH_SINGLE|ANYONECANPAY.`);
    }

    if (psbtInput.tapKeySig) {
        const signature = Buffer.from(psbtInput.tapKeySig);
        const sighashType = signature.length === 65 ? signature[64] : 0;
        if (sighashType !== SIGHASH_SINGLE_ANYONECANPAY) {
            throw createHttpError(400, `Listing ${inscriptionId} taproot signature must use SIGHASH_SINGLE|ANYONECANPAY.`);
        }
        return;
    }

    if (Array.isArray(psbtInput.partialSig) && psbtInput.partialSig.length > 0) {
        for (const signature of psbtInput.partialSig) {
            const decoded = bitcoin.script.signature.decode(signature.signature);
            if (decoded.hashType !== SIGHASH_SINGLE_ANYONECANPAY) {
                throw createHttpError(400, `Listing ${inscriptionId} signature must use SIGHASH_SINGLE|ANYONECANPAY.`);
            }
        }
    }
}

function validatePsbtSignature(psbt, psbtInput, item) {
    if (!hasSellerSignature(psbtInput)) {
        throw createHttpError(400, `Listing ${item.inscriptionId} is missing a seller signature.`);
    }

    const isTaprootSignature = Boolean(
        psbtInput.tapKeySig
        || (Array.isArray(psbtInput.tapScriptSig) && psbtInput.tapScriptSig.length > 0)
    );

    let valid;

    try {
        valid = isTaprootSignature
            ? psbt.validateSignaturesOfInput(0, signatureValidator)
            : psbt.validateSignaturesOfInput(
                0,
                signatureValidator,
                Buffer.from(expandSignerPublicKey(item.listingData.sellerOrdinalsSigner.publicKey), 'hex')
            );
    } catch {
        throw createHttpError(400, `Listing ${item.inscriptionId} seller signature could not be validated.`);
    }

    if (!valid) {
        throw createHttpError(400, `Listing ${item.inscriptionId} seller signature is invalid.`);
    }
}

function validatePsbtSellerOutput(psbt, item) {
    const output = psbt.txOutputs[0];
    const outputAddress = decodeOutputAddress(output.script);
    const outputValue = normalizePsbtValue(output.value);
    const expectedValue = item.priceSats + item.utxo.amount;

    if (!outputAddress || outputAddress !== item.listingData.sellerPaymentsAddress) {
        throw createHttpError(400, `Listing ${item.inscriptionId} PSBT payout address does not match the listing data.`);
    }

    if (outputValue !== expectedValue) {
        throw createHttpError(400, `Listing ${item.inscriptionId} PSBT payout amount does not match the listing price and inscription value.`);
    }
}

function signatureValidator(pubkey, hash, signature) {
    try {
        const normalizedPubkey = Buffer.from(pubkey);
        const normalizedHash = Buffer.from(hash);
        const normalizedSignature = Buffer.from(signature);

        if (normalizedPubkey.length === 32) {
            return schnorr.verify(normalizedSignature, normalizedHash, normalizedPubkey);
        }

        return secp256k1.verify(normalizedSignature, normalizedHash, normalizedPubkey);
    } catch {
        return false;
    }
}

function hasSellerSignature(input) {
    return Boolean(
        (Array.isArray(input.partialSig) && input.partialSig.length > 0)
        || (Array.isArray(input.tapScriptSig) && input.tapScriptSig.length > 0)
        || input.tapKeySig
        || input.finalScriptSig
        || input.finalScriptWitness
    );
}

function expandSignerPublicKey(value) {
    const normalized = String(value || '').trim().toLowerCase();
    if (normalized.length === 64) {
        return `02${normalized}`;
    }

    return normalized;
}

function normalizeUtxo(utxo, inscriptionId) {
    if (!utxo || typeof utxo !== 'object' || Array.isArray(utxo)) {
        throw new Error(`Listing ${inscriptionId} is missing UTXO data.`);
    }

    const txid = normalizeHex(utxo.txid, 64);
    const index = Number(utxo.index);
    const amount = normalizePositiveInteger(utxo.amount);

    if (!txid || !Number.isInteger(index) || index < 0 || !amount) {
        throw new Error(`Listing ${inscriptionId} has an invalid UTXO.`);
    }

    return {
        txid,
        index,
        amount
    };
}

function normalizePositiveInteger(value) {
    const number = Number(value);
    return Number.isFinite(number) && number > 0 ? Math.round(number) : 0;
}

function normalizeNonNegativeInteger(value) {
    const number = Number(value);
    return Number.isFinite(number) && number >= 0 ? Math.round(number) : 0;
}

function normalizeAddress(value) {
    return String(value || '').trim();
}

function normalizeOptionalString(value) {
    const normalized = String(value || '').trim();
    return normalized || '';
}

function normalizeBoundedString(value, maxLength) {
    const normalized = String(value || '').trim();
    if (!normalized) return '';
    if (normalized.length > maxLength) {
        throw new Error(`Input exceeds the maximum supported length of ${maxLength} characters.`);
    }

    return normalized;
}

function normalizeIsoDate(value) {
    const normalized = String(value || '').trim();
    if (!normalized) return '';
    const date = new Date(normalized);
    return Number.isNaN(date.getTime()) ? '' : date.toISOString();
}

function normalizeAuthPublicKey(value) {
    const normalized = String(value || '').trim().toLowerCase();
    if (/^[0-9a-f]{64}$/.test(normalized)) {
        return normalized;
    }

    if (/^(02|03)[0-9a-f]{64}$/.test(normalized)) {
        return normalized;
    }

    return '';
}

function normalizeListingPublicKey(value) {
    const normalized = normalizeHex(value, [64, 66]);
    if (!normalized) return '';
    if (normalized.length === 66 && !normalized.startsWith('02') && !normalized.startsWith('03')) {
        return '';
    }

    return normalized;
}

function normalizeListingId(value) {
    const normalized = String(value || '').trim().toLowerCase();
    return /^[a-z0-9:_-]{8,160}$/.test(normalized) ? normalized : '';
}

function normalizeListingStatus(value) {
    const normalized = String(value || '').trim().toLowerCase();
    return ['active', 'filled', 'cancelled', 'stale'].includes(normalized) ? normalized : 'active';
}

function normalizeOfferType(value) {
    const normalized = String(value || '').trim().toLowerCase();
    return normalized === 'item' ? 'item' : '';
}

function normalizeOfferStatus(value) {
    const normalized = String(value || '').trim().toLowerCase();
    return ['open', 'accepted', 'cancelled', 'stale', 'expired'].includes(normalized) ? normalized : 'open';
}

function normalizeWalletProvider(value) {
    const normalized = String(value || '').trim().toLowerCase();
    if (!normalized) {
        return 'unknown';
    }

    return ['unisat', 'xverse'].includes(normalized) ? normalized : 'unknown';
}

function normalizeSignatureMethod(value) {
    const normalized = String(value || '').trim().toLowerCase();
    if (!normalized) {
        return 'ecdsa';
    }

    return ['ecdsa', 'bip322'].includes(normalized) ? normalized : '';
}

function normalizeSignableAction(value) {
    const normalized = String(value || '').trim().toLowerCase();
    return BOUTIQUE_SIGNABLE_ACTIONS.has(normalized) ? normalized : '';
}

function normalizeFeePreference(value) {
    const normalized = String(value || '').trim().toLowerCase();
    return ['priority', 'balanced', 'economy', 'custom'].includes(normalized) ? normalized : '';
}

function normalizeSafeUrl(value) {
    const normalized = String(value || '').trim();
    if (!normalized) return '';

    try {
        const url = new URL(normalized);
        return ['https:', 'http:'].includes(url.protocol) ? url.toString() : '';
    } catch {
        return '';
    }
}

function normalizeStoredOfferRecord(payload) {
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
        return null;
    }

    try {
        const offerId = normalizeOfferId(payload.offerId);
        const inscriptionId = normalizeInscriptionId(payload.inscriptionId || payload.id);
        const type = normalizeOfferType(payload.type || 'item');
        const collectionId = normalizeCollectionId(payload.collectionId);
        const priceSats = normalizePositiveInteger(payload.priceSats || payload.price);
        const createdAt = normalizeIsoDate(payload.createdAt) || new Date().toISOString();
        const updatedAt = normalizeIsoDate(payload.updatedAt) || createdAt;

        if (!offerId || !inscriptionId || !type || !collectionId || !priceSats) {
            return null;
        }

        return {
            offerId,
            type,
            collectionId,
            collectionName: normalizeOptionalString(payload.collectionName),
            inscriptionId,
            name: normalizeOptionalString(payload.name),
            priceSats,
            status: normalizeOfferStatus(payload.status),
            buyerAddress: normalizeAddress(payload.buyerAddress),
            buyerPublicKey: normalizeAuthPublicKey(payload.buyerPublicKey),
            buyerOrdinalsAddress: normalizeAddress(payload.buyerOrdinalsAddress || payload.buyerAddress),
            sellerAddress: normalizeAddress(payload.sellerAddress),
            sellerPaymentsAddress: normalizeAddress(payload.sellerPaymentsAddress || payload.sellerAddress),
            walletProvider: normalizeWalletProvider(payload.walletProvider),
            signatureMethod: normalizeSignatureMethod(payload.signatureMethod) || 'ecdsa',
            feePreference: normalizeFeePreference(payload.feePreference),
            feeRate: normalizePositiveInteger(payload.feeRate),
            buyerSignedPsbt: normalizeBoundedString(payload.buyerSignedPsbt || '', 120000),
            expiresAt: normalizeIsoDate(payload.expiresAt),
            createdAt,
            updatedAt,
            txid: normalizeHex(payload.txid, 64)
        };
    } catch {
        return null;
    }
}

function normalizeStoredProfileRecord(payload) {
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
        return createEmptyProfile('');
    }

    try {
        return {
            address: normalizeAddress(payload.address),
            username: normalizeBoundedString(payload.username || '', 40),
            avatarUrl: normalizeSafeUrl(payload.avatarUrl || ''),
            bio: normalizeBoundedString(payload.bio || '', 280),
            socialUrl: normalizeSafeUrl(payload.socialUrl || ''),
            walletProvider: normalizeWalletProvider(payload.walletProvider || ''),
            signatureMethod: normalizeSignatureMethod(payload.signatureMethod || '') || '',
            createdAt: normalizeIsoDate(payload.createdAt),
            updatedAt: normalizeIsoDate(payload.updatedAt)
        };
    } catch {
        return createEmptyProfile(normalizeAddress(payload.address));
    }
}

function normalizeInscriptionId(value) {
    return String(value || '').trim().toLowerCase();
}

function normalizeHex(value, expectedLength) {
    const normalized = String(value || '').trim().toLowerCase();
    if (!normalized || /[^0-9a-f]/.test(normalized)) return '';

    const allowedLengths = Array.isArray(expectedLength) ? expectedLength : [expectedLength];
    return allowedLengths.includes(normalized.length) ? normalized : '';
}

function normalizeOrigin(value) {
    return String(value || '').trim().replace(/\/+$/, '');
}

function normalizePsbtValue(value) {
    if (typeof value === 'bigint') {
        return Number(value);
    }

    const number = Number(value);
    return Number.isFinite(number) && number > 0 ? Math.round(number) : 0;
}

function decodeOutputAddress(script) {
    try {
        return bitcoin.address.fromOutputScript(Buffer.from(script), NETWORK);
    } catch {
        return '';
    }
}

function findOutputIndexForOffset(outputs, targetOffset) {
    let offset = 0;

    for (let index = 0; index < outputs.length; index += 1) {
        const value = normalizePsbtValue(outputs[index]?.value);
        if (targetOffset < offset + value) {
            return index;
        }

        offset += value;
    }

    return -1;
}

function publicKeyMatchesAddress(publicKey, address) {
    if (!publicKey || !address) return false;
    return deriveAddressCandidates(publicKey).includes(address);
}

function deriveAddressCandidates(publicKey) {
    const hex = String(publicKey || '').trim().toLowerCase();
    const candidates = new Set();

    try {
        if (hex.length === 64) {
            const xOnly = Buffer.from(hex, 'hex');
            const taproot = deriveTaprootAddressFromXOnly(xOnly);
            if (taproot) candidates.add(taproot);
            return Array.from(candidates);
        }

        if (hex.length !== 66) {
            return [];
        }

        const pubkey = Buffer.from(hex, 'hex');
        const xOnly = pubkey.subarray(1, 33);
        const p2wpkh = bitcoin.payments.p2wpkh({ pubkey, network: NETWORK }).address;
        const p2pkh = bitcoin.payments.p2pkh({ pubkey, network: NETWORK }).address;
        const p2sh = bitcoin.payments.p2sh({
            redeem: bitcoin.payments.p2wpkh({ pubkey, network: NETWORK }),
            network: NETWORK
        }).address;
        const p2tr = deriveTaprootAddressFromXOnly(xOnly);

        if (p2wpkh) candidates.add(p2wpkh);
        if (p2pkh) candidates.add(p2pkh);
        if (p2sh) candidates.add(p2sh);
        if (p2tr) candidates.add(p2tr);
    } catch {
        return [];
    }

    return Array.from(candidates);
}

function deriveTaprootAddressFromXOnly(xOnlyPublicKey) {
    if (!xOnlyPublicKey || xOnlyPublicKey.length !== 32) return '';

    const tweak = bitcoin.crypto.taggedHash('TapTweak', xOnlyPublicKey);
    const tweakScalar = bytesToBigInt(tweak) % secp256k1.CURVE.n;
    if (tweakScalar === 0n) return '';

    const basePoint = secp256k1.ProjectivePoint.fromHex(Buffer.concat([Buffer.from([0x02]), Buffer.from(xOnlyPublicKey)]));
    const tweakedPoint = basePoint.add(secp256k1.ProjectivePoint.BASE.multiply(tweakScalar));
    if (tweakedPoint.equals(secp256k1.ProjectivePoint.ZERO)) {
        return '';
    }

    const compressed = Buffer.from(tweakedPoint.toRawBytes(true));
    const tweakedXOnly = compressed.subarray(1, 33);
    return bitcoin.address.toBech32(tweakedXOnly, 1, NETWORK.bech32);
}

function bytesToBigInt(bytes) {
    return BigInt(`0x${Buffer.from(bytes).toString('hex')}`);
}

function verifySignedMessageWithPublicKey(expectedPublicKey, message, compactSignatureBase64) {
    const normalizedPublicKey = String(expectedPublicKey || '').trim().toLowerCase();
    const normalizedMessage = String(message || '');
    const normalizedSignature = String(compactSignatureBase64 || '').trim();

    if (!normalizedPublicKey || !normalizedSignature) {
        return false;
    }

    try {
        const signature = bitcore.crypto.Signature.fromCompact(Buffer.from(normalizedSignature, 'base64'));
        const hash = new bitcore.Message(normalizedMessage).magicHash();
        const recovered = bitcore.crypto.ECDSA.recoverPublicKey(hash, signature);
        const recoveredCompressed = bitcore.PublicKey.fromPoint(recovered.point, true).toString().toLowerCase();

        if (recoveredCompressed !== normalizedPublicKey) {
            return false;
        }

        return bitcore.crypto.ECDSA.verify(hash, signature, recovered);
    } catch {
        return false;
    }
}

function verifyBip322MessageSignature(address, message, signatureBase64) {
    const normalizedAddress = String(address || '').trim();
    const normalizedMessage = String(message || '');
    const normalizedSignature = String(signatureBase64 || '').trim();

    if (!normalizedAddress || !normalizedSignature) {
        return false;
    }

    try {
        return Boolean(BIP322Verifier.verifySignature(normalizedAddress, normalizedMessage, normalizedSignature));
    } catch {
        return false;
    }
}

function verifySignedAuthorization(address, publicKey, signatureMethod, message, signature) {
    if (signatureMethod === 'bip322') {
        return verifyBip322MessageSignature(address, message, signature);
    }

    return verifySignedMessageWithPublicKey(publicKey, message, signature);
}

async function fetchInscriptionDetails(inscriptionId, env) {
    const normalizedId = normalizeInscriptionId(inscriptionId);
    const now = Date.now();
    const cached = inscriptionDetailsCache.get(normalizedId);
    if (cached && cached.expiresAt > now) {
        return cloneJsonValue(cached.value);
    }

    const [localSnapshot, remoteInscriptionSnapshot] = await Promise.all([
        fetchLocalOrdInscriptionSnapshot(normalizedId, env).catch(() => null),
        fetchRemoteOrdinalsInscriptionSnapshot(normalizedId).catch(() => null)
    ]);

    if (!localSnapshot && !remoteInscriptionSnapshot) {
        throw createInfrastructureError(
            'ORD_LOOKUP_FAILED',
            `Unable to load inscription details for ${normalizedId} from local ord or ordinals.com.`
        );
    }

    const satNumber = String(remoteInscriptionSnapshot?.satNumber || '').trim();
    const remoteSatSnapshot = satNumber
        ? await fetchRemoteOrdinalsSatSnapshot(satNumber).catch(() => null)
        : null;
    const ownerSnapshot = await resolveTrackedInscriptionOwner(normalizedId, env).catch(() => null);
    const ownerOutpoint = String(ownerSnapshot?.outpoint || '').trim();
    const asset = typeof env?.getBoutiqueAsset === 'function'
        ? env.getBoutiqueAsset(normalizedId)
        : null;
    const manifest = await loadNormalizedStoredManifest(env).catch(() => EMPTY_MANIFEST);
    const activeListing = (Array.isArray(manifest?.items) ? manifest.items : []).find((entry) => (
        entry?.status === 'active' && normalizeInscriptionId(entry?.inscriptionId) === normalizedId
    )) || null;
    const [salesStore, historicalSales] = await Promise.all([
        loadNormalizedStoredSalesActivity(env).catch(() => EMPTY_SALES_ACTIVITY),
        typeof env.fetchBestInSlotInscriptionSales === 'function'
            ? env.fetchBestInSlotInscriptionSales(normalizedId).catch(() => [])
            : Promise.resolve([])
    ]);
    const salesHistory = dedupeSaleRecords([
        ...(Array.isArray(salesStore.items) ? salesStore.items.filter((entry) => entry.inscriptionId === normalizedId) : []),
        ...(Array.isArray(historicalSales) ? historicalSales : [])
    ])
        .sort((left, right) => compareIsoDatesDescending(left?.occurredAt, right?.occurredAt))
        .slice(0, 16);

    const details = {
        inscriptionId: normalizedId,
        collectionId: normalizeCollectionId(asset?.collectionId),
        collectionName: normalizeOptionalString(asset?.collectionName),
        inscriptionNumber: normalizePositiveInteger(localSnapshot?.inscriptionNumber || remoteInscriptionSnapshot?.inscriptionNumber),
        createdTimestamp: normalizeOptionalString(localSnapshot?.createdTimestamp || remoteInscriptionSnapshot?.createdTimestamp),
        contentType: normalizeOptionalString(localSnapshot?.contentType || remoteInscriptionSnapshot?.contentType),
        contentLengthBytes: normalizePositiveInteger(localSnapshot?.contentLengthBytes || remoteInscriptionSnapshot?.contentLengthBytes),
        ownerAddress: normalizeAddress(ownerSnapshot?.address || localSnapshot?.ownerAddress || remoteInscriptionSnapshot?.ownerAddress),
        outpoint: normalizeOptionalString(ownerOutpoint),
        outputValue: normalizePositiveInteger(ownerSnapshot?.amount),
        locationTxid: normalizeHex(ownerOutpoint.split(':')[0], 64),
        locationIndex: normalizeNonNegativeInteger(ownerOutpoint.split(':')[1]),
        activeListing: createListingSummary(activeListing),
        ordinalsUrl: `https://ordinals.com/inscription/${normalizedId}`,
        satNumber,
        salesHistory,
        satributes: buildIconBackedSatributes({
            inscriptionId: normalizedId,
            localSnapshot,
            remoteInscriptionSnapshot,
            remoteSatSnapshot,
            env
        })
    };

    inscriptionDetailsCache.set(normalizedId, {
        expiresAt: now + INSCRIPTION_DETAILS_CACHE_TTL_MS,
        value: details
    });

    return cloneJsonValue(details);
}

async function fetchLocalOrdInscriptionSnapshot(inscriptionId, env) {
    const html = await fetchHtml(`${stripTrailingSlash(env.ordBaseUrl)}/inscription/${encodeURIComponent(inscriptionId)}`);
    const inscriptionNumber = extractInscriptionNumber(html);
    if (!inscriptionNumber) {
        throw createInfrastructureError('ORD_LOOKUP_FAILED', `Ord response for inscription ${inscriptionId} did not include an inscription number.`);
    }

    return {
        inscriptionNumber,
        ownerAddress: extractDefinitionValue(html, 'address'),
        contentType: extractDefinitionValue(html, 'content type'),
        contentLengthBytes: extractByteCount(extractDefinitionValue(html, 'content length')),
        createdTimestamp: extractDefinitionValue(html, 'timestamp'),
        outputOffset: normalizePositiveInteger(extractDefinitionValue(html, 'offset'))
    };
}

async function fetchRemoteOrdinalsInscriptionSnapshot(inscriptionId) {
    const html = await fetchHtml(`https://ordinals.com/inscription/${encodeURIComponent(inscriptionId)}`);
    return {
        inscriptionNumber: extractInscriptionNumber(html),
        satNumber: extractDefinitionValue(html, 'sat').replace(/[^\d]/g, ''),
        ownerAddress: extractDefinitionValue(html, 'address'),
        contentType: extractDefinitionValue(html, 'content type'),
        contentLengthBytes: extractByteCount(extractDefinitionValue(html, 'content length')),
        createdTimestamp: extractDefinitionValue(html, 'timestamp')
    };
}

async function fetchRemoteOrdinalsSatSnapshot(satNumber) {
    const html = await fetchHtml(`https://ordinals.com/sat/${encodeURIComponent(String(satNumber || '').trim())}`);
    return {
        satNumber: String(satNumber || '').trim(),
        rarity: normalizeOptionalString(extractDefinitionValue(html, 'rarity')),
        charms: parseCharms(extractDefinitionValue(html, 'charms')),
        block: normalizePositiveInteger(extractDefinitionValue(html, 'block')),
        timestamp: normalizeOptionalString(extractDefinitionValue(html, 'timestamp'))
    };
}

async function fetchHtml(url) {
    const fetchOptions = {
        headers: {
            Accept: 'text/html,application/xhtml+xml',
            'User-Agent': 'blok-boutique/1.0'
        }
    };

    if (typeof AbortSignal !== 'undefined' && typeof AbortSignal.timeout === 'function') {
        fetchOptions.signal = AbortSignal.timeout(REMOTE_FETCH_TIMEOUT_MS);
    }

    const response = await fetch(url, fetchOptions);
    if (!response.ok) {
        throw new Error(`Request failed (${response.status}).`);
    }

    return response.text();
}

function buildIconBackedSatributes({ inscriptionId, localSnapshot, remoteInscriptionSnapshot, remoteSatSnapshot, env }) {
    const satributes = [];
    const charmSet = new Set(
        (Array.isArray(remoteSatSnapshot?.charms) ? remoteSatSnapshot.charms : [])
            .map((value) => String(value || '').trim().toLowerCase())
            .filter(Boolean)
    );
    const rarity = String(remoteSatSnapshot?.rarity || '').trim().toLowerCase();
    const block = normalizePositiveInteger(remoteSatSnapshot?.block);
    const satNumber = String(remoteInscriptionSnapshot?.satNumber || remoteSatSnapshot?.satNumber || '').trim();
    const normalizedInscriptionId = normalizeInscriptionId(inscriptionId);
    const asset = typeof env?.getBoutiqueAsset === 'function'
        ? env.getBoutiqueAsset(normalizedInscriptionId)
        : null;
    const collection = getCatalogCollection(env, asset?.collectionId);

    const addSatribute = (key, label, description, iconPath) => {
        if (!iconPath || satributes.some((entry) => entry.key === key)) return;
        satributes.push({
            key,
            label,
            description,
            iconPath
        });
    };

    if (rarity === 'uncommon' || charmSet.has('uncommon')) {
        addSatribute(
            'uncommon',
            'Uncommon',
            'Uncommon: The first sat of each block.',
            '/Images/Uncommon.svg'
        );
    }

    if (ALPHA_INSCRIPTION_IDS.has(normalizedInscriptionId)) {
        addSatribute(
            'alpha',
            'Alpha',
            'Alpha: The first sat in each bitcoin.',
            '/Images/Alpha.svg'
        );
    }

    if (satNumber && isNumericPalindrome(satNumber)) {
        addSatribute(
            'palindrome',
            'Palindrome',
            'Palindrome: Sat number reads the same forwards and backwards.',
            '/Images/Palindrome.svg'
        );
    }

    if (block === 78 || charmSet.has('block 78')) {
        addSatribute(
            'block-78',
            'Block 78',
            'Block 78: Sats mined by Hal Finney in block 78 which was the first block mined by someone other than Satoshi.',
            '/Images/Block 78.svg'
        );
    }

    if (BLOCK_9_INSCRIPTION_IDS.has(normalizedInscriptionId) || charmSet.has('block 9')) {
        addSatribute(
            'block-9',
            'Block 9',
            'Block 9: Sats mined in block 9 which are the oldest sats in circulation.',
            '/Images/Block 9.svg'
        );
    }

    if (SILK_ROAD_INSCRIPTION_IDS.has(normalizedInscriptionId) || charmSet.has('silk road')) {
        addSatribute(
            'silk-road',
            'Silk Road',
            'Silk Road: Sats seized from the Silk Road marketplace and are from the first Bitcoin auctioned off on June 27, 2014 by US Marshals.',
            '/Images/Silk Road.svg'
        );
    }

    if (charmSet.has('satoshi') || charmSet.has('nakamoto')) {
        addSatribute(
            'satoshi',
            charmSet.has('nakamoto') ? 'Nakamoto' : 'Satoshi',
            charmSet.has('nakamoto')
                ? 'Nakamoto: Sats from the earliest era of Bitcoin associated with Satoshi Nakamoto.'
                : 'Satoshi: Sats associated with Satoshi Nakamoto.',
            '/Images/Satoshi.svg'
        );
    }

    if (collection?.forcedSatribute) {
        addSatribute(
            normalizeOptionalString(collection.forcedSatribute.key),
            normalizeOptionalString(collection.forcedSatribute.label),
            normalizeOptionalString(collection.forcedSatribute.description),
            normalizeOptionalString(collection.forcedSatribute.iconPath)
        );
    }

    return satributes;
}

function extractInscriptionNumber(html) {
    const titleMatch = String(html || '').match(/<h1>\s*Inscription\s+([0-9,]+)\s*<\/h1>/i)
        || String(html || '').match(/<title>\s*Inscription\s+([0-9,]+)\s*<\/title>/i);
    return normalizePositiveInteger(titleMatch?.[1] || '');
}

function extractDefinitionValue(html, label) {
    const pattern = new RegExp(`<dt[^>]*>\\s*${escapeRegExp(label)}\\s*<\\/dt>\\s*<dd[^>]*>([\\s\\S]*?)<\\/dd>`, 'i');
    const match = String(html || '').match(pattern);
    if (!match) return '';
    return collapseWhitespace(stripTags(decodeHtmlEntities(match[1])));
}

function extractByteCount(value) {
    const normalized = String(value || '').replace(/,/g, '').trim();
    const match = normalized.match(/(\d+)/);
    return normalizePositiveInteger(match?.[1] || '');
}

function parseCharms(value) {
    const normalized = String(value || '').trim();
    if (!normalized) return [];

    return normalized
        .split(/\s*,\s*|\s*\u2022\s*|\s*\|\s*/g)
        .map((entry) => collapseWhitespace(decodeHtmlEntities(stripTags(entry))))
        .filter(Boolean);
}

function isNumericPalindrome(value) {
    const normalized = String(value || '').replace(/[^\d]/g, '');
    if (normalized.length < 2) return false;
    return normalized === normalized.split('').reverse().join('');
}

function stripTags(value) {
    return String(value || '').replace(/<[^>]+>/g, ' ');
}

function collapseWhitespace(value) {
    return String(value || '').replace(/\s+/g, ' ').trim();
}

function decodeHtmlEntities(value) {
    return String(value || '')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, '\'')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&nbsp;/g, ' ');
}

function escapeRegExp(value) {
    return String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function cloneJsonValue(value) {
    return JSON.parse(JSON.stringify(value));
}

function normalizeApiPath(pathname, env) {
    const normalizedBasePath = stripTrailingSlash(env.basePath);
    const normalizedPath = stripTrailingSlash(pathname);
    const apiPrefix = `${normalizedBasePath}/api`;

    if (!normalizedPath.startsWith(apiPrefix)) {
        return '';
    }

    const relative = normalizedPath.slice(apiPrefix.length);
    return relative || '/';
}

async function fetchBtcUsdQuote() {
    const now = Date.now();
    if (btcUsdQuoteCache && (now - btcUsdQuoteCache.fetchedAt) < BTC_USD_CACHE_TTL_MS) {
        return {
            btcUsd: btcUsdQuoteCache.btcUsd,
            updatedAt: btcUsdQuoteCache.updatedAt,
            source: btcUsdQuoteCache.source
        };
    }

    try {
        const response = await fetch('https://api.coinbase.com/v2/prices/spot?currency=USD', {
            headers: {
                Accept: 'application/json',
                'User-Agent': 'blok-boutique/1.0'
            }
        });

        if (!response.ok) {
            throw new Error(`Coinbase spot request failed (${response.status}).`);
        }

        const payload = await response.json();
        const btcUsd = Number(payload?.data?.amount);
        if (!Number.isFinite(btcUsd) || btcUsd <= 0) {
            throw new Error('Coinbase spot response did not include a valid BTC/USD price.');
        }

        const updatedAt = new Date().toISOString();
        btcUsdQuoteCache = {
            btcUsd,
            updatedAt,
            fetchedAt: now,
            source: 'coinbase'
        };

        return {
            btcUsd,
            updatedAt,
            source: 'coinbase'
        };
    } catch {
        if (btcUsdQuoteCache) {
            return {
                btcUsd: btcUsdQuoteCache.btcUsd,
                updatedAt: btcUsdQuoteCache.updatedAt,
                source: btcUsdQuoteCache.source,
                stale: true
            };
        }

        return {
            btcUsd: null,
            updatedAt: '',
            source: 'coinbase'
        };
    }
}

function stripTrailingSlash(value) {
    return String(value || '').replace(/\/+$/, '');
}

function enforceRateLimitForRequest(request, env, apiPath) {
    if (!env || typeof env.consumeRateLimit !== 'function') return;

    const category = resolveRateLimitCategory(request, apiPath);
    if (!category) return;

    env.consumeRateLimit(request, category);
}

function resolveRateLimitCategory(request, apiPath) {
    const method = String(request.method || 'GET').toUpperCase();

    if (apiPath === '/btc/fees/recommended' && method === 'GET') {
        return '';
    }

    if (apiPath === '/auth/challenge' && method === 'POST') {
        return 'challenge';
    }

    if (apiPath === '/auth/broadcast-challenge' && method === 'POST') {
        return 'challenge';
    }

    if (apiPath === '/listings' && method === 'POST') {
        return 'publish';
    }

    if (apiPath === '/offers' && method === 'POST') {
        return 'publish';
    }

    if (/^\/offers\/[^/]+\/(prepare-accept|cancel|accept)$/i.test(apiPath) && method === 'POST') {
        return 'publish';
    }

    if (/^\/profiles\/.+$/i.test(apiPath) && method === 'PUT') {
        return 'publish';
    }

    if (apiPath === '/btc/tx' && method === 'POST') {
        return 'broadcast';
    }

    if (/^\/btc\/address\/.+\/utxo$/i.test(apiPath)) {
        return 'utxo';
    }

    if (apiPath.startsWith('/btc/') || apiPath.startsWith('/market/') || apiPath.startsWith('/inscription/')) {
        return 'default';
    }

    return apiPath === '/listings' || apiPath === '/sales' ? 'default' : '';
}

function enforceAllowedOrigin(request, env, requireOrigin = false) {
    const origin = normalizeOrigin(request.headers.get('Origin'));

    if (!origin) {
        if (requireOrigin) {
            throw createHttpError(403, 'Origin header is required for this request.');
        }

        return;
    }

    if (!hasAllowedOrigins(env)) {
        if (requireOrigin) {
            throw createHttpError(403, 'No allowed origins are configured for this storefront.');
        }

        return;
    }

    if (!isAllowedOrigin(origin, env)) {
        throw createHttpError(403, 'This origin is not allowed for this storefront.');
    }
}

function buildCorsHeaders(request, env) {
    const origin = normalizeOrigin(request.headers.get('Origin'));
    const headers = {
        'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '86400',
        Vary: 'Origin'
    };

    if (origin && isAllowedOrigin(origin, env)) {
        headers['Access-Control-Allow-Origin'] = origin;
    }

    return headers;
}

function jsonResponse(payload, status, request, env) {
    return new Response(JSON.stringify(payload), {
        status,
        headers: {
            ...JSON_HEADERS,
            ...buildCorsHeaders(request, env)
        }
    });
}

function formatErrorMessage(error) {
    const message = error && error.message ? String(error.message) : String(error || 'Unknown error');
    return message.replace(/\s+/g, ' ').trim();
}

function hasAllowedOrigins(env) {
    return Array.isArray(env.allowedOrigins) && env.allowedOrigins.length > 0;
}

function isAllowedOrigin(origin, env) {
    const normalizedOrigin = normalizeOrigin(origin);
    if (!normalizedOrigin) return false;

    const allowedOrigins = Array.isArray(env.allowedOrigins) ? env.allowedOrigins : [];
    return allowedOrigins.includes(normalizedOrigin);
}

function normalizeTransactionHex(value) {
    const normalized = String(value || '').trim().toLowerCase();
    if (!normalized) return '';
    if (normalized.length % 2 !== 0) return '';
    if (normalized.length > 400_000) return '';
    return /[^0-9a-f]/.test(normalized) ? '' : normalized;
}

function decodeTransaction(rawHex) {
    try {
        return bitcoin.Transaction.fromHex(String(rawHex || '').trim());
    } catch {
        throw createHttpError(400, 'Raw transaction hex could not be decoded.');
    }
}

function parseTransactionId(rawHex) {
    try {
        return decodeTransaction(rawHex).getId();
    } catch {
        throw new Error('Raw transaction hex could not be decoded.');
    }
}

function formatTransactionInputOutpoint(input) {
    const outpoint = parseTransactionInputOutpoint(input);
    return outpoint ? `${outpoint.txid}:${outpoint.index}` : '';
}

function parseTransactionInputOutpoint(input) {
    if (!input) return null;

    const txid = Buffer.from(input.hash || []).reverse().toString('hex');
    const index = Number(input.index);

    if (!txid || !Number.isInteger(index) || index < 0) {
        return null;
    }

    return { txid, index };
}

function createHttpError(status, message, extras = {}) {
    const error = new Error(message);
    error.status = status;
    Object.assign(error, extras);
    return error;
}

function inferStatusCode(error) {
    const status = Number(error?.status);
    return Number.isInteger(status) && status >= 400 && status < 600
        ? status
        : isInfrastructureError(error)
            ? 502
            : 500;
}

function isInfrastructureError(error) {
    return Boolean(error?.infrastructure || ['ORD_LOOKUP_FAILED', 'BITCOIND_RPC_FAILED', 'BTC_UTXO_LOOKUP_FAILED', 'MANIFEST_IO_FAILED'].includes(String(error?.code || '').trim()));
}

