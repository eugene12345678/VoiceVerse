import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Mic2,
  LogIn,
  Mail,
  Lock,
  
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  Github,
  Globe,
  Shield,
  Fingerprint,
  Key,
  Smartphone
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { useAuthStore } from '../store/authStore';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  rememberMe: z.boolean().optional()
});

type LoginFormData = z.infer<typeof loginSchema>;

const securityFeatures = [
  {
    icon: <Shield className="h-5 w-5" />,
    title: 'Advanced Security',
    description: 'Enterprise-grade encryption'
  },
  {
    icon: <Fingerprint className="h-5 w-5" />,
    title: 'Biometric Auth',
    description: 'Fingerprint & Face ID'
  },
  {
    icon: <Key className="h-5 w-5" />,
    title: '2FA Protection',
    description: 'Two-factor authentication'
  }
];

export const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, loginWithGoogle, loginWithGithub, isLoading } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [showTwoFactor, setShowTwoFactor] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [socialLoading, setSocialLoading] = useState<string | null>(null);
  
  // Get redirect path from URL query params
  const searchParams = new URLSearchParams(location.search);
  const redirectPath = searchParams.get('redirect');
  
  const { register, handleSubmit, formState: { errors }, watch } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      rememberMe: false
    }
  });

  const onSubmit = async (data: LoginFormData) => {
    setLoginError(null);
    try {
      if (data.email.includes('@enterprise')) {
        setShowTwoFactor(true);
        return;
      }

      await login(data.email, data.password);
      setLoginSuccess(true);
      
      // Simulate loading state
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check if there's a redirect path or pending recording
      if (redirectPath) {
        navigate(`/${redirectPath}`);
      } else {
        navigate('/');
      }
    } catch (error: any) {
      setLoginError(error.message || 'Invalid email or password. Please try again.');
    }
  };

  const handleGoogleLogin = async () => {
    setLoginError(null);
    setSocialLoading('google');
    try {
      await loginWithGoogle();
      setLoginSuccess(true);
      
      // Redirect after successful login
      if (redirectPath) {
        navigate(`/${redirectPath}`);
      } else {
        navigate('/');
      }
    } catch (error: any) {
      setLoginError(error.message || 'Google login failed. Please try again.');
    } finally {
      setSocialLoading(null);
    }
  };

  const handleGithubLogin = async () => {
    setLoginError(null);
    setSocialLoading('github');
    try {
      await loginWithGithub();
      setLoginSuccess(true);
      
      // Redirect after successful login
      if (redirectPath) {
        navigate(`/${redirectPath}`);
      } else {
        navigate('/');
      }
    } catch (error: any) {
      setLoginError(error.message || 'GitHub login failed. Please try again.');
    } finally {
      setSocialLoading(null);
    }
  };

  const handleTwoFactorSubmit = async () => {
    if (twoFactorCode === '123456') { // Demo code
      setLoginSuccess(true);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check if there's a redirect path or pending recording
      if (redirectPath) {
        navigate(`/${redirectPath}`);
      } else {
        navigate('/');
      }
    } else {
      setLoginError('Invalid verification code');
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="min-h-screen bg-gradient-mesh dark:bg-dark-950 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        {/* Login Form */}
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
                Welcome Back
              </h1>
              <p className="text-dark-600 dark:text-dark-400 mb-6">
                Sign in to continue to VoiceVerse
              </p>

              {!showTwoFactor ? (
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
                        placeholder="Enter your password"
                      />
                      <button
                        type="button"
                        onClick={togglePasswordVisibility}
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
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        {...register('rememberMe')}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                      <span className="text-sm text-dark-600 dark:text-dark-400">
                        Remember me
                      </span>
                    </label>
                    <Link
                      to="/forgot-password"
                      className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
                    >
                      Forgot password?
                    </Link>
                  </div>

                  {loginError && (
                    <div className="flex items-center gap-2 text-error-600 text-sm">
                      <AlertCircle className="h-4 w-4" />
                      {loginError}
                    </div>
                  )}

                  {loginSuccess && (
                    <div className="flex items-center gap-2 text-success-600 text-sm">
                      <CheckCircle2 className="h-4 w-4" />
                      Login successful! Redirecting...
                    </div>
                  )}

                  <Button
                    type="submit"
                    fullWidth
                    isLoading={isLoading}
                    leftIcon={<LogIn className="h-5 w-5" />}
                  >
                    Sign In
                  </Button>
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="text-center">
                    <Smartphone className="h-12 w-12 text-primary-600 dark:text-primary-400 mx-auto mb-4" />
                    <h2 className="text-lg font-semibold text-dark-900 dark:text-white mb-2">
                      Two-Factor Authentication
                    </h2>
                    <p className="text-dark-600 dark:text-dark-400 text-sm mb-4">
                      Enter the 6-digit code sent to your device
                    </p>
                  </div>

                  <div className="flex gap-2 justify-center">
                    <input
                      type="text"
                      maxLength={6}
                      value={twoFactorCode}
                      onChange={(e) => setTwoFactorCode(e.target.value)}
                      className="w-48 px-3 py-2 text-center bg-white dark:bg-dark-800 border border-gray-300 dark:border-dark-700 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-2xl tracking-wider"
                      placeholder="000000"
                    />
                  </div>

                  {loginError && (
                    <div className="flex items-center gap-2 text-error-600 text-sm justify-center">
                      <AlertCircle className="h-4 w-4" />
                      {loginError}
                    </div>
                  )}

                  <Button
                    fullWidth
                    onClick={handleTwoFactorSubmit}
                    isLoading={isLoading}
                  >
                    Verify Code
                  </Button>

                  <button
                    type="button"
                    className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 text-center w-full"
                    onClick={() => setShowTwoFactor(false)}
                  >
                    Back to Login
                  </button>
                </div>
              )}

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
                    onClick={handleGoogleLogin}
                    isLoading={socialLoading === 'google'}
                  >
                    Google
                  </Button>
                  <Button
                    variant="outline"
                    fullWidth
                    leftIcon={<Github className="h-5 w-5" />}
                    onClick={handleGithubLogin}
                    isLoading={socialLoading === 'github'}
                  >
                    GitHub
                  </Button>
                </div>
              </div>
            </Card>

            <p className="mt-4 text-center text-sm text-dark-600 dark:text-dark-400">
              Don't have an account?{' '}
              <Link
                to="/signup"
                className="font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
              >
                Sign up
              </Link>
            </p>
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
              <h2 className="text-3xl font-display font-bold text-primary-950 dark:text-white mb-6">
                Transform Your Voice with AI
              </h2>
              
              <div className="space-y-6 mb-8">
                {securityFeatures.map((feature, index) => (
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
                  <span>Available worldwide</span>
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