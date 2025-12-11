import React, { useRef } from 'react';
import { Link, LinkProps, useLocation } from 'react-router-dom';
import { getRoutePrefetch } from '../config/routes';

interface PrefetchLinkProps extends Omit<LinkProps, 'to'> {
  to: string;
  prefetchRoute?: () => Promise<any>;
  prefetchData?: () => Promise<any>;
  children: React.ReactNode;
}

/**
 * PrefetchLink - A Link component that prefetches route bundles and data on hover/viewport enter
 * 
 * This component wraps React Router's Link and:
 * - Prefetches the route's JavaScript bundle on hover/focus
 * - Optionally prefetches data for that route
 * - Improves perceived navigation speed
 * 
 * Usage:
 * <PrefetchLink to="/messaging" prefetchRoute={() => import('./components/MessagingPage')}>
 *   Messaging
 * </PrefetchLink>
 */
export function PrefetchLink({
  to,
  prefetchRoute,
  prefetchData,
  children,
  onClick,
  ...linkProps
}: PrefetchLinkProps) {
  // Perf run: disable prefetch to avoid pulling lazy chunks early
  return (
    <Link
      to={to}
      onClick={onClick}
      {...linkProps}
    >
      {children}
    </Link>
  );

  const location = useLocation();
  const prefetchedRef = useRef(false);
  const dataPrefetchedRef = useRef(false);
  const isActive = location.pathname === to || location.pathname.startsWith(to + '/');

  // Use route config if no explicit prefetchRoute provided
  const routePrefetch = prefetchRoute || getRoutePrefetch(to);

  // Don't prefetch if already on this route
  if (isActive) {
    return <Link to={to} onClick={onClick} {...linkProps}>{children}</Link>;
  }

  const handleMouseEnter = () => {
    // Prefetch route bundle
    if (!prefetchedRef.current && routePrefetch) {
      routePrefetch().catch(() => {
        // Silently fail - prefetching is optional
      });
      prefetchedRef.current = true;
    }

    // Prefetch data (with slight delay to prioritize bundle)
    if (!dataPrefetchedRef.current && prefetchData) {
      setTimeout(() => {
        prefetchData().catch(() => {
          // Silently fail - prefetching is optional
        });
        dataPrefetchedRef.current = true;
      }, 100);
    }
  };

  const handleFocus = () => {
    // Same as mouse enter for keyboard navigation
    handleMouseEnter();
  };

  // Combine onClick handlers - preserve existing onClick behavior
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (onClick) {
      onClick(e);
    }
  };

  return (
    <Link
      to={to}
      onMouseEnter={handleMouseEnter}
      onFocus={handleFocus}
      onClick={handleClick}
      {...linkProps}
    >
      {children}
    </Link>
  );
}

