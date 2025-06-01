// algorandService.ts
import axios from 'axios';

// Use environment variable for API URL if available, otherwise use default
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const ALGORAND_API_KEY = '98D9CE80660AD243893D56D9F125CD2D';

// Create axios instance with base URL
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': ALGORAND_API_KEY
  },
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Wallet interface
export interface AlgorandWallet {
  address: string;
  balance: number;
  assets: any[];
}

// NFT interface
export interface NFT {
  id: string;
  title: string;
  description: string;
  creatorId: string;
  ownerId: string;
  audioFileId: string;
  imageUrl: string;
  price: number;
  currency: string;
  royalty: number;
  likes: number;
  isForSale: boolean;
  assetId?: number;
  blockchainStatus?: string;
  metadata?: string;
  creator?: {
    id: string;
    displayName: string;
    avatar: string;
    isVerified: boolean;
  };
  owner?: {
    id: string;
    displayName: string;
    avatar: string;
    isVerified: boolean;
  };
}

// Transaction interface
export interface AlgorandTransaction {
  id: string;
  nftId: string;
  type: 'MINT' | 'TRANSFER' | 'SALE' | 'ROYALTY';
  fromAddress: string;
  toAddress: string;
  amount: number;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  transactionHash?: string;
  errorMessage?: string;
  createdAt: string;
  completedAt?: string;
}

// Marketplace listing interface
export interface NFTMarketplaceListing {
  id: string;
  nftId: string;
  sellerId: string;
  price: number;
  currency: string;
  status: 'ACTIVE' | 'SOLD' | 'CANCELLED';
  createdAt: string;
  completedAt?: string;
}

// Algorand service
export const algorandService = {
  // Connect wallet
  connectWallet: async (userId: string, walletAddress: string): Promise<{ wallet: AlgorandWallet }> => {
    try {
      const response = await api.post('/algorand/wallet/connect', { userId, walletAddress });
      return response.data;
    } catch (error) {
      console.error('Error connecting wallet:', error);
      throw error;
    }
  },
  
  // Get wallet info
  getWalletInfo: async (userId: string): Promise<{ wallet: AlgorandWallet }> => {
    try {
      const response = await api.get(`/algorand/wallet/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error getting wallet info:', error);
      throw error;
    }
  },
  
  // Create NFT
  createNFT: async (nftData: {
    userId: string;
    title: string;
    description: string;
    audioFileId: string;
    imageUrl: string;
    price: number;
    royalty?: number;
  }): Promise<{ nft: NFT; status: string }> => {
    try {
      const response = await api.post('/algorand/nft/create', nftData);
      return response.data;
    } catch (error) {
      console.error('Error creating NFT:', error);
      throw error;
    }
  },
  
  // List NFT for sale
  listNFTForSale: async (nftId: string, price: number, userId: string): Promise<{ listing: NFTMarketplaceListing }> => {
    try {
      const response = await api.post('/algorand/nft/list', { nftId, price, userId });
      return response.data;
    } catch (error) {
      console.error('Error listing NFT for sale:', error);
      throw error;
    }
  },
  
  // Buy NFT
  buyNFT: async (nftId: string, buyerId: string): Promise<{ transaction: AlgorandTransaction; status: string }> => {
    try {
      const response = await api.post('/algorand/nft/buy', { nftId, buyerId });
      return response.data;
    } catch (error) {
      console.error('Error buying NFT:', error);
      throw error;
    }
  },
  
  // Get marketplace NFTs
  getMarketplaceNFTs: async (page: number = 1, limit: number = 10, filter?: string, sortBy?: string): Promise<{ nfts: NFT[]; pagination: any }> => {
    try {
      const params = { page, limit, filter, sortBy };
      const response = await api.get('/algorand/nft/marketplace', { params });
      return response.data;
    } catch (error) {
      console.error('Error getting marketplace NFTs:', error);
      throw error;
    }
  },
  
  // Get user's NFTs
  getUserNFTs: async (userId: string, page: number = 1, limit: number = 10): Promise<{ nfts: NFT[]; pagination: any }> => {
    try {
      const params = { page, limit };
      const response = await api.get(`/algorand/nft/user/${userId}`, { params });
      return response.data;
    } catch (error) {
      console.error('Error getting user NFTs:', error);
      throw error;
    }
  },
  
  // Get NFTs created by a user
  getCreatedNFTs: async (userId: string, page: number = 1, limit: number = 10): Promise<{ nfts: NFT[]; pagination: any }> => {
    try {
      const params = { page, limit };
      const response = await api.get(`/algorand/nft/created/${userId}`, { params });
      return response.data;
    } catch (error) {
      console.error('Error getting created NFTs:', error);
      throw error;
    }
  },
  
  // Get NFT details
  getNFTDetails: async (nftId: string): Promise<{ nft: NFT; blockchainInfo?: any }> => {
    try {
      const response = await api.get(`/algorand/nft/${nftId}`);
      return response.data;
    } catch (error) {
      console.error('Error getting NFT details:', error);
      throw error;
    }
  },
  
  // Like NFT
  likeNFT: async (nftId: string, userId: string): Promise<{ liked: boolean }> => {
    try {
      const response = await api.post('/algorand/nft/like', { nftId, userId });
      return response.data;
    } catch (error) {
      console.error('Error liking NFT:', error);
      throw error;
    }
  },
  
  // Get transaction history for an NFT
  getNFTTransactionHistory: async (nftId: string): Promise<{ transactions: AlgorandTransaction[] }> => {
    try {
      const response = await api.get(`/algorand/nft/${nftId}/transactions`);
      return response.data;
    } catch (error) {
      console.error('Error getting NFT transaction history:', error);
      throw error;
    }
  },
  
  // Get transaction status
  getTransactionStatus: async (transactionId: string): Promise<{ transaction: AlgorandTransaction }> => {
    try {
      const response = await api.get(`/algorand/transaction/${transactionId}`);
      return response.data;
    } catch (error) {
      console.error('Error getting transaction status:', error);
      throw error;
    }
  }
};

export default algorandService;