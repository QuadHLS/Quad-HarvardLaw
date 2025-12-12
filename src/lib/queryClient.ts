import { QueryClient } from '@tanstack/react-query';

/**
 * localStorage adapter for React Query persistence
 * Persists cache to localStorage so it survives page reloads
 */

// Helper to serialize Map objects to JSON
const serializeMap = (map: Map<any, any>): Record<string, any> => {
  const obj: Record<string, any> = {};
  map.forEach((value, key) => {
    obj[String(key)] = value;
  });
  return obj;
};

// Helper to deserialize JSON back to Map
const deserializeMap = (obj: Record<string, any>): Map<string, string> => {
  const map = new Map<string, string>();
  Object.entries(obj).forEach(([key, value]) => {
    map.set(key, value);
  });
  return map;
};

// Helper to serialize Set objects to JSON
const serializeSet = (set: Set<any>): any[] => {
  return Array.from(set);
};

// Helper to deserialize JSON back to Set
const deserializeSet = (arr: any[]): Set<string> => {
  return new Set(arr);
};

// Helper to serialize feed data (converts Map to plain object)
const serializeFeedData = (data: any): any => {
  if (!data) return data;
  return {
    ...data,
    photoUrls: data.photoUrls instanceof Map ? serializeMap(data.photoUrls) : data.photoUrls,
  };
};

// Helper to deserialize feed data (converts plain object back to Map)
const deserializeFeedData = (data: any): any => {
  if (!data) return data;
  return {
    ...data,
    photoUrls: data.photoUrls && typeof data.photoUrls === 'object' && !(data.photoUrls instanceof Map)
      ? deserializeMap(data.photoUrls)
      : data.photoUrls,
  };
};

const localStorageAdapter = {
  persistClient: async (client: any) => {
    try {
      // Persist feed posts, planner, and directory data cache
      const feedQueries = client.getQueryCache().getAll().filter((query: any) => 
        Array.isArray(query.queryKey) && query.queryKey[0] === 'feedPosts'
      );
      
      const plannerQueries = client.getQueryCache().getAll().filter((query: any) => 
        Array.isArray(query.queryKey) && 
        (query.queryKey[0] === 'plannerCourses' || query.queryKey[0] === 'savedSchedules')
      );
      
      const directoryQueries = client.getQueryCache().getAll().filter((query: any) => 
        Array.isArray(query.queryKey) && query.queryKey[0] === 'directoryUsers'
      );
      
      const clubsQueries = client.getQueryCache().getAll().filter((query: any) => 
        Array.isArray(query.queryKey) && query.queryKey[0] === 'clubs'
      );
      
      const reviewsQueries = client.getQueryCache().getAll().filter((query: any) => 
        Array.isArray(query.queryKey) && 
        (query.queryKey[0] === 'reviews' || query.queryKey[0] === 'professors' || 
         query.queryKey[0] === 'courses' || query.queryKey[0] === 'professorCourses')
      );
      
      const barReviewQueries = client.getQueryCache().getAll().filter((query: any) => 
        Array.isArray(query.queryKey) && 
        (query.queryKey[0] === 'barReviewEvent' || query.queryKey[0] === 'barReviewAttendees')
      );
      
      const userProfileQueries = client.getQueryCache().getAll().filter((query: any) => 
        Array.isArray(query.queryKey) && query.queryKey[0] === 'profiles'
      );
      
      if (feedQueries.length > 0) {
        const feedCache = feedQueries.map((query: any) => {
          const state = query.state;
          return {
            queryKey: query.queryKey,
            queryHash: query.queryHash,
            data: state.data ? serializeFeedData(state.data) : null,
            dataUpdatedAt: state.dataUpdatedAt,
            status: state.status,
          };
        });
        
        const feedData = {
          timestamp: Date.now(),
          cache: feedCache,
        };
        
        localStorage.setItem('react-query-feed-cache', JSON.stringify(feedData));
      }
      
      if (plannerQueries.length > 0) {
        const plannerCache = plannerQueries.map((query: any) => {
          const state = query.state;
          return {
            queryKey: query.queryKey,
            queryHash: query.queryHash,
            data: state.data,
            dataUpdatedAt: state.dataUpdatedAt,
            status: state.status,
          };
        });
        
        const plannerData = {
          timestamp: Date.now(),
          cache: plannerCache,
        };
        
        localStorage.setItem('react-query-planner-cache', JSON.stringify(plannerData));
      }
      
      if (directoryQueries.length > 0) {
        const directoryCache = directoryQueries.map((query: any) => {
          const state = query.state;
          return {
            queryKey: query.queryKey,
            queryHash: query.queryHash,
            data: state.data,
            dataUpdatedAt: state.dataUpdatedAt,
            status: state.status,
          };
        });
        
        const directoryData = {
          timestamp: Date.now(),
          cache: directoryCache,
        };
        
        localStorage.setItem('react-query-directory-cache', JSON.stringify(directoryData));
      }
      
      if (clubsQueries.length > 0) {
        const clubsCache = clubsQueries.map((query: any) => {
          const state = query.state;
          // Serialize Set to array for JSON storage
          const serializedData = state.data ? {
            ...state.data,
            joinedClubs: state.data.joinedClubs instanceof Set 
              ? serializeSet(state.data.joinedClubs) 
              : state.data.joinedClubs
          } : null;
          return {
            queryKey: query.queryKey,
            queryHash: query.queryHash,
            data: serializedData,
            dataUpdatedAt: state.dataUpdatedAt,
            status: state.status,
          };
        });
        
        const clubsData = {
          timestamp: Date.now(),
          cache: clubsCache,
        };
        
        localStorage.setItem('react-query-clubs-cache', JSON.stringify(clubsData));
      }
      
      if (reviewsQueries.length > 0) {
        const reviewsCache = reviewsQueries.map((query: any) => {
          const state = query.state;
          return {
            queryKey: query.queryKey,
            queryHash: query.queryHash,
            data: state.data,
            dataUpdatedAt: state.dataUpdatedAt,
            status: state.status,
          };
        });
        
        const reviewsData = {
          timestamp: Date.now(),
          cache: reviewsCache,
        };
        
        localStorage.setItem('react-query-reviews-cache', JSON.stringify(reviewsData));
      }
      
      if (barReviewQueries.length > 0) {
        const barReviewCache = barReviewQueries.map((query: any) => {
          const state = query.state;
          return {
            queryKey: query.queryKey,
            queryHash: query.queryHash,
            data: state.data,
            dataUpdatedAt: state.dataUpdatedAt,
            status: state.status,
          };
        });
        
        const barReviewData = {
          timestamp: Date.now(),
          cache: barReviewCache,
        };
        
        localStorage.setItem('react-query-barreview-cache', JSON.stringify(barReviewData));
      }
      
      if (userProfileQueries.length > 0) {
        const userProfileCache = userProfileQueries.map((query: any) => {
          const state = query.state;
          return {
            queryKey: query.queryKey,
            queryHash: query.queryHash,
            data: state.data,
            dataUpdatedAt: state.dataUpdatedAt,
            status: state.status,
          };
        });
        
        const userProfileData = {
          timestamp: Date.now(),
          cache: userProfileCache,
        };
        
        localStorage.setItem('react-query-userprofile-cache', JSON.stringify(userProfileData));
      }
    } catch (error) {
      console.warn('Failed to persist query cache:', error);
    }
  },
  
  restoreClient: async () => {
    // This method is kept for compatibility but restoreCache() is used directly
    // since we need synchronous restoration
    return undefined;
  },
  
  removeClient: async () => {
    try {
      localStorage.removeItem('react-query-feed-cache');
      localStorage.removeItem('react-query-planner-cache');
      localStorage.removeItem('react-query-directory-cache');
      localStorage.removeItem('react-query-clubs-cache');
      localStorage.removeItem('react-query-reviews-cache');
      localStorage.removeItem('react-query-barreview-cache');
      localStorage.removeItem('react-query-userprofile-cache');
    } catch (error) {
      console.warn('Failed to remove query cache:', error);
    }
  },
};

/**
 * TanStack Query Client Configuration
 * 
 * This client handles:
 * - Caching Supabase queries
 * - Deduplicating simultaneous requests
 * - Background revalidation
 * - Stale data management
 * - Persistent cache (survives page reloads)
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache data for 5 minutes (data stays fresh for 5 min)
      staleTime: 5 * 60 * 1000,
      // Keep unused data in cache for 30 minutes (longer for feed to persist across navigation)
      gcTime: 30 * 60 * 1000, // Previously cacheTime - 30 min for feed persistence
      // Retry failed requests 1 time
      retry: 1,
      // Don't refetch on window focus (better UX - no loading spinners when switching tabs)
      // Data is still fresh for 5 minutes, so refetching is unnecessary
      refetchOnWindowFocus: false,
      // Don't refetch on mount if data is fresh (shows cached data immediately)
      refetchOnMount: false,
      // Don't refetch on reconnect if data is fresh
      refetchOnReconnect: false,
    },
    mutations: {
      // Retry failed mutations 1 time
      retry: 1,
    },
  },
});

// Debounce timer for persistence
let persistTimeout: NodeJS.Timeout | null = null;

// Persist cache to localStorage whenever it changes (debounced)
// This catches both direct updates (setQueryData) and refetches (invalidateQueries)
queryClient.getQueryCache().subscribe((event) => {
  if (event && event.query) {
    const queryKey = event.query.queryKey;
    // Persist feed posts, planner, directory, clubs, reviews, bar review, and user profile queries
    if (Array.isArray(queryKey) && 
        (queryKey[0] === 'feedPosts' || queryKey[0] === 'plannerCourses' || queryKey[0] === 'savedSchedules' || 
         queryKey[0] === 'directoryUsers' || queryKey[0] === 'clubs' || queryKey[0] === 'reviews' || 
         queryKey[0] === 'professors' || queryKey[0] === 'courses' || queryKey[0] === 'professorCourses' ||
         queryKey[0] === 'barReviewEvent' || queryKey[0] === 'barReviewAttendees' || queryKey[0] === 'profiles')) {
      // Clear existing timeout
      if (persistTimeout) {
        clearTimeout(persistTimeout);
      }
      // Debounce persistence to avoid excessive writes (1 second)
      // This ensures realtime updates are persisted without overwhelming localStorage
      persistTimeout = setTimeout(() => {
        localStorageAdapter.persistClient(queryClient);
        persistTimeout = null;
      }, 1000);
    }
  }
});

// Restore cache from localStorage on initialization (synchronously)
const restoreCache = () => {
  try {
    const maxAge = 30 * 60 * 1000; // 30 minutes
    
    // Restore feed cache
    const feedCached = localStorage.getItem('react-query-feed-cache');
    if (feedCached) {
      const parsed = JSON.parse(feedCached);
      
      // Check if cache is still valid (not older than 30 minutes)
      if (Date.now() - parsed.timestamp > maxAge) {
        localStorage.removeItem('react-query-feed-cache');
      } else {
        // Restore feed cache synchronously
        parsed.cache.forEach((item: any) => {
          // Only restore if data exists and is not too old
          if (item.data && item.dataUpdatedAt) {
            const dataAge = Date.now() - item.dataUpdatedAt;
            if (dataAge < maxAge) {
              try {
                const queryKey = item.queryKey;
                const restoredData = deserializeFeedData(item.data);
                // Set query data immediately so it's available when queries run
                queryClient.setQueryData(queryKey, restoredData, {
                  updatedAt: item.dataUpdatedAt,
                });
              } catch (error) {
                console.warn('Failed to restore query:', item.queryKey, error);
              }
            }
          }
        });
      }
    }
    
    // Restore planner cache
    const plannerCached = localStorage.getItem('react-query-planner-cache');
    if (plannerCached) {
      const parsed = JSON.parse(plannerCached);
      
      // Check if cache is still valid (not older than 30 minutes)
      if (Date.now() - parsed.timestamp > maxAge) {
        localStorage.removeItem('react-query-planner-cache');
      } else {
        // Restore planner cache synchronously
        parsed.cache.forEach((item: any) => {
          // Only restore if data exists and is not too old
          if (item.data && item.dataUpdatedAt) {
            const dataAge = Date.now() - item.dataUpdatedAt;
            if (dataAge < maxAge) {
              try {
                const queryKey = item.queryKey;
                // Set query data immediately so it's available when queries run
                queryClient.setQueryData(queryKey, item.data, {
                  updatedAt: item.dataUpdatedAt,
                });
              } catch (error) {
                console.warn('Failed to restore query:', item.queryKey, error);
              }
            }
          }
        });
      }
    }
    
    // Restore directory cache
    const directoryCached = localStorage.getItem('react-query-directory-cache');
    if (directoryCached) {
      const parsed = JSON.parse(directoryCached);
      
      // Check if cache is still valid (not older than 30 minutes)
      if (Date.now() - parsed.timestamp > maxAge) {
        localStorage.removeItem('react-query-directory-cache');
      } else {
        // Restore directory cache synchronously
        parsed.cache.forEach((item: any) => {
          // Only restore if data exists and is not too old
          if (item.data && item.dataUpdatedAt) {
            const dataAge = Date.now() - item.dataUpdatedAt;
            if (dataAge < maxAge) {
              try {
                const queryKey = item.queryKey;
                // Set query data immediately so it's available when queries run
                queryClient.setQueryData(queryKey, item.data, {
                  updatedAt: item.dataUpdatedAt,
                });
              } catch (error) {
                console.warn('Failed to restore query:', item.queryKey, error);
              }
            }
          }
        });
      }
    }
    
    // Restore clubs cache
    const clubsCached = localStorage.getItem('react-query-clubs-cache');
    if (clubsCached) {
      const parsed = JSON.parse(clubsCached);
      if (Date.now() - parsed.timestamp > maxAge) {
        localStorage.removeItem('react-query-clubs-cache');
      } else {
        parsed.cache.forEach((item: any) => {
          if (item.data && item.dataUpdatedAt) {
            const dataAge = Date.now() - item.dataUpdatedAt;
            if (dataAge < maxAge) {
              try {
                // Deserialize Set from array
                const restoredData = {
                  ...item.data,
                  joinedClubs: Array.isArray(item.data.joinedClubs)
                    ? deserializeSet(item.data.joinedClubs)
                    : (item.data.joinedClubs instanceof Set ? item.data.joinedClubs : new Set<string>())
                };
                queryClient.setQueryData(item.queryKey, restoredData, {
                  updatedAt: item.dataUpdatedAt,
                });
              } catch (error) {
                console.warn('Failed to restore query:', item.queryKey, error);
              }
            }
          }
        });
      }
    }
    
    // Restore reviews cache
    const reviewsCached = localStorage.getItem('react-query-reviews-cache');
    if (reviewsCached) {
      const parsed = JSON.parse(reviewsCached);
      if (Date.now() - parsed.timestamp > maxAge) {
        localStorage.removeItem('react-query-reviews-cache');
      } else {
        parsed.cache.forEach((item: any) => {
          if (item.data && item.dataUpdatedAt) {
            const dataAge = Date.now() - item.dataUpdatedAt;
            if (dataAge < maxAge) {
              try {
                queryClient.setQueryData(item.queryKey, item.data, {
                  updatedAt: item.dataUpdatedAt,
                });
              } catch (error) {
                console.warn('Failed to restore query:', item.queryKey, error);
              }
            }
          }
        });
      }
    }
    
    // Restore bar review cache
    const barReviewCached = localStorage.getItem('react-query-barreview-cache');
    if (barReviewCached) {
      const parsed = JSON.parse(barReviewCached);
      if (Date.now() - parsed.timestamp > maxAge) {
        localStorage.removeItem('react-query-barreview-cache');
      } else {
        parsed.cache.forEach((item: any) => {
          if (item.data && item.dataUpdatedAt) {
            const dataAge = Date.now() - item.dataUpdatedAt;
            if (dataAge < maxAge) {
              try {
                queryClient.setQueryData(item.queryKey, item.data, {
                  updatedAt: item.dataUpdatedAt,
                });
              } catch (error) {
                console.warn('Failed to restore query:', item.queryKey, error);
              }
            }
          }
        });
      }
    }
    
    // Restore user profile cache
    const userProfileCached = localStorage.getItem('react-query-userprofile-cache');
    if (userProfileCached) {
      const parsed = JSON.parse(userProfileCached);
      if (Date.now() - parsed.timestamp > maxAge) {
        localStorage.removeItem('react-query-userprofile-cache');
      } else {
        parsed.cache.forEach((item: any) => {
          if (item.data && item.dataUpdatedAt) {
            const dataAge = Date.now() - item.dataUpdatedAt;
            if (dataAge < maxAge) {
              try {
                queryClient.setQueryData(item.queryKey, item.data, {
                  updatedAt: item.dataUpdatedAt,
                });
              } catch (error) {
                console.warn('Failed to restore query:', item.queryKey, error);
              }
            }
          }
        });
      }
    }
  } catch (error) {
    console.warn('Failed to restore cache:', error);
  }
};

// Restore cache immediately (synchronously) before any queries run
if (typeof window !== 'undefined') {
  restoreCache();
}

// Also persist on window beforeunload (synchronously)
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    // Clear any pending debounced persistence
    if (persistTimeout) {
      clearTimeout(persistTimeout);
    }
    // Persist immediately before page unloads
    localStorageAdapter.persistClient(queryClient);
  });
  
  // Also persist when page becomes hidden (mobile browsers)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      if (persistTimeout) {
        clearTimeout(persistTimeout);
      }
      localStorageAdapter.persistClient(queryClient);
    }
  });
}
