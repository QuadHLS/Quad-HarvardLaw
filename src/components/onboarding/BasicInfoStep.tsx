import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Loader2 } from 'lucide-react';

type ClassYear = '1L' | '2L' | '3L';

interface BasicInfoStepProps {
  onNext: (data: {
    fullName: string;
    phone: string;
    classYear: ClassYear;
    section: string;
  }) => void;
}

export function BasicInfoStep({ onNext }: BasicInfoStepProps) {
  const { user } = useAuth();
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [classYear, setClassYear] = useState<ClassYear>('1L');
  const [section, setSection] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Load existing profile data
  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return;

      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('full_name, phone, class_year, section')
          .eq('id', user.id)
          .single();

        if (profile && !error) {
          setFullName(profile.full_name || '');
          setPhone(profile.phone || '');
          setClassYear(profile.class_year || '1L');
          setSection(profile.section || '');
        }
      } catch (err) {
        console.error('Error loading profile:', err);
      }
    };

    loadProfile();
  }, [user]);

  const handleNext = async () => {
    if (!fullName.trim() || !classYear || !section.trim()) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Save to database
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          full_name: fullName.trim(),
          phone: phone.trim() || null,
          class_year: classYear,
          section: section.trim(),
        })
        .eq('id', user?.id);

      if (updateError) {
        throw updateError;
      }

      // Proceed to next step
      onNext({
        fullName: fullName.trim(),
        phone: phone.trim(),
        classYear,
        section: section.trim(),
      });
    } catch (err: any) {
      setError(err.message || 'Failed to save information');
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = fullName.trim() && classYear && section.trim();

  return (
    <div className="min-h-screen py-8 px-4" style={{ backgroundColor: '#f9f5f0', minHeight: '100vh' }}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mb-4">
            <div className="flex justify-center">
              <img 
                src="/Quad SVG.svg" 
                alt="Quad Logo" 
                className="w-auto object-contain"
                style={{ height: '90px', marginTop: '30px' }}
              />
            </div>
          </div>
          <div style={{ height: '20px' }}></div>
          <h1 className="text-3xl text-gray-900 mb-2">
            Welcome to Quad
          </h1>
          <p className="text-gray-600">Let's get your basic information first.</p>
        </div>

        {/* Main Form */}
        <div className="bg-white rounded-lg shadow-sm p-8 max-w-3xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name *
                </Label>
                <Input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter your full name"
                  className="bg-input-background"
                  required
                />
              </div>

              <div style={{ marginTop: '36px' }}>
                <Label htmlFor="classYear" className="block text-sm font-medium text-gray-700 mb-1">
                  Class Year *
                </Label>
                <Select value={classYear} onValueChange={(value: ClassYear) => setClassYear(value)}>
                  <SelectTrigger className="bg-input-background">
                    <SelectValue placeholder="Select your class year" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1L">1L</SelectItem>
                    <SelectItem value="2L">2L</SelectItem>
                    <SelectItem value="3L">3L</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Enter your phone number"
                  className="bg-input-background"
                />
                <p className="text-xs text-black mt-1 italic text-center font-medium">Get free food and swag! 😊</p>
              </div>

              <div>
                <Label htmlFor="section" className="block text-sm font-medium text-gray-700 mb-1">
                  Section *
                </Label>
                <Select value={section} onValueChange={setSection} disabled={!classYear}>
                  <SelectTrigger className={`bg-input-background ${!classYear ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    <SelectValue placeholder={classYear ? "Select your section" : "Select class year first"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Section 1</SelectItem>
                    <SelectItem value="2">Section 2</SelectItem>
                    <SelectItem value="3">Section 3</SelectItem>
                    <SelectItem value="4">Section 4</SelectItem>
                    <SelectItem value="5">Section 5</SelectItem>
                    <SelectItem value="6">Section 6</SelectItem>
                    <SelectItem value="7">Section 7</SelectItem>
                    {(classYear === '2L' || classYear === '3L') && (
                      <SelectItem value="8">Section 8</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="flex justify-end mt-6">
            <Button
              onClick={handleNext}
              disabled={!isFormValid || loading}
              className="text-white px-8 py-2 disabled:opacity-50 rounded-lg"
              style={{ backgroundColor: '#752432' }}
              onMouseEnter={(e) =>
                ((e.target as HTMLElement).style.backgroundColor = '#5a1a25')
              }
              onMouseLeave={(e) =>
                ((e.target as HTMLElement).style.backgroundColor = '#752432')
              }
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Next: Course Selection'
              )}
            </Button>
          </div>
        </div>

        {/* Progress Indicator */}
        <div className="mt-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 style={{ backgroundColor: 'var(--background-color, #f9f5f0)' }} rounded-full">
            <span className="text-sm text-gray-600">Step 1 of 3 - Basic Information</span>
          </div>
        </div>
      </div>
    </div>
  );
}
