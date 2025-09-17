import React, { useState } from 'react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Alert, AlertDescription } from '../ui/alert'
import { useAuth } from '../../contexts/AuthContext'
import { Loader2, Eye, EyeOff, Mail, Lock, ArrowRight } from 'lucide-react'

interface LoginFormProps {
  onSwitchToSignup: () => void
  onForgotPassword: () => void
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSwitchToSignup, onForgotPassword }) => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { signIn } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await signIn(email, password)
    
    if (error) {
      setError(error.message)
    }
    
    setLoading(false)
  }

  return (
    <div className="w-full">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">Welcome Back</h2>
        <p className="text-gray-400">Sign in to continue your journey</p>
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
        
        {/* Password Field */}
        <div className="space-y-2">
          <Label htmlFor="password" className="text-white/80 text-sm font-medium">
            Password
          </Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              className="pl-12 pr-12 h-12 bg-white/5 border-white/10 text-white placeholder:text-gray-400 focus:border-purple-500 focus:ring-purple-500/20 rounded-xl backdrop-blur-sm"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-gray-400 hover:text-white"
              onClick={() => setShowPassword(!showPassword)}
              disabled={loading}
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>
        
        {/* Forgot Password */}
        <div className="flex justify-end">
          <Button
            type="button"
            variant="link"
            className="p-0 h-auto font-normal text-purple-400 hover:text-purple-300"
            onClick={onForgotPassword}
            disabled={loading}
          >
            Forgot password?
          </Button>
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
              Sign In
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </>
          )}
        </Button>
      </form>
      
      {/* Sign Up Link */}
      <div className="text-center mt-8">
        <p className="text-gray-400">
          Don't have an account?{' '}
          <Button
            variant="link"
            className="p-0 h-auto font-normal text-purple-400 hover:text-purple-300 underline-offset-4"
            onClick={onSwitchToSignup}
            disabled={loading}
          >
            Create one now
          </Button>
        </p>
      </div>
    </div>
  )
}
