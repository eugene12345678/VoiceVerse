
import { motion } from 'framer-motion';
import {
  Shield,
  Lock,
  Eye,
  
 
  Globe,
  UserCheck,
  Trash2,
  Mail,
  MessageCircle
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

export const PrivacyPage = () => {
  const sections = [
    {
      icon: <Shield />,
      title: 'Data Collection',
      content: `We collect information that you provide directly to us, including:
        • Account information (name, email, password)
        • Voice recordings and transformations
        • Usage data and analytics
        • Payment information (handled securely by our payment processors)`
    },
    {
      icon: <Lock />,
      title: 'Data Security',
      content: `We implement industry-standard security measures:
        • End-to-end encryption for voice data
        • Secure data storage and transmission
        • Regular security audits and updates
        • Multi-factor authentication options`
    },
    {
      icon: <Eye />,
      title: 'Data Usage',
      content: `Your data is used for:
        • Providing and improving our services
        • Personalizing your experience
        • Processing voice transformations
        • Analytics and service optimization`
    },
    {
      icon: <Globe />,
      title: 'Data Sharing',
      content: `We may share your information with:
        • Service providers and partners
        • Legal authorities when required
        • Other users (only public profile information)
        We never sell your personal data.`
    },
    {
      icon: <UserCheck />,
      title: 'Your Rights',
      content: `You have the right to:
        • Access your personal data
        • Request data correction
        • Delete your account
        • Export your data
        • Opt-out of marketing communications`
    },
    {
      icon: <Trash2 />,
      title: 'Data Retention',
      content: `We retain your data for:
        • As long as your account is active
        • Legal compliance purposes
        • Backup and recovery
        You can request data deletion at any time.`
    }
  ];

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
              Privacy Policy
            </h1>
            <p className="text-xl text-dark-600 dark:text-dark-400 max-w-2xl mx-auto">
              Your privacy is important to us. Learn how we collect, use, and
              protect your data.
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
              Introduction
            </h2>
            <p className="text-dark-600 dark:text-dark-400 mb-4">
              Welcome to VoiceVerse's Privacy Policy. This policy describes how we
              collect, use, and handle your personal information when you use our
              services. We are committed to protecting your privacy and ensuring
              the security of your data.
            </p>
            <p className="text-dark-600 dark:text-dark-400">
              By using VoiceVerse, you agree to the collection and use of
              information in accordance with this policy. We will not use or share
              your information with anyone except as described in this Privacy
              Policy.
            </p>
          </Card>

          {/* Privacy Sections */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            {sections.map((section, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="p-6 h-full">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg text-primary-600 dark:text-primary-400">
                      {section.icon}
                    </div>
                    <h3 className="text-xl font-semibold text-dark-900 dark:text-white">
                      {section.title}
                    </h3>
                  </div>
                  <p className="text-dark-600 dark:text-dark-400 whitespace-pre-line">
                    {section.content}
                  </p>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Additional Information */}
          <Card className="p-8 mb-8">
            <h2 className="text-2xl font-display font-bold text-dark-900 dark:text-white mb-4">
              Changes to This Policy
            </h2>
            <p className="text-dark-600 dark:text-dark-400 mb-4">
              We may update our Privacy Policy from time to time. We will notify
              you of any changes by posting the new Privacy Policy on this page
              and updating the "Last Updated" date at the top of this policy.
            </p>
            <p className="text-dark-600 dark:text-dark-400">
              You are advised to review this Privacy Policy periodically for any
              changes. Changes to this Privacy Policy are effective when they are
              posted on this page.
            </p>
          </Card>

          {/* Contact Section */}
          <Card className="p-8 bg-gradient-to-r from-primary-500 to-accent-500 text-white">
            <div className="text-center">
              <h2 className="text-2xl font-display font-bold mb-4">
                Questions About Our Privacy Policy?
              </h2>
              <p className="text-primary-100 mb-6">
                If you have any questions about this Privacy Policy, please
                contact us. We're here to help!
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Button
                  className="bg-white text-primary-600 hover:bg-primary-50"
                  leftIcon={<Mail className="h-5 w-5" />}
                >
                  Email Us
                </Button>
                <Button
                  variant="outline"
                  className="border-white text-white hover:bg-white/10"
                  leftIcon={<MessageCircle className="h-5 w-5" />}
                >
                  Live Chat
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};