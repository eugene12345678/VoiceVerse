import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageCircle,
  Mail,
  Phone,
  Globe,
  Send,
  Clock,
  HelpCircle,
  MessageSquare,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Video,
  Calendar,
  Users,
  Bot,
  Headphones,
  BarChart,
  Zap,
  Star,
  Shield,
  Building2
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Avatar } from '../components/ui/Avatar';

const contactSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  subject: z.string().min(5, 'Subject must be at least 5 characters'),
  message: z.string().min(20, 'Message must be at least 20 characters'),
  priority: z.enum(['low', 'medium', 'high']),
  type: z.enum(['general', 'technical', 'billing', 'other']),
  attachments: z.any().optional()
});

type ContactFormData = z.infer<typeof contactSchema>;

const supportHours = [
  { day: 'Monday - Friday', hours: '9:00 AM - 6:00 PM EST' },
  { day: 'Saturday', hours: '10:00 AM - 4:00 PM EST' },
  { day: 'Sunday', hours: 'Closed' }
];

const commonQuestions = [
  {
    question: 'How do I reset my password?',
    answer: 'You can reset your password by clicking the "Forgot Password" link on the login page. Follow the instructions sent to your email to create a new password.'
  },
  {
    question: 'How long does it take to process a refund?',
    answer: 'Refunds are typically processed within 3-5 business days. The time it takes for the funds to appear in your account may vary depending on your payment method and bank.'
  },
  {
    question: 'Can I change my subscription plan?',
    answer: 'Yes, you can change your subscription plan at any time. Go to Settings > Subscription to upgrade, downgrade, or cancel your plan. Changes will take effect on your next billing cycle.'
  }
];

const supportTeam = [
  {
    name: 'Sarah Johnson',
    role: 'Customer Success Lead',
    avatar: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=600',
    status: 'online'
  },
  {
    name: 'David Chen',
    role: 'Technical Support',
    avatar: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=600',
    status: 'online'
  },
  {
    name: 'Emma Wilson',
    role: 'Billing Specialist',
    avatar: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=600',
    status: 'away'
  }
];

const supportStats = [
  { label: 'Avg. Response Time', value: '< 2 hours', icon: <Zap /> },
  { label: 'Customer Satisfaction', value: '98%', icon: <Star /> },
  { label: 'Resolution Rate', value: '95%', icon: <CheckCircle2 /> },
  { label: 'Active Users', value: '50K+', icon: <Users /> }
];

export const ContactPage = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [selectedSupport, setSelectedSupport] = useState<'chat' | 'call' | 'video' | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { register, handleSubmit, formState: { errors }, reset, watch } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      priority: 'medium',
      type: 'general'
    }
  });

  const onSubmit = async (data: ContactFormData) => {
    setIsSubmitting(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      console.log('Form submitted:', data);
      setSubmitSuccess(true);
      reset();
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileClick = () => {
    fileInputRef.current?.click();
  };

  const files = watch('attachments');
  const fileList = files ? Array.from(files as FileList) : [];

  return (
    <div className="min-h-screen bg-gradient-mesh dark:bg-dark-950">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="text-4xl md:text-5xl font-display font-bold text-dark-900 dark:text-white mb-4">
                We're Here to Help
              </h1>
              <p className="text-xl text-dark-600 dark:text-dark-400 max-w-2xl mx-auto">
                Get in touch with our support team through multiple channels.
                We're available 24/7 to assist you with any questions or concerns.
              </p>
            </motion.div>
          </div>

          {/* Support Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
            {supportStats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="p-6 text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 mb-4">
                    {stat.icon}
                  </div>
                  <div className="text-2xl font-bold text-dark-900 dark:text-white mb-2">
                    {stat.value}
                  </div>
                  <div className="text-dark-600 dark:text-dark-400">
                    {stat.label}
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Support Options */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
            {[
              {
                icon: <MessageSquare className="h-6 w-6" />,
                title: 'Live Chat',
                description: 'Chat with our support team in real-time',
                action: 'Start Chat',
                type: 'chat' as const
              },
              {
                icon: <Phone className="h-6 w-6" />,
                title: 'Phone Support',
                description: 'Get immediate assistance over the phone',
                action: 'Request Call',
                type: 'call' as const
              },
              {
                icon: <Video className="h-6 w-6" />,
                title: 'Video Call',
                description: 'Schedule a video call with our experts',
                action: 'Book Meeting',
                type: 'video' as const
              }
            ].map((option, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card 
                  className="p-6 text-center cursor-pointer transition-all hover:border-primary-500 dark:hover:border-primary-400"
                  onClick={() => setSelectedSupport(option.type)}
                >
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 mb-4">
                    {option.icon}
                  </div>
                  <h3 className="text-lg font-semibold text-dark-900 dark:text-white mb-2">
                    {option.title}
                  </h3>
                  <p className="text-dark-600 dark:text-dark-400 mb-4">
                    {option.description}
                  </p>
                  <Button variant="outline">
                    {option.action}
                  </Button>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Support Team */}
          <div className="mb-16">
            <Card className="p-8">
              <h2 className="text-2xl font-display font-bold text-dark-900 dark:text-white mb-6">
                Meet Our Support Team
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {supportTeam.map((member, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className="text-center"
                  >
                    <Avatar
                      src={member.avatar}
                      alt={member.name}
                      size="xl"
                      status={member.status as any}
                      className="mx-auto mb-4"
                    />
                    <h3 className="font-semibold text-dark-900 dark:text-white mb-1">
                      {member.name}
                    </h3>
                    <p className="text-dark-600 dark:text-dark-400">
                      {member.role}
                    </p>
                  </motion.div>
                ))}
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Contact Information */}
            <div className="lg:col-span-1 space-y-6">
              <Card className="p-6">
                <h2 className="text-xl font-semibold text-dark-900 dark:text-white mb-6">
                  Contact Information
                </h2>
                
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Mail className="h-5 w-5 text-primary-600 dark:text-primary-400 mt-1" />
                    <div>
                      <div className="font-medium text-dark-900 dark:text-white">
                        Email
                      </div>
                      <a 
                        href="mailto:support@voiceverse.com"
                        className="text-dark-600 dark:text-dark-400 hover:text-primary-600 dark:hover:text-primary-400"
                      >
                        support@voiceverse.com
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Phone className="h-5 w-5 text-primary-600 dark:text-primary-400 mt-1" />
                    <div>
                      <div className="font-medium text-dark-900 dark:text-white">
                        Phone
                      </div>
                      <a 
                        href="tel:+1-800-123-4567"
                        className="text-dark-600 dark:text-dark-400 hover:text-primary-600 dark:hover:text-primary-400"
                      >
                        +1 (800) 123-4567
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Globe className="h-5 w-5 text-primary-600 dark:text-primary-400 mt-1" />
                    <div>
                      <div className="font-medium text-dark-900 dark:text-white">
                        Location
                      </div>
                      <div className="text-dark-600 dark:text-dark-400">
                        New York, NY 10001<br />
                        United States
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Clock className="h-5 w-5 text-primary-600 dark:text-primary-400 mt-1" />
                    <div>
                      <div className="font-medium text-dark-900 dark:text-white">
                        Support Hours
                      </div>
                      <div className="space-y-1">
                        {supportHours.map((schedule, index) => (
                          <div 
                            key={index}
                            className="text-dark-600 dark:text-dark-400 text-sm"
                          >
                            <span className="font-medium">{schedule.day}:</span>
                            <br />
                            {schedule.hours}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <h2 className="text-xl font-semibold text-dark-900 dark:text-white mb-4">
                  Common Questions
                </h2>
                <div className="space-y-4">
                  {commonQuestions.map((item, index) => (
                    <details
                      key={index}
                      className="group"
                    >
                      <summary className="flex items-center justify-between cursor-pointer list-none">
                        <span className="font-medium text-dark-900 dark:text-white">
                          {item.question}
                        </span>
                        <ChevronRight className="h-5 w-5 text-dark-500 transform transition-transform group-open:rotate-90" />
                      </summary>
                      <div className="mt-2 text-dark-600 dark:text-dark-400 text-sm">
                        {item.answer}
                      </div>
                    </details>
                  ))}
                </div>
              </Card>

              {/* Enterprise Support */}
              <Card className="p-6 bg-gradient-to-br from-primary-500 to-accent-500 text-white">
                <div className="flex items-center gap-3 mb-4">
                  <Building2 className="h-6 w-6" />
                  <h3 className="text-xl font-semibold">Enterprise Support</h3>
                </div>
                <p className="mb-6">
                  Get priority support with our enterprise plan, including:
                </p>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    <span>Dedicated support team</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>24/7 priority support</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span>Custom training sessions</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <BarChart className="h-4 w-4" />
                    <span>Advanced analytics</span>
                  </li>
                </ul>
                <Button
                  variant="secondary"
                  fullWidth
                  className="bg-white text-primary-600 hover:bg-primary-50"
                >
                  Contact Sales
                </Button>
              </Card>
            </div>

            {/* Contact Form */}
            <Card className="lg:col-span-2 p-6">
              <h2 className="text-xl font-semibold text-dark-900 dark:text-white mb-6">
                Send us a Message
              </h2>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">
                      Name
                    </label>
                    <input
                      type="text"
                      {...register('name')}
                      className="w-full px-3 py-2 bg-white dark:bg-dark-800 border border-gray-300 dark:border-dark-700 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="Your name"
                    />
                    {errors.name && (
                      <p className="mt-1 text-sm text-error-600">{errors.name.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      {...register('email')}
                      className="w-full px-3 py-2 bg-white dark:bg-dark-800 border border-gray-300 dark:border-dark-700 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="your@email.com"
                    />
                    {errors.email && (
                      <p className="mt-1 text-sm text-error-600">{errors.email.message}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">
                    Subject
                  </label>
                  <input
                    type="text"
                    {...register('subject')}
                    className="w-full px-3 py-2 bg-white dark:bg-dark-800 border border-gray-300 dark:border-dark-700 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="What's this about?"
                  />
                  {errors.subject && (
                    <p className="mt-1 text-sm text-error-600">{errors.subject.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">
                      Type
                    </label>
                    <select
                      {...register('type')}
                      className="w-full px-3 py-2 bg-white dark:bg-dark-800 border border-gray-300 dark:border-dark-700 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    >
                      <option value="general">General Inquiry</option>
                      <option value="technical">Technical Support</option>
                      <option value="billing">Billing</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">
                      Priority
                    </label>
                    <select
                      {...register('priority')}
                      className="w-full px-3 py-2 bg-white dark:bg-dark-800 border border-gray-300 dark:border-dark-700 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">
                    Message
                  </label>
                  <textarea
                    {...register('message')}
                    rows={6}
                    className="w-full px-3 py-2 bg-white dark:bg-dark-800 border border-gray-300 dark:border-dark-700 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="How can we help you?"
                  />
                  {errors.message && (
                    <p className="mt-1 text-sm text-error-600">{errors.message.message}</p>
                  )}
                </div>

                <div>
                  <input
                    type="file"
                    {...register('attachments')}
                    ref={fileInputRef}
                    className="hidden"
                    multiple
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleFileClick}
                  >
                    Attach Files
                  </Button>
                  {fileList.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {fileList.map((file, index) => (
                        <div
                          key={index}
                          className="text-sm text-dark-600 dark:text-dark-400"
                        >
                          {file.name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {submitSuccess && (
                  <div className="flex items-center gap-2 text-success-600 dark:text-success-400">
                    <CheckCircle2 className="h-5 w-5" />
                    <span>Message sent successfully! We'll get back to you soon.</span>
                  </div>
                )}

                <Button
                  type="submit"
                  fullWidth
                  isLoading={isSubmitting}
                  leftIcon={<Send className="h-5 w-5" />}
                >
                  Send Message
                </Button>
              </form>
            </Card>
          </div>

          {/* Additional Support Options */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
            {[
              {
                icon: <Bot className="h-6 w-6" />,
                title: 'AI Assistant',
                description: 'Get instant answers with our AI chatbot',
                action: 'Chat Now'
              },
              {
                icon: <Calendar className="h-6 w-6" />,
                title: 'Schedule a Demo',
                description: 'Book a personalized product demo',
                action: 'Book Demo'
              },
              {
                icon: <Headphones className="h-6 w-6" />,
                title: 'Developer Support',
                description: 'Technical support for API integration',
                action: 'View Docs'
              }
            ].map((option, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="p-6 text-center h-full">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 mb-4">
                    {option.icon}
                  </div>
                  <h3 className="text-lg font-semibold text-dark-900 dark:text-white mb-2">
                    {option.title}
                  </h3>
                  <p className="text-dark-600 dark:text-dark-400 mb-4">
                    {option.description}
                  </p>
                  <Button variant="outline" size="sm">
                    {option.action}
                  </Button>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Support Channel Modal */}
      <AnimatePresence>
        {selectedSupport && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            onClick={() => setSelectedSupport(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-dark-800 rounded-xl p-6 max-w-md w-full"
              onClick={e => e.stopPropagation()}
            >
              <h3 className="text-xl font-semibold text-dark-900 dark:text-white mb-4">
                {selectedSupport === 'chat' && 'Start Live Chat'}
                {selectedSupport === 'call' && 'Request a Call'}
                {selectedSupport === 'video' && 'Schedule Video Call'}
              </h3>
              
              <div className="space-y-4">
                {selectedSupport === 'chat' && (
                  <div className="text-dark-600 dark:text-dark-400">
                    Our support team is ready to chat with you. Average response time is less than 2 minutes.
                  </div>
                )}
                
                {selectedSupport === 'call' && (
                  <div className="text-dark-600 dark:text-dark-400">
                    Enter your phone number and we'll call you back within 5 minutes.
                  </div>
                )}
                
                {selectedSupport === 'video' && (
                  <div className="text-dark-600 dark:text-dark-400">
                    Choose a convenient time for a video call with our support team.
                  </div>
                )}
                
                <Button fullWidth>
                  {selectedSupport === 'chat' && 'Start Chat Now'}
                  {selectedSupport === 'call' && 'Request Callback'}
                  {selectedSupport === 'video' && 'Schedule Meeting'}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};