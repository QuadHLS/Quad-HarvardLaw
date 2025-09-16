import React, { useState, useRef, useEffect } from 'react';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Label } from '../ui/label';
import { ChevronDown, X } from 'lucide-react';

interface LawClass {
  id: string;
  name: string;
  professors: Professor[];
}

interface Professor {
  id: string;
  name: string;
}

interface ClassSelectorProps {
  index: number;
  selectedClass: LawClass | null;
  selectedProfessor: Professor | null;
  availableClasses: LawClass[];
  onClassChange: (lawClass: LawClass | null) => void;
  onProfessorChange: (professor: Professor | null) => void;
  isReadOnly?: boolean;
  isRequired?: boolean;
}

export function ClassSelector({
  index,
  selectedClass,
  selectedProfessor,
  availableClasses,
  onClassChange,
  onProfessorChange,
  isReadOnly = false,
  isRequired = false
}: ClassSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [showProfessorDropdown, setShowProfessorDropdown] = useState(false);
  const [filteredClasses, setFilteredClasses] = useState<LawClass[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Update search term when selected class changes
  useEffect(() => {
    console.log('ClassSelector - selectedClass changed:', selectedClass?.name);
    setSearchTerm(selectedClass?.name || '');
    setShowProfessorDropdown(false); // Close professor dropdown when class changes
  }, [selectedClass]);

  // Filter available classes based on search term
  useEffect(() => {
    console.log('ClassSelector useEffect - availableClasses:', availableClasses.length, availableClasses.map(c => c.name));
    console.log('ClassSelector useEffect - searchTerm:', searchTerm);
    if (!searchTerm) {
      setFilteredClasses(availableClasses);
    } else {
      const filtered = availableClasses.filter(lawClass =>
        lawClass.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredClasses(filtered);
    }
    console.log('ClassSelector useEffect - filteredClasses:', filteredClasses.length);
  }, [searchTerm, availableClasses]);

  // Handle clicks outside dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
        setShowProfessorDropdown(false);
        // Don't reset search term - keep the selected class visible
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    console.log('ClassSelector input change:', { value, availableClasses: availableClasses.length, selectedClass: selectedClass?.name });
    setSearchTerm(value);
    setShowDropdown(true);
    
    // If user starts typing and there's a selected class, clear it to allow new selection
    if (value && selectedClass && value !== selectedClass.name) {
      console.log('ClassSelector - clearing selected class because user is typing new text');
      onClassChange(null);
      onProfessorChange(null);
    }
    
    // Only clear the selected class if user manually deletes the text
    // Don't clear if the input is just losing focus or being updated programmatically
    if (!value && selectedClass) {
      // Check if this is a real user action (not programmatic)
      const isUserAction = e.target === document.activeElement && e.nativeEvent.isTrusted;
      if (isUserAction) {
        console.log('ClassSelector - clearing selected class due to user input');
        onClassChange(null);
        onProfessorChange(null);
      }
    }
  };

  const handleClassSelect = (lawClass: LawClass) => {
    console.log('ClassSelector class select:', { lawClass: lawClass.name, index });
    setSearchTerm(lawClass.name);
    setShowDropdown(false);
    onClassChange(lawClass);
    onProfessorChange(null); // Reset professor when class changes
  };

  const handleClearClass = () => {
    console.log('Clear class clicked:', { selectedClass: selectedClass?.name, index });
    setSearchTerm('');
    onClassChange(null);
    onProfessorChange(null);
    inputRef.current?.focus();
  };


  return (
    <div className="flex gap-4 items-start">
      {/* Class Selection */}
      <div className="flex-1 relative" ref={dropdownRef}>
        <Label className="text-sm mb-2 block">
          Class {index + 1}
          {isRequired && !isReadOnly && <span className="text-red-600 ml-1">*</span>}
          {isReadOnly && <span className="text-gray-500 ml-1">(Required)</span>}
          {!isRequired && !isReadOnly && <span className="text-gray-500 ml-1">(Optional)</span>}
        </Label>
        
        <div className="relative">
          <Input
            ref={inputRef}
            type="text"
            value={searchTerm}
            onChange={handleInputChange}
            onFocus={() => {
              console.log('Input focused:', { isReadOnly, selectedClass: selectedClass?.name });
              if (!isReadOnly) {
                setShowDropdown(true);
              }
            }}
            placeholder={isReadOnly ? "Course assigned" : "Search for a class..."}
            className="pr-20 bg-input-background"
            readOnly={isReadOnly}
          />
          
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {console.log('Clear button render check:', { selectedClass: !!selectedClass, isReadOnly })}
            {selectedClass && !isReadOnly && (
              <button
                type="button"
                onClick={handleClearClass}
                className="p-1 hover:bg-red-100 rounded text-red-500 hover:text-red-700 border border-red-200"
                title="Clear class selection"
              >
                <X className="h-3 w-3" />
              </button>
            )}
            {!isReadOnly && <ChevronDown className="h-4 w-4 text-gray-400" />}
          </div>
        </div>
        
        {/* Dropdown */}
        {console.log('Dropdown render check:', { 
          showDropdown, 
          isReadOnly, 
          filteredClassesLength: filteredClasses.length,
          filteredClasses: filteredClasses.map(c => c.name)
        })}
        {showDropdown && !isReadOnly && filteredClasses.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
            {filteredClasses.map((lawClass) => (
              <button
                key={lawClass.id}
                type="button"
                onClick={() => handleClassSelect(lawClass)}
                className="w-full px-3 py-2 text-left hover:bg-gray-50 text-sm border-b border-gray-100 last:border-b-0"
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
          {isRequired && <span className="text-red-600 ml-1">*</span>}
          {!isRequired && <span className="text-gray-500 ml-1">(Optional)</span>}
        </Label>
        
        <div className="relative">
          <Input
            value={selectedProfessor?.name || ""}
            placeholder={!selectedClass ? "Select class first" : "Select professor"}
            readOnly
            onClick={() => {
              console.log('Professor input clicked:', { selectedClass: selectedClass?.name, professors: selectedClass?.professors?.length });
              if (selectedClass && selectedClass.professors && selectedClass.professors.length > 0) {
                console.log('Opening professor dropdown');
                setShowProfessorDropdown(true);
              } else {
                console.log('Cannot open professor dropdown - no professors available');
              }
            }}
            className={`bg-input-background ${
              !selectedClass 
                ? 'cursor-not-allowed opacity-60' 
                : 'cursor-pointer'
            }`}
            disabled={!selectedClass}
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {selectedProfessor && (
              <button
                type="button"
                onClick={() => {
                  console.log('Clear professor clicked');
                  onProfessorChange(null);
                }}
                className="p-1 hover:bg-red-100 rounded text-red-500 hover:text-red-700 border border-red-200"
                title="Clear professor selection"
              >
                <X className="h-3 w-3" />
              </button>
            )}
            <ChevronDown className="h-4 w-4 text-gray-400 pointer-events-none" />
          </div>
          
          {console.log('Professor dropdown render check:', {
            showProfessorDropdown,
            selectedClass: selectedClass?.name,
            professors: selectedClass?.professors?.length,
            professorNames: selectedClass?.professors?.map(p => p.name),
            shouldShow: showProfessorDropdown && selectedClass && selectedClass.professors && selectedClass.professors.length > 0
          })}
          {showProfessorDropdown && selectedClass && selectedClass.professors && selectedClass.professors.length > 0 && (
            <div 
              className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto"
              onClick={(e) => {
                console.log('Professor dropdown container clicked:', e.target);
                e.stopPropagation();
              }}
            >
              <div className="p-2 text-xs text-gray-500 bg-gray-50 border-b">
                Professors for {selectedClass.name}:
              </div>
              {selectedClass.professors.map((professor) => {
                console.log('Rendering professor option:', professor);
                return (
                  <button
                    key={professor.id}
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      console.log('Professor button clicked:', { 
                        professor, 
                        index, 
                        selectedClass: selectedClass?.name,
                        event: e.type 
                      });
                      onProfessorChange(professor);
                      setShowProfessorDropdown(false);
                    }}
                    onMouseDown={(e) => {
                      console.log('Professor button mousedown:', { professor: professor.name, index });
                    }}
                    className="w-full px-3 py-2 text-left hover:bg-gray-50 text-sm border-b border-gray-100 last:border-b-0 cursor-pointer"
                    style={{ pointerEvents: 'auto' }}
                  >
                    {professor.name}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
