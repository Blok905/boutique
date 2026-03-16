import { BOUTIQUE_COLLECTIONS, normalizeCollectionId } from './collection-registry.js?v=20260314-35';

const DEFAULT_API_BASE = resolveDefaultApiBase();
const metadataCache = new Map();
const collectionRegistryById = new Map(BOUTIQUE_COLLECTIONS.map((collection) => [normalizeCollectionId(collection.id), collection]));
const apiStatus = {
    live: true,
    message: ''
};

export const MARKETPLACE_API = {
    baseUrl: DEFAULT_API_BASE,
    async getCollections() {
        try {
            const payload = await fetchJson(`${DEFAULT_API_BASE}/collections`);
            apiStatus.live = true;
            apiStatus.message = '';
            return Array.isArray(payload?.items)
                ? payload.items.map((collection) => hydrateCollectionSummary(collection))
                : [];
        } catch (error) {
            apiStatus.live = false;
            apiStatus.message = formatApiError(error);
            return buildFallbackCollections();
        }
    },
    async getAssets(collectionId) {
        try {
            const payload = await fetchJson(`${DEFAULT_API_BASE}/assets?collection=${encodeURIComponent(String(collectionId || '').trim())}`);
            apiStatus.live = true;
            apiStatus.message = '';
            const collection = hydrateCollectionSummary(payload?.collection || null);
            const recordSales = Array.isArray(payload?.recordSales)
                ? payload.recordSales
                : Array.isArray(payload?.collection?.recordSales)
                    ? payload.collection.recordSales
                    : [];
            const recentSalesActivity = Array.isArray(payload?.recentSalesActivity)
                ? payload.recentSalesActivity
                : Array.isArray(payload?.collection?.recentSalesActivity)
                    ? payload.collection.recentSalesActivity
                    : [];

            return {
                collection: collection
                    ? {
                        ...collection,
                        recordSales,
                        recentSalesActivity
                    }
                    : null,
                recordSales,
                recentSalesActivity,
                items: Array.isArray(payload?.items) ? payload.items : []
            };
        } catch (error) {
            apiStatus.live = false;
            apiStatus.message = formatApiError(error);
            return buildFallbackAssets(collectionId);
        }
    },
    async getListings(collectionId = '') {
        try {
            const suffix = collectionId ? `?collection=${encodeURIComponent(String(collectionId || '').trim())}` : '';
            const payload = await fetchJson(`${DEFAULT_API_BASE}/listings${suffix}`);
            return Array.isArray(payload?.items) ? payload.items : [];
        } catch {
            return [];
        }
    },
    async getOffers(collectionId = '', inscriptionId = '', status = 'open') {
        try {
            const params = new URLSearchParams();
            if (collectionId) params.set('collection', String(collectionId || '').trim());
            if (inscriptionId) params.set('inscriptionId', String(inscriptionId || '').trim());
            if (status) params.set('status', String(status || '').trim());
            const suffix = params.toString() ? `?${params.toString()}` : '';
            const payload = await fetchJson(`${DEFAULT_API_BASE}/offers${suffix}`);
            return Array.isArray(payload?.items) ? payload.items : [];
        } catch {
            return [];
        }
    },
    async getOffer(offerId) {
        return fetchJson(`${DEFAULT_API_BASE}/offers/${encodeURIComponent(String(offerId || '').trim())}`);
    },
    async prepareOfferAccept(offerId, body) {
        return fetchJson(`${DEFAULT_API_BASE}/offers/${encodeURIComponent(String(offerId || '').trim())}/prepare-accept`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });
    },
    async getBtcUsdQuote() {
        return fetchJson(`${DEFAULT_API_BASE}/market/btc-usd`);
    },
    async getPortfolio(address) {
        return fetchJson(`${DEFAULT_API_BASE}/address/${encodeURIComponent(String(address || '').trim())}/portfolio`);
    },
    async getProfile(address) {
        return fetchJson(`${DEFAULT_API_BASE}/profiles/${encodeURIComponent(String(address || '').trim())}`);
    },
    async getInscriptionDetails(inscriptionId) {
        return fetchJson(`${DEFAULT_API_BASE}/inscription/${encodeURIComponent(String(inscriptionId || '').trim())}/details`);
    },
    async createChallenge(body) {
        return fetchJson(`${DEFAULT_API_BASE}/auth/challenge`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });
    },
    async publishListings(body) {
        return fetchJson(`${DEFAULT_API_BASE}/listings`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });
    },
    async createOffer(body) {
        return fetchJson(`${DEFAULT_API_BASE}/offers`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });
    },
    async cancelOffer(offerId, body) {
        return fetchJson(`${DEFAULT_API_BASE}/offers/${encodeURIComponent(String(offerId || '').trim())}/cancel`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });
    },
    async acceptOffer(offerId, body) {
        return fetchJson(`${DEFAULT_API_BASE}/offers/${encodeURIComponent(String(offerId || '').trim())}/accept`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });
    },
    async saveProfile(address, body) {
        return fetchJson(`${DEFAULT_API_BASE}/profiles/${encodeURIComponent(String(address || '').trim())}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });
    }
};

export function getMarketplaceApiStatus() {
    return { ...apiStatus };
}

export function resolveDefaultApiBase() {
    if (typeof window === 'undefined' || !window.location) {
        return '/boutique/api';
    }

    const { protocol, hostname, port } = window.location;
    const normalizedProtocol = protocol === 'https:' ? 'https:' : 'http:';
    const isLocalHost = hostname === '127.0.0.1' || hostname === 'localhost';

    if (protocol === 'file:') {
        return 'http://127.0.0.1:8787/boutique/api';
    }

    if (isLocalHost && port && port !== '8787') {
        return `${normalizedProtocol}//${hostname}:8787/boutique/api`;
    }

    return '/boutique/api';
}

export async function fetchJson(url, options = {}) {
    const response = await fetch(String(url || '').trim(), {
        cache: 'no-store',
        ...options
    });
    const text = await response.text();
    const payload = text ? safeParseJson(text) : null;

    if (!response.ok) {
        const message = payload?.error || text || `Request failed (${response.status})`;
        throw new Error(String(message || 'Request failed.').trim());
    }

    return payload;
}

function safeParseJson(value) {
    try {
        return JSON.parse(String(value || '').trim());
    } catch {
        return null;
    }
}

function hydrateCollectionSummary(collection) {
    if (!collection) {
        return null;
    }

    const normalizedId = normalizeCollectionId(collection.id);
    const registryEntry = collectionRegistryById.get(normalizedId) || null;
    if (!registryEntry) {
        return collection;
    }

    return {
        ...collection,
        description: registryEntry.description || collection.description || '',
        iconPath: registryEntry.iconPath || collection.iconPath || '',
        imagePath: collection.imagePath || registryEntry.imagePath || registryEntry.fallbackImagePath || '',
        previewType: collection.previewType || registryEntry.previewType || '',
        previewPath: collection.previewPath || registryEntry.previewPath || '',
        accentColor: collection.accentColor || registryEntry.accentColor || '#f7931a',
        metadataUrl: collection.metadataUrl || registryEntry.metadataUrl || '',
        forcedSatribute: collection.forcedSatribute || registryEntry.forcedSatribute || null
    };
}

async function buildFallbackCollections() {
    const metadataSets = await Promise.all(BOUTIQUE_COLLECTIONS.map((collection) => loadCollectionMetadata(collection)));
    return BOUTIQUE_COLLECTIONS.map((collection, index) => hydrateCollectionSummary({
        id: collection.id,
        name: collection.name,
        description: collection.description,
        iconPath: collection.iconPath || '',
        imagePath: collection.imagePath || collection.fallbackImagePath || '',
        previewType: collection.previewType || '',
        previewPath: collection.previewPath || '',
        accentColor: collection.accentColor || '#57e1ff',
        metadataUrl: collection.metadataUrl || '',
        assetCount: metadataSets[index].length,
        activeListingCount: 0,
        floorPriceSats: 0,
        openOfferCount: 0,
        latestSale: null,
        forcedSatribute: collection.forcedSatribute || null
    }));
}

async function buildFallbackAssets(collectionId) {
    const collection = BOUTIQUE_COLLECTIONS.find((entry) => entry.id === normalizeCollectionId(collectionId)) || null;
    if (!collection) {
        return {
            collection: null,
            recordSales: [],
            recentSalesActivity: [],
            items: []
        };
    }

    const metadata = await loadCollectionMetadata(collection);
    return {
        collection: hydrateCollectionSummary({
            id: collection.id,
            name: collection.name,
            description: collection.description,
            iconPath: collection.iconPath || '',
            imagePath: collection.imagePath || collection.fallbackImagePath || '',
            previewType: collection.previewType || '',
            previewPath: collection.previewPath || '',
            accentColor: collection.accentColor || '#57e1ff',
            metadataUrl: collection.metadataUrl || '',
            assetCount: metadata.length,
            forcedSatribute: collection.forcedSatribute || null,
            recordSales: [],
            recentSalesActivity: []
        }),
        recordSales: [],
        recentSalesActivity: [],
        items: metadata.map((entry, index) => buildFallbackAsset(entry, index, collection))
    };
}

async function loadCollectionMetadata(collection) {
    const cacheKey = normalizeCollectionId(collection.id);
    if (metadataCache.has(cacheKey)) {
        return metadataCache.get(cacheKey);
    }

    const promise = fetchJson(collection.metadataUrl || `/Metadata/${cacheKey}-metadata.json`).catch(() => []);
    metadataCache.set(cacheKey, promise);
    return promise;
}

function buildFallbackAsset(entry, index, collection) {
    const name = String(entry?.meta?.name || `${collection.name} #${index + 1}`).trim();
    const number = extractAssetNumber(name, index + 1);
    const media = resolveFallbackAssetMedia(collection, entry, name, number);
    const traits = Array.isArray(entry?.meta?.attributes)
        ? entry.meta.attributes
            .map((trait) => ({
                trait_type: String(trait?.trait_type || '').trim(),
                value: String(trait?.value || '').trim()
            }))
            .filter((trait) => trait.trait_type && trait.value)
        : [];

    return {
        id: String(entry?.id || '').trim().toLowerCase(),
        collectionId: collection.id,
        collectionName: collection.name,
        name,
        number,
        imageSrc: media.src,
        mediaType: media.type,
        traits,
        sortOrder: number,
        listing: null,
        topOffer: null,
        itemOfferCount: 0
    };
}

function resolveFallbackAssetMedia(collection, entry, name, number) {
    const inscriptionId = String(entry?.id || '').trim().toLowerCase();
    if (String(collection?.previewType || '').trim().toLowerCase() === 'iframe' && inscriptionId) {
        const previewPath = String(collection?.previewPath || '').trim();
        if (previewPath) {
            return {
                src: previewPath,
                type: 'iframe'
            };
        }

        return {
            src: `/boutique/content/${encodeURIComponent(inscriptionId)}`,
            type: 'iframe'
        };
    }

    return {
        src: resolveFallbackAssetImage(collection, name, number),
        type: 'image'
    };
}

function resolveFallbackAssetImage(collection, name, number) {
    const explicitImage = collection.explicitImageMap?.[name];
    if (explicitImage) {
        return explicitImage;
    }

    const normalizedName = String(name || '').trim();
    const encodedNumber = encodeURIComponent(String(number || ''));
    if (collection.assetDirectory && number > 0 && (collection.id === 'blok-boyz' || collection.id === 'blok-space')) {
        return `/${collection.assetDirectory}/${encodedNumber}.svg`;
    }

    if (collection.assetDirectory && normalizedName) {
        return `/${collection.assetDirectory}/${encodeURIComponent(normalizedName)}.svg`;
    }

    return collection.fallbackImagePath || collection.imagePath || '';
}

function extractAssetNumber(name, fallback) {
    const match = String(name || '').match(/#(\d+)/);
    return match ? Number(match[1] || fallback) : Number(fallback || 0);
}

function formatApiError(error) {
    return String(error?.message || error || 'API unavailable.').replace(/\s+/g, ' ').trim();
}

