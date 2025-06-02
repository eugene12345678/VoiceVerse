import { api } from './api';

export interface Plan {
  id: string;
  name: string;
  description: string;
  price: number;
  interval: 'monthly' | 'yearly';
  features: string[];
  stripePriceId: string;
}

export interface Subscription {
  id: string;
  status: 'ACTIVE' | 'PAST_DUE' | 'CANCELED' | 'UNPAID' | 'TRIALING';
  planType: 'PRO' | 'PREMIUM' | 'ENTERPRISE';
  billingPeriod: 'MONTHLY' | 'YEARLY';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  createdAt: string;
  updatedAt: string;
  invoices?: Invoice[];
}

export interface Invoice {
  id: string;
  amount: number;
  currency: string;
  status: 'PAID' | 'OPEN' | 'VOID' | 'UNCOLLECTIBLE';
  invoiceUrl?: string;
  pdfUrl?: string;
  createdAt: string;
}

export interface PaymentMethod {
  id: string;
  type: 'CARD' | 'BANK_ACCOUNT' | 'PAYPAL';
  last4?: string;
  expiryMonth?: number;
  expiryYear?: number;
  brand?: string;
  isDefault: boolean;
  createdAt: string;
}

export interface BillingInfo {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

export interface PromoCode {
  code: string;
  description?: string;
  discountPercent?: number;
  discountAmount?: number;
  currency: string;
}

/**
 * Get available subscription plans
 */
export const getPlans = async (): Promise<Plan[]> => {
  const response = await api.get('/subscription/plans');
  return response.data.plans;
};

/**
 * Create a payment intent for subscription checkout
 * @param priceId - Stripe price ID
 * @param promoCode - Optional promo code
 */
export const createPaymentIntent = async (
  priceId: string,
  promoCode?: string
): Promise<{ clientSecret: string; amount: number; currency: string }> => {
  const response = await api.post('/subscription/create-payment-intent', {
    priceId,
    promoCode,
  });
  return response.data;
};

/**
 * Create a subscription
 * @param priceId - Stripe price ID
 * @param paymentMethodId - Stripe payment method ID
 * @param promoCode - Optional promo code
 */
export const createSubscription = async (
  priceId: string,
  paymentMethodId: string,
  promoCode?: string
): Promise<{ subscriptionId: string; status: string; currentPeriodEnd: string }> => {
  const response = await api.post('/subscription/create', {
    priceId,
    paymentMethodId,
    promoCode,
  });
  return response.data;
};

/**
 * Get current subscription
 */
export const getCurrentSubscription = async (): Promise<Subscription | null> => {
  try {
    const response = await api.get('/subscription/current');
    return response.data.subscription;
  } catch (error) {
    if (error.response?.status === 404) {
      return null;
    }
    throw error;
  }
};

/**
 * Cancel subscription
 * @param subscriptionId - Subscription ID
 */
export const cancelSubscription = async (subscriptionId: string): Promise<void> => {
  await api.post(`/subscription/${subscriptionId}/cancel`);
};

/**
 * Reactivate subscription
 * @param subscriptionId - Subscription ID
 */
export const reactivateSubscription = async (subscriptionId: string): Promise<void> => {
  await api.post(`/subscription/${subscriptionId}/reactivate`);
};

/**
 * Update payment method
 * @param paymentMethodId - Stripe payment method ID
 */
export const updatePaymentMethod = async (paymentMethodId: string): Promise<void> => {
  await api.post('/subscription/payment-method', { paymentMethodId });
};

/**
 * Get payment methods
 */
export const getPaymentMethods = async (): Promise<PaymentMethod[]> => {
  const response = await api.get('/subscription/payment-methods');
  return response.data.paymentMethods;
};

/**
 * Update billing information
 * @param billingInfo - Billing information
 */
export const updateBillingInfo = async (billingInfo: Omit<BillingInfo, 'id'>): Promise<BillingInfo> => {
  const response = await api.post('/subscription/billing-info', billingInfo);
  return response.data.billingInfo;
};

/**
 * Get billing information
 */
export const getBillingInfo = async (): Promise<BillingInfo | null> => {
  try {
    const response = await api.get('/subscription/billing-info');
    return response.data.billingInfo;
  } catch (error) {
    if (error.response?.status === 404) {
      return null;
    }
    throw error;
  }
};

/**
 * Validate promo code
 * @param code - Promo code
 */
export const validatePromoCode = async (code: string): Promise<PromoCode | null> => {
  try {
    const response = await api.get(`/subscription/promo-code/${code}`);
    return response.data;
  } catch (error) {
    if (error.response?.status === 404 || error.response?.status === 400) {
      return null;
    }
    throw error;
  }
};

/**
 * Get invoice history
 */
export const getInvoiceHistory = async (): Promise<Invoice[]> => {
  const response = await api.get('/subscription/invoices');
  return response.data.invoices;
};