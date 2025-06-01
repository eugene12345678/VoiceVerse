const algosdk = require('algosdk');

// Algorand API key from the task
const ALGORAND_API_KEY = '98D9CE80660AD243893D56D9F125CD2D';

// Algorand network configuration
const algodServer = 'https://testnet-algorand.api.purestake.io/ps2';
const indexerServer = 'https://testnet-algorand.api.purestake.io/idx2';
const port = '';
const token = {
  'X-API-Key': ALGORAND_API_KEY
};

// Initialize Algorand clients
const algodClient = new algosdk.Algodv2(token, algodServer, port);
const indexerClient = new algosdk.Indexer(token, indexerServer, port);

/**
 * Get account information from Algorand blockchain
 * @param {string} address - Algorand wallet address
 * @returns {Promise<Object>} Account information
 */
const getAccountInfo = async (address) => {
  try {
    return await algodClient.accountInformation(address).do();
  } catch (error) {
    console.error('Error getting account info:', error);
    throw error;
  }
};

/**
 * Get account assets (NFTs) from Algorand blockchain
 * @param {string} address - Algorand wallet address
 * @returns {Promise<Object>} Account assets
 */
const getAccountAssets = async (address) => {
  try {
    return await indexerClient.lookupAccountAssets(address).do();
  } catch (error) {
    console.error('Error getting account assets:', error);
    throw error;
  }
};

/**
 * Create an Algorand Standard Asset (ASA) for an NFT
 * @param {Object} nftData - NFT data
 * @param {string} creatorAddress - Creator's Algorand address
 * @param {string} creatorMnemonic - Creator's mnemonic for signing (in production, this would be handled securely)
 * @returns {Promise<Object>} Transaction result
 */
const createNFTAsset = async (nftData, creatorAddress, creatorMnemonic) => {
  try {
    // Get suggested parameters
    const params = await algodClient.getTransactionParams().do();
    
    // Create asset creation transaction
    const txn = algosdk.makeAssetCreateTxnWithSuggestedParamsFromObject({
      from: creatorAddress,
      total: 1, // NFTs have supply of 1
      decimals: 0,
      assetName: nftData.title,
      unitName: 'VOICE',
      assetURL: `https://voiceverse.io/nft/${nftData.id}`,
      defaultFrozen: false,
      manager: creatorAddress,
      reserve: creatorAddress,
      freeze: creatorAddress,
      clawback: creatorAddress,
      suggestedParams: params,
      note: new Uint8Array(Buffer.from(JSON.stringify(nftData.metadata)))
    });
    
    // Sign transaction
    const account = algosdk.mnemonicToSecretKey(creatorMnemonic);
    const signedTxn = txn.signTxn(account.sk);
    
    // Submit transaction
    const { txId } = await algodClient.sendRawTransaction(signedTxn).do();
    
    // Wait for confirmation
    await algosdk.waitForConfirmation(algodClient, txId, 10);
    
    // Get transaction information
    const ptx = await algodClient.pendingTransactionInformation(txId).do();
    const assetId = ptx['asset-index'];
    
    return {
      txId,
      assetId
    };
  } catch (error) {
    console.error('Error creating NFT asset:', error);
    throw error;
  }
};

/**
 * Transfer an NFT from one address to another
 * @param {number} assetId - Asset ID of the NFT
 * @param {string} fromAddress - Sender's Algorand address
 * @param {string} toAddress - Recipient's Algorand address
 * @param {string} senderMnemonic - Sender's mnemonic for signing (in production, this would be handled securely)
 * @returns {Promise<Object>} Transaction result
 */
const transferNFT = async (assetId, fromAddress, toAddress, senderMnemonic) => {
  try {
    // Get suggested parameters
    const params = await algodClient.getTransactionParams().do();
    
    // Create asset transfer transaction
    const txn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
      from: fromAddress,
      to: toAddress,
      assetIndex: assetId,
      amount: 1,
      suggestedParams: params
    });
    
    // Sign transaction
    const account = algosdk.mnemonicToSecretKey(senderMnemonic);
    const signedTxn = txn.signTxn(account.sk);
    
    // Submit transaction
    const { txId } = await algodClient.sendRawTransaction(signedTxn).do();
    
    // Wait for confirmation
    await algosdk.waitForConfirmation(algodClient, txId, 10);
    
    return {
      txId
    };
  } catch (error) {
    console.error('Error transferring NFT:', error);
    throw error;
  }
};

/**
 * Opt-in to receive an ASA (required before receiving an NFT)
 * @param {number} assetId - Asset ID of the NFT
 * @param {string} receiverAddress - Receiver's Algorand address
 * @param {string} receiverMnemonic - Receiver's mnemonic for signing (in production, this would be handled securely)
 * @returns {Promise<Object>} Transaction result
 */
const optInToAsset = async (assetId, receiverAddress, receiverMnemonic) => {
  try {
    // Get suggested parameters
    const params = await algodClient.getTransactionParams().do();
    
    // Create asset opt-in transaction
    const txn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
      from: receiverAddress,
      to: receiverAddress,
      assetIndex: assetId,
      amount: 0,
      suggestedParams: params
    });
    
    // Sign transaction
    const account = algosdk.mnemonicToSecretKey(receiverMnemonic);
    const signedTxn = txn.signTxn(account.sk);
    
    // Submit transaction
    const { txId } = await algodClient.sendRawTransaction(signedTxn).do();
    
    // Wait for confirmation
    await algosdk.waitForConfirmation(algodClient, txId, 10);
    
    return {
      txId
    };
  } catch (error) {
    console.error('Error opting in to asset:', error);
    throw error;
  }
};

/**
 * Get asset information from Algorand blockchain
 * @param {number} assetId - Asset ID of the NFT
 * @returns {Promise<Object>} Asset information
 */
const getAssetInfo = async (assetId) => {
  try {
    return await algodClient.getAssetByID(assetId).do();
  } catch (error) {
    console.error('Error getting asset info:', error);
    throw error;
  }
};

/**
 * Generate a new Algorand account
 * @returns {Object} New account information
 */
const generateAccount = () => {
  const account = algosdk.generateAccount();
  const mnemonic = algosdk.secretKeyToMnemonic(account.sk);
  
  return {
    address: account.addr,
    mnemonic
  };
};

/**
 * Validate an Algorand address
 * @param {string} address - Algorand address to validate
 * @returns {boolean} Whether the address is valid
 */
const isValidAddress = (address) => {
  return algosdk.isValidAddress(address);
};

module.exports = {
  algodClient,
  indexerClient,
  getAccountInfo,
  getAccountAssets,
  createNFTAsset,
  transferNFT,
  optInToAsset,
  getAssetInfo,
  generateAccount,
  isValidAddress
};