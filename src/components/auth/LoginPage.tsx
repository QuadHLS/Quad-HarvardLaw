import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Alert, AlertDescription } from '../ui/alert';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { useAuth } from '../../contexts/AuthContext';
import { Loader2, Eye, EyeOff } from 'lucide-react';

interface LoginPageProps {
  onSwitchToSignup: () => void;
  onForgotPassword: () => void;
  initialError?: string | null;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onSwitchToSignup,
  onForgotPassword,
  initialError,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { signIn, signInWithGoogle } = useAuth();

  // Handle initialError prop
  useEffect(() => {
    if (initialError) {
      setError(initialError);
    }
  }, [initialError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { error } = await signIn(email, password);

    if (error) {
      setError(error.message);
    }

    setLoading(false);
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');

    const { error } = await signInWithGoogle();

    if (error) {
      console.error('Google sign in error:', error?.message || "Unknown error");
      setError(error.message);
      setLoading(false);
    }
  };

  return (
    <Card className="w-full" style={{ backgroundColor: '#ffffff', border: 'none', boxShadow: '0 0 22px rgba(0, 0, 0, 0.06)' }}>
          <CardHeader className="text-center pb-1 px-3 sm:px-4 pt-3 sm:pt-4">
            <CardTitle className="text-xl sm:text-2xl">Sign in</CardTitle>
            <CardDescription className="text-sm sm:text-base" style={{ marginTop: '0.25rem' }}>
              Enter your email and password to sign in
            </CardDescription>
          </CardHeader>

          <CardContent className="px-3 sm:px-4 pb-3 sm:pb-4">
            {/* Error Alert */}
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription className="text-sm">{error}</AlertDescription>
              </Alert>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-muted-foreground hover:text-foreground"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={loading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Forgot Password Link */}
              <div className="flex justify-end">
                <Button
                  type="button"
                  variant="link"
                  className="p-0 h-auto font-normal"
                  onClick={onForgotPassword}
                  disabled={loading}
                >
                  Forgot password?
                </Button>
              </div>

              {/* Sign In Button */}
              <Button
                type="submit"
                className="w-full"
                style={{ backgroundColor: '#00962c', color: 'white' }}
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>

            {/* Divider */}
            <div className="mt-4">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-background px-2 text-muted-foreground">
                    Or continue with Google
                  </span>
                </div>
              </div>
            </div>

            {/* Google Sign In Button */}
            <div className="mt-3">
              <button
                type="button"
                className="gsi-material-button w-full"
                disabled={loading}
                onClick={handleGoogleSignIn}
                style={{
                  opacity: loading ? 0.6 : 1,
                  cursor: loading ? 'not-allowed' : 'pointer'
                }}
              >
                <div className="gsi-material-button-state"></div>
                <div className="gsi-material-button-content-wrapper">
                  <div className="gsi-material-button-icon">
                    <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" xmlnsXlink="http://www.w3.org/1999/xlink" style={{ display: 'block' }}>
                      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                      <path fill="none" d="M0 0h48v48H0z"></path>
                    </svg>
                  </div>
                  <span className="gsi-material-button-contents">Continue with Google</span>
                  <span style={{ display: 'none' }}>Continue with Google</span>
                </div>
              </button>
            </div>

            {/* Sign Up Link */}
            <div className="text-center mt-4">
              <p className="text-muted-foreground text-sm">
                Don't have an account?{' '}
                <Button
                  variant="link"
                  className="p-0 h-auto font-normal"
                  onClick={onSwitchToSignup}
                  disabled={loading}
                >
                  Sign up
                </Button>
              </p>
            </div>

            {/* Footer Links */}
            <div className="mt-4 pt-6 pb-4 border-t border-gray-200 relative">
              <div className="flex items-center justify-center">
                <a
                  href="/QUADPRIVACYPOLICY.html"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm hover:underline absolute"
                  style={{ color: '#000000', right: '50%', transform: 'translateX(-24px)' }}
                >
                  Privacy Policy
                </a>
                <span className="text-gray-300 absolute left-1/2 transform -translate-x-1/2">|</span>
                <a
                  href="/QUADTERMSOFSERVICE.html"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm hover:underline absolute"
                  style={{ color: '#000000', left: '50%', transform: 'translateX(24px)' }}
                >
                  Terms of Service
                </a>
              </div>
            </div>
          </CardContent>
        </Card>
  );
};
