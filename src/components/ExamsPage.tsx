import { useState } from 'react';
import { Search, Filter } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';

interface ExamsPageProps {
  // No props needed for now - completely independent
}

export function ExamsPage({}: ExamsPageProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('all');
  const [selectedInstructor, setSelectedInstructor] = useState('all');
  const [selectedYear, setSelectedYear] = useState('all');
  const [selectedSemester, setSelectedSemester] = useState('all');

  const courses = ['Contracts', 'Torts', 'Criminal Law', 'Constitutional Law'];
  const instructors = ['Professor Smith', 'Professor Johnson', 'Professor Williams'];
  const years = ['2023', '2022', '2021', '2020'];
  const semesters = ['Fall', 'Spring', 'Summer'];

  return (
    <div className="h-full flex" style={{ backgroundColor: '#f9f5f0' }}>
      {/* Left Sidebar - Search and Filters */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800 mb-2">Exam Search</h2>
          <p className="text-sm text-gray-600">Find past exams and practice materials</p>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search exams..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Filters */}
        <div className="p-4 space-y-4 flex-1">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Course</label>
            <Select value={selectedCourse} onValueChange={setSelectedCourse}>
              <SelectTrigger>
                <SelectValue placeholder="Select course" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Courses</SelectItem>
                {courses.map(course => (
                  <SelectItem key={course} value={course}>{course}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Instructor</label>
            <Select value={selectedInstructor} onValueChange={setSelectedInstructor}>
              <SelectTrigger>
                <SelectValue placeholder="Select instructor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Instructors</SelectItem>
                {instructors.map(instructor => (
                  <SelectItem key={instructor} value={instructor}>{instructor}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Year</label>
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger>
                <SelectValue placeholder="Select year" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Years</SelectItem>
                {years.map(year => (
                  <SelectItem key={year} value={year}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Semester</label>
            <Select value={selectedSemester} onValueChange={setSelectedSemester}>
              <SelectTrigger>
                <SelectValue placeholder="Select semester" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Semesters</SelectItem>
                {semesters.map(semester => (
                  <SelectItem key={semester} value={semester}>{semester}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button className="w-full" variant="outline">
            <Filter className="w-4 h-4 mr-2" />
            Apply Filters
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 bg-white">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Exams</h1>
          <p className="text-gray-600">Browse and download past exam materials</p>
        </div>

        {/* Content */}
        <div className="flex-1 p-6" style={{ backgroundColor: '#f9f5f0' }}>
          {/* Empty content area - just the background */}
        </div>
      </div>
    </div>
  );
}