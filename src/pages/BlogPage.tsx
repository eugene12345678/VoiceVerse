import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Calendar,
  Clock,
  
  Share2,
  MessageCircle,
  ChevronRight,
  Search,
 
  X
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Avatar } from '../components/ui/Avatar';
import { formatTimeAgo } from '../lib/utils';

const blogPosts = [
  {
    id: '1',
    title: 'The Future of Voice AI Technology',
    excerpt: 'Exploring the revolutionary advancements in voice transformation and what it means for content creators.',
    image: 'https://images.pexels.com/photos/2582937/pexels-photo-2582937.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
    category: 'Technology',
    tags: ['AI', 'Voice Tech', 'Future'],
    author: {
      name: 'Eugene Mathenge',
      avatar: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=600',
      role: 'Founder & Lead Developer'
    },
    date: '2024-03-01T10:00:00Z',
    readTime: 5,
    comments: 12,
    shares: 45,
    content: `
      <h2>The Dawn of a New Era</h2>
      <p>Voice AI technology has reached a pivotal moment in its evolution. What started as simple voice recognition has transformed into sophisticated systems capable of understanding context, emotion, and intent with remarkable accuracy.</p>
      
      <h3>Revolutionary Advancements</h3>
      <p>Recent breakthroughs in neural networks and machine learning have enabled voice AI to achieve near-human levels of comprehension. These systems can now:</p>
      <ul>
        <li>Process natural language with contextual understanding</li>
        <li>Recognize emotional nuances in speech patterns</li>
        <li>Generate human-like responses with appropriate tone</li>
        <li>Adapt to individual speaking styles and preferences</li>
      </ul>
      
      <h3>Impact for Content Creators</h3>
      <p>For content creators, this represents a paradigm shift. Voice AI technology enables creators to produce content more efficiently, reach global audiences through real-time translation, and create more engaging, interactive experiences.</p>
      
      <p>The future holds even more promise, with developments in real-time voice cloning, emotion-aware AI assistants, and seamless multi-language communication on the horizon.</p>
    `
  },
  {
    id: '2',
    title: 'Building the Next Generation Voice Platform',
    excerpt: 'Behind the scenes look at the technology powering VoiceVerse and our vision for the future.',
    image: 'https://images.pexels.com/photos/3861969/pexels-photo-3861969.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
    category: 'Development',
    tags: ['Development', 'Platform', 'Innovation'],
    author: {
      name: 'Eugene Mathenge',
      avatar: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=600',
      role: 'Founder & Lead Developer'
    },
    date: '2024-02-28T14:30:00Z',
    readTime: 7,
    comments: 8,
    shares: 32,
    content: `
      <h2>Our Technical Foundation</h2>
      <p>Building VoiceVerse required solving complex challenges in real-time audio processing, machine learning model deployment, and scalable cloud infrastructure.</p>
      
      <h3>Architecture Overview</h3>
      <p>Our platform is built on a microservices architecture that ensures scalability and reliability:</p>
      <ul>
        <li>Real-time audio processing pipeline</li>
        <li>Distributed machine learning inference</li>
        <li>Edge computing for low-latency responses</li>
        <li>Robust API gateway for seamless integration</li>
      </ul>
      
      <h3>Innovation at Scale</h3>
      <p>We've developed proprietary algorithms for voice synthesis that maintain quality while optimizing for speed. Our system can process thousands of concurrent voice transformations while maintaining sub-100ms latency.</p>
      
      <h3>Looking Ahead</h3>
      <p>Our roadmap includes advanced features like emotion detection, real-time collaboration tools, and AI-powered content optimization. We're committed to pushing the boundaries of what's possible in voice technology.</p>
    `
  }
];

const featuredPost = {
  id: 'featured',
  title: 'Revolutionizing Content Creation with AI Voice Technology',
  excerpt: 'Discover how VoiceVerse is transforming the way creators produce and share content through advanced AI voice technology.',
  image: 'https://images.pexels.com/photos/8386440/pexels-photo-8386440.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
  category: 'Featured',
  tags: ['AI', 'Innovation', 'Content Creation'],
  author: {
    name: 'Eugene Mathenge',
    avatar: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=600',
    role: 'Founder & Lead Developer'
  },
  date: '2024-03-02T09:00:00Z',
  readTime: 8,
  comments: 24,
  shares: 76,
  content: `
    <h2>The Content Creation Revolution</h2>
    <p>We're witnessing a fundamental shift in how content is created, distributed, and consumed. AI voice technology is at the forefront of this transformation.</p>
    
    <h3>Democratizing Content Creation</h3>
    <p>Traditional content creation required expensive equipment, professional studios, and technical expertise. VoiceVerse removes these barriers by providing:</p>
    <ul>
      <li>Professional-quality voice synthesis</li>
      <li>Multi-language content generation</li>
      <li>Real-time collaboration tools</li>
      <li>Automated post-production workflows</li>
    </ul>
    
    <h3>Creative Possibilities</h3>
    <p>Creators can now experiment with different voices, languages, and styles without the constraints of traditional recording methods. This opens up new creative possibilities and allows for more diverse representation in content.</p>
    
    <h3>The Future of Content</h3>
    <p>As AI technology continues to evolve, we anticipate even more exciting developments: personalized content adaptation, interactive storytelling, and immersive audio experiences that blur the line between reality and digital creation.</p>
  `
};

// Modal Component
const BlogModal = ({ post, isOpen, onClose }) => {
  if (!isOpen || !post) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className="bg-white dark:bg-dark-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
      >
        {/* Modal Header */}
        <div className="relative">
          <img
            src={post.image}
            alt={post.title}
            className="w-full h-64 object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-white/20 backdrop-blur-sm rounded-full text-white hover:bg-white/30 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="absolute bottom-4 left-4">
            <span className="px-3 py-1 bg-primary-100/90 dark:bg-primary-900/90 text-primary-600 dark:text-primary-400 rounded-full text-sm font-medium">
              {post.category}
            </span>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-8 overflow-y-auto max-h-[calc(90vh-16rem)]">
          <h1 className="text-3xl font-display font-bold text-dark-900 dark:text-white mb-4">
            {post.title}
          </h1>
          
          <div className="flex items-center gap-4 mb-6">
            <Avatar
              src={post.author.avatar}
              alt={post.author.name}
              size="md"
            />
            <div>
              <div className="font-medium text-dark-900 dark:text-white">
                {post.author.name}
              </div>
              <div className="text-dark-500 dark:text-dark-400 text-sm">
                {post.author.role}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6 text-dark-500 dark:text-dark-400 mb-8 pb-8 border-b border-gray-200 dark:border-dark-700">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>{post.readTime} min read</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>{new Date(post.date).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              <span>{post.comments} comments</span>
            </div>
            <div className="flex items-center gap-2">
              <Share2 className="h-4 w-4" />
              <span>{post.shares} shares</span>
            </div>
          </div>

          <div 
            className="prose prose-lg dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          <div className="mt-8 pt-8 border-t border-gray-200 dark:border-dark-700">
            <div className="flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 bg-gray-100 dark:bg-dark-700 text-dark-600 dark:text-dark-400 rounded-full text-sm"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export const BlogPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedPost, setSelectedPost] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Filter posts based on search query and selected category
  const filteredPosts = blogPosts.filter(post => {
    const matchesSearch = searchQuery === '' || 
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())) ||
      post.category.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || 
      post.category.toLowerCase() === selectedCategory.toLowerCase();
    
    return matchesSearch && matchesCategory;
  });

  const handleReadMore = (post) => {
    setSelectedPost(post);
    setIsModalOpen(true);
  };

  const handleFeaturedReadMore = () => {
    setSelectedPost(featuredPost);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedPost(null);
  };

  return (
    <div className="min-h-screen bg-gradient-mesh dark:bg-dark-950">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-4xl md:text-5xl font-display font-bold text-dark-900 dark:text-white mb-4">
              VoiceVerse Blog
            </h1>
            <p className="text-xl text-dark-600 dark:text-dark-400 max-w-2xl mx-auto">
              Insights and updates from the frontier of voice AI technology
            </p>
          </motion.div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-12">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-dark-400" />
            <input
              type="text"
              placeholder="Search articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div className="flex gap-2">
            {['all', 'technology', 'development', 'tutorials'].map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? 'primary' : 'outline'}
                onClick={() => setSelectedCategory(category)}
              >
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </Button>
            ))}
          </div>
        </div>

        {/* Featured Post */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-16"
        >
          <Card className="overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="relative aspect-video lg:aspect-auto">
                <img
                  src={featuredPost.image}
                  alt={featuredPost.title}
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              </div>
              <div className="p-8 flex flex-col justify-center">
                <div className="flex items-center gap-2 mb-4">
                  <span className="px-3 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-full text-sm font-medium">
                    Featured
                  </span>
                  <span className="text-dark-500 dark:text-dark-400">
                    {formatTimeAgo(featuredPost.date)}
                  </span>
                </div>
                <h2 className="text-3xl font-display font-bold text-dark-900 dark:text-white mb-4">
                  {featuredPost.title}
                </h2>
                <p className="text-dark-600 dark:text-dark-400 mb-6">
                  {featuredPost.excerpt}
                </p>
                <div className="flex items-center gap-4 mb-6">
                  <Avatar
                    src={featuredPost.author.avatar}
                    alt={featuredPost.author.name}
                    size="md"
                  />
                  <div>
                    <div className="font-medium text-dark-900 dark:text-white">
                      {featuredPost.author.name}
                    </div>
                    <div className="text-dark-500 dark:text-dark-400 text-sm">
                      {featuredPost.author.role}
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-6 text-dark-500 dark:text-dark-400">
                    <div className="flex items-center gap-2">
                      <Clock className="h-5 w-5" />
                      <span>{featuredPost.readTime} min read</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MessageCircle className="h-5 w-5" />
                      <span>{featuredPost.comments} comments</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Share2 className="h-5 w-5" />
                      <span>{featuredPost.shares} shares</span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    onClick={handleFeaturedReadMore}
                    rightIcon={<ChevronRight className="h-4 w-4" />}
                  >
                    Read More
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Blog Posts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {filteredPosts.map((post, index) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card className="overflow-hidden h-full">
                <div className="relative aspect-video">
                  <img
                    src={post.image}
                    alt={post.title}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-4 left-4">
                    <span className="px-3 py-1 bg-primary-100/90 dark:bg-primary-900/90 text-primary-600 dark:text-primary-400 rounded-full text-sm font-medium">
                      {post.category}
                    </span>
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-display font-bold text-dark-900 dark:text-white mb-3">
                    {post.title}
                  </h3>
                  <p className="text-dark-600 dark:text-dark-400 mb-4">
                    {post.excerpt}
                  </p>
                  <div className="flex items-center gap-4 mb-4">
                    <Avatar
                      src={post.author.avatar}
                      alt={post.author.name}
                      size="sm"
                    />
                    <div>
                      <div className="font-medium text-dark-900 dark:text-white">
                        {post.author.name}
                      </div>
                      <div className="text-dark-500 dark:text-dark-400 text-sm">
                        {post.author.role}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-dark-500 dark:text-dark-400 text-sm">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {post.readTime} min
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {new Date(post.date).toLocaleDateString()}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleReadMore(post)}
                      rightIcon={<ChevronRight className="h-4 w-4" />}
                    >
                      Read More
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* No Results Message */}
        {filteredPosts.length === 0 && (
          <div className="text-center py-12">
            <div className="text-dark-400 dark:text-dark-500 mb-4">
              <Search className="h-12 w-12 mx-auto mb-4" />
              <p className="text-lg">No articles found</p>
              <p className="text-sm">Try adjusting your search terms or filters</p>
            </div>
          </div>
        )}

        {/* Newsletter Section */}
        <div className="mt-16">
          <Card className="p-8 bg-gradient-to-r from-primary-500 to-accent-500 text-white">
            <div className="max-w-2xl mx-auto text-center">
              <h2 className="text-2xl md:text-3xl font-display font-bold mb-4">
                Stay Updated with VoiceVerse
              </h2>
              <p className="text-primary-100 mb-6">
                Subscribe to our newsletter for the latest updates on voice AI technology
                and exclusive content.
              </p>
              <div className="flex gap-4">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50"
                />
                <Button
                  className="bg-white text-primary-600 hover:bg-primary-50"
                  leftIcon={<Sparkles className="h-5 w-5" />}
                >
                  Subscribe
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Blog Modal */}
      <BlogModal 
        post={selectedPost} 
        isOpen={isModalOpen} 
        onClose={closeModal} 
      />
    </div>
  );
};