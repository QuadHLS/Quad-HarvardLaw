import React, { useState } from 'react';
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
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onSwitchToSignup,
  onForgotPassword,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { signIn, signInWithGoogle } = useAuth();

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
    console.log('Google sign in clicked');
    setLoading(true);
    setError('');

    const { error } = await signInWithGoogle();

    if (error) {
      console.error('Google sign in error:', error);
      setError(error.message);
      setLoading(false);
    } else {
      console.log('Google sign in successful');
    }
  };

  return (
    <Card className="w-full" style={{ backgroundColor: '#ffffff', border: 'none', boxShadow: '0 0 22px rgba(0, 0, 0, 0.06)' }}>
          <CardHeader className="text-center pb-2 px-3 sm:px-4 pt-3 sm:pt-4">
            <CardTitle className="text-xl sm:text-2xl">Sign in</CardTitle>
            <CardDescription className="text-xs sm:text-sm" style={{ marginTop: '0.5rem' }}>
              Enter your email and password to sign in
            </CardDescription>
          </CardHeader>

          <CardContent className="px-3 sm:px-4 pb-3 sm:pb-4">
            {/* Error Alert */}
            {error && (
              <Alert className="mb-4 bg-destructive/10 border-destructive/20 text-destructive">
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
                    Or continue with
                  </span>
                </div>
              </div>
            </div>

            {/* Google Sign In Button */}
            <div className="mt-3">
              <Button
                type="button"
                variant="outline"
                className="w-full"
                disabled={loading}
                onClick={handleGoogleSignIn}
              >
                <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Google
              </Button>
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
          </CardContent>
        </Card>
  );
};
