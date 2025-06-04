import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { useAuth } from '../lib/auth';
import { createPaymentIntent, createSubscription, validatePromoCode } from '../lib/api/subscription';
import {
  CreditCard,
  Gift,
  ShieldCheck,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  Crown,
  Smartphone,
  Wallet,
  Lock,
  Receipt,
  CreditCardIcon,
  Sparkles,
  Globe,
  Users,
  Zap,
  Star,
  Shield
} from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardNumberElement,
  CardExpiryElement,
  CardCvcElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { toast } from 'react-hot-toast';

// Initialize Stripe with the publishable key only
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY || 'pk_test_51RVYNb2LAZDhQpmhcP0c9KkDAYOjOvF9W4mib4Yg5wAoxFfWgrm7cyFFfIRAm3lrmiohttkZ44O6lnSRi3Xupt3700fU0DHkfc');

// Custom styling for the card elements
const cardStyle = {
  style: {
    base: {
      color: '#32325d',
      fontFamily: 'Inter, system-ui, sans-serif',
      fontSmoothing: 'antialiased',
      fontSize: '16px',
      lineHeight: '24px',
      '::placeholder': {
        color: '#aab7c4'
      },
      padding: '10px 0',
    },
    invalid: {
      color: '#fa755a',
      iconColor: '#fa755a'
    }
  }
};

interface CheckoutItem {
  name: string;
  description: string;
  price: number;
  billingPeriod: 'monthly' | 'yearly';
}

const features = [
  {
    icon: <Globe className="h-5 w-5" />,
    title: 'Global Access',
    description: 'Use your subscription worldwide'
  },
  {
    icon: <Users className="h-5 w-5" />,
    title: 'Team Sharing',
    description: 'Share with up to 5 team members'
  },
  {
    icon: <Zap className="h-5 w-5" />,
    title: 'Priority Processing',
    description: 'Get faster voice transformations'
  },
  {
    icon: <Star className="h-5 w-5" />,
    title: 'Premium Features',
    description: 'Access to all premium voice models'
  }
];

const PaymentForm = ({ 
  total, 
  priceId, 
  promoCode, 
  onSuccess, 
  onError 
}: { 
  total: number;
  priceId: string;
  promoCode?: string;
  onSuccess: () => void;
  onError: () => void;
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'crypto' | 'mobile'>('card');
  const [error, setError] = useState<string | null>(null);
  const [cardName, setCardName] = useState('');
  const [saveCard, setSaveCard] = useState(false);
  const [showQR, setShowQR] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (paymentMethod === 'crypto') {
      setShowQR(true);
      return;
    }

    if (!stripe || !elements || !cardName) {
      setError('Please fill in all required fields');
      return;
    }

    setIsProcessing(true);

    try {
      // Create a payment method
      const cardElement = elements.getElement(CardNumberElement);
      if (!cardElement) {
        throw new Error('Card element not found');
      }

      const { error, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
        billing_details: {
          name: cardName,
        },
      });

      if (error) {
        // Handle specific Stripe errors
        if (error.type === 'card_error') {
          throw new Error(`Card error: ${error.message}`);
        } else {
          throw error;
        }
      }

      if (!paymentMethod || !paymentMethod.id) {
        throw new Error('Failed to create payment method');
      }

      // Create subscription with the payment method
      try {
        await createSubscription(
          priceId,
          paymentMethod.id,
          promoCode
        );
        onSuccess();
      } catch (subscriptionError: any) {
        console.error('Subscription creation failed:', subscriptionError);
        
        // Check if the error has a response with a message
        if (subscriptionError.response?.data?.message) {
          throw new Error(subscriptionError.response.data.message);
        } else if (subscriptionError.message && subscriptionError.message.includes('test_mode_live_card')) {
          throw new Error('Please use a test card number. For testing, use 4242 4242 4242 4242 with any future expiry date and any CVC.');
        } else if (subscriptionError.message && subscriptionError.message.includes('Invalid Date')) {
          throw new Error('There was an issue processing your payment. Please try again later or contact support.');
        } else if (subscriptionError.message && subscriptionError.message.includes('Foreign key constraint')) {
          throw new Error('There was an issue with your subscription. Please try again or contact support.');
        } else if (subscriptionError.message && subscriptionError.message.includes('card_declined')) {
          throw new Error('Your card was declined. Please try a different payment method or contact your bank.');
        } else {
          throw new Error('Failed to create subscription. Please check your payment details and try again.');
        }
      }
    } catch (error: any) {
      console.error('Payment failed:', error);
      setError(error.message || 'Payment failed. Please try again.');
      onError();
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCardChange = (event: any) => {
    setError(event.error ? event.error.message : null);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Payment Method Selection */}
      <div className="grid grid-cols-3 gap-4">
        <button
          type="button"
          className={`p-4 border rounded-lg text-center transition-colors ${
            paymentMethod === 'card'
              ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30'
              : 'border-gray-200 dark:border-dark-700 hover:bg-gray-50 dark:hover:bg-dark-800'
          }`}
          onClick={() => setPaymentMethod('card')}
        >
          <CreditCardIcon className="h-6 w-6 mx-auto mb-2" />
          <span className="text-sm">Card</span>
        </button>
        
        <button
          type="button"
          className={`p-4 border rounded-lg text-center transition-colors ${
            paymentMethod === 'crypto'
              ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30'
              : 'border-gray-200 dark:border-dark-700 hover:bg-gray-50 dark:hover:bg-dark-800'
          }`}
          onClick={() => setPaymentMethod('crypto')}
        >
          <Wallet className="h-6 w-6 mx-auto mb-2" />
          <span className="text-sm">Crypto</span>
        </button>
        
        <button
          type="button"
          className={`p-4 border rounded-lg text-center transition-colors ${
            paymentMethod === 'mobile'
              ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30'
              : 'border-gray-200 dark:border-dark-700 hover:bg-gray-50 dark:hover:bg-dark-800'
          }`}
          onClick={() => setPaymentMethod('mobile')}
        >
          <Smartphone className="h-6 w-6 mx-auto mb-2" />
          <span className="text-sm">Mobile</span>
        </button>
      </div>

      {/* Card Payment Form */}
      {paymentMethod === 'card' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">
              Name on Card
            </label>
            <input
              type="text"
              value={cardName}
              onChange={(e) => setCardName(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="John Doe"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">
              Card Number
            </label>
            <div className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg px-3 py-2 focus-within:ring-2 focus-within:ring-primary-500">
              <CardNumberElement 
                options={cardStyle}
                onChange={handleCardChange}
              />
            </div>
            <p className="text-xs text-dark-500 dark:text-dark-400 mt-1">
              For testing, use 4242 4242 4242 4242
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">
                Expiry Date
              </label>
              <div className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg px-3 py-2 focus-within:ring-2 focus-within:ring-primary-500">
                <CardExpiryElement options={cardStyle} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">
                CVC
              </label>
              <div className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg px-3 py-2 focus-within:ring-2 focus-within:ring-primary-500">
                <CardCvcElement options={cardStyle} />
              </div>
            </div>
          </div>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={saveCard}
              onChange={(e) => setSaveCard(e.target.checked)}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <span className="text-sm text-dark-600 dark:text-dark-400">
              Save card for future payments
            </span>
          </label>
        </div>
      )}

      {/* Crypto Payment */}
      {paymentMethod === 'crypto' && (
        <div className="text-center space-y-4">
          {showQR ? (
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-lg inline-block">
                <QRCodeSVG 
                  value="bitcoin:address-here?amount=0.001"
                  size={200}
                  level="H"
                />
              </div>
              <p className="text-sm text-dark-600 dark:text-dark-400">
                Scan QR code or send payment to:
              </p>
              <code className="block p-2 bg-gray-100 dark:bg-dark-800 rounded text-sm">
                1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa
              </code>
            </div>
          ) : (
            <div className="space-y-4">
              <Shield className="h-12 w-12 text-primary-600 dark:text-primary-400 mx-auto" />
              <p className="text-dark-600 dark:text-dark-400">
                Pay with Bitcoin, Ethereum, or other cryptocurrencies
              </p>
            </div>
          )}
        </div>
      )}

      {/* Mobile Payment */}
      {paymentMethod === 'mobile' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">
              Mobile Number
            </label>
            <input
              type="tel"
              className="w-full px-3 py-2 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="+1 (555) 000-0000"
            />
          </div>
          <p className="text-sm text-dark-600 dark:text-dark-400">
            You'll receive a payment link via SMS
          </p>
        </div>
      )}

      {error && (
        <div className="text-error-600 dark:text-error-400 text-sm flex items-start gap-2 p-3 bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800 rounded-lg mb-4">
          <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">{error}</p>
            {error.includes('test card') && (
              <p className="mt-1 text-dark-500 dark:text-dark-400">
                For testing, use these card numbers:
                <ul className="mt-1 list-disc list-inside">
                  <li>Success: 4242 4242 4242 4242</li>
                  <li>Requires authentication: 4000 0025 0000 3155</li>
                  <li>Payment fails: 4000 0000 0000 0002</li>
                </ul>
                <span className="block mt-1">Use any future expiry date and any CVC.</span>
              </p>
            )}
          </div>
        </div>
      )}

      <Button
        type="submit"
        fullWidth
        size="lg"
        isLoading={isProcessing}
        disabled={!stripe || isProcessing}
        leftIcon={<Lock className="h-5 w-5" />}
      >
        {isProcessing ? 'Processing...' : `Pay $${total.toFixed(2)} Securely`}
      </Button>

      <div className="text-center space-y-2">
        <div className="text-sm text-dark-500 dark:text-dark-400 flex items-center justify-center gap-2">
          <Lock className="h-4 w-4" />
          Secure 256-bit SSL encryption
        </div>
        <div className="flex items-center justify-center gap-4">
          <img src="https://www.pngall.com/wp-content/uploads/2017/05/Visa-Logo-PNG-Pic.png" alt="Visa" className="h-6 opacity-50" />
          <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/b/b7/MasterCard_Logo.svg/1280px-MasterCard_Logo.svg.png" alt="Mastercard" className="h-6 opacity-50" />
          <img src="https://static-00.iconduck.com/assets.00/amex-icon-2048x1286-jssggdy1.png" alt="Amex" className="h-6 opacity-50" />
        </div>
      </div>
    </form>
  );
};

export const CheckoutPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [promoCode, setPromoCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [showOrderSummary, setShowOrderSummary] = useState(true);
  const [isApplyingPromo, setIsApplyingPromo] = useState(false);
  const [showFeatures, setShowFeatures] = useState(true);
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  const item: CheckoutItem = location.state?.item || {
    name: 'Pro Plan',
    description: 'Annual subscription',
    price: 290,
    billingPeriod: 'yearly'
  };

  // This would come from your backend in a real app
  const stripePriceId = 'price_1RVYNb2LAZDhQpmh9r7lBGbE7'; // Replace with actual Stripe price ID

  const TAX_RATE = 0.08;
  const subtotal = item.price;
  const taxAmount = (subtotal - discount) * TAX_RATE;
  const total = subtotal - discount + taxAmount;

  // Initialize payment intent when component loads
  useEffect(() => {
    const initializePaymentIntent = async () => {
      if (!user) return;
      
      try {
        const { clientSecret: secret, priceId: actualPriceId } = await createPaymentIntent(
          stripePriceId,
          promoCode || undefined
        );
        setClientSecret(secret);
        
        // Update the price ID if it's different from what we sent
        if (actualPriceId && actualPriceId !== stripePriceId) {
          console.log(`Using actual price ID: ${actualPriceId}`);
          // We could update the stripePriceId state here if needed
        }
      } catch (error) {
        console.error('Error initializing payment:', error);
        toast.error('Failed to initialize payment. Please try again.');
      }
    };

    initializePaymentIntent();
  }, [user, promoCode]);

  const handlePromoCode = async () => {
    setIsApplyingPromo(true);
    try {
      const result = await validatePromoCode(promoCode);
      
      if (result) {
        if (result.discountPercent) {
          setDiscount(subtotal * (result.discountPercent / 100));
          toast.success(`${result.discountPercent}% discount applied successfully!`);
        } else if (result.discountAmount) {
          setDiscount(result.discountAmount);
          toast.success(`${result.discountAmount} discount applied successfully!`);
        }
        
        // Reinitialize payment intent with promo code
        const { clientSecret: secret } = await createPaymentIntent(
          stripePriceId,
          promoCode
        );
        setClientSecret(secret);
      } else {
        throw new Error('Invalid promo code');
      }
    } catch (error) {
      toast.error('Invalid promo code. Please try again.');
    } finally {
      setIsApplyingPromo(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-950">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-dark-600 dark:text-dark-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors mb-4"
            >
              <ArrowLeft className="h-5 w-5" />
              Back
            </button>
            <h1 className="text-3xl font-display font-bold text-dark-900 dark:text-white mb-2">
              Complete Your Purchase
            </h1>
            <p className="text-dark-600 dark:text-dark-400">
              You're just one step away from unlocking premium features
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Payment Section */}
            <div className="space-y-6">
              {paymentStatus === 'idle' ? (
                <>
                  <Card className="p-6">
                    <h2 className="text-xl font-semibold text-dark-900 dark:text-white mb-6 flex items-center gap-2">
                      <CreditCard className="h-5 w-5" />
                      Payment Details
                    </h2>
                    <Elements stripe={stripePromise}>
                      <PaymentForm
                        total={total}
                        priceId={stripePriceId}
                        promoCode={promoCode || undefined}
                        onSuccess={() => setPaymentStatus('success')}
                        onError={() => setPaymentStatus('error')}
                      />
                    </Elements>
                  </Card>

                  <Card className="p-6">
                    <h2 className="text-xl font-semibold text-dark-900 dark:text-white mb-4 flex items-center gap-2">
                      <Gift className="h-5 w-5" />
                      Promo Code
                    </h2>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={promoCode}
                        onChange={(e) => setPromoCode(e.target.value)}
                        placeholder="Enter code (try WELCOME20)"
                        className="flex-1 px-4 py-2 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                      <Button
                        onClick={handlePromoCode}
                        isLoading={isApplyingPromo}
                        disabled={!promoCode}
                      >
                        Apply
                      </Button>
                    </div>
                  </Card>

                  <div className="flex items-center gap-2 text-sm text-dark-500 dark:text-dark-400">
                    <ShieldCheck className="h-5 w-5 text-success-600 dark:text-success-400" />
                    <span>Your payment information is secure and encrypted</span>
                  </div>
                </>
              ) : (
                <Card className="p-8 text-center">
                  {paymentStatus === 'success' ? (
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: "spring", duration: 0.5 }}
                    >
                      <CheckCircle2 className="h-16 w-16 text-success-600 dark:text-success-400 mx-auto mb-4" />
                      <h2 className="text-2xl font-semibold text-dark-900 dark:text-white mb-2">
                        Welcome to Pro!
                      </h2>
                      <p className="text-dark-600 dark:text-dark-400 mb-6">
                        Your payment was successful. Get ready to explore all premium features.
                      </p>
                      <div className="space-y-4">
                        <Button
                          onClick={() => navigate('/studio')}
                          size="lg"
                          leftIcon={<Sparkles className="h-5 w-5" />}
                          fullWidth
                        >
                          Start Creating
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => navigate('/profile')}
                          size="lg"
                          fullWidth
                        >
                          View Account
                        </Button>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: "spring", duration: 0.5 }}
                    >
                      <XCircle className="h-16 w-16 text-error-600 dark:text-error-400 mx-auto mb-4" />
                      <h2 className="text-2xl font-semibold text-dark-900 dark:text-white mb-2">
                        Payment Failed
                      </h2>
                      <p className="text-dark-600 dark:text-dark-400 mb-6">
                        Don't worry! No charges were made. Please try again or contact support.
                      </p>
                      <div className="space-y-4">
                        <Button
                          onClick={() => setPaymentStatus('idle')}
                          variant="outline"
                          size="lg"
                          fullWidth
                        >
                          Try Again
                        </Button>
                        <Button
                          variant="ghost"
                          onClick={() => navigate('/contact')}
                          size="lg"
                          fullWidth
                        >
                          Contact Support
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </Card>
              )}
            </div>

            {/* Order Summary & Features */}
            <div className="space-y-6">
              <Card className="p-6">
                <button
                  className="lg:hidden w-full flex items-center justify-between mb-4"
                  onClick={() => setShowOrderSummary(!showOrderSummary)}
                >
                  <span className="font-semibold text-dark-900 dark:text-white">
                    Order Summary
                  </span>
                  {showOrderSummary ? (
                    <ChevronUp className="h-5 w-5" />
                  ) : (
                    <ChevronDown className="h-5 w-5" />
                  )}
                </button>

                <AnimatePresence>
                  {(showOrderSummary || window.innerWidth >= 1024) && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="space-y-6">
                        <div className="flex items-start gap-4 pb-6 border-b border-gray-200 dark:border-dark-700">
                          <div className="h-12 w-12 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
                            <Crown className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-medium text-dark-900 dark:text-white">
                              {item.name}
                            </h3>
                            <p className="text-sm text-dark-500 dark:text-dark-400">
                              {item.description}
                            </p>
                            <div className="mt-2 flex items-center gap-2">
                              <Receipt className="h-4 w-4 text-success-600 dark:text-success-400" />
                              <span className="text-sm text-success-600 dark:text-success-400">
                                {item.billingPeriod === 'yearly' ? '2 months free' : 'Monthly billing'}
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium text-dark-900 dark:text-white">
                              ${item.price}
                            </div>
                            {item.billingPeriod === 'yearly' && (
                              <div className="text-sm text-success-600 dark:text-success-400">
                                Save 20%
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div className="flex justify-between text-dark-600 dark:text-dark-400">
                            <span>Subtotal</span>
                            <span>${subtotal.toFixed(2)}</span>
                          </div>
                          {discount > 0 && (
                            <div className="flex justify-between text-success-600 dark:text-success-400">
                              <span>Discount (20%)</span>
                              <span>-${discount.toFixed(2)}</span>
                            </div>
                          )}
                          <div className="flex justify-between text-dark-600 dark:text-dark-400">
                            <span>Tax</span>
                            <span>${taxAmount.toFixed(2)}</span>
                          </div>
                          <div className="pt-4 border-t border-gray-200 dark:border-dark-700">
                            <div className="flex justify-between text-lg font-semibold text-dark-900 dark:text-white">
                              <span>Total</span>
                              <span>${total.toFixed(2)}</span>
                            </div>
                            <div className="text-sm text-dark-500 dark:text-dark-400 mt-1">
                              {item.billingPeriod === 'yearly' ? 'Billed annually' : 'Billed monthly'}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-sm text-dark-500 dark:text-dark-400">
                          <Clock className="h-4 w-4" />
                          <span>30-day money-back guarantee</span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>

              {/* Features */}
              <Card className="p-6">
                <button
                  className="w-full flex items-center justify-between mb-4"
                  onClick={() => setShowFeatures(!showFeatures)}
                >
                  <h2 className="text-xl font-semibold text-dark-900 dark:text-white">
                    Pro Features
                  </h2>
                  {showFeatures ? (
                    <ChevronUp className="h-5 w-5" />
                  ) : (
                    <ChevronDown className="h-5 w-5" />
                  )}
                </button>

                <AnimatePresence>
                  {showFeatures && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {features.map((feature, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="flex items-start gap-3 p-4 rounded-lg bg-gray-50 dark:bg-dark-800"
                          >
                            <div className="h-8 w-8 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center text-primary-600 dark:text-primary-400">
                              {feature.icon}
                            </div>
                            <div>
                              <h3 className="font-medium text-dark-900 dark:text-white">
                                {feature.title}
                              </h3>
                              <p className="text-sm text-dark-500 dark:text-dark-400">
                                {feature.description}
                              </p>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};