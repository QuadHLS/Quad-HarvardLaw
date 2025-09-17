import React, { useState, useEffect } from 'react'
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
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        {/* Gradient Orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-pink-500/20 rounded-full blur-3xl animate-pulse delay-2000"></div>
        
        {/* Floating Particles */}
        <div className="absolute top-20 left-20 w-2 h-2 bg-white/30 rounded-full animate-bounce delay-300"></div>
        <div className="absolute top-40 right-32 w-1 h-1 bg-blue-400/50 rounded-full animate-bounce delay-700"></div>
        <div className="absolute bottom-32 left-40 w-1.5 h-1.5 bg-purple-400/40 rounded-full animate-bounce delay-1000"></div>
        <div className="absolute bottom-20 right-20 w-2 h-2 bg-pink-400/30 rounded-full animate-bounce delay-500"></div>
        
        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          {/* App Logo and Title */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 mb-6 shadow-2xl">
              <span className="text-2xl font-bold text-white">HLS</span>
            </div>
            <h1 className="text-4xl font-bold text-white mb-2 bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              Quad Database
            </h1>
            <p className="text-gray-400 text-lg">
              Your gateway to law school excellence
            </p>
          </div>
          
          {/* Auth Form Container */}
          <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-8 shadow-2xl">
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
    </div>
  )
}
