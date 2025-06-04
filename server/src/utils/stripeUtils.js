const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Create or retrieve a Stripe customer for a user
 * @param {Object} user - User object with id, email, and username
 * @returns {Promise<String>} - Stripe customer ID
 */
async function getOrCreateCustomer(user) {
  // Check if user already has a Stripe customer ID
  if (user.stripeCustomerId) {
    return user.stripeCustomerId;
  }

  // Create a new customer in Stripe
  const customer = await stripe.customers.create({
    email: user.email,
    name: user.displayName || user.username,
    metadata: {
      userId: user.id
    }
  });

  // Update user with Stripe customer ID
  await prisma.user.update({
    where: { id: user.id },
    data: { stripeCustomerId: customer.id }
  });

  return customer.id;
}

/**
 * Create a payment method and attach it to a customer
 * @param {String} customerId - Stripe customer ID
 * @param {String} paymentMethodId - Stripe payment method ID
 * @param {Boolean} setAsDefault - Whether to set as default payment method
 * @returns {Promise<Object>} - Payment method object
 */
async function attachPaymentMethod(customerId, paymentMethodId, setAsDefault = true) {
  // Attach payment method to customer
  await stripe.paymentMethods.attach(paymentMethodId, {
    customer: customerId,
  });

  // Set as default payment method if requested
  if (setAsDefault) {
    await stripe.customers.update(customerId, {
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    });
  }

  return await stripe.paymentMethods.retrieve(paymentMethodId);
}

/**
 * Create a subscription for a customer
 * @param {String} customerId - Stripe customer ID
 * @param {String} priceId - Stripe price ID
 * @param {String} userId - User ID
 * @param {String} promoCode - Optional promo code
 * @returns {Promise<Object>} - Subscription object
 */
async function createSubscription(customerId, priceId, userId, promoCode = null) {
  const subscriptionData = {
    customer: customerId,
    items: [{ price: priceId }],
    expand: ['latest_invoice.payment_intent'],
  };

  // Apply promo code if provided
  if (promoCode) {
    const coupon = await validatePromoCode(promoCode);
    if (coupon) {
      subscriptionData.coupon = coupon.id;
    }
  }

  // Create the subscription
  const subscription = await stripe.subscriptions.create(subscriptionData);

  // Store subscription in database
  const planType = subscription.items.data[0].price.metadata.planType || 'PRO';
  const billingPeriod = subscription.items.data[0].price.recurring.interval === 'year' ? 'YEARLY' : 'MONTHLY';

  // Ensure we have valid timestamps before creating Date objects
  let currentPeriodStart = new Date();
  let currentPeriodEnd = new Date();
  
  if (subscription.current_period_start) {
    currentPeriodStart = new Date(subscription.current_period_start * 1000);
  }
  
  if (subscription.current_period_end) {
    currentPeriodEnd = new Date(subscription.current_period_end * 1000);
  }

  // Validate dates before saving to database
  if (isNaN(currentPeriodStart.getTime())) {
    currentPeriodStart = new Date(); // Fallback to current date
  }
  
  if (isNaN(currentPeriodEnd.getTime())) {
    // Fallback to current date + 30 days
    currentPeriodEnd = new Date();
    currentPeriodEnd.setDate(currentPeriodEnd.getDate() + 30);
  }

  // Create the subscription in the database
  const dbSubscription = await prisma.subscription.create({
    data: {
      userId,
      stripeSubscriptionId: subscription.id,
      status: mapSubscriptionStatus(subscription.status),
      planType,
      billingPeriod,
      currentPeriodStart,
      currentPeriodEnd,
    }
  });

  // If subscription is active, update user's isPro status
  if (subscription.status === 'active' || subscription.status === 'trialing') {
    await prisma.user.update({
      where: { id: userId },
      data: { isPro: true }
    });
  }

  // Store invoice information
  if (subscription.latest_invoice) {
    try {
      await prisma.invoice.create({
        data: {
          subscriptionId: dbSubscription.id, // Use the database subscription ID, not the Stripe subscription ID
          stripeInvoiceId: subscription.latest_invoice.id,
          amount: subscription.latest_invoice.amount_paid / 100, // Convert from cents
          currency: subscription.latest_invoice.currency || 'usd',
          status: mapInvoiceStatus(subscription.latest_invoice.status),
          invoiceUrl: subscription.latest_invoice.hosted_invoice_url || '',
          pdfUrl: subscription.latest_invoice.invoice_pdf || '',
        }
      });
    } catch (error) {
      console.error('Error creating invoice record:', error);
      // Continue even if invoice creation fails
    }
  }

  return subscription;
}

/**
 * Validate a promo code and return the corresponding coupon
 * @param {String} code - Promo code to validate
 * @returns {Promise<Object|null>} - Coupon object or null if invalid
 */
async function validatePromoCode(code) {
  try {
    // Check if promo code exists in our database
    const promoCode = await prisma.promoCode.findUnique({
      where: { code }
    });

    if (!promoCode || !promoCode.isActive) {
      return null;
    }

    // Check if promo code has expired
    if (promoCode.validUntil && new Date() > promoCode.validUntil) {
      return null;
    }

    // Check if promo code has reached max redemptions
    if (promoCode.maxRedemptions && promoCode.timesRedeemed >= promoCode.maxRedemptions) {
      return null;
    }

    // Get or create corresponding coupon in Stripe
    let coupon;
    try {
      // Try to retrieve existing coupon
      coupon = await stripe.coupons.retrieve(code);
    } catch (error) {
      // Create new coupon if it doesn't exist
      const couponData = {};
      
      if (promoCode.discountPercent) {
        couponData.percent_off = promoCode.discountPercent;
      } else if (promoCode.discountAmount) {
        couponData.amount_off = Math.round(promoCode.discountAmount * 100); // Convert to cents
        couponData.currency = promoCode.currency;
      }
      
      coupon = await stripe.coupons.create({
        id: code,
        ...couponData,
        name: promoCode.description || `Promo: ${code}`,
        max_redemptions: promoCode.maxRedemptions,
      });
    }

    return coupon;
  } catch (error) {
    console.error('Error validating promo code:', error);
    return null;
  }
}

/**
 * Record promo code usage for a user
 * @param {String} userId - User ID
 * @param {String} promoCode - Promo code
 * @returns {Promise<Boolean>} - Success status
 */
async function recordPromoCodeUsage(userId, promoCode) {
  try {
    const code = await prisma.promoCode.findUnique({
      where: { code: promoCode }
    });

    if (!code) return false;

    // Record usage
    await prisma.promoCodeUsage.create({
      data: {
        userId,
        promoCodeId: code.id
      }
    });

    // Increment times redeemed
    await prisma.promoCode.update({
      where: { id: code.id },
      data: { timesRedeemed: { increment: 1 } }
    });

    return true;
  } catch (error) {
    console.error('Error recording promo code usage:', error);
    return false;
  }
}

/**
 * Handle Stripe webhook events
 * @param {Object} event - Stripe event object
 * @returns {Promise<void>}
 */
async function handleWebhookEvent(event) {
  const { type, data } = event;

  switch (type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
      await handleSubscriptionUpdate(data.object);
      break;
    
    case 'customer.subscription.deleted':
      await handleSubscriptionCancellation(data.object);
      break;
    
    case 'invoice.payment_succeeded':
      await handleInvoicePayment(data.object);
      break;
    
    case 'invoice.payment_failed':
      await handleInvoicePaymentFailure(data.object);
      break;
    
    default:
      console.log(`Unhandled event type: ${type}`);
  }
}

/**
 * Handle subscription update events
 * @param {Object} subscription - Stripe subscription object
 * @returns {Promise<void>}
 */
async function handleSubscriptionUpdate(subscription) {
  try {
    // Find user by customer ID
    const customer = await stripe.customers.retrieve(subscription.customer);
    const user = await prisma.user.findFirst({
      where: { stripeCustomerId: subscription.customer }
    });

    if (!user) {
      console.error(`No user found for customer ID: ${subscription.customer}`);
      return;
    }

    // Ensure we have valid timestamps before creating Date objects
    let currentPeriodStart = new Date();
    let currentPeriodEnd = new Date();
    
    if (subscription.current_period_start) {
      currentPeriodStart = new Date(subscription.current_period_start * 1000);
    }
    
    if (subscription.current_period_end) {
      currentPeriodEnd = new Date(subscription.current_period_end * 1000);
    }

    // Validate dates before saving to database
    if (isNaN(currentPeriodStart.getTime())) {
      currentPeriodStart = new Date(); // Fallback to current date
    }
    
    if (isNaN(currentPeriodEnd.getTime())) {
      // Fallback to current date + 30 days
      currentPeriodEnd = new Date();
      currentPeriodEnd.setDate(currentPeriodEnd.getDate() + 30);
    }

    // Update subscription in database
    await prisma.subscription.upsert({
      where: { stripeSubscriptionId: subscription.id },
      update: {
        status: mapSubscriptionStatus(subscription.status),
        currentPeriodStart,
        currentPeriodEnd,
        cancelAtPeriodEnd: subscription.cancel_at_period_end || false,
      },
      create: {
        userId: user.id,
        stripeSubscriptionId: subscription.id,
        status: mapSubscriptionStatus(subscription.status),
        planType: subscription.items.data[0]?.price?.metadata?.planType || 'PRO',
        billingPeriod: subscription.items.data[0]?.price?.recurring?.interval === 'year' ? 'YEARLY' : 'MONTHLY',
        currentPeriodStart,
        currentPeriodEnd,
        cancelAtPeriodEnd: subscription.cancel_at_period_end || false,
      }
    });

    // Update user's isPro status based on subscription status
    const isActive = ['active', 'trialing'].includes(subscription.status);
    await prisma.user.update({
      where: { id: user.id },
      data: { isPro: isActive }
    });
  } catch (error) {
    console.error('Error handling subscription update:', error);
  }
}

/**
 * Handle subscription cancellation events
 * @param {Object} subscription - Stripe subscription object
 * @returns {Promise<void>}
 */
async function handleSubscriptionCancellation(subscription) {
  try {
    // Find subscription in database
    const dbSubscription = await prisma.subscription.findUnique({
      where: { stripeSubscriptionId: subscription.id },
      include: { user: true }
    });

    if (!dbSubscription) {
      console.error(`No subscription found with ID: ${subscription.id}`);
      return;
    }

    // Update subscription status
    await prisma.subscription.update({
      where: { id: dbSubscription.id },
      data: {
        status: 'CANCELED',
        cancelAtPeriodEnd: true,
      }
    });

    // Update user's isPro status if subscription is immediately canceled
    // (not at period end)
    if (!subscription.cancel_at_period_end) {
      await prisma.user.update({
        where: { id: dbSubscription.userId },
        data: { isPro: false }
      });
    }
  } catch (error) {
    console.error('Error handling subscription cancellation:', error);
  }
}

/**
 * Handle invoice payment success events
 * @param {Object} invoice - Stripe invoice object
 * @returns {Promise<void>}
 */
async function handleInvoicePayment(invoice) {
  try {
    if (!invoice.subscription) return;

    // Find subscription in database
    const subscription = await prisma.subscription.findUnique({
      where: { stripeSubscriptionId: invoice.subscription }
    });

    if (!subscription) {
      console.error(`No subscription found with ID: ${invoice.subscription}`);
      return;
    }

    // Create or update invoice record
    await prisma.invoice.upsert({
      where: { stripeInvoiceId: invoice.id },
      update: {
        amount: invoice.amount_paid / 100,
        status: mapInvoiceStatus(invoice.status),
        invoiceUrl: invoice.hosted_invoice_url,
        pdfUrl: invoice.invoice_pdf,
      },
      create: {
        subscriptionId: subscription.id,
        stripeInvoiceId: invoice.id,
        amount: invoice.amount_paid / 100,
        currency: invoice.currency,
        status: mapInvoiceStatus(invoice.status),
        invoiceUrl: invoice.hosted_invoice_url,
        pdfUrl: invoice.invoice_pdf,
      }
    });
  } catch (error) {
    console.error('Error handling invoice payment:', error);
  }
}

/**
 * Handle invoice payment failure events
 * @param {Object} invoice - Stripe invoice object
 * @returns {Promise<void>}
 */
async function handleInvoicePaymentFailure(invoice) {
  try {
    if (!invoice.subscription) return;

    // Find subscription in database
    const subscription = await prisma.subscription.findUnique({
      where: { stripeSubscriptionId: invoice.subscription },
      include: { user: true }
    });

    if (!subscription) {
      console.error(`No subscription found with ID: ${invoice.subscription}`);
      return;
    }

    // Update subscription status
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: { status: 'PAST_DUE' }
    });

    // Create or update invoice record
    await prisma.invoice.upsert({
      where: { stripeInvoiceId: invoice.id },
      update: {
        status: mapInvoiceStatus(invoice.status),
      },
      create: {
        subscriptionId: subscription.id,
        stripeInvoiceId: invoice.id,
        amount: invoice.amount_due / 100,
        currency: invoice.currency,
        status: mapInvoiceStatus(invoice.status),
        invoiceUrl: invoice.hosted_invoice_url,
        pdfUrl: invoice.invoice_pdf,
      }
    });

    // TODO: Send email notification about payment failure
  } catch (error) {
    console.error('Error handling invoice payment failure:', error);
  }
}

/**
 * Map Stripe subscription status to database enum
 * @param {String} stripeStatus - Stripe subscription status
 * @returns {String} - Database subscription status
 */
function mapSubscriptionStatus(stripeStatus) {
  const statusMap = {
    'active': 'ACTIVE',
    'past_due': 'PAST_DUE',
    'canceled': 'CANCELED',
    'unpaid': 'UNPAID',
    'trialing': 'TRIALING',
  };
  
  return statusMap[stripeStatus] || 'ACTIVE';
}

/**
 * Map Stripe invoice status to database enum
 * @param {String} stripeStatus - Stripe invoice status
 * @returns {String} - Database invoice status
 */
function mapInvoiceStatus(stripeStatus) {
  const statusMap = {
    'paid': 'PAID',
    'open': 'OPEN',
    'void': 'VOID',
    'uncollectible': 'UNCOLLECTIBLE',
  };
  
  return statusMap[stripeStatus] || 'OPEN';
}

module.exports = {
  getOrCreateCustomer,
  attachPaymentMethod,
  createSubscription,
  validatePromoCode,
  recordPromoCodeUsage,
  handleWebhookEvent,
};