const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { 
  getOrCreateCustomer, 
  attachPaymentMethod, 
  createSubscription, 
  validatePromoCode, 
  recordPromoCodeUsage 
} = require('../utils/stripeUtils');
const { 
  sendSubscriptionConfirmationEmail, 
  sendPaymentReceiptEmail 
} = require('../utils/emailUtils');

/**
 * Get subscription plans
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getPlans = async (req, res) => {
  try {
    // Define plans - in a real app, these would likely come from Stripe or a database
    const plans = [
      {
        id: 'pro_monthly',
        name: 'Pro',
        description: 'Perfect for individual creators',
        price: 29.99,
        interval: 'monthly',
        features: [
          'Access to all voice models',
          'Priority processing',
          'Unlimited transformations',
          'Commercial usage rights'
        ],
        stripePriceId: 'price_1RVYNb2LAZDhQpmh9r7lBGbE7'  // Replace with actual Stripe price ID
      },
      {
        id: 'pro_yearly',
        name: 'Pro',
        description: 'Perfect for individual creators',
        price: 290,
        interval: 'yearly',
        features: [
          'Access to all voice models',
          'Priority processing',
          'Unlimited transformations',
          'Commercial usage rights'
        ],
        stripePriceId: 'price_1RVYNb2LAZDhQpmh9r7lBGbE7'  // Replace with actual Stripe price ID
      },
      {
        id: 'premium_monthly',
        name: 'Premium',
        description: 'Ideal for professional creators',
        price: 49.99,
        interval: 'monthly',
        features: [
          'All Pro features',
          'Team sharing (up to 5 members)',
          'Advanced voice customization',
          'Priority support'
        ],
        stripePriceId: 'price_1RVYNb2LAZDhQpmh9r7lBGbE7'  // Replace with actual Stripe price ID
      },
      {
        id: 'premium_yearly',
        name: 'Premium',
        description: 'Ideal for professional creators',
        price: 490,
        interval: 'yearly',
        features: [
          'All Pro features',
          'Team sharing (up to 5 members)',
          'Advanced voice customization',
          'Priority support'
        ],
        stripePriceId: 'price_1RVYNb2LAZDhQpmh9r7lBGbE7'  // Replace with actual Stripe price ID
      }
    ];

    res.status(200).json({ plans });
  } catch (error) {
    console.error('Error fetching plans:', error);
    res.status(500).json({ message: 'Failed to fetch subscription plans' });
  }
};

/**
 * Create a payment intent for subscription checkout
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.createPaymentIntent = async (req, res) => {
  try {
    const { priceId, promoCode } = req.body;
    const userId = req.user.id;

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get or create Stripe customer
    const customerId = await getOrCreateCustomer(user);

    // Get price from Stripe
    const price = await stripe.prices.retrieve(priceId);
    
    // Calculate amount with promo code if applicable
    let amount = price.unit_amount;
    let coupon = null;
    
    if (promoCode) {
      coupon = await validatePromoCode(promoCode);
      if (coupon) {
        if (coupon.percent_off) {
          amount = amount - (amount * (coupon.percent_off / 100));
        } else if (coupon.amount_off) {
          amount = amount - coupon.amount_off;
        }
      }
    }

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: price.currency,
      customer: customerId,
      metadata: {
        userId,
        priceId,
        promoCode: promoCode || ''
      }
    });

    res.status(200).json({
      clientSecret: paymentIntent.client_secret,
      amount,
      currency: price.currency
    });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    res.status(500).json({ message: 'Failed to create payment intent' });
  }
};

/**
 * Create a subscription
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.createSubscription = async (req, res) => {
  try {
    const { priceId, paymentMethodId, promoCode } = req.body;
    const userId = req.user.id;

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get or create Stripe customer
    const customerId = await getOrCreateCustomer(user);

    // Attach payment method to customer
    await attachPaymentMethod(customerId, paymentMethodId, true);

    // Create subscription
    const subscription = await createSubscription(customerId, priceId, userId, promoCode);

    // Record promo code usage if applicable
    if (promoCode && subscription.status !== 'incomplete') {
      await recordPromoCodeUsage(userId, promoCode);
    }

    // Send confirmation email
    const dbSubscription = await prisma.subscription.findUnique({
      where: { stripeSubscriptionId: subscription.id }
    });

    if (dbSubscription) {
      await sendSubscriptionConfirmationEmail(user.email, dbSubscription);
    }

    res.status(200).json({
      subscriptionId: subscription.id,
      status: subscription.status,
      currentPeriodEnd: new Date(subscription.current_period_end * 1000)
    });
  } catch (error) {
    console.error('Error creating subscription:', error);
    res.status(500).json({ message: 'Failed to create subscription' });
  }
};

/**
 * Get user's current subscription
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getCurrentSubscription = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user's active subscription
    const subscription = await prisma.subscription.findFirst({
      where: {
        userId,
        status: { in: ['ACTIVE', 'TRIALING'] }
      },
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        invoices: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 1
        }
      }
    });

    if (!subscription) {
      return res.status(404).json({ message: 'No active subscription found' });
    }

    res.status(200).json({ subscription });
  } catch (error) {
    console.error('Error fetching subscription:', error);
    res.status(500).json({ message: 'Failed to fetch subscription' });
  }
};

/**
 * Cancel a subscription
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.cancelSubscription = async (req, res) => {
  try {
    const { subscriptionId } = req.params;
    const userId = req.user.id;

    // Get subscription
    const subscription = await prisma.subscription.findFirst({
      where: {
        id: subscriptionId,
        userId
      }
    });

    if (!subscription) {
      return res.status(404).json({ message: 'Subscription not found' });
    }

    // Cancel subscription in Stripe
    await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
      cancel_at_period_end: true
    });

    // Update subscription in database
    await prisma.subscription.update({
      where: { id: subscriptionId },
      data: { cancelAtPeriodEnd: true }
    });

    res.status(200).json({ message: 'Subscription will be canceled at the end of the billing period' });
  } catch (error) {
    console.error('Error canceling subscription:', error);
    res.status(500).json({ message: 'Failed to cancel subscription' });
  }
};

/**
 * Reactivate a canceled subscription
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.reactivateSubscription = async (req, res) => {
  try {
    const { subscriptionId } = req.params;
    const userId = req.user.id;

    // Get subscription
    const subscription = await prisma.subscription.findFirst({
      where: {
        id: subscriptionId,
        userId,
        cancelAtPeriodEnd: true
      }
    });

    if (!subscription) {
      return res.status(404).json({ message: 'Subscription not found or not eligible for reactivation' });
    }

    // Reactivate subscription in Stripe
    await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
      cancel_at_period_end: false
    });

    // Update subscription in database
    await prisma.subscription.update({
      where: { id: subscriptionId },
      data: { cancelAtPeriodEnd: false }
    });

    res.status(200).json({ message: 'Subscription reactivated successfully' });
  } catch (error) {
    console.error('Error reactivating subscription:', error);
    res.status(500).json({ message: 'Failed to reactivate subscription' });
  }
};

/**
 * Update payment method
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.updatePaymentMethod = async (req, res) => {
  try {
    const { paymentMethodId } = req.body;
    const userId = req.user.id;

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user || !user.stripeCustomerId) {
      return res.status(404).json({ message: 'User or customer not found' });
    }

    // Attach new payment method to customer
    await attachPaymentMethod(user.stripeCustomerId, paymentMethodId, true);

    // Store payment method in database
    const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);
    
    await prisma.paymentMethod.create({
      data: {
        userId,
        stripePaymentMethodId: paymentMethodId,
        type: paymentMethod.type.toUpperCase(),
        last4: paymentMethod.card?.last4,
        expiryMonth: paymentMethod.card?.exp_month,
        expiryYear: paymentMethod.card?.exp_year,
        brand: paymentMethod.card?.brand,
        isDefault: true
      }
    });

    // Set all other payment methods as non-default
    await prisma.paymentMethod.updateMany({
      where: {
        userId,
        stripePaymentMethodId: { not: paymentMethodId }
      },
      data: {
        isDefault: false
      }
    });

    res.status(200).json({ message: 'Payment method updated successfully' });
  } catch (error) {
    console.error('Error updating payment method:', error);
    res.status(500).json({ message: 'Failed to update payment method' });
  }
};

/**
 * Get user's payment methods
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getPaymentMethods = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user's payment methods
    const paymentMethods = await prisma.paymentMethod.findMany({
      where: { userId }
    });

    res.status(200).json({ paymentMethods });
  } catch (error) {
    console.error('Error fetching payment methods:', error);
    res.status(500).json({ message: 'Failed to fetch payment methods' });
  }
};

/**
 * Update billing information
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.updateBillingInfo = async (req, res) => {
  try {
    const { name, email, phone, address, city, state, postalCode, country } = req.body;
    const userId = req.user.id;

    // Update or create billing info
    const billingInfo = await prisma.billingInfo.upsert({
      where: { userId },
      update: {
        name,
        email,
        phone,
        address,
        city,
        state,
        postalCode,
        country
      },
      create: {
        userId,
        name,
        email,
        phone,
        address,
        city,
        state,
        postalCode,
        country
      }
    });

    // Update customer in Stripe if needed
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (user?.stripeCustomerId) {
      await stripe.customers.update(user.stripeCustomerId, {
        name,
        email,
        phone,
        address: {
          line1: address,
          city,
          state,
          postal_code: postalCode,
          country
        }
      });
    }

    res.status(200).json({ billingInfo });
  } catch (error) {
    console.error('Error updating billing info:', error);
    res.status(500).json({ message: 'Failed to update billing information' });
  }
};

/**
 * Get billing information
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getBillingInfo = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get billing info
    const billingInfo = await prisma.billingInfo.findUnique({
      where: { userId }
    });

    if (!billingInfo) {
      return res.status(404).json({ message: 'No billing information found' });
    }

    res.status(200).json({ billingInfo });
  } catch (error) {
    console.error('Error fetching billing info:', error);
    res.status(500).json({ message: 'Failed to fetch billing information' });
  }
};

/**
 * Validate a promo code
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.validatePromoCode = async (req, res) => {
  try {
    const { code } = req.params;
    
    // Check if promo code exists and is valid
    const promoCode = await prisma.promoCode.findUnique({
      where: { code }
    });

    if (!promoCode || !promoCode.isActive) {
      return res.status(404).json({ message: 'Invalid promo code' });
    }

    // Check if promo code has expired
    if (promoCode.validUntil && new Date() > promoCode.validUntil) {
      return res.status(400).json({ message: 'Promo code has expired' });
    }

    // Check if promo code has reached max redemptions
    if (promoCode.maxRedemptions && promoCode.timesRedeemed >= promoCode.maxRedemptions) {
      return res.status(400).json({ message: 'Promo code has reached maximum redemptions' });
    }

    // Check if user has already used this promo code
    if (req.user) {
      const usage = await prisma.promoCodeUsage.findFirst({
        where: {
          userId: req.user.id,
          promoCodeId: promoCode.id
        }
      });

      if (usage) {
        return res.status(400).json({ message: 'You have already used this promo code' });
      }
    }

    // Return promo code details
    res.status(200).json({
      code: promoCode.code,
      description: promoCode.description,
      discountPercent: promoCode.discountPercent,
      discountAmount: promoCode.discountAmount,
      currency: promoCode.currency
    });
  } catch (error) {
    console.error('Error validating promo code:', error);
    res.status(500).json({ message: 'Failed to validate promo code' });
  }
};

/**
 * Get invoice history
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getInvoiceHistory = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user's subscriptions
    const subscriptions = await prisma.subscription.findMany({
      where: { userId },
      include: { invoices: true }
    });

    // Flatten invoices from all subscriptions
    const invoices = subscriptions.flatMap(sub => sub.invoices);

    // Sort by date (newest first)
    invoices.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.status(200).json({ invoices });
  } catch (error) {
    console.error('Error fetching invoice history:', error);
    res.status(500).json({ message: 'Failed to fetch invoice history' });
  }
};

/**
 * Handle Stripe webhook
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.handleWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  try {
    const { handleWebhookEvent } = require('../utils/stripeUtils');
    await handleWebhookEvent(event);
    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Error handling webhook event:', error);
    res.status(500).json({ message: 'Error handling webhook event' });
  }
};