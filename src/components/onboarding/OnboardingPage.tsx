import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { ClassSelector } from './ClassSelector';
import { useAuth } from '../../contexts/AuthContext';

type ClassYear = '1L' | '2L' | '3L';

interface SelectedClass {
  lawClass: LawClass | null;
  professor: Professor | null;
}

// Mock data - this should eventually come from your Supabase database
const lawClasses: LawClass[] = [
  {
    id: '1',
    name: 'Contracts',
    professors: [
      { id: '1', name: 'Professor Smith' },
      { id: '2', name: 'Professor Johnson' }
    ]
  },
  {
    id: '2',
    name: 'Torts',
    professors: [
      { id: '3', name: 'Professor Brown' },
      { id: '4', name: 'Professor Davis' }
    ]
  },
  {
    id: '3',
    name: 'Criminal Law',
    professors: [
      { id: '5', name: 'Professor Wilson' },
      { id: '6', name: 'Professor Miller' }
    ]
  },
  {
    id: '4',
    name: 'Constitutional Law',
    professors: [
      { id: '7', name: 'Professor Taylor' },
      { id: '8', name: 'Professor Anderson' }
    ]
  },
  {
    id: '5',
    name: 'Property Law',
    professors: [
      { id: '9', name: 'Professor Thomas' },
      { id: '10', name: 'Professor Jackson' }
    ]
  },
  {
    id: '6',
    name: 'Civil Procedure',
    professors: [
      { id: '11', name: 'Professor White' },
      { id: '12', name: 'Professor Harris' }
    ]
  },
  {
    id: '7',
    name: 'Legal Research and Writing',
    professors: [
      { id: '13', name: 'Professor Martin' },
      { id: '14', name: 'Professor Garcia' }
    ]
  }
];

const firstYearCourseIds = ['1', '2', '3', '4', '5', '6', '7'];

interface LawClass {
  id: string;
  name: string;
  professors: Professor[];
}

interface Professor {
  id: string;
  name: string;
}

const getAvailableClasses = (classYear: ClassYear, excludeIds: string[]): LawClass[] => {
  if (classYear === '1L') {
    return lawClasses.filter(lc => firstYearCourseIds.includes(lc.id) && !excludeIds.includes(lc.id));
  }
  return lawClasses.filter(lc => !excludeIds.includes(lc.id));
};

export function OnboardingPage({ onComplete }: { onComplete: () => void }) {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [classYear, setClassYear] = useState<ClassYear | ''>('');
  const [section, setSection] = useState<string>('');
  const [selectedClasses, setSelectedClasses] = useState<SelectedClass[]>(
    Array(10).fill(null).map(() => ({ lawClass: null, professor: null }))
  );
  const [loading, setLoading] = useState(false);

  // Auto-populate 1L courses when class year is selected
  useEffect(() => {
    if (classYear === '1L') {
      const newSelectedClasses = Array(10).fill(null).map((_, index) => {
        if (index < 7) {
          const courseId = firstYearCourseIds[index];
          const lawClass = lawClasses.find(lc => lc.id === courseId);
          return { lawClass: lawClass || null, professor: null };
        }
        return { lawClass: null, professor: null };
      });
      setSelectedClasses(newSelectedClasses);
    } else if (classYear === '2L' || classYear === '3L') {
      // Clear any 1L courses when switching to 2L/3L
      setSelectedClasses(prev => prev.map(selected => {
        if (selected.lawClass && firstYearCourseIds.includes(selected.lawClass.id)) {
          return { lawClass: null, professor: null };
        }
        return selected;
      }));
    }
    
    // Clear section when class year changes
    setSection('');
  }, [classYear]);

  const getAvailableClassesForSlot = (excludeIds: string[]): LawClass[] => {
    return getAvailableClasses(classYear, excludeIds);
  };

  const handleClassChange = (index: number, lawClass: LawClass | null) => {
    const newSelectedClasses = [...selectedClasses];
    newSelectedClasses[index] = { lawClass, professor: null };
    setSelectedClasses(newSelectedClasses);
  };

  const handleProfessorChange = (index: number, professor: Professor | null) => {
    const newSelectedClasses = [...selectedClasses];
    newSelectedClasses[index] = { ...newSelectedClasses[index], professor };
    setSelectedClasses(newSelectedClasses);
  };

  const isFormValid = () => {
    if (!name.trim() || !classYear) return false;
    
    // 1L students must also select a section
    if (classYear === '1L' && !section) return false;
    
    // Check that all filled class slots have both class and professor selected
    return selectedClasses.every(selected => {
      if (selected.lawClass) {
        return selected.professor !== null;
      }
      return true; // Empty slots are valid
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid()) return;

    setLoading(true);
    
    try {
      // TODO: Save to Supabase database
      const formData = {
        userId: user?.id,
        name: name.trim(),
        classYear,
        ...(classYear === '1L' && { section }),
        classes: selectedClasses
          .filter(selected => selected.lawClass && selected.professor)
          .map(selected => ({
            class: selected.lawClass!.name,
            professor: selected.professor!.name
          }))
      };
      
      console.log('Onboarding data:', formData);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Complete onboarding
      onComplete();
      
    } catch (error) {
      console.error('Error saving onboarding data:', error);
      alert('Error saving your profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-600 text-white rounded-full mb-4">
            <span className="text-2xl font-semibold">HLS</span>
          </div>
          <h1 className="text-3xl text-gray-900 mb-2">Welcome to Quad</h1>
          <p className="text-gray-600">Set up your academic profile to get started</p>
        </div>

        <Card className="shadow-lg">
          <CardHeader className="pb-6">
            <CardTitle className="text-2xl text-center text-gray-900">Academic Setup</CardTitle>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Personal Information */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your full name"
                    className="bg-input-background"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="classYear">Class Year *</Label>
                  <Select value={classYear} onValueChange={(value: ClassYear) => setClassYear(value)}>
                    <SelectTrigger className="bg-input-background">
                      <SelectValue placeholder="Select your class year" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1L">1L (First Year)</SelectItem>
                      <SelectItem value="2L">2L (Second Year)</SelectItem>
                      <SelectItem value="3L">3L (Third Year)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {classYear === '1L' && (
                  <div className="space-y-2">
                    <Label htmlFor="section">Section *</Label>
                    <Select value={section} onValueChange={setSection}>
                      <SelectTrigger className="bg-input-background">
                        <SelectValue placeholder="Select your section" />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4, 5, 6, 7].map((num) => (
                          <SelectItem key={num} value={num.toString()}>
                            Section {num}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              {/* Class Selection */}
              {classYear && (
                <div className="space-y-6">
                  <div className="border-t pt-6">
                    <h3 className="text-xl text-gray-900 mb-2">
                      {classYear === '1L' ? 'Required Courses' : 'Course Selection'}
                    </h3>
                    <p className="text-gray-600 mb-6">
                      {classYear === '1L' 
                        ? 'Your core courses have been automatically populated. Select professors for each course.'
                        : 'Select up to 10 courses and their corresponding professors.'
                      }
                    </p>

                    <div className="space-y-4">
                      {selectedClasses.map((selectedClass, index) => {
                        // Get IDs of classes selected in other slots
                        const otherSelectedClassIds = selectedClasses
                          .map((sc, i) => i !== index && sc.lawClass ? sc.lawClass.id : null)
                          .filter(Boolean) as string[];
                        
                        // Get available classes for this slot
                        const availableClasses = getAvailableClassesForSlot(otherSelectedClassIds);
                        
                        return (
                          <ClassSelector
                            key={index}
                            index={index}
                            selectedClass={selectedClass.lawClass}
                            selectedProfessor={selectedClass.professor}
                            availableClasses={availableClasses}
                            onClassChange={(lawClass) => handleClassChange(index, lawClass)}
                            onProfessorChange={(professor) => handleProfessorChange(index, professor)}
                            isReadOnly={classYear === '1L' && index < 7}
                          />
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <div className="flex justify-end pt-6 border-t">
                <Button
                  type="submit"
                  disabled={!isFormValid() || loading}
                  className="bg-red-600 hover:bg-red-700 text-white px-8 py-2 disabled:opacity-50 rounded-lg"
                >
                  {loading ? 'Saving...' : 'Complete Setup'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Progress Indicator */}
        <div className="mt-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full border shadow-sm">
            <div className="w-2 h-2 bg-red-600 rounded-full"></div>
            <span className="text-sm text-gray-600">Step 1 of 1 - Setup Complete</span>
          </div>
        </div>
      </div>
    </div>
  );
}
