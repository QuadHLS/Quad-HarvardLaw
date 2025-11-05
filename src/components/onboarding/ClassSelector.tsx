import React, { useState, useRef, useEffect } from 'react';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { ChevronDown } from 'lucide-react';
// Removed Select imports since schedule is now display-only

interface LawClass {
  id: string;
  name: string;
  professors: Professor[];
}

interface Professor {
  id: string;
  name: string;
}

interface CourseSchedule {
  course_number: number;
  course_name: string;
  semester: string;
  instructor: string;
  credits: number;
  days: string;
  times: string;
  location: string;
}

interface ClassSelectorProps {
  index: number;
  selectedClass: LawClass | null;
  selectedProfessor: Professor | null;
  selectedSchedule?: CourseSchedule | null;
  availableClasses: LawClass[];
  scheduleOptions?: CourseSchedule[];
  scheduleLoading?: boolean;
  onClassChange: (lawClass: LawClass | null) => void;
  onProfessorChange: (professor: Professor | null) => void;
  isReadOnly?: boolean;
  isRequired?: boolean;
  classYear?: string;
}

export function ClassSelector({
  index,
  selectedClass,
  selectedProfessor,
  selectedSchedule = null,
  availableClasses,
  scheduleOptions = [],
  scheduleLoading = false,
  onClassChange,
  onProfessorChange,
  isReadOnly = false,
  isRequired = false,
  classYear = '',
}: ClassSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [showProfessorDropdown, setShowProfessorDropdown] = useState(false);
  const [filteredClasses, setFilteredClasses] = useState<LawClass[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Display-only formatter: hide trailing section number (1-7) for 1L required courses
  const formatDisplayCourseName = (rawName: string): string => {
    if (!rawName) return rawName;
    const requiredPatterns = [
      'Civil Procedure',
      'Contracts',
      'Criminal Law',
      'Torts',
      'Constitutional Law',
      'Property',
      'Legislation and Regulation'
    ];
    const pattern = new RegExp(`^(?:${requiredPatterns.join('|')})\\s([1-7])$`);
    if (pattern.test(rawName)) {
      return rawName.replace(/\s[1-7]$/, '');
    }
    return rawName;
  };

  // Reset internal state when class year changes
  useEffect(() => {
    setSearchTerm('');
    setShowDropdown(false);
    setShowProfessorDropdown(false);
    setFilteredClasses(availableClasses);
  }, [classYear, availableClasses]);

  // Update search term when selected class changes
  useEffect(() => {
    setSearchTerm(selectedClass?.name || '');
    setShowProfessorDropdown(false); // Close professor dropdown when class changes
  }, [selectedClass]);

  // Filter available classes based on search term
  useEffect(() => {
    if (!searchTerm) {
      setFilteredClasses(availableClasses);
    } else {
      const filtered = availableClasses.filter((lawClass) =>
        lawClass.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredClasses(filtered);

      // Auto-select if there's an exact match
      const exactMatch = availableClasses.find((c) => c.name === searchTerm);
      if (exactMatch && (!selectedClass || selectedClass.name !== searchTerm)) {
        onClassChange(exactMatch);
      }
    }
  }, [searchTerm, availableClasses, selectedClass, onClassChange, index]);

  // Handle clicks outside dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;

      // Check if click is outside the class dropdown
      if (dropdownRef.current && !dropdownRef.current.contains(target)) {
        setShowDropdown(false);
      }

      // Check if click is outside the professor dropdown
      // Don't close if clicking on the professor input itself
      const professorInput = document.querySelector(
        `[data-professor-input="${index}"]`
      );
      if (
        showProfessorDropdown &&
        professorInput &&
        !professorInput.contains(target)
      ) {
        // Also check if the click is not on any professor dropdown content
        const professorDropdown = document.querySelector(
          `[data-professor-dropdown="${index}"]`
        );
        if (!professorDropdown || !professorDropdown.contains(target)) {
          setShowProfessorDropdown(false);
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showProfessorDropdown, index]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    setShowDropdown(true);

    // If user starts typing and there's a selected class, clear it to allow new selection
    if (value && selectedClass && value !== selectedClass.name) {
      onClassChange(null);
      onProfessorChange(null);
    }

    // Only clear the selected class if user manually deletes the text
    // Don't clear if the input is just losing focus or being updated programmatically
    if (!value && selectedClass) {
      // Check if this is a real user action (not programmatic)
      const isUserAction =
        e.target === document.activeElement && e.nativeEvent.isTrusted;
      if (isUserAction) {
        onClassChange(null);
        onProfessorChange(null);
      }
    }
  };

  const handleClassSelect = (lawClass: LawClass) => {
    setSearchTerm(lawClass.name);
    setShowDropdown(false);
    onClassChange(lawClass);
    onProfessorChange(null); // Reset professor when class changes
  };

  return (
    <div className="flex gap-4 items-start">
      {/* Class Selection */}
      <div className="relative" ref={dropdownRef} style={{ width: '450px' }}>
        <Label className="text-sm mb-2 block">
          {index === 7 && classYear === '1L' ? 'Elective' : `Class ${index + 1}`}
          {isRequired && (
            <span style={{ color: '#752432' }} className="ml-1">
              *
            </span>
          )}
        </Label>

        <div className="relative">
          <Input
            ref={inputRef}
            type="text"
            value={
              isReadOnly && classYear === '1L' && index < 7
                ? formatDisplayCourseName(selectedClass?.name || '')
                : searchTerm
            }
            onChange={handleInputChange}
            onClick={() => {
              if (!isReadOnly) {
                setSearchTerm(''); // Clear search term to show all options
                setShowDropdown(true);
              }
            }}
            onFocus={() => {
              if (!isReadOnly) {
                setSearchTerm(''); // Clear search term to show all options
                setShowDropdown(true);
              }
            }}
            placeholder={
              isReadOnly && classYear === '1L' && index < 7 ? 'Choose section' : 
              isReadOnly ? 'Course assigned' : 'Search for a class...'
            }
            className="pr-10 bg-input-background cursor-pointer"
            readOnly={isReadOnly}
          />

          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {!isReadOnly && <ChevronDown className="h-4 w-4 text-gray-400" />}
          </div>
        </div>

        {/* Dropdown */}
        {showDropdown && !isReadOnly && filteredClasses.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto" style={{ 
            position: 'absolute', 
            zIndex: 9999,
            scrollbarWidth: 'thin',
            scrollbarColor: '#752531 transparent'
          }}>
            {filteredClasses.map((lawClass, classIndex) => (
              <button
                key={`${lawClass.id}-${classIndex}`}
                type="button"
                onClick={() => {
                  handleClassSelect(lawClass);
                }}
                className="w-full px-3 py-2 text-left hover:bg-gray-100 text-sm border-b border-gray-100 last:border-b-0 bg-white"
              >
                {formatDisplayCourseName(lawClass.name)}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Professor Selection */}
      <div className="w-48 relative">
        <Label className="text-sm mb-2 block">
          Professor
          {isRequired && (
            <span style={{ color: '#752432' }} className="ml-1">
              *
            </span>
          )}
        </Label>

        {/* Display-only professor for all class years (1L, 2L, 3L, LLM) */}
        {true ? (
          <div className="min-h-[40px] py-2 px-3 border border-gray-200 rounded-md text-sm text-gray-500 leading-tight mt-1" style={{ backgroundColor: 'var(--background-color, #f9f5f0)' }}>
            {selectedProfessor?.name || (selectedClass ? 'Loading...' : (classYear === '1L' && index < 7 ? 'Choose section' : 'Select class first'))}
          </div>
        ) : (
          <div className="relative">
            <Input
              value={selectedProfessor?.name || ''}
              placeholder={
                !selectedClass ? 'Select class first' : 'Select professor'
              }
              readOnly
              data-professor-input={index}
              style={{
                backgroundColor: !selectedClass ? '#f5f5f5' : 'white',
                cursor: !selectedClass ? 'not-allowed' : 'pointer',
              }}
              onMouseDown={() => {
                if (
                  selectedClass &&
                  selectedClass.professors &&
                  selectedClass.professors.length > 0
                ) {
                  setShowProfessorDropdown(true);
                }
              }}
              className={`bg-input-background pr-10 ${
                !selectedClass
                  ? 'cursor-not-allowed opacity-60'
                  : 'cursor-pointer'
              }`}
              disabled={!selectedClass}
              title={
                !selectedClass
                  ? 'Select a class first'
                  : 'Click to select professor'
              }
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
              <ChevronDown className="h-4 w-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
        )}

          {/* Professor dropdown disabled for all class years */}
          {false && (
            <>
              {showProfessorDropdown &&
                selectedClass &&
                selectedClass?.professors &&
                (selectedClass?.professors?.length ?? 0) > 0 && (
              <div
                data-professor-dropdown={index}
                className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto"
                style={{ 
                  position: 'absolute', 
                  zIndex: 9999,
                  scrollbarWidth: 'thin',
                  scrollbarColor: '#752531 transparent'
                }}
                onClick={(e) => {
                  e.stopPropagation();
                }}
              >
                <div className="p-2 text-xs text-gray-500 border-b" style={{ backgroundColor: 'var(--background-color, #f9f5f0)' }}>
                  Professors for {formatDisplayCourseName(selectedClass?.name || '')}:
                </div>
                {selectedClass?.professors?.map((professor, profIndex) => (
                    <button
                      key={`${professor.id}-${profIndex}`}
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        try {
                          onProfessorChange(professor);
                          setShowProfessorDropdown(false);
                        } catch (error) {
                          console.error('Error in professor selection:', error);
                        }
                      }}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        try {
                          onProfessorChange(professor);
                          setShowProfessorDropdown(false);
                        } catch (error) {
                          console.error(
                            'Error in professor selection (click):',
                            error
                          );
                        }
                      }}
                      className="w-full px-3 py-2 text-left hover:bg-gray-100 text-sm border-b border-gray-100 last:border-b-0 cursor-pointer bg-white"
                      style={{ pointerEvents: 'auto' }}
                    >
                      {professor.name}
                    </button>
                ))}
              </div>
            )}
            </>
          )}
      </div>

      {/* Schedule Selection - Always visible for all class years */}
      {classYear && (
        <div className="w-48">
          <Label className="text-sm mb-2 block">
            Schedule
            {isRequired && (
              <span style={{ color: '#752432' }} className="ml-1">
                *
              </span>
            )}
          </Label>

          {scheduleLoading ? (
            <div className="flex items-center text-sm text-gray-500 h-10 px-3 border rounded-md bg-input-background">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900 mr-2"></div>
              Loading...
            </div>
          ) : selectedSchedule ? (
            <div className="min-h-[40px] px-3 py-2 border rounded-md bg-input-background">
              <div className="font-medium text-sm leading-tight">
                {selectedSchedule.days || 'TBD'} • {selectedSchedule.times || 'TBD'}
              </div>
              <div className="text-xs text-gray-500 mt-1 leading-tight">
                {selectedSchedule.location || 'Location TBD'} •{' '}
                {selectedSchedule.semester} • {selectedSchedule.credits} credits
              </div>
            </div>
          ) : scheduleOptions && scheduleOptions.length > 0 ? (
            <div className="min-h-[40px] px-3 py-2 border rounded-md bg-input-background">
              <div className="font-medium text-sm leading-tight">
                {scheduleOptions[0].days || 'TBD'} • {scheduleOptions[0].times || 'TBD'}
              </div>
              <div className="text-xs text-gray-500 mt-1 leading-tight">
                {scheduleOptions[0].location || 'Location TBD'} •{' '}
                {scheduleOptions[0].semester} • {scheduleOptions[0].credits} credits
              </div>
            </div>
          ) : (
            <div className="h-10 px-3 border rounded-md bg-input-background flex items-center text-sm text-gray-500">
              {!selectedClass ? (classYear === '1L' && index < 7 ? 'Choose section' : 'Select class first') : 
               !selectedProfessor ? 'Select professor first' : 
               'No schedule available'}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
