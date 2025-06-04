import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mic2,
  UserPlus,
  Mail,
  Lock,
  User,
  ArrowRight,
  Shield,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Github,
  Globe,
  Star,
  Users,
  Award,
  Crown,
  MessageCircle,
  Sparkles,
  ChevronDown,
  Building2,
  TrendingUp
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { useAuthStore } from '../store/authStore';

const signupSchema = z.object({
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  email: z.string().email('Invalid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  confirmPassword: z.string(),
  acceptTerms: z.boolean().refine(val => val === true, 'You must accept the terms and conditions'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type SignupFormData = z.infer<typeof signupSchema>;

const features = [
  {
    icon: <Shield className="h-5 w-5" />,
    title: 'Secure Platform',
    description: 'Enterprise-grade security'
  },
  {
    icon: <Crown className="h-5 w-5" />,
    title: 'Premium Features',
    description: 'Access to pro tools'
  },
  {
    icon: <Globe className="h-5 w-5" />,
    title: 'Global Community',
    description: 'Connect worldwide'
  }
];

const stats = [
  { icon: <Users className="h-5 w-5" />, value: '100K+', label: 'Active Users' },
  { icon: <Star className="h-5 w-5" />, value: '4.9/5', label: 'User Rating' },
  { icon: <Award className="h-5 w-5" />, value: '50+', label: 'Awards Won' }
];

export const SignupPage = () => {
  const navigate = useNavigate();
  const { register: registerUser, registerWithGoogle, registerWithGithub, isLoading } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [socialLoading, setSocialLoading] = useState<string | null>(null);
  
  const { register, handleSubmit, formState: { errors }, watch } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      acceptTerms: false
    }
  });

  const password = watch('password');

  React.useEffect(() => {
    if (!password) {
      setPasswordStrength(0);
      return;
    }

    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;

    setPasswordStrength(strength);
  }, [password]);

  const [signupError, setSignupError] = useState<string | null>(null);
  
  const onSubmit = async (data: SignupFormData) => {
    setSignupError(null);
    try {
      await registerUser(data.username, data.email, data.password);
      setSignupSuccess(true);
      setTimeout(() => navigate('/'), 2000);
    } catch (error: any) {
      console.error('Registration failed:', error);
      setSignupError(error.message || 'Registration failed. Please try again.');
    }
  };

  const handleGoogleSignup = async () => {
    setSignupError(null);
    setSocialLoading('google');
    try {
      await registerWithGoogle();
      setSignupSuccess(true);
      setTimeout(() => navigate('/'), 2000);
    } catch (error: any) {
      console.error('Google registration failed:', error);
      setSignupError(error.message || 'Google registration failed. Please try again.');
    } finally {
      setSocialLoading(null);
    }
  };

  const handleGithubSignup = async () => {
    setSignupError(null);
    setSocialLoading('github');
    try {
      await registerWithGithub();
      setSignupSuccess(true);
      setTimeout(() => navigate('/'), 2000);
    } catch (error: any) {
      console.error('GitHub registration failed:', error);
      setSignupError(error.message || 'GitHub registration failed. Please try again.');
    } finally {
      setSocialLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-mesh dark:bg-dark-950 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        <div className="w-full max-w-md mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Logo */}
            <div className="text-center mb-8">
              <Link to="/" className="inline-flex items-center gap-2">
                <div className="bg-primary-600 text-white p-2 rounded-xl">
                  <Mic2 className="h-6 w-6" />
                </div>
                <span className="font-display font-bold text-2xl text-dark-900 dark:text-white">
                  VoiceVerse
                </span>
              </Link>
            </div>

            <Card className="p-6">
              <h1 className="text-2xl font-display font-bold text-dark-900 dark:text-white mb-2">
                Create Your Account
              </h1>
              <p className="text-dark-600 dark:text-dark-400 mb-6">
                Join our community of voice creators
              </p>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">
                    Username
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-dark-400" />
                    </div>
                    <input
                      type="text"
                      {...register('username')}
                      className="block w-full pl-10 px-3 py-2 bg-white dark:bg-dark-800 border border-gray-300 dark:border-dark-700 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="Choose a username"
                    />
                  </div>
                  {errors.username && (
                    <p className="mt-1 text-sm text-error-600 flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      {errors.username.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">
                    Email
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-dark-400" />
                    </div>
                    <input
                      type="email"
                      {...register('email')}
                      className="block w-full pl-10 px-3 py-2 bg-white dark:bg-dark-800 border border-gray-300 dark:border-dark-700 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="Enter your email"
                    />
                  </div>
                  {errors.email && (
                    <p className="mt-1 text-sm text-error-600 flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      {errors.email.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-dark-400" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      {...register('password')}
                      className="block w-full pl-10 pr-10 px-3 py-2 bg-white dark:bg-dark-800 border border-gray-300 dark:border-dark-700 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="Create a strong password"
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
                  {errors.password && (
                    <p className="mt-1 text-sm text-error-600 flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      {errors.password.message}
                    </p>
                  )}
                  {/* Password strength indicator */}
                  {password && (
                    <div className="mt-2">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="h-1 flex-1 bg-gray-200 dark:bg-dark-700 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all ${
                              passwordStrength <= 2
                                ? 'bg-error-500'
                                : passwordStrength <= 3
                                ? 'bg-warning-500'
                                : 'bg-success-500'
                            }`}
                            style={{ width: `${(passwordStrength / 5) * 100}%` }}
                          />
                        </div>
                        <span className="text-xs text-dark-500 dark:text-dark-400">
                          {passwordStrength <= 2
                            ? 'Weak'
                            : passwordStrength <= 3
                            ? 'Medium'
                            : 'Strong'}
                        </span>
                      </div>
                    </div>
                  )}
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
                      {...register('confirmPassword')}
                      className="block w-full pl-10 pr-10 px-3 py-2 bg-white dark:bg-dark-800 border border-gray-300 dark:border-dark-700 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="Confirm your password"
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
                  {errors.confirmPassword && (
                    <p className="mt-1 text-sm text-error-600 flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      {errors.confirmPassword.message}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    {...register('acceptTerms')}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label className="text-sm text-dark-600 dark:text-dark-400">
                    I accept the{' '}
                    <Link
                      to="/terms"
                      className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
                    >
                      Terms of Service
                    </Link>
                    {' '}and{' '}
                    <Link
                      to="/privacy"
                      className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
                    >
                      Privacy Policy
                    </Link>
                  </label>
                </div>
                {errors.acceptTerms && (
                  <p className="text-sm text-error-600 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {errors.acceptTerms.message}
                  </p>
                )}

                {signupError && (
                  <div className="flex items-center gap-2 text-error-600 text-sm">
                    <AlertCircle className="h-4 w-4" />
                    {signupError}
                  </div>
                )}

                {signupSuccess && (
                  <div className="flex items-center gap-2 text-success-600 text-sm">
                    <CheckCircle2 className="h-4 w-4" />
                    Account created successfully! Redirecting...
                  </div>
                )}

                <Button
                  type="submit"
                  fullWidth
                  isLoading={isLoading}
                  leftIcon={<UserPlus className="h-5 w-5" />}
                >
                  Create Account
                </Button>
              </form>

              <div className="mt-6">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300 dark:border-dark-700" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white dark:bg-dark-900 text-dark-500 dark:text-dark-400">
                      Or continue with
                    </span>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    fullWidth
                    leftIcon={<Globe className="h-5 w-5" />}
                    onClick={handleGoogleSignup}
                    isLoading={socialLoading === 'google'}
                  >
                    Google
                  </Button>
                  <Button
                    variant="outline"
                    fullWidth
                    leftIcon={<Github className="h-5 w-5" />}
                    onClick={handleGithubSignup}
                    isLoading={socialLoading === 'github'}
                  >
                    GitHub
                  </Button>
                </div>
              </div>
            </Card>

            <p className="mt-4 text-center text-sm text-dark-600 dark:text-dark-400">
              Already have an account?{' '}
              <Link
                to="/login"
                className="font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
              >
                Log in
              </Link>
            </p>
          </motion.div>
        </div>

        {/* Right side - Info Section */}
        <div className="hidden lg:block">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="bg-primary-600/10 dark:bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-primary-200/20 dark:border-white/20">
              <h2 className="text-3xl font-display font-bold text-primary-950 dark:text-white mb-6">
                Join the Voice Revolution
              </h2>
              
              {/* Features */}
              <div className="space-y-6 mb-8">
                {features.map((feature, index) => (
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

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 mb-8">
                {stats.map((stat, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.6 + index * 0.1 }}
                    className="text-center"
                  >
                    <div className="flex items-center justify-center mb-2 text-primary-700 dark:text-primary-400">
                      {stat.icon}
                    </div>
                    <div className="text-2xl font-bold text-primary-950 dark:text-white mb-1">
                      {stat.value}
                    </div>
                    <div className="text-primary-900/80 dark:text-white/60 text-sm">
                      {stat.label}
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Testimonial */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="bg-primary-500/5 dark:bg-white/5 rounded-xl p-6"
              >
                <div className="flex items-center gap-4 mb-4">
                  <img
                    src="https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=600"
                    alt="User"
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div>
                    <div className="text-primary-950 dark:text-white font-medium">Sarah Johnson</div>
                    <div className="text-primary-900/80 dark:text-white/60">Voice Artist</div>
                  </div>
                </div>
                <p className="text-primary-900 dark:text-white/80 italic">
                  "VoiceVerse has transformed my creative process. The AI voice tools are incredible, and the community is amazing!"
                </p>
              </motion.div>

              {/* CTA */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1 }}
                className="mt-8 text-center"
              >
                <Button
                  variant="primary"
                  size="lg"
                  leftIcon={<Sparkles className="h-5 w-5" />}
                  className="bg-white text-primary-600 hover:bg-primary-50"
                >
                  Start Creating Now
                </Button>
                <div className="mt-4 text-primary-900/80 dark:text-white/60 text-sm">
                  Free trial available • No credit card required
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};