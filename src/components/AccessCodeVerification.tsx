import React, { useEffect, useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Alert, AlertDescription } from './ui/alert';
import { Loader2, Lock, Shield } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface AccessCodeVerificationProps {
  onVerified: () => void;
}

export default function AccessCodeVerification({
  onVerified,
}: AccessCodeVerificationProps) {
  const [accessCode, setAccessCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [initialized, setInitialized] = useState(false);

  // Always require access code verification - no database check needed
  useEffect(() => {
    setInitialized(true);
  }, []);

  if (!initialized) {
    // Avoid rendering anything until we confirm user is unverified
    return null;
  }

  const handleVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Get the current session
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        setError('No active session. Please log in again.');
        setLoading(false);
        return;
      }

      const response = await fetch(
        'https://ujsnnvdbujguiejhxuds.supabase.co/functions/v1/verify-access-code',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ accessCode: accessCode.toUpperCase() }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Verification failed');
      }

      if (data.verified) {
        // Success! Call the callback to update parent state
        console.log('Access code verified successfully');
        onVerified();
      } else {
        throw new Error('Verification failed - not verified');
      }
    } catch (err: any) {
      setError(err.message || 'Invalid access code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="h-screen bg-gradient-to-br from-gray-900 via-black to-purple-900 relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #0f0f0f 0%, #000000 70%, #1a0a0a 100%)',
        minHeight: '100vh'
      }}
    >
      <style>{`
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
        {/* Animated background elements */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-red-600/10 rounded-full blur-3xl animate-float"></div>
        <div className="absolute top-3/4 right-1/4 w-48 h-48 bg-purple-600/10 rounded-full blur-2xl animate-float" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-1/4 left-1/3 w-32 h-32 bg-blue-600/10 rounded-full blur-xl animate-float" style={{ animationDelay: '4s' }}></div>
        
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
        
      </div>

      <div className="relative z-10 h-full flex flex-col items-center justify-center px-4">
        <div 
          className="w-full max-w-md backdrop-blur-xl rounded-2xl p-3 shadow-2xl"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(165, 28, 48, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
          }}
        >
          <div className="text-center mb-6">
            <div className="mx-auto mb-4 h-16 w-16 bg-red-600/20 rounded-full flex items-center justify-center">
              <Shield className="h-8 w-8 text-red-500" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-1">Verify Your Access</h2>
            <p className="text-gray-400 text-sm">
              Enter your access code to continue to the HLS Database
            </p>
          </div>
          <form onSubmit={handleVerification} className="space-y-6">
              {error && (
                <Alert
                  variant="destructive"
                  className="bg-red-900/20 border-red-800"
                >
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-3">
                <label
                  htmlFor="accessCode"
                  className="text-sm font-medium text-white"
                >
                  Access Code
                </label>
                <Input
                  id="accessCode"
                  type="text"
                  placeholder="Enter your access code"
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value)}
                  required
                  disabled={loading}
                  className="uppercase bg-white/5 border-white/10 text-white placeholder:text-gray-400 focus:border-red-600 focus:ring-red-600/20 rounded-lg backdrop-blur-sm text-sm"
                />
                <p className="text-xs text-gray-400 mt-2">
                  This code was provided by your administrator or in your
                  invitation email
                </p>
              </div>

              <Button
                type="submit"
                className="w-full bg-red-600 hover:bg-red-700 text-white h-10"
                disabled={loading || !accessCode.trim()}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <Lock className="mr-2 h-4 w-4" />
                    Verify Access
                  </>
                )}
              </Button>
          </form>

          <div className="mt-8 text-center space-y-2">
              <p className="text-sm text-gray-400">
                Don't have an access code?
              </p>
              <a
                href="mailto:admin@law.harvard.edu"
                className="text-gray-400 hover:text-gray-300 text-sm hover:underline block"
              >
                Contact your administrator
              </a>
            </div>

          <div className="mt-6 text-center">
            <button
              onClick={() => supabase.auth.signOut()}
              className="text-gray-400 hover:text-gray-300 text-sm underline"
            >
              Sign out and try a different account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
