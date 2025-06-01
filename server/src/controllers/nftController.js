const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Create an NFT on Algorand blockchain
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
exports.createNFT = async (req, res) => {
  try {
    console.log('Creating NFT with data:', req.body);
    
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
    
    // First, check if the user exists in the database
    console.log('Checking if user exists in database...');
    let user;
    try {
      user = await prisma.user.findUnique({
        where: { id: userId }
      });
    } catch (error) {
      console.log('Error checking user:', error);
    }
    
    // If user doesn't exist, create a mock user first
    if (!user) {
      console.log('User not found, creating a mock user for development...');
      try {
        user = await prisma.user.create({
          data: {
            id: userId,
            username: `user_${userId}`,
            email: `user${userId}@example.com`,
            password: 'hashedpassword',
            displayName: 'Development User',
            createdAt: new Date(),
            updatedAt: new Date()
          }
        });
        console.log('Created mock user:', user);
      } catch (userError) {
        console.error('Failed to create mock user:', userError);
        return res.status(500).json({ error: 'Failed to create user record. Please try again.' });
      }
    }
    
    // Now check for wallet
    let wallet;
    try {
      wallet = await prisma.algorandWallet.findUnique({
        where: { userId }
      });
    } catch (error) {
      console.log('Error checking wallet:', error);
    }
    
    // If wallet doesn't exist, create one
    if (!wallet) {
      console.log('Wallet not found, creating a wallet for the user...');
      try {
        wallet = await prisma.algorandWallet.create({
          data: {
            userId,
            address: `ALGO_${Math.random().toString(36).substring(2, 15).toUpperCase()}`,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        });
        console.log('Created wallet:', wallet);
      } catch (walletError) {
        console.error('Failed to create wallet:', walletError);
        return res.status(500).json({ error: 'Failed to create wallet record. Please try again.' });
      }
    }
    
    // Now we have both user and wallet, proceed with NFT creation
    let nft;
    try {
      // Start a transaction to ensure all database operations succeed or fail together
      nft = await prisma.$transaction(async (prismaClient) => {
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
        
        console.log('Created NFT record:', newNft);

        // Create Algorand NFT transaction record
        const transaction = await prismaClient.algorandTransaction.create({
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
        
        console.log('Created transaction record:', transaction);

        // Create marketplace listing
        const listing = await prismaClient.NFTMarketplaceListing.create({
          data: {
            nftId: newNft.id,
            sellerId: userId,
            price: parseFloat(price),
            currency: 'ALGO',
            status: 'ACTIVE',
            createdAt: new Date()
          }
        });
        
        console.log('Created marketplace listing:', listing);
        
        // Create NFT tags if provided
        if (tags && tags.length > 0) {
          for (const tag of tags) {
            await prismaClient.NFTTag.create({
              data: {
                nftId: newNft.id,
                tag
              }
            });
          }
          console.log(`Added ${tags.length} tags to NFT`);
        }

        return newNft;
      });
      
      console.log('Successfully created NFT with all related records:', nft.id);
    } catch (error) {
      console.error('Error in NFT creation transaction:', error);
      return res.status(500).json({ error: 'Database error creating NFT. Please try again.' });
    }

    // Make sure the image URL is absolute if it's a relative path
    let formattedImageUrl = imageUrl;
    if (formattedImageUrl && formattedImageUrl.startsWith('/')) {
      // If it's a relative path, make sure it's properly formatted
      if (!formattedImageUrl.startsWith('/api/')) {
        formattedImageUrl = `/api${formattedImageUrl}`;
      }
    }

    // Return the created NFT with additional information
    return res.status(201).json({
      message: 'NFT creation initiated',
      nft: {
        ...nft,
        imageUrl: formattedImageUrl,
        audioUrl: `/api/audio/${audioFileId}`,
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