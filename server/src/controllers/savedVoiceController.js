const { validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');

/**
 * Save a voice creation
 * @route POST /api/voice/saved
 * @access Private
 */
exports.saveVoiceCreation = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ status: 'error', errors: errors.array() });
  }

  const { 
    name, 
    description, 
    originalAudioId, 
    transformedAudioId, 
    effectId, 
    effectName, 
    effectCategory, 
    settings, 
    isPublic, 
    tags 
  } = req.body;

  try {
    // Check if we're using the development user
    const isDevelopmentUser = req.user.id === 'dev-user-id';
    let userId = req.user.id;

    if (isDevelopmentUser) {
      // For development user, try to find a real user ID from the database
      try {
        const firstUser = await req.prisma.user.findFirst();
        if (firstUser) {
          userId = firstUser.id;
          console.log(`Using first user's ID (${userId}) for development user`);
        } else {
          throw new Error('No users found in database');
        }
      } catch (error) {
        console.error('Error finding a valid user ID:', error);
        return res.status(500).json({
          status: 'error',
          message: 'Cannot save voice creation in development mode: No valid user ID found'
        });
      }
    }

    // Verify that the audio files exist and belong to the user
    const originalAudio = await req.prisma.audioFile.findUnique({
      where: { id: originalAudioId }
    });

    if (!originalAudio) {
      return res.status(404).json({
        status: 'error',
        message: 'Original audio file not found'
      });
    }

    // Check if user owns the original audio file (skip this check in development mode)
    if (!isDevelopmentUser && originalAudio.userId !== req.user.id) {
      return res.status(403).json({
        status: 'error',
        message: 'You do not have permission to use this audio file'
      });
    }

    // If transformedAudioId is provided, verify it exists
    let transformedAudio = null;
    if (transformedAudioId) {
      transformedAudio = await req.prisma.audioFile.findUnique({
        where: { id: transformedAudioId }
      });

      if (!transformedAudio) {
        return res.status(404).json({
          status: 'error',
          message: 'Transformed audio file not found'
        });
      }
    }

    // Create the saved voice creation
    const savedVoiceCreation = await req.prisma.savedVoiceCreation.create({
      data: {
        userId: userId,
        name,
        description,
        originalAudioId,
        transformedAudioId,
        effectId,
        effectName,
        effectCategory,
        settings: settings ? JSON.stringify(settings) : null,
        isPublic: isPublic || false,
        tags: tags ? JSON.stringify(tags) : null,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      include: {
        originalAudio: true,
        transformedAudio: true,
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true
          }
        }
      }
    });

    res.status(201).json({
      status: 'success',
      data: savedVoiceCreation
    });
  } catch (error) {
    console.error('Error saving voice creation:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to save voice creation: ' + error.message
    });
  }
};

/**
 * Get user's saved voice creations
 * @route GET /api/voice/saved
 * @access Private
 */
exports.getSavedVoiceCreations = async (req, res) => {
  try {
    const { page = 1, limit = 10, category, search } = req.query;
    const skip = (page - 1) * limit;

    // Check if we're using the development user
    const isDevelopmentUser = req.user.id === 'dev-user-id';
    let userId = req.user.id;

    if (isDevelopmentUser) {
      // For development user, get all saved voice creations or a limited set
      const whereClause = {};
      
      if (category && category !== 'all') {
        whereClause.effectCategory = category;
      }
      
      if (search) {
        whereClause.OR = [
          { name: { contains: search } },
          { description: { contains: search } },
          { effectName: { contains: search } }
        ];
      }

      const savedVoiceCreations = await req.prisma.savedVoiceCreation.findMany({
        where: whereClause,
        include: {
          originalAudio: true,
          transformedAudio: true,
          user: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatar: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip: parseInt(skip),
        take: parseInt(limit)
      });

      const total = await req.prisma.savedVoiceCreation.count({
        where: whereClause
      });

      return res.json({
        status: 'success',
        data: {
          savedVoiceCreations,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit)
          }
        }
      });
    }

    // For regular users, get only their saved voice creations
    const whereClause = { userId: req.user.id };
    
    if (category && category !== 'all') {
      whereClause.effectCategory = category;
    }
    
    if (search) {
      whereClause.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
        { effectName: { contains: search } }
      ];
    }

    const savedVoiceCreations = await req.prisma.savedVoiceCreation.findMany({
      where: whereClause,
      include: {
        originalAudio: true,
        transformedAudio: true,
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip: parseInt(skip),
      take: parseInt(limit)
    });

    const total = await req.prisma.savedVoiceCreation.count({
      where: whereClause
    });

    res.json({
      status: 'success',
      data: {
        savedVoiceCreations,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching saved voice creations:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch saved voice creations'
    });
  }
};

/**
 * Get a specific saved voice creation
 * @route GET /api/voice/saved/:id
 * @access Private
 */
exports.getSavedVoiceCreation = async (req, res) => {
  const { id } = req.params;

  try {
    const savedVoiceCreation = await req.prisma.savedVoiceCreation.findUnique({
      where: { id },
      include: {
        originalAudio: true,
        transformedAudio: true,
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true
          }
        }
      }
    });

    if (!savedVoiceCreation) {
      return res.status(404).json({
        status: 'error',
        message: 'Saved voice creation not found'
      });
    }

    // Check if we're using the development user
    const isDevelopmentUser = req.user.id === 'dev-user-id';
    
    // Check if user owns the saved voice creation (skip this check in development mode)
    if (!isDevelopmentUser && savedVoiceCreation.userId !== req.user.id && !savedVoiceCreation.isPublic) {
      return res.status(403).json({
        status: 'error',
        message: 'You do not have permission to view this saved voice creation'
      });
    }

    res.json({
      status: 'success',
      data: savedVoiceCreation
    });
  } catch (error) {
    console.error('Error fetching saved voice creation:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch saved voice creation'
    });
  }
};

/**
 * Update a saved voice creation
 * @route PUT /api/voice/saved/:id
 * @access Private
 */
exports.updateSavedVoiceCreation = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ status: 'error', errors: errors.array() });
  }

  const { id } = req.params;
  const { name, description, isPublic, tags } = req.body;

  try {
    // Check if the saved voice creation exists
    const existingSavedVoiceCreation = await req.prisma.savedVoiceCreation.findUnique({
      where: { id }
    });

    if (!existingSavedVoiceCreation) {
      return res.status(404).json({
        status: 'error',
        message: 'Saved voice creation not found'
      });
    }

    // Check if we're using the development user
    const isDevelopmentUser = req.user.id === 'dev-user-id';
    
    // Check if user owns the saved voice creation (skip this check in development mode)
    if (!isDevelopmentUser && existingSavedVoiceCreation.userId !== req.user.id) {
      return res.status(403).json({
        status: 'error',
        message: 'You do not have permission to update this saved voice creation'
      });
    }

    // Update the saved voice creation
    const updatedSavedVoiceCreation = await req.prisma.savedVoiceCreation.update({
      where: { id },
      data: {
        name: name || existingSavedVoiceCreation.name,
        description: description !== undefined ? description : existingSavedVoiceCreation.description,
        isPublic: isPublic !== undefined ? isPublic : existingSavedVoiceCreation.isPublic,
        tags: tags ? JSON.stringify(tags) : existingSavedVoiceCreation.tags,
        updatedAt: new Date()
      },
      include: {
        originalAudio: true,
        transformedAudio: true,
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true
          }
        }
      }
    });

    res.json({
      status: 'success',
      data: updatedSavedVoiceCreation
    });
  } catch (error) {
    console.error('Error updating saved voice creation:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update saved voice creation'
    });
  }
};

/**
 * Delete a saved voice creation
 * @route DELETE /api/voice/saved/:id
 * @access Private
 */
exports.deleteSavedVoiceCreation = async (req, res) => {
  const { id } = req.params;

  try {
    // Check if the saved voice creation exists
    const existingSavedVoiceCreation = await req.prisma.savedVoiceCreation.findUnique({
      where: { id }
    });

    if (!existingSavedVoiceCreation) {
      return res.status(404).json({
        status: 'error',
        message: 'Saved voice creation not found'
      });
    }

    // Check if we're using the development user
    const isDevelopmentUser = req.user.id === 'dev-user-id';
    
    // Check if user owns the saved voice creation (skip this check in development mode)
    if (!isDevelopmentUser && existingSavedVoiceCreation.userId !== req.user.id) {
      return res.status(403).json({
        status: 'error',
        message: 'You do not have permission to delete this saved voice creation'
      });
    }

    // Delete the saved voice creation
    await req.prisma.savedVoiceCreation.delete({
      where: { id }
    });

    res.json({
      status: 'success',
      message: 'Saved voice creation deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting saved voice creation:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete saved voice creation'
    });
  }
};

/**
 * Get public saved voice creations (for discovery)
 * @route GET /api/voice/saved/public
 * @access Public
 */
exports.getPublicSavedVoiceCreations = async (req, res) => {
  try {
    const { page = 1, limit = 10, category, search } = req.query;
    const skip = (page - 1) * limit;

    const whereClause = { isPublic: true };
    
    if (category && category !== 'all') {
      whereClause.effectCategory = category;
    }
    
    if (search) {
      whereClause.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
        { effectName: { contains: search } }
      ];
    }

    const savedVoiceCreations = await req.prisma.savedVoiceCreation.findMany({
      where: whereClause,
      include: {
        originalAudio: true,
        transformedAudio: true,
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip: parseInt(skip),
      take: parseInt(limit)
    });

    const total = await req.prisma.savedVoiceCreation.count({
      where: whereClause
    });

    res.json({
      status: 'success',
      data: {
        savedVoiceCreations,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching public saved voice creations:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch public saved voice creations'
    });
  }
};