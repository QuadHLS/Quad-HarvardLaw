import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Eye, EyeOff } from 'lucide-react';

export function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [sessionValid, setSessionValid] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { updatePassword } = useAuth();

  // Check for valid session on component mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        // First, let Supabase process any URL parameters (tokens, etc.)
        // This is important for password reset links that contain tokens in the URL
        
        // Check if there are URL parameters that might contain tokens
        const urlParams = new URLSearchParams(window.location.search);
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const hasUrlParams = urlParams.toString() || hashParams.toString();
        
        // Extract tokens from URL parameters
        const accessToken = urlParams.get('access_token') || hashParams.get('access_token');
        const refreshToken = urlParams.get('refresh_token') || hashParams.get('refresh_token');
        const type = urlParams.get('type') || hashParams.get('type');
        const token = urlParams.get('token') || hashParams.get('token');
        const tokenHash = urlParams.get('token_hash') || hashParams.get('token_hash');
        
        // If we have tokens in the URL, set the session explicitly
        if (accessToken && refreshToken && type === 'recovery') {
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          });
          
          if (error) {
            console.error('ResetPasswordPage: Error setting session from tokens:', error?.message || 'Unknown error');
            setError('Failed to process password reset link. Please try again.');
            setCheckingSession(false);
            return;
          }
        } else if (tokenHash && type) {
          // For token_hash format (from ConfirmationURL), use verifyOtp
          try {
            const { data, error } = await supabase.auth.verifyOtp({
              token_hash: tokenHash,
              type: type
            });
            
            if (error) {
              console.error('ResetPasswordPage: Error verifying OTP with token hash:', error?.message || 'Unknown error');
              setError('Invalid or expired password reset link. Please request a new one.');
              setCheckingSession(false);
              return;
            }
            // The session should now be established
          } catch (err) {
            console.error('ResetPasswordPage: Exception verifying OTP with token hash:', err instanceof Error ? err.message : 'Unknown error');
            setError('Failed to process password reset link. Please try again.');
            setCheckingSession(false);
            return;
          }
          
          await new Promise(resolve => setTimeout(resolve, 500));
        } else if (token) {
          // For single token format, we need to use verifyOtp to exchange the token for a session
          try {
            const { data, error } = await supabase.auth.verifyOtp({
              token_hash: token,
              type: 'recovery'
            });
            
            if (error) {
              console.error('ResetPasswordPage: Error verifying OTP token:', error?.message || 'Unknown error');
              setError('Invalid or expired password reset link. Please request a new one.');
              setCheckingSession(false);
              return;
            }
            // The session should now be established
          } catch (err) {
            console.error('ResetPasswordPage: Exception verifying OTP token:', err instanceof Error ? err.message : 'Unknown error');
            setError('Failed to process password reset link. Please try again.');
            setCheckingSession(false);
            return;
          }
          
          await new Promise(resolve => setTimeout(resolve, 500));
        } else if (hasUrlParams) {
          // Wait longer if there are URL parameters to process
          await new Promise(resolve => setTimeout(resolve, 500));
        } else {
          // Wait a shorter time if no URL parameters
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Session check error:', error?.message || 'Unknown error');
          setError('Failed to verify session. Please try the password reset link again.');
          setCheckingSession(false);
          return;
        }

        if (!session) {
          setError('Auth session missing! Please click the password reset link from your email again.');
          setCheckingSession(false);
          return;
        }

        // Session is valid
        setSessionValid(true);
        setCheckingSession(false);
      } catch (err) {
        console.error('Unexpected error checking session:', err instanceof Error ? err.message : 'Unknown error');
        setError('An unexpected error occurred. Please try again.');
        setCheckingSession(false);
      }
    };

    checkSession();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Don't allow submission if session is not valid
    if (!sessionValid) {
      setError('Please wait for session validation to complete.');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { error } = await updatePassword(password);

      if (error) throw error;

      // Password updated successfully
      setSuccess(true);
      
      // Clear the password recovery flag
      sessionStorage.removeItem('isPasswordRecovery');
      
      setTimeout(() => {
        // Navigate back to home page
        window.history.pushState({}, '', '/');
        window.dispatchEvent(new PopStateEvent('popstate'));
      }, 2000);
    } catch (error: any) {
      setError(error.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  // Show loading state while checking session
  if (checkingSession) {
    return (
      <div className="min-h-screen flex flex-col items-center relative px-4" style={{ backgroundColor: 'var(--background-color, #f9f5f0)', minHeight: '100vh' }}>
        {/* Logo at the top - responsive sizing */}
        <div className="flex-shrink-0" style={{ marginTop: 'clamp(20px, 4vh, 60px)', paddingBottom: 'clamp(10px, 2vh, 20px)' }}>
          <div className="flex justify-center">
            <img 
              src="/QUAD.svg" 
              alt="Quad Logo" 
              className="w-auto object-contain"
              style={{ height: 'clamp(120px, 18vh, 200px)' }}
            />
          </div>
        </div>
        
        {/* Loading message */}
        <div className="w-full max-w-md flex-1 flex flex-col justify-start" style={{ marginTop: '2rem' }}>
          <Card className="w-full" style={{ backgroundColor: '#ffffff', border: 'none', boxShadow: '0 0 22px rgba(0, 0, 0, 0.12)', borderRadius: '1rem' }}>
            <CardHeader className="text-center pb-2 px-4 pt-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-4">
                <svg className="h-8 w-8 text-blue-600 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <CardTitle className="text-2xl">Verifying Session</CardTitle>
              <CardDescription className="text-sm" style={{ marginTop: '0.5rem' }}>
                Please wait while we verify your password reset session...
              </CardDescription>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <p className="text-sm text-gray-500 text-center">This may take a moment</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex flex-col items-center relative px-4" style={{ backgroundColor: 'var(--background-color, #f9f5f0)', minHeight: '100vh' }}>
        {/* Logo at the top - responsive sizing */}
        <div className="flex-shrink-0" style={{ marginTop: 'clamp(20px, 4vh, 60px)', paddingBottom: 'clamp(10px, 2vh, 20px)' }}>
          <div className="flex justify-center">
            <img 
              src="/QUAD.svg" 
              alt="Quad Logo" 
              className="w-auto object-contain"
              style={{ height: 'clamp(120px, 18vh, 200px)' }}
            />
          </div>
        </div>
        
        {/* Success message - moved up */}
        <div className="w-full max-w-md flex-1 flex flex-col justify-start" style={{ marginTop: '2rem' }}>
          <Card className="w-full" style={{ backgroundColor: '#ffffff', border: 'none', boxShadow: '0 0 22px rgba(0, 0, 0, 0.12)', borderRadius: '1rem' }}>
            <CardHeader className="text-center pb-2 px-4 pt-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
                <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <CardTitle className="text-2xl">Password Updated!</CardTitle>
              <CardDescription className="text-sm" style={{ marginTop: '0.5rem' }}>
                Your password has been successfully updated.
              </CardDescription>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <p className="text-sm text-gray-500 text-center">Redirecting to dashboard...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center relative px-4" style={{ backgroundColor: 'var(--background-color, #f9f5f0)', minHeight: '100vh' }}>
      {/* Logo at the top - responsive sizing */}
      <div className="flex-shrink-0" style={{ marginTop: 'clamp(20px, 4vh, 60px)', paddingBottom: 'clamp(10px, 2vh, 20px)' }}>
        <div className="flex justify-center">
          <img 
            src="/QUAD.svg" 
            alt="Quad Logo" 
            className="w-auto object-contain"
            style={{ height: 'clamp(120px, 18vh, 200px)' }}
          />
        </div>
      </div>
      
      {/* Reset password form - prioritized for space */}
      <div className="w-full max-w-md flex-1 flex flex-col justify-start" style={{ marginTop: '1.5rem', minHeight: 'clamp(400px, 50vh, 600px)' }}>
        <Card className="w-full" style={{ backgroundColor: '#ffffff', border: 'none', boxShadow: '0 0 22px rgba(0, 0, 0, 0.12)', borderRadius: '1rem' }}>
          <CardHeader className="text-center pb-2 px-4 pt-4">
            <CardTitle className="text-2xl">Set New Password</CardTitle>
            <CardDescription className="text-sm" style={{ marginTop: '0.5rem' }}>
              Enter your new password below
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {/* Error Alert */}
            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}
            
            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* New Password Field */}
              <div className="space-y-2">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  New Password
                </label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter new password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                    disabled={!sessionValid || loading}
                    className="w-full pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={!sessionValid || loading}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
              
              {/* Confirm Password Field */}
              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                  Confirm Password
                </label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={8}
                    disabled={!sessionValid || loading}
                    className="w-full pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={!sessionValid || loading}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={!sessionValid || loading}
                className="w-full"
                style={{ backgroundColor: '#00962c', color: 'white' }}
              >
                {loading ? 'Updating Password...' : 'Update Password'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
