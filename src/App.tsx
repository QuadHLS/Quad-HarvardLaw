import { useEffect, useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AuthPage } from './components/auth/AuthPage';
import AccessCodeVerification from './components/AccessCodeVerification';
import { OnboardingFlow } from './components/onboarding/OnboardingFlow';
import { supabase } from './lib/supabase';


// Main App Content Component
function AppContent({ user }: { user: any }) {
  // Local auth state: remove authGuard and check directly here
  const [authLoading, setAuthLoading] = useState(true);
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const checkAuthAndProfile = async () => {
      try {
        // Determine current user
        let currentUser = user;
        if (!currentUser) {
          const { data } = await supabase.auth.getSession();
          currentUser = data.session?.user ?? null;
        }

        if (!currentUser) {
          if (isMounted) {
            setIsVerified(false);
            setAuthLoading(false);
            setHasCompletedOnboarding(false);
          }
          return;
        }

        // Check if user has already verified their access code and completed onboarding
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('access_code_verified, classes_filled')
          .eq('id', currentUser.id)
          .single();

        if (error) {
          console.error('Error fetching profile:', error);
          // If profile doesn't exist or error, require verification
          if (isMounted) {
            setIsVerified(false);
            setHasCompletedOnboarding(false);
            setAuthLoading(false);
          }
          return;
        }

        if (isMounted) {
          // Set verification status based on database
          setIsVerified(profile.access_code_verified === true);
          // Set onboarding completion status based on classes_filled column
          setHasCompletedOnboarding(profile.classes_filled === true);
          setAuthLoading(false);
        }
      } catch (_err) {
        if (isMounted) {
          setIsVerified(false);
          setAuthLoading(false);
          setHasCompletedOnboarding(false);
        }
      }
    };

    checkAuthAndProfile();

    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      checkAuthAndProfile();
    });

    return () => {
      isMounted = false;
      listener.subscription.unsubscribe();
    };
  }, [user]);
  
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);

  // Show loading state while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--background-color, #f9f5f0)' }}>
        <div className="text-center">
          <div
            className="inline-flex items-center justify-center w-16 h-16 text-white rounded-full mb-4"
            style={{ backgroundColor: '#752432' }}
          >
            <span className="text-2xl font-semibold">HLS</span>
          </div>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show login page if user is not authenticated
  if (!user) {
    return <AuthPage />;
  }

  // Always require access code verification
  if (!isVerified) {
    return (
      <AccessCodeVerification
        onVerified={async () => {
          // Update the access_code_verified column in the database
          const { data: { user: currentUser } } = await supabase.auth.getUser();
          if (currentUser) {
            const { error } = await supabase
              .from('profiles')
              .update({ access_code_verified: true })
              .eq('id', currentUser.id);
            
            if (error) {
              console.error('Error updating access_code_verified:', error);
            }
          }
          
          // Mark verified locally
          setIsVerified(true);
        }}
      />
    );
  }

  // Show onboarding flow temporarily (always show for design changes)
  return (
    <OnboardingFlow onComplete={async () => {
      // Refresh profile data to check classes_filled status
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (currentUser) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('classes_filled')
          .eq('id', currentUser.id)
          .single();
        
        if (profile) {
          setHasCompletedOnboarding(profile.classes_filled === true);
        }
      }
    }} />
  );
}

// Main App Component with AuthProvider
export default function App() {
  return (
    <AuthProvider>
      <AppWithAuth />
    </AuthProvider>
  );
}

// App component that uses AuthContext
function AppWithAuth() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#752432]"></div>
      </div>
    );
  }

  return <AppContent user={user} />;
}