const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');

/**
 * Get all feed posts
 * @route GET /api/feed
 * @access Public
 */
exports.getFeedPosts = async (req, res) => {
  try {
    const { filter = 'trending', page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * parseInt(limit);
    
    let orderBy = {};
    
    // Apply filters
    switch (filter) {
      case 'trending':
        orderBy = { 
          likes: {
            _count: 'desc'
          }
        };
        break;
      case 'latest':
        orderBy = { createdAt: 'desc' };
        break;
      case 'following':
        // If user is authenticated, get posts from followed users
        if (req.user) {
          const following = await req.prisma.follow.findMany({
            where: { followerId: req.user.id },
            select: { followingId: true }
          });
          
          const followingIds = following.map(f => f.followingId);
          
          const posts = await req.prisma.feedPost.findMany({
            where: { userId: { in: followingIds } },
            orderBy: { createdAt: 'desc' },
            skip,
            take: parseInt(limit),
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  displayName: true,
                  avatar: true,
                  isVerified: true
                }
              },
              audioFile: true,
              tags: true,
              _count: {
                select: {
                  likes: true,
                  comments: true,
                  shares: true
                }
              }
            }
          });
          
          // Check if user has liked or saved each post
          const postsWithUserInteraction = await Promise.all(
            posts.map(async (post) => {
              const isLiked = req.user ? await req.prisma.like.findFirst({
                where: { feedPostId: post.id, userId: req.user.id }
              }) : false;
              
              const isSaved = req.user ? await req.prisma.savedPost.findFirst({
                where: { postId: post.id, userId: req.user.id }
              }) : false;
              
              return {
                ...post,
                tags: post.tags.map(t => t.tag),
                likes: post._count.likes,
                comments: post._count.comments,
                shares: post._count.shares,
                isLiked: !!isLiked,
                isSaved: !!isSaved
              };
            })
          );
          
          return res.json({
            status: 'success',
            data: postsWithUserInteraction,
            pagination: {
              page: parseInt(page),
              limit: parseInt(limit),
              hasMore: postsWithUserInteraction.length === parseInt(limit)
            }
          });
        }
        // If not authenticated, fall back to trending
        orderBy = { 
          likes: {
            _count: 'desc'
          }
        };
        break;
      default:
        orderBy = { createdAt: 'desc' };
    }
    
    // Get posts with pagination
    const posts = await req.prisma.feedPost.findMany({
      orderBy,
      skip,
      take: parseInt(limit),
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
            isVerified: true
          }
        },
        audioFile: true,
        tags: true,
        _count: {
          select: {
            likes: true,
            comments: true,
            shares: true
          }
        }
      }
    });
    
    // Check if user has liked or saved each post
    const postsWithUserInteraction = await Promise.all(
      posts.map(async (post) => {
        const isLiked = req.user ? await req.prisma.like.findFirst({
          where: { feedPostId: post.id, userId: req.user.id }
        }) : false;
        
        const isSaved = req.user ? await req.prisma.savedPost.findFirst({
          where: { postId: post.id, userId: req.user.id }
        }) : false;
        
        return {
          ...post,
          tags: post.tags.map(t => t.tag),
          likes: post._count.likes,
          comments: post._count.comments,
          shares: post._count.shares,
          isLiked: !!isLiked,
          isSaved: !!isSaved
        };
      })
    );
    
    res.json({
      status: 'success',
      data: postsWithUserInteraction,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        hasMore: postsWithUserInteraction.length === parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching feed posts:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch feed posts'
    });
  }
};

/**
 * Create a new feed post
 * @route POST /api/feed
 * @access Private
 */
exports.createFeedPost = async (req, res) => {
  try {
    const { audioFileId, caption, description, tags } = req.body;
    
    // Validate audio file exists
    const audioFile = await req.prisma.audioFile.findUnique({
      where: { id: audioFileId }
    });
    
    if (!audioFile) {
      return res.status(404).json({
        status: 'error',
        message: 'Audio file not found'
      });
    }
    
    // Check if user owns the audio file
    if (audioFile.userId !== req.user.id) {
      return res.status(403).json({
        status: 'error',
        message: 'You do not have permission to use this audio file'
      });
    }
    
    // Create new post with transaction to handle tags
    const postId = uuidv4();
    
    const post = await req.prisma.$transaction(async (prisma) => {
      // Create the post first
      const newPost = await prisma.feedPost.create({
        data: {
          id: postId,
          caption,
          description,
          userId: req.user.id,
          audioFileId,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatar: true,
              isVerified: true
            }
          },
          audioFile: true
        }
      });
      
      // Create tags if provided
      if (tags && tags.length > 0) {
        const tagPromises = tags.map(tag => 
          prisma.feedPostTag.create({
            data: {
              id: uuidv4(),
              postId: postId,
              tag: tag
            }
          })
        );
        
        await Promise.all(tagPromises);
      }
      
      // Return the post with tags
      return newPost;
    });
    
    // Fetch tags separately
    const postTags = await req.prisma.feedPostTag.findMany({
      where: { postId: post.id },
      select: { tag: true }
    });
    
    res.status(201).json({
      status: 'success',
      data: {
        ...post,
        tags: postTags.map(t => t.tag),
        likes: 0,
        comments: 0,
        shares: 0,
        isLiked: false,
        isSaved: false
      }
    });
  } catch (error) {
    console.error('Error creating feed post:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create feed post'
    });
  }
};

/**
 * Get a specific feed post
 * @route GET /api/feed/:id
 * @access Public
 */
exports.getFeedPost = async (req, res) => {
  try {
    const { id } = req.params;
    
    const post = await req.prisma.feedPost.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
            isVerified: true
          }
        },
        audioFile: true,
        tags: true,
        _count: {
          select: {
            likes: true,
            comments: true,
            shares: true
          }
        }
      }
    });
    
    if (!post) {
      return res.status(404).json({
        status: 'error',
        message: 'Post not found'
      });
    }
    
    // Check if user has liked or saved the post
    const isLiked = req.user ? await req.prisma.like.findFirst({
      where: { feedPostId: id, userId: req.user.id }
    }) : false;
    
    const isSaved = req.user ? await req.prisma.savedPost.findFirst({
      where: { postId: id, userId: req.user.id }
    }) : false;
    
    res.json({
      status: 'success',
      data: {
        ...post,
        tags: post.tags.map(t => t.tag),
        likes: post._count.likes,
        comments: post._count.comments,
        shares: post._count.shares,
        isLiked: !!isLiked,
        isSaved: !!isSaved
      }
    });
  } catch (error) {
    console.error('Error fetching feed post:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch feed post'
    });
  }
};

/**
 * Like a feed post
 * @route POST /api/feed/:id/like
 * @access Private
 */
exports.likeFeedPost = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if post exists
    const post = await req.prisma.feedPost.findUnique({
      where: { id }
    });
    
    if (!post) {
      return res.status(404).json({
        status: 'error',
        message: 'Post not found'
      });
    }
    
    // Check if user has already liked the post
    const existingLike = await req.prisma.like.findFirst({
      where: {
        feedPostId: id,
        userId: req.user.id
      }
    });
    
    if (existingLike) {
      // Unlike the post
      await req.prisma.like.delete({
        where: {
          id: existingLike.id
        }
      });
      
      res.json({
        status: 'success',
        message: 'Post unliked successfully',
        isLiked: false
      });
    } else {
      // Like the post
      await req.prisma.like.create({
        data: {
          id: uuidv4(),
          feedPostId: id,
          userId: req.user.id,
          createdAt: new Date()
        }
      });
      
      res.json({
        status: 'success',
        message: 'Post liked successfully',
        isLiked: true
      });
    }
  } catch (error) {
    console.error('Error liking feed post:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to like feed post'
    });
  }
};

/**
 * Save a feed post
 * @route POST /api/feed/:id/save
 * @access Private
 */
exports.saveFeedPost = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if post exists
    const post = await req.prisma.feedPost.findUnique({
      where: { id }
    });
    
    if (!post) {
      return res.status(404).json({
        status: 'error',
        message: 'Post not found'
      });
    }
    
    // Check if user has already saved the post
    const existingSave = await req.prisma.savedPost.findFirst({
      where: {
        postId: id,
        userId: req.user.id
      }
    });
    
    if (existingSave) {
      // Unsave the post
      await req.prisma.savedPost.delete({
        where: {
          id: existingSave.id
        }
      });
      
      res.json({
        status: 'success',
        message: 'Post unsaved successfully',
        isSaved: false
      });
    } else {
      // Save the post
      await req.prisma.savedPost.create({
        data: {
          id: uuidv4(),
          postId: id,
          userId: req.user.id,
          createdAt: new Date()
        }
      });
      
      res.json({
        status: 'success',
        message: 'Post saved successfully',
        isSaved: true
      });
    }
  } catch (error) {
    console.error('Error saving feed post:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to save feed post'
    });
  }
};

/**
 * Share a feed post
 * @route POST /api/feed/:id/share
 * @access Private
 */
exports.shareFeedPost = async (req, res) => {
  try {
    const { id } = req.params;
    const { platform } = req.body;
    
    // Check if post exists
    const post = await req.prisma.feedPost.findUnique({
      where: { id }
    });
    
    if (!post) {
      return res.status(404).json({
        status: 'error',
        message: 'Post not found'
      });
    }
    
    // Record the share
    await req.prisma.share.create({
      data: {
        id: uuidv4(),
        postId: id,
        userId: req.user.id,
        platform: platform || 'other',
        createdAt: new Date()
      }
    });
    
    res.json({
      status: 'success',
      message: 'Post shared successfully'
    });
  } catch (error) {
    console.error('Error sharing feed post:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to share feed post'
    });
  }
};

/**
 * Get comments for a feed post
 * @route GET /api/feed/:id/comments
 * @access Public
 */
exports.getFeedPostComments = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * parseInt(limit);
    
    // Check if post exists
    const post = await req.prisma.feedPost.findUnique({
      where: { id }
    });
    
    if (!post) {
      return res.status(404).json({
        status: 'error',
        message: 'Post not found'
      });
    }
    
    // Get comments with pagination
    const comments = await req.prisma.comment.findMany({
      where: { postId: id },
      orderBy: { createdAt: 'desc' },
      skip,
      take: parseInt(limit),
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
            isVerified: true
          }
        },
        _count: {
          select: {
            likes: true
          }
        }
      }
    });
    
    // Check if user has liked each comment
    const commentsWithUserInteraction = await Promise.all(
      comments.map(async (comment) => {
        const isLiked = req.user ? await req.prisma.commentLike.findFirst({
          where: { commentId: comment.id, userId: req.user.id }
        }) : false;
        
        return {
          ...comment,
          likes: comment._count.likes,
          isLiked: !!isLiked
        };
      })
    );
    
    res.json({
      status: 'success',
      data: commentsWithUserInteraction,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        hasMore: commentsWithUserInteraction.length === parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching feed post comments:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch feed post comments'
    });
  }
};

/**
 * Add a comment to a feed post
 * @route POST /api/feed/:id/comments
 * @access Private
 */
exports.addFeedPostComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    
    if (!content || content.trim() === '') {
      return res.status(400).json({
        status: 'error',
        message: 'Comment content is required'
      });
    }
    
    // Check if post exists
    const post = await req.prisma.feedPost.findUnique({
      where: { id }
    });
    
    if (!post) {
      return res.status(404).json({
        status: 'error',
        message: 'Post not found'
      });
    }
    
    // Create comment
    const comment = await req.prisma.comment.create({
      data: {
        id: uuidv4(),
        content,
        postId: id,
        userId: req.user.id,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
            isVerified: true
          }
        }
      }
    });
    
    res.status(201).json({
      status: 'success',
      data: {
        ...comment,
        likes: 0,
        isLiked: false
      }
    });
  } catch (error) {
    console.error('Error adding comment to feed post:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to add comment to feed post'
    });
  }
};

/**
 * Like a comment
 * @route POST /api/feed/comments/:id/like
 * @access Private
 */
exports.likeComment = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if comment exists
    const comment = await req.prisma.comment.findUnique({
      where: { id }
    });
    
    if (!comment) {
      return res.status(404).json({
        status: 'error',
        message: 'Comment not found'
      });
    }
    
    // Check if user has already liked the comment
    const existingLike = await req.prisma.commentLike.findFirst({
      where: {
        commentId: id,
        userId: req.user.id
      }
    });
    
    if (existingLike) {
      // Unlike the comment
      await req.prisma.commentLike.delete({
        where: {
          id: existingLike.id
        }
      });
      
      res.json({
        status: 'success',
        message: 'Comment unliked successfully',
        isLiked: false
      });
    } else {
      // Like the comment
      await req.prisma.commentLike.create({
        data: {
          id: uuidv4(),
          commentId: id,
          userId: req.user.id,
          createdAt: new Date()
        }
      });
      
      res.json({
        status: 'success',
        message: 'Comment liked successfully',
        isLiked: true
      });
    }
  } catch (error) {
    console.error('Error liking comment:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to like comment'
    });
  }
};

/**
 * Get saved posts for the current user
 * @route GET /api/feed/saved
 * @access Private
 */
exports.getSavedPosts = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * parseInt(limit);
    
    // Get saved posts with pagination
    const savedPosts = await req.prisma.savedPost.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      skip,
      take: parseInt(limit),
      include: {
        post: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatar: true,
                isVerified: true
              }
            },
            audioFile: true,
            tags: true,
            _count: {
              select: {
                likes: true,
                comments: true,
                shares: true
              }
            }
          }
        }
      }
    });
    
    // Format the response
    const formattedPosts = savedPosts.map(savedPost => {
      const post = savedPost.post;
      return {
        ...post,
        tags: post.tags.map(t => t.tag),
        likes: post._count.likes,
        comments: post._count.comments,
        shares: post._count.shares,
        isLiked: false, // We'll check this below
        isSaved: true // Since these are saved posts
      };
    });
    
    // Check if user has liked each post
    const postsWithLikeStatus = await Promise.all(
      formattedPosts.map(async (post) => {
        const isLiked = await req.prisma.like.findFirst({
          where: { feedPostId: post.id, userId: req.user.id }
        });
        
        return {
          ...post,
          isLiked: !!isLiked
        };
      })
    );
    
    res.json({
      status: 'success',
      data: postsWithLikeStatus,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        hasMore: savedPosts.length === parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching saved posts:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch saved posts'
    });
  }
};