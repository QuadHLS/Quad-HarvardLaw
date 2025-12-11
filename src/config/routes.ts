/**
 * Route configuration for lazy-loaded pages
 * This file centralizes route imports for code splitting and prefetching
 */

// Route import functions for prefetching
// These match the lazy imports in App.tsx
export const routeImports = {
  '/outlines': () => import('../components/OutlinePage'),
  '/exams': () => import('../components/ExamPage'),
  '/reviews': () => import('../components/ReviewsPage'),
  '/planner': () => import('../components/PlannerPage'),
  '/calendar': () => import('../components/CalendarPage'),
  '/messaging': () => import('../components/MessagingPage'),
  '/directory': () => import('../components/DirectoryPage'),
  '/barreview': () => import('../components/BarReviewPage'),
  '/biglaw-guide': () => import('../components/BigLawGuidePage'),
  '/quadle': () => import('../components/QuadlePage'),
  '/feedback': () => import('../components/FeedbackPage'),
  '/profile': () => import('../components/NewProfilePage'),
  '/clubs': () => import('../components/ClubsPage'),
  '/club-account': () => import('../components/ClubAccountPage'),
} as const;

/**
 * Get the prefetch function for a route
 */
export function getRoutePrefetch(route: string): (() => Promise<any>) | undefined {
  // Handle exact matches
  if (route in routeImports) {
    return routeImports[route as keyof typeof routeImports];
  }

  // Handle dynamic routes
  if (route.startsWith('/course/')) {
    return () => import('../components/CoursePage');
  }
  if (route.startsWith('/club/')) {
    return () => import('../components/ClubDetailPage');
  }
  if (route.startsWith('/student-profile/')) {
    return () => import('../components/NewProfilePage');
  }

  return undefined;
}

