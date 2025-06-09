const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Voice effects to seed
const voiceEffects = [
  // Emotion effects
  {
    effectId: 'happy',
    name: 'Happy Voice',
    category: 'emotion',
    description: 'Cheerful and upbeat voice that conveys joy and excitement',
    popularity: 85,
    isProOnly: false,
    elevenLabsVoiceId: 'EXAVITQu4vr4xnSDxMaL', // Bella - cheerful female voice
    settings: JSON.stringify({
      stability: 0.3,
      similarity_boost: 0.8,
      style: 0.7,
      use_speaker_boost: true
    })
  },
  {
    effectId: 'sad',
    name: 'Sad Voice',
    category: 'emotion',
    description: 'Melancholic and somber voice that conveys sadness and emotion',
    popularity: 78,
    isProOnly: false,
    elevenLabsVoiceId: 'TxGEqnHWrfWFTfGW9XjX', // Josh - can be modulated for sadness
    settings: JSON.stringify({
      stability: 0.7,
      similarity_boost: 0.6,
      style: 0.2,
      use_speaker_boost: false
    })
  },
  {
    effectId: 'angry',
    name: 'Angry Voice',
    category: 'emotion',
    description: 'Intense and forceful voice that conveys anger and frustration',
    popularity: 80,
    isProOnly: false,
    elevenLabsVoiceId: 'pNInz6obpgDQGcFmaJgB', // Adam - strong male voice for anger
    settings: JSON.stringify({
      stability: 0.4,
      similarity_boost: 0.9,
      style: 0.8,
      use_speaker_boost: true
    })
  },
  {
    effectId: 'calm',
    name: 'Calm Voice',
    category: 'emotion',
    description: 'Peaceful and soothing voice that conveys tranquility and relaxation',
    popularity: 82,
    isProOnly: false,
    elevenLabsVoiceId: 'ZQe5CZNOzWyzPSCn5a3c', // James - calm and soothing
    settings: JSON.stringify({
      stability: 0.8,
      similarity_boost: 0.5,
      style: 0.1,
      use_speaker_boost: false
    })
  },
  {
    effectId: 'excited',
    name: 'Excited Voice',
    category: 'emotion',
    description: 'Energetic and enthusiastic voice that conveys excitement and passion',
    popularity: 83,
    isProOnly: false,
    elevenLabsVoiceId: 'AZnzlk1XvdvUeBnXmlld', // Domi - energetic female voice
    settings: JSON.stringify({
      stability: 0.2,
      similarity_boost: 0.9,
      style: 0.9,
      use_speaker_boost: true
    })
  },
  
  // Celebrity effects
  {
    effectId: 'celebrity_voice',
    name: 'Celebrity Voice',
    category: 'celebrity',
    description: 'Transform your voice to sound like a celebrity using ElevenLabs voices',
    popularity: 100,
    isProOnly: false,
    elevenLabsVoiceId: 'TxGEqnHWrfWFTfGW9XjX', // Default celebrity voice
    settings: JSON.stringify({
      stability: 0.5,
      similarity_boost: 0.75,
      style: 0.5,
      use_speaker_boost: true
    })
  },
  
  // Language accent effects
  {
    effectId: 'french',
    name: 'French Accent',
    category: 'language',
    description: 'Add a charming French accent to your voice',
    popularity: 92,
    isProOnly: false,
    elevenLabsVoiceId: 'EXAVITQu4vr4xnSDxMaL',
    settings: JSON.stringify({
      stability: 0.6,
      similarity_boost: 0.7,
      style: 0.4,
      use_speaker_boost: false
    })
  },
  {
    effectId: 'british',
    name: 'British Accent',
    category: 'language',
    description: 'Add a sophisticated British accent to your voice',
    popularity: 91,
    isProOnly: false,
    elevenLabsVoiceId: 'ZQe5CZNOzWyzPSCn5a3c',
    settings: JSON.stringify({
      stability: 0.7,
      similarity_boost: 0.6,
      style: 0.3,
      use_speaker_boost: false
    })
  },
  {
    effectId: 'spanish',
    name: 'Spanish Accent',
    category: 'language',
    description: 'Add a warm Spanish accent to your voice',
    popularity: 90,
    isProOnly: false,
    elevenLabsVoiceId: 'pNInz6obpgDQGcFmaJgB',
    settings: JSON.stringify({
      stability: 0.5,
      similarity_boost: 0.8,
      style: 0.5,
      use_speaker_boost: true
    })
  },
  {
    effectId: 'german',
    name: 'German Accent',
    category: 'language',
    description: 'Add a strong German accent to your voice',
    popularity: 88,
    isProOnly: false,
    elevenLabsVoiceId: 'TxGEqnHWrfWFTfGW9XjX',
    settings: JSON.stringify({
      stability: 0.6,
      similarity_boost: 0.7,
      style: 0.4,
      use_speaker_boost: false
    })
  },
  {
    effectId: 'australian',
    name: 'Australian Accent',
    category: 'language',
    description: 'Add a friendly Australian accent to your voice',
    popularity: 87,
    isProOnly: false,
    elevenLabsVoiceId: 'AZnzlk1XvdvUeBnXmlld',
    settings: JSON.stringify({
      stability: 0.5,
      similarity_boost: 0.8,
      style: 0.6,
      use_speaker_boost: true
    })
  }
];

async function seedVoiceEffects() {
  console.log('Starting to seed voice effects...');
  
  try {
    // Create or update voice effects
    for (const effect of voiceEffects) {
      try {
        // Try to find existing effect
        const existingEffect = await prisma.voiceEffect.findUnique({
          where: { effectId: effect.effectId }
        });
        
        if (existingEffect) {
          // Update existing effect
          const updatedEffect = await prisma.voiceEffect.update({
            where: { effectId: effect.effectId },
            data: {
              ...effect,
              updatedAt: new Date()
            }
          });
          console.log(`Updated voice effect: ${updatedEffect.name} (${updatedEffect.effectId})`);
        } else {
          // Create new effect
          const createdEffect = await prisma.voiceEffect.create({
            data: {
              ...effect,
              createdAt: new Date(),
              updatedAt: new Date()
            }
          });
          console.log(`Created voice effect: ${createdEffect.name} (${createdEffect.effectId})`);
        }
      } catch (error) {
        console.error(`Error processing voice effect ${effect.effectId}:`, error);
      }
    }
    
    console.log('Voice effects seeding completed successfully!');
    
    // Display summary
    const totalEffects = await prisma.voiceEffect.count();
    const emotionEffects = await prisma.voiceEffect.count({ where: { category: 'emotion' } });
    const celebrityEffects = await prisma.voiceEffect.count({ where: { category: 'celebrity' } });
    const languageEffects = await prisma.voiceEffect.count({ where: { category: 'language' } });
    
    console.log('\n=== Voice Effects Summary ===');
    console.log(`Total effects: ${totalEffects}`);
    console.log(`Emotion effects: ${emotionEffects}`);
    console.log(`Celebrity effects: ${celebrityEffects}`);
    console.log(`Language effects: ${languageEffects}`);
    
  } catch (error) {
    console.error('Error seeding voice effects:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seeding function if this script is executed directly
if (require.main === module) {
  seedVoiceEffects();
}

module.exports = { seedVoiceEffects, voiceEffects };