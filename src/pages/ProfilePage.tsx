import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Users, 
  Calendar, 
  Award, 
  TrendingUp, 
  Play, 
  Heart, 
  MessageCircle, 
  Share2,
  Edit3,
  Camera,
  Lock,
  Unlock,
  Globe,
  UserPlus,
  UserMinus,
  Clock,
  Trophy,
  Star,
  Mic,
  Music,
  Bookmark,
  Hexagon,
  Copy,
  Twitter,
  Facebook,
  Instagram,
  Loader,
  X,
  Save,
  Upload,
  AlertCircle,
  CheckCircle,
  Eye,
  EyeOff,
  Activity,
  Settings
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Avatar } from '../components/ui/Avatar';
import { WaveformVisualizer } from '../components/audio/WaveformVisualizer';
import { formatNumber, formatTimeAgo, cn } from '../lib/utils';
import { useAuthStore } from '../store/authStore';
import { userAPI } from '../lib/api/user';
import { feedAPI, algorandAPI } from '../lib/api';
import { Badge, Achievement, ActivityEvent, User as UserType } from '../types';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/Tabs';
import { Tooltip } from '../components/ui/Tooltip';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';
import { Switch } from '../components/ui/Switch';
import { Label } from '../components/ui/Label';
import { toast } from '../components/ui/Toast';


const mockUserPosts = [
  {
    id: '1',
    audioUrl: 'https://www2.cs.uic.edu/~i101/SoundFiles/BabyElephantWalk60.wav',
    caption: 'My first voice transformation! 🎭',
    createdAt: '2024-02-28T12:00:00Z',
    likes: 1234,
    comments: 89,
    shares: 45,
  },
  {
    id: '2',
    audioUrl: 'https://www2.cs.uic.edu/~i101/SoundFiles/CantinaBand3.wav',
    caption: 'Russian accent challenge 🇷🇺',
    createdAt: '2024-02-27T15:30:00Z',
    likes: 856,
    comments: 34,
    shares: 12,
  },
];

interface AudioPostCardProps {
  post: typeof mockUserPosts[0];
}

const AudioPostCard: React.FC<AudioPostCardProps> = ({ post }) => {
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <Card className="p-4">
      <p className="text-dark-800 dark:text-dark-200 mb-4">
        {post.caption}
      </p>
      <div className="mb-4">
        <WaveformVisualizer
          audioUrl={post.audioUrl}
          isPlaying={isPlaying}
          onPlayPause={() => setIsPlaying(!isPlaying)}
          height={64}
        />
      </div>
      <div className="flex items-center justify-between text-sm text-dark-500 dark:text-dark-400">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <Heart className="h-4 w-4" />
            {formatNumber(post.likes)}
          </div>
          <div className="flex items-center gap-1">
            <MessageCircle className="h-4 w-4" />
            {formatNumber(post.comments)}
          </div>
          <div className="flex items-center gap-1">
            <Share2 className="h-4 w-4" />
            {formatNumber(post.shares)}
          </div>
        </div>
        <div>{formatTimeAgo(post.createdAt)}</div>
      </div>
    </Card>
  );
};

export const ProfilePage = () => {
  const { user, updateProfile } = useAuthStore();
  const { id: userId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('posts');
  const [isLoading, setIsLoading] = useState(true);
  const [profileData, setProfileData] = useState<UserType | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editableProfile, setEditableProfile] = useState({
    displayName: '',
    bio: '',
    isPublic: true
  });
  const [userPosts, setUserPosts] = useState<any[]>([]);
  const [savedPosts, setSavedPosts] = useState<any[]>([]);
  const [userNFTs, setUserNFTs] = useState<any[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [activity, setActivity] = useState<ActivityEvent[]>([]);
  const [topRecordings, setTopRecordings] = useState<any[]>([]);
  const [followers, setFollowers] = useState<any[]>([]);
  const [following, setFollowing] = useState<any[]>([]);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showProfilePictureMenu, setShowProfilePictureMenu] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  // Close profile picture menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setShowProfilePictureMenu(false);
      }
    };

    if (showProfilePictureMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showProfilePictureMenu]);
  
  // Fetch profile data
  useEffect(() => {
    const fetchProfileData = async () => {
      setIsLoading(true);
      
      // Check if user is authenticated
      if (!user && !userId) {
        // If not viewing a specific user profile and not authenticated, redirect to login
        navigate('/login');
        return;
      }
      
      try {
        // If we're viewing our own profile and have user data from auth store, use it
        if ((!userId || userId === user?.id) && user) {
          setProfileData(user);
          setEditableProfile({
            displayName: user.displayName || '',
            bio: user.bio || '',
            isPublic: user.isPublic !== false // default to true if not specified
          });
          setIsOwnProfile(true);
          setIsFollowing(false);
        } else {
          // Otherwise fetch from API
          try {
            const response = await userAPI.getUserProfile(userId);
            if (response && response.data) {
              setProfileData(response.data);
              setEditableProfile({
                displayName: response.data.displayName,
                bio: response.data.bio || '',
                isPublic: response.data.isPublic !== false // default to true if not specified
              });
              setIsOwnProfile(!userId || userId === user?.id);
              setIsFollowing(response.data.isFollowing || false);
            }
          } catch (apiError) {
            console.error('Error fetching profile from API:', apiError);
            // If we can't fetch the profile, use the current user data
            if (user) {
              setProfileData(user);
              setEditableProfile({
                displayName: user.displayName || '',
                bio: user.bio || '',
                isPublic: user.isPublic !== false
              });
              setIsOwnProfile(true);
              setIsFollowing(false);
            } else {
              // If no user data is available, redirect to login
              navigate('/login');
              return;
            }
          }
        }
        
        // Fetch additional profile data
        await fetchProfileExtras();
      } catch (error) {
        console.error('Error in profile data setup:', error);
        // If there's an error and we have user data, use it
        if (user) {
          setProfileData(user);
          setEditableProfile({
            displayName: user.displayName || '',
            bio: user.bio || '',
            isPublic: user.isPublic !== false
          });
          setIsOwnProfile(true);
          setIsFollowing(false);
        } else {
          // If no user data is available, redirect to login
          navigate('/login');
          return;
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    // Helper function to fetch profile extras
    const fetchProfileExtras = async () => {
      // Set empty arrays as defaults
      setBadges([]);
      setAchievements([]);
      setActivity([]);
      setTopRecordings([]);
      setFollowers([]);
      setFollowing([]);
      
      // Try to fetch data from API, but don't use mock data if it fails
      try {
        // Fetch badges
        try {
          const badgesResponse = await userAPI.getUserBadges(userId);
          if (badgesResponse && badgesResponse.data) {
            setBadges(badgesResponse.data);
          }
        } catch (error) {
          console.error('Error fetching badges:', error);
        }
        
        // Fetch achievements
        try {
          const achievementsResponse = await userAPI.getUserAchievements(userId);
          if (achievementsResponse && achievementsResponse.data) {
            setAchievements(achievementsResponse.data);
          }
        } catch (error) {
          console.error('Error fetching achievements:', error);
        }
        
        // Fetch activity
        try {
          const activityResponse = await userAPI.getUserActivity(userId);
          if (activityResponse && activityResponse.data) {
            setActivity(activityResponse.data);
          }
        } catch (error) {
          console.error('Error fetching activity:', error);
        }
        
        // Fetch top recordings
        try {
          const topRecordingsResponse = await userAPI.getUserTopRecordings(userId);
          if (topRecordingsResponse && topRecordingsResponse.data) {
            setTopRecordings(topRecordingsResponse.data);
          }
        } catch (error) {
          console.error('Error fetching top recordings:', error);
        }
        
        // Fetch followers
        try {
          const followersResponse = await userAPI.getUserFollowers(userId);
          if (followersResponse && followersResponse.data) {
            setFollowers(followersResponse.data);
          }
        } catch (error) {
          console.error('Error fetching followers:', error);
        }
        
        // Fetch following
        try {
          const followingResponse = await userAPI.getUserFollowing(userId);
          if (followingResponse && followingResponse.data) {
            setFollowing(followingResponse.data);
          }
        } catch (error) {
          console.error('Error fetching following:', error);
        }
      } catch (error) {
        console.error('Error fetching profile extras:', error);
      }
    };

    fetchProfileData();
  }, [userId, user, navigate]);

  // Fetch user content based on active tab
  useEffect(() => {
    const fetchUserContent = async () => {
      if (!profileData) return;

      // Set empty arrays as defaults
      setUserPosts([]);
      setSavedPosts([]);
      setUserNFTs([]);

      try {
        if (activeTab === 'posts') {
          // Fetch user's voice posts
          try {
            const response = await userAPI.getUserVoicePosts(userId);
            if (response && response.data) {
              setUserPosts(response.data);
            }
          } catch (error) {
            console.error('Error fetching user posts:', error);
          }
        } else if (activeTab === 'saved' && isOwnProfile) {
          // Fetch saved posts from feed API
          try {
            const response = await feedAPI.getSavedPosts();
            if (response && response.data) {
              setSavedPosts(response.data);
            }
          } catch (error) {
            console.error('Error fetching saved posts:', error);
          }
        } else if (activeTab === 'nfts') {
          // Fetch NFTs from algorand API
          try {
            const response = await algorandAPI.getUserNFTs(userId || 'me');
            if (response && response.data) {
              setUserNFTs(response.data);
            }
          } catch (error) {
            console.error('Error fetching NFTs:', error);
          }
        }
      } catch (error) {
        console.error(`Error fetching ${activeTab}:`, error);
      }
    };

    fetchUserContent();
  }, [activeTab, profileData, userId, isOwnProfile]);

  // Note: We've removed the profile extras fetching useEffect since we're already setting that data
  // in the first useEffect. When the backend is ready, you can uncomment and adapt the code below.
  
  /*
  // Fetch badges, achievements, and activity
  useEffect(() => {
    const fetchProfileExtras = async () => {
      if (!profileData) return;
      
      try {
        // Fetch badges
        const badgesResponse = await userAPI.getUserBadges(userId);
        if (badgesResponse && badgesResponse.data) {
          setBadges(badgesResponse.data);
        }
        
        // Fetch achievements
        const achievementsResponse = await userAPI.getUserAchievements(userId);
        if (achievementsResponse && achievementsResponse.data) {
          setAchievements(achievementsResponse.data);
        }
        
        // Fetch activity
        const activityResponse = await userAPI.getUserActivity(userId);
        if (activityResponse && activityResponse.data) {
          setActivity(activityResponse.data);
        }
        
        // Fetch top recordings
        const topRecordingsResponse = await userAPI.getUserTopRecordings(userId);
        if (topRecordingsResponse && topRecordingsResponse.data) {
          setTopRecordings(topRecordingsResponse.data);
        }
        
        // Fetch followers and following
        const followersResponse = await userAPI.getUserFollowers(userId);
        if (followersResponse && followersResponse.data) {
          setFollowers(followersResponse.data);
        }
        
        const followingResponse = await userAPI.getUserFollowing(userId);
        if (followingResponse && followingResponse.data) {
          setFollowing(followingResponse.data);
        }
      } catch (error) {
        console.error('Error fetching profile extras:', error);
      }
    };

    fetchProfileExtras();
  }, [profileData, userId]);
  */

  const handleSaveProfile = async () => {
    try {
      await userAPI.updateUserProfile({
        displayName: editableProfile.displayName,
        bio: editableProfile.bio
      });

      // Update visibility if changed
      if (profileData?.isPublic !== editableProfile.isPublic) {
        await userAPI.toggleProfileVisibility(editableProfile.isPublic);
      }

      // Update local state
      setProfileData(prev => prev ? {
        ...prev,
        displayName: editableProfile.displayName,
        bio: editableProfile.bio,
        isPublic: editableProfile.isPublic
      } : null);

      // Update auth store if it's own profile
      if (isOwnProfile) {
        updateProfile({
          displayName: editableProfile.displayName,
          bio: editableProfile.bio
        });
      }

      setIsEditing(false);
      toast({
        title: 'Success',
        description: 'Profile updated successfully',
        variant: 'default'
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to update profile',
        variant: 'destructive'
      });
    }
  };

  const handleProfilePictureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    setIsUploading(true);
    
    try {
      const response = await userAPI.updateProfilePicture(file);
      
      // Update local state
      setProfileData(prev => prev ? {
        ...prev,
        avatar: response.data.avatar
      } : null);
      
      // Update auth store if it's own profile
      if (isOwnProfile) {
        updateProfile({
          avatar: response.data.avatar
        });
      }
      
      toast({
        title: 'Success',
        description: 'Profile picture updated successfully',
        variant: 'default'
      });
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      toast({
        title: 'Error',
        description: 'Failed to update profile picture',
        variant: 'destructive'
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveProfilePicture = async () => {
    setIsUploading(true);
    
    try {
      const response = await userAPI.removeProfilePicture();
      
      // Update local state
      setProfileData(prev => prev ? {
        ...prev,
        avatar: response.data.avatar
      } : null);
      
      // Update auth store if it's own profile
      if (isOwnProfile) {
        updateProfile({
          avatar: response.data.avatar
        });
      }
      
      toast({
        title: 'Success',
        description: 'Profile picture removed successfully',
        variant: 'default'
      });
    } catch (error) {
      console.error('Error removing profile picture:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove profile picture',
        variant: 'destructive'
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleToggleFollow = async () => {
    if (!userId || !user) return;
    
    try {
      const response = await userAPI.toggleFollowUser(userId);
      setIsFollowing(response.isFollowing);
      
      // Update follower count
      setProfileData(prev => prev ? {
        ...prev,
        followers: prev.followers + (response.isFollowing ? 1 : -1)
      } : null);
      
      toast({
        title: 'Success',
        description: response.isFollowing ? 'Now following user' : 'Unfollowed user',
        variant: 'default'
      });
    } catch (error) {
      console.error('Error toggling follow:', error);
      toast({
        title: 'Error',
        description: 'Failed to update follow status',
        variant: 'destructive'
      });
    }
  };

  const handleShareProfile = () => {
    setShowShareModal(true);
  };

  const copyProfileLink = () => {
    const profileUrl = `${window.location.origin}/profile/${profileData?.id}`;
    navigator.clipboard.writeText(profileUrl);
    toast({
      title: 'Copied!',
      description: 'Profile link copied to clipboard',
      variant: 'default'
    });
  };

  const shareToSocial = (platform: 'twitter' | 'facebook' | 'instagram') => {
    const profileUrl = `${window.location.origin}/profile/${profileData?.id}`;
    const text = `Check out ${profileData?.displayName}'s voice profile on VoiceVerse!`;
    
    let shareUrl = '';
    
    switch (platform) {
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(profileUrl)}`;
        break;
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(profileUrl)}`;
        break;
      case 'instagram':
        // Instagram doesn't have a direct share URL, but we can copy the link
        navigator.clipboard.writeText(profileUrl);
        toast({
          title: 'Copied!',
          description: 'Profile link copied. Open Instagram to share',
          variant: 'default'
        });
        return;
    }
    
    if (shareUrl) {
      window.open(shareUrl, '_blank', 'width=600,height=400');
    }
    
    setShowShareModal(false);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center items-center min-h-[60vh]">
        <Loader className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (!profileData && !user) return null;

  // Use profile data or fallback to user from auth store
  const profile = profileData || user;
  if (!profile) return null;

  // Create default values for missing user properties
  const displayName = profile.displayName || profile.username || 'User';
  const avatar = profile.avatar || profile.profilePicture || '';
  const bio = profile.bio || 'No bio available';
  const followerCount = profile.followers || 0;
  const joined = profile.joined || profile.createdAt || new Date().toISOString();
  const isVerified = profile.isVerified || false;
  const isPublic = profile.isPublic !== false; // default to true

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Profile Header */}
        <Card className="p-8 mb-8">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="relative group">
              <Avatar
                src={avatar}
                alt={displayName}
                size="xl"
                isVerified={isVerified}
              />
              {isOwnProfile && (
                <>
                  <div 
                    className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    onClick={() => setShowProfilePictureMenu(!showProfilePictureMenu)}
                  >
                    {isUploading ? (
                      <Loader className="h-6 w-6 text-white animate-spin" />
                    ) : (
                      <Camera className="h-6 w-6 text-white" />
                    )}
                  </div>
                  
                  {/* Profile Picture Menu */}
                  {showProfilePictureMenu && (
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 bg-white dark:bg-dark-800 rounded-lg shadow-lg border border-gray-200 dark:border-dark-700 py-2 z-10 min-w-[160px]">
                      <button
                        className="w-full px-4 py-2 text-left text-sm text-dark-700 dark:text-dark-300 hover:bg-gray-100 dark:hover:bg-dark-700 flex items-center gap-2"
                        onClick={() => {
                          fileInputRef.current?.click();
                          setShowProfilePictureMenu(false);
                        }}
                      >
                        <Upload className="h-4 w-4" />
                        {avatar ? 'Change Photo' : 'Upload Photo'}
                      </button>
                      {avatar && (
                        <button
                          className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-dark-700 flex items-center gap-2"
                          onClick={() => {
                            handleRemoveProfilePicture();
                            setShowProfilePictureMenu(false);
                          }}
                        >
                          <X className="h-4 w-4" />
                          Remove Photo
                        </button>
                      )}
                    </div>
                  )}
                </>
              )}
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*"
                onChange={handleProfilePictureUpload}
              />
            </div>
            <div className="flex-1 text-center md:text-left">
              {isEditing ? (
                <div className="mb-4">
                  <Label htmlFor="displayName">Display Name</Label>
                  <Input
                    id="displayName"
                    value={editableProfile.displayName}
                    onChange={(e) => setEditableProfile(prev => ({ ...prev, displayName: e.target.value }))}
                    className="mb-2"
                  />
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    value={editableProfile.bio}
                    onChange={(e) => setEditableProfile(prev => ({ ...prev, bio: e.target.value }))}
                    className="mb-2"
                    rows={3}
                  />
                  <div className="flex items-center gap-2 mb-4">
                    <Switch
                      id="profileVisibility"
                      checked={editableProfile.isPublic}
                      onCheckedChange={(checked) => setEditableProfile(prev => ({ ...prev, isPublic: checked }))}
                    />
                    <Label htmlFor="profileVisibility" className="cursor-pointer">
                      {editableProfile.isPublic ? (
                        <span className="flex items-center gap-1">
                          <Globe className="h-4 w-4" /> Public Profile
                        </span>
                      ) : (
                        <span className="flex items-center gap-1">
                          <Lock className="h-4 w-4" /> Private Profile
                        </span>
                      )}
                    </Label>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                    <h1 className="text-3xl font-display font-bold text-dark-900 dark:text-white">
                      {displayName}
                    </h1>
                    {isPublic ? (
                      <Tooltip content="Public Profile">
                        <Globe className="h-4 w-4 text-dark-500 dark:text-dark-400" />
                      </Tooltip>
                    ) : (
                      <Tooltip content="Private Profile">
                        <Lock className="h-4 w-4 text-dark-500 dark:text-dark-400" />
                      </Tooltip>
                    )}
                  </div>
                  <p className="text-dark-500 dark:text-dark-400 mb-4">
                    @{profile.username}
                  </p>
                  <p className="text-dark-700 dark:text-dark-300 mb-6">
                    {bio}
                  </p>
                </>
              )}
              <div className="flex flex-wrap justify-center md:justify-start gap-6 text-sm">
                <Tooltip content={`${formatNumber(followerCount)} followers`}>
                  <div className="flex items-center gap-2 text-dark-600 dark:text-dark-400">
                    <Users className="h-4 w-4" />
                    <span>{formatNumber(followerCount)} followers</span>
                  </div>
                </Tooltip>
                <Tooltip content={`Joined ${new Date(joined).toLocaleDateString()}`}>
                  <div className="flex items-center gap-2 text-dark-600 dark:text-dark-400">
                    <Calendar className="h-4 w-4" />
                    <span>Joined {new Date(joined).toLocaleDateString()}</span>
                  </div>
                </Tooltip>
                {isVerified && (
                  <Tooltip content="Verified Creator">
                    <div className="flex items-center gap-2 text-primary-600 dark:text-primary-400">
                      <Award className="h-4 w-4" />
                      <span>Verified Creator</span>
                    </div>
                  </Tooltip>
                )}
              </div>
            </div>
            <div className="flex flex-col gap-2">
              {isEditing ? (
                <>
                  <Button
                    variant="default"
                    leftIcon={<Save className="h-4 w-4" />}
                    onClick={handleSaveProfile}
                  >
                    Save
                  </Button>
                  <Button
                    variant="outline"
                    leftIcon={<X className="h-4 w-4" />}
                    onClick={() => {
                      setIsEditing(false);
                      setEditableProfile({
                        displayName: profileData?.displayName || '',
                        bio: profileData?.bio || '',
                        isPublic: profileData?.isPublic !== false
                      });
                    }}
                  >
                    Cancel
                  </Button>
                </>
              ) : (
                <>
                  {isOwnProfile ? (
                    <>
                      <Button
                        variant="outline"
                        leftIcon={<Edit3 className="h-4 w-4" />}
                        onClick={() => setIsEditing(true)}
                      >
                        Edit Profile
                      </Button>
                      <Button
                        variant="outline"
                        leftIcon={<Settings className="h-4 w-4" />}
                        onClick={() => navigate('/settings')}
                      >
                        Settings
                      </Button>
                    </>
                  ) : (
                    <Button
                      variant={isFollowing ? "outline" : "default"}
                      leftIcon={isFollowing ? <UserMinus className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
                      onClick={handleToggleFollow}
                    >
                      {isFollowing ? 'Unfollow' : 'Follow'}
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    leftIcon={<Share2 className="h-4 w-4" />}
                    onClick={handleShareProfile}
                  >
                    Share
                  </Button>
                </>
              )}
            </div>
          </div>
        </Card>

        {/* Share Modal */}
        <AnimatePresence>
          {showShareModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
              onClick={() => setShowShareModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white dark:bg-dark-800 rounded-lg p-6 max-w-md w-full"
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="text-xl font-bold mb-4 text-dark-900 dark:text-white">Share Profile</h3>
                <div className="flex flex-col gap-4">
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    leftIcon={<Copy className="h-4 w-4" />}
                    onClick={copyProfileLink}
                  >
                    Copy Profile Link
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    leftIcon={<Twitter className="h-4 w-4 text-[#1DA1F2]" />}
                    onClick={() => shareToSocial('twitter')}
                  >
                    Share on Twitter
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    leftIcon={<Facebook className="h-4 w-4 text-[#4267B2]" />}
                    onClick={() => shareToSocial('facebook')}
                  >
                    Share on Facebook
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    leftIcon={<Instagram className="h-4 w-4 text-[#E1306C]" />}
                    onClick={() => shareToSocial('instagram')}
                  >
                    Share on Instagram
                  </Button>
                </div>
                <Button
                  variant="ghost"
                  className="mt-4 w-full"
                  onClick={() => setShowShareModal(false)}
                >
                  Cancel
                </Button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="p-6 text-center">
            <TrendingUp className="h-6 w-6 mx-auto mb-2 text-primary-600 dark:text-primary-400" />
            <div className="text-2xl font-bold text-dark-900 dark:text-white mb-1">
              {formatNumber(profile.stats?.totalPlays || 0)}
            </div>
            <div className="text-dark-500 dark:text-dark-400">Total Plays</div>
          </Card>
          <Card className="p-6 text-center">
            <Play className="h-6 w-6 mx-auto mb-2 text-primary-600 dark:text-primary-400" />
            <div className="text-2xl font-bold text-dark-900 dark:text-white mb-1">
              {formatNumber(profile.stats?.voicePosts || userPosts.length || 0)}
            </div>
            <div className="text-dark-500 dark:text-dark-400">Voice Posts</div>
          </Card>
          <Card className="p-6 text-center">
            <Award className="h-6 w-6 mx-auto mb-2 text-primary-600 dark:text-primary-400" />
            <div className="text-2xl font-bold text-dark-900 dark:text-white mb-1">
              {formatNumber(profile.stats?.challengesWon || 0)}
            </div>
            <div className="text-dark-500 dark:text-dark-400">Challenges Won</div>
          </Card>
        </div>

        {/* Badges Section */}
        {badges.length > 0 && (
          <Card className="p-6 mb-8">
            <h2 className="text-xl font-bold text-dark-900 dark:text-white mb-4 flex items-center gap-2">
              <Hexagon className="h-5 w-5 text-primary-600 dark:text-primary-400" />
              Badges
            </h2>
            <div className="flex flex-wrap gap-4">
              {badges.map((badge) => (
                <Tooltip key={badge.id} content={badge.description}>
                  <div className="flex flex-col items-center p-3 bg-gray-100 dark:bg-dark-700 rounded-lg">
                    {badge.icon === 'star' && <Star className="h-8 w-8 text-yellow-500 mb-2" />}
                    {badge.icon === 'mic' && <Mic className="h-8 w-8 text-purple-500 mb-2" />}
                    {badge.icon === 'trending-up' && <TrendingUp className="h-8 w-8 text-green-500 mb-2" />}
                    <span className="text-sm font-medium text-dark-800 dark:text-dark-200">{badge.name}</span>
                  </div>
                </Tooltip>
              ))}
            </div>
          </Card>
        )}

        {/* Achievements Section */}
        {achievements.length > 0 && (
          <Card className="p-6 mb-8">
            <h2 className="text-xl font-bold text-dark-900 dark:text-white mb-4 flex items-center gap-2">
              <Trophy className="h-5 w-5 text-primary-600 dark:text-primary-400" />
              Achievements
            </h2>
            <div className="space-y-4">
              {achievements.map((achievement) => (
                <div key={achievement.id} className="flex items-start gap-4 p-3 bg-gray-50 dark:bg-dark-700 rounded-lg">
                  {achievement.icon === 'award' && <Award className="h-6 w-6 text-primary-600 dark:text-primary-400 mt-1" />}
                  {achievement.icon === 'play' && <Play className="h-6 w-6 text-green-500 mt-1" />}
                  {achievement.icon === 'trophy' && <Trophy className="h-6 w-6 text-yellow-500 mt-1" />}
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-dark-900 dark:text-white">{achievement.name}</h3>
                      <span className="text-xs text-dark-500 dark:text-dark-400">{formatTimeAgo(achievement.date)}</span>
                    </div>
                    <p className="text-sm text-dark-600 dark:text-dark-300">{achievement.description}</p>
                    {achievement.progress !== undefined && (
                      <div className="mt-2 w-full bg-gray-200 dark:bg-dark-600 rounded-full h-2">
                        <div 
                          className="bg-primary-600 dark:bg-primary-400 h-2 rounded-full" 
                          style={{ width: `${(achievement.progress / (achievement.maxProgress || 100)) * 100}%` }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Top Recordings Section */}
        {topRecordings.length > 0 && (
          <Card className="p-6 mb-8">
            <h2 className="text-xl font-bold text-dark-900 dark:text-white mb-4 flex items-center gap-2">
              <Music className="h-5 w-5 text-primary-600 dark:text-primary-400" />
              Top Recordings
            </h2>
            <div className="space-y-4">
              {topRecordings.map((recording, index) => (
                <div key={recording.id} className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-dark-700 rounded-lg">
                  <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-400 font-bold">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-dark-800 dark:text-dark-200 mb-1">{recording.caption}</p>
                    <div className="flex items-center gap-4 text-xs text-dark-500 dark:text-dark-400">
                      <div className="flex items-center gap-1">
                        <Play className="h-3 w-3" />
                        {formatNumber(recording.plays)} plays
                      </div>
                      <div className="flex items-center gap-1">
                        <Heart className="h-3 w-3" />
                        {formatNumber(recording.likes)}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => {
                      // Play the recording
                    }}
                  >
                    <Play className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Activity Feed */}
        {activity.length > 0 && (
          <Card className="p-6 mb-8">
            <h2 className="text-xl font-bold text-dark-900 dark:text-white mb-4 flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary-600 dark:text-primary-400" />
              Recent Activity
            </h2>
            <div className="space-y-4">
              {activity.map((event) => (
                <div key={event.id} className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-full bg-gray-100 dark:bg-dark-700 flex items-center justify-center">
                    {event.type === 'post' && <Mic className="h-5 w-5 text-primary-600 dark:text-primary-400" />}
                    {event.type === 'like' && <Heart className="h-5 w-5 text-red-500" />}
                    {event.type === 'follow' && <UserPlus className="h-5 w-5 text-green-500" />}
                    {event.type === 'challenge' && <Trophy className="h-5 w-5 text-yellow-500" />}
                    {event.type === 'nft' && <Hexagon className="h-5 w-5 text-purple-500" />}
                    {event.type === 'achievement' && <Award className="h-5 w-5 text-blue-500" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-dark-800 dark:text-dark-200">{event.description}</p>
                    <p className="text-xs text-dark-500 dark:text-dark-400">{formatTimeAgo(event.date)}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Content Tabs */}
        <div className="mb-6">
          <div className="flex gap-4 border-b border-gray-200 dark:border-dark-700">
            <button
              className={`px-4 py-2 text-sm font-medium capitalize transition-colors relative ${
                activeTab === 'posts'
                  ? 'text-primary-600 dark:text-primary-400'
                  : 'text-dark-500 dark:text-dark-400 hover:text-dark-900 dark:hover:text-white'
              }`}
              onClick={() => setActiveTab('posts')}
            >
              Posts
              {activeTab === 'posts' && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600 dark:bg-primary-400"
                />
              )}
            </button>
            
            {isOwnProfile && (
              <button
                className={`px-4 py-2 text-sm font-medium capitalize transition-colors relative ${
                  activeTab === 'saved'
                    ? 'text-primary-600 dark:text-primary-400'
                    : 'text-dark-500 dark:text-dark-400 hover:text-dark-900 dark:hover:text-white'
                }`}
                onClick={() => setActiveTab('saved')}
              >
                Saved
                {activeTab === 'saved' && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600 dark:bg-primary-400"
                  />
                )}
              </button>
            )}
            
            <button
              className={`px-4 py-2 text-sm font-medium capitalize transition-colors relative ${
                activeTab === 'nfts'
                  ? 'text-primary-600 dark:text-primary-400'
                  : 'text-dark-500 dark:text-dark-400 hover:text-dark-900 dark:hover:text-white'
              }`}
              onClick={() => setActiveTab('nfts')}
            >
              NFTs
              {activeTab === 'nfts' && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600 dark:bg-primary-400"
                />
              )}
            </button>
            
            <button
              className={`px-4 py-2 text-sm font-medium capitalize transition-colors relative ${
                activeTab === 'followers'
                  ? 'text-primary-600 dark:text-primary-400'
                  : 'text-dark-500 dark:text-dark-400 hover:text-dark-900 dark:hover:text-white'
              }`}
              onClick={() => setActiveTab('followers')}
            >
              Followers
              {activeTab === 'followers' && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600 dark:bg-primary-400"
                />
              )}
            </button>
            
            <button
              className={`px-4 py-2 text-sm font-medium capitalize transition-colors relative ${
                activeTab === 'following'
                  ? 'text-primary-600 dark:text-primary-400'
                  : 'text-dark-500 dark:text-dark-400 hover:text-dark-900 dark:hover:text-white'
              }`}
              onClick={() => setActiveTab('following')}
            >
              Following
              {activeTab === 'following' && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600 dark:bg-primary-400"
                />
              )}
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {/* Posts Tab */}
            {activeTab === 'posts' && (
              <div className="grid gap-4">
                {userPosts.length > 0 ? (
                  userPosts.map(post => (
                    <AudioPostCard key={post.id} post={post} />
                  ))
                ) : (
                  <div className="text-center py-12">
                    <Mic className="h-12 w-12 mx-auto text-dark-300 dark:text-dark-600 mb-4" />
                    <h3 className="text-lg font-medium text-dark-800 dark:text-dark-200 mb-2">No Voice Posts Yet</h3>
                    <p className="text-dark-500 dark:text-dark-400 max-w-md mx-auto">
                      {isOwnProfile 
                        ? "You haven't created any voice posts yet. Start recording to share your voice with the world!"
                        : `${profile.displayName} hasn't created any voice posts yet.`}
                    </p>
                    {isOwnProfile && (
                      <Button
                        variant="default"
                        className="mt-4"
                        leftIcon={<Mic className="h-4 w-4" />}
                        onClick={() => navigate('/create')}
                      >
                        Create Voice Post
                      </Button>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Saved Tab */}
            {activeTab === 'saved' && isOwnProfile && (
              <div className="grid gap-4">
                {savedPosts.length > 0 ? (
                  savedPosts.map(post => (
                    <AudioPostCard key={post.id} post={post} />
                  ))
                ) : (
                  <div className="text-center py-12">
                    <Bookmark className="h-12 w-12 mx-auto text-dark-300 dark:text-dark-600 mb-4" />
                    <h3 className="text-lg font-medium text-dark-800 dark:text-dark-200 mb-2">No Saved Posts</h3>
                    <p className="text-dark-500 dark:text-dark-400 max-w-md mx-auto">
                      You haven't saved any voice posts yet. Browse and save posts to listen to them later.
                    </p>
                    <Button
                      variant="default"
                      className="mt-4"
                      leftIcon={<Play className="h-4 w-4" />}
                      onClick={() => navigate('/explore')}
                    >
                      Explore Posts
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* NFTs Tab */}
            {activeTab === 'nfts' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {userNFTs.length > 0 ? (
                  userNFTs.map(nft => (
                    <Card key={nft.id} className="p-4 overflow-hidden">
                      <div className="aspect-square rounded-lg overflow-hidden mb-4 bg-gray-100 dark:bg-dark-700 relative">
                        <img 
                          src={nft.imageUrl} 
                          alt={nft.title} 
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                          <div className="flex items-center justify-between">
                            <div className="text-white font-medium">{nft.title}</div>
                            <div className="bg-primary-600 text-white px-2 py-1 rounded text-xs font-medium">
                              {nft.price} {nft.currency}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="text-dark-800 dark:text-dark-200 font-medium">{nft.title}</div>
                        <div className="text-dark-500 dark:text-dark-400 text-sm">{formatTimeAgo(nft.createdAt)}</div>
                      </div>
                      <p className="text-dark-600 dark:text-dark-300 text-sm mt-1 mb-3">{nft.description}</p>
                      <div className="flex items-center justify-between">
                        <Button
                          variant="outline"
                          size="sm"
                          leftIcon={<Play className="h-3 w-3" />}
                        >
                          Preview
                        </Button>
                        {isOwnProfile ? (
                          <Button
                            variant="default"
                            size="sm"
                          >
                            Manage
                          </Button>
                        ) : (
                          <Button
                            variant="default"
                            size="sm"
                          >
                            Purchase
                          </Button>
                        )}
                      </div>
                    </Card>
                  ))
                ) : (
                  <div className="text-center py-12 col-span-2">
                    <Hexagon className="h-12 w-12 mx-auto text-dark-300 dark:text-dark-600 mb-4" />
                    <h3 className="text-lg font-medium text-dark-800 dark:text-dark-200 mb-2">No Voice NFTs</h3>
                    <p className="text-dark-500 dark:text-dark-400 max-w-md mx-auto">
                      {isOwnProfile 
                        ? "You haven't created any voice NFTs yet. Mint your best voice transformations as NFTs!"
                        : `${profile.displayName} hasn't created any voice NFTs yet.`}
                    </p>
                    {isOwnProfile && (
                      <Button
                        variant="default"
                        className="mt-4"
                        leftIcon={<Hexagon className="h-4 w-4" />}
                        onClick={() => navigate('/mint')}
                      >
                        Mint Voice NFT
                      </Button>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Followers Tab */}
            {activeTab === 'followers' && (
              <div className="grid gap-4">
                {followers.length > 0 ? (
                  followers.map(follower => (
                    <Card key={follower.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar
                            src={follower.avatar}
                            alt={follower.displayName}
                            size="md"
                            isVerified={follower.isVerified}
                          />
                          <div>
                            <div className="flex items-center gap-1">
                              <h3 className="font-medium text-dark-900 dark:text-white">{follower.displayName}</h3>
                              {follower.isVerified && (
                                <Award className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                              )}
                            </div>
                            <p className="text-sm text-dark-500 dark:text-dark-400">@{follower.username}</p>
                          </div>
                        </div>
                        {isOwnProfile && (
                          <Button
                            variant={follower.isFollowing ? "outline" : "default"}
                            size="sm"
                          >
                            {follower.isFollowing ? 'Following' : 'Follow'}
                          </Button>
                        )}
                      </div>
                    </Card>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <Users className="h-12 w-12 mx-auto text-dark-300 dark:text-dark-600 mb-4" />
                    <h3 className="text-lg font-medium text-dark-800 dark:text-dark-200 mb-2">No Followers Yet</h3>
                    <p className="text-dark-500 dark:text-dark-400 max-w-md mx-auto">
                      {isOwnProfile 
                        ? "You don't have any followers yet. Share your profile to get noticed!"
                        : `${profile.displayName} doesn't have any followers yet.`}
                    </p>
                    {isOwnProfile && (
                      <Button
                        variant="default"
                        className="mt-4"
                        leftIcon={<Share2 className="h-4 w-4" />}
                        onClick={handleShareProfile}
                      >
                        Share Profile
                      </Button>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Following Tab */}
            {activeTab === 'following' && (
              <div className="grid gap-4">
                {following.length > 0 ? (
                  following.map(followedUser => (
                    <Card key={followedUser.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar
                            src={followedUser.avatar}
                            alt={followedUser.displayName}
                            size="md"
                            isVerified={followedUser.isVerified}
                          />
                          <div>
                            <div className="flex items-center gap-1">
                              <h3 className="font-medium text-dark-900 dark:text-white">{followedUser.displayName}</h3>
                              {followedUser.isVerified && (
                                <Award className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                              )}
                            </div>
                            <p className="text-sm text-dark-500 dark:text-dark-400">@{followedUser.username}</p>
                          </div>
                        </div>
                        {isOwnProfile && (
                          <Button
                            variant="outline"
                            size="sm"
                          >
                            Unfollow
                          </Button>
                        )}
                      </div>
                    </Card>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <Users className="h-12 w-12 mx-auto text-dark-300 dark:text-dark-600 mb-4" />
                    <h3 className="text-lg font-medium text-dark-800 dark:text-dark-200 mb-2">Not Following Anyone</h3>
                    <p className="text-dark-500 dark:text-dark-400 max-w-md mx-auto">
                      {isOwnProfile 
                        ? "You're not following anyone yet. Explore to find creators to follow!"
                        : `${profile.displayName} isn't following anyone yet.`}
                    </p>
                    {isOwnProfile && (
                      <Button
                        variant="default"
                        className="mt-4"
                        leftIcon={<Users className="h-4 w-4" />}
                        onClick={() => navigate('/explore')}
                      >
                        Discover Creators
                      </Button>
                    )}
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};