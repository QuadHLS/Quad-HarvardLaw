import React, { useState, useEffect } from 'react'
import { LoginPage } from './LoginPage'
import { SignupForm } from './SignupForm'
import { ForgotPasswordForm } from './ForgotPasswordForm'

type AuthMode = 'login' | 'signup' | 'forgot-password'

export const AuthPage: React.FC = () => {
  const [authMode, setAuthMode] = useState<AuthMode>('login')

  const handleSwitchToSignup = () => setAuthMode('signup')
  const handleSwitchToLogin = () => setAuthMode('login')
  const handleForgotPassword = () => setAuthMode('forgot-password')
  const handleBackToLogin = () => setAuthMode('login')

  return (
    <div className="min-h-screen flex flex-col items-center relative" style={{ backgroundColor: 'var(--background-color, #f9f5f0)', minHeight: '100vh' }}>
      {/* Logo at the top */}
      <div style={{ marginTop: '60px', paddingBottom: '80px' }}>
        <div className="flex justify-center">
          <img 
            src="/src/assets/Quad Logo.png" 
            alt="Quad Logo" 
            className="w-auto object-contain"
            style={{ height: '180px' }}
          />
        </div>
      </div>
      
      {/* Auth form */}
      <div className="w-full max-w-md" style={{ marginTop: '-1.5rem' }}>
        {authMode === 'login' && (
          <LoginPage
            onSwitchToSignup={handleSwitchToSignup}
            onForgotPassword={handleForgotPassword}
          />
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
