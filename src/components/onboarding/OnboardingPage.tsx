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
    name: 'Civil Procedure (CivPro)',
    professors: [
      { id: '1', name: 'Professor Smith' },
      { id: '2', name: 'Professor Johnson' }
    ]
  },
  {
    id: '2',
    name: 'Constitutional Law (ConLaw)',
    professors: [
      { id: '3', name: 'Professor Brown' },
      { id: '4', name: 'Professor Davis' }
    ]
  },
  {
    id: '3',
    name: 'Contracts',
    professors: [
      { id: '5', name: 'Professor Wilson' },
      { id: '6', name: 'Professor Miller' }
    ]
  },
  {
    id: '4',
    name: 'Criminal Law (CrimLaw)',
    professors: [
      { id: '7', name: 'Professor Taylor' },
      { id: '8', name: 'Professor Anderson' }
    ]
  },
  {
    id: '5',
    name: 'Legal Research and Writing (LRW)',
    professors: [
      { id: '9', name: 'Professor Thomas' },
      { id: '10', name: 'Professor Jackson' }
    ]
  },
  {
    id: '6',
    name: 'Property',
    professors: [
      { id: '11', name: 'Professor White' },
      { id: '12', name: 'Professor Harris' }
    ]
  },
  {
    id: '7',
    name: 'Torts',
    professors: [
      { id: '13', name: 'Professor Martin' },
      { id: '14', name: 'Professor Garcia' }
    ]
  },
  {
    id: '8',
    name: 'Legislation and Regulation (LegReg)',
    professors: [
      { id: '15', name: 'Professor Lee' },
      { id: '16', name: 'Professor Kim' }
    ]
  },
  // Elective courses for 1L students
  {
    id: '9',
    name: 'Administrative Law',
    professors: [
      { id: '17', name: 'Professor Adams' },
      { id: '18', name: 'Professor Baker' }
    ]
  },
  {
    id: '10',
    name: 'Antitrust Law',
    professors: [
      { id: '19', name: 'Professor Carter' },
      { id: '20', name: 'Professor Davis' }
    ]
  },
  {
    id: '11',
    name: 'Bankruptcy',
    professors: [
      { id: '21', name: 'Professor Evans' },
      { id: '22', name: 'Professor Foster' }
    ]
  },
  {
    id: '12',
    name: 'Business Taxation',
    professors: [
      { id: '23', name: 'Professor Green' },
      { id: '24', name: 'Professor Hall' }
    ]
  },
  {
    id: '13',
    name: 'Civil Rights Law',
    professors: [
      { id: '25', name: 'Professor Jones' },
      { id: '26', name: 'Professor King' }
    ]
  },
  {
    id: '14',
    name: 'Commercial Law',
    professors: [
      { id: '27', name: 'Professor Lewis' },
      { id: '28', name: 'Professor Moore' }
    ]
  },
  {
    id: '15',
    name: 'Competition Law',
    professors: [
      { id: '29', name: 'Professor Nelson' },
      { id: '30', name: 'Professor Parker' }
    ]
  },
  {
    id: '16',
    name: 'Corporate Law',
    professors: [
      { id: '31', name: 'Professor Quinn' },
      { id: '32', name: 'Professor Roberts' }
    ]
  },
  {
    id: '17',
    name: 'Criminal Procedure',
    professors: [
      { id: '33', name: 'Professor Scott' },
      { id: '34', name: 'Professor Turner' }
    ]
  },
  {
    id: '18',
    name: 'Domestic Relations',
    professors: [
      { id: '35', name: 'Professor Walker' },
      { id: '36', name: 'Professor Young' }
    ]
  }
];

const firstYearCourseIds = ['1', '2', '3', '4', '5', '6', '7', '8'];

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
      // 1L: 8 required + 1 elective = 9 total
      const newSelectedClasses = Array(9).fill(null).map((_, index) => {
        if (index < 8) {
          const courseId = firstYearCourseIds[index];
          const lawClass = lawClasses.find(lc => lc.id === courseId);
          return { lawClass: lawClass || null, professor: null };
        }
        return { lawClass: null, professor: null };
      });
      setSelectedClasses(newSelectedClasses);
    } else if (classYear === '2L' || classYear === '3L') {
      // 2L/3L: 4 required + up to 6 more = 10 total maximum
      const newSelectedClasses = Array(10).fill(null).map(() => ({ lawClass: null, professor: null }));
      setSelectedClasses(newSelectedClasses);
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
    
    // All students must select a section (or transfer)
    if (!section) return false;
    
    // Count selected classes with both class and professor
    const validClasses = selectedClasses.filter(selected => 
      selected.lawClass && selected.professor
    );
    
    // Count classes with just class selected (for optional slots)
    const classesWithClassOnly = selectedClasses.filter(selected => 
      selected.lawClass && !selected.professor
    );
    
    // Check minimum requirements based on class year
    if (classYear === '1L') {
      // 1L: 8 required + 1 elective = 9 total
      // First 8 must have both class and professor, 9th can have just class
      const requiredClasses = selectedClasses.slice(0, 8).filter(selected => 
        selected.lawClass && selected.professor
      );
      const electiveClass = selectedClasses[8];
      return requiredClasses.length === 8 && electiveClass?.lawClass;
    } else if (classYear === '2L' || classYear === '3L') {
      // 2L/3L: minimum 4, maximum 10
      // First 4 must have both class and professor, rest can have just class
      const requiredClasses = selectedClasses.slice(0, 4).filter(selected => 
        selected.lawClass && selected.professor
      );
      const optionalClasses = selectedClasses.slice(4).filter(selected => 
        selected.lawClass
      );
      return requiredClasses.length === 4 && (requiredClasses.length + optionalClasses.length) <= 10;
    }
    
    return false;
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
          <h1 className="text-3xl text-gray-900 mb-2">Academic Profile Setup</h1>
          <p className="text-gray-600">Complete your academic information to finish setup</p>
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

                {(classYear === '1L' || classYear === '2L' || classYear === '3L') && (
                  <div className="space-y-2">
                    <Label htmlFor="section">
                      {classYear === '1L' ? 'What section are you in?' : 'What section were you in?'} *
                    </Label>
                    <Select value={section} onValueChange={setSection}>
                      <SelectTrigger className="bg-input-background">
                        <SelectValue placeholder={
                          classYear === '1L' 
                            ? "Select your section" 
                            : "Select your previous section"
                        } />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4, 5, 6, 7].map((num) => (
                          <SelectItem key={num} value={num.toString()}>
                            Section {num}
                          </SelectItem>
                        ))}
                        {(classYear === '2L' || classYear === '3L') && (
                          <SelectItem value="transfer">Transfer</SelectItem>
                        )}
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
                      {classYear === '1L' ? 'Course Selection' : 'Course Selection'}
                    </h3>
                    <p className="text-gray-600 mb-4">
                      {classYear === '1L' 
                        ? 'Your eight required 1L courses have been automatically populated. Select professors for each required course and choose one elective course.'
                        : 'Select 4-10 courses and their corresponding professors.'
                      }
                    </p>
                    
                    {/* Requirements Summary */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span className="text-sm font-medium text-blue-900">Requirements:</span>
                      </div>
                      <div className="text-sm text-blue-800">
                        {classYear === '1L' ? (
                          <span>8 required courses + 1 elective = 9 total courses</span>
                        ) : (
                          <span>4-10 courses total (minimum 4, maximum 10)</span>
                        )}
                      </div>
                    </div>

                    <div className="space-y-4">
                      {selectedClasses.map((selectedClass, index) => {
                        // Get IDs of classes selected in other slots
                        const otherSelectedClassIds = selectedClasses
                          .map((sc, i) => i !== index && sc.lawClass ? sc.lawClass.id : null)
                          .filter(Boolean) as string[];
                        
                        // Get available classes for this slot
                        const availableClasses = getAvailableClassesForSlot(otherSelectedClassIds);
                        
                        // Determine if this slot is required
                        const isRequired = classYear === '1L' ? index < 8 : index < 4;
                        
                        return (
                          <ClassSelector
                            key={index}
                            index={index}
                            selectedClass={selectedClass.lawClass}
                            selectedProfessor={selectedClass.professor}
                            availableClasses={availableClasses}
                            onClassChange={(lawClass) => handleClassChange(index, lawClass)}
                            onProfessorChange={(professor) => handleProfessorChange(index, professor)}
                            isReadOnly={classYear === '1L' && index < 8}
                            isRequired={isRequired}
                          />
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Progress and Submit */}
              <div className="pt-6 border-t">
                {/* Progress Counter */}
                <div className="mb-4 text-center">
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-full">
                    <span className="text-sm text-gray-600">
                      {classYear === '1L' ? (
                        <>
                          Required: {selectedClasses.slice(0, 8).filter(selected => selected.lawClass && selected.professor).length}/8, 
                          Elective: {selectedClasses[8]?.lawClass ? '1' : '0'}/1
                        </>
                      ) : (
                        <>
                          Required: {selectedClasses.slice(0, 4).filter(selected => selected.lawClass && selected.professor).length}/4, 
                          Optional: {selectedClasses.slice(4).filter(selected => selected.lawClass).length}/6
                        </>
                      )}
                    </span>
                  </div>
                </div>
                
                {/* Submit Button */}
                <div className="flex justify-end">
                  <Button
                    type="submit"
                    disabled={!isFormValid() || loading}
                    className="bg-red-600 hover:bg-red-700 text-white px-8 py-2 disabled:opacity-50 rounded-lg"
                  >
                    {loading ? 'Saving...' : 'Complete Setup'}
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Progress Indicator */}
        <div className="mt-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full border shadow-sm">
            <div className="w-2 h-2 bg-red-600 rounded-full"></div>
            <span className="text-sm text-gray-600">Step 2 of 2 - Academic Setup</span>
          </div>
        </div>
      </div>
    </div>
  );
}
