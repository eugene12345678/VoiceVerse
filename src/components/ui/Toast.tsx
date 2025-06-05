import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

type ToastVariant = 'default' | 'success' | 'destructive' | 'info';

interface ToastProps {
  title: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
  onClose?: () => void;
}

interface ToastOptions extends Omit<ToastProps, 'onClose'> {}

let toastId = 0;
const toasts: { id: number; component: React.ReactNode }[] = [];
let setToastsState: React.Dispatch<React.SetStateAction<{ id: number; component: React.ReactNode }[]>> | null = null;

const Toast: React.FC<ToastProps> = ({
  title,
  description,
  variant = 'default',
  duration = 5000,
  onClose,
}) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => {
        onClose?.();
      }, 300);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const getIcon = () => {
    switch (variant) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'destructive':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'info':
        return <Info className="h-5 w-5 text-blue-500" />;
      default:
        return null;
    }
  };

  const getVariantClasses = () => {
    switch (variant) {
      case 'success':
        return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
      case 'destructive':
        return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
      case 'info':
        return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
      default:
        return 'bg-white dark:bg-dark-800 border-gray-200 dark:border-dark-700';
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className={`rounded-lg border shadow-lg p-4 flex items-start gap-3 max-w-md w-full ${getVariantClasses()}`}
        >
          {getIcon()}
          <div className="flex-1">
            <h3 className="font-medium text-dark-900 dark:text-white">{title}</h3>
            {description && <p className="text-sm text-dark-600 dark:text-dark-300 mt-1">{description}</p>}
          </div>
          <button
            onClick={() => setIsVisible(false)}
            className="text-dark-500 dark:text-dark-400 hover:text-dark-900 dark:hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export const ToastContainer: React.FC = () => {
  const [toastsList, setToastsList] = useState<{ id: number; component: React.ReactNode }[]>([]);

  useEffect(() => {
    setToastsState = setToastsList;
    return () => {
      setToastsState = null;
    };
  }, []);

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
      <AnimatePresence>
        {toastsList.map(({ id, component }) => (
          <motion.div
            key={id}
            initial={{ opacity: 0, x: 20, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            {component}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export const toast = (options: ToastOptions) => {
  const id = toastId++;
  
  const handleClose = () => {
    if (setToastsState) {
      setToastsState((prev) => prev.filter((toast) => toast.id !== id));
    }
  };

  const toastComponent = <Toast key={id} {...options} onClose={handleClose} />;
  
  const newToast = { id, component: toastComponent };
  toasts.push(newToast);
  
  if (setToastsState) {
    setToastsState([...toasts]);
  }

  return id;
};