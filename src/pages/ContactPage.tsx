
import { useState, useRef, useEffect, ChangeEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
 
  Mail,
  Phone,
  Globe,
  Send,
  Clock,
  
  MessageSquare,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
    Users,
  Bot,
  Headphones,
  BarChart,
  Zap,
  Star,
  Shield,
  Building2,
  MapPin,
  X,
  Paperclip
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Avatar } from '../components/ui/Avatar';
import ChatBot from '../components/ChatBot';
import ViewDocs from '../components/ViewDocs';

// Frontend validation schema
const contactSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  subject: z.string().min(5, 'Subject must be at least 5 characters'),
  message: z.string().min(20, 'Message must be at least 20 characters'),
  priority: z.enum(['low', 'medium', 'high']),
  type: z.enum(['general', 'technical', 'billing', 'other']),
  attachments: z.any().optional()
});

// Backend expects these values in uppercase
const priorityMap = {
  'low': 'LOW',
  'medium': 'MEDIUM',
  'high': 'HIGH'
};

const typeMap = {
  'general': 'GENERAL',
  'technical': 'TECHNICAL',
  'billing': 'BILLING',
  'other': 'OTHER'
};

// Maximum file size (5MB)
const MAX_FILE_SIZE = 5 * 1024 * 1024;
// Allowed file types
const ALLOWED_FILE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
];

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

// Declare global interface for TypeScript
declare global {
  interface Window {
    testContactValidation?: any; // For debugging
  }
}

// Validation testing function - exposed globally for debugging
const testContactValidation = (formData: any) => {
  const validationResults = {
    name: formData.name && formData.name.length >= 2,
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email),
    subject: formData.subject && formData.subject.length >= 5,
    message: formData.message && formData.message.length >= 20,
    priority: ['LOW', 'MEDIUM', 'HIGH'].includes(formData.priority),
    type: ['GENERAL', 'TECHNICAL', 'BILLING', 'OTHER', 'SUPPORT', 'FEEDBACK'].includes(formData.type),
  };
  
  console.table(validationResults);
  console.log('All valid:', Object.values(validationResults).every(Boolean));
  return validationResults;
};

// Make validation testing function available globally for debugging
if (typeof window !== 'undefined') {
  window.testContactValidation = testContactValidation;
}

export const ContactPage = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [selectedSupport, setSelectedSupport] = useState<'chat' | 'call' | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showAIChat, setShowAIChat] = useState(false);
  const [showDocs, setShowDocs] = useState(false);
  const [fileUploadError, setFileUploadError] = useState<string | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  
    
  // Handle file uploads
  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    setFileUploadError(null);
    
    if (!e.target.files || e.target.files.length === 0) {
      return;
    }
    
    const files = Array.from(e.target.files);
    const validFiles: File[] = [];
    
    // Validate files
    for (const file of files) {
      // Check file size
      if (file.size > MAX_FILE_SIZE) {
        setFileUploadError(`File "${file.name}" exceeds the maximum size of 5MB`);
        return;
      }
      
      // Check file type
      if (!ALLOWED_FILE_TYPES.includes(file.type)) {
        setFileUploadError(`File "${file.name}" has an unsupported format`);
        return;
      }
      
      validFiles.push(file);
    }
    
    setUploadedFiles(prev => [...prev, ...validFiles]);
  };
  
  // Remove a file from the uploaded files
  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
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
    setSubmitError(null);
    
    try {
      // Debug: Log the form data being submitted and validate it
      console.log('Form data to be submitted:', data);
      
      // Test validation before submission
      const formDataForValidation = {
        name: data.name,
        email: data.email,
        subject: data.subject,
        message: data.message,
        priority: priorityMap[data.priority],
        type: typeMap[data.type]
      };
      console.log('Pre-submission validation check:');
      testContactValidation(formDataForValidation);
      
      // Try both FormData and JSON approaches to handle different backend configurations
      let response;
      
      // APPROACH 1: FormData with proper headers (primary approach for file uploads)
      try {
        const formData = new FormData();
        
        // Add form fields to FormData with explicit field names that match backend expectations
        // Common field name patterns: firstName/first_name vs name, emailAddress/email_address vs email
        formData.append('name', data.name);
        formData.append('email', data.email);
        formData.append('subject', data.subject);
        formData.append('message', data.message);
        formData.append('priority', priorityMap[data.priority]); // Map to uppercase values expected by backend
        formData.append('type', typeMap[data.type]); // Map to uppercase values expected by backend
        
        // Add uploaded files - handle them as an array if multiple files
        if (uploadedFiles.length > 0) {
          // Append each file individually with the same field name
          uploadedFiles.forEach((file) => {
            formData.append('attachments', file);
          });
          
          // Also send a JSON string of file metadata as a backup
          const fileMetadata = uploadedFiles.map(file => ({
            name: file.name,
            type: file.type,
            size: file.size
          }));
          formData.append('attachmentsMetadata', JSON.stringify(fileMetadata));
        }
        
        // Debug: Log FormData entries for inspection
        console.log('FormData entries:');
        for (const pair of (formData as any).entries()) {
          if (pair[1] instanceof File) {
            console.log(pair[0], `File: ${pair[1].name} (${pair[1].type}, ${pair[1].size} bytes)`);
          } else {
            console.log(pair[0], pair[1]);
          }
        }
        
        // Network request debugging helper
        const debugNetworkRequest = async (url: string, options: RequestInit) => {
          console.log(`Sending ${options.method} request to ${url}`);
          console.log('Request headers:', options.headers);
          
          const response = await fetch(url, options);
          
          console.log(`Response status: ${response.status} ${response.statusText}`);
          console.log('Response headers:', {
            ...Object.fromEntries([...response.headers.entries()])
          });
          
          // Clone the response so we can both log it and return it
          const responseClone = response.clone();
          try {
            const responseData = await responseClone.text();
            console.log('Response body:', responseData.substring(0, 500) + (responseData.length > 500 ? '...' : ''));
          } catch (e) {
            console.log('Could not read response body for logging');
          }
          
          return response;
        };
        
        // Send data to backend API with FormData
        response = await debugNetworkRequest('/api/contact/submit', {
          method: 'POST',
          body: formData,
          // Let the browser set the Content-Type header with boundary for FormData
          // But add additional headers to help backend identify the request
          headers: {
            'Accept': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
          }
        });
        
        // If FormData approach fails with 415 Unsupported Media Type, we'll try JSON in the catch block
        if (response.status === 415) {
          throw new Error('Unsupported Media Type - trying JSON approach');
        }
      } catch (formDataError) {
        console.warn('FormData approach failed, trying JSON payload:', formDataError);
        
        // APPROACH 2: JSON payload (fallback if FormData parsing fails on the backend)
        // Create a JSON payload without file attachments
        const jsonPayload = {
          name: data.name,
          email: data.email,
          subject: data.subject,
          message: data.message,
          priority: priorityMap[data.priority],
          type: typeMap[data.type],
          // Can't include actual files in JSON, but can include metadata
          attachmentsMetadata: uploadedFiles.map(file => ({
            name: file.name,
            type: file.type,
            size: file.size
          }))
        };
        
        // Send JSON payload as fallback using our debug helper
        response = await debugNetworkRequest('/api/contact/submit', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
          },
          body: JSON.stringify(jsonPayload)
        });
        
        // Note: This approach won't include actual file uploads
        console.log('Used JSON fallback approach (no file uploads)');
      }
      
      // Handle response
      if (!response.ok) {
        // If backend returns an error, handle it
        let errorMessage = 'Failed to submit form';
        try {
          const errorData = await response.json();
          console.log('Backend validation errors:', errorData);
          
          // Handle different error response formats
          if (errorData.errors && Array.isArray(errorData.errors)) {
            // Express-validator format: array of {param, msg, location, value}
            errorMessage = errorData.errors.map((err: any) => {
              // Handle the "undefined: message" pattern by using the field name if available
              const fieldName = err.param || 'Field';
              return `${fieldName}: ${err.msg}`;
            }).join(', ');
          } else if (errorData.errors && typeof errorData.errors === 'object') {
            // Zod/Yup format: {fieldName: message}
            errorMessage = Object.entries(errorData.errors)
              .map(([field, message]) => `${field}: ${message}`)
              .join(', ');
          } else if (errorData.message) {
            // Simple message format
            errorMessage = errorData.message;
          } else if (typeof errorData === 'string' && errorData.includes('undefined:')) {
            // Special handling for the "undefined: message" pattern in the error string
            // This fixes the specific error pattern mentioned in the task
            errorMessage = errorData.split(',')
              .map(part => {
                // Extract the validation message from "undefined: message"
                const match = part.trim().match(/undefined:\s*(.*)/);
                if (match && match[1]) {
                  // Try to guess the field from the validation message
                  if (match[1].includes('Name must be')) return `name: ${match[1]}`;
                  if (match[1].includes('email address')) return `email: ${match[1]}`;
                  if (match[1].includes('Subject must be')) return `subject: ${match[1]}`;
                  if (match[1].includes('Message must be')) return `message: ${match[1]}`;
                  return match[1]; // Just return the message if we can't identify the field
                }
                return part.trim();
              })
              .join(', ');
          }
        } catch (jsonError) {
          // If response is not valid JSON, use status text
          console.error('Error parsing JSON response:', jsonError);
          errorMessage = `Server error: ${response.status} ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }
      
      // Parse successful response
      const result = await response.json();
      console.log('Form submitted successfully:', result);
      setSubmitSuccess(true);
      setUploadedFiles([]);
      reset();
    } catch (error) {
      console.error('Error submitting form:', error);
      setSubmitError(error instanceof Error ? error.message : 'An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileClick = () => {
    fileInputRef.current?.click();
  };

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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
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
                    ref={fileInputRef}
                    className="hidden"
                    multiple
                    onChange={handleFileUpload}
                    accept={ALLOWED_FILE_TYPES.join(',')}
                  />
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleFileClick}
                    >
                      Attach Files
                    </Button>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      Max 5MB per file (JPG, PNG, GIF, PDF, DOC, DOCX)
                    </span>
                  </div>
                  
                  {fileUploadError && (
                    <p className="mt-1 text-sm text-error-600">{fileUploadError}</p>
                  )}
                  
                  {uploadedFiles.length > 0 && (
                    <div className="mt-2 space-y-1 border border-gray-200 dark:border-gray-700 rounded-md p-2">
                      <div className="text-sm font-medium mb-1">Attached Files:</div>
                      {uploadedFiles.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between text-sm text-dark-600 dark:text-dark-400 bg-gray-50 dark:bg-gray-800 p-2 rounded"
                        >
                          <div className="flex items-center gap-2">
                            <Paperclip className="h-4 w-4 text-gray-400" />
                            <span>{file.name}</span>
                            <span className="text-xs text-gray-500">
                              ({(file.size / 1024).toFixed(1)} KB)
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeFile(index)}
                            className="text-gray-400 hover:text-error-500"
                            aria-label="Remove file"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {submitSuccess && (
                  <div className="flex items-center gap-2 text-success-600 dark:text-success-400 p-3 bg-success-50 dark:bg-success-900/20 rounded-md">
                    <CheckCircle2 className="h-5 w-5" />
                    <span>Message sent successfully! We'll get back to you soon.</span>
                  </div>
                )}
                
                {submitError && (
                  <div className="flex items-center gap-2 text-error-600 dark:text-error-400 p-3 bg-error-50 dark:bg-error-900/20 rounded-md">
                    <AlertCircle className="h-5 w-5" />
                    <span>{submitError}</span>
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-16">
            {[
              {
                icon: <Bot className="h-6 w-6" />,
                title: 'AI Assistant',
                description: 'Get instant answers with our AI chatbot',
                action: 'Chat Now'
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
                    } else if (option.title === 'Developer Support') {
                      // Show docs component
                      setShowDocs(true);
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
                      } else if (option.title === 'Developer Support') {
                        // Show docs component
                        setShowDocs(true);
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
      <ChatBot 
        isOpen={showAIChat} 
        onClose={() => setShowAIChat(false)}
        title="VoiceVerse AI Assistant"
        primaryColor="#6366f1"
        darkMode={false}
        initialMessages={[
          { 
            id: '1', 
            role: 'assistant', 
            content: 'Hello! I\'m your VoiceVerse AI assistant. How can I help you today?',
            timestamp: new Date()
          }
        ]}
        onSendMessage={async (message) => {
          // This is a fallback implementation if the backend API is not available
          console.log('Sending message to AI Assistant:', message);
          
          // Simulate API delay
          await new Promise(resolve => setTimeout(resolve, 1000));
          
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
          for (const [key, value] of Object.entries(keywords)) {
            if (message.toLowerCase().includes(key)) {
              return value;
            }
          }
          
          // Default response if no keywords match
          return "I'm not sure I understand your question. Could you please provide more details or rephrase? You can ask about voice transformations, subscription plans, technical support, or any other VoiceVerse features.";
        }}
      />
      
      {/* Developer Documentation Modal */}
      <ViewDocs 
        isOpen={showDocs} 
        onClose={() => setShowDocs(false)}
        externalDocsUrl="https://docs.voiceverse.app"
      />

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
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};