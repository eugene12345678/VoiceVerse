import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Moon,
  Sun,
  Bell,
  Lock,
  Eye,
  MessageSquare,
  Volume2,
  Languages,
  Accessibility,
  Trash2,
  LogOut
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useThemeStore } from '../store/themeStore';
import { useAuthStore } from '../store/authStore';

interface SettingsSectionProps {
  title: string;
  children: React.ReactNode;
}

const SettingsSection: React.FC<SettingsSectionProps> = ({ title, children }) => (
  <div className="mb-8">
    <h2 className="text-xl font-semibold text-dark-900 dark:text-white mb-4">
      {title}
    </h2>
    <Card className="p-6">{children}</Card>
  </div>
);

interface ToggleSettingProps {
  icon: React.ReactNode;
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

const ToggleSetting: React.FC<ToggleSettingProps> = ({
  icon,
  label,
  description,
  checked,
  onChange
}) => (
  <div className="flex items-start justify-between py-3">
    <div className="flex items-start gap-3">
      <div className="text-dark-500 dark:text-dark-400 mt-1">{icon}</div>
      <div>
        <div className="font-medium text-dark-900 dark:text-white">{label}</div>
        {description && (
          <div className="text-sm text-dark-500 dark:text-dark-400">
            {description}
          </div>
        )}
      </div>
    </div>
    <button
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
        checked ? 'bg-primary-600' : 'bg-gray-200 dark:bg-dark-700'
      }`}
      onClick={() => onChange(!checked)}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  </div>
);

export const SettingsPage = () => {
  const { theme, setTheme } = useThemeStore();
  const { logout } = useAuthStore();
  
  const [settings, setSettings] = useState({
    notifications: {
      likes: true,
      comments: true,
      follows: true,
      mentions: true,
      challenges: true,
      nfts: true
    },
    privacy: {
      profileVisibility: 'public',
      messagePermission: 'followers',
      dataUsage: true
    },
    accessibility: {
      reducedMotion: false,
      highContrast: false,
      largeText: false
    }
  });

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme);
  };

  const handleNotificationToggle = (key: keyof typeof settings.notifications) => {
    setSettings(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [key]: !prev.notifications[key]
      }
    }));
  };

  const handleAccessibilityToggle = (key: keyof typeof settings.accessibility) => {
    setSettings(prev => ({
      ...prev,
      accessibility: {
        ...prev.accessibility,
        [key]: !prev.accessibility[key]
      }
    }));
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-display font-bold text-dark-900 dark:text-white mb-8">
          Settings
        </h1>

        <SettingsSection title="Theme">
          <div className="flex gap-4">
            <Button
              variant={theme === 'light' ? 'primary' : 'outline'}
              onClick={() => handleThemeChange('light')}
              leftIcon={<Sun className="h-5 w-5" />}
            >
              Light
            </Button>
            <Button
              variant={theme === 'dark' ? 'primary' : 'outline'}
              onClick={() => handleThemeChange('dark')}
              leftIcon={<Moon className="h-5 w-5" />}
            >
              Dark
            </Button>
            <Button
              variant={theme === 'system' ? 'primary' : 'outline'}
              onClick={() => handleThemeChange('system')}
            >
              System
            </Button>
          </div>
        </SettingsSection>

        <SettingsSection title="Notifications">
          <div className="space-y-2">
            <ToggleSetting
              icon={<Bell className="h-5 w-5" />}
              label="Likes"
              description="When someone likes your voice"
              checked={settings.notifications.likes}
              onChange={() => handleNotificationToggle('likes')}
            />
            <ToggleSetting
              icon={<MessageSquare className="h-5 w-5" />}
              label="Comments"
              description="When someone comments on your voice"
              checked={settings.notifications.comments}
              onChange={() => handleNotificationToggle('comments')}
            />
          </div>
        </SettingsSection>

        <SettingsSection title="Privacy">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-2">
                Profile Visibility
              </label>
              <select
                className="w-full px-3 py-2 bg-white dark:bg-dark-800 border border-gray-300 dark:border-dark-700 rounded-lg shadow-sm"
                value={settings.privacy.profileVisibility}
                onChange={(e) =>
                  setSettings(prev => ({
                    ...prev,
                    privacy: {
                      ...prev.privacy,
                      profileVisibility: e.target.value
                    }
                  }))
                }
              >
                <option value="public">Public</option>
                <option value="followers">Followers Only</option>
                <option value="private">Private</option>
              </select>
            </div>
            <ToggleSetting
              icon={<Eye className="h-5 w-5" />}
              label="Data Usage"
              description="Allow us to collect usage data to improve your experience"
              checked={settings.privacy.dataUsage}
              onChange={(checked) =>
                setSettings(prev => ({
                  ...prev,
                  privacy: { ...prev.privacy, dataUsage: checked }
                }))
              }
            />
          </div>
        </SettingsSection>

        <SettingsSection title="Accessibility">
          <div className="space-y-2">
            <ToggleSetting
              icon={<Accessibility className="h-5 w-5" />}
              label="Reduced Motion"
              description="Minimize animations throughout the app"
              checked={settings.accessibility.reducedMotion}
              onChange={() => handleAccessibilityToggle('reducedMotion')}
            />
            <ToggleSetting
              icon={<Eye className="h-5 w-5" />}
              label="High Contrast"
              description="Increase contrast for better visibility"
              checked={settings.accessibility.highContrast}
              onChange={() => handleAccessibilityToggle('highContrast')}
            />
          </div>
        </SettingsSection>

        <SettingsSection title="Account">
          <div className="space-y-4">
            <Button
              variant="outline"
              className="w-full justify-start text-error-600 dark:text-error-400 hover:bg-error-50 dark:hover:bg-error-900/30"
              leftIcon={<Trash2 className="h-5 w-5" />}
            >
              Delete Account
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              leftIcon={<LogOut className="h-5 w-5" />}
              onClick={() => logout()}
            >
              Log Out
            </Button>
          </div>
        </SettingsSection>
      </div>
    </div>
  );
}