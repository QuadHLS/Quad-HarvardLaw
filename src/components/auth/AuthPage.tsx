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
    <div className="min-h-screen flex flex-col items-center relative" style={{ backgroundColor: '#f9f5f0', minHeight: '100vh' }}>
      {/* Logo at the top */}
      <div className="pt-16 pb-20">
        <div className="leading-none" style={{ fontSize: '7rem', letterSpacing: '0.02em', fontWeight: '500', fontFamily: 'system-ui, -apple-system, sans-serif', marginLeft: '-0.2rem' }}>
          <div className="flex justify-center" style={{ gap: '0.5rem', marginLeft: '-0.2rem' }}>
            <span style={{ color: '#00962c' }}>q</span>
            <span style={{ color: '#f71417' }}>u</span>
          </div>
          <div className="flex justify-center" style={{ gap: '0.5rem' }}>
            <span style={{ color: '#ffb100' }}>a</span>
            <span style={{ color: '#0078c3' }}>d</span>
          </div>
        </div>
      </div>
      
      {/* Auth form */}
      <div className="w-full max-w-md" style={{ marginTop: '1rem' }}>
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
