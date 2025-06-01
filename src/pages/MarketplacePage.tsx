import React, { useState, useRef } from 'react';
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
  ExternalLink
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Avatar } from '../components/ui/Avatar';
import { IconButton } from '../components/ui/IconButton';
import { WaveformVisualizer } from '../components/audio/WaveformVisualizer';
import { formatNumber } from '../lib/utils';

const mockNFTs = [
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
  nft: typeof mockNFTs[0];
  onLike: (nftId: string) => void;
  layout?: 'grid' | 'list';
}

const NFTCard: React.FC<NFTCardProps> = ({ nft, onLike, layout = 'grid' }) => {
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
          <Button size="sm">
            Buy Now
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

export const MarketplacePage = () => {
  const [nfts, setNfts] = useState(mockNFTs);
  const [filter, setFilter] = useState('all');
  const [layout, setLayout] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<'popular' | 'newest' | 'priceAsc' | 'priceDesc'>('popular');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 5000]);

  const handleLike = (nftId: string) => {
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
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto">
        {/* Marketplace Header */}
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
            <Button leftIcon={<Wallet className="h-5 w-5" />}>
              Connect Wallet
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <Card className="p-4 text-center">
            <Diamond className="h-6 w-6 mx-auto mb-2 text-primary-600 dark:text-primary-400" />
            <div className="text-2xl font-bold text-dark-900 dark:text-white">
              {formatNumber(1234)}
            </div>
            <div className="text-sm text-dark-500 dark:text-dark-400">
              NFTs Listed
            </div>
          </Card>
          <Card className="p-4 text-center">
            <Wallet className="h-6 w-6 mx-auto mb-2 text-primary-600 dark:text-primary-400" />
            <div className="text-2xl font-bold text-dark-900 dark:text-white">
              {formatNumber(567)}
            </div>
            <div className="text-sm text-dark-500 dark:text-dark-400">
              Total Sales
            </div>
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

        {/* Filters */}
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

                  {/* Category Filters */}
                  <div className="flex flex-wrap gap-2">
                    {['all', 'celebrity', 'music', 'language', 'effects'].map((category) => (
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
            />
          </div>
        )}

        {/* NFT Grid */}
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
      </div>
    </div>
  );
};