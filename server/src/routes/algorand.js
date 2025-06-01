const express = require('express');
const router = express.Router();
const algorandController = require('../controllers/algorandController');
const { authenticateToken } = require('../middleware/auth');

// Wallet routes
router.post('/wallet/connect', algorandController.connectWallet);
router.get('/wallet/:userId', authenticateToken, algorandController.getWalletInfo);

// NFT routes
router.post('/nft/create', authenticateToken, algorandController.createNFT);
router.post('/nft/list', authenticateToken, algorandController.listNFTForSale);
router.post('/nft/buy', authenticateToken, algorandController.buyNFT);
router.get('/nft/marketplace', algorandController.getMarketplaceNFTs);
router.get('/nft/user/:userId', authenticateToken, algorandController.getUserNFTs);
router.get('/nft/created/:userId', authenticateToken, algorandController.getCreatedNFTs);
router.get('/nft/:nftId', algorandController.getNFTDetails);
router.post('/nft/like', authenticateToken, algorandController.likeNFT);

// Transaction routes
router.get('/nft/:nftId/transactions', authenticateToken, async (req, res) => {
  try {
    const { nftId } = req.params;
    const transactions = await req.prisma.algorandTransaction.findMany({
      where: { nftId },
      orderBy: { createdAt: 'desc' }
    });
    
    res.status(200).json({ transactions });
  } catch (error) {
    console.error('Error getting NFT transactions:', error);
    res.status(500).json({ error: 'Failed to get NFT transactions' });
  }
});

router.get('/transaction/:transactionId', authenticateToken, async (req, res) => {
  try {
    const { transactionId } = req.params;
    const transaction = await req.prisma.algorandTransaction.findUnique({
      where: { id: transactionId }
    });
    
    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    
    res.status(200).json({ transaction });
  } catch (error) {
    console.error('Error getting transaction:', error);
    res.status(500).json({ error: 'Failed to get transaction' });
  }
});

module.exports = router;