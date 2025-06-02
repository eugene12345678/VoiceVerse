const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const subscriptionController = require('../controllers/subscriptionController');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validators');

// Public routes
router.get('/plans', subscriptionController.getPlans);
router.post('/webhook', express.raw({ type: 'application/json' }), subscriptionController.handleWebhook);

// Protected routes
router.post(
  '/create-payment-intent',
  authenticate,
  [
    body('priceId').notEmpty().withMessage('Price ID is required'),
  ],
  validate,
  subscriptionController.createPaymentIntent
);

router.post(
  '/create',
  authenticate,
  [
    body('priceId').notEmpty().withMessage('Price ID is required'),
    body('paymentMethodId').notEmpty().withMessage('Payment method ID is required'),
  ],
  validate,
  subscriptionController.createSubscription
);

router.get(
  '/current',
  authenticate,
  subscriptionController.getCurrentSubscription
);

router.post(
  '/:subscriptionId/cancel',
  authenticate,
  subscriptionController.cancelSubscription
);

router.post(
  '/:subscriptionId/reactivate',
  authenticate,
  subscriptionController.reactivateSubscription
);

router.post(
  '/payment-method',
  authenticate,
  [
    body('paymentMethodId').notEmpty().withMessage('Payment method ID is required'),
  ],
  validate,
  subscriptionController.updatePaymentMethod
);

router.get(
  '/payment-methods',
  authenticate,
  subscriptionController.getPaymentMethods
);

router.post(
  '/billing-info',
  authenticate,
  [
    body('name').notEmpty().withMessage('Name is required'),
  ],
  validate,
  subscriptionController.updateBillingInfo
);

router.get(
  '/billing-info',
  authenticate,
  subscriptionController.getBillingInfo
);

router.get(
  '/promo-code/:code',
  subscriptionController.validatePromoCode
);

router.get(
  '/invoices',
  authenticate,
  subscriptionController.getInvoiceHistory
);

module.exports = router;