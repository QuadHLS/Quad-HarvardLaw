import { Button } from './ui/button';
import type { Instructor } from '../types';

interface InstructorSidebarProps {
  instructors: Instructor[];
  onSelectInstructor: (instructor: string) => void;
  selectedInstructor: string;
}

export function InstructorSidebar({ 
  instructors, 
  onSelectInstructor, 
  selectedInstructor 
}: InstructorSidebarProps) {
  return (
    <div className="w-64 style={{ backgroundColor: '#f9f5f0' }} border-l border-gray-200">
      {/* Header */}
      <div className="bg-[#8B4A6B] text-white p-4">
        <h2 className="text-lg font-medium text-center">Instructors</h2>
      </div>

      {/* Instructor List */}
      <div className="p-4 space-y-2">
        {instructors.map(instructor => (
          <div
            key={instructor.id}
            className={`p-3 rounded-lg border cursor-pointer transition-colors ${
              selectedInstructor === instructor.name
                ? 'bg-[#8B4A6B] text-white border-[#8B4A6B]'
                : 'style={{ backgroundColor: '#f9f5f0' }} hover:style={{ backgroundColor: '#f9f5f0' }} border-gray-200'
            }`}
            onClick={() => onSelectInstructor(
              selectedInstructor === instructor.name ? '' : instructor.name
            )}
          >
            <div className="font-medium">{instructor.name}</div>
            <div className={`text-sm mt-1 ${
              selectedInstructor === instructor.name ? 'text-white/80' : 'text-gray-600'
            }`}>
              {instructor.courses.length} course{instructor.courses.length !== 1 ? 's' : ''}
            </div>
            
            {/* Show courses when selected */}
            {selectedInstructor === instructor.name && (
              <div className="mt-2 space-y-1">
                {instructor.courses.map(course => (
                  <div key={course} className="text-xs style={{ backgroundColor: '#f9f5f0' }}/20 rounded px-2 py-1">
                    {course}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Quick Stats */}
      <div className="p-4 border-t border-gray-200">
        <h3 className="font-medium mb-3">Quick Stats</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Total Outlines:</span>
            <span className="font-medium">156</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">This Week:</span>
            <span className="font-medium text-green-600">+12</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Avg Rating:</span>
            <span className="font-medium">4.8/5</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="p-4 border-t border-gray-200 space-y-2">
        <Button className="w-full bg-[#8B4A6B] hover:bg-[#7A4160]">
          Upload Outline
        </Button>
        <Button variant="outline" className="w-full">
          Request Outline
        </Button>
      </div>
    </div>
  );
}