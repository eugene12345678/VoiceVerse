import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Diamond,
  Wallet,
  TrendingUp,
  BarChart3,
  Play,
  Heart,
  Share2,
  Filter,
  Search,
  Grid,
  List,
  Clock,
  ArrowUp,
  Sparkles,
  Crown,
  Zap,
  DollarSign,
  Tag,
  Music,
  MoreHorizontal,
  ExternalLink,
  AlertCircle,
  Check,
  Loader,
  Upload,
  X,
  Plus
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Avatar } from '../components/ui/Avatar';
import { IconButton } from '../components/ui/IconButton';
import { WaveformVisualizer } from '../components/audio/WaveformVisualizer';
import { formatNumber } from '../lib/utils';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

// Algorand API configuration
const ALGORAND_API_KEY = import.meta.env.VITE_ALGORAND_API_KEY || '';
// Use environment variable for API URL if available, otherwise use default
const API_URL = import.meta.env.VITE_API_URL || 'https://voiceverse-dzza.onrender.com/api';

// Create axios instance with base URL
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': ALGORAND_API_KEY
  },
});

// Note: API_URL already includes '/api' prefix, so don't add it in individual requests

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

// Algorand API
export const algorandAPI = {
  // Connect wallet
  connectWallet: async (userId: string, walletAddress: string) => {
    const response = await api.post('/algorand/wallet/connect', { userId, walletAddress });
    return response.data;
  },
  
  // Get wallet info
  getWalletInfo: async (userId: string) => {
    const response = await api.get(`/algorand/wallet/${userId}`);
    return response.data;
  },
  
  // Upload file to server
  uploadFile: async (file: File, type: 'audio' | 'image') => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);
    
    const response = await api.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    
    return response.data;
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
    tags?: string[];
    duration?: string;
  }) => {
    const response = await api.post('/algorand/nft/create', nftData);
    return response.data;
  },
  
  // List NFT for sale
  listNFTForSale: async (nftId: string, price: number, userId: string) => {
    const response = await api.post('/algorand/nft/list', { nftId, price, userId });
    return response.data;
  },
  
  // Buy NFT
  buyNFT: async (nftId: string, buyerId: string) => {
    const response = await api.post('/algorand/nft/buy', { nftId, buyerId });
    return response.data;
  },
  
  // Get marketplace NFTs
  getMarketplaceNFTs: async (page: number = 1, limit: number = 10, filter?: string, sortBy?: string) => {
    const params = { page, limit, filter, sortBy };
    const response = await api.get('/algorand/nft/marketplace', { params });
    return response.data;
  },
  
  // Get user's NFTs
  getUserNFTs: async (userId: string, page: number = 1, limit: number = 10) => {
    const params = { page, limit };
    const response = await api.get(`/algorand/nft/user/${userId}`, { params });
    return response.data;
  },
  
  // Get NFTs created by a user
  getCreatedNFTs: async (userId: string, page: number = 1, limit: number = 10) => {
    const params = { page, limit };
    const response = await api.get(`/algorand/nft/created/${userId}`, { params });
    return response.data;
  },
  
  // Get NFT details
  getNFTDetails: async (nftId: string) => {
    const response = await api.get(`/algorand/nft/${nftId}`);
    return response.data;
  },
  
  // Like NFT
  likeNFT: async (nftId: string, userId: string) => {
    const response = await api.post('/algorand/nft/like', { nftId, userId });
    return response.data;
  }
};

// Initial NFTs data
const initialNFTs = [
  {
    id: '1',
    title: 'Morgan Freeman Narration',
    description: 'A perfect Morgan Freeman impression narrating a day in the life.',
    audioUrl: 'https://www2.cs.uic.edu/~i101/SoundFiles/BabyElephantWalk60.wav',
    imageUrl: 'https://images.pexels.com/photos/2105416/pexels-photo-2105416.jpeg?auto=compress&cs=tinysrgb&w=600',
    creator: {
      id: 'user1',
      displayName: 'Voice Master',
      avatar: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=600',
      isVerified: true
    },
    owner: {
      id: 'user2',
      displayName: 'NFT Collector',
      avatar: 'https://images.pexels.com/photos/91227/pexels-photo-91227.jpeg?auto=compress&cs=tinysrgb&w=600',
      isVerified: false
    },
    price: 1000,
    currency: 'ALGO',
    likes: 1234,
    isLiked: false,
    views: 5678,
    duration: '01:30',
    royalty: 10,
    history: [
      { type: 'mint', price: 500, date: '2024-02-01T00:00:00Z' },
      { type: 'sale', price: 800, date: '2024-02-15T00:00:00Z' },
      { type: 'list', price: 1000, date: '2024-02-28T00:00:00Z' }
    ],
    tags: ['celebrity', 'narration', 'premium'],
    featured: true,
    trending: true
  },
  {
    id: '2',
    title: 'Multi-Language Song',
    description: 'One song performed in 5 different languages seamlessly.',
    audioUrl: 'https://www2.cs.uic.edu/~i101/SoundFiles/CantinaBand3.wav',
    imageUrl: 'https://images.pexels.com/photos/7149165/pexels-photo-7149165.jpeg?auto=compress&cs=tinysrgb&w=600',
    creator: {
      id: 'user2',
      displayName: 'Language Master',
      avatar: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=600',
      isVerified: false
    },
    owner: {
      id: 'user2',
      displayName: 'Language Master',
      avatar: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=600',
      isVerified: false
    },
    price: 500,
    currency: 'ALGO',
    likes: 856,
    isLiked: true,
    views: 2345,
    duration: '02:15',
    royalty: 15,
    history: [
      { type: 'mint', price: 300, date: '2024-02-20T00:00:00Z' },
      { type: 'list', price: 500, date: '2024-02-28T00:00:00Z' }
    ],
    tags: ['multilingual', 'music', 'rare'],
    featured: false,
    trending: true
  }
];

interface NFTCardProps {
  nft: NFT;
  onLike: (nftId: string) => void;
  layout?: 'grid' | 'list';
  wallet: WalletState;
  onBuy: (nft: NFT) => void;
  currentUser: {
    id: string;
    displayName: string;
    avatar: string;
  };
}

const NFTCard: React.FC<NFTCardProps> = ({ nft, onLike, layout = 'grid', wallet, onBuy, currentUser }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const CardContent = () => (
    <>
      <div className={`relative ${layout === 'grid' ? 'aspect-square' : 'h-48'}`}>
        <img
          src={nft.imageUrl}
          alt={nft.title}
          className="w-full h-full object-cover rounded-t-xl"
          onError={(e) => {
            // Fallback image if the NFT image fails to load
            e.currentTarget.src = 'https://images.pexels.com/photos/7149165/pexels-photo-7149165.jpeg?auto=compress&cs=tinysrgb&w=600';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-4">
          <div className="w-full">
            <WaveformVisualizer
              audioUrl={nft.audioUrl}
              isPlaying={isPlaying}
              onPlayPause={() => setIsPlaying(!isPlaying)}
              height={40}
              waveColor="rgba(255, 255, 255, 0.4)"
              progressColor="rgba(255, 255, 255, 0.8)"
            />
          </div>
        </div>
        {nft.trending && (
          <div className="absolute top-4 left-4 px-2 py-1 bg-primary-600/90 text-white text-sm rounded-full flex items-center gap-1">
            <TrendingUp className="h-3 w-3" />
            Trending
          </div>
        )}
      </div>

      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Avatar
              src={nft.creator.avatar}
              alt={nft.creator.displayName}
              size="sm"
              isVerified={nft.creator.isVerified}
            />
            <div>
              <span className="text-sm font-medium text-dark-900 dark:text-white">
                {nft.creator.displayName}
              </span>
              <div className="text-xs text-dark-500 dark:text-dark-400">
                Creator
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Diamond className="h-4 w-4 text-primary-600 dark:text-primary-400" />
            <span className="font-medium text-primary-600 dark:text-primary-400">
              {nft.price} {nft.currency}
            </span>
          </div>
        </div>

        <h3 className="font-semibold text-dark-900 dark:text-white mb-2">
          {nft.title}
        </h3>
        <p className="text-sm text-dark-600 dark:text-dark-400 mb-4">
          {nft.description}
        </p>

        <div className="flex flex-wrap gap-2 mb-4">
          {nft.tags.map(tag => (
            <span
              key={tag}
              className="px-2 py-1 bg-gray-100 dark:bg-dark-800 rounded-full text-xs text-dark-600 dark:text-dark-400 hover:bg-gray-200 dark:hover:bg-dark-700 cursor-pointer transition-colors"
            >
              #{tag}
            </span>
          ))}
        </div>

        <AnimatePresence>
          {showDetails && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mb-4"
            >
              <div className="space-y-4 border-t border-gray-200 dark:border-dark-700 pt-4">
                <div>
                  <h4 className="text-sm font-medium text-dark-900 dark:text-white mb-2">
                    Price History
                  </h4>
                  <div className="space-y-2">
                    {nft.history.map((event, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="text-dark-600 dark:text-dark-400 capitalize">
                          {event.type}
                        </span>
                        <span className="text-dark-900 dark:text-white font-medium">
                          {event.price} {nft.currency}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-dark-900 dark:text-white mb-2">
                    Details
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="text-dark-600 dark:text-dark-400">
                      Duration:
                    </div>
                    <div className="text-dark-900 dark:text-white font-medium">
                      {nft.duration}
                    </div>
                    <div className="text-dark-600 dark:text-dark-400">
                      Royalty:
                    </div>
                    <div className="text-dark-900 dark:text-white font-medium">
                      {nft.royalty}%
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              className="flex items-center gap-1 text-dark-500 dark:text-dark-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
              onClick={() => onLike(nft.id)}
            >
              <Heart
                className={`h-5 w-5 ${
                  nft.isLiked ? 'fill-primary-600 text-primary-600 dark:fill-primary-400 dark:text-primary-400' : ''
                }`}
              />
              <span>{formatNumber(nft.likes)}</span>
            </button>
            <button className="flex items-center gap-1 text-dark-500 dark:text-dark-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
              <Share2 className="h-5 w-5" />
            </button>
            <button
              className="text-dark-500 dark:text-dark-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
              onClick={() => setShowDetails(!showDetails)}
            >
              {showDetails ? 'Less' : 'More'}
            </button>
          </div>
          <Button 
            size="sm"
            onClick={() => onBuy(nft)}
            disabled={!wallet.connected || (nft.owner.id === currentUser.id)}
          >
            {nft.owner.id === currentUser.id ? 'You Own This' : 'Buy Now'}
          </Button>
        </div>
      </div>
    </>
  );

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      layout
      className={layout === 'list' ? 'col-span-full' : ''}
    >
      <Card className="overflow-hidden h-full">
        {layout === 'list' ? (
          <div className="flex">
            <div className="w-1/3">
              <CardContent />
            </div>
            <div className="flex-1 p-6">
              {/* Additional list view content */}
            </div>
          </div>
        ) : (
          <CardContent />
        )}
      </Card>
    </motion.div>
  );
};

// Wallet connection state interface
interface WalletState {
  connected: boolean;
  address: string;
  balance: number;
  assets: any[];
  loading: boolean;
  error: string | null;
}

// NFT interface with Algorand fields
interface NFT {
  id: string;
  title: string;
  description: string;
  audioUrl: string;
  imageUrl: string;
  creator: {
    id: string;
    displayName: string;
    avatar: string;
    isVerified: boolean;
  };
  owner: {
    id: string;
    displayName: string;
    avatar: string;
    isVerified: boolean;
  };
  price: number;
  currency: string;
  likes: number;
  isLiked: boolean;
  views: number;
  duration: string;
  royalty: number;
  history: {
    type: string;
    price: number;
    date: string;
  }[];
  tags: string[];
  featured: boolean;
  trending: boolean;
  assetId?: number;
  blockchainStatus?: string;
  available?: boolean;
}

// NFT Creation Form Data
interface NFTFormData {
  title: string;
  description: string;
  audioFile: File | null;
  coverImage: File | null;
  price: number;
  royalty: number;
  tags: string[];
  audioPreviewUrl: string | null;
  imagePreviewUrl: string | null;
}

export const MarketplacePage = () => {
  const navigate = useNavigate();
  const [nfts, setNfts] = useState<NFT[]>(initialNFTs);
  const [filter, setFilter] = useState('all');
  const [layout, setLayout] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<'popular' | 'newest' | 'priceAsc' | 'priceDesc'>('popular');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 5000]);

  // Wallet state
  const [wallet, setWallet] = useState<WalletState>({
    connected: false,
    address: '',
    balance: 0,
    assets: [],
    loading: false,
    error: null
  });

  // Get authenticated user from auth store
  const { user: authUser } = useAuthStore();
  
  // Use authenticated user or fallback to default if not logged in
  const user = authUser || {
    id: 'user1',
    displayName: 'You',
    avatar: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=600'
  };

  // NFT creation state
  const [isCreatingNFT, setIsCreatingNFT] = useState(false);
  const [createNFTError, setCreateNFTError] = useState<string | null>(null);
  const [nftFormData, setNftFormData] = useState<NFTFormData>({
    title: '',
    description: '',
    audioFile: null,
    coverImage: null,
    price: 100,
    royalty: 10,
    tags: [],
    audioPreviewUrl: null,
    imagePreviewUrl: null
  });
  const [currentTag, setCurrentTag] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Transaction state
  const [transactionStatus, setTransactionStatus] = useState<{
    loading: boolean;
    success: boolean;
    error: string | null;
    message: string;
  }>({
    loading: false,
    success: false,
    error: null,
    message: ''
  });

  // Fetch NFTs on component mount
  useEffect(() => {
    fetchMarketplaceNFTs();
  }, [filter, sortBy]);

  // Fetch marketplace NFTs
  const fetchMarketplaceNFTs = async () => {
    try {
      // Try to fetch from API
      const response = await algorandAPI.getMarketplaceNFTs(1, 10, filter, sortBy);
      if (response && response.nfts) {
        // Process NFTs to ensure they have all required properties
        const processedNfts = response.nfts.map(nft => {
          // Ensure creator and owner have display names
          const creator = {
            id: nft.creator?.id || 'unknown',
            displayName: nft.creator?.displayName || 'Unknown Creator',
            avatar: nft.creator?.avatar || 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=600',
            isVerified: nft.creator?.isVerified || false
          };
          
          const owner = {
            id: nft.owner?.id || 'unknown',
            displayName: nft.owner?.displayName || 'Unknown Owner',
            avatar: nft.owner?.avatar || 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=600',
            isVerified: nft.owner?.isVerified || false
          };
          
          // Ensure all required properties exist
          return {
            id: nft.id,
            title: nft.title || 'Untitled NFT',
            description: nft.description || 'No description available',
            audioUrl: nft.audioUrl || '',
            imageUrl: nft.imageUrl || '',
            creator,
            owner,
            price: nft.price || 0,
            currency: nft.currency || 'ALGO',
            likes: nft.likes || 0,
            isLiked: nft.isLiked || false,
            views: nft.views || 0,
            duration: nft.duration || '00:00',
            royalty: nft.royalty || 0,
            history: nft.history || [],
            tags: nft.tags || [],
            featured: nft.featured || false,
            trending: nft.trending || false,
            available: nft.available !== undefined ? nft.available : true
          };
        });
        
        setNfts(processedNfts);
      }
    } catch (error) {
      console.error('Error fetching marketplace NFTs:', error);
      
      // If API fails, use the initial NFTs as fallback
      if (nfts.length === 0) {
        setNfts(initialNFTs);
      }
      
      // Show error notification
      setTransactionStatus({
        loading: false,
        success: false,
        error: 'Failed to fetch marketplace NFTs. Using cached data.',
        message: ''
      });
      
      // Clear error after 3 seconds
      setTimeout(() => {
        setTransactionStatus(prev => ({ ...prev, error: null }));
      }, 3000);
    }
  };

  // NFT Form Handlers
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'audio' | 'image') => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Create a preview URL
      const previewUrl = URL.createObjectURL(file);
      
      if (type === 'audio') {
        setNftFormData(prev => ({
          ...prev,
          audioFile: file,
          audioPreviewUrl: previewUrl
        }));
      } else {
        setNftFormData(prev => ({
          ...prev,
          coverImage: file,
          imagePreviewUrl: previewUrl
        }));
      }
    }
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNftFormData(prev => ({
      ...prev,
      [name]: name === 'price' || name === 'royalty' ? parseFloat(value) : value
    }));
  };
  
  const handleAddTag = () => {
    if (currentTag.trim() && !nftFormData.tags.includes(currentTag.trim())) {
      setNftFormData(prev => ({
        ...prev,
        tags: [...prev.tags, currentTag.trim()]
      }));
      setCurrentTag('');
    }
  };
  
  const handleRemoveTag = (tagToRemove: string) => {
    setNftFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };
  
  const resetNftForm = () => {
    setNftFormData({
      title: '',
      description: '',
      audioFile: null,
      coverImage: null,
      price: 100,
      royalty: 10,
      tags: [],
      audioPreviewUrl: null,
      imagePreviewUrl: null
    });
    setCurrentTag('');
    setCreateNFTError(null);
    setShowDetailsModal(false);
  };
  
  const handleCreateNFT = async () => {
    // Validate form
    if (!nftFormData.title.trim()) {
      setCreateNFTError('Title is required');
      return;
    }
    
    if (!nftFormData.audioFile) {
      setCreateNFTError('Audio file is required');
      return;
    }
    
    if (!nftFormData.coverImage) {
      setCreateNFTError('Cover image is required');
      return;
    }
    
    if (nftFormData.price <= 0) {
      setCreateNFTError('Price must be greater than 0');
      return;
    }
    
    if (nftFormData.royalty < 0 || nftFormData.royalty > 30) {
      setCreateNFTError('Royalty must be between 0% and 30%');
      return;
    }
    
    setIsSubmitting(true);
    setCreateNFTError(null);
    
    try {
      setTransactionStatus({
        loading: true,
        success: false,
        error: null,
        message: 'Creating your NFT...'
      });
      
      // Step 1: Upload the audio file to the server
      let audioFileId = '';
      let imageUrl = '';
      
      if (nftFormData.audioFile) {
        const audioUploadResult = await algorandAPI.uploadFile(nftFormData.audioFile, 'audio');
        audioFileId = audioUploadResult.fileId;
      }
      
      // Step 2: Upload the cover image to the server
      if (nftFormData.coverImage) {
        const imageUploadResult = await algorandAPI.uploadFile(nftFormData.coverImage, 'image');
        imageUrl = imageUploadResult.fileUrl;
      }
      
      // Step 3: Create the NFT on the Algorand blockchain
      const nftCreationData = {
        userId: user.id,
        title: nftFormData.title,
        description: nftFormData.description,
        audioFileId: audioFileId,
        imageUrl: imageUrl,
        price: nftFormData.price,
        royalty: nftFormData.royalty,
        tags: nftFormData.tags.length > 0 ? nftFormData.tags : ['voice', 'audio'],
        duration: '00:30' // Default duration or calculate from audio file
      };
      
      // Call the API to create the NFT
      const response = await algorandAPI.createNFT(nftCreationData);
      
      // Get the created NFT from the response
      const newNft: NFT = {
        id: response.nft.id,
        title: response.nft.title,
        description: response.nft.description,
        audioUrl: response.nft.audioUrl,
        imageUrl: response.nft.imageUrl,
        creator: {
          id: user.id,
          displayName: user.displayName,
          avatar: user.avatar,
          isVerified: false
        },
        owner: {
          id: user.id,
          displayName: user.displayName,
          avatar: user.avatar,
          isVerified: false
        },
        price: response.nft.price,
        currency: 'ALGO',
        likes: 0,
        isLiked: false,
        views: 0,
        duration: response.nft.duration || '00:30',
        royalty: response.nft.royalty,
        history: [
          { type: 'mint', price: response.nft.price, date: new Date().toISOString() }
        ],
        tags: response.nft.tags || [],
        featured: false,
        trending: false,
        assetId: response.nft.assetId,
        blockchainStatus: response.nft.blockchainStatus || 'minted',
        available: true
      };
      
      // Add the new NFT to the beginning of the NFTs array
      // Make sure to use the actual user information
      const processedNft = {
        ...newNft,
        creator: {
          id: user.id,
          displayName: user.displayName,
          avatar: user.avatar || 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=600',
          isVerified: user.isVerified || false
        },
        owner: {
          id: user.id,
          displayName: user.displayName,
          avatar: user.avatar || 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=600',
          isVerified: user.isVerified || false
        }
      };
      
      setNfts(prevNfts => [processedNft, ...prevNfts]);
      
      setIsCreatingNFT(false);
      setIsSubmitting(false);
      resetNftForm();
      
      setTransactionStatus({
        loading: false,
        success: true,
        error: null,
        message: 'NFT created successfully! It is being minted on the Algorand blockchain.'
      });
      
      // Clear success message after 5 seconds
      setTimeout(() => {
        setTransactionStatus(prev => ({ ...prev, success: false, message: '' }));
      }, 5000);
      
      // Refresh NFTs from the API to ensure we have the latest data
      fetchMarketplaceNFTs();
    } catch (error) {
      console.error('Error creating NFT:', error);
      setIsSubmitting(false);
      
      // Handle specific error cases
      let errorMessage = 'Failed to create NFT. Please try again.';
      
      if (error.response?.status === 400) {
        if (error.response.data?.error === 'invalid_file_type') {
          errorMessage = 'Invalid file type. Please upload a valid audio file (.mp3, .wav) and image file (JPEG, PNG).';
        } else if (error.response.data?.error === 'file_too_large') {
          errorMessage = 'File size exceeds the maximum limit. Please upload a smaller file.';
        } else if (error.response.data?.error === 'insufficient_balance') {
          errorMessage = 'Insufficient balance to mint NFT. Please add funds to your wallet.';
        }
      } else if (error.response?.status === 500) {
        errorMessage = 'Server error. Please try again later.';
      }
      
      setCreateNFTError(errorMessage);
      
      setTransactionStatus({
        loading: false,
        success: false,
        error: errorMessage,
        message: ''
      });
    }
  };

  // Connect wallet function
  const connectWallet = async () => {
    setWallet(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      // In a real implementation, this would use a wallet provider like MyAlgo or AlgoSigner
      // For demo purposes, we'll simulate a wallet connection
      const mockWalletAddress = 'ALGO' + Math.random().toString(36).substring(2, 15).toUpperCase();
      
      // Get the current user from auth context or localStorage
      const currentUserId = user.id || localStorage.getItem('userId') || 'user1';
      
      // Call the API to connect wallet
      const response = await algorandAPI.connectWallet(currentUserId, mockWalletAddress);
      
      if (response && response.wallet) {
        setWallet({
          connected: true,
          address: response.wallet.address,
          balance: response.wallet.balance,
          assets: response.wallet.assets || [],
          loading: false,
          error: null
        });
        
        // Show success message
        setTransactionStatus({
          loading: false,
          success: true,
          error: null,
          message: 'Wallet connected successfully!'
        });
        
        // Clear success message after 3 seconds
        setTimeout(() => {
          setTransactionStatus(prev => ({ ...prev, success: false, message: '' }));
        }, 3000);
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
      
      // Show error message
      setTransactionStatus({
        loading: false,
        success: false,
        error: error.response?.data?.error || 'Failed to connect wallet. Please try again.',
        message: ''
      });
      
      setWallet(prev => ({
        ...prev,
        loading: false,
        error: 'Failed to connect wallet. Please try again.'
      }));
    }
  };

  // Handle NFT like with Algorand integration
  const handleLike = async (nftId: string) => {
    if (!wallet.connected) {
      setTransactionStatus({
        loading: false,
        success: false,
        error: 'Please connect your wallet first',
        message: ''
      });
      return;
    }
    
    try {
      const response = await algorandAPI.likeNFT(nftId, user.id);
      
      // Update local state
      setNfts(nfts.map(nft => {
        if (nft.id === nftId) {
          return {
            ...nft,
            isLiked: !nft.isLiked,
            likes: nft.isLiked ? nft.likes - 1 : nft.likes + 1
          };
        }
        return nft;
      }));
    } catch (error) {
      console.error('Error liking NFT:', error);
      setTransactionStatus({
        loading: false,
        success: false,
        error: 'Failed to like NFT',
        message: ''
      });
    }
  };

  // Buy NFT function with complete Algorand integration
  const handleBuyNFT = async (nft: NFT) => {
    // Pre-purchase validation
    if (!wallet.connected) {
      setTransactionStatus({
        loading: false,
        success: false,
        error: 'Please connect your wallet first',
        message: ''
      });
      return;
    }
    
    // Check if user has enough balance
    if (wallet.balance < nft.price) {
      setTransactionStatus({
        loading: false,
        success: false,
        error: `Insufficient balance. You have ${wallet.balance.toFixed(2)} ALGO but need ${nft.price} ALGO.`,
        message: ''
      });
      return;
    }
    
    // Check if NFT is still available
    if (nft.available === false) {
      setTransactionStatus({
        loading: false,
        success: false,
        error: 'This NFT has already been sold.',
        message: ''
      });
      
      // Refresh NFTs to get the latest status
      fetchMarketplaceNFTs();
      return;
    }
    
    // Show confirmation dialog
    if (!window.confirm(
      `You are about to purchase "${nft.title}" for ${nft.price} ALGO.\n\n` +
      `Price: ${nft.price} ALGO\n` +
      `Royalty: ${nft.royalty}% (${(nft.price * nft.royalty / 100).toFixed(2)} ALGO to creator)\n` +
      `Network Fee: ~0.001 ALGO\n\n` +
      `Do you want to proceed?`
    )) {
      return;
    }
    
    setTransactionStatus({
      loading: true,
      success: false,
      error: null,
      message: 'Processing your purchase...'
    });
    
    try {
      // Transaction preparation and execution
      const response = await algorandAPI.buyNFT(nft.id, user.id);
      
      // Update wallet balance after purchase
      setWallet(prev => ({
        ...prev,
        balance: prev.balance - nft.price,
        assets: [...prev.assets, { id: nft.id, name: nft.title }]
      }));
      
      // Update NFT ownership in local state
      setNfts(nfts.map(item => {
        if (item.id === nft.id) {
          return {
            ...item,
            owner: {
              id: user.id,
              displayName: user.displayName,
              avatar: user.avatar,
              isVerified: false
            },
            available: false
          };
        }
        return item;
      }));
      
      // Update transaction status
      setTransactionStatus({
        loading: false,
        success: true,
        error: null,
        message: 'NFT purchased successfully! Transaction is being processed on the Algorand blockchain.'
      });
      
      // Clear success message after 5 seconds
      setTimeout(() => {
        setTransactionStatus(prev => ({ ...prev, success: false, message: '' }));
      }, 5000);
    } catch (error) {
      console.error('Error buying NFT:', error);
      
      // Handle specific error cases
      let errorMessage = 'Failed to purchase NFT. Please try again.';
      
      if (error.response?.status === 400) {
        if (error.response.data?.error === 'insufficient_balance') {
          errorMessage = `Insufficient balance. You need ${nft.price} ALGO to complete this purchase.`;
        } else if (error.response.data?.error === 'nft_already_sold') {
          errorMessage = 'This NFT has already been sold. Refreshing listings...';
          // Refresh NFTs to get the latest status
          fetchMarketplaceNFTs();
        }
      } else if (error.response?.status === 500) {
        errorMessage = 'Network error. Please try again later.';
      }
      
      setTransactionStatus({
        loading: false,
        success: false,
        error: errorMessage,
        message: ''
      });
    }
  };

  // Transaction status notification
  const TransactionNotification = () => {
    if (!transactionStatus.loading && !transactionStatus.success && !transactionStatus.error) {
      return null;
    }
    
    return (
      <div className={`fixed bottom-6 left-6 p-4 rounded-lg shadow-lg max-w-md z-50 ${
        transactionStatus.error ? 'bg-red-100 dark:bg-red-900' : 
        transactionStatus.success ? 'bg-green-100 dark:bg-green-900' : 
        'bg-blue-100 dark:bg-blue-900'
      }`}>
        <div className="flex items-start">
          <div className="flex-shrink-0">
            {transactionStatus.error ? (
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
            ) : transactionStatus.success ? (
              <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
            ) : (
              <Loader className="h-5 w-5 text-blue-600 dark:text-blue-400 animate-spin" />
            )}
          </div>
          <div className="ml-3">
            <p className={`text-sm font-medium ${
              transactionStatus.error ? 'text-red-800 dark:text-red-200' : 
              transactionStatus.success ? 'text-green-800 dark:text-green-200' : 
              'text-blue-800 dark:text-blue-200'
            }`}>
              {transactionStatus.error || transactionStatus.message}
            </p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto">
        {/* Transaction notification */}
        <TransactionNotification />
        {/* Marketplace Header with Algorand integration */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold text-dark-900 dark:text-white mb-2">
              NFT Marketplace
            </h1>
            <p className="text-dark-600 dark:text-dark-400">
              Discover and collect unique voice transformations
            </p>
          </div>
          <div className="flex items-center gap-2">
            <IconButton
              variant="outline"
              icon={<Filter className="h-5 w-5" />}
              onClick={() => setShowFilters(!showFilters)}
              aria-label="Show filters"
            />
            {wallet.connected && (
              <Button
                variant="primary"
                leftIcon={<Upload className="h-5 w-5" />}
                onClick={() => setIsCreatingNFT(true)}
              >
                Create/Mint NFT
              </Button>
            )}
            <Button 
              leftIcon={wallet.connected ? <Check className="h-5 w-5" /> : <Wallet className="h-5 w-5" />}
              onClick={connectWallet}
              disabled={wallet.loading}
            >
              {wallet.loading ? (
                <>
                  <Loader className="h-5 w-5 animate-spin mr-2" />
                  Connecting...
                </>
              ) : wallet.connected ? (
                <>Connected: {wallet.address.substring(0, 6)}...{wallet.address.substring(wallet.address.length - 4)}</>
              ) : (
                'Connect Wallet'
              )}
            </Button>
          </div>
        </div>

        {/* Algorand Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <Card className="p-4 text-center">
            <Diamond className="h-6 w-6 mx-auto mb-2 text-primary-600 dark:text-primary-400" />
            <div className="text-2xl font-bold text-dark-900 dark:text-white">
              {formatNumber(1234)}
            </div>
            <div className="text-sm text-dark-500 dark:text-dark-400">
              NFTs Listed
            </div>
            {wallet.connected && (
              <div className="mt-2 text-xs text-primary-600 dark:text-primary-400">
                {wallet.assets.length} in your wallet
              </div>
            )}
          </Card>
          <Card className="p-4 text-center">
            <Wallet className="h-6 w-6 mx-auto mb-2 text-primary-600 dark:text-primary-400" />
            <div className="text-2xl font-bold text-dark-900 dark:text-white">
              {formatNumber(567)}
            </div>
            <div className="text-sm text-dark-500 dark:text-dark-400">
              Total Sales
            </div>
            {wallet.connected && (
              <div className="mt-2 text-xs text-primary-600 dark:text-primary-400">
                {wallet.balance.toFixed(2)} ALGO Balance
              </div>
            )}
          </Card>
          <Card className="p-4 text-center">
            <TrendingUp className="h-6 w-6 mx-auto mb-2 text-primary-600 dark:text-primary-400" />
            <div className="text-2xl font-bold text-dark-900 dark:text-white">
              {formatNumber(50000)}
            </div>
            <div className="text-sm text-dark-500 dark:text-dark-400">
              Volume (ALGO)
            </div>
          </Card>
          <Card className="p-4 text-center">
            <BarChart3 className="h-6 w-6 mx-auto mb-2 text-primary-600 dark:text-primary-400" />
            <div className="text-2xl font-bold text-dark-900 dark:text-white">
              +{formatNumber(24)}%
            </div>
            <div className="text-sm text-dark-500 dark:text-dark-400">
              24h Change
            </div>
          </Card>
        </div>

        {/* Filters with Algorand-specific options */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mb-6"
            >
              <Card className="p-4">
                <div className="space-y-4">
                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-dark-400" />
                    <input
                      type="text"
                      placeholder="Search NFTs..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-dark-800 border-none rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  {/* Category Filters with Algorand categories */}
                  <div className="flex flex-wrap gap-2">
                    {['all', 'celebrity', 'music', 'language', 'effects', 'minted', 'trending'].map((category) => (
                      <Button
                        key={category}
                        variant={filter === category ? 'primary' : 'outline'}
                        size="sm"
                        onClick={() => setFilter(category)}
                      >
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                      </Button>
                    ))}
                  </div>

                  {/* Sort Options */}
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant={sortBy === 'popular' ? 'primary' : 'outline'}
                      leftIcon={<TrendingUp className="h-4 w-4" />}
                      onClick={() => setSortBy('popular')}
                    >
                      Most Popular
                    </Button>
                    <Button
                      size="sm"
                      variant={sortBy === 'newest' ? 'primary' : 'outline'}
                      leftIcon={<Clock className="h-4 w-4" />}
                      onClick={() => setSortBy('newest')}
                    >
                      Newest
                    </Button>
                    <Button
                      size="sm"
                      variant={sortBy === 'priceAsc' ? 'primary' : 'outline'}
                      leftIcon={<DollarSign className="h-4 w-4" />}
                      onClick={() => setSortBy('priceAsc')}
                    >
                      Price: Low to High
                    </Button>
                    <Button
                      size="sm"
                      variant={sortBy === 'priceDesc' ? 'primary' : 'outline'}
                      leftIcon={<DollarSign className="h-4 w-4" />}
                      onClick={() => setSortBy('priceDesc')}
                    >
                      Price: High to Low
                    </Button>
                  </div>

                  {/* Price Range */}
                  <div>
                    <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-2">
                      Price Range (ALGO)
                    </label>
                    <div className="flex items-center gap-4">
                      <input
                        type="range"
                        min="0"
                        max="5000"
                        value={priceRange[0]}
                        onChange={(e) => setPriceRange([Number(e.target.value), priceRange[1]])}
                        className="flex-1"
                      />
                      <span className="text-sm text-dark-600 dark:text-dark-400">
                        {priceRange[0]} - {priceRange[1]} ALGO
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Layout Toggle & Sort */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <IconButton
              variant={layout === 'grid' ? 'primary' : 'outline'}
              icon={<Grid className="h-5 w-5" />}
              onClick={() => setLayout('grid')}
              aria-label="Grid view"
            />
            <IconButton
              variant={layout === 'list' ? 'primary' : 'outline'}
              icon={<List className="h-5 w-5" />}
              onClick={() => setLayout('list')}
              aria-label="List view"
            />
          </div>
        </div>

        {/* Featured NFT */}
        {nfts.find(nft => nft.featured) && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-dark-900 dark:text-white mb-4 flex items-center gap-2">
              <Crown className="h-5 w-5 text-warning-500" />
              Featured NFT
            </h2>
            <NFTCard
              nft={nfts.find(nft => nft.featured)!}
              onLike={handleLike}
              layout={layout}
              wallet={wallet}
              onBuy={handleBuyNFT}
              currentUser={user}
            />
          </div>
        )}

        {/* Wallet Information Card - Only shown when connected */}
        {wallet.connected && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-dark-900 dark:text-white mb-4 flex items-center gap-2">
              <Wallet className="h-5 w-5 text-primary-600 dark:text-primary-400" />
              Your Wallet
            </h2>
            <Card className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-medium text-dark-900 dark:text-white mb-2">Wallet Details</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-dark-600 dark:text-dark-400">Address:</span>
                      <span className="text-dark-900 dark:text-white font-mono">
                        {wallet.address.substring(0, 8)}...{wallet.address.substring(wallet.address.length - 8)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-dark-600 dark:text-dark-400">Balance:</span>
                      <span className="text-dark-900 dark:text-white">{wallet.balance.toFixed(4)} ALGO</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-dark-600 dark:text-dark-400">Assets:</span>
                      <span className="text-dark-900 dark:text-white">{wallet.assets.length}</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-dark-900 dark:text-white mb-2">Quick Actions</h3>
                  <div className="flex flex-wrap gap-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => navigate('/profile')}
                    >
                      View My NFTs
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => setIsCreatingNFT(true)}
                    >
                      Create NFT
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* NFT Grid with Algorand integration */}
        <div className={`grid gap-6 ${
          layout === 'grid'
            ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
            : 'grid-cols-1'
        }`}>
          {nfts.map(nft => (
            <NFTCard
              key={nft.id}
              nft={nft}
              onLike={handleLike}
              layout={layout}
              wallet={wallet}
              onBuy={handleBuyNFT}
              currentUser={user}
            />
          ))}
        </div>

        {/* Back to Top Button */}
        <motion.button
          className="fixed bottom-6 right-6 p-3 bg-primary-600 dark:bg-primary-500 text-white rounded-full shadow-lg hover:bg-primary-700 dark:hover:bg-primary-600 transition-colors"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <ArrowUp className="h-5 w-5" />
        </motion.button>

        {/* NFT Creation Modal with complete form and preview */}
        {isCreatingNFT && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <Card className="w-full max-w-4xl p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-dark-900 dark:text-white">Create/Mint NFT</h2>
                <IconButton
                  variant="ghost"
                  icon={<X className="h-5 w-5" />}
                  onClick={() => {
                    setIsCreatingNFT(false);
                    resetNftForm();
                  }}
                  aria-label="Close"
                />
              </div>
              
              <p className="text-dark-600 dark:text-dark-400 mb-6">
                Create a unique Voice NFT on the Algorand blockchain. Your voice transformation will be minted as a non-fungible token that can be bought, sold, and traded.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Form Section */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">
                      NFT Title*
                    </label>
                    <input 
                      type="text" 
                      name="title"
                      value={nftFormData.title}
                      onChange={handleInputChange}
                      className="w-full p-2 bg-gray-100 dark:bg-dark-800 border-none rounded-lg focus:ring-2 focus:ring-primary-500"
                      placeholder="My Amazing Voice NFT"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">
                      Description*
                    </label>
                    <textarea 
                      name="description"
                      value={nftFormData.description}
                      onChange={handleInputChange}
                      className="w-full p-2 bg-gray-100 dark:bg-dark-800 border-none rounded-lg focus:ring-2 focus:ring-primary-500"
                      placeholder="Describe your voice NFT..."
                      rows={3}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">
                      Upload Audio File* (.mp3, .wav)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="file"
                        accept=".mp3,.wav"
                        onChange={(e) => handleFileChange(e, 'audio')}
                        className="hidden"
                        id="audio-file-input"
                      />
                      <label
                        htmlFor="audio-file-input"
                        className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 cursor-pointer"
                      >
                        <Upload className="h-4 w-4" />
                        {nftFormData.audioFile ? 'Change Audio' : 'Select Audio'}
                      </label>
                      {nftFormData.audioFile && (
                        <span className="text-sm text-dark-600 dark:text-dark-400 truncate max-w-[200px]">
                          {nftFormData.audioFile.name}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">
                      Upload Cover Image* (JPEG, PNG)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/jpg"
                        onChange={(e) => handleFileChange(e, 'image')}
                        className="hidden"
                        id="image-file-input"
                      />
                      <label
                        htmlFor="image-file-input"
                        className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 cursor-pointer"
                      >
                        <Upload className="h-4 w-4" />
                        {nftFormData.coverImage ? 'Change Image' : 'Select Image'}
                      </label>
                      {nftFormData.coverImage && (
                        <span className="text-sm text-dark-600 dark:text-dark-400 truncate max-w-[200px]">
                          {nftFormData.coverImage.name}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">
                      Price (ALGO)*
                    </label>
                    <input 
                      type="number" 
                      name="price"
                      value={nftFormData.price}
                      onChange={handleInputChange}
                      className="w-full p-2 bg-gray-100 dark:bg-dark-800 border-none rounded-lg focus:ring-2 focus:ring-primary-500"
                      placeholder="100"
                      min="0"
                      step="0.01"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">
                      Royalty Percentage* (0-30%)
                    </label>
                    <input 
                      type="number" 
                      name="royalty"
                      value={nftFormData.royalty}
                      onChange={handleInputChange}
                      className="w-full p-2 bg-gray-100 dark:bg-dark-800 border-none rounded-lg focus:ring-2 focus:ring-primary-500"
                      placeholder="10"
                      min="0"
                      max="30"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">
                      Tags
                    </label>
                    <div className="flex items-center gap-2 mb-2">
                      <input 
                        type="text" 
                        value={currentTag}
                        onChange={(e) => setCurrentTag(e.target.value)}
                        className="flex-1 p-2 bg-gray-100 dark:bg-dark-800 border-none rounded-lg focus:ring-2 focus:ring-primary-500"
                        placeholder="Add a tag"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddTag();
                          }
                        }}
                      />
                      <Button 
                        size="sm"
                        onClick={handleAddTag}
                        disabled={!currentTag.trim()}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {nftFormData.tags.map(tag => (
                        <span
                          key={tag}
                          className="px-2 py-1 bg-gray-100 dark:bg-dark-800 rounded-full text-xs text-dark-600 dark:text-dark-400 flex items-center gap-1"
                        >
                          #{tag}
                          <button
                            onClick={() => handleRemoveTag(tag)}
                            className="text-dark-400 hover:text-dark-600 dark:hover:text-dark-200"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                
                {/* Preview Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-dark-900 dark:text-white mb-2">Preview</h3>
                  
                  <div className="bg-dark-800 rounded-lg overflow-hidden">
                    {/* Cover Image Preview */}
                    <div className="aspect-square bg-dark-700 relative">
                      {nftFormData.imagePreviewUrl ? (
                        <img
                          src={nftFormData.imagePreviewUrl}
                          alt="NFT Cover"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full text-dark-400">
                          <Music className="h-16 w-16" />
                        </div>
                      )}
                    </div>
                    
                    {/* Audio Preview */}
                    <div className="p-4">
                      {nftFormData.audioPreviewUrl ? (
                        <audio
                          controls
                          className="w-full mb-4"
                          src={nftFormData.audioPreviewUrl}
                        />
                      ) : (
                        <div className="h-12 bg-dark-700 rounded mb-4 flex items-center justify-center text-dark-400">
                          <Music className="h-6 w-6 mr-2" />
                          <span>Audio preview will appear here</span>
                        </div>
                      )}
                      
                      <h3 className="font-semibold text-white mb-2">
                        {nftFormData.title || 'NFT Title'}
                      </h3>
                      
                      <p className="text-sm text-dark-400 mb-4">
                        {nftFormData.description || 'NFT description will appear here'}
                      </p>
                      
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <Avatar
                            src={user.avatar}
                            alt={user.displayName}
                            size="sm"
                          />
                          <div>
                            <span className="text-sm font-medium text-white">
                              {user.displayName}
                            </span>
                            <div className="text-xs text-dark-400">
                              Creator
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Diamond className="h-4 w-4 text-primary-400" />
                          <span className="font-medium text-primary-400">
                            {nftFormData.price} ALGO
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-2 mb-4">
                        {nftFormData.tags.map(tag => (
                          <span
                            key={tag}
                            className="px-2 py-1 bg-dark-700 rounded-full text-xs text-dark-400"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  {/* More Details Dropdown */}
                  <div className="bg-dark-800 rounded-lg overflow-hidden">
                    <button 
                      className="w-full p-4 flex items-center justify-between text-white hover:bg-dark-700 transition-colors"
                      onClick={() => setShowDetailsModal(!showDetailsModal)}
                    >
                      <span className="font-medium">More Details</span>
                      <MoreHorizontal className="h-5 w-5" />
                    </button>
                    
                    <AnimatePresence>
                      {showDetailsModal && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                        >
                          <div className="p-4 border-t border-dark-700">
                            <div className="grid grid-cols-2 gap-2 text-sm mb-4">
                              <div className="text-dark-400">Royalty:</div>
                              <div className="text-white font-medium">{nftFormData.royalty}%</div>
                              <div className="text-dark-400">Blockchain:</div>
                              <div className="text-white font-medium">Algorand</div>
                              <div className="text-dark-400">Creator Earnings:</div>
                              <div className="text-white font-medium">
                                {(nftFormData.price * nftFormData.royalty / 100).toFixed(2)} ALGO per sale
                              </div>
                              <div className="text-dark-400">Network Fee:</div>
                              <div className="text-white font-medium">~0.001 ALGO</div>
                            </div>
                            
                            <Button 
                              className="w-full"
                              disabled={true}
                            >
                              Buy Now
                            </Button>
                            
                            <div className="flex items-center justify-between mt-4">
                              <div className="flex items-center gap-2">
                                <Heart className="h-5 w-5" />
                                <span className="text-dark-400">0 likes</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Share2 className="h-5 w-5 text-dark-400" />
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
              
              {createNFTError && (
                <div className="mt-6 p-3 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-lg">
                  {createNFTError}
                </div>
              )}
              
              <div className="flex justify-end gap-2 mt-6">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setIsCreatingNFT(false);
                    resetNftForm();
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreateNFT}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader className="h-4 w-4 animate-spin mr-2" />
                      Creating...
                    </>
                  ) : (
                    'Create NFT'
                  )}
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};