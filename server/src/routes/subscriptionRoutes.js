const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const subscriptionController = require('../controllers/subscriptionController');
const { authenticateToken } = require('../middleware/auth');
const { validate } = require('../middleware/validators');

// Public routes
router.get('/plans', subscriptionController.getPlans);
// Webhook route is handled directly in index.js

// Protected routes
router.post(
  '/create-payment-intent',
  authenticateToken,
  [
    body('priceId').notEmpty().withMessage('Price ID is required'),
  ],
  validate,
  subscriptionController.createPaymentIntent
);

router.post(
  '/create',
  authenticateToken,
  [
    body('priceId').notEmpty().withMessage('Price ID is required'),
    body('paymentMethodId').notEmpty().withMessage('Payment method ID is required'),
  ],
  validate,
  subscriptionController.createSubscription
);

router.get(
  '/current',
  authenticateToken,
  subscriptionController.getCurrentSubscription
);

router.post(
  '/:subscriptionId/cancel',
  authenticateToken,
  subscriptionController.cancelSubscription
);

router.post(
  '/:subscriptionId/reactivate',
  authenticateToken,
  subscriptionController.reactivateSubscription
);

router.post(
  '/payment-method',
  authenticateToken,
  [
    body('paymentMethodId').notEmpty().withMessage('Payment method ID is required'),
  ],
  validate,
  subscriptionController.updatePaymentMethod
);

router.get(
  '/payment-methods',
  authenticateToken,
  subscriptionController.getPaymentMethods
);

router.post(
  '/billing-info',
  authenticateToken,
  [
    body('name').notEmpty().withMessage('Name is required'),
  ],
  validate,
  subscriptionController.updateBillingInfo
);

router.get(
  '/billing-info',
  authenticateToken,
  subscriptionController.getBillingInfo
);

router.get(
  '/promo-code/:code',
  subscriptionController.validatePromoCode
);

router.get(
  '/invoices',
  authenticateToken,
  subscriptionController.getInvoiceHistory
);

module.exports = router;