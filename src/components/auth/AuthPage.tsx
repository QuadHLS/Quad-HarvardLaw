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
    <div className="min-h-screen">
      {authMode === 'login' && (
        <LoginPage
          onSwitchToSignup={handleSwitchToSignup}
          onForgotPassword={handleForgotPassword}
        />
      )}
      {authMode === 'signup' && (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-lg p-8">
            <SignupForm onSwitchToLogin={handleSwitchToLogin} />
          </div>
        </div>
      )}
      {authMode === 'forgot-password' && (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-lg p-8">
            <ForgotPasswordForm onBackToLogin={handleBackToLogin} />
          </div>
        </div>
      )}
    </div>
  )
}
