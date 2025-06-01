// algorandStore.ts
import { create } from 'zustand';
import { algorandService, AlgorandWallet, NFT } from '../lib/algorandService';

interface AlgorandState {
  wallet: AlgorandWallet | null;
  isConnecting: boolean;
  error: string | null;
  ownedNFTs: NFT[];
  createdNFTs: NFT[];
  isLoadingNFTs: boolean;
  
  // Actions
  connectWallet: (userId: string, walletAddress: string) => Promise<void>;
  disconnectWallet: () => void;
  fetchWalletInfo: (userId: string) => Promise<void>;
  fetchOwnedNFTs: (userId: string) => Promise<void>;
  fetchCreatedNFTs: (userId: string) => Promise<void>;
  createNFT: (nftData: {
    userId: string;
    title: string;
    description: string;
    audioFileId: string;
    imageUrl: string;
    price: number;
    royalty?: number;
  }) => Promise<NFT | null>;
  listNFTForSale: (nftId: string, price: number, userId: string) => Promise<boolean>;
  buyNFT: (nftId: string, buyerId: string) => Promise<boolean>;
  likeNFT: (nftId: string, userId: string) => Promise<boolean>;
}

export const useAlgorandStore = create<AlgorandState>((set, get) => ({
  wallet: null,
  isConnecting: false,
  error: null,
  ownedNFTs: [],
  createdNFTs: [],
  isLoadingNFTs: false,
  
  // Connect wallet
  connectWallet: async (userId: string, walletAddress: string) => {
    try {
      set({ isConnecting: true, error: null });
      const response = await algorandService.connectWallet(userId, walletAddress);
      set({ wallet: response.wallet, isConnecting: false });
    } catch (error) {
      console.error('Error connecting wallet:', error);
      set({ 
        isConnecting: false, 
        error: error instanceof Error ? error.message : 'Failed to connect wallet' 
      });
    }
  },
  
  // Disconnect wallet
  disconnectWallet: () => {
    set({ wallet: null, ownedNFTs: [], createdNFTs: [] });
    // In a real implementation, you might want to call an API to invalidate the wallet connection
  },
  
  // Fetch wallet info
  fetchWalletInfo: async (userId: string) => {
    try {
      set({ isConnecting: true, error: null });
      const response = await algorandService.getWalletInfo(userId);
      set({ wallet: response.wallet, isConnecting: false });
    } catch (error) {
      console.error('Error fetching wallet info:', error);
      set({ 
        isConnecting: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch wallet info' 
      });
    }
  },
  
  // Fetch owned NFTs
  fetchOwnedNFTs: async (userId: string) => {
    try {
      set({ isLoadingNFTs: true });
      const response = await algorandService.getUserNFTs(userId);
      set({ ownedNFTs: response.nfts, isLoadingNFTs: false });
    } catch (error) {
      console.error('Error fetching owned NFTs:', error);
      set({ isLoadingNFTs: false });
    }
  },
  
  // Fetch created NFTs
  fetchCreatedNFTs: async (userId: string) => {
    try {
      set({ isLoadingNFTs: true });
      const response = await algorandService.getCreatedNFTs(userId);
      set({ createdNFTs: response.nfts, isLoadingNFTs: false });
    } catch (error) {
      console.error('Error fetching created NFTs:', error);
      set({ isLoadingNFTs: false });
    }
  },
  
  // Create NFT
  createNFT: async (nftData) => {
    try {
      const response = await algorandService.createNFT(nftData);
      // Refresh created NFTs
      get().fetchCreatedNFTs(nftData.userId);
      return response.nft;
    } catch (error) {
      console.error('Error creating NFT:', error);
      return null;
    }
  },
  
  // List NFT for sale
  listNFTForSale: async (nftId: string, price: number, userId: string) => {
    try {
      await algorandService.listNFTForSale(nftId, price, userId);
      // Refresh owned NFTs
      get().fetchOwnedNFTs(userId);
      return true;
    } catch (error) {
      console.error('Error listing NFT for sale:', error);
      return false;
    }
  },
  
  // Buy NFT
  buyNFT: async (nftId: string, buyerId: string) => {
    try {
      await algorandService.buyNFT(nftId, buyerId);
      // Refresh owned NFTs
      get().fetchOwnedNFTs(buyerId);
      return true;
    } catch (error) {
      console.error('Error buying NFT:', error);
      return false;
    }
  },
  
  // Like NFT
  likeNFT: async (nftId: string, userId: string) => {
    try {
      const response = await algorandService.likeNFT(nftId, userId);
      return response.liked;
    } catch (error) {
      console.error('Error liking NFT:', error);
      return false;
    }
  }
}));

export default useAlgorandStore;