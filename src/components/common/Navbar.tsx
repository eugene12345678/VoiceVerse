import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Home, 
  Mic2, 
  Play, 
  Trophy, 
  Diamond, 
  User, 
  Settings, 
  Menu, 
  X, 
  Moon, 
  Sun,
  LogOut,
  Crown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../ui/Button';
import { IconButton } from '../ui/IconButton';
import { Avatar } from '../ui/Avatar';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import { cn } from '../../lib/utils';

const NavLink = ({ 
  to, 
  icon, 
  label, 
  isActive,
  onClick,
  badge
}: { 
  to: string; 
  icon: React.ReactNode; 
  label: string; 
  isActive: boolean;
  onClick?: () => void;
  badge?: string;
}) => {
  return (
    <Link
      to={to}
      className={cn(
        'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors relative',
        isActive 
          ? 'text-primary-600 dark:text-primary-400' 
          : 'text-dark-700 hover:bg-gray-100 dark:text-dark-300 dark:hover:bg-dark-800'
      )}
      onClick={onClick}
    >
      <div className={cn(
        'h-5 w-5',
        isActive ? 'text-primary-600 dark:text-primary-400' : 'text-dark-500 dark:text-dark-400'
      )}>
        {icon}
      </div>
      <span className={cn(
        'font-medium',
        isActive ? 'font-semibold' : ''
      )}>
        {label}
      </span>
      {badge && (
        <span className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-0.5 bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 text-xs rounded-full">
          {badge}
        </span>
      )}
      {isActive && (
        <motion.div
          layoutId="activeNavIndicator"
          className="absolute left-0 w-1 h-8 bg-primary-600 dark:bg-primary-400 rounded-r-full"
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        />
      )}
    </Link>
  );
};

export const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuthStore();
  const { theme, setTheme } = useThemeStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const navLinks = [
    { path: '/', label: 'Home', icon: <Home className="h-5 w-5" /> },
    { path: '/studio', label: 'Studio', icon: <Mic2 className="h-5 w-5" /> },
    { path: '/feed', label: 'Feed', icon: <Play className="h-5 w-5" /> },
    { path: '/challenges', label: 'Challenges', icon: <Trophy className="h-5 w-5" /> },
    { path: '/marketplace', label: 'NFTs', icon: <Diamond className="h-5 w-5" /> },
    { path: '/subscription', label: 'Pro', icon: <Crown className="h-5 w-5" />, badge: 'Upgrade' },
    { path: '/profile', label: 'Profile', icon: <User className="h-5 w-5" /> },
    { path: '/settings', label: 'Settings', icon: <Settings className="h-5 w-5" /> },
  ];

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
    closeMobileMenu();
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white/80 dark:bg-dark-950/80 backdrop-blur-md border-b border-gray-200 dark:border-dark-800">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2" onClick={closeMobileMenu}>
            <div className="flex items-center space-x-1">
              <div className="bg-primary-600 text-white p-1.5 rounded-lg">
                <Mic2 className="h-5 w-5" />
              </div>
              <span className="font-display font-semibold text-xl text-dark-900 dark:text-white">VoiceVerse</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {navLinks.slice(0, 6).map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={cn(
                  'px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2',
                  location.pathname === link.path
                    ? 'bg-primary-50 text-primary-600 dark:bg-dark-800 dark:text-primary-400'
                    : 'text-dark-700 hover:bg-gray-100 dark:text-dark-300 dark:hover:bg-dark-800'
                )}
              >
                {link.label}
                {link.badge && (
                  <span className="px-1.5 py-0.5 bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 text-xs rounded-full">
                    {link.badge}
                  </span>
                )}
              </Link>
            ))}
          </nav>

          {/* Right Section */}
          <div className="flex items-center gap-2">
            {/* Theme Toggle */}
            <IconButton
              variant="ghost"
              size="sm"
              icon={theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              onClick={toggleTheme}
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            />

            {/* User Menu (Desktop) */}
            {isAuthenticated ? (
              <div className="hidden md:flex items-center gap-2">
                <Link to="/profile">
                  <Avatar 
                    src={user?.avatar}
                    alt={user?.displayName}
                    size="sm"
                    isVerified={user?.isVerified}
                  />
                </Link>
                <IconButton
                  variant="ghost"
                  size="sm"
                  icon={<LogOut className="h-5 w-5" />}
                  onClick={handleLogout}
                  aria-label="Log out"
                />
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-2">
                 <Link 
                    to="/login" 
                    onClick={closeMobileMenu}
                    className=" inline-flex items-center justify-center px-4 py-2 font-medium border border-gray-300 dark:border-dark-700 rounded-lg hover:bg-gray-50 dark:hover:bg-dark-800 transition-colors text-center"
                  >
                   Log In
                  </Link>
                  <Link 
                   to="/signup" 
                   onClick={closeMobileMenu}
                   className=" inline-flex items-center justify-center px-4 py-2 font-medium border border-gray-300 dark:border-dark-700 rounded-lg hover:bg-gray-50 dark:hover:bg-dark-800 transition-colors text-center"
                  >
                   Sign Up
                  </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <IconButton
              variant="ghost"
              size="sm"
              icon={isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              onClick={toggleMobileMenu}
              className="md:hidden"
              aria-label="Toggle menu"
            />
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden bg-white dark:bg-dark-950 border-b border-gray-200 dark:border-dark-800"
          >
            <div className="container mx-auto px-4 py-4">
              <nav className="flex flex-col space-y-1">
                {navLinks.map((link) => (
                  <NavLink
                    key={link.path}
                    to={link.path}
                    icon={link.icon}
                    label={link.label}
                    badge={link.badge}
                    isActive={location.pathname === link.path}
                    onClick={closeMobileMenu}
                  />
                ))}
              </nav>
              
              {isAuthenticated ? (
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 px-4 py-3 mt-4 w-full rounded-lg transition-colors text-error-600 hover:bg-error-50 dark:text-error-400 dark:hover:bg-dark-800"
                >
                  <LogOut className="h-5 w-5" />
                  <span className="font-medium">Log Out</span>
                </button>
              ) : (
                <div className="flex flex-col gap-2 p-4 mt-2">
                  <Link 
                    to="/login" 
                    onClick={closeMobileMenu}
                    className="w-full inline-flex items-center justify-center px-4 py-2 font-medium border border-gray-300 dark:border-dark-700 rounded-lg hover:bg-gray-50 dark:hover:bg-dark-800 transition-colors text-center"
                  >
                   Log In
                  </Link>
                  <Link 
                   to="/signup" 
                   onClick={closeMobileMenu}
                   className="w-full inline-flex items-center justify-center px-4 py-2 font-medium border border-gray-300 dark:border-dark-700 rounded-lg hover:bg-gray-50 dark:hover:bg-dark-800 transition-colors text-center"
                  >
                   Sign Up
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};