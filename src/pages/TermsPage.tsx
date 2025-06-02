import React from 'react';
import { motion } from 'framer-motion';
import {
  Scale,
  Shield,
  AlertCircle,
  FileText,
  DollarSign,
  Ban,
  MessageCircle,
  Mail,
  ArrowRight
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

export const TermsPage = () => {
  const sections = [
    {
      icon: <FileText />,
      title: 'Account Terms',
      content: `By creating an account on VoiceVerse, you agree to:
        • Provide accurate and complete information
        • Maintain the security of your account
        • Accept responsibility for all activities under your account
        • Not share your account credentials`
    },
    {
      icon: <Shield />,
      title: 'Intellectual Property',
      content: `You retain rights to your content while granting us license to:
        • Host and display your content
        • Use your content for service improvement
        • Promote the platform using your public content
        We respect intellectual property rights and expect users to do the same.`
    },
    {
      icon: <DollarSign />,
      title: 'Payment Terms',
      content: `For paid services:
        • Payments are processed securely
        • Subscriptions auto-renew unless cancelled
        • Refunds are provided according to our policy
        • Prices may change with notice`
    },
    {
      icon: <Ban />,
      title: 'Prohibited Uses',
      content: `The following are prohibited:
        • Illegal or unauthorized use
        • Harassment or abuse
        • Spam or automated access
        • Reverse engineering
        • Interference with security features`
    },
    {
      icon: <Scale />,
      title: 'Liability',
      content: `VoiceVerse is provided "as is" with:
        • No warranty of service availability
        • Limited liability for damages
        • No responsibility for user content
        • Force majeure provisions`
    },
    {
      icon: <AlertCircle />,
      title: 'Termination',
      content: `We may terminate accounts that:
        • Violate these terms
        • Engage in prohibited activities
        • Remain inactive for extended periods
        Users may terminate their accounts at any time.`
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
              Terms of Service
            </h1>
            <p className="text-xl text-dark-600 dark:text-dark-400 max-w-2xl mx-auto">
              Please read these terms carefully before using VoiceVerse
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
              Welcome to VoiceVerse. By accessing or using our service, you agree
              to be bound by these Terms of Service. If you disagree with any part
              of the terms, you may not access the service.
            </p>
            <p className="text-dark-600 dark:text-dark-400">
              These Terms of Service ("Terms") govern your access to and use of
              VoiceVerse's website, products, and services. Please read these Terms
              carefully before using our services.
            </p>
          </Card>

          {/* Terms Sections */}
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

          {/* Changes to Terms */}
          <Card className="p-8 mb-8">
            <h2 className="text-2xl font-display font-bold text-dark-900 dark:text-white mb-4">
              Changes to Terms
            </h2>
            <p className="text-dark-600 dark:text-dark-400 mb-4">
              We reserve the right to modify or replace these Terms at any time.
              If a revision is material, we will provide at least 30 days' notice
              prior to any new terms taking effect.
            </p>
            <p className="text-dark-600 dark:text-dark-400">
              What constitutes a material change will be determined at our sole
              discretion. By continuing to access or use our service after any
              revisions become effective, you agree to be bound by the revised terms.
            </p>
          </Card>

          {/* Governing Law */}
          <Card className="p-8 mb-8">
            <h2 className="text-2xl font-display font-bold text-dark-900 dark:text-white mb-4">
              Governing Law
            </h2>
            <p className="text-dark-600 dark:text-dark-400">
              These Terms shall be governed and construed in accordance with the
              laws, without regard to its conflict of law provisions. Our failure
              to enforce any right or provision of these Terms will not be
              considered a waiver of those rights.
            </p>
          </Card>

          {/* Contact Section */}
          <Card className="p-8 bg-gradient-to-r from-primary-500 to-accent-500 text-white">
            <div className="text-center">
              <h2 className="text-2xl font-display font-bold mb-4">
                Questions About Our Terms?
              </h2>
              <p className="text-primary-100 mb-6">
                If you have any questions about these Terms of Service, please
                don't hesitate to contact us.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Button
                  className="bg-white text-primary-600 hover:bg-primary-50"
                  leftIcon={<Mail className="h-5 w-5" />}
                  rightIcon={<ArrowRight className="h-5 w-5" />}
                >
                  Contact Support
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