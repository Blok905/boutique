import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { BOUTIQUE_COLLECTIONS, normalizeCollectionId } from './collection-registry.js';

export async function buildBoutiqueCatalog(projectRoot) {
    const collections = [];
    const assets = [];
    const assetsById = new Map();
    const assetsByCollection = new Map();

    for (const collection of BOUTIQUE_COLLECTIONS) {
        const metadataPath = path.resolve(projectRoot, String(collection.metadataFile || '').trim());
        const raw = await readFile(metadataPath, 'utf8');
        const payload = JSON.parse(raw);
        const assetFileIndex = await buildAssetFileIndex(projectRoot, collection.assetDirectory);
        const collectionAssets = (Array.isArray(payload) ? payload : []).map((entry, index) => {
            const asset = buildCatalogAsset(entry, index, collection, assetFileIndex);
            assetsById.set(asset.id, asset);
            return asset;
        });

        collections.push({
            ...collection,
            assetCount: collectionAssets.length
        });
        assets.push(...collectionAssets);
        assetsByCollection.set(collection.id, collectionAssets);
    }

    return {
        collections,
        assets,
        assetsById,
        assetsByCollection
    };
}

function buildCatalogAsset(entry, index, collection, assetFileIndex) {
    const inscriptionId = normalizeInscriptionId(entry?.id);
    const name = String(entry?.meta?.name || `${collection.name} #${index + 1}`).trim();
    const assetNumber = extractAssetNumber(name, index + 1);
    const media = resolveAssetMedia(entry, name, assetNumber, collection, assetFileIndex);
    const traits = Array.isArray(entry?.meta?.attributes)
        ? entry.meta.attributes
            .map((trait) => ({
                trait_type: String(trait?.trait_type || '').trim(),
                value: String(trait?.value || '').trim()
            }))
            .filter((trait) => trait.trait_type && trait.value)
        : [];

    return {
        id: inscriptionId,
        collectionId: collection.id,
        collectionName: String(collection.name || '').trim(),
        name,
        number: assetNumber,
        imageSrc: media.src,
        mediaType: media.type,
        traits,
        sortOrder: assetNumber > 0 ? assetNumber : index + 1
    };
}

async function buildAssetFileIndex(projectRoot, assetDirectory) {
    const normalizedDirectory = String(assetDirectory || '').trim();
    if (!normalizedDirectory) {
        return new Map();
    }

    const targetDirectory = path.resolve(projectRoot, normalizedDirectory);
    const entries = await readdir(targetDirectory, { withFileTypes: true }).catch(() => []);
    const index = new Map();

    for (const entry of entries) {
        if (!entry.isFile()) continue;
        const basename = path.parse(entry.name).name;
        const normalizedKey = normalizeAssetKey(basename);
        if (!normalizedKey || index.has(normalizedKey)) continue;
        index.set(normalizedKey, `/${normalizedDirectory.replace(/\\/g, '/')}/${entry.name}`);
    }

    return index;
}

function resolveAssetMedia(entry, name, assetNumber, collection, assetFileIndex) {
    const inscriptionId = normalizeInscriptionId(entry?.id);
    const previewType = String(collection?.previewType || '').trim().toLowerCase();
    if (previewType === 'iframe' && inscriptionId) {
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
        src: resolveAssetImage(name, assetNumber, collection, assetFileIndex),
        type: 'image'
    };
}

function resolveAssetImage(name, assetNumber, collection, assetFileIndex) {
    const explicitImage = collection?.explicitImageMap?.[name];
    if (explicitImage) {
        return explicitImage;
    }

    for (const candidate of getAssetImageCandidates(name, assetNumber)) {
        const normalizedKey = normalizeAssetKey(candidate);
        if (!normalizedKey) continue;
        const assetPath = assetFileIndex.get(normalizedKey);
        if (assetPath) {
            return assetPath;
        }
    }

    return String(collection?.fallbackImagePath || collection?.imagePath || '').trim();
}

function getAssetImageCandidates(name, assetNumber) {
    const candidates = [];
    const trimmedName = String(name || '').trim();
    if (assetNumber > 0) {
        candidates.push(String(assetNumber));
    }
    if (trimmedName) {
        const withoutEditionNumber = trimmedName.replace(/\s+#\d+\s*$/i, '').trim();
        const withoutTrailingPunk = withoutEditionNumber.replace(/\s+punk$/i, '').trim();
        const withoutLeadingPunk = withoutEditionNumber.replace(/^punk\s+/i, '').trim();
        const withoutLeadingOrTrailingPunk = withoutLeadingPunk.replace(/\s+punk$/i, '').trim();

        candidates.push(trimmedName);
        candidates.push(withoutEditionNumber);
        candidates.push(withoutTrailingPunk);
        candidates.push(withoutLeadingPunk);
        candidates.push(withoutLeadingOrTrailingPunk);

        if (!/\bpunk\b/i.test(withoutEditionNumber)) {
            candidates.push(`${withoutEditionNumber} Punk`);
        }
    }

    return Array.from(new Set(candidates.filter(Boolean)));
}

function extractAssetNumber(name, fallback) {
    const match = String(name || '').match(/#(\d+)/);
    if (match) {
        return Number(match[1]) || 0;
    }

    return Number(fallback) || 0;
}

function normalizeAssetKey(value) {
    return String(value || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '');
}

function normalizeInscriptionId(value) {
    return String(value || '').trim().toLowerCase();
}

export function findCatalogAssetById(catalog, inscriptionId) {
    return catalog?.assetsById?.get(normalizeInscriptionId(inscriptionId)) || null;
}

export function findCatalogCollection(catalog, collectionId) {
    const normalizedId = normalizeCollectionId(collectionId);
    return Array.isArray(catalog?.collections)
        ? catalog.collections.find((entry) => entry.id === normalizedId) || null
        : null;
}
