import { Base64Codec, OrdinalsMarketplace, PsbtTransaction } from './package/dist/ordinals-library.js?v=20260315-01';

const SIGHASH_ALL = 1;
const SIGHASH_SINGLE_ANYONECANPAY = 131;
const DEFAULT_API_BASE = resolveDefaultApiBase();
const DEFAULT_MEMPOOL_BASE_URL = resolveDefaultBtcApiBase();
const DEFAULT_BROADCAST_AUTH_PATH = resolveDefaultBroadcastAuthPath();
const DEFAULT_FEE_TIER = 'halfHourFee';
const FALLBACK_RECEIVE_ADDRESS = 'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kygt080';
const DUMMY_UTXO_EXTRA_COUNT = 1;
const MIN_SAFE_BUYER_FUNDING_UTXO_SATS = 11000n;
const UNISAT_WALLET_SETTLE_DELAY_MS = 180;
const XVERSE_WALLET_SETTLE_DELAY_MS = 900;
const BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
const BECH32_CHARSET = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l';
const BECH32_CONST = 1;
const BECH32M_CONST = 0x2bc830a3;

export const BOUTIQUE_PSBT_CONFIG = {
    apiBase: DEFAULT_API_BASE,
    mempoolBaseUrl: DEFAULT_MEMPOOL_BASE_URL,
    broadcastAuthPath: DEFAULT_BROADCAST_AUTH_PATH,
    feeTier: DEFAULT_FEE_TIER
};

let unisatWalletRequestChain = Promise.resolve();
let unisatWalletLastRequestAt = 0;
let xverseWalletRequestChain = Promise.resolve();
let xverseWalletLastRequestAt = 0;

function resolveDefaultApiBase() {
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

function resolveDefaultBtcApiBase() {
    return `${resolveDefaultApiBase()}/btc`;
}

function resolveDefaultBroadcastAuthPath() {
    return `${resolveDefaultApiBase()}/auth/broadcast-challenge`;
}

export function normalizeInscriptionId(value) {
    return String(value || '').trim().toLowerCase();
}

export function formatErrorMessage(error) {
    const message = error && error.message ? String(error.message) : String(error || 'Unknown error');
    return message
        .replace(/\r\n?/g, '\n')
        .split('\n')
        .map((line) => line.replace(/[^\S\n]+/g, ' ').trim())
        .filter((line, index, lines) => line || (index > 0 && index < lines.length - 1))
        .join('\n')
        .trim();
}

export function shortenAddress(address) {
    const value = String(address || '').trim();
    if (value.length <= 12) return value;
    return `${value.slice(0, 6)}...${value.slice(-4)}`;
}

export async function loadUnisatWalletContext({
    connect = false,
    mempoolBaseUrl = DEFAULT_MEMPOOL_BASE_URL,
    apiBase = DEFAULT_API_BASE,
    hydrateDetails = true
} = {}) {
    assertUnisatAvailable();

    const accounts = connect
        ? await window.unisat.requestAccounts()
        : typeof window.unisat.getAccounts === 'function'
            ? await window.unisat.getAccounts()
            : [];

    const address = Array.isArray(accounts) && accounts[0] ? String(accounts[0]).trim() : '';
    if (!address) return null;

    const rawPublicKey = String(await window.unisat.getPublicKey() || '').trim();
    const publicKey = normalizePublicKeyForAddress(address, rawPublicKey);
    const signatureMethod = inferUnisatSignatureMethod(address);
    const baseContext = {
        provider: 'unisat',
        address,
        paymentAddress: address,
        ordinalsAddress: address,
        publicKey,
        paymentPublicKey: publicKey,
        ordinalsPublicKey: publicKey,
        rawPublicKey,
        signer: { address, publicKey },
        paymentSigner: { address, publicKey },
        ordinalsSigner: { address, publicKey },
        signatureMethod
    };

    if (!hydrateDetails) {
        return {
            ...baseContext,
            inscriptions: [],
            inscriptionsById: new Map(),
            inscribedOutpoints: new Set(),
            utxos: null,
            utxoFetchError: '',
            detailsHydrated: false
        };
    }

    const walletInscriptionsPromise = fetchAllUnisatInscriptions();
    const portfolioPromise = fetchJson(`${normalizeBaseUrl(apiBase)}/address/${encodeURIComponent(address)}/portfolio`)
        .catch(() => ({ holdings: [] }));
    const utxosPromise = fetchAddressUtxos(address, mempoolBaseUrl)
        .then((utxos) => ({
            utxos,
            utxoFetchError: ''
        }))
        .catch((error) => ({
            utxos: null,
            utxoFetchError: formatErrorMessage(error)
        }));
    const [walletInscriptions, portfolio, utxoResult] = await Promise.all([walletInscriptionsPromise, portfolioPromise, utxosPromise]);
    const walletInscriptionsById = new Map(
        walletInscriptions
            .map((item) => normalizeWalletInscription(item))
            .filter((item) => item.inscriptionId && item.utxo)
            .map((item) => [item.inscriptionId, item])
    );
    const portfolioInscriptionsById = new Map(
        (Array.isArray(portfolio?.holdings) ? portfolio.holdings : [])
            .map((item) => normalizePortfolioHolding(item))
            .filter((item) => item.inscriptionId && item.utxo)
            .map((item) => [item.inscriptionId, item])
    );
    const mergedInscriptionIds = new Set([
        ...walletInscriptionsById.keys(),
        ...portfolioInscriptionsById.keys()
    ]);
    const inscriptionsById = new Map(
        Array.from(mergedInscriptionIds).map((inscriptionId) => {
            const walletItem = walletInscriptionsById.get(inscriptionId) || null;
            const portfolioItem = portfolioInscriptionsById.get(inscriptionId) || null;
            const merged = {
                ...(walletItem || {}),
                ...(portfolioItem || {}),
                inscriptionId,
                address: String(portfolioItem?.address || walletItem?.address || '').trim(),
                outpoint: String(portfolioItem?.outpoint || walletItem?.outpoint || '').trim(),
                location: String(portfolioItem?.location || walletItem?.location || '').trim(),
                utxo: portfolioItem?.utxo || walletItem?.utxo || null,
                outputValue: Number(portfolioItem?.outputValue || walletItem?.outputValue || 0),
                preview: String(portfolioItem?.preview || walletItem?.preview || '').trim(),
                name: String(portfolioItem?.name || walletItem?.name || '').trim(),
                collectionId: String(portfolioItem?.collectionId || walletItem?.collectionId || '').trim()
            };
            return [inscriptionId, merged];
        }).filter(([, item]) => item && item.utxo)
    );

    const inscribedOutpoints = new Set(
        Array.from(inscriptionsById.values())
            .map((item) => item.outpoint)
            .filter(Boolean)
    );

    return {
        ...baseContext,
        inscriptions: Array.from(inscriptionsById.values()),
        inscriptionsById,
        inscribedOutpoints,
        utxos: utxoResult.utxos,
        utxoFetchError: utxoResult.utxoFetchError,
        detailsHydrated: true
    };
}

export async function signPsbtWithUnisat(psbtBase64, toSignInputs = [], signer = null) {
    assertUnisatAvailable();

    const psbtHex = base64ToHex(psbtBase64);
    const normalizedInputs = (Array.isArray(toSignInputs) ? toSignInputs : []).map((input) => {
        const normalized = {
            index: Number(input.index),
            address: String(input.address || signer?.address || '').trim()
        };

        const publicKey = String(input.publicKey || '').trim();
        const sighashType = Number(input.sighashType);

        if (publicKey) normalized.publicKey = publicKey;
        if (Number.isFinite(sighashType)) normalized.sighashTypes = [sighashType];
        if (typeof input.disableTweakSigner === 'boolean') normalized.disableTweakSigner = input.disableTweakSigner;
        if (typeof input.autoFinalized === 'boolean') normalized.autoFinalized = input.autoFinalized;

        return normalized;
    });

    return runQueuedUnisatWalletRequest(async () => {
        try {
            const signedHex = await window.unisat.signPsbt(psbtHex, {
                autoFinalized: false,
                toSignInputs: normalizedInputs
            });

            return hexToBase64(signedHex);
        } catch (error) {
            const normalizedMessage = formatErrorMessage(error).toLowerCase();
            const hasExplicitPublicKey = normalizedInputs.some((input) => typeof input?.publicKey === 'string' && input.publicKey.trim());
            const invalidPublicKeyError = normalizedMessage.includes('invalid public key in tosigninput');

            if (!invalidPublicKeyError || !hasExplicitPublicKey) {
                throw error;
            }

            const fallbackInputs = normalizedInputs.map(({ publicKey, ...input }) => input);
            const signedHex = await window.unisat.signPsbt(psbtHex, {
                autoFinalized: false,
                toSignInputs: fallbackInputs
            });

            return hexToBase64(signedHex);
        }
    });
}

export async function pushPsbtWithUnisat(psbtBase64) {
    assertUnisatAvailable();
    return runQueuedUnisatWalletRequest(() => window.unisat.pushPsbt(base64ToHex(psbtBase64)));
}

export async function signMessageWithUnisat(message, type = 'ecdsa') {
    assertUnisatAvailable();
    if (typeof window.unisat.signMessage !== 'function') {
        throw new Error('UniSat message signing is not available in this wallet.');
    }

    const normalizedType = String(type || 'ecdsa').trim().toLowerCase();
    const walletType = normalizedType === 'bip322' ? 'bip322-simple' : normalizedType;
    return runQueuedUnisatWalletRequest(() => window.unisat.signMessage(String(message || ''), walletType));
}

export function hasUnisatWallet() {
    return Boolean(window.unisat);
}

export function hasXverseWallet() {
    return Boolean(getXverseBitcoinProvider());
}

export async function loadXverseAccount({
    connect = false,
    message = 'Connect to Blok Boutique marketplace.',
    network = 'Mainnet'
} = {}) {
    const method = connect ? 'wallet_connect' : 'wallet_getAccount';
    const connectParams = {
        addresses: ['payment', 'ordinals'],
        message: String(message || '').trim() || undefined,
        network: String(network || '').trim() || undefined
    };
    let result = null;

    if (connect) {
        result = await requestWithXverse(method, connectParams);
    } else {
        try {
            result = await requestWithXverse(method);
        } catch (error) {
            const normalizedMessage = formatErrorMessage(error).toLowerCase();
            if (!normalizedMessage.includes('invalid parameters')) {
                throw error;
            }

            result = await requestWithXverse(method, {
                addresses: ['payment', 'ordinals']
            });
        }
    }

    const ordinalsEntry = selectXverseAddress(result, 'ordinals');
    const paymentEntry = selectXverseAddress(result, 'payment') || ordinalsEntry;
    if (!ordinalsEntry.address) {
        return null;
    }

    const ordinalsRawPublicKey = String(ordinalsEntry.publicKey || '').trim();
    const paymentRawPublicKey = String(paymentEntry.publicKey || ordinalsRawPublicKey).trim();
    const ordinalsPublicKey = normalizePublicKeyForAddress(ordinalsEntry.address, ordinalsRawPublicKey);
    const paymentPublicKey = normalizePublicKeyForAddress(paymentEntry.address, paymentRawPublicKey);

    return {
        address: paymentEntry.address,
        publicKey: paymentPublicKey,
        rawPublicKey: paymentRawPublicKey || paymentPublicKey,
        paymentAddress: paymentEntry.address,
        paymentPublicKey,
        paymentRawPublicKey,
        paymentPurpose: String(paymentEntry.purpose || '').trim(),
        paymentAddressType: String(paymentEntry.addressType || '').trim(),
        ordinalsAddress: ordinalsEntry.address,
        ordinalsPublicKey,
        ordinalsRawPublicKey,
        ordinalsPurpose: String(ordinalsEntry.purpose || '').trim(),
        ordinalsAddressType: String(ordinalsEntry.addressType || '').trim(),
        network: String(ordinalsEntry.network || paymentEntry.network || '').trim(),
        walletType: String(ordinalsEntry.walletType || paymentEntry.walletType || '').trim()
    };
}

function normalizeAddressKey(value) {
    return String(value || '').trim().toLowerCase();
}

function buildWalletAddressList(...values) {
    const seen = new Set();
    const addresses = [];

    for (const value of values) {
        const address = String(value || '').trim();
        const key = normalizeAddressKey(address);
        if (!key || seen.has(key)) {
            continue;
        }
        seen.add(key);
        addresses.push(address);
    }

    return addresses;
}

function mergeWalletInscriptions(items = []) {
    const inscriptionsById = new Map();

    for (const item of items) {
        const inscriptionId = normalizeInscriptionId(item?.inscriptionId || item?.id);
        if (!inscriptionId || !item?.utxo) {
            continue;
        }

        const current = inscriptionsById.get(inscriptionId) || null;
        inscriptionsById.set(inscriptionId, {
            ...(current || {}),
            ...(item || {}),
            inscriptionId,
            address: String(item?.address || current?.address || '').trim(),
            outpoint: String(item?.outpoint || current?.outpoint || '').trim(),
            location: String(item?.location || item?.outpoint || current?.location || current?.outpoint || '').trim(),
            utxo: item?.utxo || current?.utxo || null,
            outputValue: Number(item?.outputValue || current?.outputValue || 0),
            preview: String(item?.preview || current?.preview || '').trim(),
            name: String(item?.name || current?.name || '').trim(),
            collectionId: String(item?.collectionId || current?.collectionId || '').trim()
        });
    }

    return inscriptionsById;
}

function findWalletInscriptionById(walletContext, inscriptionId) {
    const normalizedId = normalizeInscriptionId(inscriptionId);
    const inscriptionsById = walletContext?.inscriptionsById;
    if (!(inscriptionsById instanceof Map) || !normalizedId) {
        return null;
    }

    if (inscriptionsById.has(normalizedId)) {
        return inscriptionsById.get(normalizedId) || null;
    }

    for (const [key, value] of inscriptionsById.entries()) {
        if (normalizeInscriptionId(key) === normalizedId) {
            return value || null;
        }
    }

    return null;
}

function cacheWalletInscription(walletContext, item) {
    const inscriptionId = normalizeInscriptionId(item?.inscriptionId || item?.id);
    if (!walletContext || !inscriptionId || !item?.utxo) {
        return null;
    }

    const normalizedItem = {
        ...(item || {}),
        inscriptionId,
        address: String(item?.address || '').trim(),
        outpoint: String(item?.outpoint || item?.location || '').trim(),
        location: String(item?.location || item?.outpoint || '').trim(),
        outputValue: Number(item?.outputValue || Number(item?.utxo?.amount ?? 0)),
        preview: String(item?.preview || '').trim(),
        name: String(item?.name || '').trim(),
        collectionId: String(item?.collectionId || '').trim()
    };

    if (!(walletContext.inscriptionsById instanceof Map)) {
        walletContext.inscriptionsById = new Map();
    }
    walletContext.inscriptionsById.set(inscriptionId, normalizedItem);

    if (!Array.isArray(walletContext.inscriptions)) {
        walletContext.inscriptions = [];
    }
    if (!walletContext.inscriptions.some((entry) => normalizeInscriptionId(entry?.inscriptionId || entry?.id) === inscriptionId)) {
        walletContext.inscriptions.push(normalizedItem);
    }

    if (!(walletContext.inscribedOutpoints instanceof Set)) {
        walletContext.inscribedOutpoints = new Set();
    }
    if (normalizedItem.outpoint) {
        walletContext.inscribedOutpoints.add(normalizedItem.outpoint);
    }

    return normalizedItem;
}

async function fetchAddressPortfolioHoldings(address, apiBase = DEFAULT_API_BASE) {
    const normalizedAddress = String(address || '').trim();
    if (!normalizedAddress) {
        return [];
    }

    const portfolio = await fetchJson(`${normalizeBaseUrl(apiBase)}/address/${encodeURIComponent(normalizedAddress)}/portfolio`)
        .catch(() => ({ holdings: [] }));

    return (Array.isArray(portfolio?.holdings) ? portfolio.holdings : [])
        .map((item) => normalizePortfolioHolding(item, normalizedAddress))
        .filter((item) => item.inscriptionId && item.utxo);
}

function resolveWalletInscriptionFromDetails(walletContext, inscriptionId, details = null) {
    const normalizedId = normalizeInscriptionId(inscriptionId);
    if (!details || !normalizedId) {
        return null;
    }

    const walletAddresses = new Set(buildWalletAddressList(
        getOrdinalsAddress(walletContext),
        getPaymentAddress(walletContext)
    ).map((address) => normalizeAddressKey(address)));
    const ownerAddress = String(details?.ownerAddress || details?.address || '').trim();
    const ownerAddressKey = normalizeAddressKey(ownerAddress);
    const outpoint = normalizeOutpoint(
        details?.outpoint || formatOutpoint(details?.locationTxid, details?.locationIndex)
    );
    const outputValue = normalizePositiveInteger(details?.outputValue);
    const utxo = parseUtxoFromLocation(outpoint, outputValue);

    if (!ownerAddressKey || !walletAddresses.has(ownerAddressKey) || !utxo) {
        return null;
    }

    return {
        inscriptionId: normalizedId,
        address: ownerAddress,
        outpoint,
        location: outpoint,
        utxo,
        outputValue,
        preview: '',
        name: '',
        collectionId: String(details?.collectionId || '').trim()
    };
}

async function resolveWalletInscription(walletContext, inscriptionId, {
    apiBase = DEFAULT_API_BASE,
    inscriptionDetails = null
} = {}) {
    const normalizedId = normalizeInscriptionId(inscriptionId);
    if (!normalizedId) {
        return null;
    }

    const cached = findWalletInscriptionById(walletContext, normalizedId);
    if (cached?.utxo) {
        return cached;
    }

    const resolvedFromProvidedDetails = resolveWalletInscriptionFromDetails(walletContext, normalizedId, inscriptionDetails);
    if (resolvedFromProvidedDetails) {
        return cacheWalletInscription(walletContext, resolvedFromProvidedDetails);
    }

    const walletAddresses = buildWalletAddressList(
        getOrdinalsAddress(walletContext),
        getPaymentAddress(walletContext)
    );

    const [portfolioGroups, details] = await Promise.all([
        walletAddresses.length > 0
            ? Promise.all(walletAddresses.map((address) => fetchAddressPortfolioHoldings(address, apiBase)))
            : Promise.resolve([]),
        fetchJson(`${normalizeBaseUrl(apiBase)}/inscription/${encodeURIComponent(normalizedId)}/details`)
            .catch(() => null)
    ]);

    const resolvedFromPortfolio = mergeWalletInscriptions(portfolioGroups.flat()).get(normalizedId) || null;
    if (resolvedFromPortfolio) {
        return cacheWalletInscription(walletContext, resolvedFromPortfolio);
    }

    const resolvedFromDetails = resolveWalletInscriptionFromDetails(walletContext, normalizedId, details);
    if (resolvedFromDetails) {
        return cacheWalletInscription(walletContext, resolvedFromDetails);
    }

    return null;
}

function resolveWalletSignerForInscription(walletContext, walletInscription) {
    const paymentSigner = getPaymentSigner(walletContext);
    const ordinalsSigner = getOrdinalsSigner(walletContext);
    const ownerAddress = normalizeAddressKey(walletInscription?.address);
    const paymentAddress = normalizeAddressKey(getPaymentAddress(walletContext));
    const ordinalsAddress = normalizeAddressKey(getOrdinalsAddress(walletContext));

    if (ownerAddress && ownerAddress === paymentAddress && paymentSigner?.address && paymentSigner?.publicKey) {
        return paymentSigner;
    }

    if (ownerAddress && ownerAddress === ordinalsAddress && ordinalsSigner?.address && ordinalsSigner?.publicKey) {
        return ordinalsSigner;
    }

    if (ordinalsSigner?.address && ordinalsSigner?.publicKey) {
        return ordinalsSigner;
    }

    if (paymentSigner?.address && paymentSigner?.publicKey) {
        return paymentSigner;
    }

    return ordinalsSigner || paymentSigner || null;
}

export async function signMessageWithXverse(message, address, protocol = 'BIP322') {
    const result = await runQueuedXverseWalletRequest(() => requestWithXverse('signMessage', {
        address: String(address || '').trim(),
        message: String(message || ''),
        protocol: String(protocol || 'BIP322').trim() || 'BIP322'
    }));

    const signature = String(
        result?.signature
        || result?.signatureBase64
        || result?.signature_base64
        || result?.messageSignature
        || ''
    ).trim();

    if (!signature) {
        throw new Error('Xverse did not return a wallet signature.');
    }

    return signature;
}

export async function signPsbtWithXverse(psbtBase64, toSignInputs = [], signer = null, options = {}) {
    const address = String(signer?.address || '').trim();
    if (!address) {
        throw new Error('Xverse signing requires a signer address.');
    }

    const preparedPsbtBase64 = ensureXverseTaprootKeyPathMetadata(psbtBase64, toSignInputs, signer);

    const signInputs = {};
    const addressIndices = (Array.isArray(toSignInputs) ? toSignInputs : [])
        .filter((input) => String(input?.address || address).trim() === address)
        .map((input) => Number(input.index))
        .filter((index) => Number.isInteger(index) && index >= 0);

    if (addressIndices.length > 0) {
        signInputs[address] = addressIndices;
    }

    const result = await runQueuedXverseWalletRequest(() => requestWithXverse('signPsbt', {
        psbt: preparedPsbtBase64,
        signInputs,
        broadcast: Boolean(options.broadcast),
        network: String(options.network || 'Mainnet').trim() || 'Mainnet'
    }));

    const signedPsbt = String(
        result?.psbt
        || result?.psbtBase64
        || result?.signedPsbt
        || result?.base64
        || ''
    ).trim();

    if (!signedPsbt) {
        throw new Error('Xverse did not return a signed PSBT.');
    }

    if (options.broadcast) {
        return {
            psbt: signedPsbt,
            txid: String(result?.txid || '').trim()
        };
    }

    return signedPsbt;
}

function ensureXverseTaprootKeyPathMetadata(psbtBase64, toSignInputs = [], signer = null) {
    const normalizedPsbt = String(psbtBase64 || '').trim();
    const tapInternalKey = normalizeTaprootInternalKeyHex(signer?.publicKey);
    const signerAddress = String(signer?.address || '').trim();

    if (!normalizedPsbt || !tapInternalKey || !signerAddress) {
        return normalizedPsbt;
    }

    let psbt;
    try {
        psbt = PsbtTransaction.fromPSBT(Base64Codec.decode(normalizedPsbt));
    } catch {
        return normalizedPsbt;
    }

    const signableIndexes = new Set(
        (Array.isArray(toSignInputs) ? toSignInputs : [])
            .filter((input) => String(input?.address || signerAddress).trim() === signerAddress)
            .map((input) => Number(input.index))
            .filter((index) => Number.isInteger(index) && index >= 0)
    );

    let didUpdate = false;
    for (const inputIndex of signableIndexes) {
        const existingInput = psbt.getInput(inputIndex);
        if (!needsTaprootEstimatorHint(existingInput)) {
            continue;
        }

        psbt.updateInput(inputIndex, {
            tapInternalKey: hexToBytes(tapInternalKey)
        });
        didUpdate = true;
    }

    return didUpdate ? Base64Codec.encode(psbt.toPSBT()) : normalizedPsbt;
}

export async function loadXverseWalletContext({
    connect = false,
    message = 'Connect to Blok Boutique.',
    network = 'Mainnet',
    mempoolBaseUrl = DEFAULT_MEMPOOL_BASE_URL,
    apiBase = DEFAULT_API_BASE,
    hydrateDetails = true
} = {}) {
    const account = await loadXverseAccount({ connect, message, network });
    if (!account?.ordinalsAddress || !account?.paymentAddress) {
        return null;
    }

    const paymentAddress = String(account.paymentAddress || '').trim();
    const ordinalsAddress = String(account.ordinalsAddress || paymentAddress).trim();
    const paymentPublicKey = String(account.paymentPublicKey || account.publicKey || '').trim();
    const ordinalsPublicKey = String(account.ordinalsPublicKey || paymentPublicKey || '').trim();
    const signatureMethod = inferXverseSignatureMethod(account.ordinalsAddressType, ordinalsAddress);
    const baseContext = {
        provider: 'xverse',
        address: paymentAddress,
        paymentAddress,
        ordinalsAddress,
        publicKey: paymentPublicKey,
        paymentPublicKey,
        ordinalsPublicKey,
        rawPublicKey: String(account.paymentRawPublicKey || paymentPublicKey).trim(),
        signer: { address: paymentAddress, publicKey: paymentPublicKey },
        paymentSigner: { address: paymentAddress, publicKey: paymentPublicKey },
        ordinalsSigner: { address: ordinalsAddress, publicKey: ordinalsPublicKey },
        signatureMethod,
        network: String(account.network || network).trim() || network,
        walletType: String(account.walletType || '').trim()
    };

    if (!hydrateDetails) {
        return {
            ...baseContext,
            inscriptions: [],
            inscriptionsById: new Map(),
            inscribedOutpoints: new Set(),
            utxos: null,
            utxoFetchError: '',
            detailsHydrated: false
        };
    }

    const portfolioAddresses = buildWalletAddressList(ordinalsAddress, paymentAddress);
    const portfolioPromise = Promise.all(
        portfolioAddresses.map((address) => fetchAddressPortfolioHoldings(address, apiBase))
    );
    const utxosPromise = fetchAddressUtxos(paymentAddress, mempoolBaseUrl)
        .then((utxos) => ({
            utxos,
            utxoFetchError: ''
        }))
        .catch((error) => ({
            utxos: null,
            utxoFetchError: formatErrorMessage(error)
        }));
    const [portfolioGroups, utxoResult] = await Promise.all([portfolioPromise, utxosPromise]);
    const inscriptionsById = mergeWalletInscriptions(portfolioGroups.flat());
    const inscriptions = Array.from(inscriptionsById.values());
    const inscribedOutpoints = new Set(
        inscriptions
            .map((item) => item.outpoint)
            .filter(Boolean)
    );

    return {
        ...baseContext,
        inscriptions,
        inscriptionsById,
        inscribedOutpoints,
        utxos: utxoResult.utxos,
        utxoFetchError: utxoResult.utxoFetchError,
        detailsHydrated: true
    };
}

export async function loadWalletContext({
    provider = 'unisat',
    connect = false,
    mempoolBaseUrl = DEFAULT_MEMPOOL_BASE_URL,
    apiBase = DEFAULT_API_BASE,
    hydrateDetails = true
} = {}) {
    const normalizedProvider = String(provider || '').trim().toLowerCase();
    if (normalizedProvider === 'xverse') {
        return loadXverseWalletContext({
            connect,
            mempoolBaseUrl,
            apiBase,
            hydrateDetails
        });
    }

    return loadUnisatWalletContext({
        connect,
        mempoolBaseUrl,
        apiBase,
        hydrateDetails
    });
}

export async function buildListingEntry({
    inscriptionId,
    priceSats,
    sellerPaymentsAddress,
    walletContext,
    inscriptionDetails = null,
    apiBase = DEFAULT_API_BASE,
    mempoolBaseUrl = DEFAULT_MEMPOOL_BASE_URL
}) {
    const normalizedId = normalizeInscriptionId(inscriptionId);
    const price = normalizePositiveInteger(priceSats);
    if (!price) throw new Error('A positive sale price is required.');

    const walletInscription = await resolveWalletInscription(walletContext, normalizedId, {
        apiBase,
        inscriptionDetails
    });
    if (!walletInscription) {
        throw new Error(`Inscription ${normalizedId} is not in the connected wallet.`);
    }
    const sellerSigner = resolveWalletSignerForInscription(walletContext, walletInscription);
    const payoutAddress = String(
        sellerPaymentsAddress
        || getPaymentAddress(walletContext)
        || sellerSigner?.address
        || ''
    ).trim();
    if (!payoutAddress) throw new Error('A payout address is required.');
    if (!sellerSigner?.address || !sellerSigner?.publicKey) {
        throw new Error('Connect a wallet with the address that controls this inscription before signing listings.');
    }

    const market = createMarketplaceRuntime({
        mempoolBaseUrl,
        walletContext,
        listingEntriesById: new Map([[normalizedId, { utxo: walletInscription.utxo }]])
    });

    const listingData = {
        inscriptionId: walletInscription.inscriptionId,
        sellerOrdinalsSigner: { ...sellerSigner },
        sellerPaymentsAddress: payoutAddress,
        price
    };

    const unsignedListing = await market.buildListing(listingData);
    const sellerSignedPsbt = await signPsbtWithWallet(unsignedListing.base64, unsignedListing.toSignInputs, sellerSigner, walletContext);

    return {
        inscriptionId: walletInscription.inscriptionId,
        priceSats: price,
        active: true,
        sellerSignedPsbt,
        listingData,
        sellerAddress: sellerSigner.address,
        sellerPaymentsAddress: payoutAddress,
        walletProvider: String(walletContext?.provider || '').trim().toLowerCase(),
        signatureMethod: String(walletContext?.signatureMethod || '').trim().toLowerCase(),
        utxo: {
            txid: walletInscription.utxo.txid,
            index: walletInscription.utxo.index,
            amount: Number(walletInscription.utxo.amount)
        },
        createdAt: new Date().toISOString()
    };
}

export async function buyListing({
    listingEntry,
    walletContext,
    mempoolBaseUrl = DEFAULT_MEMPOOL_BASE_URL,
    broadcastAuthPath = DEFAULT_BROADCAST_AUTH_PATH,
    feeTier = DEFAULT_FEE_TIER,
    marketRuntime = null,
    onStatus = null
}) {
    validateListingEntry(listingEntry);

    const paymentSigner = getPaymentSigner(walletContext);
    const receiveAddress = getOrdinalsAddress(walletContext);

    if (!paymentSigner?.address || !paymentSigner?.publicKey || !receiveAddress) {
        throw new Error('Connect a wallet with payment and ordinals addresses before buying.');
    }

    const market = marketRuntime || createMarketplaceRuntime({
        mempoolBaseUrl,
        broadcastAuthPath,
        walletContext,
        listingEntriesById: new Map([[normalizeInscriptionId(listingEntry.inscriptionId), listingEntry]])
    });

    if (typeof onStatus === 'function') {
        onStatus({
            step: 'preparing-purchase',
            message: 'Preparing purchase transaction...',
            tone: 'muted'
        });
    }

    const unsignedBuy = await market.buildBuyPsbt(
        [listingEntry.listingData],
        paymentSigner,
        receiveAddress,
        feeTier
    );

    if (typeof onStatus === 'function') {
        onStatus({
            step: 'confirm-purchase',
            message: 'Confirm purchase in wallet...',
            tone: 'muted'
        });
    }

    const signedBuyPsbt = await signPsbtWithWallet(unsignedBuy.base64, unsignedBuy.toSignInputs, paymentSigner, walletContext);
    const txid = await market.completeSale([listingEntry.sellerSignedPsbt], signedBuyPsbt, true);

    return {
        txid: String(txid || '').trim(),
        signedBuyPsbt
    };
}

export async function buildItemOfferEntry({
    inscriptionId,
    priceSats,
    sellerOrdinalsAddress,
    sellerPaymentsAddress,
    sellerUtxo,
    walletContext,
    mempoolBaseUrl = DEFAULT_MEMPOOL_BASE_URL,
    feeTier = DEFAULT_FEE_TIER
}) {
    const normalizedId = normalizeInscriptionId(inscriptionId);
    const price = normalizePositiveInteger(priceSats);
    const paymentSigner = getPaymentSigner(walletContext);
    const receiveAddress = getOrdinalsAddress(walletContext);
    const payoutAddress = String(sellerPaymentsAddress || sellerOrdinalsAddress || '').trim();
    const sellerAddress = String(sellerOrdinalsAddress || '').trim();
    const sellerAmount = normalizePositiveInteger(sellerUtxo?.amount);
    const sellerIndex = Number(sellerUtxo?.index);
    const sellerTxid = String(sellerUtxo?.txid || '').trim();

    if (!normalizedId) throw new Error('A tracked inscription id is required for item offers.');
    if (!price) throw new Error('A positive offer price is required.');
    if (!paymentSigner?.address || !receiveAddress) {
        throw new Error('Connect a wallet with payment and ordinals addresses before placing an offer.');
    }
    if (!sellerAddress || !payoutAddress) {
        throw new Error('The current inscription owner address is required for this offer.');
    }
    if (!sellerTxid || !Number.isInteger(sellerIndex) || sellerIndex < 0 || !sellerAmount) {
        throw new Error('The current inscription output could not be resolved for this offer.');
    }

    const market = createMarketplaceRuntime({
        mempoolBaseUrl,
        walletContext,
        listingEntriesById: new Map([[
            normalizedId,
            {
                utxo: {
                    txid: sellerTxid,
                    index: sellerIndex,
                    amount: sellerAmount
                }
            }
        ]])
    });

    const unsignedBid = await market.buildBidPsbt(
        {
            inscriptionId: normalizedId,
            sellerOrdinalsSigner: {
                address: sellerAddress
            },
            sellerPaymentsAddress: payoutAddress,
            price
        },
        paymentSigner,
        receiveAddress,
        feeTier
    );

    const buyerSignedPsbt = await signPsbtWithWallet(
        unsignedBid.base64,
        unsignedBid.toSignInputs,
        paymentSigner,
        walletContext
    );

    return {
        inscriptionId: normalizedId,
        priceSats: price,
        buyerSignedPsbt,
        sellerAddress,
        sellerPaymentsAddress: payoutAddress,
        utxo: {
            txid: sellerTxid,
            index: sellerIndex,
            amount: sellerAmount
        }
    };
}

export async function signAcceptedOfferPsbt({
    buyerSignedPsbt,
    walletContext,
    inscriptionId = '',
    sellerAddress = ''
}) {
    const normalizedSellerAddress = String(sellerAddress || '').trim();
    const signer = normalizedSellerAddress
        ? resolveWalletSignerForInscription(walletContext, {
            id: normalizeInscriptionId(inscriptionId),
            address: normalizedSellerAddress
        })
        : (getOrdinalsSigner(walletContext) || getPaymentSigner(walletContext));

    if (!signer?.address) {
        throw new Error('Connect a wallet with an ordinals signer before accepting an offer.');
    }

    return signPsbtWithWallet(
        String(buyerSignedPsbt || '').trim(),
        [
            {
                index: 0,
                address: signer.address,
                sighashType: SIGHASH_ALL,
                disableTweakSigner: false,
                autoFinalized: true
            }
        ],
        signer,
        walletContext
    );
}

export async function prepareDummyUtxos({
    walletContext,
    count = 2,
    mempoolBaseUrl = DEFAULT_MEMPOOL_BASE_URL,
    feeTier = DEFAULT_FEE_TIER,
    onStatus = null,
    marketRuntime = null
}) {
    const paymentSigner = getPaymentSigner(walletContext);
    if (!paymentSigner?.address || !paymentSigner?.publicKey) {
        throw new Error('Connect a wallet with a payment signer before preparing dummy UTXOs.');
    }

    const desiredCount = Math.max(1, normalizePositiveInteger(count) || 0);
    const market = marketRuntime || createMarketplaceRuntime({
        mempoolBaseUrl,
        walletContext,
        listingEntriesById: new Map()
    });

    const alreadyReady = await market.checkDummyUtxos(getPaymentAddress(walletContext), desiredCount);
    if (alreadyReady) return { alreadyReady: true, txid: '' };

    if (typeof onStatus === 'function') {
        const dummyUtxoValue = Number(market?.utxoManager?.dummyUtxoValue || 600n);
        onStatus({
            step: 'preparing-dummy-utxos',
            message: `Preparing ${desiredCount} x ${dummyUtxoValue}-sat dummy UTXO transaction...`,
            tone: 'muted'
        });
    }

    const unsignedPsbt = await market.buildGenerateDummyUTXOs(paymentSigner, desiredCount, feeTier);
    let txid = '';

    if (typeof onStatus === 'function') {
        const dummyUtxoValue = Number(market?.utxoManager?.dummyUtxoValue || 600n);
        onStatus({
            step: 'confirm-dummy-utxos',
            message: `Confirm creation of ${desiredCount} x ${dummyUtxoValue}-sat dummy UTXOs in wallet...`,
            tone: 'muted'
        });
    }

    if (String(walletContext?.provider || '').trim().toLowerCase() === 'xverse') {
        const broadcastResult = await signPsbtWithXverse(unsignedPsbt.base64, unsignedPsbt.toSignInputs, paymentSigner, {
            broadcast: true,
            network: walletContext?.network || 'Mainnet'
        });
        txid = String(broadcastResult?.txid || '').trim();
    } else {
        const signedPsbt = await signPsbtWithWallet(unsignedPsbt.base64, unsignedPsbt.toSignInputs, paymentSigner, walletContext);
        txid = await pushPsbtWithWallet(signedPsbt, walletContext);
    }

    return {
        alreadyReady: false,
        txid: String(txid || '').trim()
    };
}

export async function checkListingSpent(listingEntry, mempoolBaseUrl = DEFAULT_MEMPOOL_BASE_URL) {
    const txid = String(listingEntry?.utxo?.txid || '').trim();
    const index = Number(listingEntry?.utxo?.index);
    if (!txid || !Number.isInteger(index) || index < 0) return false;

    const payload = await fetchJson(`${normalizeBaseUrl(mempoolBaseUrl)}/tx/${encodeURIComponent(txid)}/outspend/${index}`);
    return Boolean(payload && payload.spent);
}

async function signPsbtWithWallet(psbtBase64, toSignInputs, signer, walletContext) {
    const provider = String(walletContext?.provider || 'unisat').trim().toLowerCase();
    if (provider === 'xverse') {
        return signPsbtWithXverse(psbtBase64, toSignInputs, signer, {
            network: walletContext?.network || 'Mainnet'
        });
    }

    return signPsbtWithUnisat(psbtBase64, toSignInputs, signer);
}

async function pushPsbtWithWallet(psbtBase64, walletContext) {
    const provider = String(walletContext?.provider || 'unisat').trim().toLowerCase();
    if (provider === 'xverse') {
        throw new Error('Xverse PSBT broadcasting requires the broadcast flag during signing.');
    }

    return pushPsbtWithUnisat(psbtBase64);
}

async function signMessageWithWallet(message, signer, walletContext, signatureMethod = 'ecdsa') {
    const provider = String(walletContext?.provider || 'unisat').trim().toLowerCase();
    if (provider === 'xverse') {
        const protocol = String(signatureMethod || walletContext?.signatureMethod || 'BIP322').trim().toUpperCase();
        return signMessageWithXverse(message, signer?.address, protocol);
    }

    return signMessageWithUnisat(message, signatureMethod);
}

function getPaymentSigner(walletContext) {
    return walletContext?.paymentSigner || walletContext?.signer || null;
}

function getOrdinalsSigner(walletContext) {
    return walletContext?.ordinalsSigner || walletContext?.signer || null;
}

function getPaymentAddress(walletContext) {
    return String(
        walletContext?.paymentAddress
        || walletContext?.address
        || walletContext?.paymentSigner?.address
        || walletContext?.signer?.address
        || ''
    ).trim();
}

function getOrdinalsAddress(walletContext) {
    return String(
        walletContext?.ordinalsAddress
        || walletContext?.receiveAddress
        || walletContext?.address
        || walletContext?.ordinalsSigner?.address
        || walletContext?.signer?.address
        || ''
    ).trim();
}

function shouldUseCompactSingleBuyLayout(paymentAddress, receiveAddress) {
    const normalizedPaymentAddress = normalizeAddressKey(paymentAddress);
    const normalizedReceiveAddress = normalizeAddressKey(receiveAddress);
    return Boolean(
        normalizedPaymentAddress
        && normalizedReceiveAddress
        && normalizedPaymentAddress === normalizedReceiveAddress
    );
}

export function createMarketplaceRuntime({ mempoolBaseUrl, broadcastAuthPath, walletContext, listingEntriesById }) {
    const market = new OrdinalsMarketplace({
        rpcUrls: ['https://unused.invalid'],
        mempoolUrl: normalizeBaseUrl(mempoolBaseUrl),
        fees: {
            minAmount: 0,
            makerPercentage: 0,
            takerPercentage: 0,
            receiveAddress: getOrdinalsAddress(walletContext) || FALLBACK_RECEIVE_ADDRESS
        }
    });

    patchMarketplaceRuntime(market, { mempoolBaseUrl, broadcastAuthPath, walletContext, listingEntriesById });
    return market;
}

function patchMarketplaceRuntime(market, { mempoolBaseUrl, broadcastAuthPath, walletContext, listingEntriesById }) {
    const baseUrl = normalizeBaseUrl(mempoolBaseUrl);
    const walletUtxosByAddress = new Map();
    const utxoFetchesByAddress = new Map();
    let recommendedFeesPromise = null;

    if (getPaymentAddress(walletContext) && Array.isArray(walletContext.utxos)) {
        walletUtxosByAddress.set(
            getPaymentAddress(walletContext),
            walletContext.utxos.map(cloneUtxo)
        );
    }

    const inscribedOutpoints = new Set(walletContext?.inscribedOutpoints || []);

    // Buyer funding excludes sub-11k UTXOs so small inscription-bearing outputs are never pulled in by accident.
    async function collectSafeFundingUtxos(address, allowUnsafe = false, excludedOutpoints = new Set()) {
        const utxos = await market.utxoManager.getUtxos(address);
        const safe = [];

        for (const utxo of utxos) {
            if (!utxo) continue;
            if (excludedOutpoints.has(formatOutpoint(utxo.txid, utxo.index))) continue;
            if (typeof market.utxoManager.inDummyRange === 'function' && market.utxoManager.inDummyRange(utxo)) continue;
            if (!allowUnsafe && Number(utxo?.confirmations || 0) === 0) continue;
            if (normalizeUtxoAmount(utxo?.amount) < MIN_SAFE_BUYER_FUNDING_UTXO_SATS) continue;
            if (await market.utxoManager.utxoHaveAssets(utxo, allowUnsafe)) continue;
            safe.push(cloneUtxo(utxo));
        }

        return safe;
    }

    market.bitcoinRpc.getRawTransaction = async (txid) => {
        const response = await fetch(`${baseUrl}/tx/${encodeURIComponent(txid)}/hex`, { cache: 'no-store' });
        if (!response.ok) {
            throw new Error(`Failed to load transaction ${txid} (${response.status} ${response.statusText})`);
        }
        return (await response.text()).trim();
    };

    market.bitcoinRpc.sendRawTransaction = async (rawHex) => {
        const auth = await createBroadcastAuthorization({
            rawHex,
            walletContext,
            broadcastAuthPath
        });
        const response = await fetch(`${baseUrl}/tx`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                rawHex: String(rawHex || '').trim(),
                auth
            })
        });

        const body = (await response.text()).trim();
        if (!response.ok) {
            throw new Error(body || `Broadcast failed (${response.status})`);
        }

        return body;
    };

    market.bitcoinRpc.testMempoolAccept = async () => {
        throw new Error('Local mempool acceptance checks are not available in this storefront.');
    };

    async function getRecommendedFees() {
        if (!recommendedFeesPromise) {
            recommendedFeesPromise = fetchJson(`${baseUrl}/fees/recommended`).catch((error) => {
                recommendedFeesPromise = null;
                throw error;
            });
        }

        return recommendedFeesPromise;
    }

    market.mempoolService.getRecommendedFees = async () => {
        const payload = await getRecommendedFees();
        return {
            fastestFee: normalizePositiveInteger(payload?.fastestFee) || 8,
            halfHourFee: normalizePositiveInteger(payload?.halfHourFee) || 4,
            hourFee: normalizePositiveInteger(payload?.hourFee) || 2,
            economyFee: normalizePositiveInteger(payload?.economyFee) || 1,
            minimumFee: normalizePositiveInteger(payload?.minimumFee) || 1
        };
    };

    market.mempoolService.getRecommendedFee = async (tier = DEFAULT_FEE_TIER) => {
        const directRate = normalizePositiveInteger(tier);
        if (directRate > 0) {
            return directRate;
        }

        const fees = await market.mempoolService.getRecommendedFees();
        const normalizedTier = String(tier || DEFAULT_FEE_TIER).trim();
        return normalizePositiveInteger(fees?.[normalizedTier]) || fees.halfHourFee || 4;
    };

    market.utxoManager.getUtxos = async (address) => {
        const normalizedAddress = String(address || '').trim();
        if (walletUtxosByAddress.has(normalizedAddress)) {
            return walletUtxosByAddress.get(normalizedAddress).map(cloneUtxo);
        }

        if (!utxoFetchesByAddress.has(normalizedAddress)) {
            utxoFetchesByAddress.set(
                normalizedAddress,
                fetchAddressUtxos(normalizedAddress, baseUrl)
                    .then((utxos) => {
                        const normalizedUtxos = Array.isArray(utxos) ? utxos.map(cloneUtxo) : [];
                        walletUtxosByAddress.set(normalizedAddress, normalizedUtxos);
                        return normalizedUtxos;
                    })
                    .finally(() => {
                        utxoFetchesByAddress.delete(normalizedAddress);
                    })
            );
        }

        const fetchedUtxos = await utxoFetchesByAddress.get(normalizedAddress);
        return Array.isArray(fetchedUtxos) ? fetchedUtxos.map(cloneUtxo) : [];
    };

    market.utxoManager.fetchPaymentUtxos = async (address) => {
        return collectSafeFundingUtxos(address, false);
    };

    market.utxoManager.outputHaveAssets = async (outpoint) => {
        return inscribedOutpoints.has(normalizeOutpoint(outpoint));
    };

    market.utxoManager.utxoHaveAssets = async (utxo, allowUnsafe = false) => {
        if (!allowUnsafe && Number(utxo?.confirmations || 0) === 0) return true;
        return inscribedOutpoints.has(formatOutpoint(utxo?.txid, utxo?.index));
    };

    market.calculateFees = () => ({
        makerFee: 0,
        takerFee: 0,
        marketplaceFee: 0
    });

    market.buildGenerateDummyUTXOs = async function buildGenerateDummyUTXOsNoDust(buyerPaymentsSigner, count, feeTier, allowUnsafe = false) {
        const paymentAddress = String(buyerPaymentsSigner?.address || '').trim();
        if (!paymentAddress) throw new Error('Missing buyer payment address.');

        const desiredCount = Math.max(1, normalizePositiveInteger(count) || 0);
        const utxos = await this.utxoManager.getUtxos(paymentAddress);
        const existingDummyUtxos = await this.utxoManager.selectDummyUtxos(utxos, desiredCount, allowUnsafe);
        const missingDummyCount = desiredCount - existingDummyUtxos.length;

        if (missingDummyCount <= 0) {
            throw new Error('You already have enough dummy UTXOs.');
        }

        const excludedOutpoints = new Set(existingDummyUtxos.map((utxo) => formatOutpoint(utxo.txid, utxo.index)).filter(Boolean));
        const fundingUtxos = await collectSafeFundingUtxos(paymentAddress, allowUnsafe, excludedOutpoints);

        if (fundingUtxos.length === 0) {
            throw new Error('No confirmed UTXOs of at least 11,000 sats are available.\nSub-11,000 sat UTXOs are blocked from buyer funding to prevent spending inscriptions accidentally.');
        }

        const tx = this.createTransaction();

        for (let index = 0; index < missingDummyCount; index += 1) {
            tx.addOutput(paymentAddress, this.utxoManager.dummyUtxoValue);
        }

        await tx.addPayment(fundingUtxos, buyerPaymentsSigner, feeTier || DEFAULT_FEE_TIER, null, allowUnsafe);
        return tx.toPSBT([paymentAddress]);
    };

    market.getListingTransactionData = async (inscriptionId) => {
        const entry = listingEntriesById.get(normalizeInscriptionId(inscriptionId));
        if (!entry?.utxo) {
            throw new Error(`Listing data is missing for inscription ${inscriptionId}`);
        }

        const txid = String(entry.utxo.txid || '').trim();
        const index = Number(entry.utxo.index);
        const amount = BigInt(normalizePositiveInteger(entry.utxo.amount) || 0);

        if (!txid || !Number.isInteger(index) || index < 0 || amount <= 0n) {
            throw new Error(`Listing UTXO is invalid for inscription ${inscriptionId}`);
        }

        return {
            utxo: {
                txid,
                index,
                amount,
                confirmations: 1
            },
            inscriptionValue: Number(amount)
        };
    };

    market.buildBuyPsbt = async function buildBuyPsbtNoMarketplaceFee(listings, buyerPaymentsSigner, buyerOrdinalsAddress, feeTier, allowUnsafe = false) {
        const paymentAddress = String(buyerPaymentsSigner?.address || '').trim();
        if (!paymentAddress) throw new Error('Missing buyer payment address.');
        const receiveAddress = String(buyerOrdinalsAddress || '').trim();
        if (!receiveAddress) throw new Error('Missing buyer ordinals receive address.');
        const normalizedListings = Array.isArray(listings) ? listings.filter(Boolean) : [];
        if (normalizedListings.length === 0) {
            throw new Error('At least one listing is required.');
        }
        const useCompactSingleBuyLayout = normalizedListings.length === 1
            && shouldUseCompactSingleBuyLayout(paymentAddress, receiveAddress);
        const dummyCount = useCompactSingleBuyLayout
            ? 1
            : normalizedListings.length + DUMMY_UTXO_EXTRA_COUNT;

        const tx = this.createTransaction();
        const utxos = await this.utxoManager.getUtxos(paymentAddress);
        const dummyUtxos = await this.utxoManager.selectDummyUtxos(utxos, dummyCount, allowUnsafe);

        if (dummyUtxos.length < dummyCount) {
            throw new Error(`You need ${dummyCount} confirmed 600-sat dummy UTXOs in the connected wallet.`);
        }

        for (const utxo of dummyUtxos) {
            await tx.addInput(utxo, buyerPaymentsSigner, SIGHASH_ALL);
        }

        const totalDummyAmount = dummyUtxos.reduce((sum, utxo) => sum + BigInt(utxo.amount), 0n);

        if (useCompactSingleBuyLayout) {
            const { inscriptionId, sellerOrdinalsSigner, sellerPaymentsAddress, price } = normalizedListings[0];
            const { utxo, inscriptionValue } = await this.getListingTransactionData(inscriptionId);

            await tx.addInput(utxo, sellerOrdinalsSigner, SIGHASH_SINGLE_ANYONECANPAY);

            // The leading dummy input keeps the seller payout at output index 1 while this
            // first buyer output absorbs the dummy sats, so the inscription still lands here.
            tx.addOutput(receiveAddress, totalDummyAmount + BigInt(inscriptionValue));
            tx.addOutput(
                String(sellerPaymentsAddress || '').trim(),
                BigInt(Number(price) + Number(inscriptionValue))
            );
        } else {
            tx.addOutput(paymentAddress, totalDummyAmount);

            const sellerPayments = [];

            for (const listing of normalizedListings) {
                const { inscriptionId, sellerOrdinalsSigner, sellerPaymentsAddress, price } = listing;
                const { utxo, inscriptionValue } = await this.getListingTransactionData(inscriptionId);

                await tx.addInput(utxo, sellerOrdinalsSigner, SIGHASH_SINGLE_ANYONECANPAY);
                tx.addOutput(receiveAddress, BigInt(inscriptionValue));

                sellerPayments.push({
                    address: String(sellerPaymentsAddress || '').trim(),
                    amount: BigInt(Number(price) + Number(inscriptionValue))
                });
            }

            for (const payment of sellerPayments) {
                tx.addOutput(payment.address, payment.amount);
            }
        }

        for (let index = 0; index < dummyUtxos.length; index += 1) {
            tx.addOutput(paymentAddress, this.utxoManager.dummyUtxoValue);
        }

        const excludedOutpoints = new Set(dummyUtxos.map((utxo) => formatOutpoint(utxo.txid, utxo.index)).filter(Boolean));
        const fundingUtxos = await collectSafeFundingUtxos(paymentAddress, allowUnsafe, excludedOutpoints);

        if (fundingUtxos.length === 0) {
            throw new Error('No confirmed UTXOs of at least 11,000 sats are available.\nSub-11,000 sat UTXOs are blocked from buyer funding to prevent spending inscriptions accidentally.');
        }

        await tx.addPayment(fundingUtxos, buyerPaymentsSigner, feeTier || DEFAULT_FEE_TIER, null, allowUnsafe);
        return tx.toPSBT([paymentAddress]);
    };

    market.completeSale = async function completeSaleNoMarketplaceFee(sellerSignedPsbts, buyerSignedPsbt, broadcast = false) {
        const buyerPsbt = PsbtTransaction.fromPSBT(Base64Codec.decode(String(buyerSignedPsbt || '').trim()));
        const sellerPsbtList = Array.isArray(sellerSignedPsbts) ? sellerSignedPsbts : [];
        const useCompactSingleBuyLayout = sellerPsbtList.length === 1
            && shouldUseCompactSingleBuyLayout(getPaymentAddress(walletContext), getOrdinalsAddress(walletContext));
        const sellerInputOffset = useCompactSingleBuyLayout ? 1 : sellerPsbtList.length + 1;

        for (let index = 0; index < sellerPsbtList.length; index += 1) {
            const sellerPsbt = PsbtTransaction.fromPSBT(Base64Codec.decode(String(sellerPsbtList[index] || '').trim()));
            buyerPsbt.updateInput(sellerInputOffset + index, sellerPsbt.getInput(0));
        }

        buyerPsbt.finalize();
        return (broadcast ? this.bitcoinRpc.sendRawTransaction.bind(this.bitcoinRpc) : this.bitcoinRpc.testMempoolAccept.bind(this.bitcoinRpc))(buyerPsbt.hex);
    };

    market.buildBidPsbt = async function buildBidPsbtNoMarketplaceFee(bid, buyerPaymentsSigner, buyerOrdinalsAddress, feeTier, allowUnsafe = false) {
        const paymentAddress = String(buyerPaymentsSigner?.address || '').trim();
        if (!paymentAddress) throw new Error('Missing buyer payment address.');

        const {
            inscriptionId,
            sellerOrdinalsSigner,
            sellerPaymentsAddress,
            price
        } = bid || {};
        const sellerAddress = String(sellerOrdinalsSigner?.address || '').trim();
        const payoutAddress = String(sellerPaymentsAddress || '').trim();
        const receiveAddress = String(buyerOrdinalsAddress || '').trim();
        const normalizedPrice = normalizePositiveInteger(price);

        if (!sellerAddress) throw new Error('Missing seller ordinals address.');
        if (!payoutAddress) throw new Error('Missing seller payout address.');
        if (!receiveAddress) throw new Error('Missing buyer ordinals receive address.');
        if (!normalizedPrice) throw new Error('Missing bid price.');

        const tx = this.createTransaction();
        const { utxo, inscriptionValue } = await this.getListingTransactionData(inscriptionId);
        tx.inputs.push({
            address: sellerAddress,
            data: await buildOfferSellerInputData(this, utxo, sellerAddress, SIGHASH_ALL)
        });
        tx.addOutput(receiveAddress, BigInt(inscriptionValue));
        tx.addOutput(payoutAddress, BigInt(normalizedPrice + inscriptionValue));

        const fundingUtxos = await collectSafeFundingUtxos(paymentAddress, allowUnsafe);
        if (fundingUtxos.length === 0) {
            throw new Error('No confirmed UTXOs of at least 11,000 sats are available.\nSub-11,000 sat UTXOs are blocked from buyer funding to prevent spending inscriptions accidentally.');
        }

        const cleanupEstimatorHints = addTemporaryTaprootEstimatorHints(tx.inputs.map((input) => input?.data));
        try {
            await tx.addPayment(fundingUtxos, buyerPaymentsSigner, feeTier || DEFAULT_FEE_TIER, null, allowUnsafe);
        } finally {
            cleanupEstimatorHints();
        }
        return tx.toPSBT([paymentAddress]);
    };
}

async function fetchAllUnisatInscriptions() {
    assertUnisatAvailable();

    const pageSize = 60;
    const all = [];
    let offset = 0;
    let total = null;

    while (true) {
        const payload = await window.unisat.getInscriptions(offset, pageSize);
        const items = Array.isArray(payload?.list)
            ? payload.list
            : Array.isArray(payload)
                ? payload
                : [];

        if (total === null) total = Number(payload?.total || items.length || 0);
        all.push(...items);

        if (items.length === 0 || all.length >= total) break;
        offset += items.length;
    }

    return all;
}

function normalizeWalletInscription(item) {
    const inscriptionId = normalizeInscriptionId(item?.inscriptionId || item?.id);
    const outpoint = normalizeOutpoint(item?.output || item?.location);
    const location = String(item?.location || `${outpoint}:0`).trim();
    const outputValue = normalizePositiveInteger(item?.outputValue || item?.value);
    const utxo = parseUtxoFromLocation(location, outputValue);

    return {
        inscriptionId,
        address: String(item?.address || '').trim(),
        outpoint,
        location,
        utxo,
        outputValue: outputValue || 0,
        preview: String(item?.preview || item?.content || '').trim()
    };
}

async function fetchAddressUtxos(address, mempoolBaseUrl) {
    if (!address) return [];

    const payload = await fetchJson(`${normalizeBaseUrl(mempoolBaseUrl)}/address/${encodeURIComponent(address)}/utxo`);
    const utxos = Array.isArray(payload) ? payload : [];

    return utxos.map((utxo) => ({
        txid: String(utxo?.txid || '').trim(),
        index: Number(utxo?.vout),
        amount: BigInt(normalizePositiveInteger(utxo?.value) || 0),
        confirmations: utxo?.status?.confirmed ? 1 : 0
    })).filter((utxo) => utxo.txid && Number.isInteger(utxo.index) && utxo.index >= 0 && utxo.amount > 0n);
}

async function fetchJson(url, options) {
    const response = await fetch(url, { cache: 'no-store', ...options });
    if (!response.ok) {
        throw new Error(`Request failed for ${url} (${response.status} ${response.statusText})`);
    }

    return response.json();
}

async function createBroadcastAuthorization({
    rawHex,
    walletContext,
    broadcastAuthPath = DEFAULT_BROADCAST_AUTH_PATH
}) {
    const buyerAddress = getPaymentAddress(walletContext);
    const buyerOrdinalsAddress = getOrdinalsAddress(walletContext);
    const buyerPublicKey = String(walletContext?.paymentPublicKey || walletContext?.rawPublicKey || getPaymentSigner(walletContext)?.publicKey || '').trim();
    const signatureMethod = String(walletContext?.signatureMethod || 'ecdsa').trim().toLowerCase() || 'ecdsa';
    const walletProvider = String(walletContext?.provider || 'unisat').trim().toLowerCase() || 'unisat';

    if (!buyerAddress || !buyerPublicKey || !buyerOrdinalsAddress) {
        throw new Error('Wallet signer details are missing for broadcast authorization.');
    }

    const challenge = await requestBroadcastChallenge({
        buyerAddress,
        buyerPublicKey,
        buyerOrdinalsAddress,
        walletProvider,
        signatureMethod,
        rawHex,
        broadcastAuthPath
    });
    const signature = String(await signMessageWithWallet(challenge.message, getPaymentSigner(walletContext), walletContext, signatureMethod) || '').trim();

    if (!signature) {
        throw new Error('Wallet did not return a broadcast authorization signature.');
    }

    return {
        nonce: String(challenge.nonce || '').trim(),
        message: String(challenge.message || '').trim(),
        signature,
        buyerAddress,
        buyerPublicKey,
        buyerOrdinalsAddress,
        walletProvider,
        signatureMethod,
        txid: String(challenge.txid || '').trim(),
        issuedAt: String(challenge.issuedAt || '').trim()
    };
}

async function requestBroadcastChallenge({
    buyerAddress,
    buyerPublicKey,
    buyerOrdinalsAddress,
    walletProvider,
    signatureMethod,
    rawHex,
    broadcastAuthPath = DEFAULT_BROADCAST_AUTH_PATH
}) {
    const response = await fetch(String(broadcastAuthPath || DEFAULT_BROADCAST_AUTH_PATH), {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            buyerAddress,
            buyerPublicKey,
            buyerOrdinalsAddress,
            walletProvider,
            signatureMethod,
            rawHex: String(rawHex || '').trim()
        })
    });
    const body = (await response.text()).trim();

    if (!response.ok) {
        throw new Error(body || `Failed to create a broadcast authorization challenge (${response.status}).`);
    }

    try {
        return JSON.parse(body);
    } catch {
        throw new Error('Broadcast authorization challenge response was not valid JSON.');
    }
}

function parseUtxoFromLocation(location, value) {
    const [txid, vout] = String(location || '').trim().split(':');
    const index = Number(vout);
    const amount = BigInt(normalizePositiveInteger(value) || 0);

    if (!txid || !Number.isInteger(index) || index < 0 || amount <= 0n) return null;

    return {
        txid,
        index,
        amount,
        confirmations: 1
    };
}

function cloneUtxo(utxo) {
    return {
        txid: String(utxo?.txid || '').trim(),
        index: Number(utxo?.index),
        amount: BigInt(utxo?.amount ?? 0),
        confirmations: Number(utxo?.confirmations || 0)
    };
}

async function buildOfferSellerInputData(market, utxo, address, sighashType = SIGHASH_ALL) {
    const normalizedAddress = String(address || '').trim();
    const txid = String(utxo?.txid || '').trim();
    const index = Number(utxo?.index);
    const amount = BigInt(utxo?.amount ?? 0);

    if (!normalizedAddress) {
        throw new Error('The seller address is required for this offer.');
    }
    if (!txid || !Number.isInteger(index) || index < 0 || amount <= 0n) {
        throw new Error('The seller inscription output is incomplete for this offer.');
    }

    const output = await buildSellerPsbtOutputData(market, normalizedAddress, txid, amount);
    return {
        txid,
        index,
        sighashType,
        ...output
    };
}

async function buildSellerPsbtOutputData(market, address, txid, amount) {
    const decodedAddress = decodeBitcoinOutputAddress(address);

    if (decodedAddress.type === 'p2pkh') {
        const rawHex = await market.bitcoinRpc.getRawTransaction(txid);
        return {
            nonWitnessUtxo: hexToBytes(rawHex)
        };
    }

    if (decodedAddress.type === 'p2sh') {
        throw new Error('P2SH seller addresses are not supported for item offers because the redeem script is unavailable.');
    }

    if (decodedAddress.type === 'p2wsh') {
        throw new Error('P2WSH seller addresses are not supported for item offers because the witness script is unavailable.');
    }

    return {
        witnessUtxo: {
            script: decodedAddress.script,
            amount
        }
    };
}

function decodeBitcoinOutputAddress(address) {
    const normalizedAddress = String(address || '').trim();
    if (!normalizedAddress) {
        throw new Error('Bitcoin address is required.');
    }

    if (/^(bc|tb|bcrt)1/i.test(normalizedAddress)) {
        return decodeSegwitOutputAddress(normalizedAddress);
    }

    return decodeBase58OutputAddress(normalizedAddress);
}

function decodeBase58OutputAddress(address) {
    const decoded = decodeBase58(address);
    if (decoded.length !== 25) {
        throw new Error(`Unsupported Bitcoin address: ${address}`);
    }

    const version = decoded[0];
    const payload = decoded.slice(1, decoded.length - 4);
    if (payload.length !== 20) {
        throw new Error(`Unsupported Bitcoin address: ${address}`);
    }

    if (version === 0x00 || version === 0x6f) {
        return {
            type: 'p2pkh',
            script: buildP2pkhScript(payload)
        };
    }

    if (version === 0x05 || version === 0xc4) {
        return {
            type: 'p2sh',
            script: buildP2shScript(payload)
        };
    }

    throw new Error(`Unsupported Bitcoin address: ${address}`);
}

function decodeSegwitOutputAddress(address) {
    const normalizedAddress = String(address || '').trim();
    const lowerCaseAddress = normalizedAddress.toLowerCase();

    if (normalizedAddress !== lowerCaseAddress && normalizedAddress !== normalizedAddress.toUpperCase()) {
        throw new Error(`Invalid mixed-case Bitcoin address: ${address}`);
    }

    const separatorIndex = lowerCaseAddress.lastIndexOf('1');
    if (separatorIndex <= 0 || separatorIndex + 7 > lowerCaseAddress.length) {
        throw new Error(`Unsupported Bitcoin address: ${address}`);
    }

    const hrp = lowerCaseAddress.slice(0, separatorIndex);
    const data = Array.from(lowerCaseAddress.slice(separatorIndex + 1), (character) => {
        const value = BECH32_CHARSET.indexOf(character);
        if (value === -1) {
            throw new Error(`Unsupported Bitcoin address: ${address}`);
        }
        return value;
    });
    const checksum = bech32Polymod([...bech32HrpExpand(hrp), ...data]);
    const encoding = checksum === BECH32_CONST
        ? 'bech32'
        : checksum === BECH32M_CONST
            ? 'bech32m'
            : '';
    if (!encoding) {
        throw new Error(`Unsupported Bitcoin address: ${address}`);
    }

    const payload = data.slice(0, -6);
    const version = payload[0];
    if (!Number.isInteger(version) || version < 0 || version > 16) {
        throw new Error(`Unsupported Bitcoin address: ${address}`);
    }

    const program = convertBits(payload.slice(1), 5, 8, false);
    if (version === 0) {
        if (encoding !== 'bech32') {
            throw new Error(`Unsupported Bitcoin address: ${address}`);
        }
        if (program.length === 20) {
            return {
                type: 'p2wpkh',
                script: buildSegwitScript(version, program)
            };
        }
        if (program.length === 32) {
            return {
                type: 'p2wsh',
                script: buildSegwitScript(version, program)
            };
        }
    }

    if (version === 1 && program.length === 32) {
        if (encoding !== 'bech32m') {
            throw new Error(`Unsupported Bitcoin address: ${address}`);
        }
        return {
            type: 'p2tr',
            script: buildSegwitScript(version, program)
        };
    }

    throw new Error(`Unsupported Bitcoin address: ${address}`);
}

function decodeBase58(value) {
    const normalized = String(value || '').trim();
    if (!normalized) {
        throw new Error('Bitcoin address is required.');
    }

    let parsed = 0n;
    for (const character of normalized) {
        const digit = BASE58_ALPHABET.indexOf(character);
        if (digit === -1) {
            throw new Error(`Unsupported Bitcoin address: ${value}`);
        }
        parsed = (parsed * 58n) + BigInt(digit);
    }

    let hex = parsed.toString(16);
    if (hex.length % 2 !== 0) {
        hex = `0${hex}`;
    }

    const bytes = hex ? hexToBytes(hex) : new Uint8Array(0);
    let leadingZeroCount = 0;
    while (leadingZeroCount < normalized.length && normalized[leadingZeroCount] === '1') {
        leadingZeroCount += 1;
    }

    if (leadingZeroCount === 0) {
        return bytes;
    }

    const prefixed = new Uint8Array(leadingZeroCount + bytes.length);
    prefixed.set(bytes, leadingZeroCount);
    return prefixed;
}

function buildP2pkhScript(hash) {
    return new Uint8Array([0x76, 0xa9, 0x14, ...hash, 0x88, 0xac]);
}

function buildP2shScript(hash) {
    return new Uint8Array([0xa9, 0x14, ...hash, 0x87]);
}

function buildSegwitScript(version, program) {
    const versionOpcode = version === 0 ? 0x00 : 0x50 + version;
    return new Uint8Array([versionOpcode, program.length, ...program]);
}

function addTemporaryTaprootEstimatorHints(inputs) {
    const cleanupCallbacks = [];

    for (const input of Array.isArray(inputs) ? inputs : []) {
        if (!needsTaprootEstimatorHint(input)) {
            continue;
        }

        const tapInternalKey = extractTaprootKeyFromScript(input?.witnessUtxo?.script);
        if (!tapInternalKey) {
            continue;
        }

        input.tapInternalKey = tapInternalKey;
        cleanupCallbacks.push(() => {
            delete input.tapInternalKey;
        });
    }

    return () => {
        for (let index = cleanupCallbacks.length - 1; index >= 0; index -= 1) {
            cleanupCallbacks[index]();
        }
    };
}

function needsTaprootEstimatorHint(input) {
    return Boolean(
        input
        && !input.tapInternalKey
        && !input.tapLeafScript
        && isTaprootOutputScript(input?.witnessUtxo?.script)
    );
}

function isTaprootOutputScript(script) {
    return script instanceof Uint8Array
        && script.length === 34
        && script[0] === 0x51
        && script[1] === 0x20;
}

function extractTaprootKeyFromScript(script) {
    if (!isTaprootOutputScript(script)) {
        return null;
    }

    return script.slice(2, 34);
}

function bech32HrpExpand(hrp) {
    const expanded = [];

    for (let index = 0; index < hrp.length; index += 1) {
        expanded.push(hrp.charCodeAt(index) >> 5);
    }
    expanded.push(0);
    for (let index = 0; index < hrp.length; index += 1) {
        expanded.push(hrp.charCodeAt(index) & 31);
    }

    return expanded;
}

function bech32Polymod(values) {
    const generators = [0x3b6a57b2, 0x26508e6d, 0x1ea119fa, 0x3d4233dd, 0x2a1462b3];
    let checksum = 1;

    for (const value of values) {
        const top = checksum >> 25;
        checksum = (((checksum & 0x1ffffff) << 5) ^ value) >>> 0;
        for (let bit = 0; bit < generators.length; bit += 1) {
            if ((top >> bit) & 1) {
                checksum = (checksum ^ generators[bit]) >>> 0;
            }
        }
    }

    return checksum;
}

function convertBits(values, fromBits, toBits, pad) {
    let accumulator = 0;
    let bits = 0;
    const converted = [];
    const maxValue = (1 << toBits) - 1;
    const maxAccumulator = (1 << (fromBits + toBits - 1)) - 1;

    for (const value of values) {
        if (!Number.isInteger(value) || value < 0 || value >= (1 << fromBits)) {
            throw new Error('Invalid Bitcoin address data.');
        }

        accumulator = ((accumulator << fromBits) | value) & maxAccumulator;
        bits += fromBits;

        while (bits >= toBits) {
            bits -= toBits;
            converted.push((accumulator >> bits) & maxValue);
        }
    }

    if (pad) {
        if (bits > 0) {
            converted.push((accumulator << (toBits - bits)) & maxValue);
        }
    } else if (bits >= fromBits || ((accumulator << (toBits - bits)) & maxValue)) {
        throw new Error('Invalid Bitcoin address data.');
    }

    return Uint8Array.from(converted);
}

function normalizeUtxoAmount(value) {
    try {
        return BigInt(value ?? 0);
    } catch {
        return 0n;
    }
}

function validateListingEntry(entry) {
    if (!entry || typeof entry !== 'object') throw new Error('Listing entry is missing.');
    if (!entry.listingData || !entry.sellerSignedPsbt || !entry.utxo) {
        throw new Error('Listing entry is incomplete.');
    }
}

function normalizePositiveInteger(value) {
    const number = Number(value);
    return Number.isFinite(number) && number > 0 ? Math.round(number) : 0;
}

function normalizePublicKeyForAddress(address, publicKey) {
    const normalizedAddress = String(address || '').trim();
    const normalizedKey = String(publicKey || '').trim();

    if (normalizedAddress.startsWith('bc1p') && normalizedKey.length === 66) {
        return normalizedKey.slice(2);
    }

    return normalizedKey;
}

function normalizeTaprootInternalKeyHex(publicKey) {
    const normalizedKey = String(publicKey || '').trim().toLowerCase();
    if (/^[0-9a-f]{64}$/.test(normalizedKey)) {
        return normalizedKey;
    }
    if (/^(02|03)[0-9a-f]{64}$/.test(normalizedKey)) {
        return normalizedKey.slice(2);
    }
    return '';
}

function normalizeBaseUrl(value) {
    return String(value || '').trim().replace(/\/+$/, '');
}

function formatOutpoint(txid, index) {
    const normalizedTxid = String(txid || '').trim();
    const normalizedIndex = Number(index);
    if (!normalizedTxid || !Number.isInteger(normalizedIndex) || normalizedIndex < 0) return '';
    return `${normalizedTxid}:${normalizedIndex}`;
}

function normalizeOutpoint(value) {
    const [txid, index] = String(value || '').trim().split(':');
    return formatOutpoint(txid, index);
}

function assertUnisatAvailable() {
    if (!window.unisat) {
        throw new Error('UniSat is required for this page.');
    }
}

function getXverseBitcoinProvider() {
    if (window.XverseProviders?.BitcoinProvider?.request) {
        return window.XverseProviders.BitcoinProvider;
    }

    if (window.xverseProviders?.BitcoinProvider?.request) {
        return window.xverseProviders.BitcoinProvider;
    }

    for (const descriptor of getInjectedBitcoinProviderDescriptors()) {
        if (!isXverseProviderDescriptor(descriptor)) {
            continue;
        }

        const provider = resolveWindowProviderPath(descriptor.id);
        if (provider?.request) {
            return provider;
        }
    }

    return null;
}

function getInjectedBitcoinProviderDescriptors() {
    const candidates = [
        ...(Array.isArray(window.btc_providers) ? window.btc_providers : []),
        ...(Array.isArray(window.webbtc_providers) ? window.webbtc_providers : [])
    ];

    return candidates.filter((entry) => entry && typeof entry === 'object');
}

function isXverseProviderDescriptor(descriptor) {
    const name = String(descriptor?.name || '').trim().toLowerCase();
    const webUrl = String(descriptor?.webUrl || '').trim().toLowerCase();
    const storeUrl = String(descriptor?.chromeWebStoreUrl || '').trim().toLowerCase();

    return name.includes('xverse')
        || webUrl.includes('xverse.app')
        || storeUrl.includes('xverse');
}

function resolveWindowProviderPath(value) {
    const normalized = String(value || '').trim();
    if (!normalized) {
        return null;
    }

    const parts = normalized.split('.').filter(Boolean);
    let current = window;

    for (const part of parts) {
        current = current?.[part];
    }

    return current || null;
}

async function requestWithXverse(method, params = {}) {
    const provider = getXverseBitcoinProvider();
    if (!provider) {
        throw new Error('Xverse is required for this page.');
    }

    const normalizedMethod = String(method || '').trim();
    const response = typeof params === 'undefined'
        ? await provider.request(normalizedMethod)
        : await provider.request(normalizedMethod, params);
    return unwrapWalletProviderResponse(response);
}

function unwrapWalletProviderResponse(response) {
    if (!response || typeof response !== 'object') {
        return response;
    }

    if (String(response.status || '').trim().toLowerCase() === 'error') {
        const message = String(response?.error?.message || response?.error?.reason || response?.error || 'Wallet request failed.').trim();
        throw new Error(message);
    }

    if (String(response.status || '').trim().toLowerCase() === 'success') {
        return response.result;
    }

    if (response.error) {
        const message = String(response?.error?.message || response?.error?.reason || response?.error || 'Wallet request failed.').trim();
        throw new Error(message);
    }

    if (Object.prototype.hasOwnProperty.call(response, 'result')) {
        return response.result;
    }

    return response;
}

function selectXverseAddress(result, purpose = 'ordinals') {
    const entries = Array.isArray(result)
        ? result
        : Array.isArray(result?.addresses)
            ? result.addresses
            : [];
    const normalizedPurpose = String(purpose || '').trim().toLowerCase();
    const selectedEntry = entries.find((entry) => String(entry?.purpose || '').trim().toLowerCase() === normalizedPurpose)
        || (normalizedPurpose === 'ordinals'
            ? entries.find((entry) => String(entry?.addressType || '').trim().toLowerCase() === 'p2tr')
            : entries.find((entry) => {
                const addressType = String(entry?.addressType || '').trim().toLowerCase();
                return addressType === 'p2sh' || addressType === 'p2wpkh';
            }))
        || entries[0]
        || null;

    if (!selectedEntry) {
        return {
            address: '',
            publicKey: '',
            purpose: '',
            addressType: '',
            network: '',
            walletType: ''
        };
    }

    return {
        address: String(selectedEntry?.address || '').trim(),
        publicKey: String(selectedEntry?.publicKey || selectedEntry?.public_key || '').trim(),
        purpose: String(selectedEntry?.purpose || '').trim(),
        addressType: String(selectedEntry?.addressType || selectedEntry?.address_type || '').trim(),
        network: String(selectedEntry?.network || '').trim(),
        walletType: String(selectedEntry?.walletType || selectedEntry?.wallet_type || '').trim()
    };
}

function normalizePortfolioHolding(item, fallbackAddress = '') {
    const inscriptionId = normalizeInscriptionId(item?.id || item?.inscriptionId);
    const outpoint = normalizeOutpoint(item?.ownerOutpoint || item?.outpoint || item?.location || '');
    const outputValue = normalizePositiveInteger(item?.ownerOutputValue || item?.outputValue || item?.value);
    const utxo = parseUtxoFromLocation(outpoint, outputValue);

    return {
        inscriptionId,
        address: String(item?.ownerAddress || item?.address || fallbackAddress || '').trim(),
        outpoint,
        location: outpoint,
        utxo,
        outputValue,
        preview: String(item?.imageSrc || item?.preview || '').trim(),
        name: String(item?.name || '').trim(),
        collectionId: String(item?.collectionId || '').trim()
    };
}

function inferXverseSignatureMethod(addressType, address) {
    const normalizedAddressType = String(addressType || '').trim().toLowerCase();
    const normalizedAddress = String(address || '').trim().toLowerCase();
    if (normalizedAddressType === 'p2tr' || normalizedAddress.startsWith('bc1p')) {
        return 'bip322';
    }

    return 'ecdsa';
}

function inferUnisatSignatureMethod(address) {
    const normalizedAddress = String(address || '').trim().toLowerCase();
    if (normalizedAddress.startsWith('bc1p') || normalizedAddress.startsWith('tb1p') || normalizedAddress.startsWith('bcrt1p')) {
        return 'bip322';
    }

    return 'ecdsa';
}

async function runQueuedUnisatWalletRequest(executor) {
    const previousRequest = unisatWalletRequestChain.catch(() => {});
    const nextRequest = previousRequest.then(async () => {
        const elapsedSinceLastRequest = Date.now() - unisatWalletLastRequestAt;
        const settleDelay = Math.max(0, UNISAT_WALLET_SETTLE_DELAY_MS - elapsedSinceLastRequest);
        if (settleDelay > 0) {
            await delay(settleDelay);
        }

        try {
            return await executor();
        } finally {
            unisatWalletLastRequestAt = Date.now();
        }
    });

    unisatWalletRequestChain = nextRequest.catch(() => {});
    return nextRequest;
}

async function runQueuedXverseWalletRequest(executor) {
    const previousRequest = xverseWalletRequestChain.catch(() => {});
    const nextRequest = previousRequest.then(async () => {
        const elapsedSinceLastRequest = Date.now() - xverseWalletLastRequestAt;
        const settleDelay = Math.max(0, XVERSE_WALLET_SETTLE_DELAY_MS - elapsedSinceLastRequest);
        if (settleDelay > 0) {
            await delay(settleDelay);
        }

        try {
            return await executor();
        } finally {
            xverseWalletLastRequestAt = Date.now();
        }
    });

    xverseWalletRequestChain = nextRequest.catch(() => {});
    return nextRequest;
}

function delay(ms) {
    const duration = Math.max(0, Number(ms) || 0);
    return new Promise((resolve) => {
        window.setTimeout(resolve, duration);
    });
}

function base64ToHex(value) {
    return bytesToHex(base64ToBytes(value));
}

function hexToBase64(value) {
    return bytesToBase64(hexToBytes(value));
}

function base64ToBytes(value) {
    const normalized = String(value || '').trim();
    const binary = atob(normalized);
    const bytes = new Uint8Array(binary.length);

    for (let index = 0; index < binary.length; index += 1) {
        bytes[index] = binary.charCodeAt(index);
    }

    return bytes;
}

function bytesToBase64(bytes) {
    let binary = '';

    for (let index = 0; index < bytes.length; index += 1) {
        binary += String.fromCharCode(bytes[index]);
    }

    return btoa(binary);
}

function hexToBytes(value) {
    const normalized = String(value || '').trim();
    const bytes = new Uint8Array(normalized.length / 2);

    for (let index = 0; index < normalized.length; index += 2) {
        bytes[index / 2] = parseInt(normalized.slice(index, index + 2), 16);
    }

    return bytes;
}

function bytesToHex(bytes) {
    return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

