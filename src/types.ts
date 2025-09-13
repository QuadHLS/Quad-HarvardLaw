export interface Outline {
  id: string;
  title: string;
  year: string;
  type: string;
  rating: number;
  ratingCount: number;
  course: string;
  instructor: string;
  fileType: 'PDF' | 'DOC';
  fileUrl: string;
  pages: number;
}

export interface Instructor {
  id: string;
  name: string;
  courses: string[];
}