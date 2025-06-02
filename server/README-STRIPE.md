# Stripe Integration for VoiceVerse

This document provides information on how to use and test the Stripe integration for the VoiceVerse subscription system.

## Overview

The VoiceVerse subscription system uses Stripe to handle payments and subscriptions. The integration includes:

- Customer creation and management
- Payment method handling
- Subscription creation and management
- Promo code validation and application
- Webhook handling for subscription events
- Email notifications for subscription events

## Environment Variables

The following environment variables are required for the Stripe integration:

```
STRIPE_SECRET_KEY=sk_test_your_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
```

These are already set up in the `.env` file.

## Testing the Integration

### Test Cards

You can use the following test cards for testing the integration:

- **Successful payment**: 4242 4242 4242 4242
- **Authentication required**: 4000 0025 0000 3155
- **Payment fails**: 4000 0000 0000 0002

For all test cards, you can use:
- Any future expiration date (MM/YY)
- Any 3-digit CVC
- Any postal code

### Test Promo Codes

The following promo codes are available for testing:

- `WELCOME20`: 20% off your first subscription
- `SUMMER2023`: 15% off summer special
- `VOICEPRO10`: $10 off Pro subscription

## Webhook Setup

For local development, you can use the Stripe CLI to forward webhook events to your local server:

1. Install the Stripe CLI: https://stripe.com/docs/stripe-cli
2. Run the following command:

```
stripe listen --forward-to http://localhost:5000/api/subscription/webhook
```

3. The CLI will provide a webhook signing secret. Update the `STRIPE_WEBHOOK_SECRET` in your `.env` file with this value.

## API Endpoints

### Public Endpoints

- `GET /api/subscription/plans`: Get available subscription plans
- `GET /api/subscription/promo-code/:code`: Validate a promo code
- `POST /api/subscription/webhook`: Stripe webhook endpoint

### Protected Endpoints (Require Authentication)

- `POST /api/subscription/create-payment-intent`: Create a payment intent
- `POST /api/subscription/create`: Create a subscription
- `GET /api/subscription/current`: Get current subscription
- `POST /api/subscription/:subscriptionId/cancel`: Cancel a subscription
- `POST /api/subscription/:subscriptionId/reactivate`: Reactivate a canceled subscription
- `POST /api/subscription/payment-method`: Update payment method
- `GET /api/subscription/payment-methods`: Get payment methods
- `POST /api/subscription/billing-info`: Update billing information
- `GET /api/subscription/billing-info`: Get billing information
- `GET /api/subscription/invoices`: Get invoice history

## Database Models

The following models are used for the Stripe integration:

- `Subscription`: Stores subscription details
- `Invoice`: Stores invoice details
- `BillingInfo`: Stores billing information
- `PaymentMethod`: Stores payment method details
- `PromoCode`: Stores promo code details
- `PromoCodeUsage`: Tracks promo code usage

## Email Notifications

The system sends the following email notifications:

- Subscription confirmation
- Payment receipt
- Payment failure
- Subscription cancellation

## Frontend Integration

The frontend integration is implemented in the following files:

- `src/lib/api/subscription.ts`: API client for subscription endpoints
- `src/pages/CheckoutPage.tsx`: Checkout page with Stripe Elements integration

## Troubleshooting

If you encounter issues with the Stripe integration, check the following:

1. Ensure the environment variables are correctly set
2. Check the server logs for error messages
3. Verify that the webhook is properly configured
4. Test with Stripe's test cards to isolate payment issues

For more information, refer to the [Stripe API documentation](https://stripe.com/docs/api).