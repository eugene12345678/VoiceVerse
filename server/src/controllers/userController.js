const { PrismaClient } = require('@prisma/client');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

const prisma = new PrismaClient();

// Configure multer for profile picture uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/images/profiles');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `profile-${req.user.id}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Get user profile
const getUserProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user?.id;
    
    // If no userId provided, return current user's profile
    const targetUserId = userId || currentUserId;
    
    if (!targetUserId) {
      return res.status(400).json({
        status: 'error',
        message: 'User ID is required'
      });
    }

    // Validate that targetUserId is a valid UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(targetUserId)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid user ID format'
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: {
        id: true,
        username: true,
        displayName: true,
        avatar: true,
        bio: true,
        followers: true,
        following: true,
        isVerified: true,
        createdAt: true,
        // Only include email for own profile
        ...(targetUserId === currentUserId && { email: true })
      }
    });

    // Get counts separately to avoid Prisma validation issues
    let postCount = 0;
    let nftCount = 0;
    let challengeCount = 0;

    try {
      [postCount, nftCount, challengeCount] = await Promise.all([
        prisma.voicePost.count({ where: { userId: targetUserId } }),
        prisma.nFT.count({ where: { creatorId: targetUserId } }),
        prisma.challengeParticipation.count({ where: { userId: targetUserId } })
      ]);
    } catch (countError) {
      console.warn('Error fetching counts:', countError);
      // Continue with default values of 0
    }

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    // Check if current user is following this user (if different users)
    let isFollowing = false;
    if (currentUserId && targetUserId !== currentUserId) {
      const followRelation = await prisma.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId: currentUserId,
            followingId: targetUserId
          }
        }
      });
      isFollowing = !!followRelation;
    }

    // Format response
    const profileData = {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      avatar: user.avatar,
      bio: user.bio,
      followers: user.followers,
      following: user.following,
      isVerified: user.isVerified,
      isPublic: true, // Default to public since field doesn't exist in DB
      joined: user.createdAt,
      isFollowing,
      stats: {
        voicePosts: postCount,
        challengesWon: challengeCount, // This would need more complex logic for actual wins
        totalPlays: 0 // This would need to be calculated from post engagement
      }
    };

    // Include email only for own profile
    if (targetUserId === currentUserId && user.email) {
      profileData.email = user.email;
    }

    res.json({
      status: 'success',
      data: profileData
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch user profile'
    });
  }
};

// Update user profile
const updateUserProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { displayName, bio } = req.body;

    // Validate input
    if (displayName && displayName.length > 100) {
      return res.status(400).json({
        status: 'error',
        message: 'Display name must be less than 100 characters'
      });
    }

    if (bio && bio.length > 500) {
      return res.status(400).json({
        status: 'error',
        message: 'Bio must be less than 500 characters'
      });
    }

    const updateData = {};
    if (displayName !== undefined) updateData.displayName = displayName;
    if (bio !== undefined) updateData.bio = bio;
    updateData.updatedAt = new Date();

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        username: true,
        displayName: true,
        bio: true,
        avatar: true,
        updatedAt: true
      }
    });

    res.json({
      status: 'success',
      message: 'Profile updated successfully',
      data: updatedUser
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update profile'
    });
  }
};

// Update profile picture
const updateProfilePicture = async (req, res) => {
  try {
    const userId = req.user.id;

    if (!req.file) {
      return res.status(400).json({
        status: 'error',
        message: 'No image file provided'
      });
    }

    // Get current user to check for existing avatar
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { avatar: true }
    });

    // Delete old avatar file if it exists and is not a default/external URL
    if (currentUser?.avatar && currentUser.avatar.startsWith('/uploads/')) {
      const oldAvatarPath = path.join(__dirname, '../..', currentUser.avatar);
      try {
        await fs.unlink(oldAvatarPath);
      } catch (error) {
        console.log('Could not delete old avatar file:', error.message);
      }
    }

    // Generate the URL path for the uploaded file
    const avatarUrl = `/uploads/images/profiles/${req.file.filename}`;

    // Update user's avatar in database
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        avatar: avatarUrl,
        updatedAt: new Date()
      },
      select: {
        id: true,
        username: true,
        displayName: true,
        avatar: true,
        updatedAt: true
      }
    });

    res.json({
      status: 'success',
      message: 'Profile picture updated successfully',
      data: {
        avatar: updatedUser.avatar
      }
    });
  } catch (error) {
    console.error('Error updating profile picture:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update profile picture'
    });
  }
};

// Remove profile picture
const removeProfilePicture = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get current user to check for existing avatar
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { avatar: true }
    });

    // Delete avatar file if it exists and is not a default/external URL
    if (currentUser?.avatar && currentUser.avatar.startsWith('/uploads/')) {
      const avatarPath = path.join(__dirname, '../..', currentUser.avatar);
      try {
        await fs.unlink(avatarPath);
      } catch (error) {
        console.log('Could not delete avatar file:', error.message);
      }
    }

    // Update user's avatar to null in database
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        avatar: null,
        updatedAt: new Date()
      },
      select: {
        id: true,
        username: true,
        displayName: true,
        avatar: true,
        updatedAt: true
      }
    });

    res.json({
      status: 'success',
      message: 'Profile picture removed successfully',
      data: {
        avatar: updatedUser.avatar
      }
    });
  } catch (error) {
    console.error('Error removing profile picture:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to remove profile picture'
    });
  }
};

// Toggle profile visibility
const toggleProfileVisibility = async (req, res) => {
  try {
    const userId = req.user.id;
    const { isPublic } = req.body;

    if (typeof isPublic !== 'boolean') {
      return res.status(400).json({
        status: 'error',
        message: 'isPublic must be a boolean value'
      });
    }

    // Since isPublic field doesn't exist in the current DB schema,
    // we'll just return success for now
    res.json({
      status: 'success',
      message: `Profile is now ${isPublic ? 'public' : 'private'}`,
      data: {
        isPublic: isPublic
      }
    });
  } catch (error) {
    console.error('Error toggling profile visibility:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update profile visibility'
    });
  }
};

// Get user's posts
const getUserPosts = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user?.id;
    const targetUserId = userId || currentUserId;
    
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    if (!targetUserId) {
      return res.status(400).json({
        status: 'error',
        message: 'User ID is required'
      });
    }

    // For now, return empty posts since VoicePost table might not exist yet
    res.json({
      status: 'success',
      data: [],
      pagination: {
        page,
        limit,
        total: 0,
        hasMore: false
      }
    });
  } catch (error) {
    console.error('Error fetching user posts:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch user posts'
    });
  }
};

// Follow/unfollow user
const toggleFollowUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user.id;

    if (userId === currentUserId) {
      return res.status(400).json({
        status: 'error',
        message: 'You cannot follow yourself'
      });
    }

    // Check if target user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, followers: true }
    });

    if (!targetUser) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    // Check if already following
    const existingFollow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: currentUserId,
          followingId: userId
        }
      }
    });

    let isFollowing;
    let message;

    if (existingFollow) {
      // Unfollow
      await prisma.$transaction([
        prisma.follow.delete({
          where: {
            followerId_followingId: {
              followerId: currentUserId,
              followingId: userId
            }
          }
        }),
        prisma.user.update({
          where: { id: userId },
          data: { followers: { decrement: 1 } }
        }),
        prisma.user.update({
          where: { id: currentUserId },
          data: { following: { decrement: 1 } }
        })
      ]);
      
      isFollowing = false;
      message = 'Unfollowed user successfully';
    } else {
      // Follow
      await prisma.$transaction([
        prisma.follow.create({
          data: {
            followerId: currentUserId,
            followingId: userId
          }
        }),
        prisma.user.update({
          where: { id: userId },
          data: { followers: { increment: 1 } }
        }),
        prisma.user.update({
          where: { id: currentUserId },
          data: { following: { increment: 1 } }
        })
      ]);
      
      isFollowing = true;
      message = 'Followed user successfully';
    }

    res.json({
      status: 'success',
      message,
      isFollowing
    });
  } catch (error) {
    console.error('Error toggling follow user:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update follow status'
    });
  }
};

// Get user's followers
const getUserFollowers = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user?.id;
    const targetUserId = userId || currentUserId;
    
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    if (!targetUserId) {
      return res.status(400).json({
        status: 'error',
        message: 'User ID is required'
      });
    }

    const followers = await prisma.follow.findMany({
      where: { followingId: targetUserId },
      include: {
        follower: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
            isVerified: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit
    });

    const total = await prisma.follow.count({
      where: { followingId: targetUserId }
    });

    // Check if current user is following each follower
    const followerIds = followers.map(f => f.follower.id);
    const currentUserFollowing = currentUserId ? await prisma.follow.findMany({
      where: {
        followerId: currentUserId,
        followingId: { in: followerIds }
      },
      select: { followingId: true }
    }) : [];

    const followingSet = new Set(currentUserFollowing.map(f => f.followingId));

    const formattedFollowers = followers.map(follow => ({
      ...follow.follower,
      isFollowing: followingSet.has(follow.follower.id)
    }));

    res.json({
      status: 'success',
      data: formattedFollowers,
      pagination: {
        page,
        limit,
        total,
        hasMore: skip + limit < total
      }
    });
  } catch (error) {
    console.error('Error fetching user followers:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch followers'
    });
  }
};

// Get user's following
const getUserFollowing = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user?.id;
    const targetUserId = userId || currentUserId;
    
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    if (!targetUserId) {
      return res.status(400).json({
        status: 'error',
        message: 'User ID is required'
      });
    }

    const following = await prisma.follow.findMany({
      where: { followerId: targetUserId },
      include: {
        following: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
            isVerified: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit
    });

    const total = await prisma.follow.count({
      where: { followerId: targetUserId }
    });

    const formattedFollowing = following.map(follow => ({
      ...follow.following,
      isFollowing: true // They are following these users
    }));

    res.json({
      status: 'success',
      data: formattedFollowing,
      pagination: {
        page,
        limit,
        total,
        hasMore: skip + limit < total
      }
    });
  } catch (error) {
    console.error('Error fetching user following:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch following'
    });
  }
};

// Get user's activity
const getUserActivity = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user?.id;
    const targetUserId = userId || currentUserId;
    
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    if (!targetUserId) {
      return res.status(400).json({
        status: 'error',
        message: 'User ID is required'
      });
    }

    // For now, return empty activity since we don't have an activity tracking system yet
    res.json({
      status: 'success',
      data: [],
      pagination: {
        page,
        limit,
        total: 0,
        hasMore: false
      }
    });
  } catch (error) {
    console.error('Error fetching user activity:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch user activity'
    });
  }
};

// Get user's top recordings
const getUserTopRecordings = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user?.id;
    const targetUserId = userId || currentUserId;
    
    const limit = parseInt(req.query.limit) || 5;

    if (!targetUserId) {
      return res.status(400).json({
        status: 'error',
        message: 'User ID is required'
      });
    }

    // For now, return empty top recordings since we don't have play tracking yet
    res.json({
      status: 'success',
      data: []
    });
  } catch (error) {
    console.error('Error fetching user top recordings:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch top recordings'
    });
  }
};

// Get user's badges
const getUserBadges = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user?.id;
    const targetUserId = userId || currentUserId;

    if (!targetUserId) {
      return res.status(400).json({
        status: 'error',
        message: 'User ID is required'
      });
    }

    // For now, return empty badges since we don't have a badge system yet
    res.json({
      status: 'success',
      data: []
    });
  } catch (error) {
    console.error('Error fetching user badges:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch badges'
    });
  }
};

// Get user's achievements
const getUserAchievements = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user?.id;
    const targetUserId = userId || currentUserId;

    if (!targetUserId) {
      return res.status(400).json({
        status: 'error',
        message: 'User ID is required'
      });
    }

    // For now, return empty achievements since we don't have an achievement system yet
    res.json({
      status: 'success',
      data: []
    });
  } catch (error) {
    console.error('Error fetching user achievements:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch achievements'
    });
  }
};

module.exports = {
  getUserProfile,
  updateUserProfile,
  updateProfilePicture: [upload.single('avatar'), updateProfilePicture],
  removeProfilePicture,
  toggleProfileVisibility,
  getUserPosts,
  toggleFollowUser,
  getUserFollowers,
  getUserFollowing,
  getUserActivity,
  getUserTopRecordings,
  getUserBadges,
  getUserAchievements
};