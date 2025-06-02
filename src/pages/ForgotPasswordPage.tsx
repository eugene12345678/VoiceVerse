import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { authAPI } from '../lib/api';
import {
  Mail,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  Lock,
  Shield,
  RefreshCw,
  Clock,
  Sparkles,
  Send,
  CheckCircle,
  XCircle,
  Loader
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';

export const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'verifying' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [resendTimeout, setResendTimeout] = useState(0);
  const [emailSuggestion, setEmailSuggestion] = useState('');
  const [showEmailPreview, setShowEmailPreview] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendTimeout > 0) {
      timer = setInterval(() => {
        setResendTimeout(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendTimeout]);

  const validateEmail = (email: string) => {
    const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
  };

  const suggestEmail = (input: string) => {
    const commonDomains = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com'];
    if (input.includes('@')) {
      const [localPart, domain] = input.split('@');
      if (domain) {
        const suggestion = commonDomains.find(d => d.startsWith(domain));
        if (suggestion) {
          setEmailSuggestion(`${localPart}@${suggestion}`);
          return;
        }
      }
    }
    setEmailSuggestion('');
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    suggestEmail(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateEmail(email)) {
      setStatus('error');
      setMessage('Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    setStatus('verifying');
    setMessage('');

    try {
      // Call the backend API using the authAPI
      const data = await authAPI.forgotPassword(email);
      
      setStatus('success');
      setMessage(data.message || 'Password reset instructions have been sent to your email.');
      setResendTimeout(60);
      setShowEmailPreview(true);
    } catch (error) {
      console.error('Error sending reset email:', error);
      setStatus('error');
      setMessage('Failed to send reset email. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setIsLoading(true);
    try {
      // Call the backend API using the authAPI
      const data = await authAPI.forgotPassword(email);
      
      setMessage(data.message || 'Reset instructions resent successfully!');
      setResendTimeout(60);
    } catch (error) {
      console.error('Error resending reset email:', error);
      setStatus('error');
      setMessage('Failed to resend reset email. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-mesh dark:bg-dark-950 flex items-center justify-center p-4">
      <div className="w-full max-w-xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-dark-600 dark:text-dark-400 hover:text-primary-600 dark:hover:text-primary-400 mb-8"
          >
            <ArrowLeft className="h-5 w-5" />
            Back to Login
          </Link>

          <Card className="p-8">
            <div className="text-center mb-8">
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="bg-primary-600 text-white p-4 rounded-2xl inline-flex mb-6"
              >
                <Lock className="h-8 w-8" />
              </motion.div>
              <h1 className="text-3xl font-display font-bold text-dark-900 dark:text-white mb-3">
                Reset Your Password
              </h1>
              <p className="text-dark-600 dark:text-dark-400 text-lg">
                Don't worry! It happens. Please enter your email address and we'll send you instructions.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-dark-400" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={handleEmailChange}
                    className="block w-full pl-10 pr-4 py-3 bg-white dark:bg-dark-800 border border-gray-300 dark:border-dark-700 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-lg"
                    placeholder="Enter your email"
                    required
                  />
                  {emailSuggestion && email !== emailSuggestion && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="absolute mt-1 p-2 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg shadow-lg w-full"
                    >
                      <button
                        type="button"
                        className="text-primary-600 dark:text-primary-400 hover:underline text-sm w-full text-left"
                        onClick={() => setEmail(emailSuggestion)}
                      >
                        Did you mean {emailSuggestion}?
                      </button>
                    </motion.div>
                  )}
                </div>
              </div>

              <AnimatePresence>
                {status !== 'idle' && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className={`flex items-center gap-3 p-4 rounded-lg ${
                      status === 'success'
                        ? 'bg-success-50 dark:bg-success-900/30 text-success-600 dark:text-success-400'
                        : status === 'error'
                        ? 'bg-error-50 dark:bg-error-900/30 text-error-600 dark:text-error-400'
                        : 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'
                    }`}
                  >
                    {status === 'success' ? (
                      <CheckCircle className="h-5 w-5 flex-shrink-0" />
                    ) : status === 'error' ? (
                      <XCircle className="h-5 w-5 flex-shrink-0" />
                    ) : (
                      <Loader className="h-5 w-5 flex-shrink-0 animate-spin" />
                    )}
                    <span>{message}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex flex-col gap-4">
                <Button
                  type="submit"
                  fullWidth
                  size="lg"
                  isLoading={isLoading}
                  leftIcon={<Send className="h-5 w-5" />}
                  disabled={isLoading || status === 'success'}
                >
                  {isLoading ? 'Sending Instructions...' : 'Send Reset Instructions'}
                </Button>

                {status === 'success' && (
                  <div className="text-center">
                    <p className="text-dark-500 dark:text-dark-400 flex items-center justify-center gap-2">
                      <Clock className="h-4 w-4" />
                      Resend in: {Math.floor(resendTimeout / 60)}:
                      {(resendTimeout % 60).toString().padStart(2, '0')}
                    </p>
                    <Button
                      variant="outline"
                      onClick={handleResend}
                      disabled={resendTimeout > 0 || isLoading}
                      className="mt-2"
                      leftIcon={<RefreshCw className="h-4 w-4" />}
                    >
                      Resend Instructions
                    </Button>
                  </div>
                )}
              </div>
            </form>

            {/* Email Preview */}
            <AnimatePresence>
              {showEmailPreview && status === 'success' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-8 border-t border-gray-200 dark:border-dark-700 pt-6"
                >
                  <div className="bg-gray-50 dark:bg-dark-800 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-dark-900 dark:text-white mb-2 flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-primary-600" />
                      Check Your Email
                    </h3>
                    <p className="text-dark-600 dark:text-dark-400 mb-4">
                      We've sent instructions to:
                      <span className="font-mono text-primary-600 dark:text-primary-400 ml-2">
                        {email}
                      </span>
                    </p>
                    <div className="flex items-center gap-4 text-sm text-dark-500 dark:text-dark-400">
                      <Shield className="h-4 w-4" />
                      <span>Link expires in 30 minutes</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>

          <p className="mt-6 text-center text-dark-500 dark:text-dark-400">
            Remember your password?{' '}
            <Link
              to="/login"
              className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-medium"
            >
              Back to Login
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
};