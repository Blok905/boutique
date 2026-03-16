const ART_DROPS_IMAGE_MAP = {
    'Blok 9 Miner': '/Art-Drops/Blok 9 Miner.svg',
    'Roadmap': '/Art-Drops/Roadmap.svg',
    'Fiat Fuel': '/Art-Drops/Fiat Fuel.svg',
    'Moon Boi': '/Art-Drops/Moon Boi.svg',
    'Deserted': '/Art-Drops/Deserted.svg',
};

const COLLECTION_EXTRAS = {
    'art-drops': {
        fallbackImagePath: '/Art-Drops/Roadmap.svg',
        explicitImageMap: ART_DROPS_IMAGE_MAP,
    },
    'blok-boyz': {
        assetDirectory: 'Blok Boyz',
        fallbackImagePath: '/Images/Blok Boyz Gallery.svg',
        forcedSatribute: {
            key: 'block-78',
            label: 'Block 78',
            description: 'Example satribute placeholder.',
            iconPath: '/Images/Block 78.svg'
        }
    },
    'blok-space': {
        assetDirectory: 'Blok Space',
        fallbackImagePath: '/Images/Blok Space Gallery.svg',
        forcedSatribute: {
            key: 'block-9',
            label: 'Block 9',
            description: 'Example satribute placeholder.',
            iconPath: '/Images/Block 9.svg'
        }
    },
    'blokchain-surveillance': {
        fallbackImagePath: '/Images/Surveillance.svg',
        forcedSatribute: {
            key: 'silk-road',
            label: 'Silk Road',
            description: 'Example satribute placeholder.',
            iconPath: '/Images/Silk Road.svg'
        }
    },
    'palindrome-punks': {
        assetDirectory: 'Palindrome Punks',
        fallbackImagePath: '/Images/Palindrome Punks Gallery.svg',
        forcedSatribute: {
            key: 'palindrome',
            label: 'Palindrome',
            description: 'Example satribute placeholder.',
            iconPath: '/Images/Palindrome.svg'
        }
    }
};

const COLLECTION_DEFINITIONS = [
    {
        id: 'palindrome-punks',
        name: 'Example Punks',
        description: 'Example symmetric avatars used as placeholder Ordinals collection data for the public marketplace bundle.',
        metadataFile: 'Metadata/palindrome-punks-metadata.json',
        iconPath: '/Images/Satoshi.svg',
        imagePath: '/Images/Palindrome Punks Gallery.svg',
        previewPath: '/Images/Palindrome Punks Gallery.svg',
        accentColor: '#d79d57'
    },
    {
        id: 'blok-boyz',
        name: 'Example Blocks',
        description: 'Example numbered collection records bundled so the open-source marketplace can run without private media.',
        metadataFile: 'Metadata/blok-boyz-metadata.json',
        iconPath: '/Images/Blok Boyz PFP.svg',
        imagePath: '/Images/Blok Boyz Gallery.svg',
        previewPath: '/Images/Blok Boyz Gallery.svg',
        accentColor: '#57e1ff'
    },
    {
        id: 'blok-space',
        name: 'Example Studios',
        description: 'Example marketplace inventory showing numbered Ordinals items with no private collection payloads.',
        metadataFile: 'Metadata/blok-space-metadata.json',
        iconPath: '/Images/Blok Space Icon.svg',
        imagePath: '/Images/Blok Space Gallery.svg',
        previewPath: '/Images/Blok Space Gallery.svg',
        accentColor: '#8cffc1'
    },
    {
        id: 'blokchain-surveillance',
        name: 'Example Surveillance',
        description: 'Example monitoring-themed collection data for the standalone marketplace release.',
        metadataFile: 'Metadata/blokchain-surveillance-metadata.json',
        iconPath: '/Images/Surveillance.svg',
        imagePath: '/Images/Surveillance.svg',
        previewType: 'iframe',
        previewPath: '/Images/Surveillance.svg',
        accentColor: '#ff6b6b'
    },
    {
        id: 'art-drops',
        name: 'Example Drops',
        description: 'Example 1-of-1 placeholder inscriptions packaged only to make the public repository deployable.',
        metadataFile: 'Metadata/art-drops-metadata.json',
        iconPath: '/Images/Cat.svg',
        imagePath: '/Art-Drops/Roadmap.svg',
        previewPath: '/Art-Drops/Roadmap.svg',
        accentColor: '#f7931a'
    }
];

export const BOUTIQUE_COLLECTIONS = COLLECTION_DEFINITIONS.map((definition) => {
    const id = normalizeCollectionId(definition?.id);
    const extras = COLLECTION_EXTRAS[id] || {};

    return {
        ...definition,
        id,
        metadataUrl: `/${String(definition?.metadataFile || '').replace(/\\/g, '/')}`,
        fallbackImagePath: extras.fallbackImagePath || definition?.imagePath || '',
        assetDirectory: extras.assetDirectory || '',
        explicitImageMap: extras.explicitImageMap || null,
        forcedSatribute: extras.forcedSatribute || null,
        bestInSlotSlug: Object.prototype.hasOwnProperty.call(extras, 'bestInSlotSlug')
            ? extras.bestInSlotSlug
            : ''
    };
});

export function normalizeCollectionId(value) {
    return String(value || '').trim().toLowerCase();
}

export function getBoutiqueCollection(collectionId) {
    const normalizedId = normalizeCollectionId(collectionId);
    return BOUTIQUE_COLLECTIONS.find((entry) => entry.id === normalizedId) || null;
}

export function listBoutiqueCollections() {
    return BOUTIQUE_COLLECTIONS.slice();
}
