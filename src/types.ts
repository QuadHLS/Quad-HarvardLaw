// Base interface for common properties
interface BaseDocument {
  id: string;
  title: string;
  file_name: string;
  file_path: string;
  file_type: string; // 'pdf' or 'docx' from database
  file_size: number;
  course: string;
  instructor: string;
  year: string;
  pages: number;
  created_at: string;
  updated_at: string;
}

// Specific interface for outlines
export interface Outline extends BaseDocument {
  grade: string; // 'H', 'P', 'DS' from database
  type?: 'outline' | 'attack'; // Determined by page count
}

// Specific interface for exams
export interface Exam extends BaseDocument {
  semester?: string; // Exams might have semester info
  exam_type?: 'midterm' | 'final' | 'quiz' | 'practice'; // Exam-specific type
}

export interface Instructor {
  id: string;
  name: string;
  courses: string[];
}