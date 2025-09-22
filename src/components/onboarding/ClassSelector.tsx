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
  console.log('ClassSelector props:', {
    index,
    selectedClass: selectedClass?.name,
    selectedClassId: selectedClass?.id,
    selectedProfessor: selectedProfessor?.name,
    onProfessorChange: typeof onProfessorChange,
    isReadOnly,
    isRequired,
    hasProfessors: selectedClass?.professors?.length,
    professorInputValue: selectedProfessor?.name || '',
    shouldShowPlaceholder: !selectedClass,
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [showProfessorDropdown, setShowProfessorDropdown] = useState(false);
  const [filteredClasses, setFilteredClasses] = useState<LawClass[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset internal state when class year changes
  useEffect(() => {
    console.log('ClassSelector - classYear changed:', classYear);
    setSearchTerm('');
    setShowDropdown(false);
    setShowProfessorDropdown(false);
    setFilteredClasses(availableClasses);
  }, [classYear, availableClasses]);

  // Update search term when selected class changes
  useEffect(() => {
    console.log('ClassSelector - selectedClass changed:', selectedClass?.name);
    setSearchTerm(selectedClass?.name || '');
    setShowProfessorDropdown(false); // Close professor dropdown when class changes
  }, [selectedClass]);

  // Filter available classes based on search term
  useEffect(() => {
    console.log(
      'ClassSelector useEffect - availableClasses:',
      availableClasses.length,
      availableClasses.map((c) => c.name)
    );
    console.log('ClassSelector useEffect - searchTerm:', searchTerm);
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
        console.log(
          'Auto-selecting exact match for index',
          index,
          ':',
          exactMatch
        );
        onClassChange(exactMatch);
      }
    }
    console.log(
      'ClassSelector useEffect - filteredClasses:',
      filteredClasses.length
    );
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
    console.log('ClassSelector input change for index', index, ':', {
      value,
      availableClasses: availableClasses.length,
      selectedClass: selectedClass?.name,
      filteredClasses: filteredClasses.length,
      exactMatch: availableClasses.find((c) => c.name === value),
    });
    setSearchTerm(value);
    setShowDropdown(true);

    // If user starts typing and there's a selected class, clear it to allow new selection
    if (value && selectedClass && value !== selectedClass.name) {
      console.log(
        'ClassSelector - clearing selected class because user is typing new text'
      );
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
        console.log(
          'ClassSelector - clearing selected class due to user input'
        );
        onClassChange(null);
        onProfessorChange(null);
      }
    }
  };

  const handleClassSelect = (lawClass: LawClass) => {
    console.log('ClassSelector class select:', {
      lawClass: lawClass.name,
      lawClassId: lawClass.id,
      professors: lawClass.professors?.length,
      professorNames: lawClass.professors?.map((p) => p.name),
      index,
      fullLawClass: lawClass,
    });
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
            value={searchTerm}
            onChange={handleInputChange}
            onClick={() => {
              console.log('Input clicked:', {
                isReadOnly,
                selectedClass: selectedClass?.name,
              });
              if (!isReadOnly) {
                setSearchTerm(''); // Clear search term to show all options
                setShowDropdown(true);
              }
            }}
            onFocus={() => {
              console.log('Input focused:', {
                isReadOnly,
                selectedClass: selectedClass?.name,
              });
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
        {(() => {
          console.log('Dropdown render check:', {
            showDropdown,
            isReadOnly,
            filteredClassesLength: filteredClasses.length,
            filteredClasses: filteredClasses.map((c) => c.name),
          });
          return null;
        })()}
        {showDropdown && !isReadOnly && filteredClasses.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto" style={{ position: 'absolute', zIndex: 9999 }}>
            {(() => {
              console.log(
                'Rendering dropdown options for index',
                index,
                ':',
                filteredClasses.map((c) => ({
                  id: c.id,
                  name: c.name,
                  hasProfessors: c.professors?.length,
                }))
              );
              return null;
            })()}
            {filteredClasses.map((lawClass, classIndex) => (
              <button
                key={`${lawClass.id}-${classIndex}`}
                type="button"
                onClick={() => {
                  console.log(
                    'Dropdown option clicked for index',
                    index,
                    ':',
                    lawClass
                  );
                  handleClassSelect(lawClass);
                }}
                className="w-full px-3 py-2 text-left hover:bg-gray-100 text-sm border-b border-gray-100 last:border-b-0 bg-white"
              >
                {lawClass.name}
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

        {/* Display-only professor for all class years (1L, 2L, 3L) */}
        {true ? (
          <div className="min-h-[40px] py-2 px-3 style={{ backgroundColor: 'var(--background-color, #f9f5f0)' }} border border-gray-200 rounded-md text-sm text-gray-500 leading-tight mt-1">
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
                console.log('Professor input mousedown:', {
                  selectedClass: selectedClass?.name,
                  selectedClassId: selectedClass?.id,
                  professors: selectedClass?.professors?.length,
                  professorNames: selectedClass?.professors?.map((p) => p.name),
                  isRequired,
                  index,
                  fullSelectedClass: selectedClass,
                });
                if (
                  selectedClass &&
                  selectedClass.professors &&
                  selectedClass.professors.length > 0
                ) {
                  console.log(
                    'Opening professor dropdown for:',
                    selectedClass.name
                  );
                  setShowProfessorDropdown(true);
                } else {
                  console.log(
                    'Cannot open professor dropdown - no professors available for:',
                    selectedClass?.name,
                    'professors array:',
                    selectedClass?.professors
                  );
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
              {(() => {
                console.log('Professor dropdown render check:', {
                  showProfessorDropdown,
                  selectedClass: selectedClass?.name,
                  professors: selectedClass?.professors?.length,
                  professorNames: selectedClass?.professors?.map((p) => p.name),
                  shouldShow:
                    showProfessorDropdown &&
                    selectedClass &&
                    selectedClass?.professors &&
                    (selectedClass?.professors?.length ?? 0) > 0,
                });
                return null;
              })()}
              {showProfessorDropdown &&
                selectedClass &&
                selectedClass?.professors &&
                (selectedClass?.professors?.length ?? 0) > 0 && (
              <div
                data-professor-dropdown={index}
                className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto"
                style={{ position: 'absolute', zIndex: 9999 }}
                onClick={(e) => {
                  console.log(
                    'Professor dropdown container clicked:',
                    e.target
                  );
                  e.stopPropagation();
                }}
              >
                <div className="p-2 text-xs text-gray-500 style={{ backgroundColor: 'var(--background-color, #f9f5f0)' }} border-b">
                  Professors for {selectedClass?.name}:
                </div>
                {selectedClass?.professors?.map((professor, profIndex) => {
                  console.log('Rendering professor option:', professor);
                  return (
                    <button
                      key={`${professor.id}-${profIndex}`}
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log(
                          'Professor button mousedown (using this instead of click):',
                          {
                            professor,
                            index,
                            selectedClass: selectedClass?.name,
                            event: e.type,
                          }
                        );
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
                        console.log('Professor button clicked (backup):', {
                          professor,
                          index,
                          selectedClass: selectedClass?.name,
                          event: e.type,
                        });
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
                  );
                })}
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
