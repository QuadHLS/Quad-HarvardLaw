import React, { useState } from 'react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Alert, AlertDescription } from '../ui/alert'
import { Loader2, ArrowRight } from 'lucide-react'

interface AccessCodePageProps {
  onComplete: () => void
}

export const AccessCodePage: React.FC<AccessCodePageProps> = ({ onComplete }) => {
  const [accessCode, setAccessCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Simulate validation - just check if code is entered
      if (accessCode.trim()) {
        // Call onComplete to proceed to onboarding
        onComplete()
      } else {
        setError('Please enter an access code')
      }
    } catch (err) {
      setError('Verification failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div 
      className="h-screen bg-gradient-to-br from-gray-900 via-black to-purple-900 relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #0f0f0f 0%, #000000 70%, #1a0a0a 100%)',
        minHeight: '100vh'
      }}
    >
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
            Enter your access code to continue
          </p>
        </div>

        {/* Form section */}
        <div className="w-full max-w-xs">
          <div 
            className="backdrop-blur-xl rounded-2xl p-6 shadow-2xl"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(20px)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(165, 28, 48, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
            }}
          >
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-white mb-1">Access Code</h2>
              <p className="text-gray-400 text-sm">Enter your access code to continue</p>
            </div>

            {error && (
              <Alert className="mb-4 bg-red-500/10 border-red-500/20 text-red-400">
                <AlertDescription className="text-sm">{error}</AlertDescription>
              </Alert>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="accessCode" className="text-white/80 text-sm font-medium">
                  Access Code
                </Label>
                <Input
                  id="accessCode"
                  type="text"
                  placeholder="Enter your access code"
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value)}
                  required
                  disabled={loading}
                  className="h-10 style={{ backgroundColor: '#f9f5f0' }}/5 border-white/10 text-white placeholder:text-gray-400 focus:border-red-600 focus:ring-red-600/20 rounded-lg backdrop-blur-sm text-sm"
                />
              </div>
              
              <Button 
                type="submit" 
                className="w-full h-10 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold rounded-lg shadow-lg hover:shadow-red-500/25 transition-all duration-300 group disabled:opacity-50 text-sm" 
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  <>
                    Continue
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}