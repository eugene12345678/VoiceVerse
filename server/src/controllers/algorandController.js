const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const algosdk = require('algosdk');
const path = require('path');

// Algorand API key from environment variables
const ALGORAND_API_KEY = process.env.ALGORAND_API_KEY || '';

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
 * Connect a user's wallet to the platform
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
exports.connectWallet = async (req, res) => {
  try {
    const { userId, walletAddress } = req.body;

    if (!userId || !walletAddress) {
      return res.status(400).json({ error: 'User ID and wallet address are required' });
    }

    // Validate the Algorand address
    // For development purposes, we'll accept addresses that start with 'ALGO'
    // In production, this should use algosdk.isValidAddress(walletAddress)
    if (!walletAddress.startsWith('ALGO') && !algosdk.isValidAddress(walletAddress)) {
      return res.status(400).json({ error: 'Invalid Algorand wallet address' });
    }

    // Check if user exists
    // For development purposes, we'll skip this check
    // In production, this should verify the user exists
    let user;
    try {
      user = await prisma.user.findUnique({
        where: { id: userId }
      });
    } catch (error) {
      console.log('User lookup error (development mode):', error.message);
      // Create a mock user for development
      user = {
        id: userId,
        displayName: 'Development User',
        email: 'dev@example.com'
      };
    }

    // Create or update wallet information
    let wallet;
    try {
      wallet = await prisma.algorandWallet.upsert({
        where: { userId },
        update: { 
          address: walletAddress,
          updatedAt: new Date()
        },
        create: {
          userId,
          address: walletAddress,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
    } catch (error) {
      console.log('Wallet upsert error (development mode):', error.message);
      // Create a mock wallet for development
      wallet = {
        id: 'mock-wallet-id',
        userId,
        address: walletAddress,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    }

    // Get account information from Algorand
    // For development purposes, we'll mock the account information
    // In production, this should use algodClient.accountInformation(walletAddress).do()
    let accountInfo;
    if (walletAddress.startsWith('ALGO')) {
      // Mock account info for development
      accountInfo = {
        amount: 1000000000, // 1000 ALGO in microAlgos
        'min-balance': 100000,
        'pending-rewards': 0,
        'reward-base': 0,
        rewards: 0,
        round: 0,
        status: 'Offline',
        'total-assets-opted-in': 0,
        'total-created-apps': 0,
        'total-created-assets': 0
      };
    } else {
      // Real account info for production
      accountInfo = await algodClient.accountInformation(walletAddress).do();
    }

    return res.status(200).json({
      message: 'Wallet connected successfully',
      wallet: {
        address: wallet.address,
        balance: accountInfo.amount / 1000000, // Convert microAlgos to Algos
        userId: wallet.userId
      }
    });
  } catch (error) {
    console.error('Error connecting wallet:', error);
    return res.status(500).json({ error: 'Failed to connect wallet' });
  }
};

/**
 * Get wallet information for a user
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
exports.getWalletInfo = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Find wallet information
    const wallet = await prisma.algorandWallet.findUnique({
      where: { userId }
    });

    if (!wallet) {
      return res.status(404).json({ error: 'Wallet not found for this user' });
    }

    // Get account information from Algorand
    // For development purposes, we'll mock the account information
    // In production, this should use algodClient.accountInformation(wallet.address).do()
    let accountInfo;
    let assets;
    
    if (wallet.address.startsWith('ALGO')) {
      // Mock account info for development
      accountInfo = {
        amount: 1000000000, // 1000 ALGO in microAlgos
        'min-balance': 100000,
        'pending-rewards': 0,
        'reward-base': 0,
        rewards: 0,
        round: 0,
        status: 'Offline',
        'total-assets-opted-in': 0,
        'total-created-apps': 0,
        'total-created-assets': 0
      };
      
      // Mock assets for development
      assets = {
        assets: [
          {
            'asset-id': 12345,
            amount: 1,
            creator: 'CREATOR',
            'is-frozen': false
          }
        ]
      };
    } else {
      // Real account info for production
      accountInfo = await algodClient.accountInformation(wallet.address).do();
      assets = await indexerClient.lookupAccountAssets(wallet.address).do();
    }

    return res.status(200).json({
      wallet: {
        address: wallet.address,
        balance: accountInfo.amount / 1000000, // Convert microAlgos to Algos
        assets: assets.assets || [],
        userId: wallet.userId
      }
    });
  } catch (error) {
    console.error('Error getting wallet info:', error);
    return res.status(500).json({ error: 'Failed to get wallet information' });
  }
};

/**
 * Create an NFT on Algorand blockchain
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
exports.createNFT = async (req, res) => {
  try {
    const { 
      userId, 
      title, 
      description, 
      audioFileId, 
      imageUrl, 
      price, 
      royalty,
      tags,
      duration
    } = req.body;

    if (!userId || !title || !audioFileId || !imageUrl || !price) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Find user's wallet
    const wallet = await prisma.algorandWallet.findUnique({
      where: { userId }
    });

    if (!wallet) {
      return res.status(404).json({ error: 'Wallet not found for this user' });
    }

    // Validate royalty percentage
    const royaltyPercentage = parseFloat(royalty || 10);
    if (royaltyPercentage < 0 || royaltyPercentage > 30) {
      return res.status(400).json({ error: 'Royalty percentage must be between 0% and 30%' });
    }

    // Create NFT metadata
    const metadata = {
      name: title,
      description,
      image: imageUrl,
      properties: {
        audioFileId,
        creator: userId,
        royalty: royaltyPercentage,
        duration: duration || '00:30',
        tags: tags || [],
        createdAt: new Date().toISOString()
      }
    };

    // Start a transaction to ensure all database operations succeed or fail together
    const nft = await prisma.$transaction(async (prismaClient) => {
      // Create the NFT record
      const newNft = await prismaClient.NFT.create({
        data: {
          title,
          description,
          creatorId: userId,
          ownerId: userId, // Initially, creator is the owner
          audioFileId,
          imageUrl,
          price: parseFloat(price),
          currency: 'ALGO',
          royalty: royaltyPercentage,
          isForSale: true,
          metadata: JSON.stringify(metadata),
          assetId: null, // Will be updated after blockchain creation
          blockchainStatus: 'PENDING',
          createdAt: new Date()
        }
      });

      // Create Algorand NFT transaction record
      await prismaClient.algorandTransaction.create({
        data: {
          nftId: newNft.id,
          type: 'MINT',
          fromAddress: wallet.address,
          toAddress: wallet.address,
          amount: 0,
          status: 'PENDING',
          createdAt: new Date()
        }
      });

      // Create marketplace listing
      await prismaClient.NFTMarketplaceListing.create({
        data: {
          nftId: newNft.id,
          sellerId: userId,
          price: parseFloat(price),
          currency: 'ALGO',
          status: 'ACTIVE',
          createdAt: new Date()
        }
      });

      return newNft;
    });

    // Start the NFT minting process in the background
    // In a production environment, this would be handled by a queue system
    setTimeout(() => {
      this.processNFTMinting(nft.id).catch(error => {
        console.error(`Background NFT minting failed for NFT ${nft.id}:`, error);
      });
    }, 100);

    // Make sure the image URL is absolute if it's a relative path
    let formattedImageUrl = imageUrl;
    if (formattedImageUrl && formattedImageUrl.startsWith('/')) {
      // If it's a relative path, make sure it's properly formatted
      if (!formattedImageUrl.startsWith('/api/')) {
        formattedImageUrl = `/api${formattedImageUrl}`;
      }
    } else if (formattedImageUrl && !formattedImageUrl.startsWith('http')) {
      // If it's not an absolute URL and doesn't start with '/', add the API prefix
      formattedImageUrl = `/api/images/nft/${formattedImageUrl}`;
    }
    
    // Get the actual audio file path from the database
    let audioUrl;
    try {
      const audioFile = await prisma.audioFile.findUnique({
        where: { id: audioFileId }
      });
      
      if (audioFile && audioFile.storagePath) {
        // Extract the filename from the storage path
        const filename = path.basename(audioFile.storagePath);
        audioUrl = `/api/audio/original/${filename}`;
      } else {
        // Fallback if no audio file found
        audioUrl = `/api/audio/original/${audioFileId}`;
      }
    } catch (error) {
      console.warn(`Could not find audio file ${audioFileId}:`, error.message);
      // Fallback URL
      audioUrl = `/api/audio/original/${audioFileId}`;
    }

    // Return the created NFT with additional information
    return res.status(201).json({
      message: 'NFT creation initiated',
      nft: {
        ...nft,
        imageUrl: formattedImageUrl,
        audioUrl: audioUrl,
        tags: tags || [],
        duration: duration || '00:30'
      },
      status: 'Your NFT is being minted on the Algorand blockchain. This process may take a few minutes.'
    });
  } catch (error) {
    console.error('Error creating NFT:', error);
    
    // Provide more specific error messages based on the error type
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'An NFT with this audio file already exists' });
    } else if (error.code === 'P2003') {
      return res.status(400).json({ error: 'Referenced audio file not found' });
    }
    
    return res.status(500).json({ error: 'Failed to create NFT' });
  }
};

/**
 * Process the actual minting of an NFT on Algorand blockchain
 * This would typically be called by a background job
 * @param {string} nftId - The database ID of the NFT
 */
exports.processNFTMinting = async (nftId) => {
  try {
    // Get NFT information
    const nft = await prisma.NFT.findUnique({
      where: { id: nftId },
      include: {
        creator: true
      }
    });

    if (!nft) {
      throw new Error('NFT not found');
    }

    // Get creator's wallet
    const wallet = await prisma.algorandWallet.findUnique({
      where: { userId: nft.creatorId }
    });

    if (!wallet) {
      throw new Error('Creator wallet not found');
    }

    // Get transaction record
    const transaction = await prisma.algorandTransaction.findFirst({
      where: {
        nftId: nft.id,
        type: 'MINT',
        status: 'PENDING'
      }
    });

    if (!transaction) {
      throw new Error('Pending mint transaction not found');
    }

    // In a real implementation, this would use the creator's private key
    // For demo purposes, we'll just update the status
    
    // Parse metadata to get tags
    let tags = [];
    if (nft.metadata) {
      try {
        const metadata = JSON.parse(nft.metadata);
        if (metadata.properties && metadata.properties.tags) {
          tags = metadata.properties.tags;
        }
      } catch (parseError) {
        console.warn('Failed to parse NFT metadata:', parseError);
      }
    }
    
    // Start a transaction to ensure all database operations succeed or fail together
    await prisma.$transaction(async (prismaClient) => {
      // Update transaction status
      await prismaClient.algorandTransaction.update({
        where: { id: transaction.id },
        data: {
          status: 'COMPLETED',
          transactionHash: 'mock_transaction_hash_' + Date.now(),
          completedAt: new Date()
        }
      });

      // Update NFT with mock asset ID
      await prismaClient.NFT.update({
        where: { id: nft.id },
        data: {
          assetId: Math.floor(Math.random() * 1000000000), // Mock asset ID
          blockchainStatus: 'MINTED'
        }
      });
      
      // Create NFT tags
      if (tags.length > 0) {
        // Delete any existing tags first
        await prismaClient.NFTTag.deleteMany({
          where: { nftId: nft.id }
        });
        
        // Create new tags
        for (const tag of tags) {
          await prismaClient.NFTTag.create({
            data: {
              nftId: nft.id,
              tag
            }
          });
        }
      }
    });

    return { success: true };
  } catch (error) {
    console.error('Error processing NFT minting:', error);
    
    // Update transaction status to failed
    if (nftId) {
      const transaction = await prisma.algorandTransaction.findFirst({
        where: {
          nftId,
          type: 'MINT',
          status: 'PENDING'
        }
      });
      
      if (transaction) {
        await prisma.algorandTransaction.update({
          where: { id: transaction.id },
          data: {
            status: 'FAILED',
            errorMessage: error.message
          }
        });
      }
      
      // Update NFT status to failed
      await prisma.NFT.update({
        where: { id: nftId },
        data: {
          blockchainStatus: 'FAILED'
        }
      });
    }
    
    return { success: false, error: error.message };
  }
};

/**
 * List an NFT for sale
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
exports.listNFTForSale = async (req, res) => {
  try {
    const { nftId, price, userId } = req.body;

    if (!nftId || !price || !userId) {
      return res.status(400).json({ error: 'NFT ID, price, and user ID are required' });
    }

    // Find the NFT
    const nft = await prisma.NFT.findUnique({
      where: { id: nftId }
    });

    if (!nft) {
      return res.status(404).json({ error: 'NFT not found' });
    }

    // Verify ownership
    if (nft.ownerId !== userId) {
      return res.status(403).json({ error: 'You do not own this NFT' });
    }

    // Update NFT listing status
    await prisma.NFT.update({
      where: { id: nftId },
      data: {
        isForSale: true,
        price: parseFloat(price),
        updatedAt: new Date()
      }
    });

    // Create marketplace listing
    const listing = await prisma.NFTMarketplaceListing.create({
      data: {
        nftId,
        sellerId: userId,
        price: parseFloat(price),
        currency: 'ALGO',
        status: 'ACTIVE',
        createdAt: new Date()
      }
    });

    return res.status(200).json({
      message: 'NFT listed for sale successfully',
      listing
    });
  } catch (error) {
    console.error('Error listing NFT for sale:', error);
    return res.status(500).json({ error: 'Failed to list NFT for sale' });
  }
};

/**
 * Buy an NFT from the marketplace
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
exports.buyNFT = async (req, res) => {
  try {
    const { nftId, buyerId } = req.body;

    if (!nftId || !buyerId) {
      return res.status(400).json({ error: 'NFT ID and buyer ID are required' });
    }

    // Find the NFT
    const nft = await prisma.NFT.findUnique({
      where: { id: nftId }
    });

    if (!nft) {
      return res.status(404).json({ error: 'NFT not found' });
    }

    // Check if NFT is for sale
    if (!nft.isForSale) {
      return res.status(400).json({ error: 'This NFT is not for sale' });
    }

    // Get buyer's wallet
    const buyerWallet = await prisma.algorandWallet.findUnique({
      where: { userId: buyerId }
    });

    if (!buyerWallet) {
      return res.status(404).json({ error: 'Buyer wallet not found' });
    }

    // Get seller's wallet
    const sellerWallet = await prisma.algorandWallet.findUnique({
      where: { userId: nft.ownerId }
    });

    if (!sellerWallet) {
      return res.status(404).json({ error: 'Seller wallet not found' });
    }

    // Create transaction record
    const transaction = await prisma.NFTTransaction.create({
      data: {
        nftId,
        sellerId: nft.ownerId,
        buyerId,
        price: nft.price,
        currency: nft.currency,
        createdAt: new Date()
      }
    });

    // Create Algorand transaction record
    await prisma.algorandTransaction.create({
      data: {
        nftId,
        type: 'TRANSFER',
        fromAddress: sellerWallet.address,
        toAddress: buyerWallet.address,
        amount: nft.price,
        status: 'PENDING',
        createdAt: new Date()
      }
    });

    // Update NFT ownership and sale status
    await prisma.NFT.update({
      where: { id: nftId },
      data: {
        ownerId: buyerId,
        isForSale: false,
        updatedAt: new Date()
      }
    });

    // Update marketplace listing
    await prisma.NFTMarketplaceListing.updateMany({
      where: {
        nftId,
        status: 'ACTIVE'
      },
      data: {
        status: 'SOLD',
        completedAt: new Date()
      }
    });

    return res.status(200).json({
      message: 'NFT purchase initiated',
      transaction,
      status: 'Your purchase is being processed on the Algorand blockchain. This may take a few minutes.'
    });
  } catch (error) {
    console.error('Error buying NFT:', error);
    return res.status(500).json({ error: 'Failed to buy NFT' });
  }
};

/**
 * Process the actual transfer of an NFT on Algorand blockchain
 * This would typically be called by a background job
 * @param {string} transactionId - The database ID of the Algorand transaction
 */
exports.processNFTTransfer = async (transactionId) => {
  try {
    // Get transaction information
    const transaction = await prisma.algorandTransaction.findUnique({
      where: { id: transactionId }
    });

    if (!transaction || transaction.status !== 'PENDING') {
      throw new Error('Valid pending transaction not found');
    }

    // In a real implementation, this would interact with the Algorand blockchain
    // For demo purposes, we'll just update the status
    
    // Update transaction status
    await prisma.algorandTransaction.update({
      where: { id: transactionId },
      data: {
        status: 'COMPLETED',
        transactionHash: 'mock_transaction_hash_' + Date.now(),
        completedAt: new Date()
      }
    });

    // Update NFT transaction with hash
    await prisma.NFTTransaction.updateMany({
      where: {
        nftId: transaction.nftId,
        transactionHash: null
      },
      data: {
        transactionHash: 'mock_transaction_hash_' + Date.now()
      }
    });

    return { success: true };
  } catch (error) {
    console.error('Error processing NFT transfer:', error);
    
    // Update transaction status to failed
    if (transactionId) {
      await prisma.algorandTransaction.update({
        where: { id: transactionId },
        data: {
          status: 'FAILED',
          errorMessage: error.message
        }
      });
    }
    
    return { success: false, error: error.message };
  }
};

/**
 * Get all NFTs in the marketplace
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
exports.getMarketplaceNFTs = async (req, res) => {
  try {
    const { page = 1, limit = 10, filter, sortBy } = req.query;
    const skip = (page - 1) * limit;

    // Build filter conditions
    let where = {
      isForSale: true
    };

    if (filter === 'trending') {
      // Add trending filter logic
      where.likes = {
        gte: 100 // Example: NFTs with at least 100 likes
      };
    } else if (filter === 'featured') {
      // Add featured filter logic
      where.featured = true;
    } else if (filter === 'minted') {
      // Only show minted NFTs
      where.blockchainStatus = 'MINTED';
    } else if (filter && filter !== 'all') {
      // Filter by tag
      where.nftTags = {
        some: {
          tag: {
            contains: filter
          }
        }
      };
    }

    // Build sort conditions
    let orderBy = {};
    if (sortBy === 'priceAsc') {
      orderBy.price = 'asc';
    } else if (sortBy === 'priceDesc') {
      orderBy.price = 'desc';
    } else if (sortBy === 'newest') {
      orderBy.createdAt = 'desc';
    } else {
      // Default: popular (by likes)
      orderBy.likes = 'desc';
    }

    // Get NFTs with pagination
    const nfts = await prisma.NFT.findMany({
      where,
      orderBy,
      skip,
      take: parseInt(limit),
      include: {
        creator: {
          select: {
            id: true,
            displayName: true,
            avatar: true,
            isVerified: true
          }
        },
        owner: {
          select: {
            id: true,
            displayName: true,
            avatar: true,
            isVerified: true
          }
        },
        nftTags: true
      }
    });

    // Get total count for pagination
    const totalCount = await prisma.NFT.count({ where });

    // Process NFTs to include audio URLs and format tags
    const processedNfts = await Promise.all(nfts.map(async (nft) => {
      // Extract tags from nftTags relation
      const tags = nft.nftTags ? nft.nftTags.map(tag => tag.tag) : [];
      
      // Create a clean NFT object without the nftTags relation
      const { nftTags, ...nftWithoutTags } = nft;
      
      // Make sure the image URL is absolute if it's a relative path
      let imageUrl = nft.imageUrl;
      if (imageUrl && imageUrl.startsWith('/')) {
        // If it's a relative path, make sure it's properly formatted
        if (!imageUrl.startsWith('/api/')) {
          imageUrl = `/api${imageUrl}`;
        }
      } else if (imageUrl && !imageUrl.startsWith('http')) {
        // If it's not an absolute URL and doesn't start with '/', add the API prefix
        imageUrl = `/api/images/nft/${imageUrl}`;
      }
      
      // Get the actual audio file path from the database
      let audioUrl;
      try {
        const audioFile = await prisma.audioFile.findUnique({
          where: { id: nft.audioFileId }
        });
        
        if (audioFile && audioFile.storagePath) {
          // Extract the filename from the storage path
          const filename = path.basename(audioFile.storagePath);
          audioUrl = `/api/audio/original/${filename}`;
        } else {
          // Fallback if no audio file found
          audioUrl = `/api/audio/original/${nft.audioFileId}`;
        }
      } catch (error) {
        console.warn(`Could not find audio file for NFT ${nft.id}:`, error.message);
        // Fallback URL
        audioUrl = `/api/audio/original/${nft.audioFileId}`;
      }
      
      return {
        ...nftWithoutTags,
        imageUrl: imageUrl,
        audioUrl: audioUrl,
        tags,
        available: nft.isForSale
      };
    }));

    return res.status(200).json({
      nfts: processedNfts,
      pagination: {
        total: totalCount,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error) {
    console.error('Error getting marketplace NFTs:', error);
    return res.status(500).json({ error: 'Failed to get marketplace NFTs' });
  }
};

/**
 * Get NFTs owned by a user
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
exports.getUserNFTs = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Get NFTs owned by the user
    const nfts = await prisma.NFT.findMany({
      where: {
        ownerId: userId
      },
      skip,
      take: parseInt(limit),
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        creator: {
          select: {
            id: true,
            displayName: true,
            avatar: true,
            isVerified: true
          }
        }
      }
    });

    // Get total count for pagination
    const totalCount = await prisma.NFT.count({
      where: {
        ownerId: userId
      }
    });

    // Process NFTs to include audio URLs and format image URLs
    const processedNfts = await Promise.all(nfts.map(async (nft) => {
      // Make sure the image URL is absolute if it's a relative path
      let imageUrl = nft.imageUrl;
      if (imageUrl && imageUrl.startsWith('/')) {
        // If it's a relative path, make sure it's properly formatted
        if (!imageUrl.startsWith('/api/')) {
          imageUrl = `/api${imageUrl}`;
        }
      } else if (imageUrl && !imageUrl.startsWith('http')) {
        // If it's not an absolute URL and doesn't start with '/', add the API prefix
        imageUrl = `/api/images/nft/${imageUrl}`;
      }
      
      // Get the actual audio file path from the database
      let audioUrl;
      try {
        const audioFile = await prisma.audioFile.findUnique({
          where: { id: nft.audioFileId }
        });
        
        if (audioFile && audioFile.storagePath) {
          // Extract the filename from the storage path
          const filename = path.basename(audioFile.storagePath);
          audioUrl = `/api/audio/original/${filename}`;
        } else {
          // Fallback if no audio file found
          audioUrl = `/api/audio/original/${nft.audioFileId}`;
        }
      } catch (error) {
        console.warn(`Could not find audio file for NFT ${nft.id}:`, error.message);
        // Fallback URL
        audioUrl = `/api/audio/original/${nft.audioFileId}`;
      }
      
      return {
        ...nft,
        imageUrl: imageUrl,
        audioUrl: audioUrl
      };
    }));

    return res.status(200).json({
      nfts: processedNfts,
      pagination: {
        total: totalCount,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error) {
    console.error('Error getting user NFTs:', error);
    return res.status(500).json({ error: 'Failed to get user NFTs' });
  }
};

/**
 * Get NFTs created by a user
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
exports.getCreatedNFTs = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Get NFTs created by the user
    const nfts = await prisma.NFT.findMany({
      where: {
        creatorId: userId
      },
      skip,
      take: parseInt(limit),
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        owner: {
          select: {
            id: true,
            displayName: true,
            avatar: true,
            isVerified: true
          }
        }
      }
    });

    // Get total count for pagination
    const totalCount = await prisma.NFT.count({
      where: {
        creatorId: userId
      }
    });

    // Process NFTs to include audio URLs and format image URLs
    const processedNfts = await Promise.all(nfts.map(async (nft) => {
      // Make sure the image URL is absolute if it's a relative path
      let imageUrl = nft.imageUrl;
      if (imageUrl && imageUrl.startsWith('/')) {
        // If it's a relative path, make sure it's properly formatted
        if (!imageUrl.startsWith('/api/')) {
          imageUrl = `/api${imageUrl}`;
        }
      } else if (imageUrl && !imageUrl.startsWith('http')) {
        // If it's not an absolute URL and doesn't start with '/', add the API prefix
        imageUrl = `/api/images/nft/${imageUrl}`;
      }
      
      // Get the actual audio file path from the database
      let audioUrl;
      try {
        const audioFile = await prisma.audioFile.findUnique({
          where: { id: nft.audioFileId }
        });
        
        if (audioFile && audioFile.storagePath) {
          // Extract the filename from the storage path
          const filename = path.basename(audioFile.storagePath);
          audioUrl = `/api/audio/original/${filename}`;
        } else {
          // Fallback if no audio file found
          audioUrl = `/api/audio/original/${nft.audioFileId}`;
        }
      } catch (error) {
        console.warn(`Could not find audio file for NFT ${nft.id}:`, error.message);
        // Fallback URL
        audioUrl = `/api/audio/original/${nft.audioFileId}`;
      }
      
      return {
        ...nft,
        imageUrl: imageUrl,
        audioUrl: audioUrl
      };
    }));

    return res.status(200).json({
      nfts: processedNfts,
      pagination: {
        total: totalCount,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error) {
    console.error('Error getting created NFTs:', error);
    return res.status(500).json({ error: 'Failed to get created NFTs' });
  }
};

/**
 * Get details of a specific NFT
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
exports.getNFTDetails = async (req, res) => {
  try {
    const { nftId } = req.params;

    if (!nftId) {
      return res.status(400).json({ error: 'NFT ID is required' });
    }

    // Get NFT details
    const nft = await prisma.NFT.findUnique({
      where: { id: nftId },
      include: {
        creator: {
          select: {
            id: true,
            displayName: true,
            avatar: true,
            isVerified: true
          }
        },
        owner: {
          select: {
            id: true,
            displayName: true,
            avatar: true,
            isVerified: true
          }
        },
        transactions: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 10
        }
      }
    });

    if (!nft) {
      return res.status(404).json({ error: 'NFT not found' });
    }

    // Get blockchain information if available
    let blockchainInfo = null;
    if (nft.assetId) {
      try {
        // In a real implementation, this would fetch data from Algorand
        blockchainInfo = {
          assetId: nft.assetId,
          creator: nft.creator.displayName,
          totalSupply: 1, // NFTs have supply of 1
          decimals: 0,
          defaultFrozen: false,
          url: `https://voiceverse.io/nft/${nft.id}`,
          unitName: 'VOICE',
          assetName: nft.title
        };
      } catch (error) {
        console.error('Error fetching blockchain info:', error);
      }
    }

    // Make sure the image URL is absolute if it's a relative path
    let imageUrl = nft.imageUrl;
    if (imageUrl && imageUrl.startsWith('/')) {
      // If it's a relative path, make sure it's properly formatted
      if (!imageUrl.startsWith('/api/')) {
        imageUrl = `/api${imageUrl}`;
      }
    } else if (imageUrl && !imageUrl.startsWith('http')) {
      // If it's not an absolute URL and doesn't start with '/', add the API prefix
      imageUrl = `/api/images/nft/${imageUrl}`;
    }
    
    // Get the actual audio file path from the database
    let audioUrl;
    try {
      const audioFile = await prisma.audioFile.findUnique({
        where: { id: nft.audioFileId }
      });
      
      if (audioFile && audioFile.storagePath) {
        // Extract the filename from the storage path
        const filename = path.basename(audioFile.storagePath);
        audioUrl = `/api/audio/original/${filename}`;
      } else {
        // Fallback if no audio file found
        audioUrl = `/api/audio/original/${nft.audioFileId}`;
      }
    } catch (error) {
      console.warn(`Could not find audio file for NFT ${nft.id}:`, error.message);
      // Fallback URL
      audioUrl = `/api/audio/original/${nft.audioFileId}`;
    }
    
    // Create a formatted NFT object with proper URLs
    const formattedNft = {
      ...nft,
      imageUrl: imageUrl,
      audioUrl: audioUrl
    };

    return res.status(200).json({
      nft: formattedNft,
      blockchainInfo
    });
  } catch (error) {
    console.error('Error getting NFT details:', error);
    return res.status(500).json({ error: 'Failed to get NFT details' });
  }
};

/**
 * Like an NFT
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
exports.likeNFT = async (req, res) => {
  try {
    const { nftId, userId } = req.body;

    if (!nftId || !userId) {
      return res.status(400).json({ error: 'NFT ID and user ID are required' });
    }

    // Check if user already liked this NFT
    const existingLike = await prisma.NFTLike.findFirst({
      where: {
        nftId,
        userId
      }
    });

    if (existingLike) {
      // Unlike the NFT
      await prisma.NFTLike.delete({
        where: {
          id: existingLike.id
        }
      });

      // Decrement like count
      await prisma.NFT.update({
        where: { id: nftId },
        data: {
          likes: {
            decrement: 1
          }
        }
      });

      return res.status(200).json({
        message: 'NFT unliked successfully',
        liked: false
      });
    } else {
      // Like the NFT
      await prisma.NFTLike.create({
        data: {
          nftId,
          userId,
          createdAt: new Date()
        }
      });

      // Increment like count
      await prisma.NFT.update({
        where: { id: nftId },
        data: {
          likes: {
            increment: 1
          }
        }
      });

      return res.status(200).json({
        message: 'NFT liked successfully',
        liked: true
      });
    }
  } catch (error) {
    console.error('Error liking NFT:', error);
    return res.status(500).json({ error: 'Failed to like NFT' });
  }
};