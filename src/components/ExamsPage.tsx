import { useState } from 'react';
import { FileText } from 'lucide-react';
import { SearchSidebar } from './SearchSidebar';
import { OutlineViewer } from './OutlineViewer';
import type { Outline, Instructor } from '../types';

interface ExamsPageProps {
  outlines: Outline[];
  allOutlines: Outline[];
  courses: string[];
  instructors: Instructor[];
  savedOutlines: Outline[];
  hiddenOutlines: string[];
  onSaveOutline: (outline: Outline) => void;
  onRemoveSavedOutline: (outlineId: string) => void;
  onToggleSaveOutline: (outline: Outline) => void;
  onHideOutline: (outlineId: string) => void;
  onUnhideAllOutlines: () => void;
}

export function ExamsPage({
  outlines,
  allOutlines,
  courses,
  instructors,
  savedOutlines,
  hiddenOutlines,
  onSaveOutline,
  onRemoveSavedOutline,
  onToggleSaveOutline,
  onHideOutline,
  onUnhideAllOutlines
}: ExamsPageProps) {
  const [selectedOutline, setSelectedOutline] = useState<Outline | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedInstructor, setSelectedInstructor] = useState('');
  const [selectedGrade, setSelectedGrade] = useState<string | undefined>(undefined);
  const [selectedYear, setSelectedYear] = useState<string | undefined>(undefined);
  const [showOutlines, setShowOutlines] = useState(true);
  const [showAttacks, setShowAttacks] = useState(true);
  const [activeTab, setActiveTab] = useState<'search' | 'saved' | 'upload'>('search');
  const [sortBy, setSortBy] = useState('Highest Rated');

  // Filter outlines based on search criteria (same logic as original)
  const filteredOutlines = allOutlines.filter(outline => {
    // Don't show any outlines unless BOTH a course AND instructor are selected
    if (selectedCourse === '' || selectedInstructor === '') {
      return false;
    }
    
    // Exclude hidden outlines
    if (hiddenOutlines.includes(outline.id)) {
      return false;
    }
    
    const matchesSearch = searchTerm === '' || 
      outline.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      outline.course.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCourse = outline.course === selectedCourse;
    const matchesInstructor = outline.instructor === selectedInstructor;
    const matchesGrade = !selectedGrade || outline.type === selectedGrade;
    const matchesYear = !selectedYear || outline.year === selectedYear;
    
    // Filter by Outline/Attack type based on page count
    const isAttack = outline.pages <= 25;
    const isOutline = outline.pages > 25;
    const matchesType = (isAttack && showAttacks) || (isOutline && showOutlines);
    
    return matchesSearch && matchesCourse && matchesInstructor && matchesGrade && matchesYear && matchesType;
  });

  // Sort outlines
  const sortedOutlines = [...filteredOutlines].sort((a, b) => {
    if (sortBy === 'Highest Rated') {
      return b.rating - a.rating;
    }
    if (sortBy === 'Newest') {
      return parseInt(b.year) - parseInt(a.year);
    }
    return a.title.localeCompare(b.title);
  });

  return (
    <div className="h-full bg-gray-100 flex">
      {/* Search Sidebar */}
      <SearchSidebar
        outlines={sortedOutlines}
        allOutlines={allOutlines}
        courses={courses}
        instructors={instructors}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        selectedCourse={selectedCourse}
        setSelectedCourse={setSelectedCourse}
        selectedInstructor={selectedInstructor}
        setSelectedInstructor={setSelectedInstructor}
        selectedGrade={selectedGrade}
        setSelectedGrade={setSelectedGrade}
        selectedYear={selectedYear}
        setSelectedYear={setSelectedYear}
        sortBy={sortBy}
        setSortBy={setSortBy}
        showOutlines={showOutlines}
        setShowOutlines={setShowOutlines}
        showAttacks={showAttacks}
        setShowAttacks={setShowAttacks}
        selectedOutline={selectedOutline}
        onSelectOutline={setSelectedOutline}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        savedOutlines={savedOutlines}
        onRemoveSavedOutline={onRemoveSavedOutline}
        onToggleSaveOutline={onToggleSaveOutline}
        hiddenOutlines={hiddenOutlines}
        onHideOutline={onHideOutline}
        onUnhideAllOutlines={onUnhideAllOutlines}
      />
      
      {/* Main Content */}
      <div className="flex-1">
        {activeTab === 'upload' ? (
          <div className="flex items-center justify-center h-full bg-gray-100">
            <div className="text-center p-8">
              <FileText className="w-24 h-24 text-gray-400 mx-auto mb-4" />
              <h2 className="text-2xl font-medium text-gray-700 mb-4">
                Upload Your Exam
              </h2>
              <p className="text-gray-600 mb-6 max-w-md">
                Use the upload form in the sidebar to share your exam materials with the community.
              </p>
              <div className="bg-white rounded-lg shadow-sm p-6 max-w-lg mx-auto">
                <h3 className="font-medium text-gray-800 mb-3">Upload Guidelines:</h3>
                <ul className="text-sm text-gray-600 space-y-2 text-left">
                  <li>• Accepted formats: PDF, DOC, DOCX</li>
                  <li>• Maximum file size: 50MB</li>
                  <li>• Only upload your original work</li>
                  <li>• Include accurate course and instructor information</li>
                  <li>• Use descriptive titles for better discoverability</li>
                </ul>
              </div>
            </div>
          </div>
        ) : (
          <OutlineViewer 
            outline={selectedOutline} 
            onSaveOutline={onSaveOutline}
            isSaved={selectedOutline ? savedOutlines.some(saved => saved.id === selectedOutline.id) : false}
          />
        )}
      </div>
    </div>
  );
}