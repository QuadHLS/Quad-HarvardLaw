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
    <div 
      className="h-screen bg-gradient-to-br from-gray-900 via-black to-purple-900 relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #0f0f0f 0%, #000000 70%, #1a0a0a 100%)',
        minHeight: '100vh'
      }}
    >
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(-20px) scale(1.05); }
        }
        @keyframes slideIn {
          0% { opacity: 0; transform: translateX(-50%) rotate(15deg) translateX(-100px); }
          50% { opacity: 1; }
          100% { opacity: 0; transform: translateX(-50%) rotate(15deg) translateX(100px); }
        }
      `}</style>
      <div className="absolute inset-0">
        {/* Awesome landing page background */}
        {/* Animated gradient orbs */}
        <div 
          className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl animate-pulse"
          style={{ 
            background: 'radial-gradient(circle, rgba(59, 130, 246, 0.3) 0%, rgba(147, 51, 234, 0.2) 50%, transparent 100%)',
            animation: 'float 6s ease-in-out infinite'
          }}
        ></div>
        <div 
          className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full blur-3xl animate-pulse delay-2000"
          style={{ 
            background: 'radial-gradient(circle, rgba(236, 72, 153, 0.3) 0%, rgba(168, 85, 247, 0.2) 50%, transparent 100%)',
            animation: 'float 8s ease-in-out infinite reverse'
          }}
        ></div>
        <div 
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full blur-2xl animate-pulse delay-4000"
          style={{ 
            background: 'radial-gradient(circle, rgba(34, 197, 94, 0.2) 0%, rgba(59, 130, 246, 0.1) 50%, transparent 100%)',
            animation: 'float 10s ease-in-out infinite'
          }}
        ></div>
        
        {/* Floating particles removed */}
        
        {/* Subtle grid pattern */}
        <div 
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255, 255, 255, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px'
          }}
        ></div>
        
        {/* Animated lines */}
        <div 
          className="absolute top-1/4 left-1/2 w-32 h-px bg-gradient-to-r from-transparent via-blue-400/30 to-transparent animate-pulse delay-2000"
          style={{ 
            transform: 'translateX(-50%) rotate(15deg)',
            animation: 'slideIn 3s ease-in-out infinite'
          }}
        ></div>
        <div 
          className="absolute bottom-1/4 right-1/2 w-24 h-px bg-gradient-to-l from-transparent via-pink-400/30 to-transparent animate-pulse delay-4000"
          style={{ 
            transform: 'translateX(50%) rotate(-25deg)',
            animation: 'slideIn 4s ease-in-out infinite reverse'
          }}
        ></div>
      </div>

      {/* Main content container */}
      <div className="relative z-10 h-full flex flex-col items-center justify-center px-4">
        {/* Header section */}
        <div className="text-center mb-16">
          <h1 
            className="font-bold mb-4"
            style={{
              fontSize: '2.5rem',
              lineHeight: '1.2',
              background: 'linear-gradient(90deg, #a51c30, #dc2626)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              textShadow: '0 0 20px rgba(165, 28, 48, 0.5), 0 0 40px rgba(220, 38, 38, 0.3)'
            }}
          >
            Harvard Law School
          </h1>
          <h2 
            className="font-bold mb-6"
            style={{
              fontSize: '2rem',
              lineHeight: '1.2',
              background: 'linear-gradient(90deg, #a51c30, #dc2626)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              textShadow: '0 0 15px rgba(165, 28, 48, 0.4), 0 0 30px rgba(220, 38, 38, 0.2)'
            }}
          >
            Quad
          </h2>
          <p 
            className="text-lg font-medium"
            style={{ color: '#ffffff' }}
          >
            Your gateway to law school excellence
          </p>
        </div>

        {/* Form section */}
        <div className="w-full max-w-xs mt-8">
          
          <div 
            className="backdrop-blur-xl rounded-2xl p-3 shadow-2xl"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(20px)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(165, 28, 48, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
            }}
          >
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
