import React, { useState } from 'react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Alert, AlertDescription } from '../ui/alert'
import { useAuth } from '../../contexts/AuthContext'
import { Loader2, ArrowLeft, CheckCircle, Mail, KeyRound } from 'lucide-react'

interface ForgotPasswordFormProps {
  onBackToLogin: () => void
}

export const ForgotPasswordForm: React.FC<ForgotPasswordFormProps> = ({ onBackToLogin }) => {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const { resetPassword } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess(false)

    const { error } = await resetPassword(email)
    
    if (error) {
      setError(error.message)
    } else {
      setSuccess(true)
    }
    
    setLoading(false)
  }

  if (success) {
    return (
      <div className="w-full text-center">
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-500/20 mb-6">
            <CheckCircle className="h-10 w-10 text-green-400" />
          </div>
          <h3 className="text-2xl font-bold text-white mb-2">Check your email</h3>
          <p className="text-gray-400">
            We've sent you a password reset link to <span className="text-purple-400">{email}</span>
          </p>
        </div>
        <Button
          onClick={onBackToLogin}
          className="w-full h-12 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-purple-500/25 transition-all duration-300"
        >
          Back to Sign In
        </Button>
      </div>
    )
  }

  return (
    <div className="w-full">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">Reset Password</h2>
        <p className="text-gray-400">Enter your email and we'll send you a reset link</p>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert className="mb-6 bg-red-500/10 border-red-500/20 text-red-400">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Email Field */}
        <div className="space-y-2">
          <Label htmlFor="email" className="text-white/80 text-sm font-medium">
            Email Address
          </Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              className="pl-12 h-12 bg-white/5 border-white/10 text-white placeholder:text-gray-400 focus:border-purple-500 focus:ring-purple-500/20 rounded-xl backdrop-blur-sm"
            />
          </div>
        </div>
        
        {/* Submit Button */}
        <Button 
          type="submit" 
          className="w-full h-12 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-purple-500/25 transition-all duration-300 group disabled:opacity-50" 
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          ) : (
            <>
              <KeyRound className="mr-2 h-5 w-5" />
              Send Reset Link
            </>
          )}
        </Button>
      </form>
      
      {/* Back to Login Link */}
      <div className="text-center mt-8">
        <Button
          variant="link"
          className="p-0 h-auto font-normal text-purple-400 hover:text-purple-300 underline-offset-4"
          onClick={onBackToLogin}
          disabled={loading}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Sign In
        </Button>
      </div>
    </div>
  )
}
