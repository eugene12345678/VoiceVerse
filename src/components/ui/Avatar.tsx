import React from 'react';
import { cn } from '../../lib/utils';

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string;
  alt?: string;
  fallback?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  status?: 'online' | 'offline' | 'away' | 'busy' | 'none';
  isVerified?: boolean;
}

const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  (
    {
      className,
      src,
      alt = 'Avatar',
      fallback,
      size = 'md',
      status = 'none',
      isVerified = false,
      ...props
    },
    ref
  ) => {
    const [imgError, setImgError] = React.useState(false);

    const sizeClasses = {
      xs: 'h-6 w-6 text-xs',
      sm: 'h-8 w-8 text-sm',
      md: 'h-10 w-10 text-base',
      lg: 'h-12 w-12 text-lg',
      xl: 'h-16 w-16 text-xl',
    };

    const statusClasses = {
      online: 'bg-success-500',
      offline: 'bg-gray-400',
      away: 'bg-warning-500',
      busy: 'bg-error-500',
      none: 'hidden',
    };

    const getFallbackInitials = () => {
      if (fallback) return fallback.charAt(0).toUpperCase();
      if (alt) {
        const nameParts = alt.split(' ');
        if (nameParts.length > 1) {
          return `${nameParts[0].charAt(0)}${nameParts[1].charAt(0)}`.toUpperCase();
        }
        return alt.charAt(0).toUpperCase();
      }
      return '?';
    };

    return (
      <div className="relative inline-block" ref={ref} {...props}>
        <div
          className={cn(
            'relative flex shrink-0 overflow-hidden rounded-full bg-gray-100 dark:bg-dark-800',
            sizeClasses[size],
            className
          )}
        >
          {src && !imgError ? (
            <img
              src={src}
              alt={alt}
              className="h-full w-full object-cover"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200 font-medium">
              {getFallbackInitials()}
            </div>
          )}
        </div>
        
        {status !== 'none' && (
          <span
            className={cn(
              'absolute bottom-0 right-0 block rounded-full ring-2 ring-white dark:ring-dark-900',
              statusClasses[status],
              {
                'h-1.5 w-1.5': size === 'xs',
                'h-2 w-2': size === 'sm',
                'h-2.5 w-2.5': size === 'md',
                'h-3 w-3': size === 'lg',
                'h-3.5 w-3.5': size === 'xl',
              }
            )}
          />
        )}
        
        {isVerified && (
          <span className="absolute bottom-0 right-0 rounded-full bg-primary-500 text-white p-0.5 ring-2 ring-white dark:ring-dark-900">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={cn({
                'h-2 w-2': size === 'xs' || size === 'sm',
                'h-3 w-3': size === 'md',
                'h-4 w-4': size === 'lg' || size === 'xl',
              })}
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </span>
        )}
      </div>
    );
  }
);

Avatar.displayName = 'Avatar';

export { Avatar };