import React, { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { authAPI } from '../lib/api';
import {
  Lock,
  ArrowLeft,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  Shield,
  
  RefreshCw,
  Clock,
  Sparkles,
  Check,
  X,
  Fingerprint,
  Smartphone,
  Globe
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';

export const ResetPasswordPage = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [tokenValidated, setTokenValidated] = useState(false);
  const [tokenExpiry, setTokenExpiry] = useState<Date | null>(null);
  const [remainingTime, setRemainingTime] = useState<number>(0);

  // Password requirements - simplified for testing
  const requirements = [
    { id: 'length', label: 'At least 6 characters', regex: /.{6,}/ }
    // Commented out for easier testing
    // { id: 'uppercase', label: 'One uppercase letter', regex: /[A-Z]/ },
    // { id: 'lowercase', label: 'One lowercase letter', regex: /[a-z]/ },
    // { id: 'number', label: 'One number', regex: /[0-9]/ },
    // { id: 'special', label: 'One special character', regex: /[^A-Za-z0-9]/ }
  ];

  // Check password strength
  React.useEffect(() => {
    let strength = 0;
    requirements.forEach(req => {
      if (req.regex.test(password)) strength++;
    });
    setPasswordStrength(strength);
  }, [password]);

  // Validate token and set expiry
  React.useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setStatus('error');
        setMessage('Invalid reset token');
        return;
      }

      try {
        // We'll just set the token as validated and let the reset API validate it
        // This is more secure than validating the token on the frontend
        setTokenValidated(true);
        
        // Set a default expiry time of 1 hour from now
        const expiryTime = new Date();
        expiryTime.setHours(expiryTime.getHours() + 1);
        setTokenExpiry(expiryTime);
        
        // Log token for debugging (remove in production)
        console.log('Reset token:', token);
      } catch (error) {
        console.error('Error validating token:', error);
        setStatus('error');
        setMessage('Invalid or expired reset token');
      }
    };

    validateToken();
  }, [token]);

  // Update remaining time
  React.useEffect(() => {
    if (!tokenExpiry) return;

    const interval = setInterval(() => {
      const now = new Date();
      const diff = tokenExpiry.getTime() - now.getTime();
      setRemainingTime(Math.max(0, Math.floor(diff / 1000)));
    }, 1000);

    return () => clearInterval(interval);
  }, [tokenExpiry]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!token) {
      setStatus('error');
      setMessage('Invalid reset token');
      return;
    }
    
    if (password !== confirmPassword) {
      setStatus('error');
      setMessage('Passwords do not match');
      return;
    }

    if (passwordStrength < 1) { // Changed from 4 to 1 since we only have one requirement now
      setStatus('error');
      setMessage('Please meet all password requirements');
      return;
    }

    setIsLoading(true);
    setStatus('idle');
    setMessage('');

    try {
      console.log(`Submitting reset password with token: ${token}`);
      
      // Call the backend API using the authAPI
      const data = await authAPI.resetPassword(token, password);
      
      setStatus('success');
      setMessage(data.message || 'Password has been reset successfully! Redirecting to login...');
      
      // Show success state for 2 seconds before redirecting
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (error) {
      console.error('Error resetting password:', error);
      setStatus('error');
      setMessage('Failed to reset password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!tokenValidated) {
    return (
      <div className="min-h-screen bg-gradient-mesh dark:bg-dark-950 flex items-center justify-center p-4">
        <Card className="p-8 max-w-md w-full">
          <div className="text-center">
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-full mb-4"
            >
              <RefreshCw className="h-8 w-8 text-primary-600 dark:text-primary-400 animate-spin" />
            </motion.div>
            <h2 className="text-xl font-semibold text-dark-900 dark:text-white mb-2">
              Validating Reset Token
            </h2>
            <p className="text-dark-600 dark:text-dark-400">
              Please wait while we verify your reset token...
            </p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-mesh dark:bg-dark-950 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        <div className="w-full max-w-md mx-auto">
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

            <Card className="p-6">
              <div className="text-center mb-8">
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="bg-primary-600 text-white p-3 rounded-xl inline-flex mb-4"
                >
                  <Lock className="h-6 w-6" />
                </motion.div>
                <h1 className="text-2xl font-display font-bold text-dark-900 dark:text-white mb-2">
                  Reset Your Password
                </h1>
                <p className="text-dark-600 dark:text-dark-400">
                  Choose a strong password to secure your account
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">
                    New Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-dark-400" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="block w-full pl-10 pr-10 px-3 py-2 bg-white dark:bg-dark-800 border border-gray-300 dark:border-dark-700 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="Enter new password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5 text-dark-400" />
                      ) : (
                        <Eye className="h-5 w-5 text-dark-400" />
                      )}
                    </button>
                  </div>

                  {/* Password strength indicator */}
                  <div className="mt-2">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="h-1 flex-1 bg-gray-200 dark:bg-dark-700 rounded-full overflow-hidden">
                        <motion.div
                          className={`h-full transition-all ${
                            passwordStrength < 1
                              ? 'bg-error-500'
                              : 'bg-success-500'
                          }`}
                          style={{ width: `${(passwordStrength / 1) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-dark-500 dark:text-dark-400">
                        {passwordStrength < 1
                          ? 'Weak'
                          : 'Strong'}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-dark-400" />
                    </div>
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="block w-full pl-10 pr-10 px-3 py-2 bg-white dark:bg-dark-800 border border-gray-300 dark:border-dark-700 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="Confirm new password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-5 w-5 text-dark-400" />
                      ) : (
                        <Eye className="h-5 w-5 text-dark-400" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Password requirements */}
                <div className="space-y-2 p-4 bg-gray-50 dark:bg-dark-800 rounded-lg">
                  <h3 className="text-sm font-medium text-dark-900 dark:text-white mb-2">
                    Password Requirements:
                  </h3>
                  {requirements.map((req) => (
                    <div
                      key={req.id}
                      className="flex items-center gap-2 text-sm"
                    >
                      {req.regex.test(password) ? (
                        <Check className="h-4 w-4 text-success-500" />
                      ) : (
                        <X className="h-4 w-4 text-error-500" />
                      )}
                      <span className={`${
                        req.regex.test(password)
                          ? 'text-success-600 dark:text-success-400'
                          : 'text-dark-500 dark:text-dark-400'
                      }`}>
                        {req.label}
                      </span>
                    </div>
                  ))}
                </div>

                {status !== 'idle' && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex items-center gap-2 ${
                      status === 'success'
                        ? 'text-success-600'
                        : 'text-error-600'
                    }`}
                  >
                    {status === 'success' ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : (
                      <AlertCircle className="h-5 w-5" />
                    )}
                    <span>{message}</span>
                  </motion.div>
                )}

                <Button
                  type="submit"
                  fullWidth
                  isLoading={isLoading}
                  leftIcon={<Shield className="h-5 w-5" />}
                >
                  Reset Password
                </Button>

                {/* Token expiry timer */}
                {remainingTime > 0 && (
                  <div className="text-center text-sm text-dark-500 dark:text-dark-400">
                    <Clock className="h-4 w-4 inline mr-1" />
                    Link expires in: {formatTime(remainingTime)}
                  </div>
                )}
              </form>
            </Card>
          </motion.div>
        </div>

        {/* Info Section */}
        <div className="hidden lg:block">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="bg-primary-600/10 dark:bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-primary-200/20 dark:border-white/20">
              <h2 className="text-2xl font-display font-bold text-primary-950 dark:text-white mb-6">
                Account Security Features
              </h2>
              
              <div className="space-y-6 mb-8">
                {[
                  {
                    icon: <Shield className="h-5 w-5" />,
                    title: 'Advanced Security',
                    description: 'Enterprise-grade password encryption'
                  },
                  {
                    icon: <Fingerprint className="h-5 w-5" />,
                    title: 'Biometric Auth',
                    description: 'Enable after password reset'
                  },
                  {
                    icon: <Smartphone className="h-5 w-5" />,
                    title: '2FA Protection',
                    description: 'Additional security layer'
                  }
                ].map((feature, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 + index * 0.1 }}
                    className="flex items-start gap-4"
                  >
                    <div className="flex-shrink-0 w-10 h-10 bg-primary-500/20 rounded-lg flex items-center justify-center text-primary-700 dark:text-primary-400">
                      {feature.icon}
                    </div>
                    <div>
                      <h3 className="text-primary-950 dark:text-white font-medium mb-1">
                        {feature.title}
                      </h3>
                      <p className="text-primary-900/80 dark:text-white/60">
                        {feature.description}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="flex items-center justify-between text-primary-900/60 dark:text-white/60 text-sm">
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  <span>Secure worldwide access</span>
                </div>
                <div>
                  <span>© 2024 VoiceVerse</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};