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
            onFocus={() => !isReadOnly && setShowDropdown(true)}
            placeholder={isReadOnly ? "Course assigned" : "Search for a class..."}
            className="pr-20 bg-input-background"
            readOnly={isReadOnly}
          />
          
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {selectedClass && !isReadOnly && (
              <button
                type="button"
                onClick={handleClearClass}
                className="p-1 hover:bg-gray-100 rounded text-gray-500 hover:text-gray-700"
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
            onClick={() => setShowProfessorDropdown(!showProfessorDropdown)}
            className={`bg-input-background cursor-pointer ${
              !selectedClass 
                ? 'cursor-not-allowed opacity-60' 
                : 'cursor-pointer'
            }`}
            disabled={!selectedClass}
          />
          <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          
          {showProfessorDropdown && selectedClass && selectedClass.professors && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
              {selectedClass.professors.map((professor) => {
                console.log('Rendering professor option:', professor);
                return (
                  <button
                    key={professor.id}
                    type="button"
                    onClick={() => {
                      console.log('Professor selected:', professor);
                      onProfessorChange(professor);
                      setShowProfessorDropdown(false);
                    }}
                    className="w-full px-3 py-2 text-left hover:bg-gray-50 text-sm border-b border-gray-100 last:border-b-0"
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
