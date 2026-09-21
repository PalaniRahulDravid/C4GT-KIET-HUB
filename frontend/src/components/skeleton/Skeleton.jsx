import React from 'react';

/**
 * Primitive Skeleton component supporting custom shape, size, shimmer animation, and light/dark mode.
 */
export default function Skeleton({
  className = '',
  variant = 'light', // 'light' | 'dark'
  rounded = 'rounded-lg',
  ...props
}) {
  const shimmerClass = variant === 'dark' ? 'skeleton-shimmer-dark' : 'skeleton-shimmer';

  return (
    <div
      aria-hidden="true"
      className={`${shimmerClass} ${rounded} ${className}`}
      {...props}
    />
  );
}
