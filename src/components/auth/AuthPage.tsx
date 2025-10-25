import React, { useState, useEffect } from 'react'
import { LoginPage } from './LoginPage'
import { SignupForm } from './SignupForm'
import { ForgotPasswordForm } from './ForgotPasswordForm'

type AuthMode = 'login' | 'signup' | 'forgot-password'

export const AuthPage: React.FC = () => {
  const [authMode, setAuthMode] = useState<AuthMode>('login')
  const [urlError, setUrlError] = useState<string | null>(null)

  // Check for error in URL parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const errorParam = urlParams.get('error');
    
    console.log('AuthPage: Full URL:', window.location.href);
    console.log('AuthPage: URL params:', Object.fromEntries(urlParams.entries()));
    console.log('AuthPage: Error param:', errorParam);
    
    if (errorParam) {
      console.log('AuthPage: Setting error:', decodeURIComponent(errorParam));
      setUrlError(decodeURIComponent(errorParam));
      // Clean up the URL by removing the error parameter
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    }
  }, []);

  const handleSwitchToSignup = () => {
    setAuthMode('signup')
    setUrlError(null) // Clear error when switching modes
  }
  const handleSwitchToLogin = () => {
    setAuthMode('login')
    setUrlError(null) // Clear error when switching modes
  }
  const handleForgotPassword = () => setAuthMode('forgot-password')
  const handleBackToLogin = () => {
    setAuthMode('login')
    setUrlError(null) // Clear error when switching modes
  }

  return (
    <div className="min-h-screen flex flex-col items-center relative px-4" style={{ backgroundColor: 'var(--background-color, #f9f5f0)', minHeight: '100vh' }}>
      {/* Logo at the top - responsive sizing */}
      <div className="flex-shrink-0" style={{ marginTop: 'clamp(20px, 4vh, 60px)', paddingBottom: 'clamp(10px, 2vh, 20px)' }}>
        <div className="flex justify-center">
          <img 
            src="/Quad SVG.svg" 
            alt="Quad Logo" 
            className="w-auto object-contain"
            style={{ height: 'clamp(120px, 18vh, 200px)' }}
          />
        </div>
      </div>
      
      {/* Auth form - prioritized for space */}
      <div className="w-full max-w-md flex-1 flex flex-col justify-start" style={{ marginTop: '1.5rem', minHeight: 'clamp(400px, 50vh, 600px)' }}>
        {authMode === 'login' && (
          <LoginPage
            onSwitchToSignup={handleSwitchToSignup}
            onForgotPassword={handleForgotPassword}
            initialError={urlError}
          />
        )}
        {/* Debug: Show urlError value */}
        {urlError && (
          <div style={{ position: 'fixed', top: '10px', right: '10px', background: 'red', color: 'white', padding: '10px', zIndex: 9999 }}>
            DEBUG: urlError = "{urlError}"
          </div>
        )}
        {authMode === 'signup' && (
          <SignupForm onSwitchToLogin={handleSwitchToLogin} />
        )}
        {authMode === 'forgot-password' && (
          <ForgotPasswordForm onBackToLogin={handleBackToLogin} />
        )}
      </div>
    </div>
  )
}
