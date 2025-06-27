import React from 'react';
import { motion } from 'framer-motion';
import {
  
  Shield,
  Settings,
  Eye,
  Globe,
  
  Lock,
  Sparkles
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { getCookiePreferences, resetCookieConsent } from '../components/common/CookieConsent';

const cookieCategories = [
  {
    icon: <Shield />,
    title: 'Essential Cookies',
    description: 'Required for basic site functionality',
    required: true,
    cookies: [
      {
        name: 'session_id',
        purpose: 'Maintains your login session',
        duration: '24 hours'
      },
      {
        name: 'csrf_token',
        purpose: 'Protects against cross-site request forgery',
        duration: 'Session'
      },
      {
        name: 'auth_token',
        purpose: 'Keeps you authenticated',
        duration: '30 days'
      }
    ]
  },
  {
    icon: <Settings />,
    title: 'Functional Cookies',
    description: 'Enhance your experience and enable features',
    required: false,
    cookies: [
      {
        name: 'language_pref',
        purpose: 'Remembers your language preference',
        duration: '1 year'
      },
      {
        name: 'theme_mode',
        purpose: 'Saves your dark/light mode preference',
        duration: '1 year'
      },
      {
        name: 'voice_settings',
        purpose: 'Stores your voice transformation preferences',
        duration: '6 months'
      }
    ]
  },
  {
    icon: <Eye />,
    title: 'Analytics Cookies',
    description: 'Help us understand how you use VoiceVerse',
    required: false,
    cookies: [
      {
        name: 'ga_id',
        purpose: 'Google Analytics tracking',
        duration: '2 years'
      },
      {
        name: 'usage_stats',
        purpose: 'Tracks feature usage patterns',
        duration: '1 year'
      },
      {
        name: 'performance_data',
        purpose: 'Monitors site performance',
        duration: '30 days'
      }
    ]
  },
  {
    icon: <Globe />,
    title: 'Marketing Cookies',
    description: 'Support our marketing and improve relevance',
    required: false,
    cookies: [
      {
        name: 'ad_preferences',
        purpose: 'Personalizes advertisements',
        duration: '6 months'
      },
      {
        name: 'campaign_ref',
        purpose: 'Tracks marketing campaign effectiveness',
        duration: '30 days'
      },
      {
        name: 'social_share',
        purpose: 'Enables social media integration',
        duration: '1 year'
      }
    ]
  }
];

export const CookiesPage = () => {
  const [cookiePreferences, setCookiePreferences] = React.useState<Record<string, boolean>>({
    functional: false,
    analytics: false,
    marketing: false
  });

  // Load existing preferences on component mount
  React.useEffect(() => {
    const existingPreferences = getCookiePreferences();
    if (existingPreferences) {
      setCookiePreferences({
        functional: existingPreferences.functional,
        analytics: existingPreferences.analytics,
        marketing: existingPreferences.marketing
      });
    }
  }, []);

  const handleToggleCookie = (category: string) => {
    setCookiePreferences(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const handleSavePreferences = () => {
    // Save cookie preferences to localStorage
    const preferences = {
      necessary: true,
      functional: cookiePreferences.functional,
      analytics: cookiePreferences.analytics,
      marketing: cookiePreferences.marketing
    };
    
    localStorage.setItem('voiceverse_cookie_consent', 'customized');
    localStorage.setItem('voiceverse_cookie_preferences', JSON.stringify(preferences));
    
    // Show success message or redirect
    alert('Cookie preferences saved successfully!');
  };

  const handleResetPreferences = () => {
    resetCookieConsent();
    setCookiePreferences({
      functional: false,
      analytics: false,
      marketing: false
    });
    // Reload page to show cookie consent popup again
    window.location.reload();
  };

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
              Cookie Policy
            </h1>
            <p className="text-xl text-dark-600 dark:text-dark-400 max-w-2xl mx-auto">
              Learn how we use cookies to enhance your experience on VoiceVerse
            </p>
          </motion.div>
        </div>

        {/* Last Updated */}
        <div className="mb-12 text-center">
          <Card className="inline-block px-6 py-3">
            <p className="text-dark-600 dark:text-dark-400">
              Last Updated: March 1, 2024
            </p>
          </Card>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto">
          {/* Introduction */}
          <Card className="p-8 mb-8">
            <h2 className="text-2xl font-display font-bold text-dark-900 dark:text-white mb-4">
              About Cookies
            </h2>
            <p className="text-dark-600 dark:text-dark-400 mb-4">
              Cookies are small text files that are placed on your device when you visit
              our website. They help us provide you with a better experience by
              remembering your preferences, analyzing site usage, and assisting with
              our marketing efforts.
            </p>
            <p className="text-dark-600 dark:text-dark-400">
              We use different types of cookies for various purposes. Some are essential
              for the website to function properly, while others help us improve our
              services and your experience.
            </p>
          </Card>

          {/* Cookie Categories */}
          <div className="space-y-6 mb-12">
            {cookieCategories.map((category, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg text-primary-600 dark:text-primary-400 flex-shrink-0">
                      {category.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-4 mb-4">
                        <div>
                          <h3 className="text-xl font-semibold text-dark-900 dark:text-white mb-1">
                            {category.title}
                          </h3>
                          <p className="text-dark-600 dark:text-dark-400">
                            {category.description}
                          </p>
                        </div>
                        {!category.required && (
                          <button
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
                              cookiePreferences[category.title.toLowerCase().split(' ')[0]]
                                ? 'bg-primary-600'
                                : 'bg-gray-200 dark:bg-dark-700'
                            }`}
                            onClick={() => handleToggleCookie(category.title.toLowerCase().split(' ')[0])}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                cookiePreferences[category.title.toLowerCase().split(' ')[0]]
                                  ? 'translate-x-6'
                                  : 'translate-x-1'
                              }`}
                            />
                          </button>
                        )}
                      </div>

                      <div className="space-y-3">
                        {category.cookies.map((cookie, cookieIndex) => (
                          <div
                            key={cookieIndex}
                            className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-dark-800 rounded-lg"
                          >
                            <div className="flex-1">
                              <div className="font-medium text-dark-900 dark:text-white mb-1">
                                {cookie.name}
                              </div>
                              <div className="text-sm text-dark-600 dark:text-dark-400">
                                {cookie.purpose}
                              </div>
                            </div>
                            <div className="text-sm text-dark-500 dark:text-dark-400">
                              Duration: {cookie.duration}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Additional Information */}
          <Card className="p-8 mb-8">
            <h2 className="text-2xl font-display font-bold text-dark-900 dark:text-white mb-4">
              Managing Cookies
            </h2>
            <p className="text-dark-600 dark:text-dark-400 mb-4">
              Most web browsers allow you to control cookies through their settings.
              You can usually find these settings in the "options" or "preferences"
              menu of your browser.
            </p>
            <p className="text-dark-600 dark:text-dark-400">
              Please note that disabling certain cookies may impact the functionality
              of our website. Essential cookies cannot be disabled as they are
              necessary for the website to work properly.
            </p>
          </Card>

          {/* Save Preferences */}
          <Card className="p-8 bg-gradient-to-r from-primary-500 to-accent-500 text-white">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <h2 className="text-2xl font-display font-bold mb-2">
                  Cookie Preferences
                </h2>
                <p className="text-primary-100">
                  Your choices will be saved and can be updated at any time
                </p>
              </div>
              <div className="flex gap-4">
                <Button
                  className="bg-white text-primary-600 hover:bg-primary-50"
                  leftIcon={<Sparkles className="h-5 w-5" />}
                  onClick={handleSavePreferences}
                >
                  Save Preferences
                </Button>
                <Button
                  variant="outline"
                  className="border-white text-white hover:bg-white/10"
                  leftIcon={<Lock className="h-5 w-5" />}
                  onClick={handleResetPreferences}
                >
                  Reset Preferences
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};