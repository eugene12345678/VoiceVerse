import { create } from 'zustand';
import { getCurrentSubscription, Subscription } from '../lib/api/subscription';

interface SubscriptionState {
  subscription: Subscription | null;
  isLoading: boolean;
  error: string | null;
  isPro: boolean;
}

interface SubscriptionStore extends SubscriptionState {
  fetchSubscription: () => Promise<void>;
  checkProStatus: () => boolean;
  clearSubscription: () => void;
}

export const useSubscriptionStore = create<SubscriptionStore>((set, get) => ({
  subscription: null,
  isLoading: false,
  error: null,
  isPro: false,

  fetchSubscription: async () => {
    set({ isLoading: true, error: null });
    
    try {
      const subscription = await getCurrentSubscription();
      const isPro = subscription?.status === 'ACTIVE' && 
                   (subscription.planType === 'PRO' || 
                    subscription.planType === 'PREMIUM' || 
                    subscription.planType === 'ENTERPRISE');
      
      set({ 
        subscription,
        isPro,
        isLoading: false 
      });
    } catch (error: any) {
      console.error('Error fetching subscription:', error);
      set({ 
        error: error.message || 'Failed to fetch subscription',
        isLoading: false,
        isPro: false
      });
    }
  },

  checkProStatus: () => {
    const { subscription } = get();
    return subscription?.status === 'ACTIVE' && 
           (subscription.planType === 'PRO' || 
            subscription.planType === 'PREMIUM' || 
            subscription.planType === 'ENTERPRISE');
  },

  clearSubscription: () => {
    set({
      subscription: null,
      isPro: false,
      error: null
    });
  }
}));