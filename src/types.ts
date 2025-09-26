export interface Outline {
  id: string;
  title: string;
  year: string;
  type: string;
  rating: number;
  ratingCount: number;
  downloadCount: number;
  course: string;
  instructor: string;
  fileType: string;
  filePath: string;
  fileName: string;
  fileSize: number;
  pages: number;
}

export interface Instructor {
  id: string;
  name: string;
  courses: string[];
}