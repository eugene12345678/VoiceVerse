const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedPromoCodes() {
  try {
    console.log('Seeding promo codes...');

    // Create promo codes
    const promoCodes = [
      {
        code: 'WELCOME20',
        description: '20% off your first subscription',
        discountPercent: 20,
        maxRedemptions: 1000,
        validFrom: new Date(),
        validUntil: new Date(new Date().setFullYear(new Date().getFullYear() + 1)), // Valid for 1 year
        isActive: true
      },
      {
        code: 'SUMMER2023',
        description: '15% off summer special',
        discountPercent: 15,
        maxRedemptions: 500,
        validFrom: new Date(),
        validUntil: new Date(new Date().setMonth(new Date().getMonth() + 3)), // Valid for 3 months
        isActive: true
      },
      {
        code: 'VOICEPRO10',
        description: '$10 off Pro subscription',
        discountAmount: 10,
        currency: 'USD',
        maxRedemptions: null, // Unlimited
        validFrom: new Date(),
        validUntil: null, // No expiration
        isActive: true
      }
    ];

    // Insert promo codes
    for (const code of promoCodes) {
      await prisma.promoCode.upsert({
        where: { code: code.code },
        update: code,
        create: code
      });
    }

    console.log('Promo codes seeded successfully!');
  } catch (error) {
    console.error('Error seeding promo codes:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedPromoCodes();