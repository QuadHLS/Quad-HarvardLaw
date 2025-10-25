import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';

export function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
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
      const { error } = await supabase.auth.updateUser({
        password: password
      });

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

  if (success) {
    return (
      <div className="min-h-screen flex flex-col items-center relative px-4" style={{ backgroundColor: 'var(--background-color, #f9f5f0)', minHeight: '100vh' }}>
        {/* Logo at the top - responsive sizing */}
        <div className="flex-shrink-0" style={{ marginTop: 'clamp(20px, 4vh, 60px)', paddingBottom: 'clamp(10px, 2vh, 20px)' }}>
          <div className="flex justify-center">
            <img 
              src="/Quad SVG.svg" 
              alt="Quad Logo" 
              className="w-auto object-contain"
              style={{ height: 'clamp(120px, 18vh, 200px)' }}
            />
          </div>
        </div>
        
        {/* Success message - centered */}
        <div className="w-full max-w-md flex-1 flex flex-col justify-center">
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
            src="/Quad SVG.svg" 
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
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter new password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  className="w-full"
                />
              </div>
              
              {/* Confirm Password Field */}
              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                  Confirm Password
                </label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={8}
                  className="w-full"
                />
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={loading}
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
