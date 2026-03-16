import { MARKETPLACE_API } from './marketplace-api.js?v=20260315-06';
import {
    acceptOffer,
    buyAssetNow,
    cancelOffer,
    connectWallet,
    createOffer,
    delistAsset,
    formatWalletError,
    getAvailableWalletProviders,
    listAssetForSale,
    refreshWallet,
    resolveOrdinalsAddress,
    resolvePaymentAddress,
    resolveProfileAddress,
    resolveWalletDisplayAddress,
    saveProfile
} from './marketplace-wallets.js?v=20260315-85';

const WALLET_PROVIDER_KEY = 'boutique.wallet.provider';
const SALES_CACHE_KEY = 'boutique.sales-cache.v1';
const INITIAL_RENDER_COUNT = 180;
const RENDER_INCREMENT = 120;
const COLLECTION_DISPLAY_ORDER = [
    'palindrome-punks',
    'blok-boyz',
    'blok-space',
    'blokchain-surveillance',
    'art-drops'
];
const SALES_HISTORY_CHART_COLLECTION_IDS = new Set([]);
const KNOWN_RECORD_SALES_FALLBACKS = {};
const COLLECTION_GALLERY_PARENT_INSCRIPTIONS = {};
const COLLECTION_PARENT_INSCRIPTIONS = {};
const FIXED_IFRAME_VIEWPORTS = {
    'blokchain-surveillance': {
        width: 520,
        height: 520
    }
};
const MAX_PARALLEL_FIXED_IFRAME_LOADS = 2;
const FIXED_IFRAME_PRELOAD_MARGIN = '220px 0px';

const state = {
    collections: [],
    activeCollectionId: '',
    activeCollection: null,
    assets: [],
    traitFilterData: null,
    traitFilterExpanded: false,
    traitFilterSelections: new Map(),
    listingsById: new Map(),
    openOffers: [],
    recentSalesActivity: [],
    btcUsdQuote: null,
    collectionsCollapsed: false,
    recordSalesCollapsed: false,
    salesActivityCollapsed: false,
    visibleCount: INITIAL_RENDER_COUNT,
    search: '',
    sort: 'featured',
    detailsById: new Map(),
    detailPrefetchingIds: new Set(),
    inspectId: '',
    inspectAsset: null,
    cardOfferAssetId: '',
    cardListAssetId: '',
    acceptingOfferId: '',
    wallet: null,
    walletBusy: false,
    walletActionBusy: false,
    walletHydrating: false,
    walletMenuOpen: false,
    walletAddressCopied: false,
    loadingCollections: true,
    loadingAssets: false,
    profileOpen: false,
    profileLoading: false,
    profileAddress: '',
    profileView: null,
    profileCache: new Map(),
    profileAvatarAssetId: '',
    profileAddressCopied: false,
    message: '',
    messageTone: 'muted',
    messageLinkHref: '',
    messageLinkLabel: ''
};

const refs = {};
let walletCopyResetTimer = 0;
let profileCopyResetTimer = 0;
let walletPlacementFrame = 0;
let walletHydrationSequence = 0;
let profileLoadSequence = 0;
let deferredMutationRefreshTimer = 0;
let queuedMutationRefresh = null;
let mutationRefreshInFlight = false;
let fixedIframeObserver = null;
let activeFixedIframeLoads = 0;
const pendingFixedIframeLoads = [];
const detailRequestStore = new Map();

document.addEventListener('DOMContentLoaded', async () => {
    bindRefs();
    initializeHeroTitleEffect();
    mountWalletMenu();
    bindEvents();
    bindDeferredTypographySync();
    render();
    await Promise.all([
        loadCollections(),
        restoreWallet(),
        loadBtcUsdQuote()
    ]);
});

function bindRefs() {
    refs.body = document.body;
    refs.walletShell = document.getElementById('wallet-shell');
    refs.collectionRail = document.getElementById('collection-rail');
    refs.collectionRailBody = document.getElementById('collection-rail-body');
    refs.collectionRailToggle = document.getElementById('collection-rail-toggle');
    refs.collectionList = document.getElementById('collection-list');
    refs.summaryHeroPanel = document.querySelector('.summary-card--hero');
    refs.activeCollectionMeta = document.getElementById('active-collection-meta');
    refs.collectionSalesChartShell = document.getElementById('collection-sales-chart-shell');
    refs.salesRail = document.getElementById('sales-rail');
    refs.recordSalesPanel = document.getElementById('record-sales-panel');
    refs.recordSales = document.getElementById('record-sales');
    refs.salesActivityPanel = document.getElementById('sales-activity-panel');
    refs.salesActivity = document.getElementById('sales-activity');
    refs.search = document.getElementById('market-search');
    refs.traitFilterWindow = document.getElementById('trait-filter-window');
    refs.traitFilterToggle = document.getElementById('trait-filter-toggle');
    refs.traitFilterContent = document.getElementById('trait-filter-content');
    refs.traitFilterControls = document.getElementById('trait-filter-controls');
    refs.traitFilterStatus = document.getElementById('trait-filter-status');
    refs.assetGrid = document.getElementById('asset-grid');
    refs.loadMore = document.getElementById('load-more-assets');
    refs.message = document.getElementById('market-message');
    refs.walletButton = document.getElementById('wallet-button');
    refs.walletMenu = document.getElementById('wallet-menu');
    refs.walletProviders = document.getElementById('wallet-providers');
    refs.walletAccountMenu = document.getElementById('wallet-account-menu');
    refs.walletState = document.getElementById('wallet-state');
    refs.walletDropdownOrdinalsRow = document.getElementById('wallet-dropdown-ordinals-row');
    refs.walletDropdownPaymentRow = document.getElementById('wallet-dropdown-payment-row');
    refs.walletDropdownOrdinalsAddress = document.getElementById('wallet-dropdown-ordinals-address');
    refs.walletDropdownPaymentAddress = document.getElementById('wallet-dropdown-payment-address');
    refs.walletDropdownProvider = document.getElementById('wallet-dropdown-provider');
    refs.walletDropdownCollectionCount = document.getElementById('wallet-dropdown-collection-count');
    refs.walletCopyButton = document.getElementById('wallet-copy-button');
    refs.walletProfileButton = document.getElementById('wallet-profile-button');
    refs.walletDisconnectButton = document.getElementById('wallet-disconnect-button');
    refs.drawer = document.getElementById('inspect-drawer');
    refs.drawerContent = document.getElementById('inspect-content');
    refs.drawerClose = document.getElementById('inspect-close');
    refs.profilePanel = document.getElementById('profile-panel');
    refs.profileClose = document.getElementById('profile-close');
    refs.profileContent = document.getElementById('profile-content');
    refs.messageText = document.getElementById('market-message-text');
    refs.messageLink = document.getElementById('market-message-link');
    refs.messageClose = document.getElementById('market-message-close');
}

function mountWalletMenu() {
    if (!refs.walletMenu || refs.walletMenu.parentElement === document.body) {
        return;
    }

    document.body.appendChild(refs.walletMenu);
}

function initializeHeroTitleEffect() {
    const heading = document.querySelector('.hero__copy h1[data-text]');
    if (!heading || heading.dataset.letterized === 'true') {
        return;
    }

    const constrainedDevice = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (constrainedDevice) {
        heading.dataset.letterized = 'true';
        return;
    }

    const rawText = heading.getAttribute('data-text') || heading.textContent || '';
    if (!rawText) {
        return;
    }

    function seededNoise(seed) {
        const value = Math.sin(seed * 12.9898) * 43758.5453;
        return value - Math.floor(value);
    }

    const jitterVariants = ['h1-letter-jitter-a', 'h1-letter-jitter-b', 'h1-letter-jitter-c'];
    heading.textContent = '';
    let letterIndex = 0;

    rawText.split(/(\s+)/).forEach((token) => {
        if (!token) {
            return;
        }

        if (/^\s+$/.test(token)) {
            heading.appendChild(document.createTextNode(token));
            return;
        }

        const wordNode = document.createElement('span');
        wordNode.className = 'h1-word';

        Array.from(token).forEach((character) => {
            const letterNode = document.createElement('span');
            letterNode.className = 'h1-letter';
            letterNode.textContent = character;

            const base = letterIndex + 1;
            const r1 = seededNoise(base * 1.17);
            const r2 = seededNoise(base * 2.31);
            const r3 = seededNoise(base * 3.73);
            const r4 = seededNoise(base * 5.21);
            const r5 = seededNoise(base * 7.97);
            const r6 = seededNoise(base * 11.09);
            const r7 = seededNoise(base * 13.37);
            const r8 = seededNoise(base * 17.23);
            const r9 = seededNoise(base * 19.61);

            letterNode.style.setProperty('--h1-index', String(letterIndex));
            letterNode.style.setProperty('--h1-jitter-name', jitterVariants[Math.floor(r1 * jitterVariants.length)]);
            letterNode.style.setProperty('--h1-jitter-duration', `${(1.2 + r2 * 2.8).toFixed(3)}s`);
            letterNode.style.setProperty('--h1-jitter-delay', `${(-r3 * 4.2).toFixed(3)}s`);
            letterNode.style.setProperty('--h1-flicker-duration', `${(2.7 + r4 * 5.1).toFixed(3)}s`);
            letterNode.style.setProperty('--h1-flicker-delay', `${(-r5 * 6.0).toFixed(3)}s`);
            letterNode.style.setProperty('--h1-jitter-amplitude', (0.8 + r6 * 3.2).toFixed(3));
            letterNode.style.setProperty('--h1-surge-duration', `${(3.6 + r7 * 4.4).toFixed(3)}s`);
            letterNode.style.setProperty('--h1-surge-delay', `${(-r8 * 7.2).toFixed(3)}s`);
            letterNode.style.setProperty('--h1-surge-intensity', (0.85 + r9 * 1.15).toFixed(3));

            wordNode.appendChild(letterNode);
            letterIndex += 1;
        });

        heading.appendChild(wordNode);
    });

    heading.dataset.letterized = 'true';
}

function bindEvents() {
    refs.collectionList.addEventListener('click', onCollectionClick);
    refs.collectionRailToggle?.addEventListener('click', toggleCollectionRail);
    refs.search.addEventListener('input', (event) => {
        state.search = String(event.target.value || '');
        state.visibleCount = INITIAL_RENDER_COUNT;
        renderTraitFilters();
        renderGrid();
    });
    refs.traitFilterToggle.addEventListener('click', () => {
        state.traitFilterExpanded = !state.traitFilterExpanded;
        renderTraitFilters();
    });
    refs.traitFilterControls.addEventListener('change', onTraitFilterChange);
    refs.assetGrid.addEventListener('click', onAssetGridClick);
    refs.loadMore.addEventListener('click', () => {
        state.visibleCount += RENDER_INCREMENT;
        renderGrid();
    });
    refs.walletButton.addEventListener('click', onWalletButtonClick);
    refs.walletProviders.addEventListener('click', onWalletProviderClick);
    refs.walletCopyButton.addEventListener('click', () => void onWalletCopyClick());
    refs.walletProfileButton?.addEventListener('click', () => {
        if (!state.wallet) {
            setMessage('Connect a wallet to edit your profile.', 'warning');
            return;
        }

        state.walletMenuOpen = false;
        renderWallet();
        void openProfile(resolveProfileAddress(state.wallet), true);
    });
    refs.walletDisconnectButton.addEventListener('click', onWalletDisconnectClick);
    refs.drawerClose.addEventListener('click', closeInspect);
    refs.profileClose.addEventListener('click', closeProfile);
    refs.salesRail?.addEventListener('click', onSalesRailClick);
    refs.salesRail?.addEventListener('keydown', onSalesRailKeydown);
    refs.messageClose?.addEventListener('click', clearMessage);
    document.addEventListener('click', onDocumentClick);
    document.addEventListener('load', onDocumentMediaLoad, true);
    document.addEventListener('error', onDocumentMediaError, true);
    window.addEventListener('keydown', onWindowKeydown);
    window.addEventListener('scroll', onWindowScroll, { passive: true });
    window.addEventListener('resize', onWindowViewportChange, { passive: true });
    refs.walletShell?.addEventListener('click', (event) => {
        event.stopPropagation();
    });
}

function bindDeferredTypographySync() {
    if (!document.fonts || typeof document.fonts.ready?.then !== 'function') {
        return;
    }

    document.fonts.ready
        .then(() => {
            window.requestAnimationFrame(() => {
                syncCollectionStatsWidth();

                if (state.traitFilterExpanded && refs.traitFilterWindow && !refs.traitFilterWindow.hidden) {
                    scheduleTraitFilterCardWidthSync(refs.traitFilterWindow);
                }
            });
        })
        .catch(() => {});
}

function onDocumentMediaError(event) {
    const target = event.target;
    if (target instanceof HTMLIFrameElement && target.matches('.fixed-iframe-shell__frame')) {
        finalizeFixedIframeLoad(target, true);
        return;
    }

    if (!(target instanceof HTMLImageElement)) {
        return;
    }

    const fallbackSrc = String(target.dataset.fallbackSrc || '').trim();
    if (!fallbackSrc) {
        return;
    }

    if (target.src === new URL(fallbackSrc, window.location.origin).href) {
        target.removeAttribute('data-fallback-src');
        return;
    }

    target.src = fallbackSrc;
    target.removeAttribute('data-fallback-src');
}

function onDocumentMediaLoad(event) {
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
        return;
    }

    if (target instanceof HTMLIFrameElement) {
        const fixedShell = target.closest('[data-fixed-iframe-shell]');
        if (fixedShell instanceof HTMLElement) {
            const currentSrc = String(target.getAttribute('src') || '').trim();
            const loadState = String(target.dataset.loadState || '').trim();
            if (loadState === 'loading') {
                finalizeFixedIframeLoad(target, false);
            } else if (currentSrc && currentSrc !== 'about:blank') {
                fixedShell.classList.add('is-loaded');
                syncFixedIframeViewportShell(fixedShell);
            }
        }
    }

    if (target.closest('.asset-card__media')) {
        scheduleAssetCardWidthSync();
    }
}

async function restoreWallet() {
    const provider = String(localStorage.getItem(WALLET_PROVIDER_KEY) || '').trim().toLowerCase();
    if (!provider) {
        render();
        return;
    }

    try {
        state.wallet = await refreshWallet(provider, { hydrateDetails: false });
        queueWalletHydration(provider, { silentMessage: true });
    } catch {
        localStorage.removeItem(WALLET_PROVIDER_KEY);
    }

    render();
}

function queueWalletHydration(provider = '', options = {}) {
    const normalizedProvider = String(provider || state.wallet?.provider || '').trim().toLowerCase();
    if (!normalizedProvider || !state.wallet) {
        return;
    }

    const { silentMessage = false } = options || {};
    const sequence = ++walletHydrationSequence;
    state.walletHydrating = true;
    renderWallet();

    if (!silentMessage) {
        setMessage('Syncing wallet holdings...', 'muted');
    }

    void (async () => {
        try {
            const wallet = await refreshWallet(normalizedProvider, { hydrateDetails: true });
            if (sequence !== walletHydrationSequence || !wallet) {
                return;
            }

            state.wallet = wallet;
            await ensureWalletOwnershipDetailsForLoadedAssets();

            const ownProfileOpen = state.profileOpen
                && state.wallet
                && resolveProfileAddress(state.wallet) === state.profileAddress;
            if (ownProfileOpen) {
                const cachedProfile = state.profileCache.get(state.profileAddress);
                if (cachedProfile) {
                    state.profileView = {
                        ...cachedProfile,
                        holdings: Array.isArray(wallet.inscriptions)
                            ? wallet.inscriptions.map((item) => mapWalletInscriptionToHolding(item))
                            : cachedProfile.holdings
                    };
                    state.profileCache.set(state.profileAddress, state.profileView);
                    renderProfilePanel();
                }
            }

            if (!silentMessage) {
                setMessage(`${normalizedProvider === 'xverse' ? 'Xverse' : 'UniSat'} synced.`, 'success');
            }
        } catch (error) {
            if (sequence !== walletHydrationSequence) {
                return;
            }
            if (!silentMessage) {
                setMessage(formatWalletError(error), 'error');
            }
        } finally {
            if (sequence === walletHydrationSequence) {
                state.walletHydrating = false;
                render();
            }
        }
    })();
}

async function loadCollections() {
    state.loadingCollections = true;
    renderSummary();

    try {
        state.collections = sortCollectionsForDisplay(await MARKETPLACE_API.getCollections());
        const defaultCollectionId = state.collections.find((entry) => entry.id === 'palindrome-punks')?.id || '';
        state.activeCollectionId = state.activeCollectionId || defaultCollectionId || state.collections[0]?.id || '';
        state.activeCollection = state.collections.find((entry) => entry.id === state.activeCollectionId) || null;
        await loadActiveCollectionAssets();
    } catch (error) {
        setMessage(formatError(error), 'error');
    } finally {
        state.loadingCollections = false;
        render();
    }
}

async function loadActiveCollectionAssets() {
    if (!state.activeCollectionId) {
        state.assets = [];
        state.traitFilterData = null;
        state.traitFilterSelections = new Map();
        state.listingsById = new Map();
        state.openOffers = [];
        state.recentSalesActivity = [];
        state.cardOfferAssetId = '';
        state.cardListAssetId = '';
        state.acceptingOfferId = '';
        render();
        return;
    }

    state.loadingAssets = true;
    state.visibleCount = INITIAL_RENDER_COUNT;
    state.cardOfferAssetId = '';
    state.cardListAssetId = '';
    state.acceptingOfferId = '';
    state.traitFilterData = null;
    state.openOffers = [];
    state.recentSalesActivity = [];
    state.detailPrefetchingIds.clear();
    renderSummary();
    renderSalesRail();
    renderTraitFilters();
    renderGrid();

    try {
        const [assetPayload, listings, offers] = await Promise.all([
            MARKETPLACE_API.getAssets(state.activeCollectionId),
            MARKETPLACE_API.getListings(state.activeCollectionId),
            MARKETPLACE_API.getOffers(state.activeCollectionId)
        ]);

        const incomingCollection = assetPayload.collection ? { ...assetPayload.collection } : null;
        const existingCollection = state.collections.find((entry) => entry.id === state.activeCollectionId) || null;
        state.activeCollection = incomingCollection
            ? { ...(existingCollection || {}), ...incomingCollection }
            : existingCollection;
        if (incomingCollection) {
            state.collections = sortCollectionsForDisplay(state.collections.map((entry) => (
                entry.id === state.activeCollectionId
                    ? { ...entry, ...incomingCollection }
                    : entry
            )));
        }
        const incomingRecordSales = dedupeSalesEntries(Array.isArray(assetPayload.recordSales) ? assetPayload.recordSales : []);
        const incomingRecentSales = dedupeSalesEntries(Array.isArray(assetPayload.recentSalesActivity) ? assetPayload.recentSalesActivity : []);
        const cachedSales = readCollectionSalesCache(state.activeCollectionId);
        const resolvedRecordSales = mergeKnownRecordSales(
            state.activeCollectionId,
            incomingRecordSales.length > 0 ? incomingRecordSales : cachedSales.recordSales
        );
        const resolvedRecentSales = incomingRecentSales.length > 0
            ? incomingRecentSales
            : (
                Array.isArray(cachedSales.recentSalesActivity) && cachedSales.recentSalesActivity.length > 0
                    ? cachedSales.recentSalesActivity
                    : dedupeSalesEntries(
                        incomingRecordSales
                            .slice()
                            .sort((left, right) => compareIsoDatesDescending(left?.occurredAt || '', right?.occurredAt || ''))
                    )
              );
        state.assets = attachPreviousSaleSummaries(
            Array.isArray(assetPayload.items) ? assetPayload.items : [],
            [...resolvedRecordSales, ...resolvedRecentSales]
        );
        state.traitFilterData = buildTraitFilterData(state.assets);

        const incomingOpenOffers = Array.isArray(offers) ? offers : [];
        state.openOffers = incomingOpenOffers;
        state.recentSalesActivity = resolvedRecentSales;
        state.listingsById = new Map(
            (Array.isArray(listings) ? listings : []).map((entry) => [entry.inscriptionId, entry])
        );
        if (state.activeCollection) {
            state.activeCollection.recordSales = resolvedRecordSales;
            state.activeCollection.recentSalesActivity = resolvedRecentSales;
        }
        updateCollectionSalesCache(state.activeCollectionId, resolvedRecordSales, resolvedRecentSales);
        await ensureActiveCollectionOwnerCount();
        await ensureWalletOwnershipDetailsForLoadedAssets();
    } catch (error) {
        setMessage(formatError(error), 'error');
    } finally {
        state.loadingAssets = false;
        render();
    }
}

function render() {
    renderCollectionRailPanel();
    renderCollections();
    renderWallet();
    renderSummary();
    renderSalesRail();
    resetTopSummaryPanelSizing();
    renderTraitFilters();
    renderGrid();
    renderInspectDrawer();
    renderProfilePanel();
}

function renderCollectionRailPanel() {
    if (!refs.collectionRail || !refs.collectionRailToggle || !refs.collectionRailBody) {
        return;
    }

    const collapsed = Boolean(state.collectionsCollapsed);
    refs.collectionRail.dataset.collapsed = collapsed ? 'true' : 'false';
    refs.collectionRailBody.hidden = collapsed;
    refs.collectionRailToggle.textContent = collapsed ? 'Expand' : 'Collapse';
    refs.collectionRailToggle.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
}

function renderCollections() {
    refs.collectionList.innerHTML = state.collections.map((collection) => `
        <button class="collection-chip ${collection.id === state.activeCollectionId ? 'is-active' : ''}" data-collection-id="${escapeHtml(collection.id)}">
            <span class="collection-chip__identity">
                ${getCollectionDisplayImagePath(collection) ? `
                    <span class="collection-chip__icon">
                        <img src="${escapeHtml(getCollectionDisplayImagePath(collection))}" alt="${escapeHtml(collection.name)} icon">
                    </span>
                ` : ''}
                <span class="collection-chip__meta">
                    <strong>${escapeHtml(collection.name)}</strong>
                    <span class="collection-chip__subline">${formatCount(collection.assetCount)} assets</span>
                </span>
            </span>
        </button>
    `).join('') || '<p class="empty-state">No collections loaded.</p>';
}

function renderWallet() {
    const providers = getAvailableWalletProviders();
    if (refs.walletProviders) {
        refs.walletProviders.innerHTML = providers.map((provider) => `
        <button class="market-wallet-provider-option ${provider.available ? '' : 'is-disabled'}" data-provider="${escapeHtml(provider.id)}" ${provider.available ? '' : 'disabled'}>
            <span class="market-wallet-provider-text">${provider.available ? `Connect ${escapeHtml(provider.label)}` : `${escapeHtml(provider.label)} unavailable`}</span>
        </button>
    `).join('');
    }

    const connected = Boolean(state.wallet);
    const holdingsCount = connected ? getConnectedWalletHoldingCount() : 0;
    const provider = connected ? String(state.wallet?.provider || '').trim().toLowerCase() : '';
    const ordinalsAddress = connected ? resolveOrdinalsAddress(state.wallet) : '';
    const paymentAddress = connected ? resolvePaymentAddress(state.wallet) : '';
    const showSeparatePaymentAddress = Boolean(
        connected
        && provider !== 'unisat'
        && paymentAddress
        && paymentAddress !== ordinalsAddress
    );

    refs.walletButton.dataset.connected = connected ? 'true' : 'false';
    refs.walletButton.dataset.open = state.walletMenuOpen ? 'true' : 'false';
    refs.walletButton.setAttribute('aria-expanded', state.walletMenuOpen ? 'true' : 'false');
    refs.walletButton.disabled = state.walletBusy || state.walletActionBusy;

    if (!connected && !state.walletBusy && !state.walletActionBusy) {
        refs.walletState.classList.add('is-connect-label');
        refs.walletState.innerHTML = '<span>Connect</span><span>Wallet</span>';
    } else {
        refs.walletState.classList.remove('is-connect-label');
        refs.walletState.textContent = state.walletBusy
            ? 'Connecting...'
            : state.walletActionBusy
                ? 'Processing...'
                : resolveWalletDisplayAddress(state.wallet);
    }

    if (refs.walletMenu) {
        refs.walletMenu.hidden = !state.walletMenuOpen;
    }
    if (refs.walletProviders) {
        refs.walletProviders.hidden = connected || !state.walletMenuOpen;
    }
    if (refs.walletAccountMenu) {
        refs.walletAccountMenu.hidden = !connected || !state.walletMenuOpen;
    }
    if (refs.walletDropdownOrdinalsRow) {
        refs.walletDropdownOrdinalsRow.hidden = !connected;
    }
    if (refs.walletDropdownPaymentRow) {
        refs.walletDropdownPaymentRow.hidden = !showSeparatePaymentAddress;
    }
    if (refs.walletDropdownOrdinalsAddress) {
        refs.walletDropdownOrdinalsAddress.textContent = ordinalsAddress;
    }
    if (refs.walletDropdownPaymentAddress) {
        refs.walletDropdownPaymentAddress.textContent = showSeparatePaymentAddress ? paymentAddress : '';
    }
    if (refs.walletDropdownProvider) {
        refs.walletDropdownProvider.textContent = connected ? `${getWalletProviderLabel(state.wallet.provider)} Wallet` : '';
    }
    if (refs.walletDropdownCollectionCount) {
        refs.walletDropdownCollectionCount.textContent = connected
            ? (state.walletHydrating
                ? 'Syncing tracked holdings...'
                : `${formatCount(holdingsCount)} tracked holding${holdingsCount === 1 ? '' : 's'}`)
            : '';
    }
    if (refs.walletCopyButton) {
        refs.walletCopyButton.disabled = !connected || state.walletBusy || state.walletActionBusy;
        refs.walletCopyButton.textContent = state.walletAddressCopied ? 'Copied' : 'Copy';
    }
    if (refs.walletProfileButton) {
        refs.walletProfileButton.disabled = !connected || state.walletBusy || state.walletActionBusy;
    }
    if (refs.walletDisconnectButton) {
        refs.walletDisconnectButton.disabled = !connected || state.walletBusy || state.walletActionBusy;
    }

    if (state.walletMenuOpen) {
        queueWalletMenuPlacement();
    }
}

async function runExclusiveWalletAction(callback, options = {}) {
    if (state.walletBusy || state.walletActionBusy) {
        if (options?.busyMessage) {
            setMessage(String(options.busyMessage || '').trim(), 'warning');
        }
        return false;
    }

    state.walletActionBusy = true;
    renderWallet();

    try {
        await callback();
        return true;
    } finally {
        state.walletActionBusy = false;
        renderWallet();
    }
}

function renderSummary() {
    if (state.loadingCollections || !state.activeCollection) {
        refs.activeCollectionMeta.innerHTML = '<p class="empty-state">Loading boutique catalog...</p>';
        renderCollectionSalesChartShell(null);
        return;
    }

    const collection = state.activeCollection;
    refs.activeCollectionMeta.innerHTML = `
        <div class="collection-summary">
            ${renderCollectionHeroVisual(collection)}
            <div class="collection-summary__stats">
                ${renderCollectionStatsWindow(collection, { inline: true })}
            </div>
            <div class="summary-copy">
                <h2>${escapeHtml(collection.name || 'Collection')}</h2>
                <p class="summary-copy__description">${escapeHtml(collection.description || 'Bitcoin-native ordinals marketplace.')}</p>
            </div>
        </div>
    `;

    renderCollectionSalesChartShell(collection);
    window.requestAnimationFrame(syncCollectionStatsWidth);
}

function renderSalesRail() {
    if (!refs.salesRail || !refs.recordSales || !refs.salesActivity) {
        return;
    }

    if (state.loadingCollections || !state.activeCollection) {
        refs.salesRail.hidden = true;
        refs.recordSalesPanel.hidden = true;
        refs.salesActivityPanel.hidden = true;
        refs.recordSales.innerHTML = '';
        refs.salesActivity.innerHTML = '';
        return;
    }

    const recordSales = mergeKnownRecordSales(
        state.activeCollectionId,
        Array.isArray(state.activeCollection?.recordSales) ? state.activeCollection.recordSales : []
    ).slice(0, 3);
    const recentSalesSource = Array.isArray(state.recentSalesActivity) && state.recentSalesActivity.length > 0
        ? state.recentSalesActivity
        : (Array.isArray(state.activeCollection?.recentSalesActivity) ? state.activeCollection.recentSalesActivity : []);
    const recentSales = dedupeSalesEntries(recentSalesSource).slice(0, 10);
    const hasRecordSalesPayload = Object.prototype.hasOwnProperty.call(state.activeCollection || {}, 'recordSales');
    const hasRecentSalesPayload = Object.prototype.hasOwnProperty.call(state.activeCollection || {}, 'recentSalesActivity');
    const hasSalesPayload = hasRecordSalesPayload || hasRecentSalesPayload;

    refs.salesRail.hidden = false;
    refs.recordSalesPanel.hidden = false;
    refs.salesActivityPanel.hidden = false;
    refs.recordSalesPanel.dataset.collapsed = state.recordSalesCollapsed ? 'true' : 'false';
    refs.salesActivityPanel.dataset.collapsed = state.salesActivityCollapsed ? 'true' : 'false';

    refs.recordSales.innerHTML = renderSalesPanel(
        'Top Sales',
        'record',
        state.recordSalesCollapsed,
        recordSales.length > 0
            ? `
                <div class="sales-feed sales-feed--top">
                ${recordSales.map((sale, index) => renderTopSaleRow(sale, index)).join('')}
                </div>
            `
            : `<p class="empty-state compact">${escapeHtml(getSalesRailEmptyText('record', hasSalesPayload))}</p>`
    );

    refs.salesActivity.innerHTML = renderSalesPanel(
        'Sales Activity',
        'activity',
        state.salesActivityCollapsed,
        recentSales.length > 0
            ? `
                <div class="sales-feed sales-feed--activity">
                ${recentSales.map((sale) => renderRecentSaleRow(sale)).join('')}
                </div>
            `
            : `<p class="empty-state compact">${escapeHtml(getSalesRailEmptyText('recent', hasSalesPayload))}</p>`
    );
}

function renderSalesPanel(title, kind, collapsed, bodyMarkup) {
    const bodyId = kind === 'record' ? 'record-sales-panel-body' : 'sales-activity-panel-body';
    return `
        <div class="boutique-collapsible-panel__topbar">
            <div class="panel-header panel-header--compact sales-panel__header boutique-collapsible-panel__header">
                <strong>${escapeHtml(title)}</strong>
            </div>
            <button
                class="sales-history-chart__collapse-button boutique-collapse-button"
                type="button"
                data-sales-panel-toggle="${escapeHtml(kind)}"
                aria-controls="${bodyId}"
                aria-expanded="${collapsed ? 'false' : 'true'}"
            >
                ${collapsed ? 'Expand' : 'Collapse'}
            </button>
        </div>
        <div id="${bodyId}" class="sales-panel__body" ${collapsed ? 'hidden' : ''}>
            ${bodyMarkup}
        </div>
    `;
}

function renderTopSaleRow(sale, index) {
    const inscriptionId = String(sale?.inscriptionId || '').trim();
    const tagName = 'article';
    const attributes = inscriptionId
        ? ` class="sales-feed__row sales-feed__row--top sales-feed__row--interactive" data-open-sales-inspect="${escapeHtml(inscriptionId)}" role="button" tabindex="0" aria-label="Inspect ${escapeHtml(sale.name || shortInscriptionId(inscriptionId))}"`
        : ' class="sales-feed__row sales-feed__row--top"';
    return `
        <${tagName}${attributes}>
            <div class="sales-feed__lead sales-feed__lead--activity">
                ${renderSaleThumbnail(sale)}
                <div class="sales-feed__meta">
                    <strong><span class="sales-feed__rank sales-feed__rank--inline">#${index + 1}</span>${escapeHtml(sale.name || shortInscriptionId(sale.inscriptionId || ''))}</strong>
                    ${renderSaleTransferLine(sale)}
                </div>
            </div>
            <div class="sales-feed__side">
                <strong>${escapeHtml(formatBtcWithSymbolSuffix(sale.priceSats, 5))}</strong>
                ${renderSaleUsdLine(sale.priceSats)}
                <span>${escapeHtml(formatDateTime(sale.occurredAt))}</span>
            </div>
        </${tagName}>
    `;
}

function renderRecentSaleRow(sale) {
    const inscriptionId = String(sale?.inscriptionId || '').trim();
    const tagName = 'article';
    const attributes = inscriptionId
        ? ` class="sales-feed__row sales-feed__row--activity sales-feed__row--interactive" data-open-sales-inspect="${escapeHtml(inscriptionId)}" role="button" tabindex="0" aria-label="Inspect ${escapeHtml(sale.name || shortInscriptionId(inscriptionId))}"`
        : ' class="sales-feed__row sales-feed__row--activity"';
    return `
        <${tagName}${attributes}>
            <div class="sales-feed__lead sales-feed__lead--activity">
                ${renderSaleThumbnail(sale)}
                <div class="sales-feed__meta">
                    <strong>${escapeHtml(sale.name || shortInscriptionId(sale.inscriptionId || ''))}</strong>
                    ${renderSaleTransferLine(sale)}
                </div>
            </div>
            <div class="sales-feed__side">
                <strong>${escapeHtml(formatBtcWithSymbolSuffix(sale.priceSats, 5))}</strong>
                ${renderSaleUsdLine(sale.priceSats)}
                <span>${escapeHtml(formatRelativeAgeLabel(sale.occurredAt))}</span>
            </div>
        </${tagName}>
    `;
}

function renderSaleTransferLine(sale) {
    const seller = renderSaleAddressLink(sale?.sellerAddress);
    const buyer = renderSaleAddressLink(sale?.buyerAddress);
    if (seller && buyer) {
        return `<span class="sales-feed__meta-line sales-feed__meta-line--addresses">${seller} <span class="sales-feed__meta-separator">-></span> ${buyer}</span>`;
    }
    if (seller || buyer) {
        return `<span class="sales-feed__meta-line sales-feed__meta-line--addresses">${seller || buyer}</span>`;
    }
    return '';
}

function dedupeSalesEntries(entries) {
    const bestByKey = new Map();
    for (const entry of Array.isArray(entries) ? entries : []) {
        if (!entry || typeof entry !== 'object') {
            continue;
        }

        const inscriptionId = String(entry.inscriptionId || '').trim().toLowerCase();
        const priceSats = Number(entry.priceSats || 0);
        const key = createSaleEntryKey(entry);
        const partialMatchKey = findPartialSaleEntryMatchKey(bestByKey, entry, inscriptionId, priceSats);
        const resolvedKey = partialMatchKey || key;

        const current = bestByKey.get(resolvedKey);
        if (!current || scoreSaleEntry(entry) > scoreSaleEntry(current)) {
            bestByKey.set(resolvedKey, entry);
        }
    }

    return Array.from(bestByKey.values());
}

function createSaleEntryKey(entry) {
    const inscriptionId = String(entry?.inscriptionId || '').trim().toLowerCase();
    const priceSats = Number(entry?.priceSats || 0);
    const txid = String(entry?.txid || '').trim().toLowerCase();
    const occurredAt = String(entry?.occurredAt || '').trim();

    return inscriptionId
        ? `${inscriptionId}|${txid || occurredAt}|${priceSats}`
        : `${inscriptionId}|${txid}|${occurredAt}|${priceSats}`;
}

function findPartialSaleEntryMatchKey(bestByKey, entry, inscriptionId, priceSats) {
    if (!inscriptionId || priceSats <= 0) {
        return '';
    }

    const entryIsPartial = isPartialSaleEntry(entry);
    for (const [key, current] of bestByKey.entries()) {
        if (String(current?.inscriptionId || '').trim().toLowerCase() !== inscriptionId) {
            continue;
        }
        if (Number(current?.priceSats || 0) !== priceSats) {
            continue;
        }
        if (entryIsPartial || isPartialSaleEntry(current)) {
            return key;
        }
    }

    return '';
}

function isPartialSaleEntry(entry) {
    return !String(entry?.txid || '').trim() && !String(entry?.occurredAt || '').trim();
}

function mergeKnownRecordSales(collectionId, entries) {
    const normalizedId = String(collectionId || '').trim().toLowerCase();
    const merged = dedupeSalesEntries([
        ...(Array.isArray(entries) ? entries : []),
        ...((KNOWN_RECORD_SALES_FALLBACKS[normalizedId] || []).map((entry) => ({ ...entry })))
    ]);

    return merged
        .sort(compareClientRecordSales)
        .slice(0, 3);
}

function compareClientRecordSales(left, right) {
    const priceDelta = Number(right?.priceSats || 0) - Number(left?.priceSats || 0);
    if (priceDelta !== 0) {
        return priceDelta;
    }

    const dateDelta = compareIsoDatesDescending(left?.occurredAt || '', right?.occurredAt || '');
    if (dateDelta !== 0) {
        return dateDelta;
    }

    return String(left?.inscriptionId || '').localeCompare(String(right?.inscriptionId || ''));
}

function scoreSaleEntry(entry) {
    let score = 0;
    if (String(entry?.occurredAt || '').trim()) score += 4;
    if (String(entry?.txid || '').trim()) score += 3;
    if (String(entry?.sellerAddress || '').trim()) score += 2;
    if (String(entry?.buyerAddress || '').trim()) score += 2;
    if (String(entry?.name || '').trim()) score += 1;
    return score;
}

function compareIsoDatesDescending(left, right) {
    const leftTime = new Date(left || '').getTime();
    const rightTime = new Date(right || '').getTime();
    const normalizedLeftTime = Number.isFinite(leftTime) ? leftTime : 0;
    const normalizedRightTime = Number.isFinite(rightTime) ? rightTime : 0;
    return normalizedRightTime - normalizedLeftTime;
}

function readCollectionSalesCache(collectionId) {
    const normalizedId = String(collectionId || '').trim().toLowerCase();
    if (!normalizedId) {
        return { recordSales: [], recentSalesActivity: [] };
    }

    try {
        const parsed = JSON.parse(localStorage.getItem(SALES_CACHE_KEY) || '{}');
        const entry = parsed && typeof parsed === 'object' ? parsed[normalizedId] : null;
        return {
            recordSales: dedupeSalesEntries(Array.isArray(entry?.recordSales) ? entry.recordSales : []),
            recentSalesActivity: dedupeSalesEntries(Array.isArray(entry?.recentSalesActivity) ? entry.recentSalesActivity : [])
        };
    } catch {
        return { recordSales: [], recentSalesActivity: [] };
    }
}

function updateCollectionSalesCache(collectionId, recordSales, recentSalesActivity) {
    const normalizedId = String(collectionId || '').trim().toLowerCase();
    if (!normalizedId) {
        return;
    }

    try {
        const parsed = JSON.parse(localStorage.getItem(SALES_CACHE_KEY) || '{}');
        const next = parsed && typeof parsed === 'object' ? parsed : {};
        const normalizedRecordSales = dedupeSalesEntries(recordSales);
        const normalizedRecentSales = dedupeSalesEntries(recentSalesActivity);
        if (normalizedRecordSales.length === 0 && normalizedRecentSales.length === 0) {
            return;
        }

        next[normalizedId] = {
            recordSales: normalizedRecordSales,
            recentSalesActivity: normalizedRecentSales,
            updatedAt: new Date().toISOString()
        };

        localStorage.setItem(SALES_CACHE_KEY, JSON.stringify(next));
    } catch {
        // ignore local cache failures
    }
}

function getAssetMediaSrc(asset) {
    const collection = resolveAssetCollection(asset);
    const previewType = String(collection?.previewType || '').trim().toLowerCase();
    const previewPath = String(collection?.previewPath || '').trim();
    if (previewType === 'iframe' && previewPath) {
        return normalizeMediaUrl(previewPath);
    }

    return normalizeMediaUrl(String(asset?.imageSrc || collection?.imagePath || state.activeCollection?.imagePath || '').trim());
}

function getAssetMediaType(asset) {
    const explicitType = String(asset?.mediaType || '').trim().toLowerCase();
    if (explicitType === 'iframe' || explicitType === 'image') {
        return explicitType;
    }

    const collection = resolveAssetCollection(asset);
    return String(collection?.previewType || '').trim().toLowerCase() === 'iframe'
        ? 'iframe'
        : 'image';
}

function getAssetMediaFallbackSrc(asset) {
    const collection = resolveAssetCollection(asset);
    return normalizeMediaUrl(
        String(
            collection?.imagePath
            || collection?.iconPath
            || state.activeCollection?.imagePath
            || '/Images/Surveillance.svg'
        ).trim()
    );
}

function getProfileAvatarSrc(asset) {
    return getAssetMediaType(asset) === 'iframe'
        ? getAssetMediaFallbackSrc(asset)
        : getAssetMediaSrc(asset);
}

function getProfileHoldingDisplayAsset(asset) {
    const collectionId = normalizeCollectionIdValue(asset?.collectionId || '');
    if (collectionId === 'blokchain-surveillance') {
        const collection = resolveAssetCollection(asset);
        const iconSrc = normalizeMediaUrl(String(collection?.iconPath || '').trim());
        if (iconSrc) {
            return {
                ...asset,
                imageSrc: iconSrc,
                mediaType: 'image'
            };
        }
    }

    return asset;
}

function resolveSelectedProfileAvatarHoldingId(profile, holdings = []) {
    const currentSelectionId = String(state.profileAvatarAssetId || '').trim();
    if (currentSelectionId && holdings.some((holding) => holding.id === currentSelectionId)) {
        return currentSelectionId;
    }

    const avatarUrl = normalizeMediaUrl(String(profile?.avatarUrl || '').trim());
    if (!avatarUrl) {
        return '';
    }

    const matchedHolding = holdings.find((holding) => {
        const primary = normalizeMediaUrl(getProfileAvatarSrc(holding));
        return primary && primary === avatarUrl;
    });

    return String(matchedHolding?.id || '').trim();
}

function normalizeMediaUrl(value) {
    const raw = String(value || '').trim();
    if (!raw) {
        return '';
    }

    if (/^(data:|blob:|https?:\/\/)/i.test(raw)) {
        return raw;
    }

    const suffixIndex = raw.search(/[?#]/);
    const pathname = suffixIndex >= 0 ? raw.slice(0, suffixIndex) : raw;
    const suffix = suffixIndex >= 0 ? raw.slice(suffixIndex) : '';
    const normalizedPath = pathname
        .split('/')
        .map((segment) => {
            if (!segment) {
                return '';
            }

            try {
                return encodeURIComponent(decodeURIComponent(segment));
            } catch {
                return encodeURIComponent(segment);
            }
        })
        .join('/');

    const normalizedValue = `${normalizedPath}${suffix}`;
    try {
        if (typeof window !== 'undefined' && window.location?.href) {
            return new URL(normalizedValue, resolveMediaBaseUrl()).toString();
        }
    } catch {
        return normalizedValue;
    }

    return normalizedValue;
}

function resolveMediaBaseUrl() {
    if (typeof window === 'undefined' || !window.location) {
        return 'http://127.0.0.1:8787/';
    }

    const { protocol, hostname, port, origin } = window.location;
    const normalizedProtocol = protocol === 'https:' ? 'https:' : 'http:';
    const isLocalHost = hostname === '127.0.0.1' || hostname === 'localhost';

    if (protocol === 'file:') {
        return 'http://127.0.0.1:8787/';
    }

    if (isLocalHost && port && port !== '8787') {
        return `${normalizedProtocol}//${hostname}:8787/`;
    }

    return `${origin || `${normalizedProtocol}//${hostname}${port ? `:${port}` : ''}`}/`;
}

function appendMediaUrlSearchParams(url, params = {}) {
    const normalizedUrl = String(url || '').trim();
    if (!normalizedUrl) {
        return '';
    }

    try {
        const resolved = new URL(normalizedUrl, resolveMediaBaseUrl());
        Object.entries(params).forEach(([key, value]) => {
            const normalizedValue = String(value || '').trim();
            if (normalizedValue) {
                resolved.searchParams.set(key, normalizedValue);
            }
        });
        return resolved.toString();
    } catch {
        return normalizedUrl;
    }
}

function getAssetFixedIframeViewport(asset) {
    const collectionId = normalizeCollectionIdValue(
        asset?.collectionId
        || resolveAssetCollection(asset)?.id
        || state.activeCollection?.id
        || ''
    );

    return FIXED_IFRAME_VIEWPORTS[collectionId] || null;
}

function renderAssetMediaMarkup(asset, options = {}) {
    const src = getAssetMediaSrc(asset);
    if (!src) {
        return '';
    }

    const alt = options.decorative ? '' : String(options.alt || asset?.name || 'Inscription preview').trim();
    const className = String(options.className || '').trim();
    const classAttribute = className ? ` class="${escapeHtml(className)}"` : '';
    const loading = String(options.loading || 'lazy').trim();

    if (getAssetMediaType(asset) === 'iframe') {
        const decorativeAttributes = options.decorative
            ? ' tabindex="-1" aria-hidden="true"'
            : '';
        const fixedViewport = getAssetFixedIframeViewport(asset);
        const useFixedViewport = Boolean(
            fixedViewport
            && ['asset-card__media-content', 'inspect-media__content'].includes(className)
        );

        if (useFixedViewport) {
            const shellClassName = [className, 'fixed-iframe-shell'].filter(Boolean).join(' ');
            const width = Math.max(1, Math.round(Number(fixedViewport.width) || 0));
            const height = Math.max(1, Math.round(Number(fixedViewport.height) || 0));
            const fixedIframeMode = className === 'inspect-media__content' ? 'inspect' : 'card';
            const iframeSrc = appendMediaUrlSearchParams(src, { mode: fixedIframeMode });
            const fallbackSrc = getAssetMediaFallbackSrc(asset);
            const posterMarkup = fallbackSrc
                ? `<img class="fixed-iframe-shell__poster" src="${escapeHtml(fallbackSrc)}" alt="" loading="${escapeHtml(loading)}" decoding="async" aria-hidden="true">`
                : '';
            const deferredLoad = className === 'asset-card__media-content';
            const iframeSrcAttribute = deferredLoad ? '' : ` src="${escapeHtml(iframeSrc)}"`;
            const iframeDataSrcAttribute = deferredLoad
                ? ` data-src="${escapeHtml(iframeSrc)}" data-load-state="deferred"`
                : '';
            return `
                <span class="${escapeHtml(shellClassName)} fixed-iframe-shell--pending" data-fixed-iframe-shell data-fixed-iframe-width="${width}" data-fixed-iframe-height="${height}" style="--fixed-iframe-source-width:${width}px; --fixed-iframe-source-height:${height}px;">
                    ${posterMarkup}
                    <iframe class="fixed-iframe-shell__frame"${iframeSrcAttribute}${iframeDataSrcAttribute} title="${escapeHtml(alt)}" loading="${escapeHtml(loading)}" referrerpolicy="no-referrer" sandbox="allow-scripts"${decorativeAttributes}></iframe>
                </span>
            `.trim();
        }

        return `<iframe${classAttribute} src="${escapeHtml(src)}" title="${escapeHtml(alt)}" loading="${escapeHtml(loading)}" referrerpolicy="no-referrer" sandbox="allow-scripts"${decorativeAttributes}></iframe>`;
    }

    const fallbackSrc = getAssetMediaFallbackSrc(asset);
    const fallbackAttribute = fallbackSrc && fallbackSrc !== src
        ? ` data-fallback-src="${escapeHtml(fallbackSrc)}"`
        : '';

    return `<img${classAttribute} src="${escapeHtml(src)}" alt="${escapeHtml(alt)}" loading="${escapeHtml(loading)}"${options.decorative ? ' aria-hidden="true"' : ''}${fallbackAttribute}>`;
}

function sanitizeDownloadBaseName(value) {
    const sanitized = String(value || 'image')
        .replace(/[\\/:*?"<>|]/g, '')
        .trim();
    return sanitized || 'image';
}

function getImageSourceUrl(img) {
    return String(img?.currentSrc || img?.getAttribute?.('src') || img?.src || '').trim();
}

function getImageSourceExtension(img) {
    const sourceUrl = getImageSourceUrl(img).split('#')[0].split('?')[0];
    const extensionMatch = sourceUrl.match(/\.([a-z0-9]+)$/i);
    return extensionMatch ? extensionMatch[1].toLowerCase() : '';
}

function getMinimumDownloadSizeForAsset(asset) {
    return String(asset?.collectionId || '').trim().toLowerCase() === 'blok-space' ? 2000 : 0;
}

function downloadFileAsset(fileUrl, suggestedFileName) {
    const normalizedUrl = String(fileUrl || '').trim();
    if (!normalizedUrl) {
        return;
    }

    const link = document.createElement('a');
    link.href = normalizedUrl;
    link.download = suggestedFileName || 'download';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function blurInteractiveControl(control) {
    if (!control || typeof control.blur !== 'function') {
        return;
    }

    control.blur();
    window.setTimeout(() => control.blur(), 0);
}

function syncFixedIframeViewportShell(shell) {
    if (!(shell instanceof HTMLElement)) {
        return;
    }

    const sourceWidth = Math.max(Math.round(Number(shell.dataset.fixedIframeWidth || 0)), 1);
    const sourceHeight = Math.max(Math.round(Number(shell.dataset.fixedIframeHeight || 0)), 1);
    let availableWidth = 0;
    let availableHeight = 0;

    const cardMedia = shell.closest('.asset-card__media');
    if (cardMedia instanceof HTMLElement) {
        availableWidth = Math.max(cardMedia.clientWidth || 0, 0);
        availableHeight = Math.max(cardMedia.clientHeight || 0, 0);
    } else {
        const inspectMedia = shell.closest('.inspect-media');
        if (!(inspectMedia instanceof HTMLElement)) {
            return;
        }

        const inspectContent = shell.closest('.inspect-drawer__content');
        const inspectStyles = window.getComputedStyle(inspectMedia);
        const paddingX = (parseFloat(inspectStyles.paddingLeft || '0') || 0)
            + (parseFloat(inspectStyles.paddingRight || '0') || 0);
        availableWidth = Math.max(
            Math.min(
                sourceWidth,
                Math.floor((inspectContent instanceof HTMLElement ? inspectContent.clientWidth : inspectMedia.clientWidth) - paddingX)
            ),
            0
        );
        availableHeight = sourceHeight;
    }

    if (!availableWidth || !availableHeight) {
        return;
    }

    const scale = Math.min(availableWidth / sourceWidth, availableHeight / sourceHeight);
    if (!Number.isFinite(scale) || scale <= 0) {
        return;
    }

    shell.style.width = `${Math.round(sourceWidth * scale)}px`;
    shell.style.height = `${Math.round(sourceHeight * scale)}px`;
    shell.style.setProperty('--fixed-iframe-scale', scale.toFixed(6));
}

function syncFixedIframeViewports(root = document) {
    if (!root) {
        return;
    }

    const shells = [];
    if (root instanceof HTMLElement && root.matches('[data-fixed-iframe-shell]')) {
        shells.push(root);
    }

    if (typeof root.querySelectorAll === 'function') {
        shells.push(...root.querySelectorAll('[data-fixed-iframe-shell]'));
    }

    shells.forEach((shell) => syncFixedIframeViewportShell(shell));
}

function ensureFixedIframeObserver() {
    if (fixedIframeObserver || typeof IntersectionObserver !== 'function') {
        return fixedIframeObserver;
    }

    fixedIframeObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) {
                return;
            }

            const frame = entry.target;
            fixedIframeObserver?.unobserve(frame);
            queueFixedIframeLoad(frame);
        });
    }, {
        rootMargin: FIXED_IFRAME_PRELOAD_MARGIN,
        threshold: 0.01
    });

    return fixedIframeObserver;
}

function queueFixedIframeLoad(frame) {
    if (!(frame instanceof HTMLIFrameElement)) {
        return;
    }

    if (!String(frame.dataset.src || '').trim()) {
        return;
    }

    const loadState = String(frame.dataset.loadState || '').trim();
    if (loadState === 'queued' || loadState === 'loading' || loadState === 'loaded') {
        return;
    }

    frame.dataset.loadState = 'queued';
    pendingFixedIframeLoads.push(frame);
    pumpFixedIframeLoadQueue();
}

function pumpFixedIframeLoadQueue() {
    while (activeFixedIframeLoads < MAX_PARALLEL_FIXED_IFRAME_LOADS && pendingFixedIframeLoads.length > 0) {
        const frame = pendingFixedIframeLoads.shift();
        if (!(frame instanceof HTMLIFrameElement) || !frame.isConnected) {
            continue;
        }

        const nextSrc = String(frame.dataset.src || '').trim();
        const loadState = String(frame.dataset.loadState || '').trim();
        if (!nextSrc || (loadState !== 'queued' && loadState !== 'deferred')) {
            continue;
        }

        activeFixedIframeLoads += 1;
        frame.dataset.loadState = 'loading';
        frame.src = nextSrc;
    }
}

function finalizeFixedIframeLoad(frame, failed = false) {
    if (!(frame instanceof HTMLIFrameElement)) {
        return;
    }

    if (String(frame.dataset.loadState || '').trim() === 'loading') {
        activeFixedIframeLoads = Math.max(0, activeFixedIframeLoads - 1);
    }

    frame.dataset.loadState = failed ? 'failed' : 'loaded';
    const shell = frame.closest('[data-fixed-iframe-shell]');
    if (shell instanceof HTMLElement) {
        shell.classList.toggle('is-loaded', !failed);
        shell.classList.toggle('is-failed', failed);
        syncFixedIframeViewportShell(shell);
    }

    pumpFixedIframeLoadQueue();
}

function hydrateDeferredFixedIframes(root = document) {
    if (!root || typeof root.querySelectorAll !== 'function') {
        return;
    }

    const frames = Array.from(root.querySelectorAll('.fixed-iframe-shell__frame[data-src]'));
    if (frames.length === 0) {
        return;
    }

    const observer = ensureFixedIframeObserver();
    frames.forEach((frame) => {
        if (!(frame instanceof HTMLIFrameElement)) {
            return;
        }

        const loadState = String(frame.dataset.loadState || '').trim();
        if (loadState && loadState !== 'deferred') {
            return;
        }

        if (observer) {
            observer.observe(frame);
            return;
        }

        queueFixedIframeLoad(frame);
    });

    pumpFixedIframeLoadQueue();
}

function downloadUpscaledJpegFromImage(img, fileNameBase, asset = null) {
    if (!img) {
        return;
    }

    const baseUpscaleFactor = 4;

    if (getImageSourceExtension(img) === 'gif') {
        const sourceUrl = getImageSourceUrl(img);
        if (!sourceUrl) {
            return;
        }

        downloadFileAsset(sourceUrl, `${sanitizeDownloadBaseName(fileNameBase)}.gif`);
        return;
    }

    const performDownload = function() {
        const sourceWidth = img.naturalWidth || img.width;
        const sourceHeight = img.naturalHeight || img.height;
        if (!sourceWidth || !sourceHeight) {
            return;
        }

        const baseWidth = sourceWidth * baseUpscaleFactor;
        const baseHeight = sourceHeight * baseUpscaleFactor;
        const minimumOutputSize = getMinimumDownloadSizeForAsset(asset);
        const needsExpandedOutput = minimumOutputSize > 0 && Math.max(baseWidth, baseHeight) < minimumOutputSize;
        const outputScale = needsExpandedOutput
            ? minimumOutputSize / Math.max(sourceWidth, sourceHeight)
            : baseUpscaleFactor;

        const canvas = document.createElement('canvas');
        canvas.width = Math.round(sourceWidth * outputScale);
        canvas.height = Math.round(sourceHeight * outputScale);

        const ctx = canvas.getContext('2d');
        if (!ctx) {
            return;
        }

        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        canvas.toBlob((blob) => {
            if (!blob) {
                return;
            }

            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `${sanitizeDownloadBaseName(fileNameBase)}.jpg`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.setTimeout(() => URL.revokeObjectURL(link.href), 0);
        }, 'image/jpeg', 0.95);
    };

    if (!img.complete || !img.naturalWidth) {
        img.addEventListener('load', performDownload, { once: true });
        return;
    }

    performDownload();
}

function renderSaleThumbnail(sale) {
    const asset = getSaleThumbnailAsset(sale);
    if (!asset) {
        return '<span class="sales-feed__thumb sales-feed__thumb--placeholder" aria-hidden="true"></span>';
    }

    return `
        <span class="sales-feed__thumb">
            ${renderAssetMediaMarkup(asset, {
                className: 'sales-feed__thumb-media',
                alt: sale.name || 'Sale thumbnail',
                decorative: true
            })}
        </span>
    `;
}

function renderSaleUsdLine(priceSats) {
    const usdValue = formatUsdFromSats(priceSats);
    return usdValue ? `<span>${escapeHtml(usdValue)}</span>` : '';
}

function getSaleThumbnailAsset(sale) {
    const inscriptionId = String(sale?.inscriptionId || '').trim().toLowerCase();
    if (!inscriptionId) {
        const fallbackSrc = String(state.activeCollection?.imagePath || '').trim();
        return fallbackSrc ? { imageSrc: fallbackSrc, mediaType: 'image' } : null;
    }

    return state.assets.find((asset) => String(asset?.id || '').trim().toLowerCase() === inscriptionId)
        || null;
}

function renderItemOfferPanel() {
    const offerRefs = getItemOfferRefs();
    if (!offerRefs.panel || !offerRefs.body) {
        return;
    }

    const selectedAsset = getSelectedOfferAsset();
    const canCreateOffer = Boolean(selectedAsset) && !isAssetOwnedByWallet(selectedAsset);
    if (offerRefs.target) {
        offerRefs.target.innerHTML = selectedAsset
            ? renderItemOfferTarget(selectedAsset, {
                label: '',
                showClearButton: false
            })
            : '<div class="item-offer-target__empty">Select an inscription in Inspect to place an item offer.</div>';
    }
    if (offerRefs.price) {
        offerRefs.price.disabled = !canCreateOffer;
        offerRefs.price.placeholder = !selectedAsset
            ? 'Select item first'
            : !canCreateOffer
                ? 'You own this item'
                : formatBtcInputValue(selectedAsset.topOffer?.priceSats || 180000);
    }
    if (offerRefs.customFee) {
        offerRefs.customFee.disabled = !canCreateOffer;
    }
    if (offerRefs.button) {
        offerRefs.button.disabled = !canCreateOffer;
    }

    if (offerRefs.list) {
        offerRefs.list.innerHTML = renderItemOfferList();
    }
}

function getSelectedOfferAsset() {
    const targetId = normalizeAssetId(state.cardOfferAssetId || state.inspectId);
    if (!targetId) {
        return null;
    }

    return resolveInspectAsset(targetId);
}

function normalizeAssetId(value) {
    return String(value || '').trim().toLowerCase();
}

function getAssetById(inscriptionId) {
    const normalizedId = normalizeAssetId(inscriptionId);
    if (!normalizedId) {
        return null;
    }

    return state.assets.find((asset) => normalizeAssetId(asset?.id) === normalizedId) || null;
}

function buildMinimalInspectAsset(inscriptionId) {
    const normalizedId = normalizeAssetId(inscriptionId);
    if (!normalizedId) {
        return null;
    }

    return {
        id: normalizedId,
        collectionId: String(state.activeCollectionId || '').trim(),
        collectionName: String(state.activeCollection?.name || '').trim(),
        name: shortInscriptionId(normalizedId),
        imageSrc: '',
        mediaType: 'image',
        traits: [],
        listing: getListingByAssetId(normalizedId),
        topOffer: null,
        previousSale: null
    };
}

function getAssetCardElementById(inscriptionId) {
    const normalizedId = normalizeAssetId(inscriptionId);
    if (!normalizedId || !refs.assetGrid) {
        return null;
    }

    return Array.from(refs.assetGrid.querySelectorAll('.asset-card')).find((node) => (
        normalizeAssetId(node?.dataset?.assetId || '') === normalizedId
    )) || null;
}

function buildFallbackAssetFromCard(inscriptionId) {
    const card = getAssetCardElementById(inscriptionId);
    if (!card) {
        return null;
    }

    const mediaNode = card.querySelector('.asset-card__media img, .asset-card__media iframe');
    const titleNode = card.querySelector('.asset-card__name-block h3');

    return {
        id: String(inscriptionId || '').trim(),
        collectionId: String(state.activeCollectionId || '').trim(),
        collectionName: String(state.activeCollection?.name || '').trim(),
        name: String(titleNode?.textContent || '').trim() || shortInscriptionId(inscriptionId),
        imageSrc: String(mediaNode?.getAttribute?.('src') || '').trim(),
        mediaType: mediaNode?.tagName?.toLowerCase() === 'iframe' ? 'iframe' : 'image',
        traits: [],
        listing: getListingByAssetId(inscriptionId),
        topOffer: null
    };
}

function resolveInspectAsset(inscriptionId = state.inspectId) {
    const normalizedId = normalizeAssetId(inscriptionId);
    if (!normalizedId) {
        return null;
    }

    const directAsset = getAssetById(normalizedId);
    if (directAsset) {
        return directAsset;
    }

    const fallbackAsset = state.inspectAsset;
    if (fallbackAsset && normalizeAssetId(fallbackAsset.id) === normalizedId) {
        return fallbackAsset;
    }

    const profileHoldings = Array.isArray(state.profileView?.holdings) ? state.profileView.holdings : [];
    const profileAsset = profileHoldings.find((holding) => normalizeAssetId(holding?.id) === normalizedId);
    if (profileAsset) {
        return profileAsset;
    }

    return buildFallbackAssetFromCard(normalizedId) || buildMinimalInspectAsset(normalizedId);
}

function getListingByAssetId(inscriptionId) {
    const normalizedId = normalizeAssetId(inscriptionId);
    if (!normalizedId) {
        return null;
    }

    const direct = state.listingsById.get(inscriptionId) || state.listingsById.get(normalizedId);
    if (direct) {
        return direct;
    }

    for (const [key, value] of state.listingsById.entries()) {
        if (normalizeAssetId(key) === normalizedId) {
            return value;
        }
    }

    return null;
}

function setListingForAsset(inscriptionId, listingEntry = null) {
    const normalizedId = normalizeAssetId(inscriptionId);
    const nextListings = new Map();

    for (const [key, value] of state.listingsById.entries()) {
        if (normalizeAssetId(key) !== normalizedId) {
            nextListings.set(key, value);
        }
    }

    if (listingEntry) {
        nextListings.set(String(inscriptionId || '').trim(), listingEntry);
    }

    state.listingsById = nextListings;
}

function getTopOpenItemOfferForAsset(inscriptionId) {
    const normalizedId = normalizeAssetId(inscriptionId);
    if (!normalizedId) {
        return null;
    }

    return (Array.isArray(state.openOffers) ? state.openOffers : [])
        .filter((offer) => String(offer?.status || 'open').trim().toLowerCase() === 'open')
        .filter((offer) => String(offer?.type || 'item').trim().toLowerCase() === 'item')
        .filter((offer) => normalizeAssetId(offer?.inscriptionId) === normalizedId)
        .sort((left, right) => {
            const priceDelta = Number(right?.priceSats || 0) - Number(left?.priceSats || 0);
            if (priceDelta !== 0) {
                return priceDelta;
            }

            return compareIsoDatesDescending(left?.updatedAt || left?.createdAt || '', right?.updatedAt || right?.createdAt || '');
        })[0] || null;
}

function syncAssetMarketState(inscriptionId) {
    const normalizedId = normalizeAssetId(inscriptionId);
    if (!normalizedId) {
        return;
    }

    const listing = getListingByAssetId(normalizedId);
    const topOffer = getTopOpenItemOfferForAsset(normalizedId);

    state.assets = state.assets.map((asset) => (
        normalizeAssetId(asset?.id) === normalizedId
            ? {
                ...asset,
                listing,
                topOffer
            }
            : asset
    ));

    if (state.inspectAsset && normalizeAssetId(state.inspectAsset.id) === normalizedId) {
        state.inspectAsset = {
            ...state.inspectAsset,
            listing,
            topOffer
        };
    }
}

function syncActiveCollectionMarketStats() {
    if (!state.activeCollection) {
        return;
    }

    const listingPrices = state.assets
        .map((asset) => Number(asset?.listing?.priceSats || 0))
        .filter((price) => Number.isFinite(price) && price > 0);
    const activeListingCount = listingPrices.length;
    const floorPriceSats = listingPrices.length > 0 ? Math.min(...listingPrices) : 0;
    const openOfferCount = (Array.isArray(state.openOffers) ? state.openOffers : [])
        .filter((offer) => String(offer?.status || 'open').trim().toLowerCase() === 'open')
        .length;

    state.activeCollection = {
        ...state.activeCollection,
        activeListingCount,
        floorPriceSats,
        openOfferCount
    };
    state.collections = state.collections.map((collection) => (
        collection.id === state.activeCollectionId
            ? {
                ...collection,
                activeListingCount,
                floorPriceSats,
                openOfferCount
            }
            : collection
    ));
}

function applyOptimisticListingPublished(asset, priceSats) {
    if (!asset || !state.wallet) {
        return null;
    }

    const now = new Date().toISOString();
    const listingEntry = {
        inscriptionId: asset.id,
        collectionId: asset.collectionId,
        sellerAddress: resolveProfileAddress(state.wallet),
        sellerPaymentsAddress: resolvePaymentAddress(state.wallet),
        priceSats: Number(priceSats || 0),
        walletProvider: String(state.wallet?.provider || '').trim().toLowerCase(),
        signatureMethod: String(state.wallet?.signatureMethod || '').trim().toLowerCase(),
        createdAt: now,
        updatedAt: now
    };

    setListingForAsset(asset.id, listingEntry);
    state.cardListAssetId = '';
    syncAssetMarketState(asset.id);
    syncActiveCollectionMarketStats();
    render();

    return buildMutationRefreshDescriptor('listing-created', asset.id, {
        collectionId: asset.collectionId,
        priceSats: Number(priceSats || 0)
    });
}

function applyOptimisticListingRemoved(asset) {
    const inscriptionId = typeof asset === 'string' ? asset : asset?.id;
    if (!inscriptionId) {
        return null;
    }

    setListingForAsset(inscriptionId, null);
    state.cardListAssetId = '';
    syncAssetMarketState(inscriptionId);
    syncActiveCollectionMarketStats();
    render();

    return buildMutationRefreshDescriptor('listing-removed', inscriptionId, {
        collectionId: typeof asset === 'object' ? asset?.collectionId : state.activeCollectionId
    });
}

function applyOptimisticItemOfferPlaced(asset, priceSats) {
    if (!asset || !state.wallet) {
        return null;
    }

    const now = new Date().toISOString();
    const offerEntry = {
        offerId: `optimistic-offer-${normalizeAssetId(asset.id)}-${Date.now()}`,
        type: 'item',
        status: 'open',
        collectionId: asset.collectionId,
        inscriptionId: asset.id,
        name: asset.name,
        priceSats: Number(priceSats || 0),
        buyerAddress: resolvePaymentAddress(state.wallet),
        buyerOrdinalsAddress: resolveOrdinalsAddress(state.wallet),
        createdAt: now,
        updatedAt: now
    };

    state.openOffers = [offerEntry, ...(Array.isArray(state.openOffers) ? state.openOffers : [])];
    syncAssetMarketState(asset.id);
    syncActiveCollectionMarketStats();
    render();

    return buildMutationRefreshDescriptor('offer-created', asset.id, {
        collectionId: asset.collectionId,
        priceSats: Number(priceSats || 0)
    });
}

function applyOptimisticOfferCancelled(offerId) {
    const normalizedOfferId = String(offerId || '').trim();
    if (!normalizedOfferId) {
        return null;
    }

    const openOffers = Array.isArray(state.openOffers) ? state.openOffers : [];
    const cancelledOffer = openOffers.find((entry) => String(entry?.offerId || '').trim() === normalizedOfferId) || null;
    state.acceptingOfferId = state.acceptingOfferId === normalizedOfferId ? '' : state.acceptingOfferId;
    if (!cancelledOffer) {
        return null;
    }

    state.openOffers = openOffers.filter((entry) => String(entry?.offerId || '').trim() !== normalizedOfferId);
    syncAssetMarketState(cancelledOffer.inscriptionId);
    syncActiveCollectionMarketStats();
    render();

    return buildMutationRefreshDescriptor('offer-cancelled', cancelledOffer.inscriptionId, {
        collectionId: cancelledOffer.collectionId,
        offerId: normalizedOfferId
    });
}

function buildMutationRefreshDescriptor(type, inscriptionId, options = {}) {
    return {
        type: String(type || '').trim().toLowerCase(),
        inscriptionId: normalizeAssetId(inscriptionId),
        collectionId: String(options?.collectionId || state.activeCollectionId || '').trim(),
        priceSats: Number(options?.priceSats || 0),
        offerId: String(options?.offerId || '').trim(),
        walletAddresses: Array.from(getWalletAddressSet(state.wallet))
    };
}

function queueRefreshAfterMutation(options = {}) {
    window.clearTimeout(deferredMutationRefreshTimer);
    deferredMutationRefreshTimer = 0;
    queuedMutationRefresh = options;
    if (mutationRefreshInFlight) {
        return;
    }

    mutationRefreshInFlight = true;
    void (async () => {
        try {
            while (queuedMutationRefresh) {
                const nextOptions = queuedMutationRefresh;
                queuedMutationRefresh = null;
                await refreshAfterMutation(nextOptions);
            }
        } catch (error) {
            setMessage(formatError(error), 'error');
        } finally {
            mutationRefreshInFlight = false;
            if (queuedMutationRefresh) {
                queueRefreshAfterMutation(queuedMutationRefresh);
            }
        }
    })();
}

function scheduleDeferredMutationRefresh(options = {}, delayMs = 2400) {
    window.clearTimeout(deferredMutationRefreshTimer);
    deferredMutationRefreshTimer = window.setTimeout(() => {
        deferredMutationRefreshTimer = 0;
        queueRefreshAfterMutation(options);
    }, Math.max(0, Number(delayMs) || 0));
}

async function waitForMarketplaceMutationReflection(descriptor, timeoutMs = 9000) {
    const startedAt = Date.now();
    const delays = [260, 420, 650, 900, 1200, 1700, 2200];
    let attempt = 0;

    while (Date.now() - startedAt < timeoutMs) {
        try {
            if (await isMarketplaceMutationReflected(descriptor)) {
                return true;
            }
        } catch {
            // Ignore transient API lag while the indexer catches up.
        }

        const waitMs = delays[Math.min(attempt, delays.length - 1)];
        attempt += 1;
        await waitForMs(waitMs);
    }

    return false;
}

async function isMarketplaceMutationReflected(descriptor) {
    const mutationType = String(descriptor?.type || '').trim().toLowerCase();
    const collectionId = String(descriptor?.collectionId || state.activeCollectionId || '').trim();
    const normalizedId = normalizeAssetId(descriptor?.inscriptionId || '');
    const normalizedOfferId = String(descriptor?.offerId || '').trim();

    if (!mutationType || !collectionId || !normalizedId) {
        return true;
    }

    if (mutationType === 'listing-created' || mutationType === 'listing-removed') {
        const listings = await MARKETPLACE_API.getListings(collectionId);
        const match = (Array.isArray(listings) ? listings : []).find((entry) => normalizeAssetId(entry?.inscriptionId) === normalizedId) || null;
        if (mutationType === 'listing-created') {
            return Boolean(match && (!descriptor?.priceSats || Number(match?.priceSats || 0) === Number(descriptor.priceSats || 0)));
        }

        return !match;
    }

    if (mutationType === 'offer-created') {
        const offers = await MARKETPLACE_API.getOffers(collectionId);
        const walletAddresses = new Set((Array.isArray(descriptor?.walletAddresses) ? descriptor.walletAddresses : []).map(normalizeAddressValue));
        return (Array.isArray(offers) ? offers : []).some((offer) => {
            if (String(offer?.status || 'open').trim().toLowerCase() !== 'open') {
                return false;
            }
            if (String(offer?.type || 'item').trim().toLowerCase() !== 'item') {
                return false;
            }
            if (normalizeAssetId(offer?.inscriptionId) !== normalizedId) {
                return false;
            }
            if (descriptor?.priceSats && Number(offer?.priceSats || 0) !== Number(descriptor.priceSats || 0)) {
                return false;
            }

            const buyerMatches = [
                normalizeAddressValue(offer?.buyerAddress || ''),
                normalizeAddressValue(offer?.buyerOrdinalsAddress || '')
            ].some((address) => walletAddresses.has(address));

            return buyerMatches;
        });
    }

    if (mutationType === 'offer-cancelled') {
        const offers = await MARKETPLACE_API.getOffers(collectionId);
        const walletAddresses = new Set((Array.isArray(descriptor?.walletAddresses) ? descriptor.walletAddresses : []).map(normalizeAddressValue));
        return !(Array.isArray(offers) ? offers : []).some((offer) => {
            if (String(offer?.status || 'open').trim().toLowerCase() !== 'open') {
                return false;
            }
            if (String(offer?.type || 'item').trim().toLowerCase() !== 'item') {
                return false;
            }
            if (normalizedOfferId) {
                return String(offer?.offerId || '').trim() === normalizedOfferId;
            }
            if (normalizeAssetId(offer?.inscriptionId) !== normalizedId) {
                return false;
            }

            return [
                normalizeAddressValue(offer?.buyerAddress || ''),
                normalizeAddressValue(offer?.buyerOrdinalsAddress || '')
            ].some((address) => walletAddresses.has(address));
        });
    }

    return true;
}

function getAssetDetailsById(inscriptionId) {
    const normalizedId = normalizeAssetId(inscriptionId);
    if (!normalizedId) {
        return null;
    }

    const direct = state.detailsById.get(inscriptionId) || state.detailsById.get(normalizedId);
    if (direct) {
        return direct;
    }

    for (const [key, value] of state.detailsById.entries()) {
        if (normalizeAssetId(key) === normalizedId) {
            return value;
        }
    }

    return null;
}

function setAssetDetailsCache(inscriptionId, details) {
    if (!details) {
        return;
    }

    const rawId = String(inscriptionId || details?.inscriptionId || details?.id || '').trim();
    const normalizedId = normalizeAssetId(rawId);
    if (rawId) {
        state.detailsById.set(rawId, details);
    }
    if (normalizedId) {
        state.detailsById.set(normalizedId, details);
    }
}

function clearAssetDetailsCache(inscriptionId) {
    const normalizedId = normalizeAssetId(inscriptionId);
    if (!normalizedId) {
        return;
    }

    for (const key of Array.from(state.detailsById.keys())) {
        if (normalizeAssetId(key) === normalizedId) {
            state.detailsById.delete(key);
        }
    }
}

function mergePreviousSaleIntoAssetState(inscriptionId, salesHistory) {
    const normalizedId = normalizeAssetId(inscriptionId);
    if (!normalizedId) {
        return null;
    }

    const resolvedPreviousSale = getPreviousSaleRecord(Array.isArray(salesHistory) ? salesHistory : []);
    if (!resolvedPreviousSale) {
        return state.assets.find((asset) => normalizeAssetId(asset?.id) === normalizedId)?.previousSale || null;
    }

    state.assets = state.assets.map((asset) => (
        normalizeAssetId(asset?.id) === normalizedId
            ? { ...asset, previousSale: resolvedPreviousSale }
            : asset
    ));

    if (state.inspectAsset && normalizeAssetId(state.inspectAsset.id) === normalizedId) {
        state.inspectAsset = {
            ...state.inspectAsset,
            previousSale: resolvedPreviousSale
        };
    }

    return resolvedPreviousSale;
}

async function waitForMs(timeoutMs) {
    await new Promise((resolve) => window.setTimeout(resolve, timeoutMs));
}

async function fetchAssetDetailsWithRetry(inscriptionId, retries = 2) {
    const attempts = Math.max(1, Number(retries) || 1);
    let lastError = null;

    for (let attempt = 0; attempt < attempts; attempt += 1) {
        try {
            return await MARKETPLACE_API.getInscriptionDetails(inscriptionId);
        } catch (error) {
            lastError = error;
            if (attempt < attempts - 1) {
                await waitForMs(140 * (attempt + 1));
            }
        }
    }

    throw lastError || new Error('Unable to load inscription details.');
}

async function loadAssetDetails(inscriptionId, options = {}) {
    const normalizedId = normalizeAssetId(inscriptionId);
    if (!normalizedId) {
        return null;
    }

    const force = Boolean(options?.force);
    const retries = Math.max(1, Number(options?.retries) || 2);
    if (!force) {
        const cached = getAssetDetailsById(normalizedId);
        if (cached) {
            mergePreviousSaleIntoAssetState(normalizedId, cached?.salesHistory);
            return cached;
        }
    }

    if (!force && detailRequestStore.has(normalizedId)) {
        return detailRequestStore.get(normalizedId);
    }

    const pending = (async () => {
        try {
            const details = await fetchAssetDetailsWithRetry(normalizedId, retries);
            if (details) {
                setAssetDetailsCache(normalizedId, details);
                mergePreviousSaleIntoAssetState(normalizedId, details?.salesHistory);
            }
            return details || null;
        } finally {
            detailRequestStore.delete(normalizedId);
        }
    })();

    detailRequestStore.set(normalizedId, pending);
    return pending;
}

function attachPreviousSaleSummaries(assets, salesEntries) {
    const latestById = new Map();

    for (const sale of Array.isArray(salesEntries) ? salesEntries : []) {
        const normalizedId = normalizeAssetId(sale?.inscriptionId);
        if (!normalizedId || Number(sale?.priceSats || 0) <= 0) {
            continue;
        }

        const current = latestById.get(normalizedId);
        if (!current || compareIsoDatesDescending(sale?.occurredAt || '', current?.occurredAt || '') > 0) {
            latestById.set(normalizedId, sale);
        }
    }

    return (Array.isArray(assets) ? assets : []).map((asset) => {
        const assetPreviousSale = asset?.previousSale && Number(asset.previousSale?.priceSats || 0) > 0
            ? asset.previousSale
            : null;
        const mappedPreviousSale = latestById.get(normalizeAssetId(asset?.id)) || null;
        const previousSale = mappedPreviousSale || assetPreviousSale || null;
        return { ...asset, previousSale };
    });
}

function renderItemOfferTarget(asset, options = {}) {
    if (!asset) {
        return '';
    }

    const {
        label = 'Selected item',
        showClearButton = true
    } = options;

    return `
        <div class="item-offer-target__selected${showClearButton ? '' : ' item-offer-target__selected--inspect'}">
            <button class="item-offer-target__media" type="button" data-open-inspect="${escapeHtml(asset.id)}" aria-label="Inspect ${escapeHtml(asset.name)}">
                ${renderAssetMediaMarkup(asset, {
                    className: 'item-offer-target__media-content',
                    alt: asset.name,
                    decorative: getAssetMediaType(asset) === 'iframe'
                })}
            </button>
            <div class="item-offer-target__meta">
                ${label ? `<span class="item-offer-target__label">${escapeHtml(label)}</span>` : ''}
                <strong class="item-offer-target__name">${escapeHtml(asset.name || 'Inscription')}</strong>
            </div>
            ${showClearButton ? '<button class="icon-button icon-button--compact" type="button" data-clear-offer-target>Clear</button>' : ''}
        </div>
    `;
}

function getItemOfferRefs() {
    if (!refs.drawerContent) {
        return {};
    }

    return {
        panel: refs.drawerContent.querySelector('#inspect-offer-panel'),
        body: refs.drawerContent.querySelector('#inspect-offer-body'),
        target: refs.drawerContent.querySelector('#inspect-offer-target'),
        price: refs.drawerContent.querySelector('#inspect-offer-price'),
        customFee: refs.drawerContent.querySelector('#inspect-offer-custom-fee'),
        button: refs.drawerContent.querySelector('#inspect-offer-button'),
        list: refs.drawerContent.querySelector('#inspect-offer-list')
    };
}

function renderInspectOfferPanel(asset) {
    if (!asset) {
        return '';
    }

    const canCreateOffer = !isAssetOwnedByWallet(asset);

    return `
        <section id="inspect-offer-panel" class="detail-panel inspect-offer-panel">
            <div class="panel-header panel-header--compact">
                <strong>Item offer</strong>
            </div>
            <div id="inspect-offer-body" class="inspect-offer-panel__body">
                ${canCreateOffer ? `
                    <div id="inspect-offer-target" class="item-offer-target inspect-offer-target"></div>
                    <label class="field">
                        <span>Price (btc)</span>
                        <input id="inspect-offer-price" type="number" min="0" step="0.00000001" placeholder="0.00250000">
                    </label>
                    <label class="field">
                        <span>Network fee (sat/vb)</span>
                        <input id="inspect-offer-custom-fee" type="number" min="1" step="1" placeholder="5">
                    </label>
                    <button id="inspect-offer-button" class="action-button primary" type="button">Place item offer</button>
                ` : ''}
                <div class="item-offer-live">
                    <div id="inspect-offer-list" class="item-offer-list"></div>
                </div>
            </div>
        </section>
    `;
}

function renderItemOfferList() {
    const selectedAsset = getSelectedOfferAsset();
    const offers = getOfferPanelEntries()
        .filter((offer) => !selectedAsset || normalizeAssetId(offer?.inscriptionId) === normalizeAssetId(selectedAsset.id));
    if (offers.length === 0) {
        return `<p class="empty-state compact">${selectedAsset ? 'No open item offers on this inscription.' : 'No open item offers yet.'}</p>`;
    }

    const walletAddresses = getWalletAddressSet(state.wallet);

    return offers.map((offer) => {
        const asset = state.assets.find((entry) => normalizeAssetId(entry.id) === normalizeAssetId(offer?.inscriptionId)) || null;
        const offerAddresses = [
            normalizeAddressValue(offer?.buyerAddress || ''),
            normalizeAddressValue(offer?.buyerOrdinalsAddress || '')
        ].filter(Boolean);
        const ownOffer = offerAddresses.some((address) => walletAddresses.has(address));
        const ownedAsset = asset ? isAssetOwnedByWallet(asset) : false;
        const canAccept = !ownOffer && ownedAsset;
        const canPlace = !ownedAsset && !ownOffer;
        const showAcceptPanel = state.acceptingOfferId === offer.offerId;
        const displayAddress = offer?.buyerOrdinalsAddress || offer?.buyerAddress || '';
        const title = String(asset?.name || offer?.name || 'Inscription offer').trim();
        if (ownOffer) {
            return `
                <article class="item-offer-entry item-offer-entry--own">
                    <div class="item-offer-entry__top">
                        <div class="item-offer-entry__price-block">
                            <strong>${escapeHtml(formatBtc(offer?.priceSats || 0))}</strong>
                        </div>
                        <div class="item-offer-entry__actions">
                            <button class="icon-button icon-button--compact" type="button" data-cancel-offer="${escapeHtml(offer.offerId || '')}">Cancel offer</button>
                        </div>
                    </div>
                </article>
            `;
        }
        return `
            <article class="item-offer-entry">
                <div class="item-offer-entry__top">
                    <div class="item-offer-entry__price-block">
                        <strong>${escapeHtml(formatBtc(offer?.priceSats || 0))}</strong>
                    </div>
                    <div class="item-offer-entry__actions">
                        ${canPlace ? `<button class="icon-button icon-button--compact" type="button" data-place-item-offer="${escapeHtml(offer.inscriptionId || '')}">Place offer</button>` : ''}
                        ${canAccept ? `<button class="icon-button icon-button--compact" type="button" data-toggle-accept-offer="${escapeHtml(offer.offerId || '')}">${showAcceptPanel ? 'Close' : 'Accept offer'}</button>` : ''}
                    </div>
                </div>
                <div class="item-offer-entry__title">${escapeHtml(title)}</div>
                <div class="item-offer-entry__meta">
                    <button class="link-button" type="button" data-open-profile="${escapeHtml(displayAddress)}">${escapeHtml(shortAddress(displayAddress))}</button>
                    <span>${escapeHtml(formatRelativeAgeLabel(offer?.createdAt))}</span>
                </div>
                ${showAcceptPanel ? `
                    <div class="item-offer-entry__accept">
                        <button class="action-button primary" type="button" data-submit-accept-offer="${escapeHtml(offer.offerId || '')}">Confirm accept</button>
                    </div>
                ` : ''}
            </article>
        `;
    }).join('');
}

async function onItemOfferBodyClick(event) {
    const clearTargetButton = event.target.closest('[data-clear-offer-target]');
    if (clearTargetButton) {
        state.cardOfferAssetId = '';
        renderItemOfferPanel();
        return;
    }

    const inspectButton = event.target.closest('[data-open-inspect]');
    if (inspectButton) {
        const inscriptionId = String(inspectButton.dataset.openInspect || '').trim();
        if (inscriptionId) {
            void openInspect(inscriptionId);
        }
        return;
    }

    const profileButton = event.target.closest('[data-open-profile]');
    if (profileButton) {
        const address = String(profileButton.dataset.openProfile || '').trim();
        if (address) {
            void openProfile(address, false);
        }
        return;
    }

    const cancelButton = event.target.closest('[data-cancel-offer]');
    if (cancelButton) {
        const offerId = String(cancelButton.dataset.cancelOffer || '').trim();
        if (offerId) {
            await handleItemOfferCancel(offerId);
        }
        return;
    }

    const placeButton = event.target.closest('[data-place-item-offer]');
    if (placeButton) {
        const inscriptionId = String(placeButton.dataset.placeItemOffer || '').trim();
        if (inscriptionId) {
            openItemOfferFromPanel(inscriptionId);
        }
        return;
    }

    const acceptToggle = event.target.closest('[data-toggle-accept-offer]');
    if (acceptToggle) {
        const offerId = String(acceptToggle.dataset.toggleAcceptOffer || '').trim();
        if (offerId) {
            state.acceptingOfferId = state.acceptingOfferId === offerId ? '' : offerId;
            renderItemOfferPanel();
        }
        return;
    }

    const acceptSubmit = event.target.closest('[data-submit-accept-offer]');
    if (acceptSubmit) {
        const offerId = String(acceptSubmit.dataset.submitAcceptOffer || '').trim();
        if (!offerId) {
            return;
        }
        const offer = state.openOffers.find((entry) => String(entry?.offerId || '').trim() === offerId) || null;
        await handleOfferAccept(offerId, '', String(offer?.inscriptionId || '').trim(), offer);
    }
}

function getOfferPanelEntries() {
    const offers = Array.isArray(state.openOffers) ? state.openOffers.slice() : [];
    return offers
        .filter((offer) => String(offer?.status || 'open').trim().toLowerCase() === 'open')
        .filter((offer) => String(offer?.type || 'item').trim().toLowerCase() === 'item')
        .sort((left, right) => {
            const priceDelta = Number(right?.priceSats || 0) - Number(left?.priceSats || 0);
            if (priceDelta !== 0) {
                return priceDelta;
            }

            return compareIsoDatesDescending(left?.updatedAt || left?.createdAt || '', right?.updatedAt || right?.createdAt || '');
        })
        .slice(0, 24);
}

function openItemOfferFromPanel(inscriptionId) {
    const normalizedId = String(inscriptionId || '').trim();
    if (!normalizedId) {
        return;
    }

    state.cardListAssetId = '';
    state.cardOfferAssetId = normalizedId;

    if (normalizeAssetId(state.inspectId) === normalizeAssetId(normalizedId)) {
        renderInspectDrawer();
    } else {
        void openInspect(normalizedId);
    }

    window.requestAnimationFrame(() => {
        getItemOfferRefs().price?.focus();
    });
}

function toggleCollectionRail(event) {
    event?.preventDefault?.();
    event?.stopPropagation?.();
    state.collectionsCollapsed = !state.collectionsCollapsed;
    renderCollectionRailPanel();
}

function toggleSalesPanel(kind) {
    if (kind === 'record') {
        state.recordSalesCollapsed = !state.recordSalesCollapsed;
    } else if (kind === 'activity') {
        state.salesActivityCollapsed = !state.salesActivityCollapsed;
    } else {
        return;
    }

    renderSalesRail();
}

function onSalesRailClick(event) {
    const profileButton = event.target.closest('[data-open-profile]');
    if (profileButton) {
        event.stopPropagation();
        const address = String(profileButton.dataset.openProfile || '').trim();
        if (address) {
            void openProfile(address, false);
        }
        return;
    }

    const inspectRow = event.target.closest('[data-open-sales-inspect]');
    if (inspectRow) {
        const inscriptionId = String(inspectRow.dataset.openSalesInspect || '').trim();
        if (inscriptionId) {
            void openInspect(inscriptionId);
        }
        return;
    }

    const button = event.target.closest('[data-sales-panel-toggle]');
    if (!button) {
        return;
    }

    toggleSalesPanel(String(button.dataset.salesPanelToggle || '').trim());
}

function onSalesRailKeydown(event) {
    if (event.key !== 'Enter' && event.key !== ' ') {
        return;
    }

    const inspectRow = event.target.closest('[data-open-sales-inspect]');
    if (!inspectRow) {
        return;
    }

    event.preventDefault();
    const inscriptionId = String(inspectRow.dataset.openSalesInspect || '').trim();
    if (inscriptionId) {
        void openInspect(inscriptionId);
    }
}

function getSalesRailEmptyText(kind, hasSalesPayload) {
    if (state.loadingAssets) {
        return kind === 'record'
            ? 'Loading top sales...'
            : 'Loading sales activity...';
    }

    if (!hasSalesPayload) {
        return isLocalBoutiqueSalesCollection(state.activeCollectionId)
            ? 'Restart boutique backend to load local Blok Boutique sales data.'
            : 'Restart boutique backend to load BiS sales data.';
    }

    return kind === 'record'
        ? 'No record sales found.'
        : 'No recent sales found.';
}

async function loadBtcUsdQuote() {
    try {
        state.btcUsdQuote = await MARKETPLACE_API.getBtcUsdQuote();
        renderSalesRail();
    } catch {
        state.btcUsdQuote = null;
    }
}

function renderTraitFilters() {
    const traitTypes = Array.isArray(state.traitFilterData?.traitTypes) ? state.traitFilterData.traitTypes : [];
    const hasTraitFilters = traitTypes.length > 0;
    const activeTraitFilters = getActiveTraitFilters();
    const hasIdQuery = Boolean(normalizeSearchCollectionId(state.search));
    const filteredAssets = getFilteredAssets();

    refs.search.value = state.search;
    refs.search.disabled = state.loadingAssets || !state.activeCollection;

    refs.traitFilterWindow.hidden = !hasTraitFilters;
    refs.traitFilterWindow.dataset.collapsed = state.traitFilterExpanded ? 'false' : 'true';
    refs.traitFilterToggle.textContent = state.traitFilterExpanded ? 'Collapse' : 'Expand';
    refs.traitFilterToggle.setAttribute('aria-expanded', state.traitFilterExpanded ? 'true' : 'false');
    refs.traitFilterContent.hidden = !state.traitFilterExpanded;
    refs.traitFilterWindow.classList.toggle('is-collapsed', !state.traitFilterExpanded);

    if (!hasTraitFilters) {
        refs.traitFilterControls.innerHTML = '';
        refs.traitFilterStatus.textContent = '';
        refs.traitFilterStatus.classList.remove('is-error');
        return;
    }

    refs.traitFilterControls.innerHTML = traitTypes.map((traitType) => {
        const selectedValue = state.traitFilterSelections.get(traitType.key) || '';
        return `
            <label class="trait-filter-control">
                <span class="trait-filter-label">${escapeHtml(traitType.label)}</span>
                <select class="trait-filter-select" data-trait-type="${escapeHtml(traitType.key)}">
                    <option value="">Any (${formatCount(traitType.values.length)})</option>
                    ${traitType.values.map((traitValue) => `
                        <option value="${escapeHtml(traitValue.key)}" ${selectedValue === traitValue.key ? 'selected' : ''}>${escapeHtml(`${traitValue.label} (${formatCount(traitValue.count)})`)}</option>
                    `).join('')}
                </select>
            </label>
        `;
    }).join('');

    if (activeTraitFilters.length === 0 && !hasIdQuery) {
        refs.traitFilterStatus.textContent = '';
        refs.traitFilterStatus.classList.remove('is-error');
    } else {
        const activeLabels = [];
        if (activeTraitFilters.length > 0) {
            activeLabels.push(`${formatCount(activeTraitFilters.length)} trait filter${activeTraitFilters.length === 1 ? '' : 's'}`);
        }
        if (hasIdQuery) {
            activeLabels.push('Collection ID');
        }

        refs.traitFilterStatus.textContent = `Showing ${formatCount(filteredAssets.length)} of ${formatCount(state.assets.length)} items using ${activeLabels.join(' + ')}.`;
        refs.traitFilterStatus.classList.remove('is-error');
    }

    if (state.traitFilterExpanded) {
        scheduleTraitFilterCardWidthSync(refs.traitFilterWindow);
    }
}

function renderCollectionHeroVisual(collection) {
    const iconPath = getCollectionDisplayImagePath(collection);
    if (!iconPath) {
        return '';
    }

    const accent = escapeHtml(collection?.accentColor || '#f7931a');
    const title = escapeHtml(`${collection?.name || 'Collection'} icon`);

    return `
        <div class="summary-visual summary-visual--icon" style="--collection-accent:${accent}">
            <img src="${escapeHtml(iconPath)}" alt="${title}">
        </div>
    `;
}

function getCollectionDisplayImagePath(collection) {
    if (!collection) {
        return '';
    }

    const imagePath = String(collection.imagePath || '').trim();
    if (imagePath) {
        return imagePath;
    }

    const previewType = String(collection.previewType || '').trim().toLowerCase();
    const previewPath = String(collection.previewPath || '').trim();
    if (previewType !== 'iframe' && previewPath) {
        return previewPath;
    }

    return String(collection.iconPath || '').trim();
}

function renderCollectionStatsWindow(collection, options = {}) {
    const inline = Boolean(options.inline);
    const windowClasses = ['collection-stats-window', 'collection-stats-window--boutique'];
    if (inline) {
        windowClasses.push('collection-stats-window--inline');
    }

    const snapshotPayload = window.COLLECTION_STATS_DATA;
    const collectionSnapshots = snapshotPayload && typeof snapshotPayload.collections === 'object'
        ? snapshotPayload.collections
        : null;
    const generatedAt = snapshotPayload && typeof snapshotPayload.generatedAt === 'string'
        ? snapshotPayload.generatedAt
        : '';
    const collectionId = String(collection?.id || '').trim().toLowerCase();
    const isLocalArtDropsStats = isLocalBoutiqueSalesCollection(collectionId);
    const liveBoutiqueSnapshot = buildCollectionStatsFallbackSnapshot(collection);
    const snapshot = isLocalArtDropsStats
        ? liveBoutiqueSnapshot
        : (collectionSnapshots?.[collectionId] || liveBoutiqueSnapshot);
    const hasAutomatedSnapshot = !isLocalArtDropsStats && Boolean(collectionSnapshots?.[collectionId]);

    if (!snapshot) {
        return `
            <section class="${windowClasses.join(' ')}" data-collection-symbol="${escapeHtml(collection?.id || '')}" aria-live="polite">
                <div class="collection-stats-grid">
                    ${['Floor Price', '24h Volume', 'Total Volume', 'Listed', 'Owners', 'Supply'].map((label) => `
                        <article class="collection-stat">
                            <span class="collection-stat-label">${escapeHtml(label)}</span>
                            <strong class="collection-stat-value">--</strong>
                        </article>
                    `).join('')}
                </div>
                <div class="collection-stats-footer">
                    <p class="collection-stats-updated">Collection stats unavailable.</p>
                    <p class="collection-stats-status">No automated snapshot was found for this collection.</p>
                </div>
            </section>
        `;
    }

    const updatedAt = snapshot.updatedAt || generatedAt || '';
    const boutiqueVolume24hBtc = isLocalArtDropsStats ? satsToBtcValue(collection?.boutiqueSales24hSats) : null;
    const boutiqueTotalVolumeBtc = isLocalArtDropsStats ? satsToBtcValue(collection?.boutiqueSalesTotalSats) : null;
    const resolvedSupply = isLocalArtDropsStats && Number(collection?.assetCount || 0) > 0
        ? Number(collection.assetCount)
        : snapshot.totalSupply;
    const resolvedOwners = isLocalArtDropsStats && Number(collection?.ownerCount || 0) > 0
        ? Number(collection.ownerCount)
        : snapshot.ownerCount;
    const resolvedVolume24h = isLocalArtDropsStats
        ? boutiqueVolume24hBtc
        : addNullableBtc(snapshot.volume24h, boutiqueVolume24hBtc);
    const resolvedTotalVolume = isLocalArtDropsStats
        ? boutiqueTotalVolumeBtc
        : addNullableBtc(snapshot.totalVolume, boutiqueTotalVolumeBtc);
    const updatedText = isLocalArtDropsStats
        ? 'Updated locally from Blok Boutique'
        : (
            hasAutomatedSnapshot
                ? (updatedAt ? `Updated ${formatCollectionStatsTimestamp(updatedAt)} from Best in Slot API` : 'Best in Slot API snapshot loaded')
                : 'Boutique live fallback'
        );
    const statusText = isLocalArtDropsStats
        ? ''
        : (hasAutomatedSnapshot ? '' : 'Awaiting the latest Best in Slot snapshot. Showing live boutique stats where available.');

    return `
        <section class="${windowClasses.join(' ')}" data-collection-symbol="${escapeHtml(collection?.id || '')}" data-collection-name="${escapeHtml(collection?.name || '')}" aria-live="polite">
            <div class="collection-stats-grid">
                <article class="collection-stat">
                    <span class="collection-stat-label">Floor Price</span>
                    <strong class="collection-stat-value">${escapeHtml(formatCollectionStatBtc(snapshot.floorPrice, { zeroAsEmpty: true, fractionDigits: 4 }))}</strong>
                </article>
                <article class="collection-stat">
                    <span class="collection-stat-label">24h Volume</span>
                    <strong class="collection-stat-value">${escapeHtml(formatCollectionStatBtc(resolvedVolume24h, { zeroAsEmpty: true, fractionDigits: 4 }))}</strong>
                </article>
                <article class="collection-stat">
                    <span class="collection-stat-label">Total Volume</span>
                    <strong class="collection-stat-value">${escapeHtml(formatCollectionStatBtc(resolvedTotalVolume))}</strong>
                </article>
                <article class="collection-stat">
                    <span class="collection-stat-label">Listed</span>
                    <strong class="collection-stat-value">${escapeHtml(formatCollectionStatCount(snapshot.listedCount))}</strong>
                </article>
                <article class="collection-stat">
                    <span class="collection-stat-label">Owners</span>
                    <strong class="collection-stat-value">${escapeHtml(formatCollectionStatCount(resolvedOwners))}</strong>
                </article>
                <article class="collection-stat">
                    <span class="collection-stat-label">Supply</span>
                    <strong class="collection-stat-value">${escapeHtml(formatCollectionStatCount(resolvedSupply))}</strong>
                </article>
            </div>
            <div class="collection-stats-footer">
                <p class="collection-stats-updated">${escapeHtml(updatedText)}</p>
                ${statusText ? `<p class="collection-stats-status">${escapeHtml(statusText)}</p>` : ''}
            </div>
        </section>
    `;
}

function renderCollectionSalesChartShell(collection) {
    if (!refs.collectionSalesChartShell) {
        return;
    }

    const collectionId = normalizeCollectionIdValue(collection?.id || '');
    if (!SALES_HISTORY_CHART_COLLECTION_IDS.has(collectionId)) {
        refs.collectionSalesChartShell.innerHTML = '';
        refs.collectionSalesChartShell.hidden = true;
        return;
    }

    refs.collectionSalesChartShell.hidden = false;
    refs.collectionSalesChartShell.innerHTML = `
        <section
            class="sales-history-chart-window"
            data-collection-symbol="${escapeHtml(collectionId)}"
            data-collection-name="${escapeHtml(collection?.name || 'Collection')}"
        ></section>
    `;

    window.requestAnimationFrame(() => {
        window.dispatchEvent(new CustomEvent('boutique:sales-chart-render', {
            detail: { collectionId }
        }));
    });
}

async function ensureActiveCollectionOwnerCount() {
    const collectionId = String(state.activeCollectionId || '').trim().toLowerCase();
    if (!isLocalBoutiqueSalesCollection(collectionId) || !state.activeCollection) {
        return;
    }

    if (Number(state.activeCollection.ownerCount || 0) > 0) {
        return;
    }

    const assets = Array.isArray(state.assets) ? state.assets.slice() : [];
    if (!assets.length) {
        return;
    }

    const ownerAddresses = await Promise.all(assets.map(async (asset) => {
        if (!asset?.id) {
            return '';
        }

        let details = getAssetDetailsById(asset.id);
        if (!details) {
            try {
                details = await MARKETPLACE_API.getInscriptionDetails(asset.id);
                if (details) {
                    setAssetDetailsCache(asset.id, details);
                }
            } catch {
                return '';
            }
        }

        return normalizeWalletAddress(details?.ownerAddress);
    }));

    const ownerCount = new Set(ownerAddresses.filter(Boolean)).size;
    if (ownerCount > 0) {
        state.activeCollection.ownerCount = ownerCount;
        state.collections = state.collections.map((entry) => (
            entry.id === state.activeCollectionId
                ? { ...entry, ownerCount }
                : entry
        ));
    }
}

async function ensureWalletOwnershipDetailsForLoadedAssets() {
    if (!state.wallet || !Array.isArray(state.assets) || state.assets.length === 0) {
        return;
    }

    const targets = state.assets
        .filter((asset) => asset?.id)
        .filter((asset) => !getAssetDetailsById(asset.id))
        .slice(0, 24);

    if (targets.length === 0) {
        return;
    }

    await Promise.all(targets.map(async (asset) => {
        try {
            const details = await MARKETPLACE_API.getInscriptionDetails(asset.id);
            if (details) {
                setAssetDetailsCache(asset.id, details);
            }
        } catch {
            // Ignore ownership detail hydration failures.
        }
    }));
}

function satsToBtcValue(value) {
    const normalized = Number(value || 0);
    return Number.isFinite(normalized) && normalized > 0 ? normalized / 100000000 : null;
}

function isLocalBoutiqueSalesCollection(collectionId) {
    return String(collectionId || '').trim().toLowerCase() === 'art-drops';
}

function addNullableBtc(baseValue, addValue) {
    const normalizedBase = Number(baseValue);
    const normalizedAdd = Number(addValue);
    const hasBase = Number.isFinite(normalizedBase) && normalizedBase > 0;
    const hasAdd = Number.isFinite(normalizedAdd) && normalizedAdd > 0;
    if (!hasBase && !hasAdd) {
        return null;
    }

    return (hasBase ? normalizedBase : 0) + (hasAdd ? normalizedAdd : 0);
}

function normalizeWalletAddress(value) {
    return String(value || '').trim().toLowerCase();
}

function buildCollectionStatsFallbackSnapshot(collection) {
    if (!collection || typeof collection !== 'object') {
        return null;
    }

    const floorPriceSats = Number(collection.floorPriceSats || 0);
    const listedCount = Number(collection.activeListingCount || 0);
    const totalSupply = Number(collection.assetCount || 0);

    if (!floorPriceSats && !listedCount && !totalSupply) {
        return null;
    }

    return {
        name: String(collection.name || '').trim(),
        source: 'Boutique live fallback',
        updatedAt: '',
        floorPrice: floorPriceSats > 0 ? floorPriceSats / 100000000 : null,
        volume24h: null,
        totalVolume: null,
        listedCount: listedCount > 0 ? listedCount : 0,
        ownerCount: null,
        totalSupply: totalSupply > 0 ? totalSupply : null
    };
}

function sortCollectionsForDisplay(collections) {
    const orderMap = new Map(COLLECTION_DISPLAY_ORDER.map((id, index) => [id, index]));

    return (Array.isArray(collections) ? collections : [])
        .slice()
        .sort((left, right) => {
            const leftIndex = orderMap.has(left?.id) ? orderMap.get(left.id) : Number.MAX_SAFE_INTEGER;
            const rightIndex = orderMap.has(right?.id) ? orderMap.get(right.id) : Number.MAX_SAFE_INTEGER;
            if (leftIndex !== rightIndex) {
                return leftIndex - rightIndex;
            }

            return String(left?.name || '').localeCompare(String(right?.name || ''));
        });
}

function renderGrid() {
    const visible = getVisibleAssets();
    const hasIdQuery = Boolean(normalizeSearchCollectionId(state.search));
    refs.assetGrid.dataset.collectionIdSearch = hasIdQuery ? 'true' : 'false';
    refs.loadMore.hidden = visible.visible.length >= visible.total;

    if (state.loadingAssets) {
        refs.assetGrid.innerHTML = '<p class="empty-state">Loading collection...</p>';
        return;
    }

    refs.assetGrid.innerHTML = visible.visible.map((asset) => renderAssetCard(asset)).join('') || '<p class="empty-state">No inscriptions match this view.</p>';
    hydrateDeferredFixedIframes(refs.assetGrid);
    scheduleAssetCardWidthSync();
    if (visible.visible.length) {
        void prefetchVisibleCardDetails(visible.visible);
    }
}

function renderInspectDrawer() {
    const asset = resolveInspectAsset();
    refs.drawer.dataset.open = asset ? 'true' : 'false';
    refs.body.dataset.drawer = asset ? 'true' : 'false';

    if (!asset) {
        refs.drawerContent.innerHTML = '<p class="empty-state">Select an inscription to inspect.</p>';
        return;
    }

    try {
        const details = safelyResolve(() => getAssetDetailsById(asset.id), null);
        const listingEntry = safelyResolve(() => getListingByAssetId(asset.id), null);
        const owned = safelyResolve(() => isAssetOwnedByWallet(asset), false);
        const walletAddress = safelyResolve(() => state.wallet ? resolveProfileAddress(state.wallet) : '', '');
        const resolvedSalesHistory = safelyResolve(() => getResolvedSalesHistoryForAsset(asset), []);
        const previousSale = safelyResolve(() => asset.previousSale || getPreviousSaleRecord(resolvedSalesHistory), null);
        const mediaMarkup = safelyResolve(() => renderAssetMediaMarkup(asset, {
            className: 'inspect-media__content',
            alt: asset.name,
            loading: 'eager'
        }), '');
        const metaRows = [
            safelyResolve(() => renderMetaRow('Inscription', details?.inscriptionNumber ? `#${details.inscriptionNumber}` : 'Pending'), ''),
            safelyResolve(() => renderMetaRow(renderOrdMetaLabel('Inscription ID'), renderInscriptionLink(asset.id), true, true), ''),
            safelyResolve(() => renderMetaRow('Type', formatInspectContentType(asset, details?.contentType)), ''),
            safelyResolve(() => renderCollectionParentMetaRow(asset), ''),
            safelyResolve(() => renderCollectionGalleryMetaRow(asset), ''),
            safelyResolve(() => renderMetaRow('Size', details?.contentLengthBytes ? formatKilobytes(details.contentLengthBytes) : 'Unknown'), ''),
            safelyResolve(() => renderMetaRow('Date', details?.createdTimestamp ? formatDateTime(details.createdTimestamp) : 'Unknown'), ''),
            safelyResolve(() => renderMetaRow('Owner', `<button class="link-button" data-open-profile="${escapeHtml(details?.ownerAddress || '')}">${escapeHtml(shortAddress(details?.ownerAddress || ''))}</button>`, true), ''),
            safelyResolve(() => renderMetaRow('Sat', details?.satNumber || 'Unknown'), ''),
            safelyResolve(() => renderMetaRow('Last sale', previousSale ? formatPreviousSaleBtc(previousSale.priceSats) : 'None'), ''),
            safelyResolve(() => renderMetaRow('Top offer', asset.topOffer ? formatBtc(asset.topOffer.priceSats) : 'None'), '')
        ].filter(Boolean).join('');
        const satributesMarkup = safelyResolve(() => renderSatributes(details?.satributes), '');
        const traitsMarkup = safelyResolve(() => renderTraits(asset.traits), '');
        const salesHistoryMarkup = safelyResolve(() => renderSalesHistory(resolvedSalesHistory), '');
        const actionControls = [];
        const actionDisabledAttr = state.walletActionBusy ? ' disabled' : '';

        if (owned && !listingEntry) {
            actionControls.push(`
                <label class="field"><span>List price (btc)</span><input id="inspect-list-price" type="number" min="0" step="0.00000001" placeholder="0.00250000"></label>
                <button class="action-button primary" data-action="list-asset" data-inscription-id="${escapeHtml(asset.id)}"${actionDisabledAttr}>List now</button>
            `);
        }

        if (owned && listingEntry && listingEntry.sellerAddress === walletAddress) {
            actionControls.push(`
                <button class="action-button" data-action="delist-asset" data-inscription-id="${escapeHtml(asset.id)}"${actionDisabledAttr}>Delist</button>
            `);
        }

        if (listingEntry && !owned) {
            actionControls.push(`
                <div class="panel-header panel-header--compact">
                    <strong>Buy now</strong>
                </div>
                <label class="field">
                    <span>Network fee (sat/vb)</span>
                    <input id="inspect-buy-custom-fee" type="number" min="1" step="1" placeholder="5">
                </label>
                <button class="action-button primary" data-action="buy-asset" data-inscription-id="${escapeHtml(asset.id)}"${actionDisabledAttr}>Buy now</button>
            `);
        }

        const actionWellMarkup = actionControls.length
            ? `<div class="action-well">${actionControls.join('')}</div>`
            : '';

        refs.drawerContent.innerHTML = `
            <div class="inspect-media">
                ${mediaMarkup}
            </div>
            <div class="inspect-head">
                <div>
                    <span class="eyebrow">${escapeHtml(asset.collectionName || '')}</span>
                    <h3>${escapeHtml(asset.name)}</h3>
                </div>
                <span class="chip">${asset.listing ? formatListedBtc(asset.listing.priceSats) : 'Unlisted'}</span>
            </div>
            <div class="inspect-meta-grid">${metaRows}</div>
            ${satributesMarkup}
            ${traitsMarkup}
            ${salesHistoryMarkup}
            ${actionWellMarkup}
            ${renderInspectOfferPanel(asset)}
        `;
    } catch {
        refs.drawerContent.innerHTML = `
            <div class="inspect-media">
                ${renderAssetMediaMarkup(asset, {
                    className: 'inspect-media__content',
                    alt: asset.name,
                    loading: 'eager'
                })}
            </div>
            <div class="inspect-head">
                <div>
                    <span class="eyebrow">${escapeHtml(asset.collectionName || '')}</span>
                    <h3>${escapeHtml(asset.name)}</h3>
                </div>
                <span class="chip">${asset.listing ? formatListedBtc(asset.listing.priceSats) : 'Unlisted'}</span>
            </div>
            <div class="inspect-meta-grid">
                ${renderMetaRow(renderOrdMetaLabel('Inscription ID'), renderInscriptionLink(asset.id), true, true)}
            </div>
            ${renderInspectOfferPanel(asset)}
        `;
    }

    syncInspectLayout();
    renderItemOfferPanel();
    const offerRefs = getItemOfferRefs();
    offerRefs.button?.addEventListener('click', () => void handleItemOffer());
    offerRefs.body?.addEventListener('click', onItemOfferBodyClick);

    refs.drawerContent.querySelectorAll('[data-open-profile]').forEach((node) => {
        node.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();
            const address = String(node.dataset.openProfile || '').trim();
            if (address) {
                void openProfile(address, false);
            }
        });
    });
    refs.drawerContent.querySelectorAll('[data-download-asset]').forEach((node) => {
        node.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();
            void handleInspectDownload(String(node.dataset.downloadAsset || '').trim(), node);
        });
    });
    refs.drawerContent.querySelectorAll('[data-action]').forEach((node) => {
        node.addEventListener('click', () => void handleDrawerAction(String(node.dataset.action || '').trim(), String(node.dataset.inscriptionId || '').trim()));
    });

    window.requestAnimationFrame(syncInspectLayout);
}

function safelyResolve(getter, fallback) {
    try {
        const value = getter();
        return value === undefined ? fallback : value;
    } catch {
        return fallback;
    }
}

function formatInspectContentType(asset, contentType) {
    const rawType = String(contentType || '').trim();
    if (!rawType) {
        return 'Unknown';
    }

    const normalizedCollectionId = normalizeCollectionIdValue(asset?.collectionId || '');
    if (
        (normalizedCollectionId === 'blok-boyz' || normalizedCollectionId === 'blok-space')
        && rawType.toLowerCase().startsWith('text/html')
    ) {
        return 'text/html';
    }

    const simplifiedType = rawType.split(';')[0]?.trim();
    return simplifiedType || rawType;
}

function renderCollectionParentMetaRow(asset) {
    const collectionId = normalizeCollectionIdValue(asset?.collectionId || '');
    const inscriptionId = COLLECTION_PARENT_INSCRIPTIONS[collectionId];
    if (!inscriptionId) {
        return '';
    }

    return renderMetaRow('Parent', renderInscriptionLink(inscriptionId), true);
}

function renderCollectionGalleryMetaRow(asset) {
    const collectionId = normalizeCollectionIdValue(asset?.collectionId || '');
    const inscriptionId = COLLECTION_GALLERY_PARENT_INSCRIPTIONS[collectionId];
    if (!inscriptionId) {
        return '';
    }

    return renderMetaRow('Gallery', renderInscriptionLink(inscriptionId), true);
}

function renderInscriptionLink(inscriptionId) {
    const normalizedId = String(inscriptionId || '').trim();
    if (!normalizedId) {
        return 'Unknown';
    }

    return `<a class="link-button" href="${escapeHtml(getOrdinalsInscriptionUrl(normalizedId))}" target="_blank" rel="noreferrer" title="${escapeHtml(normalizedId)}">${escapeHtml(shortLinkedInscriptionId(normalizedId))}</a>`;
}

function getOrdinalsInscriptionUrl(inscriptionId) {
    return `https://ordinals.com/inscription/${encodeURIComponent(String(inscriptionId || '').trim())}`;
}

function renderProfilePanel() {
    refs.profilePanel.dataset.open = state.profileOpen ? 'true' : 'false';
    if (!state.profileOpen) {
        return;
    }

    if (state.profileLoading || !state.profileView) {
        refs.profileContent.innerHTML = '<p class="empty-state">Loading profile...</p>';
        return;
    }

    const isOwnProfile = Boolean(state.wallet && resolveProfileAddress(state.wallet) === state.profileAddress);
    const profile = state.profileView.profile || {};
    const holdings = Array.isArray(state.profileView.holdings) ? state.profileView.holdings : [];
    const selectedAvatarHoldingId = resolveSelectedProfileAvatarHoldingId(profile, holdings);
    const selectedAvatarHolding = holdings.find((holding) => holding.id === selectedAvatarHoldingId) || null;
    const selectedAvatarDisplayAsset = selectedAvatarHolding ? getProfileHoldingDisplayAsset(selectedAvatarHolding) : null;
    const selectedAvatarSrc = selectedAvatarHolding
        ? getProfileAvatarSrc(selectedAvatarDisplayAsset)
        : String(profile.avatarUrl || '').trim();
    refs.profileContent.innerHTML = `
        <div class="profile-head">
            <div class="profile-avatar">${selectedAvatarSrc ? `<img src="${escapeHtml(selectedAvatarSrc)}" alt="">` : `<span>${escapeHtml((profile.username || shortAddress(state.profileAddress)).slice(0, 2).toUpperCase())}</span>`}</div>
            <div class="profile-head__meta">
                <h3>${escapeHtml(profile.username || shortAddress(state.profileAddress))}</h3>
                <button class="profile-address-button" type="button" data-copy-profile-address="${escapeHtml(state.profileAddress)}">${escapeHtml(state.profileAddress)}</button>
                ${state.profileAddressCopied ? '<span class="profile-copy-toast" role="status" aria-live="polite">Copied</span>' : ''}
            </div>
        </div>
        ${profile.bio ? `<p class="profile-bio">${escapeHtml(profile.bio)}</p>` : ''}
        ${profile.socialUrl ? `<p><a class="link-button profile-social-link" href="${escapeHtml(profile.socialUrl)}" target="_blank" rel="noreferrer">${escapeHtml(profile.socialUrl)}</a></p>` : ''}
        ${isOwnProfile ? renderProfileEditor(profile, holdings, selectedAvatarHoldingId) : ''}
        <div class="profile-holdings">
            <div class="panel-header">
                <strong>Tracked holdings (${formatCount(holdings.length)})</strong>
                ${isOwnProfile ? '<span>Avatar selection</span>' : ''}
            </div>
            ${holdings.slice(0, 24).map((holding) => {
                const displayHolding = getProfileHoldingDisplayAsset(holding);
                return `
                <button class="mini-holding${isOwnProfile && holding.id === selectedAvatarHoldingId ? ' is-avatar-selected' : ''}" ${isOwnProfile ? `data-select-avatar="${escapeHtml(holding.id)}"` : `data-open-inspect="${escapeHtml(holding.id)}"`}>
                    ${renderAssetMediaMarkup(displayHolding, {
                        className: 'mini-holding__media',
                        alt: holding.name,
                        decorative: getAssetMediaType(displayHolding) === 'iframe'
                    })}
                    <span class="mini-holding__text">
                        <span class="mini-holding__name">${escapeHtml(holding.name)}</span>
                        ${isOwnProfile ? `<span class="mini-holding__hint">${holding.id === selectedAvatarHoldingId ? 'Avatar selected' : 'Use as avatar'}</span>` : ''}
                    </span>
                </button>
            `;
            }).join('') || '<p class="empty-state compact">No tracked holdings.</p>'}
        </div>
    `;

    refs.profileContent.querySelectorAll('[data-open-inspect]').forEach((node) => {
        node.addEventListener('click', () => void openInspect(String(node.dataset.openInspect || '').trim()));
    });
    refs.profileContent.querySelectorAll('[data-copy-profile-address]').forEach((node) => {
        node.addEventListener('click', () => void handleProfileAddressCopy(String(node.dataset.copyProfileAddress || '').trim()));
    });
    refs.profileContent.querySelectorAll('[data-select-avatar]').forEach((node) => {
        node.addEventListener('click', () => {
            state.profileAvatarAssetId = String(node.dataset.selectAvatar || '').trim();
            renderProfilePanel();
        });
    });

    const form = refs.profileContent.querySelector('#profile-editor');
    if (form) {
        form.addEventListener('submit', (event) => {
            event.preventDefault();
            void handleProfileSave(new FormData(form));
        });
    }
}

function onCollectionClick(event) {
    const button = event.target.closest('[data-collection-id]');
    if (!button) return;
    const collectionId = String(button.dataset.collectionId || '').trim();
    if (!collectionId || collectionId === state.activeCollectionId) return;

    state.activeCollectionId = collectionId;
    state.activeCollection = state.collections.find((entry) => entry.id === collectionId) || null;
    state.cardOfferAssetId = '';
    state.search = '';
    state.traitFilterExpanded = false;
    state.traitFilterSelections = new Map();
    closeInspect();
    void loadActiveCollectionAssets();
    render();
}

function onTraitFilterChange(event) {
    const select = event.target.closest('[data-trait-type]');
    if (!select) {
        return;
    }

    const traitTypeKey = normalizeTraitValue(select.dataset.traitType || '');
    const traitValueKey = normalizeTraitValue(select.value || '');
    if (!traitTypeKey) {
        return;
    }

    if (traitValueKey) {
        state.traitFilterSelections.set(traitTypeKey, traitValueKey);
        state.traitFilterExpanded = true;
    } else {
        state.traitFilterSelections.delete(traitTypeKey);
    }

    state.visibleCount = INITIAL_RENDER_COUNT;
    renderTraitFilters();
    renderGrid();
}

function onAssetGridClick(event) {
    const downloadButton = event.target.closest('[data-download-asset]');
    if (downloadButton) {
        const inscriptionId = String(downloadButton.dataset.downloadAsset || '').trim();
        void handleCardDownload(inscriptionId, downloadButton.closest('.asset-card'), downloadButton);
        return;
    }

    const buyButton = event.target.closest('[data-buy-card]');
    if (buyButton) {
        const inscriptionId = String(buyButton.dataset.buyCard || '').trim();
        void handleCardBuy(inscriptionId);
        return;
    }

    const listToggle = event.target.closest('[data-toggle-list]');
    if (listToggle) {
        const inscriptionId = String(listToggle.dataset.toggleList || '').trim();
        if (!inscriptionId) {
            return;
        }

        state.cardOfferAssetId = '';
        state.cardListAssetId = state.cardListAssetId === inscriptionId ? '' : inscriptionId;
        renderGrid();
        return;
    }

    const listSubmit = event.target.closest('[data-submit-list]');
    if (listSubmit) {
        const inscriptionId = String(listSubmit.dataset.submitList || '').trim();
        void handleCardList(inscriptionId, listSubmit.closest('.asset-card'));
        return;
    }

    const delistButton = event.target.closest('[data-delist-card]');
    if (delistButton) {
        const inscriptionId = String(delistButton.dataset.delistCard || '').trim();
        void handleCardDelist(inscriptionId);
        return;
    }

    const offerToggle = event.target.closest('[data-toggle-offer]');
    if (offerToggle) {
        const inscriptionId = String(offerToggle.dataset.toggleOffer || '').trim();
        if (!inscriptionId) {
            return;
        }

        state.cardListAssetId = '';
        state.cardOfferAssetId = state.cardOfferAssetId === inscriptionId ? '' : inscriptionId;
        renderGrid();
        return;
    }

    const offerSubmit = event.target.closest('[data-submit-offer]');
    if (offerSubmit) {
        const inscriptionId = String(offerSubmit.dataset.submitOffer || '').trim();
        void handleCardOffer(inscriptionId, offerSubmit.closest('.asset-card'));
        return;
    }

    const inspectButton = event.target.closest('[data-open-inspect]');
    if (inspectButton) {
        void openInspect(String(inspectButton.dataset.openInspect || '').trim());
        return;
    }

    const card = event.target.closest('.asset-card');
    if (card) {
        const inscriptionId = String(card.dataset.assetId || '').trim();
        if (inscriptionId) {
            void openInspect(inscriptionId);
        }
        return;
    }

    const profileButton = event.target.closest('[data-open-profile]');
    if (profileButton) {
        void openProfile(String(profileButton.dataset.openProfile || '').trim(), false);
    }
}

function onWalletButtonClick(event) {
    event.preventDefault();
    if (state.walletBusy || state.walletActionBusy) {
        return;
    }

    state.walletMenuOpen = !state.walletMenuOpen;
    if (!state.walletMenuOpen) {
        state.walletAddressCopied = false;
    }
    renderWallet();
}

async function onWalletCopyClick() {
    const address = resolveOrdinalsAddress(state.wallet);
    if (!address) {
        return;
    }

    try {
        await copyTextToClipboard(address);
        window.clearTimeout(walletCopyResetTimer);
        state.walletAddressCopied = true;
        renderWallet();
        walletCopyResetTimer = window.setTimeout(() => {
            state.walletAddressCopied = false;
            renderWallet();
        }, 1600);
    } catch {
        setMessage('Unable to copy wallet address.', 'error');
    }
}

async function handleProfileAddressCopy(address) {
    const value = String(address || '').trim();
    if (!value) {
        return;
    }

    try {
        await copyTextToClipboard(value);
        window.clearTimeout(profileCopyResetTimer);
        state.profileAddressCopied = true;
        renderProfilePanel();
        profileCopyResetTimer = window.setTimeout(() => {
            state.profileAddressCopied = false;
            if (state.profileOpen) {
                renderProfilePanel();
            }
        }, 1400);
    } catch {
        setMessage('Unable to copy profile address.', 'error');
    }
}

function onWalletDisconnectClick() {
    localStorage.removeItem(WALLET_PROVIDER_KEY);
    walletHydrationSequence += 1;
    window.clearTimeout(walletCopyResetTimer);
    state.wallet = null;
    state.walletBusy = false;
    state.walletHydrating = false;
    state.walletAddressCopied = false;
    closeWalletMenu();
    render();
    setMessage('Wallet disconnected.', 'muted');
}

function onDocumentClick(event) {
    if (!state.walletMenuOpen || isEventWithinWalletShell(event)) {
        return;
    }

    closeWalletMenu();
    renderWallet();
}

function onWindowKeydown(event) {
    if (event.key !== 'Escape') {
        return;
    }

    if (state.walletMenuOpen) {
        closeWalletMenu();
        renderWallet();
    }
    closeInspect();
    closeProfile();
}

function onWindowScroll() {
    if (state.walletMenuOpen) {
        queueWalletMenuPlacement();
    }
}

function onWindowViewportChange() {
    if (state.walletMenuOpen) {
        queueWalletMenuPlacement();
    }

    resetTopSummaryPanelSizing();
    syncAssetCardWidths();
    syncCollectionStatsWidth();

    if (state.traitFilterExpanded && refs.traitFilterWindow && !refs.traitFilterWindow.hidden) {
        scheduleTraitFilterCardWidthSync(refs.traitFilterWindow);
    }

    if (state.inspectId) {
        window.requestAnimationFrame(syncInspectLayout);
    }
}

function resetTopSummaryPanelSizing() {
    refs.summaryHeroPanel?.style.removeProperty('min-height');
    refs.recordSalesPanel?.style.removeProperty('min-height');
}

function scheduleAssetCardWidthSync() {
    if (typeof window.requestAnimationFrame === 'function') {
        window.requestAnimationFrame(syncAssetCardWidths);
        return;
    }

    window.setTimeout(syncAssetCardWidths, 0);
}

function syncAssetCardWidths() {
    const grid = refs.assetGrid;
    const cards = Array.from(grid?.querySelectorAll('.asset-card') || []);
    cards.forEach((card) => {
        card.style.removeProperty('--asset-card-width');
    });
    syncFixedIframeViewports(grid);
}

function syncInspectLayout() {
    syncFixedIframeViewports(refs.drawerContent);
    syncInspectMetaWidths();
    syncInspectDrawerWidth();
}

function syncCollectionStatsWidth() {
    const grid = refs.activeCollectionMeta?.querySelector('.collection-stats-window--inline .collection-stats-grid');
    if (!grid) {
        return;
    }

    grid.style.removeProperty('--collection-stat-card-width');
    const cards = Array.from(grid.querySelectorAll('.collection-stat'));

    if (cards.length === 0) {
        return;
    }

    const availableWidth = Math.max(
        Math.floor(grid.parentElement?.clientWidth || refs.activeCollectionMeta?.clientWidth || 0),
        0
    );
    const gridStyle = window.getComputedStyle(grid);
    const gap = Math.max(
        parseFloat(gridStyle.columnGap || gridStyle.gap || '0') || 0,
        0
    );
    const targetWidths = cards.map((card) => {
        const cardStyle = window.getComputedStyle(card);
        const label = card.querySelector('.collection-stat-label');
        const value = card.querySelector('.collection-stat-value');
        const labelWidth = Math.ceil(label?.scrollWidth || label?.getBoundingClientRect().width || 0);
        const valueWidth = Math.ceil(value?.scrollWidth || value?.getBoundingClientRect().width || 0);
        const horizontalPadding = (
            parseFloat(cardStyle.paddingLeft || '0')
            + parseFloat(cardStyle.paddingRight || '0')
            + parseFloat(cardStyle.borderLeftWidth || '0')
            + parseFloat(cardStyle.borderRightWidth || '0')
        );
        return Math.ceil(Math.max(labelWidth, valueWidth) + horizontalPadding);
    });

    if (!targetWidths.some((width) => width > 0)) {
        return;
    }

    const isSmallScreen = window.matchMedia
        ? window.matchMedia('(max-width: 780px)').matches
        : window.innerWidth <= 780;
    const widestContentWidth = targetWidths.reduce((maxWidth, width) => Math.max(maxWidth, width), 0);

    if (isSmallScreen) {
        const columns = Math.min(2, cards.length);
        const resolvedWidth = availableWidth
            ? Math.max(Math.floor((availableWidth - (gap * Math.max(columns - 1, 0))) / Math.max(columns, 1)), 0)
            : widestContentWidth;

        grid.style.setProperty('--collection-stat-card-width', `${Math.max(resolvedWidth, 92)}px`);
        return;
    }

    const maxDesktopWidth = availableWidth
        ? Math.max(Math.floor((availableWidth - (gap * 2)) / 3), 0)
        : 210;
    const minimumWidth = Math.max(widestContentWidth, 92);
    const resolvedWidth = maxDesktopWidth
        ? clamp(210, minimumWidth, maxDesktopWidth)
        : Math.max(210, minimumWidth);

    grid.style.setProperty('--collection-stat-card-width', `${resolvedWidth}px`);
}

function syncInspectMetaWidths() {
    const content = refs.drawerContent;
    content?.style.removeProperty('--inspect-meta-card-width');
    content?.style.removeProperty('--inspect-meta-grid-width');

    const grid = content?.querySelector('.inspect-meta-grid');
    if (!grid) {
        return;
    }

    const cards = Array.from(grid.querySelectorAll('.meta-row'));
    if (cards.length === 0) {
        return;
    }

    const availableWidth = Math.max(Math.floor(grid.clientWidth), 0);
    if (!availableWidth) {
        return;
    }

    const widest = cards.reduce((maxWidth, card) => Math.max(maxWidth, Math.ceil(card.getBoundingClientRect().width)), 0);
    const targetWidth = clamp(widest, 168, availableWidth);
    const targetGridWidth = Math.min((targetWidth * 2) + 10, availableWidth);
    content.style.setProperty('--inspect-meta-card-width', `${targetWidth}px`);
    content.style.setProperty('--inspect-meta-grid-width', `${targetGridWidth}px`);
}

function syncInspectDrawerWidth() {
    if (!refs.drawer || !state.inspectId) {
        refs.drawer?.style.removeProperty('--inspect-drawer-width');
        refs.drawer?.style.removeProperty('--inspect-header-width');
        return;
    }

    const header = refs.drawer.querySelector('.inspect-drawer__header');
    const content = refs.drawerContent;
    const metaGrid = content?.querySelector('.inspect-meta-grid');
    if (!header || !content) {
        return;
    }

    refs.drawer.style.removeProperty('--inspect-drawer-width');
    refs.drawer.style.removeProperty('--inspect-header-width');

    const drawerStyles = window.getComputedStyle(refs.drawer);
    const headerStyles = window.getComputedStyle(header);
    const paddingX = parseFloat(drawerStyles.paddingLeft || '0') + parseFloat(drawerStyles.paddingRight || '0');
    const borderX = parseFloat(drawerStyles.borderLeftWidth || '0') + parseFloat(drawerStyles.borderRightWidth || '0');
    const headerGap = parseFloat(headerStyles.columnGap || headerStyles.gap || '0');
    const headerWidth = Array.from(header.children).reduce(
        (sum, child, index) => sum + Math.ceil(child.getBoundingClientRect().width || 0) + (index > 0 ? headerGap : 0),
        0
    );
    const widestSectionWidth = Array.from(content.children).reduce((maxWidth, child) => {
        if (!(child instanceof HTMLElement)) {
            return maxWidth;
        }

        const measuredWidth = Math.max(
            Math.ceil(child.getBoundingClientRect().width || 0),
            Math.ceil(child.scrollWidth || 0)
        );
        return Math.max(maxWidth, measuredWidth);
    }, 0);
    const metaGridWidth = metaGrid
        ? Math.ceil(metaGrid.scrollWidth || metaGrid.getBoundingClientRect().width || 0)
        : 0;
    const maxViewportWidth = Math.max(320, window.innerWidth - 24);
    const sectionWidth = clamp(
        Math.max(metaGridWidth, widestSectionWidth),
        0,
        Math.max(maxViewportWidth - paddingX - borderX, 0)
    );
    const contentBandWidth = Math.max(headerWidth, sectionWidth);
    const targetWidth = clamp(
        contentBandWidth + paddingX + borderX,
        Math.ceil(headerWidth + paddingX + borderX),
        maxViewportWidth
    );

    refs.drawer.style.setProperty('--inspect-header-width', `${contentBandWidth}px`);
    refs.drawer.style.setProperty('--inspect-drawer-width', `${targetWidth}px`);
}

function isEventWithinWalletShell(event) {
    if (!refs.walletShell) {
        return false;
    }

    const eventPath = typeof event.composedPath === 'function'
        ? event.composedPath()
        : [];
    if (eventPath.includes(refs.walletShell) || eventPath.includes(refs.walletMenu)) {
        return true;
    }

    if (!(event.target instanceof Node)) {
        return false;
    }

    return refs.walletShell.contains(event.target)
        || Boolean(refs.walletMenu && refs.walletMenu.contains(event.target));
}

function closeWalletMenu() {
    state.walletMenuOpen = false;
    state.walletAddressCopied = false;
    if (refs.walletMenu) {
        refs.walletMenu.style.left = '';
        refs.walletMenu.style.top = '';
        refs.walletMenu.style.maxHeight = '';
        refs.walletMenu.style.visibility = '';
    }
}

function queueWalletMenuPlacement() {
    if (!state.walletMenuOpen || !refs.walletShell || !refs.walletMenu) {
        return;
    }

    if (walletPlacementFrame && typeof window.cancelAnimationFrame === 'function') {
        window.cancelAnimationFrame(walletPlacementFrame);
    }

    walletPlacementFrame = typeof window.requestAnimationFrame === 'function'
        ? window.requestAnimationFrame(() => {
            walletPlacementFrame = 0;
            updateWalletMenuPlacement();
        })
        : 0;

    if (!walletPlacementFrame) {
        updateWalletMenuPlacement();
    }
}

function updateWalletMenuPlacement() {
    if (!state.walletMenuOpen || !refs.walletShell || !refs.walletMenu) {
        return;
    }

    const shellRect = refs.walletShell.getBoundingClientRect();
    const viewportWidth = window.innerWidth || document.documentElement.clientWidth || 0;
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 0;

    refs.walletMenu.style.visibility = 'hidden';
    refs.walletMenu.style.left = '0px';
    refs.walletMenu.style.top = '0px';
    refs.walletMenu.hidden = false;

    const dropdownRect = refs.walletMenu.getBoundingClientRect();
    const dropdownWidth = Math.ceil(dropdownRect.width || refs.walletMenu.offsetWidth || 230);
    const dropdownHeight = Math.ceil(refs.walletMenu.scrollHeight || dropdownRect.height || 0);
    const gap = 8;
    const minInset = 12;
    const availableBelow = viewportHeight - shellRect.bottom - gap - minInset;
    const availableAbove = shellRect.top - gap - minInset;
    const openAbove = availableBelow < Math.min(dropdownHeight, 220) && availableAbove > availableBelow;
    const maxHeight = Math.max(140, openAbove ? availableAbove : availableBelow);
    const idealLeft = shellRect.right - dropdownWidth;
    const left = clamp(idealLeft, minInset, Math.max(minInset, viewportWidth - dropdownWidth - minInset));
    const top = openAbove
        ? Math.max(minInset, shellRect.top - gap - Math.min(dropdownHeight, maxHeight))
        : Math.min(viewportHeight - Math.min(dropdownHeight, maxHeight) - minInset, shellRect.bottom + gap);

    refs.walletMenu.style.left = `${Math.round(left)}px`;
    refs.walletMenu.style.top = `${Math.round(top)}px`;
    refs.walletMenu.style.maxHeight = `${Math.floor(maxHeight)}px`;
    refs.walletMenu.style.visibility = '';
}

async function onWalletProviderClick(event) {
    const button = event.target.closest('[data-provider]');
    if (!button || button.disabled || state.walletBusy) {
        return;
    }

    const provider = String(button.dataset.provider || '').trim().toLowerCase();
    state.walletBusy = true;
    setMessage(`Connecting ${provider}...`, 'muted');
    renderWallet();

    try {
        state.wallet = await connectWallet(provider, { hydrateDetails: false });
        if (!state.wallet) {
            throw new Error(`No ${provider} account was returned by the wallet.`);
        }

        localStorage.setItem(WALLET_PROVIDER_KEY, provider);
        closeWalletMenu();
        setMessage(`${provider === 'xverse' ? 'Xverse' : 'UniSat'} connected. Syncing holdings...`, 'success');
        queueWalletHydration(provider, { silentMessage: true });
    } catch (error) {
        setMessage(formatWalletError(error), 'error');
    } finally {
        state.walletBusy = false;
        render();
    }
}

async function openInspect(inscriptionId) {
    const asset = resolveInspectAsset(inscriptionId) || buildMinimalInspectAsset(inscriptionId);
    if (!asset) {
        return;
    }

    const nextInspectId = normalizeAssetId(asset.id);
    state.inspectId = nextInspectId;
    state.inspectAsset = asset;
    state.cardOfferAssetId = nextInspectId;
    refs.body.dataset.overlay = 'true';
    renderInspectDrawer();

    if (!getAssetDetailsById(asset.id)) {
        try {
            const details = await loadAssetDetails(asset.id, { retries: 3 });
            if (details) {
                renderGrid();
            }
        } catch (error) {
            setMessage(formatError(error), 'error');
        }
    }

    renderInspectDrawer();
}

function closeInspect() {
    state.inspectId = '';
    state.inspectAsset = null;
    state.cardOfferAssetId = '';
    refs.drawer?.style.removeProperty('--inspect-drawer-width');
    refs.drawer?.style.removeProperty('--inspect-header-width');
    refs.drawerContent?.style.removeProperty('--inspect-meta-card-width');
    refs.drawerContent?.style.removeProperty('--inspect-meta-grid-width');
    if (!state.profileOpen) {
        refs.body.dataset.overlay = 'false';
    }
    renderInspectDrawer();
}

async function openProfile(address, ownProfile) {
    if (!address) return;

    const normalizedAddress = String(address || '').trim();
    const sequence = ++profileLoadSequence;
    const cachedProfile = state.profileCache.get(normalizedAddress);
    const localProfileCandidate = ownProfile ? buildLocalOwnProfileView(normalizedAddress) : null;
    const localProfileView = ownProfile
        ? null
        : (shouldUseLocalProfileView(localProfileCandidate) ? localProfileCandidate : null);
    state.profileOpen = true;
    state.profileLoading = !(localProfileView || cachedProfile);
    state.profileAddress = normalizedAddress;
    state.profileAvatarAssetId = '';
    state.profileAddressCopied = false;
    window.clearTimeout(profileCopyResetTimer);
    state.profileView = localProfileView || cachedProfile || null;
    refs.body.dataset.overlay = 'true';
    renderProfilePanel();

    if (ownProfile && state.wallet && !state.wallet.detailsHydrated && !state.walletHydrating) {
        queueWalletHydration(state.wallet.provider, { silentMessage: true });
    }

    try {
        if (ownProfile && state.wallet) {
            const [profile, portfolio] = await Promise.all([
                MARKETPLACE_API.getProfile(normalizedAddress),
                MARKETPLACE_API.getPortfolio(normalizedAddress).catch(() => null)
            ]);
            if (sequence !== profileLoadSequence || normalizedAddress !== state.profileAddress) {
                return;
            }
            const nextView = {
                ...(portfolio || cachedProfile || buildLocalOwnProfileView(normalizedAddress) || localProfileView || state.profileView || {
                    version: 1,
                    updatedAt: new Date().toISOString(),
                    address: normalizedAddress,
                    profile: createClientEmptyProfile(normalizedAddress),
                    holdings: [],
                    activeListings: [],
                    openOffers: [],
                    recentSales: []
                }),
                profile: profile || createClientEmptyProfile(normalizedAddress)
            };
            state.profileView = nextView;
            state.profileCache.set(normalizedAddress, nextView);
            state.profileLoading = false;
            renderProfilePanel();
            return;
        }

        const profileView = await MARKETPLACE_API.getPortfolio(normalizedAddress);
        if (sequence !== profileLoadSequence || normalizedAddress !== state.profileAddress) {
            return;
        }
        state.profileView = profileView;
        state.profileCache.set(normalizedAddress, profileView);
    } catch (error) {
        if (!cachedProfile) {
            setMessage(formatError(error), 'error');
        }
    } finally {
        if (sequence === profileLoadSequence && normalizedAddress === state.profileAddress) {
            state.profileLoading = false;
            renderProfilePanel();
        }
    }
}

function closeProfile() {
    state.profileOpen = false;
    state.profileAvatarAssetId = '';
    state.profileAddressCopied = false;
    window.clearTimeout(profileCopyResetTimer);
    if (!state.inspectId) {
        refs.body.dataset.overlay = 'false';
    }
    renderProfilePanel();
}

async function handleDrawerAction(action, inscriptionId) {
    const asset = getAssetById(inscriptionId);
    const listing = getListingByAssetId(inscriptionId);
    if (!asset) {
        setMessage('That inscription is no longer loaded. Refresh the collection and try again.', 'warning');
        return;
    }

    if (!state.wallet) {
        setMessage('Connect a wallet first.', 'warning');
        return;
    }

    await runExclusiveWalletAction(async () => {
        try {
            let mutationDescriptor = null;

            if (action === 'list-asset') {
                const priceSats = parseBtcInputToSats(document.getElementById('inspect-list-price')?.value || '');
                setMessage('Confirm listing in wallet...', 'muted');
                await listAssetForSale({
                    asset,
                    walletContext: state.wallet,
                    priceSats,
                    inscriptionDetails: getAssetDetailsById(asset.id)
                });
                mutationDescriptor = applyOptimisticListingPublished(asset, priceSats);
                setMessage('Listing published.', 'success');
            }

            if (action === 'delist-asset') {
                setMessage('Confirm delist in wallet...', 'muted');
                await delistAsset({
                    asset,
                    listing,
                    walletContext: state.wallet
                });
                mutationDescriptor = applyOptimisticListingRemoved(asset);
                setMessage('Listing removed.', 'success');
            }

            if (action === 'buy-asset') {
                const customFeeRate = parseCustomFeeRateInput(document.getElementById('inspect-buy-custom-fee')?.value || '');
                setMessage('Checking wallet for required dummy UTXOs...', 'muted');
                const purchase = await buyAssetNow({
                    listing,
                    walletContext: state.wallet,
                    feePreference: customFeeRate > 0 ? 'custom' : 'balanced',
                    customFeeRate,
                    onStatus: (status) => {
                        if (!status?.message) return;
                        setMessage(status.message, status.tone || 'muted');
                    }
                });
                setPurchaseBroadcastMessage(purchase?.txid);
            }

            if (mutationDescriptor) {
                queueRefreshAfterMutation({
                    mutation: mutationDescriptor,
                    refreshWallet: false
                });
                return;
            }

            await refreshAfterMutation();
        } catch (error) {
            setMessage(formatWalletError(error), 'error');
        }
    }, {
        busyMessage: 'A wallet request is already pending.'
    });
}

async function handleCardOffer(inscriptionId, card) {
    const asset = getAssetById(inscriptionId);
    if (!asset || !card) {
        return;
    }

    if (!state.wallet) {
        setMessage('Connect a wallet first.', 'warning');
        return;
    }

    try {
        const priceSats = parseBtcInputToSats(card.querySelector('[data-offer-price]')?.value || '');
        const customFeeRate = parseCustomFeeRateInput(card.querySelector('[data-offer-custom]')?.value || '');
        setMessage('Confirm offer in wallet...', 'muted');
        await submitAssetOffer({
            asset,
            priceSats,
            feePreference: customFeeRate > 0 ? 'custom' : 'balanced',
            customFeeRate
        });
        state.cardOfferAssetId = '';
        const mutationDescriptor = applyOptimisticItemOfferPlaced(asset, priceSats);
        setMessage('Offer placed.', 'success');
        queueRefreshAfterMutation({
            mutation: mutationDescriptor,
            refreshWallet: false
        });
    } catch (error) {
        setMessage(formatWalletError(error), 'error');
    }
}

async function handleCardList(inscriptionId, card) {
    const asset = getAssetById(inscriptionId);
    if (!asset || !card) {
        setMessage('That inscription is no longer available in the current view. Refresh and try again.', 'warning');
        return;
    }

    if (!state.wallet) {
        setMessage('Connect a wallet first.', 'warning');
        return;
    }

    try {
        const priceSats = parseBtcInputToSats(card.querySelector('[data-list-price]')?.value || '');
        setMessage('Confirm listing in wallet...', 'muted');
        await listAssetForSale({
            asset,
            walletContext: state.wallet,
            priceSats,
            inscriptionDetails: getAssetDetailsById(asset.id)
        });
        state.cardListAssetId = '';
        const mutationDescriptor = applyOptimisticListingPublished(asset, priceSats);
        setMessage('Listing published.', 'success');
        queueRefreshAfterMutation({
            mutation: mutationDescriptor,
            refreshWallet: false
        });
    } catch (error) {
        setMessage(formatWalletError(error), 'error');
    }
}

async function handleCardDelist(inscriptionId) {
    const asset = getAssetById(inscriptionId);
    const listing = getListingByAssetId(inscriptionId);
    if (!asset || !listing) {
        return;
    }

    if (!state.wallet) {
        setMessage('Connect a wallet first.', 'warning');
        return;
    }

    try {
        setMessage('Confirm delist in wallet...', 'muted');
        await delistAsset({
            asset,
            listing,
            walletContext: state.wallet
        });
        const mutationDescriptor = applyOptimisticListingRemoved(asset);
        setMessage('Listing removed.', 'success');
        queueRefreshAfterMutation({
            mutation: mutationDescriptor,
            refreshWallet: false
        });
    } catch (error) {
        setMessage(formatWalletError(error), 'error');
    }
}

async function handleCardBuy(inscriptionId) {
    const asset = getAssetById(inscriptionId);
    const listing = getListingByAssetId(inscriptionId);
    if (!asset || !listing) {
        return;
    }

    if (!state.wallet) {
        setMessage('Connect a wallet first.', 'warning');
        return;
    }

    await runExclusiveWalletAction(async () => {
        try {
            setMessage('Checking wallet for required dummy UTXOs...', 'muted');
            const purchase = await buyAssetNow({
                listing,
                walletContext: state.wallet,
                feePreference: 'balanced',
                customFeeRate: 0,
                onStatus: (status) => {
                    if (!status?.message) return;
                    setMessage(status.message, status.tone || 'muted');
                }
            });
            setPurchaseBroadcastMessage(purchase?.txid);
            await refreshAfterMutation();
        } catch (error) {
            setMessage(formatWalletError(error), 'error');
        }
    }, {
        busyMessage: 'A wallet request is already pending.'
    });
}

async function handleCardDownload(inscriptionId, card, button) {
    const asset = getAssetById(inscriptionId);
    await downloadAssetFromContainer(asset, card?.querySelector('.asset-card__media') || null, button, inscriptionId);
}

async function handleInspectDownload(inscriptionId, button) {
    const asset = getAssetById(inscriptionId);
    const mediaContainer = refs.drawerContent?.querySelector('.inspect-media') || null;
    await downloadAssetFromContainer(asset, mediaContainer, button, inscriptionId);
}

async function downloadAssetFromContainer(asset, container, button, inscriptionId) {
    if (!asset || !container) {
        return;
    }

    blurInteractiveControl(button);

    if (getAssetMediaType(asset) === 'iframe') {
        downloadFileAsset(
            getAssetMediaSrc(asset),
            `${sanitizeDownloadBaseName(asset.name || inscriptionId)}.html`
        );
        return;
    }

    const image = container.querySelector('img');
    if (image instanceof HTMLImageElement) {
        downloadUpscaledJpegFromImage(image, asset.name || inscriptionId, asset);
        return;
    }

    const fallbackUrl = getAssetMediaSrc(asset);
    if (fallbackUrl) {
        downloadFileAsset(fallbackUrl, `${sanitizeDownloadBaseName(asset.name || inscriptionId)}.png`);
    }
}

async function submitAssetOffer({ asset, priceSats, feePreference, customFeeRate }) {
    await createOffer({
        asset,
        walletContext: state.wallet,
        priceSats: Number(priceSats || 0),
        feePreference: String(feePreference || 'balanced').trim() || 'balanced',
        customFeeRate: Number(customFeeRate || 0),
        type: 'item'
    });
}

async function handleItemOffer() {
    if (!state.wallet) {
        setMessage('Connect a wallet first.', 'warning');
        return;
    }

    const asset = getSelectedOfferAsset();
    if (!asset) {
        setMessage('Select an inscription in Inspect first.', 'warning');
        return;
    }
    if (isAssetOwnedByWallet(asset)) {
        setMessage('You already own this inscription.', 'warning');
        return;
    }

    try {
        const offerRefs = getItemOfferRefs();
        const priceSats = parseBtcInputToSats(offerRefs.price?.value || '');
        const customFeeRate = parseCustomFeeRateInput(offerRefs.customFee?.value || '');
        setMessage('Confirm offer in wallet...', 'muted');
        await submitAssetOffer({
            asset,
            priceSats,
            feePreference: customFeeRate > 0 ? 'custom' : 'balanced',
            customFeeRate
        });
        if (offerRefs.price) {
            offerRefs.price.value = '';
        }
        const mutationDescriptor = applyOptimisticItemOfferPlaced(asset, priceSats);
        setMessage('Item offer placed.', 'success');
        queueRefreshAfterMutation({
            mutation: mutationDescriptor,
            refreshWallet: false
        });
    } catch (error) {
        setMessage(formatWalletError(error), 'error');
    }
}

async function handleItemOfferCancel(offerId) {
    if (!state.wallet) {
        setMessage('Connect a wallet first.', 'warning');
        return;
    }

    try {
        setMessage('Confirm cancellation in wallet...', 'muted');
        await cancelOffer({
            offerId,
            walletContext: state.wallet
        });
        const mutationDescriptor = applyOptimisticOfferCancelled(offerId);
        setMessage('Offer cancelled.', 'success');
        queueRefreshAfterMutation({
            mutation: mutationDescriptor,
            refreshWallet: false
        });
    } catch (error) {
        setMessage(formatWalletError(error), 'error');
    }
}

async function handleOfferAccept(offerId, txid, inscriptionId = '', offer = null) {
    if (!state.wallet) {
        setMessage('Connect a wallet first.', 'warning');
        return;
    }

    try {
        setMessage('Confirm acceptance in wallet...', 'muted');
        const response = await acceptOffer({
            offer,
            offerId,
            txid,
            inscriptionId,
            walletContext: state.wallet
        });
        state.acceptingOfferId = '';
        const priceSats = Number(response?.priceSats || offer?.priceSats || 0);
        const soldName = String(response?.name || offer?.name || 'inscription').trim() || 'inscription';
        const soldTxid = String(response?.txid || '').trim().toLowerCase();
        if (soldTxid) {
            setMessage(
                `Successfully sold ${soldName} for ${formatBtc(priceSats)}:`,
                'success',
                {
                    linkHref: buildMempoolTransactionUrl(soldTxid),
                    linkLabel: `mempool.space/tx/${soldTxid}`
                }
            );
        } else {
            setMessage('Offer accepted.', 'success');
        }
        await refreshAfterMutation();
    } catch (error) {
        setMessage(formatWalletError(error), 'error');
    }
}

async function handleProfileSave(formData) {
    if (!state.wallet) return;

    try {
        const holdings = Array.isArray(state.profileView?.holdings) ? state.profileView.holdings : [];
        const profile = state.profileView?.profile || {};
        const selectedAvatarHoldingId = String(state.profileAvatarAssetId || '').trim()
            || resolveSelectedProfileAvatarHoldingId(profile, holdings);
        const selectedAvatarHolding = holdings.find((holding) => holding.id === selectedAvatarHoldingId) || null;
        await saveProfile({
            walletContext: state.wallet,
            profile: {
                username: String(formData.get('username') || '').trim(),
                avatarUrl: selectedAvatarHolding ? normalizeMediaUrl(getProfileAvatarSrc(selectedAvatarHolding)) : '',
                bio: String(formData.get('bio') || '').trim(),
                socialUrl: String(formData.get('socialUrl') || '').trim()
            }
        });
        setMessage('Profile updated.', 'success');
        await openProfile(resolveProfileAddress(state.wallet), true);
    } catch (error) {
        setMessage(formatWalletError(error), 'error');
    }
}

async function refreshAfterMutation(options = {}) {
    const shouldRefreshWallet = options?.refreshWallet !== false;
    if (state.wallet && shouldRefreshWallet) {
        const wallet = await refreshWallet(state.wallet.provider);
        if (wallet) {
            state.wallet = wallet;
        }
    }

    const mutationDescriptor = options?.mutation || null;
    if (mutationDescriptor) {
        const reflected = await waitForMarketplaceMutationReflection(mutationDescriptor);
        if (!reflected) {
            scheduleDeferredMutationRefresh(options);
            return;
        }
    }

    await loadCollections();
    if (state.inspectId) {
        clearAssetDetailsCache(state.inspectId);
        await openInspect(state.inspectId);
    }
}

function getVisibleAssets() {
    const filtered = getFilteredAssets().sort(compareAssetsForView);

    return {
        total: filtered.length,
        visible: filtered.slice(0, state.visibleCount)
    };
}

function compareAssetsForView(left, right) {
    if (state.sort === 'price') {
        return Number(left.listing?.priceSats || Infinity) - Number(right.listing?.priceSats || Infinity);
    }

    if (state.sort === 'offer') {
        return Number(right.topOffer?.priceSats || 0) - Number(left.topOffer?.priceSats || 0);
    }

    if (state.sort === 'number') {
        return Number(left.number || 0) - Number(right.number || 0);
    }

    const leftScore = Number(Boolean(left.listing)) * 1000 + Number(Boolean(isAssetOwnedByWallet(left))) * 400 + Number(left.topOffer?.priceSats || 0);
    const rightScore = Number(Boolean(right.listing)) * 1000 + Number(Boolean(isAssetOwnedByWallet(right))) * 400 + Number(right.topOffer?.priceSats || 0);
    return rightScore - leftScore || Number(left.number || 0) - Number(right.number || 0);
}

function getFilteredAssets() {
    const normalizedQuery = normalizeSearchCollectionId(state.search);
    const activeTraitFilters = getActiveTraitFilters();
    const hasIdQuery = Boolean(normalizedQuery);
    const hasTraitFilters = activeTraitFilters.length > 0;

    return state.assets.filter((asset) => {
        const matchesCollectionId = !hasIdQuery || assetMatchesCollectionId(asset, normalizedQuery);
        const matchesTraits = !hasTraitFilters || assetMatchesTraitFilters(asset, activeTraitFilters);
        return matchesCollectionId && matchesTraits;
    });
}

function renderAssetCard(asset) {
    const owned = isAssetOwnedByWallet(asset);
    const title = String(asset?.name || '').trim() || getAssetCardTitle(asset);
    const listOpen = state.cardListAssetId === asset.id;
    const cardSatributes = getAssetCardSatributes(asset);
    const previousSale = asset.previousSale || getPreviousSaleRecord(getResolvedSalesHistoryForAsset(asset));
    const previousSaleMarkup = escapeHtml(formatPreviousSaleCardText(previousSale));
    const ownedListing = owned && isListingControlledByWallet(asset.listing);
    const listedForBuyer = Boolean(asset.listing) && !owned;
    const actionDisabledAttr = state.walletActionBusy ? ' disabled' : '';
    const listingPriceText = escapeHtml(formatListedBtc(asset.listing?.priceSats || 0));
    const statusLead = owned && !asset.listing
        ? `<button class="asset-card__offer-toggle asset-card__status-action" type="button" data-toggle-list="${escapeHtml(asset.id)}" aria-expanded="${listOpen ? 'true' : 'false'}"${actionDisabledAttr}>${listOpen ? 'Close' : 'List'}</button>`
        : ownedListing
            ? `
                <button class="asset-card__listing-cta asset-card__listing-cta--seller" type="button" data-delist-card="${escapeHtml(asset.id)}" aria-label="Delist ${escapeHtml(title)} listed for ${listingPriceText}"${actionDisabledAttr}>
                    <span class="asset-card__listing-cta-price">${listingPriceText}</span>
                    <span class="asset-card__listing-cta-buy">Delist</span>
                </button>
            `
        : listedForBuyer
            ? `
                <button class="asset-card__listing-cta" type="button" data-buy-card="${escapeHtml(asset.id)}" aria-label="Buy ${escapeHtml(title)} for ${escapeHtml(formatListedBtc(asset.listing?.priceSats || 0))}"${actionDisabledAttr}>
                    <span class="asset-card__listing-cta-price">${listingPriceText}</span>
                    <span class="asset-card__listing-cta-buy">Buy</span>
                </button>
            `
        : asset.listing
            ? `<span class="asset-card__listing-pill">${escapeHtml(formatListedBtc(asset.listing.priceSats))}</span>`
            : '<span class="asset-card__listing-pill asset-card__listing-pill--muted">Unlisted</span>';
    const statusRowClass = 'asset-card__status-row asset-card__status-row--center';
    return `
        <article class="asset-card" data-asset-id="${escapeHtml(asset.id)}">
            <div class="asset-card__media">
                ${renderAssetMediaMarkup(asset, {
                    className: 'asset-card__media-content',
                    alt: asset.name,
                    decorative: getAssetMediaType(asset) === 'iframe'
                })}
                ${cardSatributes.length ? `
                <div class="asset-card__media-satributes">
                    ${cardSatributes.map((item) => `
                        <span class="asset-card__satribute" title="${escapeHtml(item.label)}">
                            <img src="${escapeHtml(item.iconPath)}" alt="${escapeHtml(item.label)}">
                        </span>
                    `).join('')}
                </div>
                ` : ''}
                <button class="asset-card__inspect-button asset-card__inspect-button--overlay" type="button" data-open-inspect="${escapeHtml(asset.id)}" aria-label="Inspect ${escapeHtml(title)}">
                    <img src="/Images/Inspect.svg" alt="" aria-hidden="true">
                    <span>Inspect details</span>
                </button>
                <button class="download-button asset-card__download-button" type="button" data-download-asset="${escapeHtml(asset.id)}" aria-label="${escapeHtml(getAssetMediaType(asset) === 'iframe' ? 'Download HTML file' : 'Download artwork')}">
                    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 3v10.17l3.59-3.58L17 11l-5 5-5-5 1.41-1.41L11 13.17V3h1zm-7 14h14v2H5v-2z"></path></svg>
                </button>
                <button class="asset-card__media-hit" type="button" data-open-inspect="${escapeHtml(asset.id)}" aria-label="Inspect ${escapeHtml(asset.name)}"></button>
            </div>
            <div class="asset-card__body">
                <div class="asset-card__title-row">
                <div class="asset-card__name-block">
                    <h3>${escapeHtml(title)}</h3>
                    <div class="asset-card__previous-sale${previousSale ? '' : ' asset-card__previous-sale--empty'}">${previousSaleMarkup}</div>
                </div>
                </div>
                <div class="${statusRowClass}">
                    ${statusLead}
                </div>
                ${owned && listOpen && !asset.listing ? renderAssetCardListForm(asset) : ''}
            </div>
        </article>
    `;
}

function renderAssetCardListForm(asset) {
    return `
        <div class="asset-card__offer-panel">
            <label class="field asset-card__field">
                <span>List price (btc)</span>
                <input data-list-price type="number" min="0" step="0.00000001" placeholder="${escapeHtml(formatBtcInputValue(asset.listing?.priceSats || 250000))}">
            </label>
            <button class="action-button primary asset-card__offer-submit" type="button" data-submit-list="${escapeHtml(asset.id)}">List now</button>
        </div>
    `;
}

function getAssetCardSatributes(asset) {
    const assetDetails = getAssetDetailsById(asset.id);
    const assetItems = Array.isArray(asset?.satributes)
        ? asset.satributes
        : [];
    const detailItems = Array.isArray(assetDetails?.satributes)
        ? assetDetails.satributes
        : [];
    const collection = resolveAssetCollection(asset);
    const forced = collection?.forcedSatribute ? [collection.forcedSatribute] : [];
    const seen = new Set();

    return [...assetItems, ...detailItems, ...forced]
        .filter((item) => item && item.iconPath)
        .filter((item) => {
            const key = String(item.key || item.label || item.iconPath).trim().toLowerCase();
            if (!key || seen.has(key)) {
                return false;
            }
            seen.add(key);
            return true;
        })
        .slice(0, 3);
}

async function prefetchVisibleCardDetails(assets) {
    const targets = (Array.isArray(assets) ? assets : [])
        .filter((asset) => asset?.id)
        .filter((asset) => !getAssetDetailsById(asset.id))
        .filter((asset) => {
            const normalizedId = normalizeAssetId(asset.id);
            return !state.detailPrefetchingIds.has(normalizedId) && !detailRequestStore.has(normalizedId);
        })
        .slice(0, 18);

    if (targets.length === 0) {
        return;
    }

    let shouldRerender = false;
    await mapAsyncWithConcurrency(targets, 4, async (asset) => {
        const normalizedId = normalizeAssetId(asset.id);
        state.detailPrefetchingIds.add(normalizedId);
        try {
            const details = await loadAssetDetails(asset.id, { retries: 3 });
            if (details) {
                shouldRerender = true;
            }
        } catch {
            // Ignore background prefetch failures and keep the grid responsive.
        } finally {
            state.detailPrefetchingIds.delete(normalizedId);
        }
    });

    if (shouldRerender) {
        renderGrid();
    }
}

async function mapAsyncWithConcurrency(items, concurrency, worker) {
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

function resolveAssetCollection(asset) {
    const collectionId = String(asset?.collectionId || '').trim().toLowerCase();
    if (!collectionId) {
        return state.activeCollection || null;
    }

    return state.collections.find((entry) => String(entry.id || '').trim().toLowerCase() === collectionId)
        || state.activeCollection
        || null;
}

function getAssetCardTitle(asset) {
    const name = String(asset?.name || '').trim();
    const collectionName = String(state.activeCollection?.name || asset?.collectionName || '').trim();
    if (
        collectionName
        && name
        && name.toLowerCase().startsWith(collectionName.toLowerCase())
        && Number(asset?.number || 0) > 0
    ) {
        return `#${formatCount(asset.number)}`;
    }

    return name || `#${formatCount(asset?.number || 0)}`;
}

function renderTraits(traits) {
    const items = (Array.isArray(traits) ? traits : [])
        .filter((trait) => trait && typeof trait === 'object')
        .map((trait) => ({
            trait_type: String(trait?.trait_type || '').trim(),
            value: String(trait?.value || '').trim()
        }))
        .filter((trait) => trait.trait_type || trait.value);
    if (items.length === 0) return '';

    return `
        <section class="detail-panel detail-panel--traits">
            <div class="panel-header"><strong>Traits</strong></div>
            <div class="trait-grid">
                ${items.map((trait) => `
                    <div class="trait-pill">
                        <span class="trait-pill__type">${escapeHtml(trait.trait_type)}</span>
                        <strong class="trait-pill__value">${escapeHtml(trait.value)}</strong>
                    </div>
                `).join('')}
            </div>
        </section>
    `;
}

function renderSatributes(satributes) {
    const items = (Array.isArray(satributes) ? satributes : [])
        .filter((item) => item && typeof item === 'object')
        .map((item) => ({
            iconPath: String(item?.iconPath || '').trim(),
            label: String(item?.label || '').trim(),
            description: String(item?.description || '').trim()
        }))
        .filter((item) => item.label || item.description || item.iconPath);
    if (items.length === 0) return '';

    return `
        <section class="detail-panel detail-panel--satributes">
            <div class="panel-header"><strong>Satributes (${formatCount(items.length)})</strong></div>
            <div class="satribute-list">
                ${items.map((item) => `
                    <article class="satribute-pill">
                        ${item.iconPath ? `<img src="${escapeHtml(item.iconPath)}" alt="${escapeHtml(item.label)}">` : ''}
                        <div><strong>${escapeHtml(item.label)}</strong><p>${escapeHtml(item.description || '')}</p></div>
                    </article>
                `).join('')}
            </div>
        </section>
    `;
}

function renderSalesHistory(items) {
    const sales = Array.isArray(items) ? items : [];
    if (sales.length === 0) return '';

    return `
        <section class="detail-panel">
            <div class="panel-header"><strong>Sales history</strong></div>
            ${sales.map((sale) => `
                <div class="sale-record">
                    <strong>${formatBtc(sale.priceSats)}</strong>
                    <span>${formatDateTime(sale.occurredAt)}</span>
                </div>
            `).join('')}
        </section>
    `;
}

function getResolvedSalesHistoryForAsset(asset) {
    const normalizedId = normalizeAssetId(asset?.id);
    if (!normalizedId) {
        return [];
    }

    const assetPreviousSale = asset?.previousSale && Number(asset.previousSale?.priceSats || 0) > 0
        ? [asset.previousSale]
        : [];
    const detailsSales = Array.isArray(getAssetDetailsById(normalizedId)?.salesHistory)
        ? getAssetDetailsById(normalizedId).salesHistory
        : [];
    const collectionSales = [
        ...(Array.isArray(state.activeCollection?.recordSales) ? state.activeCollection.recordSales : []),
        ...(Array.isArray(state.activeCollection?.recentSalesActivity) ? state.activeCollection.recentSalesActivity : []),
        ...(Array.isArray(state.recentSalesActivity) ? state.recentSalesActivity : [])
    ].filter((sale) => normalizeAssetId(sale?.inscriptionId) === normalizedId);

    return dedupeSalesEntries([...assetPreviousSale, ...detailsSales, ...collectionSales])
        .sort((left, right) => compareIsoDatesDescending(left?.occurredAt || '', right?.occurredAt || ''));
}

function getPreviousSaleRecord(items) {
    const sales = Array.isArray(items) ? items.slice() : [];
    if (sales.length === 0) {
        return null;
    }

    return sales
        .filter((sale) => Number(sale?.priceSats || 0) > 0)
        .sort((left, right) => compareIsoDatesDescending(left?.occurredAt || '', right?.occurredAt || ''))[0] || null;
}

function renderMetaRow(label, value, rawHtml = false, rawLabel = false) {
    return `<div class="meta-row"><span>${rawLabel ? label : escapeHtml(label)}</span><strong>${rawHtml ? value : escapeHtml(value)}</strong></div>`;
}

function renderOrdMetaLabel(label) {
    return `
        <span class="meta-row__label">
            <img src="/Images/Ord.svg" alt="" aria-hidden="true">
            <span>${escapeHtml(label)}</span>
        </span>
    `;
}

function renderStatCard(label, value) {
    return `<article class="stat-card"><span>${escapeHtml(label)}</span><strong>${escapeHtml(String(value || '0'))}</strong></article>`;
}

function formatKilobytes(bytes) {
    const value = Number(bytes || 0);
    if (!Number.isFinite(value) || value <= 0) {
        return 'Unknown';
    }

    const kilobytes = value / 1024;
    const precision = kilobytes >= 100 ? 0 : kilobytes >= 10 ? 1 : 2;
    return `${kilobytes.toFixed(precision)} KB`;
}

function buildTraitFilterData(assets) {
    const traitTypeBuckets = new Map();
    const traitsByAssetId = new Map();

    (Array.isArray(assets) ? assets : []).forEach((asset) => {
        const traitsForAsset = new Map();
        const traits = Array.isArray(asset?.traits) ? asset.traits : [];

        traits.forEach((trait) => {
            const traitTypeLabel = String(trait?.trait_type || '').trim();
            const traitValueLabel = String(trait?.value || '').trim();
            if (!traitTypeLabel || !traitValueLabel) {
                return;
            }

            const traitTypeKey = normalizeTraitValue(traitTypeLabel);
            const traitValueKey = normalizeTraitValue(traitValueLabel);
            if (!traitTypeKey || !traitValueKey) {
                return;
            }

            traitsForAsset.set(traitTypeKey, traitValueKey);

            let traitTypeBucket = traitTypeBuckets.get(traitTypeKey);
            if (!traitTypeBucket) {
                traitTypeBucket = {
                    key: traitTypeKey,
                    label: traitTypeLabel,
                    valuesByKey: new Map()
                };
                traitTypeBuckets.set(traitTypeKey, traitTypeBucket);
            }

            let valueBucket = traitTypeBucket.valuesByKey.get(traitValueKey);
            if (!valueBucket) {
                valueBucket = {
                    key: traitValueKey,
                    label: traitValueLabel,
                    count: 0
                };
                traitTypeBucket.valuesByKey.set(traitValueKey, valueBucket);
            }

            valueBucket.count += 1;
        });

        traitsByAssetId.set(asset.id, traitsForAsset);
    });

    return {
        traitsByAssetId,
        traitTypes: Array.from(traitTypeBuckets.values())
            .map((traitType) => ({
                key: traitType.key,
                label: traitType.label,
                values: Array.from(traitType.valuesByKey.values()).sort((left, right) => {
                    if (right.count !== left.count) {
                        return right.count - left.count;
                    }
                    return left.label.localeCompare(right.label, 'en', { sensitivity: 'base' });
                })
            }))
            .sort((left, right) => left.label.localeCompare(right.label, 'en', { sensitivity: 'base' }))
    };
}

function getActiveTraitFilters() {
    return Array.from(state.traitFilterSelections.entries()).map(([traitTypeKey, traitValueKey]) => ({
        traitTypeKey,
        traitValueKey
    }));
}

function assetMatchesCollectionId(asset, normalizedQuery) {
    return getCollectionIdFromAssetMedia(asset) === normalizedQuery;
}

function assetMatchesTraitFilters(asset, activeTraitFilters) {
    if (activeTraitFilters.length === 0) {
        return true;
    }

    const assetTraits = state.traitFilterData?.traitsByAssetId?.get(asset.id);
    if (!assetTraits) {
        return false;
    }

    return activeTraitFilters.every((filter) => assetTraits.get(filter.traitTypeKey) === filter.traitValueKey);
}

function getCollectionIdFromAssetMedia(asset) {
    const mediaSrc = String(asset?.imageSrc || '').trim() || getAssetMediaSrc(asset);
    const imageStem = getImageStemFromCollectionSrc(mediaSrc);
    return imageStem ? normalizeSearchCollectionId(imageStem) : '';
}

function getImageStemFromCollectionSrc(src) {
    const withoutQuery = String(src || '').split('?')[0];
    const fileName = withoutQuery.split('/').pop() || '';
    const stem = fileName.replace(/\.[^.]+$/, '');
    if (!stem) {
        return '';
    }

    try {
        return decodeURIComponent(stem);
    } catch {
        return stem;
    }
}

function normalizeSearchCollectionId(value) {
    const normalized = String(value || '').trim().toLowerCase();
    if (/^\d+$/.test(normalized)) {
        return String(Number.parseInt(normalized, 10));
    }
    return normalized;
}

function normalizeCollectionIdValue(value) {
    const normalized = String(value || '').trim().toLowerCase().replace(/^#/, '');
    if (/^\d+$/.test(normalized)) {
        return String(Number.parseInt(normalized, 10));
    }
    return normalized;
}

function normalizeAddressValue(value) {
    return String(value || '').trim().toLowerCase();
}

function normalizeInscriptionIdValue(value) {
    return String(value || '').trim().toLowerCase();
}

function mapWalletInscriptionToHolding(item) {
    const inscriptionId = normalizeInscriptionIdValue(item?.inscriptionId || item?.id || '');
    const asset = state.assets.find((entry) => normalizeInscriptionIdValue(entry?.id || '') === inscriptionId) || null;
    const preview = String(item?.preview || asset?.imageSrc || '').trim();

    return {
        id: inscriptionId,
        inscriptionId,
        collectionId: String(asset?.collectionId || item?.collectionId || state.activeCollectionId || '').trim(),
        collectionName: String(asset?.collectionName || state.activeCollection?.name || '').trim(),
        name: String(asset?.name || item?.name || `#${formatCount(item?.inscriptionNumber || 0)}` || inscriptionId).trim(),
        imageSrc: preview,
        mediaType: String(asset?.mediaType || '').trim(),
        ownerAddress: String(item?.address || '').trim(),
        traits: Array.isArray(asset?.traits) ? asset.traits : [],
        satributes: Array.isArray(asset?.satributes) ? asset.satributes : []
    };
}

function createClientEmptyProfile(address) {
    return {
        address: String(address || '').trim(),
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

function buildLocalOwnProfileView(address) {
    if (!state.wallet) {
        return null;
    }

    const normalizedAddress = String(address || '').trim();
    const normalizedWalletAddresses = getWalletAddressSet(state.wallet);
    if (!normalizedWalletAddresses.has(normalizeAddressValue(normalizedAddress))) {
        return null;
    }

    const sourceInscriptions = Array.isArray(state.wallet.inscriptions) && state.wallet.inscriptions.length > 0
        ? state.wallet.inscriptions
        : state.wallet.inscriptionsById instanceof Map
            ? Array.from(state.wallet.inscriptionsById.values())
            : [];
    const holdings = sourceInscriptions
        .map((item) => mapWalletInscriptionToHolding(item))
        .filter((item) => item.id);
    const activeListings = Array.from(state.listingsById.values())
        .filter((listing) => normalizedWalletAddresses.has(normalizeAddressValue(listing?.sellerAddress || '')));
    const openOffers = (Array.isArray(state.openOffers) ? state.openOffers : [])
        .filter((offer) => {
            const offerAddresses = [
                normalizeAddressValue(offer?.buyerOrdinalsAddress || ''),
                normalizeAddressValue(offer?.buyerAddress || '')
            ].filter(Boolean);
            return offerAddresses.some((offerAddress) => normalizedWalletAddresses.has(offerAddress));
        });
    const cachedProfile = state.profileCache.get(normalizedAddress)?.profile
        || state.profileView?.profile
        || createClientEmptyProfile(normalizedAddress);

    return {
        version: 1,
        updatedAt: new Date().toISOString(),
        address: normalizedAddress,
        profile: cachedProfile,
        holdings,
        activeListings,
        openOffers,
        recentSales: Array.isArray(state.profileCache.get(normalizedAddress)?.recentSales)
            ? state.profileCache.get(normalizedAddress).recentSales
            : []
    };
}

function isPlaceholderHoldingName(value) {
    const normalized = String(value || '').trim();
    return !normalized || /^#?0+$/.test(normalized);
}

function shouldUseLocalProfileView(profileView) {
    if (!profileView || typeof profileView !== 'object') {
        return false;
    }

    const holdings = Array.isArray(profileView.holdings) ? profileView.holdings : [];
    if (holdings.length === 0) {
        return true;
    }

    return !holdings.some((holding) => isPlaceholderHoldingName(holding?.name));
}

function escapeSelector(value) {
    return String(value || '').replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

function getWalletAddressSet(walletContext) {
    const addresses = new Set();
    [
        resolvePaymentAddress(walletContext),
        resolveOrdinalsAddress(walletContext),
        resolveProfileAddress(walletContext)
    ]
        .map(normalizeAddressValue)
        .filter(Boolean)
        .forEach((address) => addresses.add(address));
    return addresses;
}

function getConnectedWalletHoldingCount() {
    if (!state.wallet) {
        return 0;
    }

    const mapSize = state.wallet.inscriptionsById instanceof Map
        ? state.wallet.inscriptionsById.size
        : 0;
    if (mapSize > 0) {
        return mapSize;
    }

    const loadedAssets = Array.isArray(state.assets) ? state.assets : [];
    if (!loadedAssets.length) {
        return Number(state.wallet.inscriptions?.length || 0);
    }

    return loadedAssets.reduce((count, asset) => count + (isAssetOwnedByWallet(asset) ? 1 : 0), 0);
}

function normalizeTraitValue(value) {
    return String(value || '')
        .trim()
        .toLowerCase()
        .replace(/\s+/g, ' ');
}

function syncTraitFilterCardWidth(traitFilterWindow) {
    const traitControls = traitFilterWindow?.querySelector('.trait-filter-controls');
    if (!traitControls) {
        return;
    }

    const traitCards = Array.from(traitControls.querySelectorAll('.trait-filter-control'));
    if (traitCards.length === 0) {
        return;
    }

    traitControls.style.removeProperty('--trait-filter-card-width');

    const firstCardStyle = window.getComputedStyle(traitCards[0]);
    const horizontalPadding = (parseFloat(firstCardStyle.paddingLeft) || 0) + (parseFloat(firstCardStyle.paddingRight) || 0);
    const horizontalBorder = (parseFloat(firstCardStyle.borderLeftWidth) || 0) + (parseFloat(firstCardStyle.borderRightWidth) || 0);
    const edgeAllowance = 30;
    let widestTextWidth = 0;

    traitCards.forEach((card) => {
        const labelNode = card.querySelector('.trait-filter-label');
        const selectNode = card.querySelector('.trait-filter-select');
        if (labelNode) {
            widestTextWidth = Math.max(widestTextWidth, Math.ceil(labelNode.scrollWidth));
        }
        if (selectNode) {
            widestTextWidth = Math.max(widestTextWidth, Math.ceil(selectNode.scrollWidth));
        }
    });

    if (widestTextWidth <= 0) {
        return;
    }

    const desiredWidth = Math.ceil(widestTextWidth + horizontalPadding + horizontalBorder + edgeAllowance);
    const controlsStyle = window.getComputedStyle(traitControls);
    const controlsGap = parseFloat(controlsStyle.columnGap || controlsStyle.gap || '0') || 0;
    const availableWidth = Math.max(1, traitControls.clientWidth);
    const minCardWidth = 130;
    const maxCardWidth = 340;
    const resolvedCardWidth = Math.max(minCardWidth, Math.min(desiredWidth, maxCardWidth));
    const traitCount = Math.max(1, traitCards.length);
    const singleRowMaxCardWidth = Math.floor((availableWidth - (controlsGap * (traitCount - 1))) / traitCount);
    const canFitSingleRow = singleRowMaxCardWidth >= resolvedCardWidth;

    traitControls.style.setProperty('--trait-filter-card-width', `${resolvedCardWidth}px`);
    traitControls.style.flexWrap = canFitSingleRow ? 'nowrap' : 'wrap';
}

function scheduleTraitFilterCardWidthSync(traitFilterWindow) {
    if (!traitFilterWindow) {
        return;
    }

    if (typeof window.requestAnimationFrame === 'function') {
        window.requestAnimationFrame(() => syncTraitFilterCardWidth(traitFilterWindow));
        return;
    }

    window.setTimeout(() => syncTraitFilterCardWidth(traitFilterWindow), 0);
}

function getWalletProviderLabel(providerId) {
    return String(providerId || '').trim().toLowerCase() === 'xverse'
        ? 'Xverse'
        : 'UniSat';
}

function renderProfileEditor(profile, holdings = [], selectedAvatarHoldingId = '') {
    return `
        <form id="profile-editor" class="profile-editor">
            <div class="panel-header"><strong>Edit profile</strong><span>Connected wallet</span></div>
            <label class="field"><span>Username</span><input name="username" type="text" maxlength="40" value="${escapeHtml(profile.username || '')}"></label>
            <label class="field"><span>Bio</span><textarea name="bio" rows="3" maxlength="280">${escapeHtml(profile.bio || '')}</textarea></label>
            <label class="field"><span>Social URL</span><input name="socialUrl" type="url" value="${escapeHtml(profile.socialUrl || '')}"></label>
            <button class="action-button primary" type="submit">Save profile</button>
        </form>
    `;
}

function getSelectedAsset() {
    return resolveInspectAsset(state.inspectId);
}

function isAssetOwnedByWallet(asset) {
    const inscriptionsById = state.wallet?.inscriptionsById;
    if (!(inscriptionsById instanceof Map) || !asset?.id) {
        return false;
    }

    const rawId = String(asset.id || '').trim();
    const normalizedId = normalizeInscriptionIdValue(rawId);
    if (!normalizedId) {
        return false;
    }

    if (inscriptionsById.has(rawId) || inscriptionsById.has(normalizedId)) {
        return true;
    }

    for (const key of inscriptionsById.keys()) {
        if (normalizeInscriptionIdValue(key) === normalizedId) {
            return true;
        }
    }

    const ownerAddress = normalizeAddressValue(getAssetDetailsById(rawId)?.ownerAddress || '');
    if (!ownerAddress) {
        return false;
    }

    const walletAddresses = getWalletAddressSet(state.wallet);
    return walletAddresses.has(ownerAddress);
}

function getOwnedAssetsForCollection(collectionId) {
    const normalizedCollectionId = String(collectionId || '').trim().toLowerCase();
    if (!normalizedCollectionId) {
        return [];
    }

    return state.assets.filter((asset) => (
        String(asset?.collectionId || '').trim().toLowerCase() === normalizedCollectionId
        && isAssetOwnedByWallet(asset)
    ));
}

function isListingControlledByWallet(listing) {
    if (!listing || !state.wallet) {
        return false;
    }

    const walletAddresses = getWalletAddressSet(state.wallet);
    return walletAddresses.has(normalizeAddressValue(listing?.sellerAddress || ''));
}

function setMessage(message, tone = 'muted', options = {}) {
    const nextMessage = String(message || '').trim();
    const nextTone = String(tone || 'muted').trim() || 'muted';
    const nextLinkHref = String(options?.linkHref || '').trim();
    const nextLinkLabel = String(options?.linkLabel || '').trim();

    state.message = nextMessage;
    state.messageTone = nextTone;
    state.messageLinkHref = nextLinkHref;
    state.messageLinkLabel = nextLinkLabel;
    if (refs.messageText) {
        refs.messageText.textContent = state.message;
    }
    if (refs.messageLink) {
        refs.messageLink.href = nextLinkHref;
        refs.messageLink.textContent = nextLinkLabel;
        refs.messageLink.hidden = !(nextMessage && nextLinkHref && nextLinkLabel);
    }
    if (refs.message) {
        refs.message.dataset.tone = nextTone;
        refs.message.dataset.visible = nextMessage ? 'true' : 'false';
    }

    if (refs.messageClose) {
        refs.messageClose.hidden = !nextMessage;
    }
}

function clearMessage() {
    setMessage('', 'muted');
}

function setPurchaseBroadcastMessage(txid) {
    const normalizedTxid = String(txid || '').trim().toLowerCase();
    if (!normalizedTxid) {
        setMessage('Purchase broadcasted.', 'success');
        return;
    }

    setMessage(
        'Purchase broadcasted:',
        'success',
        {
            linkHref: buildMempoolTransactionUrl(normalizedTxid),
            linkLabel: `mempool.space/tx/${normalizedTxid}`
        }
    );
}

function buildMempoolTransactionUrl(txid) {
    const normalizedTxid = String(txid || '').trim().toLowerCase();
    return normalizedTxid ? `https://mempool.space/tx/${normalizedTxid}` : '';
}

function formatError(error) {
    return String(error?.message || error || 'Request failed.').replace(/\s+/g, ' ').trim();
}

function formatCount(value) {
    return new Intl.NumberFormat('en-US').format(Number(value || 0));
}

function parseCollectionStatNumber(value) {
    if (value === null || value === undefined || value === '') {
        return null;
    }

    const parsedValue = Number(value);
    return Number.isFinite(parsedValue) ? parsedValue : null;
}

function formatCollectionStatCount(value) {
    const parsedValue = parseCollectionStatNumber(value);
    return parsedValue === null ? '--' : Math.round(parsedValue).toLocaleString('en-US');
}

function formatCollectionStatBtc(value, options = {}) {
    const parsedValue = parseCollectionStatNumber(value);
    if (parsedValue === null) {
        return '--';
    }
    if (options.zeroAsEmpty && parsedValue === 0) {
        return 'â€”';
    }

    const fractionDigits = Number.isInteger(options.fractionDigits) && options.fractionDigits >= 0
        ? options.fractionDigits
        : 3;
    const roundingFactor = 10 ** fractionDigits;
    const roundedValue = Math.round(parsedValue * roundingFactor) / roundingFactor;

    return `${roundedValue.toLocaleString('en-US', {
        minimumFractionDigits: fractionDigits,
        maximumFractionDigits: fractionDigits
    })} BTC`;
}

function formatCollectionStatsTimestamp(value) {
    const timestamp = new Date(value);
    if (Number.isNaN(timestamp.getTime())) {
        return 'Snapshot time unavailable';
    }

    return timestamp.toLocaleDateString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
}

function parseBtcInputToSats(value) {
    const raw = String(value || '').trim().replace(/,/g, '');
    if (!raw || !/^\d+(\.\d{0,8})?$/.test(raw)) {
        return 0;
    }

    const [wholePart, fractionPart = ''] = raw.split('.');
    const whole = Number(wholePart || 0);
    if (!Number.isFinite(whole) || whole < 0) {
        return 0;
    }

    return (whole * 100000000) + Number((fractionPart + '00000000').slice(0, 8));
}

function parseCustomFeeRateInput(value) {
    const raw = String(value || '').trim().replace(/,/g, '');
    if (!raw || !/^\d+(\.\d+)?$/.test(raw)) {
        return 0;
    }

    const feeRate = Number(raw);
    return Number.isFinite(feeRate) && feeRate > 0 ? Math.round(feeRate) : 0;
}

function formatBtcInputValue(sats) {
    const value = Number(sats || 0);
    if (!Number.isFinite(value) || value <= 0) {
        return '';
    }

    return (value / 100000000).toFixed(8).replace(/\.?0+$/, '');
}

function formatBtc(sats) {
    const value = Number(sats || 0);
    if (!Number.isFinite(value) || value <= 0) return '0 BTC';
    return `${(value / 100000000).toFixed(8).replace(/\.?0+$/, '')} BTC`;
}

function formatListedBtc(sats) {
    return formatBtc(sats).replace(' BTC', '\u20BF');
}

function formatBtcWithPrecision(sats, maxDecimals = 5) {
    const value = Number(sats || 0);
    const decimals = Math.max(0, Number(maxDecimals) || 0);
    if (!Number.isFinite(value) || value <= 0) return '0 BTC';
    return `${(value / 100000000).toFixed(decimals).replace(/\.?0+$/, '')} BTC`;
}

function formatBtcWithSymbolSuffix(sats, maxDecimals = 5) {
    return formatBtcWithPrecision(sats, maxDecimals).replace(' BTC', '\u20BF');
}

function formatPreviousSaleBtc(sats) {
    const value = Number(sats || 0);
    if (!Number.isFinite(value) || value <= 0) {
        return 'None';
    }

    return `${(value / 100000000).toFixed(4)} BTC`;
}

function formatPreviousSaleCardText(sale) {
    const priceSats = Number(sale?.priceSats || 0);
    if (!Number.isFinite(priceSats) || priceSats <= 0) {
        return 'No sales history';
    }

    return `${formatBtcWithSymbolSuffix(priceSats, 5)} Last sale`;
}

function formatUsdFromSats(sats) {
    const btcUsd = Number(state.btcUsdQuote?.btcUsd || 0);
    const value = Number(sats || 0);
    if (!Number.isFinite(btcUsd) || btcUsd <= 0 || !Number.isFinite(value) || value <= 0) {
        return '';
    }

    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format((value / 100000000) * btcUsd);
}

function formatDateTime(value) {
    if (!value) return 'Unknown';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Unknown';
    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(date);
}

function formatRelativeAgeLabel(value) {
    if (!value) return 'Today';
    const timestamp = new Date(value).getTime();
    if (Number.isNaN(timestamp)) return 'Today';
    const diffDays = Math.max(0, Math.floor((Date.now() - timestamp) / 86400000));
    if (diffDays <= 0) return 'Today';
    if (diffDays === 1) return '1 day ago';
    return `${diffDays} days ago`;
}

function shortAddress(value) {
    const normalized = String(value || '').trim();
    if (!normalized) return '';
    if (normalized.length <= 9) return normalized;
    return `${normalized.slice(0, 3)}...${normalized.slice(-3)}`;
}

function renderSaleAddressLink(address) {
    const normalized = String(address || '').trim();
    if (!normalized) {
        return '';
    }

    return `<button class="link-button sales-feed__address-link" type="button" data-open-profile="${escapeHtml(normalized)}">${escapeHtml(shortAddress(normalized))}</button>`;
}

function shortInscriptionId(value) {
    const normalized = String(value || '').trim().toLowerCase();
    if (!normalized) return '';
    if (normalized.length <= 18) return normalized;
    return `${normalized.slice(0, 8)}...${normalized.slice(-6)}`;
}

function shortLinkedInscriptionId(value) {
    const normalized = String(value || '').trim().toLowerCase();
    if (!normalized) return '';
    if (normalized.length <= 11) return normalized;
    return `${normalized.slice(0, 4)}...${normalized.slice(-4)}`;
}

function clamp(value, min, max) {
    return Math.min(Math.max(Number(value) || 0, Number(min) || 0), Number(max) || 0);
}

async function copyTextToClipboard(text) {
    const value = String(text || '').trim();
    if (!value) {
        return;
    }

    if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
        return;
    }

    const textarea = document.createElement('textarea');
    textarea.value = value;
    textarea.setAttribute('readonly', 'readonly');
    textarea.style.position = 'absolute';
    textarea.style.opacity = '0';
    textarea.style.pointerEvents = 'none';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    textarea.remove();
}

function escapeHtml(value) {
    return String(value || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}



