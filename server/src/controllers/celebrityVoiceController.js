/**
 * Get celebrity voices with their actual ElevenLabs IDs
 * @route GET /api/voice/celebrity/voices
 * @access Public
 */
exports.getCelebrityVoices = async (req, res) => {
  try {
    // Real celebrity voice IDs from ElevenLabs
    const celebrityVoices = {
      // Popular celebrity voices available on ElevenLabs
      'aria': { id: 'TxGEqnHWrfWFTfGW9XjX', name: 'Aria', gender: 'female', description: 'Warm and expressive female voice' },
      'rachel': { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Rachel', gender: 'female', description: 'Clear and professional female voice' },
      'domi': { id: 'AZnzlk1XvdvUeBnXmlld', name: 'Domi', gender: 'female', description: 'Confident and strong female voice' },
      'bella': { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Bella', gender: 'female', description: 'Elegant and sophisticated female voice' },
      'antoni': { id: 'ErXwobaYiN019PkySvjV', name: 'Antoni', gender: 'male', description: 'Warm and friendly male voice' },
      'elli': { id: 'MF3mGyEYCl7XYWbV9V6O', name: 'Elli', gender: 'female', description: 'Young and energetic female voice' },
      'josh': { id: 'TxGEqnHWrfWFTfGW9XjX', name: 'Josh', gender: 'male', description: 'Casual and approachable male voice' },
      'arnold': { id: 'VR6AewLTigWG4xSOukaG', name: 'Arnold', gender: 'male', description: 'Deep and authoritative male voice' },
      'adam': { id: 'pNInz6obpgDQGcFmaJgB', name: 'Adam', gender: 'male', description: 'Natural and conversational male voice' },
      'sam': { id: 'yoZ06aMxZJJ28mfd3POQ', name: 'Sam', gender: 'male', description: 'Smooth and professional male voice' },
      'nicole': { id: 'piTKgcLEGmPE4e6mEKli', name: 'Nicole', gender: 'female', description: 'Soft and gentle female voice' },
      'freya': { id: 'jsCqWAovK2LkecY7zXl4', name: 'Freya', gender: 'female', description: 'Dynamic and expressive female voice' },
      'fin': { id: 'D38z5RcWu1voky8WS1ja', name: 'Fin', gender: 'male', description: 'Youthful and energetic male voice' },
      'sarah': { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Sarah', gender: 'female', description: 'Professional and clear female voice' },
      'charlie': { id: 'IKne3meq5aSn9XLyUdCD', name: 'Charlie', gender: 'male', description: 'Friendly and approachable male voice' },
      'george': { id: 'JBFqnCBsd6RMkjVDRZzb', name: 'George', gender: 'male', description: 'Mature and distinguished male voice' },
      'callum': { id: 'N2lVS1w4EtoT3dr4eOWO', name: 'Callum', gender: 'male', description: 'British accent male voice' },
      'liam': { id: 'TX3LPaxmHKxFdv7VOQHJ', name: 'Liam', gender: 'male', description: 'Strong and confident male voice' },
      'charlotte': { id: 'XB0fDUnXU5powFXDhCwa', name: 'Charlotte', gender: 'female', description: 'Elegant British female voice' },
      'matilda': { id: 'XrExE9yKIg1WjnnlVkGX', name: 'Matilda', gender: 'female', description: 'Young and cheerful female voice' },
      'james': { id: 'ZQe5CZNOzWyzPSCn5a3c', name: 'James', gender: 'male', description: 'Calm and authoritative male voice' },
      'lily': { id: 'pFZP5JQG7iQjIQuC4Bku', name: 'Lily', gender: 'female', description: 'Sweet and melodic female voice' },
      'bill': { id: 'pqHfZKP75CvOlQylNhV4', name: 'Bill', gender: 'male', description: 'Experienced and wise male voice' },
      'brian': { id: 'nPczCjzI2devNBz1zQrb', name: 'Brian', gender: 'male', description: 'Narrator-style male voice' },
      'daniel': { id: 'onwK4e9ZLuTAKqWW03F9', name: 'Daniel', gender: 'male', description: 'Deep and resonant male voice' },
      'eric': { id: 'cjVigY5qzO86Huf0OWal', name: 'Eric', gender: 'male', description: 'Versatile and expressive male voice' },
      'chris': { id: 'iP95p4xoKVk53GoZ742B', name: 'Chris', gender: 'male', description: 'Casual and relatable male voice' },
      'michael': { id: 'flq6f7yk4E4fJM5XTYuZ', name: 'Michael', gender: 'male', description: 'Professional and polished male voice' },
      'ethan': { id: 'g5CIjZEefAph4nQFvHAz', name: 'Ethan', gender: 'male', description: 'Young and dynamic male voice' },
      'gigi': { id: 'jBpfuIE2acCO8z3wKNLl', name: 'Gigi', gender: 'female', description: 'Playful and bubbly female voice' },
      'grace': { id: 'oWAxZDx7w5VEj9dCyTzz', name: 'Grace', gender: 'female', description: 'Graceful and refined female voice' },
      'dorothy': { id: 'ThT5KcBeYPX3keUQqHPh', name: 'Dorothy', gender: 'female', description: 'Classic and timeless female voice' },
      'glinda': { id: 'z9fAnlkpzviPz146aGWa', name: 'Glinda', gender: 'female', description: 'Magical and enchanting female voice' }
    };

    res.json({
      status: 'success',
      data: celebrityVoices
    });
  } catch (error) {
    console.error('Error fetching celebrity voices:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch celebrity voices'
    });
  }
};