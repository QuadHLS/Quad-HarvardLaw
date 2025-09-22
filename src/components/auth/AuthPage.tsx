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
    <div className="min-h-screen flex flex-col items-center relative px-4" style={{ backgroundColor: 'var(--background-color, #f9f5f0)', minHeight: '100vh' }}>
      {/* Logo at the top - responsive sizing */}
      <div className="flex-shrink-0" style={{ marginTop: 'clamp(20px, 4vh, 60px)', paddingBottom: 'clamp(10px, 2vh, 20px)' }}>
        <div className="flex justify-center">
          <img 
            src="/Quad Logo.png" 
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
