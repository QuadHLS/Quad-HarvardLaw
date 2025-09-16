import React, { useState } from 'react'
import { LoginForm } from './LoginForm'
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
    <div className="min-h-screen bg-white relative">
      <div className="absolute top-1/4 left-1/2 transform -translate-x-1/2 translate-y-40 w-full max-w-md px-4">
        {/* App Title */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl text-gray-900 font-bold">Quad Database</h1>
        </div>
        
        {/* Login/Signup form */}
        <div>
          {authMode === 'login' && (
            <LoginForm
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
    </div>
  )
}
