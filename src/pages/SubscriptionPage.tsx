import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Crown,
  Check,
  X,
  CreditCard,
  Zap,
  Star,
  Award,
  Users,
  Globe,
  Shield,
  Sparkles,
  ChevronDown,
  MessageCircle,
  Building2,
  ArrowRight,
  TrendingUp
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { formatNumber } from '../lib/utils';

const plans = [
  {
    name: 'Free',
    price: 0,
    description: 'Perfect for trying out VoiceVerse',
    features: [
      'Basic voice transformations',
      '5 voice generations per day',
      'Standard quality audio',
      'Community support',
      'Basic analytics'
    ],
    limitations: [
      'Limited voice models',
      'No commercial usage',
      'Basic effects only',
      'No API access'
    ]
  },
  {
    name: 'Pro',
    price: 29,
    description: 'For professional creators and artists',
    features: [
      'Unlimited voice transformations',
      'Advanced voice models',
      'HD audio quality',
      'Priority processing',
      'Advanced analytics',
      'Commercial license',
      'API access (10K calls/month)',
      'Premium effects library',
      'Custom voice training',
      'Email support'
    ],
    popular: true
  },
  {
    name: 'Enterprise',
    price: null,
    description: 'Custom solutions for large organizations',
    features: [
      'Custom voice model development',
      'Unlimited everything',
      'Dedicated support team',
      'SLA guarantees',
      'Custom API integration',
      'On-premise deployment option',
      'Advanced security features',
      'Custom analytics dashboard',
      'Training sessions',
      'Account manager'
    ]
  }
];

const testimonials = [
  {
    name: 'Sarah Johnson',
    role: 'Voice Actor',
    avatar: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=600',
    content: 'VoiceVerse has revolutionized my workflow. The voice transformations are incredibly natural, and the Pro features are worth every penny.',
    rating: 5
  },
  {
    name: 'David Chen',
    role: 'Content Creator',
    avatar: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=600',
    content: 'The quality of voice transformations is unmatched. I use it daily for my YouTube content, and my audience loves it!',
    rating: 5
  },
  {
    name: 'Tech Innovations Inc.',
    role: 'Enterprise Client',
    avatar: 'https://images.pexels.com/photos/3182834/pexels-photo-3182834.jpeg?auto=compress&cs=tinysrgb&w=600',
    content: 'VoiceVerse Enterprise solution has helped us scale our voice AI operations efficiently. The custom models are exceptional.',
    rating: 5
  }
];

const stats = [
  { label: 'Active Users', value: 100000, icon: <Users className="h-5 w-5" /> },
  { label: 'Voice Transformations', value: 5000000, icon: <Zap className="h-5 w-5" /> },
  { label: 'Countries', value: 150, icon: <Globe className="h-5 w-5" /> },
  { label: 'Enterprise Clients', value: 500, icon: <Building2 className="h-5 w-5" /> }
];

const faqs = [
  {
    question: 'What payment methods do you accept?',
    answer: 'We accept all major credit cards (Visa, MasterCard, American Express), PayPal, and cryptocurrency (Bitcoin, Ethereum).'
  },
  {
    question: 'Can I switch between plans?',
    answer: 'Yes, you can upgrade or downgrade your plan at any time. The changes will take effect on your next billing cycle.'
  },
  {
    question: 'Is there a free trial for Pro features?',
    answer: 'Yes, we offer a 14-day free trial of our Pro plan with full access to all features. No credit card required.'
  },
  {
    question: 'What happens if I exceed my API quota?',
    answer: 'You\'ll receive notifications as you approach your limit. You can purchase additional API calls or upgrade your plan for more quota.'
  },
  {
    question: 'Do you offer refunds?',
    answer: 'Yes, we offer a 30-day money-back guarantee if you\'re not satisfied with our service.'
  },
  {
    question: 'What kind of support do you provide?',
    answer: 'Free users get community support, Pro users receive email support with 24-hour response time, and Enterprise clients get dedicated support with custom SLAs.'
  }
];

interface PlanCardProps {
  plan: typeof plans[0];
  isAnnual: boolean;
}

const PlanCard: React.FC<PlanCardProps> = ({ plan, isAnnual }) => {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    if (plan.price === null) {
      // For Enterprise plan, redirect to contact
      return;
    }

    // Calculate annual price with 2 months free
    const annualPrice = isAnnual ? plan.price * 10 : plan.price;

    navigate('/checkout', {
      state: {
        item: {
          name: `${plan.name} Plan`,
          description: `${isAnnual ? 'Annual' : 'Monthly'} subscription`,
          price: annualPrice,
          billingPeriod: isAnnual ? 'yearly' : 'monthly'
        }
      }
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="h-full"
    >
      <Card className={`p-6 h-full flex flex-col relative ${
        plan.popular ? 'border-primary-500 dark:border-primary-400' : ''
      }`}>
        {plan.popular && (
          <div className="absolute -top-4 left-1/2 -translate-x-1/2">
            <span className="bg-primary-500 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
              <Star className="h-4 w-4" />
              Most Popular
            </span>
          </div>
        )}

        <div className="mb-6">
          <h3 className="text-2xl font-display font-bold text-dark-900 dark:text-white mb-2 flex items-center gap-2">
            {plan.name}
            {plan.name === 'Pro' && <Crown className="h-5 w-5 text-primary-500" />}
          </h3>
          <p className="text-dark-600 dark:text-dark-400">
            {plan.description}
          </p>
        </div>

        <div className="mb-6">
          {plan.price !== null ? (
            <div className="flex items-baseline">
              <span className="text-4xl font-bold text-dark-900 dark:text-white">
                ${isAnnual ? plan.price * 10 : plan.price}
              </span>
              <span className="text-dark-600 dark:text-dark-400 ml-2">
                /{isAnnual ? 'year' : 'month'}
              </span>
            </div>
          ) : (
            <div className="text-2xl font-bold text-dark-900 dark:text-white">
              Custom Pricing
            </div>
          )}
          {isAnnual && plan.price !== null && (
            <div className="text-success-600 dark:text-success-400 text-sm mt-2">
              Save ${plan.price * 2} annually
            </div>
          )}
        </div>

        <div className="flex-1">
          <h4 className="font-medium text-dark-900 dark:text-white mb-4">
            Features included:
          </h4>
          <ul className="space-y-3 mb-6">
            {plan.features.map((feature, index) => (
              <li key={index} className="flex items-start gap-2">
                <Check className="h-5 w-5 text-success-500 flex-shrink-0 mt-0.5" />
                <span className="text-dark-600 dark:text-dark-400">
                  {feature}
                </span>
              </li>
            ))}
            {plan.limitations && (
              <>
                <li className="pt-2 border-t border-gray-200 dark:border-dark-700" />
                {plan.limitations.map((limitation, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <X className="h-5 w-5 text-error-500 flex-shrink-0 mt-0.5" />
                    <span className="text-dark-600 dark:text-dark-400">
                      {limitation}
                    </span>
                  </li>
                ))}
              </>
            )}
          </ul>
        </div>

        <Button
          variant={plan.popular ? 'primary' : 'outline'}
          fullWidth
          leftIcon={plan.name === 'Enterprise' ? <MessageCircle className="h-5 w-5" /> : <CreditCard className="h-5 w-5" />}
          onClick={handleGetStarted}
        >
          {plan.price !== null ? 'Get Started' : 'Contact Sales'}
        </Button>
      </Card>
    </motion.div>
  );
};

export const SubscriptionPage = () => {
  const [isAnnual, setIsAnnual] = useState(true);
  const [selectedFaq, setSelectedFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-gradient-mesh dark:bg-dark-950">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-4xl md:text-5xl font-display font-bold text-dark-900 dark:text-white mb-4">
              Choose Your Plan
            </h1>
            <p className="text-xl text-dark-600 dark:text-dark-400 max-w-2xl mx-auto">
              Transform your voice with our powerful AI technology.
              Select the plan that best fits your needs.
            </p>
          </motion.div>
        </div>

        {/* Billing Toggle */}
        <div className="flex justify-center mb-12">
          <div className="bg-white dark:bg-dark-800 rounded-full p-1 shadow-lg">
            <div className="relative flex">
              <button
                className={`px-6 py-2 rounded-full text-sm font-medium transition-colors relative z-10 ${
                  !isAnnual
                    ? 'text-dark-900 dark:text-white'
                    : 'text-dark-500 dark:text-dark-400'
                }`}
                onClick={() => setIsAnnual(false)}
              >
                Monthly
              </button>
              <button
                className={`px-6 py-2 rounded-full text-sm font-medium transition-colors relative z-10 ${
                  isAnnual
                    ? 'text-dark-900 dark:text-white'
                    : 'text-dark-500 dark:text-dark-400'
                }`}
                onClick={() => setIsAnnual(true)}
              >
                Annual
              </button>
              <motion.div
                className="absolute inset-0 z-0"
                initial={false}
                animate={{
                  x: isAnnual ? '100%' : '0%',
                  width: '50%'
                }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              >
                <div className="w-full h-full bg-primary-100 dark:bg-primary-900/30 rounded-full" />
              </motion.div>
            </div>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {plans.map((plan) => (
            <PlanCard
              key={plan.name}
              plan={plan}
              isAnnual={isAnnual}
            />
          ))}
        </div>

        {/* Stats Section */}
        <div className="mb-16">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-display font-bold text-dark-900 dark:text-white mb-4">
              Trusted by Creators Worldwide
            </h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="p-6 text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 mb-4">
                    {stat.icon}
                  </div>
                  <div className="text-2xl font-bold text-dark-900 dark:text-white mb-2">
                    {formatNumber(stat.value)}
                  </div>
                  <div className="text-dark-600 dark:text-dark-400">
                    {stat.label}
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Testimonials */}
        <div className="mb-16">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-display font-bold text-dark-900 dark:text-white mb-4">
              What Our Users Say
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <img
                      src={testimonial.avatar}
                      alt={testimonial.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div>
                      <div className="font-medium text-dark-900 dark:text-white">
                        {testimonial.name}
                      </div>
                      <div className="text-dark-500 dark:text-dark-400 text-sm">
                        {testimonial.role}
                      </div>
                    </div>
                  </div>
                  <p className="text-dark-600 dark:text-dark-400 mb-4">
                    {testimonial.content}
                  </p>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: testimonial.rating }).map((_, i) => (
                      <Star
                        key={i}
                        className="h-5 w-5 text-warning-500 fill-current"
                      />
                    ))}
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Enterprise Section */}
        <div className="mb-16">
          <Card className="p-8 md:p-12">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div>
                <h2 className="text-2xl md:text-3xl font-display font-bold text-dark-900 dark:text-white mb-4">
                  Enterprise Solutions
                </h2>
                <p className="text-dark-600 dark:text-dark-400 mb-6">
                  Looking for a custom solution? We offer enterprise-grade voice AI
                  technology with dedicated support and custom features.
                </p>
                <ul className="space-y-4 mb-8">
                  {[
                    'Custom voice model development',
                    'Dedicated support team',
                    'Custom API integration',
                    'Advanced security features',
                    'Training sessions'
                  ].map((feature, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <Shield className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                      <span className="text-dark-600 dark:text-dark-400">
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
                <Link to="/contact">
                 <Button
                  size="lg"
                  leftIcon={<Building2 className="h-5 w-5" />}
                  rightIcon={<ArrowRight className="h-5 w-5" />}
                 >
                  Contact Enterprise Sales
                 </Button>
                </Link>
              </div>
              <div className="relative">
                <img
                  src="https://images.pexels.com/photos/3182834/pexels-photo-3182834.jpeg?auto=compress&cs=tinysrgb&w=600"
                  alt="Enterprise"
                  className="rounded-xl shadow-xl"
                />
                <div className="absolute -bottom-4 -right-4 bg-white dark:bg-dark-800 p-4 rounded-lg shadow-lg">
                  <div className="flex items-center gap-2 text-success-600 dark:text-success-400">
                    <TrendingUp className="h-5 w-5" />
                    <span className="font-medium">99.9% Uptime SLA</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* FAQs */}
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-display font-bold text-dark-900 dark:text-white mb-4">
              Frequently Asked Questions
            </h2>
          </div>
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <Card
                key={index}
                className="overflow-hidden transition-colors hover:border-primary-500 dark:hover:border-primary-400"
              >
                <button
                  className="w-full text-left p-6"
                  onClick={() => setSelectedFaq(selectedFaq === index ? null : index)}
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-dark-900 dark:text-white">
                      {faq.question}
                    </h3>
                    <ChevronDown
                      className={`h-5 w-5 text-dark-500 transition-transform ${
                        selectedFaq === index ? 'rotate-180' : ''
                      }`}
                    />
                  </div>
                  <AnimatePresence>
                    {selectedFaq === index && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <p className="mt-4 text-dark-600 dark:text-dark-400">
                          {faq.answer}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </button>
              </Card>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-16 text-center">
          <Card className="p-8 md:p-12 bg-gradient-to-r from-primary-500 to-accent-500 text-white">
            <h2 className="text-2xl md:text-3xl font-display font-bold mb-4">
              Ready to Transform Your Voice?
            </h2>
            <p className="text-primary-100 mb-8 max-w-2xl mx-auto">
              Join thousands of creators using VoiceVerse to bring their voice projects to life.
              Start your journey today with our 14-day free trial.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button
                size="lg"
                className="bg-white text-primary-600 hover:bg-primary-50"
                leftIcon={<Sparkles className="h-5 w-5" />}
              >
                Start Free Trial
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="border-white text-white hover:bg-white/10"
                leftIcon={<MessageCircle className="h-5 w-5" />}
              >
                Talk to Sales
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};