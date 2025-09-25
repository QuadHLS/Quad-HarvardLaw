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
  // Exam-specific state
  selectedExam: Outline | null;
  setSelectedExam: (exam: Outline | null) => void;
  examSearchTerm: string;
  setExamSearchTerm: (term: string) => void;
  selectedExamCourse: string;
  setSelectedExamCourse: (course: string) => void;
  selectedExamInstructor: string;
  setSelectedExamInstructor: (instructor: string) => void;
  selectedExamGrade: string | undefined;
  setSelectedExamGrade: (grade: string | undefined) => void;
  selectedExamYear: string | undefined;
  setSelectedExamYear: (year: string | undefined) => void;
  showExamOutlines: boolean;
  setShowExamOutlines: (show: boolean) => void;
  showExamAttacks: boolean;
  setShowExamAttacks: (show: boolean) => void;
  examActiveTab: 'search' | 'saved' | 'upload';
  setExamActiveTab: (tab: 'search' | 'saved' | 'upload') => void;
  sortBy: string;
  setSortBy: (sort: string) => void;
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
  onUnhideAllOutlines,
  // Exam-specific state
  selectedExam,
  setSelectedExam,
  examSearchTerm,
  setExamSearchTerm,
  selectedExamCourse,
  setSelectedExamCourse,
  selectedExamInstructor,
  setSelectedExamInstructor,
  selectedExamGrade,
  setSelectedExamGrade,
  selectedExamYear,
  setSelectedExamYear,
  showExamOutlines,
  setShowExamOutlines,
  showExamAttacks,
  setShowExamAttacks,
  examActiveTab,
  setExamActiveTab,
  sortBy,
  setSortBy
}: ExamsPageProps) {

  // Filter exams based on search criteria (using exam-specific state)
  const filteredExams = allOutlines.filter(exam => {
    // Don't show any exams unless BOTH a course AND instructor are selected
    if (selectedExamCourse === '' || selectedExamInstructor === '') {
      return false;
    }
    
    // Exclude hidden exams
    if (hiddenOutlines.includes(exam.id)) {
      return false;
    }
    
    const matchesSearch = examSearchTerm === '' || 
      exam.title.toLowerCase().includes(examSearchTerm.toLowerCase()) ||
      exam.course.toLowerCase().includes(examSearchTerm.toLowerCase());
    
    const matchesCourse = exam.course === selectedExamCourse;
    const matchesInstructor = exam.instructor === selectedExamInstructor;
    const matchesGrade = !selectedExamGrade || exam.type === selectedExamGrade;
    const matchesYear = !selectedExamYear || exam.year === selectedExamYear;
    
    // Filter by Outline/Attack type based on page count
    const isAttack = exam.pages <= 25;
    const isOutline = exam.pages > 25;
    const matchesType = (isAttack && showExamAttacks) || (isOutline && showExamOutlines);
    
    return matchesSearch && matchesCourse && matchesInstructor && matchesGrade && matchesYear && matchesType;
  });

  // Sort exams
  const sortedExams = [...filteredExams].sort((a, b) => {
    if (sortBy === 'Highest Rated') {
      return b.rating - a.rating;
    }
    if (sortBy === 'Newest') {
      return parseInt(b.year) - parseInt(a.year);
    }
    return a.title.localeCompare(b.title);
  });

  return (
    <div className="h-full flex" style={{ backgroundColor: 'var(--background-color, #f9f5f0)' }}>
      {/* Search Sidebar */}
      <SearchSidebar
        outlines={sortedExams}
        allOutlines={allOutlines}
        courses={courses}
        instructors={instructors}
        searchTerm={examSearchTerm}
        setSearchTerm={setExamSearchTerm}
        selectedCourse={selectedExamCourse}
        setSelectedCourse={setSelectedExamCourse}
        selectedInstructor={selectedExamInstructor}
        setSelectedInstructor={setSelectedExamInstructor}
        selectedGrade={selectedExamGrade}
        setSelectedGrade={setSelectedExamGrade}
        selectedYear={selectedExamYear}
        setSelectedYear={setSelectedExamYear}
        sortBy={sortBy}
        setSortBy={setSortBy}
        showOutlines={showExamOutlines}
        setShowOutlines={setShowExamOutlines}
        showAttacks={showExamAttacks}
        setShowAttacks={setShowExamAttacks}
        selectedOutline={selectedExam}
        onSelectOutline={setSelectedExam}
        activeTab={examActiveTab}
        setActiveTab={setExamActiveTab}
        savedOutlines={savedOutlines}
        onRemoveSavedOutline={onRemoveSavedOutline}
        onToggleSaveOutline={onToggleSaveOutline}
        hiddenOutlines={hiddenOutlines}
        onHideOutline={onHideOutline}
        onUnhideAllOutlines={onUnhideAllOutlines}
      />
      
      {/* Main Content */}
      <div className="flex-1">
        {examActiveTab === 'upload' ? (
          <div className="flex items-center justify-center h-full" style={{ backgroundColor: 'var(--background-color, #f9f5f0)' }}>
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
            outline={selectedExam} 
            onSaveOutline={onSaveOutline}
            isSaved={selectedExam ? savedOutlines.some(saved => saved.id === selectedExam.id) : false}
          />
        )}
      </div>
    </div>
  );
}