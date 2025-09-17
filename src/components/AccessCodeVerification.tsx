import React, { useEffect, useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from './ui/card';
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

  // If user is already verified, do not render this page at all
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session) return;
        const { data: profile } = await supabase
          .from('profiles')
          .select('access_code_verified')
          .eq('id', session.user.id)
          .single();
        if (isMounted && profile?.access_code_verified === true) {
          onVerified();
        } else if (isMounted) {
          setInitialized(true);
        }
      } catch (_err) {
        if (isMounted) setInitialized(true);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [onVerified]);

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
      className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-purple-900 relative overflow-hidden"
      style={{
        background:
          'linear-gradient(135deg, #0f0f0f 0%, #000000 70%, #1a0a0a 100%)',
        minHeight: '100vh',
      }}
    >
      <div className="absolute inset-0 bg-black/50" />

      <div className="relative z-10 h-full flex flex-col items-center justify-center px-4">
        <Card className="w-full max-w-md bg-black/60 backdrop-blur-md border-gray-800">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-16 w-16 bg-red-600/20 rounded-full flex items-center justify-center">
              <Shield className="h-8 w-8 text-red-500" />
            </div>
            <CardTitle className="text-2xl text-white">
              Verify Your Access
            </CardTitle>
            <CardDescription className="text-gray-400">
              Enter your access code to continue to the HLS Database
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleVerification} className="space-y-4">
              {error && (
                <Alert
                  variant="destructive"
                  className="bg-red-900/20 border-red-800"
                >
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <label
                  htmlFor="accessCode"
                  className="text-sm font-medium text-gray-200"
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
                  className="uppercase bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500"
                />
                <p className="text-xs text-gray-400">
                  This code was provided by your administrator or in your
                  invitation email
                </p>
              </div>

              <Button
                type="submit"
                className="w-full bg-red-600 hover:bg-red-700 text-white"
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

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-400">
                Don't have an access code?
              </p>
              <a
                href="mailto:admin@law.harvard.edu"
                className="text-red-400 hover:text-red-300 text-sm hover:underline"
              >
                Contact your administrator
              </a>
            </div>

            <div className="mt-4 text-center">
              <button
                onClick={() => supabase.auth.signOut()}
                className="text-gray-400 hover:text-gray-300 text-sm underline"
              >
                Sign out and try a different account
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
