import React, { useState, useRef, useEffect } from 'react';
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
  Building2,
  MapPin,
  X
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
    name: 'Eugene Mathenge',
    role: 'Software Engineer',
    avatar: '/Eugene.jpeg',
    status: 'online'
  }
  
];

const supportStats = [
  { label: 'Avg. Response Time', value: '< 2 hours', icon: <Zap /> },
  { label: 'Customer Satisfaction', value: '98%', icon: <Star /> },
  { label: 'Resolution Rate', value: '95%', icon: <CheckCircle2 /> },
  { label: 'Active Users', value: '50K+', icon: <Users /> }
];

// Load Calendly script
const loadCalendlyScript = () => {
  const script = document.createElement('script');
  script.src = 'https://assets.calendly.com/assets/external/widget.js';
  script.async = true;
  document.body.appendChild(script);
  
  return () => {
    document.body.removeChild(script);
  };
};

export const ContactPage = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [selectedSupport, setSelectedSupport] = useState<'chat' | 'call' | 'video' | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showAIChat, setShowAIChat] = useState(false);
  const [aiMessages, setAiMessages] = useState<{role: string, content: string}[]>([
    { role: 'assistant', content: 'Hello! I\'m your VoiceVerse AI assistant. How can I help you today?' }
  ]);
  const [userMessage, setUserMessage] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiSessionId, setAiSessionId] = useState<string | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  
  // Load Calendly script when component mounts
  useEffect(() => {
    const cleanup = loadCalendlyScript();
    return cleanup;
  }, []);
  
  // Scroll to bottom of chat when messages change
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [aiMessages]);
  
  // Initialize AI chat session
  const initAiChat = async () => {
    try {
      const response = await fetch('/api/contact/ai/init', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to initialize AI chat');
      }
      
      const result = await response.json();
      setAiSessionId(result.data.sessionId);
      setAiMessages(result.data.messages);
    } catch (error) {
      console.error('Error initializing AI chat:', error);
      // Fallback to local messages if API fails
      setAiMessages([
        { role: 'assistant', content: 'Hello! I\'m your VoiceVerse AI assistant. How can I help you today?' }
      ]);
    }
  };
  
  // Send message to AI assistant
  const sendAiMessage = async () => {
    if (!userMessage.trim()) return;
    
    // Add user message to chat
    setAiMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsAiLoading(true);
    
    // Store message and clear input
    const message = userMessage;
    setUserMessage('');
    
    try {
      if (aiSessionId) {
        // Send to backend if session exists
        const response = await fetch('/api/contact/ai/message', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sessionId: aiSessionId,
            message
          }),
        });
        
        if (!response.ok) {
          throw new Error('Failed to send message');
        }
        
        const result = await response.json();
        setAiMessages(result.data.messages);
      } else {
        // Local fallback if no session
        // Simple keyword matching for demo purposes
        const keywords = {
          'password': 'To reset your password, click the "Forgot Password" link on the login page.',
          'subscription': 'You can manage your subscription in Settings > Subscription.',
          'refund': 'Refunds are typically processed within 3-5 business days.',
          'voice': 'Our voice transformation technology allows you to modify your voice with various effects.',
          'help': 'I\'m here to help! Ask me anything about VoiceVerse.',
          'pricing': 'We offer several pricing tiers. The basic plan starts at $9.99/month.',
          'contact': 'You can reach our support team at support@voiceverse.app or call +254 700 581 615.',
        };
        
        // Find matching keywords
        let response = 'I\'m not sure I understand. Could you please provide more details?';
        for (const [key, value] of Object.entries(keywords)) {
          if (message.toLowerCase().includes(key)) {
            response = value;
            break;
          }
        }
        
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Add AI response
        setAiMessages(prev => [...prev, { role: 'assistant', content: response }]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      // Add error message
      setAiMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Sorry, I encountered an error. Please try again later.' 
      }]);
    } finally {
      setIsAiLoading(false);
    }
  };

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
      // Send data to backend API
      const response = await fetch('/api/contact/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error('Failed to submit form');
      }
      
      const result = await response.json();
      console.log('Form submitted successfully:', result);
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
                  <Button 
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (option.type === 'chat') {
                        // WhatsApp integration
                        const message = encodeURIComponent("Hi, I'd like to start a live chat with VoiceVerse support.");
                        window.open(`https://wa.me/254700581615?text=${message}`, '_blank');
                      } else if (option.type === 'call') {
                        // Phone call integration
                        window.location.href = 'tel:+254700581615';
                      } else if (option.type === 'video') {
                        // Open Calendly modal
                        setSelectedSupport('video');
                      }
                    }}
                  >
                    {option.action}
                  </Button>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Support Team */}
          <div className="mb-16" >
            <Card className="p-8 text-center">
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
                    className="text-center "
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
                        href="mailto:eugenemathenge4@gmail.com"
                        className="text-dark-600 dark:text-dark-400 hover:text-primary-600 dark:hover:text-primary-400"
                      >
                        eugene.mathenge.secdev<br />@gmail.com
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
                        href="tel:+254700581615"
                        className="text-dark-600 dark:text-dark-400 hover:text-primary-600 dark:hover:text-primary-400"
                      >
                        +254 700 581 615
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
                        Diani, Kenya<br />
                        
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

                <div className="border-t pt-6 mt-6">
                  <div className="flex items-center gap-2 mb-4">
                    <MapPin className="h-5 w-5 text-blue-600" />
                    <h3 className="text-lg font-semibold text-gray-900">
                      Visit Our Office
                    </h3>
                  </div>
                  <div className="rounded-lg overflow-hidden border border-gray-200">
                    <iframe
                      src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15955.540894110894!2d39.5652384!3d-4.2879586!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x184045594761ee83%3A0xf902c8740307da7b!2sDiani%20Beach!5e0!3m2!1sen!2ske!4v1717338412345"
                      width="100%"
                      height="300"
                      style={{ border: 0 }}
                      allowFullScreen=""
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      title="Office Location"
                    />
                  </div>
                </div>
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
                <Card 
                  className="p-6 text-center h-full cursor-pointer hover:border-primary-500 dark:hover:border-primary-400"
                  onClick={() => {
                    if (option.title === 'AI Assistant') {
                      setShowAIChat(true);
                      initAiChat();
                    } else if (option.title === 'Schedule a Demo') {
                      // Open Calendly for demo
                      window.open('https://calendly.com/voiceverse/product-demo', '_blank');
                    } else if (option.title === 'Developer Support') {
                      // Redirect to docs
                      window.open('/docs', '_blank');
                    }
                  }}
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
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (option.title === 'AI Assistant') {
                        setShowAIChat(true);
                        initAiChat();
                      } else if (option.title === 'Schedule a Demo') {
                        // Open Calendly for demo
                        window.open('https://calendly.com/voiceverse/product-demo', '_blank');
                      } else if (option.title === 'Developer Support') {
                        // Redirect to docs
                        window.open('/docs', '_blank');
                      }
                    }}
                  >
                    {option.action}
                  </Button>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* AI Assistant Chat Modal */}
      <AnimatePresence>
        {showAIChat && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            onClick={() => setShowAIChat(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-dark-800 rounded-xl p-0 max-w-md w-full h-[600px] max-h-[80vh] flex flex-col overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              {/* Chat Header */}
              <div className="p-4 border-b border-gray-200 dark:border-dark-700 flex items-center justify-between bg-primary-600 text-white">
                <div className="flex items-center gap-3">
                  <Bot className="h-6 w-6" />
                  <h3 className="text-lg font-semibold">VoiceVerse AI Assistant</h3>
                </div>
                <button 
                  className="text-white hover:text-gray-200 transition-colors"
                  onClick={() => setShowAIChat(false)}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              {/* Chat Messages */}
              <div 
                className="flex-1 overflow-y-auto p-4 space-y-4"
                ref={chatContainerRef}
              >
                {aiMessages.map((msg, idx) => (
                  <div 
                    key={idx} 
                    className={`flex ${msg.role === 'assistant' ? 'justify-start' : 'justify-end'}`}
                  >
                    <div 
                      className={`max-w-[80%] p-3 rounded-lg ${
                        msg.role === 'assistant' 
                          ? 'bg-gray-100 dark:bg-dark-700 text-dark-900 dark:text-white rounded-tl-none' 
                          : 'bg-primary-600 text-white rounded-tr-none'
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                ))}
                {isAiLoading && (
                  <div className="flex justify-start">
                    <div className="max-w-[80%] p-3 rounded-lg bg-gray-100 dark:bg-dark-700 text-dark-900 dark:text-white rounded-tl-none">
                      <div className="flex space-x-2">
                        <div className="w-2 h-2 rounded-full bg-primary-600 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-2 h-2 rounded-full bg-primary-600 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-2 h-2 rounded-full bg-primary-600 animate-bounce" style={{ animationDelay: '300ms' }}></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Chat Input */}
              <div className="p-4 border-t border-gray-200 dark:border-dark-700">
                <form 
                  className="flex gap-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    sendAiMessage();
                  }}
                >
                  <input
                    type="text"
                    value={userMessage}
                    onChange={(e) => setUserMessage(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1 px-3 py-2 bg-white dark:bg-dark-800 border border-gray-300 dark:border-dark-700 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                  <Button
                    type="submit"
                    disabled={isAiLoading || !userMessage.trim()}
                    className="px-4"
                  >
                    <Send className="h-5 w-5" />
                  </Button>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
                  <div className="text-dark-600 dark:text-dark-400 mb-4">
                    Choose a convenient time for a video call with our support team.
                  </div>
                )}
                
                {selectedSupport === 'video' ? (
                  <div 
                    className="calendly-inline-widget" 
                    data-url="https://calendly.com/voiceverse/support-call"
                    style={{ minWidth: '320px', height: '580px' }}
                  ></div>
                ) : (
                  <Button 
                    fullWidth
                    onClick={() => {
                      if (selectedSupport === 'chat') {
                        const message = encodeURIComponent("Hi, I'd like to start a live chat with VoiceVerse support.");
                        window.open(`https://wa.me/254700581615?text=${message}`, '_blank');
                        setSelectedSupport(null);
                      } else if (selectedSupport === 'call') {
                        window.location.href = 'tel:+254700581615';
                        setSelectedSupport(null);
                      }
                    }}
                  >
                    {selectedSupport === 'chat' && 'Start Chat Now'}
                    {selectedSupport === 'call' && 'Request Callback'}
                  </Button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};