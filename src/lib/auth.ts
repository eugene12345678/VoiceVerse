import { useAuthStore } from '../store/authStore';

/**
 * Hook to access authentication state and methods
 * This is a wrapper around useAuthStore to maintain compatibility
 * with the CheckoutPage component
 */
export const useAuth = () => {
  const { user, isAuthenticated, login, logout, register, checkAuth, isLoading } = useAuthStore();
  
  return {
    user,
    isAuthenticated,
    login,
    logout,
    register,
    checkAuth,
    isLoading
  };
};