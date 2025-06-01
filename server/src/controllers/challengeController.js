const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Get all challenges with filtering, pagination, and search
exports.getChallenges = async (req, res) => {
  try {
    const { filter = 'all', page = 1, limit = 10, search = '' } = req.query;
    const pageNumber = parseInt(page);
    const limitNumber = parseInt(limit);
    const skip = (pageNumber - 1) * limitNumber;

    // Build filter conditions
    const where = {};
    
    // Add search filter if provided
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } }
      ];
    }

    // Add date filters
    const now = new Date();
    if (filter === 'trending') {
      // For trending, we'll use challenges with most participants in the last week
      where.startDate = { lte: now };
      where.endDate = { gte: now };
    } else if (filter === 'featured') {
      // For featured, we could have an admin-selected flag, but for now use reward as proxy
      where.reward = { not: null };
    } else if (filter === 'newest') {
      // For newest, sort by creation date
      // No additional where clause needed
    } else if (filter === 'ending-soon') {
      // For ending soon, get challenges ending in the next 7 days
      const nextWeek = new Date(now);
      nextWeek.setDate(now.getDate() + 7);
      where.endDate = {
        gte: now,
        lte: nextWeek
      };
    }

    // Get total count for pagination
    const totalCount = await prisma.challenge.count({ where });

    // Get challenges with creator info
    let challenges = await prisma.challenge.findMany({
      where,
      skip,
      take: limitNumber,
      orderBy: filter === 'newest' 
        ? { createdAt: 'desc' } 
        : filter === 'ending-soon' 
          ? { endDate: 'asc' } 
          : { createdAt: 'desc' },
      include: {
        creator: {
          select: {
            id: true,
            displayName: true,
            username: true,
            avatar: true,
            isVerified: true
          }
        },
        participants: {
          select: {
            userId: true
          }
        },
        challengeTags: {
          include: {
            tag: true
          }
        }
      }
    });

    // Transform data to match frontend expectations
    challenges = challenges.map(challenge => {
      // Check if current user has joined this challenge
      const isJoined = req.user ? challenge.participants.some(p => p.userId === req.user.id) : false;
      
      // Extract tags from challengeTags relation
      const tags = challenge.challengeTags.map(ct => ct.tag.name);
      
      // Format the challenge object
      return {
        id: challenge.id,
        title: challenge.title,
        description: challenge.description,
        creatorId: challenge.creatorId,
        creator: challenge.creator,
        participants: challenge.participants.length,
        submissions: challenge.participants.filter(p => p.submissionAudioId).length,
        reward: challenge.reward,
        startDate: challenge.startDate.toISOString(),
        endDate: challenge.endDate.toISOString(),
        difficulty: challenge.difficulty.toLowerCase(),
        tags,
        isJoined,
        // Add trending and featured flags based on criteria
        trending: challenge.participants.length > 10, // Example criteria
        featured: challenge.reward !== null
      };
    });

    // Return challenges with pagination info
    res.json({
      challenges,
      pagination: {
        total: totalCount,
        page: pageNumber,
        limit: limitNumber,
        pages: Math.ceil(totalCount / limitNumber)
      },
      hasMore: skip + challenges.length < totalCount
    });
  } catch (error) {
    console.error('Error getting challenges:', error);
    res.status(500).json({ status: 'error', message: 'Failed to get challenges' });
  }
};

// Get a single challenge by ID
exports.getChallenge = async (req, res) => {
  try {
    const { id } = req.params;
    
    const challenge = await prisma.challenge.findUnique({
      where: { id },
      include: {
        creator: {
          select: {
            id: true,
            displayName: true,
            username: true,
            avatar: true,
            isVerified: true
          }
        },
        participants: {
          include: {
            user: {
              select: {
                id: true,
                displayName: true,
                username: true,
                avatar: true,
                isVerified: true
              }
            }
          }
        },
        challengeTags: {
          include: {
            tag: true
          }
        }
      }
    });
    
    if (!challenge) {
      return res.status(404).json({ status: 'error', message: 'Challenge not found' });
    }
    
    // Check if current user has joined this challenge
    const isJoined = req.user 
      ? challenge.participants.some(p => p.userId === req.user.id) 
      : false;
    
    // Extract tags from challengeTags relation
    const tags = challenge.challengeTags.map(ct => ct.tag.name);
    
    // Format submissions
    const submissions = challenge.participants
      .filter(p => p.submissionAudioId)
      .map(p => ({
        id: p.id,
        userId: p.userId,
        user: p.user,
        audioUrl: `/api/audio/${p.submissionAudioId}`,
        submissionDate: p.submissionDate,
        votes: 0 // Would need a separate votes table to track this
      }));
    
    // Return formatted challenge
    res.json({
      status: 'success',
      challenge: {
        id: challenge.id,
        title: challenge.title,
        description: challenge.description,
        creatorId: challenge.creatorId,
        creator: challenge.creator,
        participants: challenge.participants.length,
        submissions: submissions.length,
        reward: challenge.reward,
        startDate: challenge.startDate.toISOString(),
        endDate: challenge.endDate.toISOString(),
        difficulty: challenge.difficulty.toLowerCase(),
        tags,
        isJoined,
        submissions
      }
    });
  } catch (error) {
    console.error('Error getting challenge:', error);
    res.status(500).json({ status: 'error', message: 'Failed to get challenge' });
  }
};

// Create a new challenge
exports.createChallenge = async (req, res) => {
  try {
    // Ensure user is authenticated
    if (!req.user) {
      return res.status(401).json({ status: 'error', message: 'Authentication required' });
    }
    
    const { 
      title, 
      description, 
      audioPrompt, 
      reward, 
      endDate, 
      tags, 
      difficulty,
      requirements 
    } = req.body;
    
    // Validate required fields
    if (!title || !description || !endDate || !difficulty) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'Title, description, end date, and difficulty are required' 
      });
    }
    
    // Convert difficulty to enum format
    const difficultyEnum = difficulty.toUpperCase();
    if (!['EASY', 'MEDIUM', 'HARD'].includes(difficultyEnum)) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'Difficulty must be one of: easy, medium, hard' 
      });
    }
    
    // Create challenge with transaction to handle tags
    const challenge = await prisma.$transaction(async (tx) => {
      // Create the challenge
      const newChallenge = await tx.challenge.create({
        data: {
          title,
          description,
          audioPromptId: audioPrompt,
          reward,
          startDate: new Date(),
          endDate: new Date(endDate),
          difficulty: difficultyEnum,
          creatorId: req.user.id
        }
      });
      
      // Process tags if provided
      if (tags && tags.length > 0) {
        // Create or connect tags
        for (const tagName of tags) {
          // Find or create tag
          let tag = await tx.tag.findUnique({
            where: { name: tagName }
          });
          
          if (!tag) {
            tag = await tx.tag.create({
              data: { name: tagName }
            });
          }
          
          // Create challenge-tag relationship
          await tx.challengeTag.create({
            data: {
              challengeId: newChallenge.id,
              tagId: tag.id
            }
          });
        }
      }
      
      // Return the created challenge with related data
      return tx.challenge.findUnique({
        where: { id: newChallenge.id },
        include: {
          creator: {
            select: {
              id: true,
              displayName: true,
              username: true,
              avatar: true,
              isVerified: true
            }
          },
          challengeTags: {
            include: {
              tag: true
            }
          }
        }
      });
    });
    
    // Format the response
    const formattedChallenge = {
      id: challenge.id,
      title: challenge.title,
      description: challenge.description,
      creatorId: challenge.creatorId,
      creator: challenge.creator,
      participants: 0,
      submissions: 0,
      reward: challenge.reward,
      startDate: challenge.startDate.toISOString(),
      endDate: challenge.endDate.toISOString(),
      difficulty: challenge.difficulty.toLowerCase(),
      tags: challenge.challengeTags.map(ct => ct.tag.name),
      isJoined: true, // Creator automatically joins
      trending: false,
      featured: !!challenge.reward
    };
    
    // Return the created challenge
    res.status(201).json({
      status: 'success',
      challenge: formattedChallenge
    });
  } catch (error) {
    console.error('Error creating challenge:', error);
    res.status(500).json({ status: 'error', message: 'Failed to create challenge' });
  }
};

// Join a challenge
exports.joinChallenge = async (req, res) => {
  try {
    // Ensure user is authenticated
    if (!req.user) {
      return res.status(401).json({ status: 'error', message: 'Authentication required' });
    }
    
    const { id } = req.params;
    const { 
      name, 
      email, 
      motivation, 
      experience, 
      socialMediaHandle, 
      agreeToTerms 
    } = req.body;
    
    // Check if challenge exists
    const challenge = await prisma.challenge.findUnique({
      where: { id }
    });
    
    if (!challenge) {
      return res.status(404).json({ status: 'error', message: 'Challenge not found' });
    }
    
    // Check if user has already joined
    const existingParticipation = await prisma.challengeParticipation.findUnique({
      where: {
        challengeId_userId: {
          challengeId: id,
          userId: req.user.id
        }
      }
    });
    
    if (existingParticipation) {
      return res.status(400).json({ status: 'error', message: 'You have already joined this challenge' });
    }
    
    // Validate required fields
    if (!name || !email || !agreeToTerms) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'Name, email, and agreement to terms are required' 
      });
    }
    
    // Join the challenge with participant information
    await prisma.challengeParticipation.create({
      data: {
        challengeId: id,
        userId: req.user.id,
        name,
        email,
        motivation,
        experience,
        socialMediaHandle,
        agreeToTerms
      }
    });
    
    res.json({
      status: 'success',
      message: 'Successfully joined the challenge'
    });
  } catch (error) {
    console.error('Error joining challenge:', error);
    res.status(500).json({ status: 'error', message: 'Failed to join challenge' });
  }
};

// Submit to a challenge
exports.submitToChallenge = async (req, res) => {
  try {
    // Ensure user is authenticated
    if (!req.user) {
      return res.status(401).json({ status: 'error', message: 'Authentication required' });
    }
    
    const { id } = req.params;
    const { audioFileId, description } = req.body;
    
    // Validate required fields
    if (!audioFileId) {
      return res.status(400).json({ status: 'error', message: 'Audio file ID is required' });
    }
    
    // Check if challenge exists
    const challenge = await prisma.challenge.findUnique({
      where: { id }
    });
    
    if (!challenge) {
      return res.status(404).json({ status: 'error', message: 'Challenge not found' });
    }
    
    // Check if user has joined the challenge
    const participation = await prisma.challengeParticipation.findUnique({
      where: {
        challengeId_userId: {
          challengeId: id,
          userId: req.user.id
        }
      }
    });
    
    if (!participation) {
      return res.status(400).json({ status: 'error', message: 'You must join the challenge before submitting' });
    }
    
    // Check if user has already submitted
    if (participation.submissionAudioId) {
      return res.status(400).json({ status: 'error', message: 'You have already submitted to this challenge' });
    }
    
    // Update participation with submission
    await prisma.challengeParticipation.update({
      where: {
        id: participation.id
      },
      data: {
        submissionAudioId: audioFileId,
        submissionDate: new Date()
      }
    });
    
    res.json({
      status: 'success',
      message: 'Successfully submitted to the challenge'
    });
  } catch (error) {
    console.error('Error submitting to challenge:', error);
    res.status(500).json({ status: 'error', message: 'Failed to submit to challenge' });
  }
};

// Get challenge submissions
exports.getChallengeSubmissions = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const pageNumber = parseInt(page);
    const limitNumber = parseInt(limit);
    const skip = (pageNumber - 1) * limitNumber;
    
    // Check if challenge exists
    const challenge = await prisma.challenge.findUnique({
      where: { id }
    });
    
    if (!challenge) {
      return res.status(404).json({ status: 'error', message: 'Challenge not found' });
    }
    
    // Get submissions with pagination
    const submissions = await prisma.challengeParticipation.findMany({
      where: {
        challengeId: id,
        submissionAudioId: { not: null }
      },
      skip,
      take: limitNumber,
      orderBy: { submissionDate: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            displayName: true,
            username: true,
            avatar: true,
            isVerified: true
          }
        }
      }
    });
    
    // Get total count for pagination
    const totalCount = await prisma.challengeParticipation.count({
      where: {
        challengeId: id,
        submissionAudioId: { not: null }
      }
    });
    
    // Format submissions
    const formattedSubmissions = submissions.map(submission => ({
      id: submission.id,
      userId: submission.userId,
      user: submission.user,
      audioUrl: `/api/audio/${submission.submissionAudioId}`,
      submissionDate: submission.submissionDate.toISOString(),
      votes: 0, // Would need a separate votes table to track this
      hasVoted: false // Would need to check if current user has voted
    }));
    
    res.json({
      status: 'success',
      submissions: formattedSubmissions,
      pagination: {
        total: totalCount,
        page: pageNumber,
        limit: limitNumber,
        pages: Math.ceil(totalCount / limitNumber)
      },
      hasMore: skip + submissions.length < totalCount
    });
  } catch (error) {
    console.error('Error getting challenge submissions:', error);
    res.status(500).json({ status: 'error', message: 'Failed to get challenge submissions' });
  }
};

// Get user's challenges
exports.getUserChallenges = async (req, res) => {
  try {
    // Ensure user is authenticated
    if (!req.user) {
      return res.status(401).json({ status: 'error', message: 'Authentication required' });
    }
    
    const { status = 'joined' } = req.query;
    
    let challenges;
    
    if (status === 'created') {
      // Get challenges created by the user
      challenges = await prisma.challenge.findMany({
        where: {
          creatorId: req.user.id
        },
        include: {
          creator: {
            select: {
              id: true,
              displayName: true,
              username: true,
              avatar: true,
              isVerified: true
            }
          },
          participants: true,
          challengeTags: {
            include: {
              tag: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
    } else if (status === 'joined' || status === 'completed') {
      // Get challenges joined by the user
      const participations = await prisma.challengeParticipation.findMany({
        where: {
          userId: req.user.id,
          ...(status === 'completed' ? { submissionAudioId: { not: null } } : {})
        },
        include: {
          challenge: {
            include: {
              creator: {
                select: {
                  id: true,
                  displayName: true,
                  username: true,
                  avatar: true,
                  isVerified: true
                }
              },
              participants: true,
              challengeTags: {
                include: {
                  tag: true
                }
              }
            }
          }
        }
      });
      
      challenges = participations.map(p => p.challenge);
    } else {
      return res.status(400).json({ status: 'error', message: 'Invalid status parameter' });
    }
    
    // Format challenges
    const formattedChallenges = challenges.map(challenge => ({
      id: challenge.id,
      title: challenge.title,
      description: challenge.description,
      creatorId: challenge.creatorId,
      creator: challenge.creator,
      participants: challenge.participants.length,
      submissions: challenge.participants.filter(p => p.submissionAudioId).length,
      reward: challenge.reward,
      startDate: challenge.startDate.toISOString(),
      endDate: challenge.endDate.toISOString(),
      difficulty: challenge.difficulty.toLowerCase(),
      tags: challenge.challengeTags.map(ct => ct.tag.name),
      isJoined: true, // Since these are all challenges the user has joined
      trending: challenge.participants.length > 10, // Example criteria
      featured: !!challenge.reward
    }));
    
    res.json({
      status: 'success',
      challenges: formattedChallenges
    });
  } catch (error) {
    console.error('Error getting user challenges:', error);
    res.status(500).json({ status: 'error', message: 'Failed to get user challenges' });
  }
};