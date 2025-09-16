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
      { id: '2', name: 'Professor Johnson' },
      { id: '73', name: 'Professor Williams' },
      { id: '74', name: 'Professor Brown' }
    ]
  },
  {
    id: '2',
    name: 'Constitutional Law (ConLaw)',
    professors: [
      { id: '3', name: 'Professor Brown' },
      { id: '4', name: 'Professor Davis' },
      { id: '75', name: 'Professor Wilson' },
      { id: '76', name: 'Professor Moore' }
    ]
  },
  {
    id: '3',
    name: 'Contracts',
    professors: [
      { id: '5', name: 'Professor Wilson' },
      { id: '6', name: 'Professor Miller' },
      { id: '77', name: 'Professor Taylor' },
      { id: '78', name: 'Professor Anderson' }
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
  },
  // Additional 2L/3L courses
  {
    id: '19',
    name: 'Advanced Constitutional Law',
    professors: [
      { id: '37', name: 'Professor Martinez' },
      { id: '38', name: 'Professor Thompson' },
      { id: '39', name: 'Professor Rodriguez' }
    ]
  },
  {
    id: '20',
    name: 'Securities Regulation',
    professors: [
      { id: '40', name: 'Professor Clark' },
      { id: '41', name: 'Professor Lewis' },
      { id: '42', name: 'Professor Robinson' }
    ]
  },
  {
    id: '21',
    name: 'International Law',
    professors: [
      { id: '43', name: 'Professor Wright' },
      { id: '44', name: 'Professor Lopez' },
      { id: '45', name: 'Professor Hill' }
    ]
  },
  {
    id: '22',
    name: 'Environmental Law',
    professors: [
      { id: '46', name: 'Professor Green' },
      { id: '47', name: 'Professor Adams' },
      { id: '48', name: 'Professor Baker' }
    ]
  },
  {
    id: '23',
    name: 'Intellectual Property',
    professors: [
      { id: '49', name: 'Professor Nelson' },
      { id: '50', name: 'Professor Carter' },
      { id: '51', name: 'Professor Mitchell' }
    ]
  },
  {
    id: '24',
    name: 'Employment Law',
    professors: [
      { id: '52', name: 'Professor Perez' },
      { id: '53', name: 'Professor Roberts' },
      { id: '54', name: 'Professor Turner' }
    ]
  },
  {
    id: '25',
    name: 'Health Law',
    professors: [
      { id: '55', name: 'Professor Phillips' },
      { id: '56', name: 'Professor Campbell' },
      { id: '57', name: 'Professor Parker' }
    ]
  },
  {
    id: '26',
    name: 'Immigration Law',
    professors: [
      { id: '58', name: 'Professor Evans' },
      { id: '59', name: 'Professor Edwards' },
      { id: '60', name: 'Professor Collins' }
    ]
  },
  {
    id: '27',
    name: 'Tax Law',
    professors: [
      { id: '61', name: 'Professor Stewart' },
      { id: '62', name: 'Professor Sanchez' },
      { id: '63', name: 'Professor Morris' }
    ]
  },
  {
    id: '28',
    name: 'Family Law',
    professors: [
      { id: '64', name: 'Professor Rogers' },
      { id: '65', name: 'Professor Reed' },
      { id: '66', name: 'Professor Cook' }
    ]
  },
  {
    id: '29',
    name: 'Real Estate Law',
    professors: [
      { id: '67', name: 'Professor Morgan' },
      { id: '68', name: 'Professor Bell' },
      { id: '69', name: 'Professor Murphy' }
    ]
  },
  {
    id: '30',
    name: 'Estate Planning',
    professors: [
      { id: '70', name: 'Professor Bailey' },
      { id: '71', name: 'Professor Rivera' },
      { id: '72', name: 'Professor Cooper' }
    ]
  },
  // 1L Elective Courses
  {
    id: '31',
    name: 'Legal Writing Workshop',
    professors: [
      { id: '73', name: 'Professor Thompson' },
      { id: '74', name: 'Professor Martinez' },
      { id: '75', name: 'Professor Rodriguez' }
    ]
  },
  {
    id: '32',
    name: 'Introduction to Legal Research',
    professors: [
      { id: '76', name: 'Professor Clark' },
      { id: '77', name: 'Professor Lewis' },
      { id: '78', name: 'Professor Robinson' }
    ]
  },
  {
    id: '33',
    name: 'Moot Court',
    professors: [
      { id: '79', name: 'Professor Wright' },
      { id: '80', name: 'Professor Lopez' },
      { id: '81', name: 'Professor Hill' }
    ]
  },
  {
    id: '34',
    name: 'Law and Society',
    professors: [
      { id: '82', name: 'Professor Green' },
      { id: '83', name: 'Professor Adams' },
      { id: '84', name: 'Professor Baker' }
    ]
  },
  {
    id: '35',
    name: 'Legal Ethics',
    professors: [
      { id: '85', name: 'Professor Nelson' },
      { id: '86', name: 'Professor Carter' },
      { id: '87', name: 'Professor Mitchell' }
    ]
  },
  {
    id: '36',
    name: 'Introduction to Public Interest Law',
    professors: [
      { id: '88', name: 'Professor Perez' },
      { id: '89', name: 'Professor Roberts' },
      { id: '90', name: 'Professor Turner' }
    ]
  },
  {
    id: '37',
    name: 'Legal History',
    professors: [
      { id: '91', name: 'Professor Phillips' },
      { id: '92', name: 'Professor Campbell' },
      { id: '93', name: 'Professor Parker' }
    ]
  },
  {
    id: '38',
    name: 'Introduction to International Law',
    professors: [
      { id: '94', name: 'Professor Evans' },
      { id: '95', name: 'Professor Edwards' },
      { id: '96', name: 'Professor Collins' }
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
    // 1L: Show 1L required courses + elective courses, excluding already selected ones
    const requiredCourses = lawClasses.filter(lc => firstYearCourseIds.includes(lc.id) && !excludeIds.includes(lc.id));
    const electiveCourses = lawClasses.filter(lc => {
      const id = parseInt(lc.id);
      const isElective = id >= 31 && id <= 38;
      const notExcluded = !excludeIds.includes(lc.id);
      console.log('Elective filter check:', { id: lc.id, parsedId: id, isElective, notExcluded, name: lc.name });
      return isElective && notExcluded;
    });
    console.log('Elective courses found:', electiveCourses.map(c => ({ id: c.id, name: c.name, professors: c.professors.length })));
    return [...requiredCourses, ...electiveCourses];
  }
  // 2L/3L: Show all courses (allow duplicates)
  return lawClasses;
};

export function OnboardingPage({ onComplete }: { onComplete: () => void }) {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [section, setSection] = useState<string>('');
  const [classYear, setClassYear] = useState<ClassYear | ''>('');
  const [selectedClasses, setSelectedClasses] = useState<SelectedClass[]>(
    Array(10).fill(null).map(() => ({ lawClass: null, professor: null }))
  );
  const [loading, setLoading] = useState(false);

  // Auto-populate 1L courses when class year is selected
  useEffect(() => {
    console.log('Class year changed to:', classYear);
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
      console.log('Setting 1L selectedClasses:', newSelectedClasses.map((sc, i) => ({
        index: i,
        hasClass: !!sc.lawClass,
        className: sc.lawClass?.name
      })));
      setSelectedClasses(newSelectedClasses);
    } else if (classYear === '2L' || classYear === '3L') {
      // 2L/3L: 3 required + up to 7 more = 10 total maximum
      const newSelectedClasses = Array(10).fill(null).map(() => ({ lawClass: null, professor: null }));
      console.log('Setting 2L/3L selectedClasses:', newSelectedClasses.map((sc, i) => ({
        index: i,
        hasClass: !!sc.lawClass,
        className: sc.lawClass?.name
      })));
      setSelectedClasses(newSelectedClasses);
    }
    // Clear section when class year changes
    setSection('');
  }, [classYear]);

  const getAvailableClassesForSlot = (excludeIds: string[]): LawClass[] => {
    // For 2L/3L, don't exclude any classes (allow duplicates)
    // For 1L, exclude already selected classes
    if (classYear === '2L' || classYear === '3L') {
      const classes = getAvailableClasses(classYear, []);
      console.log('2L/3L available classes (no exclusions):', classes.length, classes.map(c => c.name));
      return classes;
    }
    const classes = getAvailableClasses(classYear, excludeIds);
    console.log('1L available classes (with exclusions):', classes.length, classes.map(c => c.name), 'excluded:', excludeIds);
    return classes;
  };

  const handleClassChange = (index: number, lawClass: LawClass | null) => {
    console.log('Class change:', { 
      index, 
      lawClass: lawClass?.name, 
      lawClassId: lawClass?.id,
      hasProfessors: lawClass?.professors?.length,
      professorNames: lawClass?.professors?.map(p => p.name),
      classYear,
      fullLawClass: lawClass
    });
    const newSelectedClasses = [...selectedClasses];
    newSelectedClasses[index] = { lawClass, professor: null };
    setSelectedClasses(newSelectedClasses);
    console.log('Updated selectedClasses:', newSelectedClasses.map((sc, i) => ({
      index: i,
      hasClass: !!sc.lawClass,
      className: sc.lawClass?.name,
      hasProfessors: sc.lawClass?.professors?.length,
      professorNames: sc.lawClass?.professors?.map(p => p.name),
      hasProfessor: !!sc.professor
    })));
  };

  const handleProfessorChange = (index: number, professor: Professor | null) => {
    console.log('Professor change:', { index, professor: professor?.name, classYear });
    const newSelectedClasses = [...selectedClasses];
    newSelectedClasses[index] = { ...newSelectedClasses[index], professor };
    setSelectedClasses(newSelectedClasses);
    console.log('Updated selectedClasses after professor change:', newSelectedClasses.map((sc, i) => ({
      index: i,
      hasClass: !!sc.lawClass,
      className: sc.lawClass?.name,
      hasProfessor: !!sc.professor,
      professorName: sc.professor?.name
    })));
  };

  const isFormValid = () => {
    console.log('=== FORM VALIDATION START ===');
    console.log('Form data:', { name, section, classYear, selectedClassesLength: selectedClasses.length });
    
    // Require name, section, class year, and class selection
    if (!name.trim()) {
      console.log('Form invalid: missing name', { name });
      return false;
    }
    
    if (!section) {
      console.log('Form invalid: missing section', { section });
      return false;
    }
    
    if (!classYear) {
      console.log('Form invalid: missing class year', { classYear });
      return false;
    }
    
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
      
      // Debug logging
      console.log('1L Validation:', {
        requiredClasses: requiredClasses.length,
        electiveClass: !!electiveClass?.lawClass,
        selectedClasses: selectedClasses.map((sc, i) => ({
          index: i,
          hasClass: !!sc.lawClass,
          hasProfessor: !!sc.professor
        }))
      });
      
      const isValid = requiredClasses.length === 8; // Elective is now optional
      console.log('1L Validation result:', { 
        requiredClasses: requiredClasses.length, 
        electiveClass: !!electiveClass?.lawClass,
        isValid 
      });
      return isValid;
    } else if (classYear === '2L' || classYear === '3L') {
      // 2L/3L: minimum 3, maximum 10
      // First 3 must have both class and professor, rest can have just class
      const requiredClasses = selectedClasses.slice(0, 3).filter(selected => 
        selected.lawClass && selected.professor
      );
      const optionalClasses = selectedClasses.slice(3).filter(selected => 
        selected.lawClass
      );
      const totalClasses = requiredClasses.length + optionalClasses.length;
      
      // Debug logging
      console.log('2L/3L Validation:', {
        requiredClasses: requiredClasses.length,
        optionalClasses: optionalClasses.length,
        totalClasses,
        selectedClasses: selectedClasses.map((sc, i) => ({
          index: i,
          hasClass: !!sc.lawClass,
          hasProfessor: !!sc.professor
        }))
      });
      
      const isValid = requiredClasses.length === 3 && totalClasses >= 3 && totalClasses <= 10;
      console.log('2L/3L Validation result:', { 
        requiredClasses: requiredClasses.length, 
        totalClasses,
        isValid 
      });
      return isValid;
    }
    
    console.log('Form invalid: unknown class year', { classYear });
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
        section,
        classYear,
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
              {/* Class Year Selection */}
              <div className="flex justify-center">
                <div className="space-y-2 w-64">
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
              </div>

              {/* Name and Section */}
              {classYear && (
                <div className="space-y-6">
                  <div className="border-t pt-6">
                    <h3 className="text-xl text-gray-900 mb-4">Personal Information</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Full Name */}
                      <div className="space-y-2">
                        <Label htmlFor="name">Full Name *</Label>
                        <Input
                          id="name"
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Enter your full name"
                          className="bg-input-background"
                          required
                        />
                      </div>

                      {/* Section */}
                      <div className="space-y-2">
                        <Label htmlFor="section">Section *</Label>
                        <Select value={section} onValueChange={setSection}>
                          <SelectTrigger className="bg-input-background">
                            <SelectValue placeholder="Select your section" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">Section 1</SelectItem>
                            <SelectItem value="2">Section 2</SelectItem>
                            <SelectItem value="3">Section 3</SelectItem>
                            <SelectItem value="4">Section 4</SelectItem>
                            <SelectItem value="5">Section 5</SelectItem>
                            <SelectItem value="6">Section 6</SelectItem>
                            <SelectItem value="7">Section 7</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Class Selection */}
              {classYear && (
                <div className="space-y-6">
                  <div className="border-t pt-6">
                    <h3 className="text-xl text-gray-900 mb-2">
                      {classYear === '1L' ? 'Course Selection' : 'Course Selection'}
                    </h3>
                    <p className="text-gray-600 mb-4">
                      {classYear === '1L' 
                        ? 'Your eight required 1L courses have been automatically populated. Select professors for each required course. You may optionally choose one elective course.'
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
                          <span>8 required courses + 1 optional elective = 8-9 total courses</span>
                        ) : (
                          <span>4-10 courses total (minimum 4, maximum 10)</span>
                        )}
                      </div>
                    </div>

                    <div className="space-y-4">
                      {selectedClasses.map((selectedClass, index) => {
                        // Debug logging for class slots
                        if (index >= 8) {
                          console.log(`Rendering class slot ${index} for ${classYear}:`, {
                            hasClass: !!selectedClass.lawClass,
                            className: selectedClass.lawClass?.name,
                            hasProfessor: !!selectedClass.professor,
                            professorName: selectedClass.professor?.name
                          });
                        }
                        
                        // Get IDs of classes selected in other slots
                        const otherSelectedClassIds = selectedClasses
                          .map((sc, i) => i !== index && sc.lawClass ? sc.lawClass.id : null)
                          .filter(Boolean) as string[];
                        
                        // Get available classes for this slot
                        const availableClasses = getAvailableClassesForSlot(otherSelectedClassIds);
                        
                        // Determine if this slot is required
                        const isRequired = classYear === '1L' ? index < 8 : index < 3; // Elective (index 8) is optional for 1L
                        
                        // Debug logging for elective class
                        if (index === 8) {
                          console.log('Elective class debug:', {
                            index,
                            selectedClass: selectedClass.lawClass,
                            hasProfessors: selectedClass.lawClass?.professors?.length,
                            professorNames: selectedClass.lawClass?.professors?.map(p => p.name),
                            isRequired
                          });
                        }
                        
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
                            classYear={classYear}
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
                          Optional: {selectedClasses[8]?.lawClass ? '1' : '0'}/1
                        </>
                      ) : (
                        <>
                          Required: {selectedClasses.slice(0, 3).filter(selected => selected.lawClass && selected.professor).length}/3, 
                          Optional: {selectedClasses.slice(3).filter(selected => selected.lawClass).length}/7
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
