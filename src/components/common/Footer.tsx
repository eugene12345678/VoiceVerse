
import { Link } from 'react-router-dom';
import { Mic2, Instagram, Github, Linkedin, MessageCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export const Footer = () => {
  const handleLinkClick = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-white dark:bg-dark-950 border-t border-gray-200 dark:border-dark-800 pt-12 pb-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Brand column */}
          <div className="col-span-1 md:col-span-1">
            <Link to="/" onClick={handleLinkClick} className="flex items-center gap-2 mb-4">
              <div className="flex items-center space-x-1">
                <div className="bg-primary-600 text-white p-1.5 rounded-lg">
                  <Mic2 className="h-5 w-5" />
                </div>
                <span className="font-display font-semibold text-xl text-dark-900 dark:text-white">VoiceVerse</span>
              </div>
            </Link>
            <p className="text-dark-600 dark:text-dark-400 mb-4">
              Transform your voice into magic with cutting-edge AI technology.
            </p>
            <div className="flex gap-4">
              
              <motion.a href="https://www.instagram.com/matheng.e/" target="_blank" rel="noopener noreferrer" className="text-dark-500 hover:text-primary-600 dark:text-dark-400 dark:hover:text-primary-400 transition-colors" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                <Instagram size={20} />
              </motion.a>
              <motion.a href="https://github.com/eugene12345678" target="_blank" rel="noopener noreferrer" className="text-dark-500 hover:text-primary-600 dark:text-dark-400 dark:hover:text-primary-400 transition-colors" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                <Github size={20} />
              </motion.a>
              <motion.a href="https://www.linkedin.com/in/eugene-mathenge-981189262/" target="_blank" rel="noopener noreferrer" className="text-dark-500 hover:text-primary-600 dark:text-dark-400 dark:hover:text-primary-400 transition-colors" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                <Linkedin size={20} />
              </motion.a>
            </div>
          </div>

          {/* Product column */}
          <div className="col-span-1">
            <h6 className="font-semibold text-dark-900 dark:text-white mb-4">Product</h6>
            <ul className="space-y-2">
              {['Features', 'Pricing', 'Voice Studio', 'NFT Marketplace', 'API'].map((item) => (
                <li key={item}>
                  <Link 
                    to={`/${item.toLowerCase().replace(/ /g, '-')}`} 
                    onClick={handleLinkClick}
                    className="text-dark-600 hover:text-primary-600 dark:text-dark-400 dark:hover:text-primary-400 transition-colors"
                  >
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company column */}
          <div className="col-span-1">
            <h6 className="font-semibold text-dark-900 dark:text-white mb-4">Company</h6>
            <ul className="space-y-2">
              {['About', 'Team', 'Blog'].map((item) => (
                <li key={item}>
                  <Link 
                    to={`/${item.toLowerCase().replace(/ /g, '-')}`} 
                    onClick={handleLinkClick}
                    className="text-dark-600 hover:text-primary-600 dark:text-dark-400 dark:hover:text-primary-400 transition-colors"
                  >
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support column */}
          <div className="col-span-1">
            <h6 className="font-semibold text-dark-900 dark:text-white mb-4">Support</h6>
            <ul className="space-y-2">
              <li>
                <Link 
                  to="/contact" 
                  onClick={handleLinkClick}
                  className="text-dark-600 hover:text-primary-600 dark:text-dark-400 dark:hover:text-primary-400 transition-colors flex items-center gap-2"
                >
                  <MessageCircle className="h-4 w-4" />
                  Contact Support
                </Link>
              </li>
              {['Help Center', 'Documentation', 'Community', 'Privacy', 'Terms'].map((item) => (
                <li key={item}>
                  <Link 
                    to={`/${item.toLowerCase().replace(/ /g, '-')}`} 
                    onClick={handleLinkClick}
                    className="text-dark-600 hover:text-primary-600 dark:text-dark-400 dark:hover:text-primary-400 transition-colors"
                  >
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Footer bottom */}
        <div className="border-t border-gray-200 dark:border-dark-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-dark-500 dark:text-dark-400 text-sm mb-4 md:mb-0">
            © {new Date().getFullYear()} VoiceVerse. All rights reserved.
          </p>
          <div className="flex gap-6">
            <Link 
              to="/privacy" 
              onClick={handleLinkClick}
              className="text-dark-600 hover:text-primary-600 dark:text-dark-400 dark:hover:text-primary-400 text-sm transition-colors"
            >
              Privacy Policy
            </Link>
            <Link 
              to="/terms" 
              onClick={handleLinkClick}
              className="text-dark-600 hover:text-primary-600 dark:text-dark-400 dark:hover:text-primary-400 text-sm transition-colors"
            >
              Terms of Service
            </Link>
            <Link 
              to="/cookies" 
              onClick={handleLinkClick}
              className="text-dark-600 hover:text-primary-600 dark:text-dark-400 dark:hover:text-primary-400 text-sm transition-colors"
            >
              Cookie Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};