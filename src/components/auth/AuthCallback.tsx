import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Loader2 } from 'lucide-react';

export const AuthCallback: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleAuthCallback = async () => {
      console.log('AuthCallback: Processing OAuth callback');
      
      // Check for OAuth errors in URL parameters
      const urlParams = new URLSearchParams(window.location.search);
      const errorParam = urlParams.get('error');
      const errorDescription = urlParams.get('error_description');
      
      if (errorParam) {
        console.log('AuthCallback: OAuth error detected:', errorParam, errorDescription);
        let errorMessage = 'OAuth authentication failed.';
        
        // Provide specific error messages based on OAuth error codes
        switch (errorParam) {
          case 'access_denied':
            errorMessage = 'Google login was cancelled or denied. Please try again.';
            break;
          case 'server_error':
            errorMessage = 'Server error during Google login. Please try again.';
            break;
          case 'temporarily_unavailable':
            errorMessage = 'Google login is temporarily unavailable. Please try again later.';
            break;
          default:
            errorMessage = errorDescription || 'Google login failed. Please try again.';
        }
        
        // Redirect to login page with error message
        const encodedError = encodeURIComponent(errorMessage);
        window.history.pushState({}, '', `/auth?error=${encodedError}`);
        window.dispatchEvent(new PopStateEvent('popstate'));
        return;
      }
      
      try {
        const { data, error } = await supabase.auth.getSession();
        console.log('AuthCallback: Session data:', { session: !!data.session, error });

        if (error) {
          console.log('AuthCallback: Session error:', error);
          setError(error.message);
          return;
        }

        if (data.session) {
          // User is authenticated (validation handled by server-side hook), redirect to main app
          console.log('AuthCallback: User authenticated, redirecting to app');
          window.history.pushState({}, '', '/');
          window.dispatchEvent(new PopStateEvent('popstate'));
        } else {
          // No session, redirect to login
          console.log('AuthCallback: No session, redirecting to login');
          window.history.pushState({}, '', '/');
          window.dispatchEvent(new PopStateEvent('popstate'));
        }
      } catch (err) {
        console.error('AuthCallback: Error processing callback:', err);
        setError('An unexpected error occurred');
      } finally {
        setLoading(false);
      }
    };

    handleAuthCallback();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Completing sign in...</p>
        </div>
      </div>
    );
  }


  return null;
};
