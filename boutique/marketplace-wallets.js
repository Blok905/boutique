import {
    BOUTIQUE_PSBT_CONFIG,
    buildItemOfferEntry,
    buildListingEntry,
    buyListing,
    createMarketplaceRuntime,
    formatErrorMessage,
    hasUnisatWallet,
    hasXverseWallet,
    loadWalletContext,
    normalizeInscriptionId,
    prepareDummyUtxos,
    signAcceptedOfferPsbt,
    signMessageWithUnisat,
    signMessageWithXverse,
    shortenAddress
} from './boutique-psbt.js?v=20260315-81';
import { hashManifestPayload } from './boutique-security.js?v=20260312-21';
import { MARKETPLACE_API } from './marketplace-api.js?v=20260315-06';

export async function connectWallet(provider, options = {}) {
    const { hydrateDetails = false } = options || {};
    return loadWalletContext({
        provider,
        connect: true,
        mempoolBaseUrl: BOUTIQUE_PSBT_CONFIG.mempoolBaseUrl,
        apiBase: BOUTIQUE_PSBT_CONFIG.apiBase,
        hydrateDetails
    });
}

export async function refreshWallet(provider, options = {}) {
    const { hydrateDetails = true } = options || {};
    try {
        return await loadWalletContext({
            provider,
            connect: false,
            mempoolBaseUrl: BOUTIQUE_PSBT_CONFIG.mempoolBaseUrl,
            apiBase: BOUTIQUE_PSBT_CONFIG.apiBase,
            hydrateDetails
        });
    } catch (error) {
        const normalizedProvider = String(provider || '').trim().toLowerCase();
        const normalizedMessage = formatErrorMessage(error).toLowerCase();
        if (normalizedProvider === 'xverse' && normalizedMessage.includes('invalid parameters')) {
            return null;
        }
        throw error;
    }
}

export function getAvailableWalletProviders() {
    return [
        {
            id: 'unisat',
            label: 'UniSat',
            available: hasUnisatWallet()
        },
        {
            id: 'xverse',
            label: 'Xverse',
            available: hasXverseWallet()
        }
    ];
}

export async function listAssetForSale({
    asset,
    walletContext,
    priceSats,
    inscriptionDetails = null
}) {
    const defaultActionSigner = resolveActionSigner(walletContext);
    const listingEntry = await buildListingEntry({
        inscriptionId: asset?.id,
        priceSats,
        sellerPaymentsAddress: resolvePaymentAddress(walletContext),
        walletContext,
        inscriptionDetails,
        apiBase: BOUTIQUE_PSBT_CONFIG.apiBase,
        mempoolBaseUrl: BOUTIQUE_PSBT_CONFIG.mempoolBaseUrl
    });
    const payload = {
        collectionId: asset?.collectionId,
        walletProvider: walletContext?.provider,
        signatureMethod: getActionSignatureMethod(walletContext),
        items: [listingEntry]
    };
    const actionSigner = resolveActionSigner(walletContext, listingEntry.sellerAddress) || defaultActionSigner;
    const actionSignatureMethod = getActionSignatureMethod(walletContext, actionSigner?.address || listingEntry.sellerAddress);
    payload.signatureMethod = actionSignatureMethod;
    const auth = await buildSignedAction('publish-listings', payload, walletContext, {
        signerAddress: actionSigner?.address || listingEntry.sellerAddress,
        signerPublicKey: actionSigner?.publicKey || listingEntry?.listingData?.sellerOrdinalsSigner?.publicKey,
        signatureMethod: actionSignatureMethod
    });
    return MARKETPLACE_API.publishListings({
        ...payload,
        auth
    });
}

export async function delistAsset({
    asset,
    listing,
    walletContext
}) {
    const actionSigner = resolveActionSigner(walletContext, listing?.sellerAddress);
    const actionSignatureMethod = getActionSignatureMethod(walletContext, actionSigner?.address || listing?.sellerAddress);
    const payload = {
        collectionId: asset?.collectionId || listing?.collectionId,
        walletProvider: walletContext?.provider,
        signatureMethod: actionSignatureMethod,
        items: [
            {
                inscriptionId: asset?.id || listing?.inscriptionId,
                collectionId: asset?.collectionId || listing?.collectionId,
                status: 'cancelled'
            }
        ]
    };
    const auth = await buildSignedAction('publish-listings', payload, walletContext, {
        signerAddress: actionSigner?.address,
        signerPublicKey: actionSigner?.publicKey,
        signatureMethod: actionSignatureMethod
    });
    return MARKETPLACE_API.publishListings({
        ...payload,
        auth
    });
}

export async function buyAssetNow({
    listing,
    walletContext,
    feePreference,
    customFeeRate,
    onStatus = null
}) {
    if (!listing) {
        throw new Error('Listing is required.');
    }

    const emitStatus = typeof onStatus === 'function'
        ? onStatus
        : () => {};
    const paymentAddress = resolvePaymentAddress(walletContext).trim().toLowerCase();
    const ordinalsAddress = resolveOrdinalsAddress(walletContext).trim().toLowerCase();
    const requiredDummyCount = paymentAddress && ordinalsAddress && paymentAddress === ordinalsAddress ? 1 : 2;
    const marketRuntime = createMarketplaceRuntime({
        mempoolBaseUrl: BOUTIQUE_PSBT_CONFIG.mempoolBaseUrl,
        broadcastAuthPath: BOUTIQUE_PSBT_CONFIG.broadcastAuthPath,
        walletContext,
        listingEntriesById: new Map([[normalizeInscriptionId(listing.inscriptionId), listing]])
    });

    emitStatus({
        step: 'checking-dummy-utxos',
        message: 'Checking wallet for required dummy UTXOs...',
        tone: 'muted'
    });

    await prepareDummyUtxos({
        walletContext,
        count: requiredDummyCount,
        mempoolBaseUrl: BOUTIQUE_PSBT_CONFIG.mempoolBaseUrl,
        feeTier: resolveFeeTier(feePreference, customFeeRate),
        onStatus: emitStatus,
        marketRuntime
    });

    return buyListing({
        listingEntry: listing,
        walletContext,
        mempoolBaseUrl: BOUTIQUE_PSBT_CONFIG.mempoolBaseUrl,
        broadcastAuthPath: BOUTIQUE_PSBT_CONFIG.broadcastAuthPath,
        feeTier: resolveFeeTier(feePreference, customFeeRate),
        onStatus: emitStatus,
        marketRuntime
    });
}

export async function createOffer({
    asset,
    walletContext,
    priceSats,
    feePreference,
    customFeeRate,
    type = 'item'
}) {
    const normalizedType = String(type || 'item').trim().toLowerCase() || 'item';
    let itemOfferEntry = null;
    if (normalizedType === 'item') {
        const details = await MARKETPLACE_API.getInscriptionDetails(asset?.id);
        const activeListing = details?.activeListing && typeof details.activeListing === 'object'
            ? details.activeListing
            : null;
        const listingSellerAddress = String(
            asset?.listing?.sellerAddress
            || activeListing?.sellerAddress
            || details?.ownerAddress
            || ''
        ).trim();
        const listingSellerPaymentsAddress = String(
            asset?.listing?.sellerPaymentsAddress
            || activeListing?.sellerPaymentsAddress
            || listingSellerAddress
        ).trim();
        itemOfferEntry = await buildItemOfferEntry({
            inscriptionId: asset?.id,
            priceSats,
            sellerOrdinalsAddress: listingSellerAddress,
            sellerPaymentsAddress: listingSellerPaymentsAddress,
            sellerUtxo: {
                txid: details?.locationTxid,
                index: details?.locationIndex,
                amount: details?.outputValue
            },
            walletContext,
            mempoolBaseUrl: BOUTIQUE_PSBT_CONFIG.mempoolBaseUrl,
            feeTier: resolveFeeTier(feePreference, customFeeRate)
        });
    }

    const payload = {
        type: normalizedType,
        collectionId: asset?.collectionId,
        inscriptionId: normalizedType === 'item' ? asset?.id : '',
        buyerAddress: resolvePaymentAddress(walletContext),
        buyerOrdinalsAddress: resolveOrdinalsAddress(walletContext),
        priceSats,
        feePreference,
        feeRate: feePreference === 'custom' ? Number(customFeeRate || 0) : 0,
        sellerAddress: itemOfferEntry?.sellerAddress || '',
        sellerPaymentsAddress: itemOfferEntry?.sellerPaymentsAddress || '',
        buyerSignedPsbt: itemOfferEntry?.buyerSignedPsbt || ''
    };
    const auth = await buildSignedAction('offer-create', payload, walletContext);
    return MARKETPLACE_API.createOffer({
        ...payload,
        auth
    });
}

export async function cancelOffer({
    offerId,
    walletContext
}) {
    const normalizedOfferId = String(offerId || '').trim();
    if (!normalizedOfferId) {
        throw new Error('Offer id is required.');
    }

    const payload = {
        offerId: normalizedOfferId
    };
    const auth = await buildSignedAction('offer-cancel', payload, walletContext);
    return MARKETPLACE_API.cancelOffer(normalizedOfferId, {
        ...payload,
        auth
    });
}

export async function acceptOffer({
    offer,
    offerId,
    txid,
    inscriptionId,
    walletContext
}) {
    const normalizedOfferId = String(offerId || '').trim();
    const normalizedInscriptionId = String(inscriptionId || '').trim().toLowerCase();
    if (!normalizedOfferId) {
        throw new Error('Offer id is required.');
    }

    let offerRecord = offer?.offerId === normalizedOfferId
        ? offer
        : null;
    let offerType = String(offerRecord?.type || '').trim().toLowerCase();
    const localOfferInscriptionId = normalizeInscriptionId(offerRecord?.inscriptionId || '');

    if (!offerRecord || !offerType) {
        const fetchedOfferRecord = await MARKETPLACE_API.getOffer(normalizedOfferId);
        offerRecord = fetchedOfferRecord || offerRecord;
        offerType = String(offerRecord?.type || '').trim().toLowerCase();
    }

    const persistedInscriptionId = normalizeInscriptionId(offerRecord?.inscriptionId || localOfferInscriptionId || '');
    if (!offerType && persistedInscriptionId) {
        offerType = 'item';
    }
    const resolvedInscriptionId = normalizeInscriptionId(
        normalizedInscriptionId || persistedInscriptionId || ''
    );

    if (offerType === 'item') {
        const preparePayload = {
            offerId: normalizedOfferId,
            inscriptionId: resolvedInscriptionId
        };
        const prepareAuth = await buildSignedAction('offer-accept-prepare', preparePayload, walletContext);
        const preparedOffer = await MARKETPLACE_API.prepareOfferAccept(normalizedOfferId, {
            ...preparePayload,
            auth: prepareAuth
        });
        const buyerSignedPsbt = String(preparedOffer?.buyerSignedPsbt || '').trim();
        if (!buyerSignedPsbt) {
            throw new Error('The accepted offer is missing the buyer bid PSBT.');
        }
        const signedPsbt = await signAcceptedOfferPsbt({
            buyerSignedPsbt,
            walletContext,
            inscriptionId: normalizeInscriptionId(preparedOffer?.inscriptionId || resolvedInscriptionId),
            sellerAddress: String(
                preparedOffer?.sellerAddress
                || preparedOffer?.sellerPaymentsAddress
                || offerRecord?.sellerAddress
                || offerRecord?.sellerPaymentsAddress
                || ''
            ).trim()
        });

        const payload = {
            offerId: normalizedOfferId,
            inscriptionId: normalizeInscriptionId(preparedOffer?.inscriptionId || resolvedInscriptionId),
            signedPsbt
        };
        const auth = await buildSignedAction('offer-accept', payload, walletContext);
        return MARKETPLACE_API.acceptOffer(normalizedOfferId, {
            ...payload,
            auth
        });
    }

    const normalizedTxid = String(txid || '').trim().toLowerCase();
    if (!/^[a-f0-9]{64}$/i.test(normalizedTxid)) {
        throw new Error('A valid 64-character transaction id is required.');
    }

    const payload = {
        offerId: normalizedOfferId,
        txid: normalizedTxid
    };
    if (normalizedInscriptionId) {
        payload.inscriptionId = normalizedInscriptionId;
    }
    const auth = await buildSignedAction('offer-accept', payload, walletContext);
    return MARKETPLACE_API.acceptOffer(normalizedOfferId, {
        ...payload,
        auth
    });
}

export async function saveProfile({
    walletContext,
    profile
}) {
    const payload = {
        profile
    };
    const auth = await buildSignedAction('profile-update', payload, walletContext);
    return MARKETPLACE_API.saveProfile(resolveProfileAddress(walletContext), {
        ...payload,
        auth
    });
}

export async function buildSignedAction(action, payload, walletContext, options = {}) {
    const signerAddress = String(options?.signerAddress || resolveProfileAddress(walletContext)).trim();
    const signerPublicKey = String(options?.signerPublicKey || resolveActionPublicKey(walletContext)).trim();
    const inferredSignatureMethod = getActionSignatureMethod(walletContext, signerAddress);
    const signatureMethod = String(options?.signatureMethod || inferredSignatureMethod).trim().toLowerCase()
        || inferredSignatureMethod;
    const walletProvider = String(walletContext?.provider || 'unisat').trim().toLowerCase() || 'unisat';
    const payloadHash = await hashManifestPayload(payload);
    const challenge = await MARKETPLACE_API.createChallenge({
        action,
        address: signerAddress,
        publicKey: signerPublicKey,
        payloadHash,
        walletProvider,
        signatureMethod
    });
    const signature = await signWalletMessage(challenge.message, walletContext, signatureMethod, signerAddress);

    return {
        action,
        address: signerAddress,
        publicKey: signerPublicKey,
        payloadHash,
        walletProvider,
        signatureMethod,
        nonce: String(challenge?.nonce || '').trim(),
        issuedAt: String(challenge?.issuedAt || '').trim(),
        message: String(challenge?.message || '').trim(),
        signature: String(signature || '').trim()
    };
}

export function resolveProfileAddress(walletContext) {
    return resolveOrdinalsAddress(walletContext);
}

export function resolvePaymentAddress(walletContext) {
    return String(
        walletContext?.paymentAddress
        || walletContext?.address
        || walletContext?.ordinalsAddress
        || ''
    ).trim();
}

export function resolveOrdinalsAddress(walletContext) {
    return String(
        walletContext?.ordinalsAddress
        || walletContext?.address
        || walletContext?.paymentAddress
        || ''
    ).trim();
}

export function resolveWalletDisplayAddress(walletContext) {
    return shortenAddress(resolveOrdinalsAddress(walletContext));
}

export function getActionSignatureMethod(walletContext, signerAddress = '') {
    const provider = String(walletContext?.provider || '').trim().toLowerCase();
    if (provider === 'xverse') {
        const targetAddress = String(signerAddress || resolveOrdinalsAddress(walletContext)).trim().toLowerCase();
        if (targetAddress.startsWith('bc1p') || targetAddress.startsWith('tb1p') || targetAddress.startsWith('bcrt1p')) {
            return 'bip322';
        }
        return 'ecdsa';
    }

    return String(walletContext?.signatureMethod || '').trim().toLowerCase() || 'ecdsa';
}

export function resolveFeeTier(feePreference, customFeeRate = 0) {
    const normalized = String(feePreference || 'balanced').trim().toLowerCase();
    if (normalized === 'priority') {
        return 'fastestFee';
    }

    if (normalized === 'economy') {
        return 'economyFee';
    }

    if (normalized === 'custom') {
        const numericRate = Number(customFeeRate || 0);
        return Number.isFinite(numericRate) && numericRate > 0 ? Math.round(numericRate) : 'halfHourFee';
    }

    return 'halfHourFee';
}

async function signWalletMessage(message, walletContext, signatureMethod, signerAddress = '') {
    const provider = String(walletContext?.provider || 'unisat').trim().toLowerCase();
    if (provider === 'xverse') {
        const protocol = String(signatureMethod || getActionSignatureMethod(walletContext, signerAddress)).trim().toUpperCase() || 'BIP322';
        return signMessageWithXverse(
            message,
            String(signerAddress || resolveOrdinalsAddress(walletContext)).trim(),
            protocol
        );
    }

    return signMessageWithUnisat(message, signatureMethod);
}

function resolveActionPublicKey(walletContext) {
    const provider = String(walletContext?.provider || 'unisat').trim().toLowerCase();
    if (provider === 'xverse') {
        return String(walletContext?.ordinalsPublicKey || '').trim();
    }

    return String(walletContext?.publicKey || '').trim();
}

function resolveActionSigner(walletContext, signerAddress = '') {
    const requestedAddress = String(signerAddress || '').trim();
    const normalizedRequested = requestedAddress.toLowerCase();
    const paymentAddress = resolvePaymentAddress(walletContext);
    const ordinalsAddress = resolveOrdinalsAddress(walletContext);

    if (normalizedRequested && normalizedRequested === paymentAddress.toLowerCase()) {
        return {
            address: paymentAddress,
            publicKey: String(walletContext?.paymentPublicKey || walletContext?.publicKey || '').trim()
        };
    }

    if (normalizedRequested && normalizedRequested === ordinalsAddress.toLowerCase()) {
        return {
            address: ordinalsAddress,
            publicKey: String(walletContext?.ordinalsPublicKey || walletContext?.publicKey || '').trim()
        };
    }

    return {
        address: resolveProfileAddress(walletContext),
        publicKey: resolveActionPublicKey(walletContext)
    };
}

export function formatWalletError(error) {
    return formatErrorMessage(error);
}
