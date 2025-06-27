import { useState, useEffect } from 'react';
import { X, Settings, Check } from 'lucide-react';

interface CookiePreferences {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  functional: boolean;
}

const COOKIE_CONSENT_KEY = 'voiceverse_cookie_consent';
const COOKIE_PREFERENCES_KEY = 'voiceverse_cookie_preferences';

export const CookieConsent = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    necessary: true, // Always required
    analytics: false,
    marketing: false,
    functional: false,
  });

  useEffect(() => {
    // Check if user has already made a choice
    const hasConsent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!hasConsent) {
      setIsVisible(true);
    }

    // Load existing preferences if they exist
    const savedPreferences = localStorage.getItem(COOKIE_PREFERENCES_KEY);
    if (savedPreferences) {
      try {
        setPreferences(JSON.parse(savedPreferences));
      } catch (error) {
        console.error('Error parsing cookie preferences:', error);
      }
    }
  }, []);

  const handleAcceptAll = () => {
    const allAccepted: CookiePreferences = {
      necessary: true,
      analytics: true,
      marketing: true,
      functional: true,
    };
    
    localStorage.setItem(COOKIE_CONSENT_KEY, 'accepted');
    localStorage.setItem(COOKIE_PREFERENCES_KEY, JSON.stringify(allAccepted));
    setPreferences(allAccepted);
    setIsVisible(false);
    
    // Trigger analytics or other tracking initialization here
    initializeTracking(allAccepted);
  };

  const handleSavePreferences = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'customized');
    localStorage.setItem(COOKIE_PREFERENCES_KEY, JSON.stringify(preferences));
    setIsVisible(false);
    setShowPreferences(false);
    
    // Initialize tracking based on preferences
    initializeTracking(preferences);
  };

  const handleRejectAll = () => {
    const minimalPreferences: CookiePreferences = {
      necessary: true,
      analytics: false,
      marketing: false,
      functional: false,
    };
    
    localStorage.setItem(COOKIE_CONSENT_KEY, 'rejected');
    localStorage.setItem(COOKIE_PREFERENCES_KEY, JSON.stringify(minimalPreferences));
    setPreferences(minimalPreferences);
    setIsVisible(false);
  };

  const initializeTracking = (prefs: CookiePreferences) => {
    // Initialize analytics if accepted
    if (prefs.analytics) {
      // Add your analytics initialization code here
      console.log('Analytics tracking enabled');
    }
    
    // Initialize marketing cookies if accepted
    if (prefs.marketing) {
      // Add your marketing tracking code here
      console.log('Marketing tracking enabled');
    }
    
    // Initialize functional cookies if accepted
    if (prefs.functional) {
      // Add your functional cookies code here
      console.log('Functional cookies enabled');
    }
  };

  const handlePreferenceChange = (key: keyof CookiePreferences, value: boolean) => {
    if (key === 'necessary') return; // Necessary cookies cannot be disabled
    setPreferences(prev => ({ ...prev, [key]: value }));
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 bg-black bg-opacity-50">
      <div className="w-full max-w-2xl bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700">
        {!showPreferences ? (
          // Main consent popup
          <div className="p-6">
            <div className="flex items-start justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                We value your privacy
              </h2>
            </div>
            
            <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
              We use cookies to enhance your browsing experience, serve personalized content, 
              and analyze our traffic. By clicking "Accept All", you consent to our use of cookies. 
              You can manage your preferences or learn more about our cookie policy.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleAcceptAll}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center gap-2"
              >
                <Check size={18} />
                Accept All
              </button>
              
              <button
                onClick={() => setShowPreferences(true)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center gap-2"
              >
                <Settings size={18} />
                Manage Preferences
              </button>
              
              <button
                onClick={handleRejectAll}
                className="flex-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200"
              >
                Reject All
              </button>
            </div>
            
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-4 text-center">
              By continuing to use our site, you agree to our{' '}
              <a href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</a>
              {' '}and{' '}
              <a href="/cookies" className="text-blue-600 hover:underline">Cookie Policy</a>
            </p>
          </div>
        ) : (
          // Preferences management popup
          <div className="p-6">
            <div className="flex items-start justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Cookie Preferences
              </h2>
              <button
                onClick={() => setShowPreferences(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X size={20} />
              </button>
            </div>
            
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Choose which cookies you want to accept. You can change these settings at any time.
            </p>
            
            <div className="space-y-4 mb-6">
              {/* Necessary Cookies */}
              <div className="flex items-start justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900 dark:text-white mb-1">
                    Necessary Cookies
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Essential for the website to function properly. Cannot be disabled.
                  </p>
                </div>
                <div className="ml-4">
                  <input
                    type="checkbox"
                    checked={preferences.necessary}
                    disabled
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                  />
                </div>
              </div>
              
              {/* Analytics Cookies */}
              <div className="flex items-start justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900 dark:text-white mb-1">
                    Analytics Cookies
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Help us understand how visitors interact with our website.
                  </p>
                </div>
                <div className="ml-4">
                  <input
                    type="checkbox"
                    checked={preferences.analytics}
                    onChange={(e) => handlePreferenceChange('analytics', e.target.checked)}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                  />
                </div>
              </div>
              
              {/* Marketing Cookies */}
              <div className="flex items-start justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900 dark:text-white mb-1">
                    Marketing Cookies
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Used to deliver personalized advertisements and track campaign performance.
                  </p>
                </div>
                <div className="ml-4">
                  <input
                    type="checkbox"
                    checked={preferences.marketing}
                    onChange={(e) => handlePreferenceChange('marketing', e.target.checked)}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                  />
                </div>
              </div>
              
              {/* Functional Cookies */}
              <div className="flex items-start justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900 dark:text-white mb-1">
                    Functional Cookies
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Enable enhanced functionality and personalization features.
                  </p>
                </div>
                <div className="ml-4">
                  <input
                    type="checkbox"
                    checked={preferences.functional}
                    onChange={(e) => handlePreferenceChange('functional', e.target.checked)}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleSavePreferences}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200"
              >
                Save Preferences
              </button>
              
              <button
                onClick={handleAcceptAll}
                className="flex-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200"
              >
                Accept All
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Export utility functions for other components to use
export const getCookiePreferences = (): CookiePreferences | null => {
  const preferences = localStorage.getItem(COOKIE_PREFERENCES_KEY);
  if (preferences) {
    try {
      return JSON.parse(preferences);
    } catch (error) {
      console.error('Error parsing cookie preferences:', error);
      return null;
    }
  }
  return null;
};

export const hasCookieConsent = (): boolean => {
  return localStorage.getItem(COOKIE_CONSENT_KEY) !== null;
};

export const resetCookieConsent = (): void => {
  localStorage.removeItem(COOKIE_CONSENT_KEY);
  localStorage.removeItem(COOKIE_PREFERENCES_KEY);
};