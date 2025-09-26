export interface Outline {
  id: string;
  title: string;
  file_name: string;
  file_path: string;
  file_type: string; // 'pdf' or 'docx' from database
  file_size: number;
  course: string;
  instructor: string;
  year: string;
  grade: string; // 'H', 'P', 'DS' from database
  pages: number;
  description: string | null;
  rating: number;
  rating_count: number;
  download_count: number;
  created_at: string;
  updated_at: string;
}

export interface Instructor {
  id: string;
  name: string;
  courses: string[];
}