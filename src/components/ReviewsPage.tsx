import { useState } from 'react';
import * as React from 'react';
import { Star, Search, User, Calendar, ThumbsUp, ThumbsDown, BookOpen, MessageCircle, FileText, Award } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select } from './ui/select';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

// Mock review data
interface Review {
  id: string;
  course: string;
  instructor: string;
  overall: number;
  overallReview: string;
  coldCalls?: number;
  coldCallsReview?: string;
  readings?: number;
  readingsReview?: string;
  exam?: number;
  examReview?: string;
  semester: string;
  year: string;
  anonymous: boolean;
  helpful: number;
  unhelpful: number;
  laptopsAllowed?: boolean;
  assessmentType?: 'Final' | 'Paper' | 'Both';
  hasColdCalls?: boolean;
  grade: 'DS' | 'H' | 'P';
}

const mockReviews: Review[] = [
  {
    id: '1',
    course: 'Constitutional Law',
    instructor: 'Rodriguez',
    overall: 9,
    overallReview: 'Professor Rodriguez is absolutely brilliant. Her lectures are engaging and she really helps you understand the nuances of constitutional interpretation. Highly recommend this class.',
    coldCalls: 8,
    coldCallsReview: 'She uses the Socratic method but in a supportive way. Questions are challenging but fair, and she helps guide you to the right answer if you\'re struggling.',
    readings: 7,
    readingsReview: 'The reading load is heavy but manageable if you stay on top of it. Cases are well-selected and directly relevant to class discussions.',
    exam: 8,
    examReview: 'Her exams are challenging but fair - they really test your understanding rather than just memorization. Study the cases thoroughly.',
    semester: 'Fall',
    year: '2024',
    anonymous: true,
    helpful: 23,
    unhelpful: 2,
    laptopsAllowed: true,
    assessmentType: 'Final',
    hasColdCalls: true,
    grade: 'DS'
  },
  {
    id: '2',
    course: 'Constitutional Law',
    instructor: 'Rodriguez',
    overall: 8,
    overallReview: 'Good professor overall. She knows her stuff and is always prepared for class. Sometimes moves a bit fast through complex topics but office hours are helpful.',
    coldCalls: 6,
    coldCallsReview: 'Cold calls are frequent but not too intimidating. She\'s patient if you\'re prepared but haven\'t quite grasped the concept yet.',
    readings: 5,
    readingsReview: 'Reasonable reading load compared to other Con Law professors. Focus on the main cases and you\'ll be fine.',
    exam: 7,
    examReview: 'Fair exam that focuses on application of concepts rather than pure memorization. Practice hypotheticals are key.',
    semester: 'Spring',
    year: '2024',
    anonymous: false,
    helpful: 15,
    unhelpful: 1,
    laptopsAllowed: true,
    assessmentType: 'Final',
    hasColdCalls: true,
    grade: 'H'
  },
  {
    id: '3',
    course: 'Contract Law',
    instructor: 'Chen',
    overall: 9,
    overallReview: 'Chen is fantastic! Makes contracts actually interesting and relatable. Uses lots of real-world examples and cases. He\'s very approachable during office hours.',
    coldCalls: 7,
    coldCallsReview: 'He uses cold calls to keep everyone engaged, but they\'re more like guided discussions. He wants you to think through the problems together.',
    readings: 8,
    readingsReview: 'The reading is substantial but every case matters. He does a great job connecting the readings to practical applications.',
    exam: 9,
    examReview: 'Excellent exam that really tests your understanding of contract principles. If you understand the concepts, you\'ll do well.',
    semester: 'Fall',
    year: '2024',
    anonymous: true,
    helpful: 31,
    unhelpful: 0,
    laptopsAllowed: false,
    assessmentType: 'Final',
    hasColdCalls: true,
    grade: 'DS'
  },
  {
    id: '4',
    course: 'Criminal Law',
    instructor: 'Thompson',
    overall: 6,
    overallReview: 'Thompson knows criminal law inside and out, but can be intimidating in class. If you\'re prepared and engaged, you\'ll learn a lot. If not, it can be a tough semester.',
    coldCalls: 9,
    coldCallsReview: 'Uses the Socratic method extensively and can be quite intimidating. Come to class prepared or you\'ll have a bad time.',
    readings: 6,
    readingsReview: 'Standard criminal law reading load. The cases are interesting but Thompson expects you to know them inside and out.',
    exam: 5,
    examReview: 'Tough exam with very detailed hypotheticals. You need to know the elements of every crime perfectly.',
    semester: 'Fall',
    year: '2023',
    anonymous: true,
    helpful: 18,
    unhelpful: 5,
    laptopsAllowed: true,
    assessmentType: 'Final',
    hasColdCalls: true,
    grade: 'P'
  },
  {
    id: '5',
    course: 'Torts',
    instructor: 'Moore',
    overall: 8,
    overallReview: 'Moore makes torts digestible and even fun at times. Clear explanations and good use of hypotheticals. One of the better 1L professors.',
    readings: 7,
    readingsReview: 'Manageable reading load with good case selection. Moore does a nice job highlighting the key takeaways from each case.',
    exam: 8,
    examReview: 'Straightforward exam if you understand the concepts. Focus on understanding the elements and policy rationales.',
    semester: 'Spring',
    year: '2024',
    anonymous: false,
    helpful: 27,
    unhelpful: 3,
    laptopsAllowed: true,
    assessmentType: 'Final',
    hasColdCalls: false,
    grade: 'H'
  },
  {
    id: '6',
    course: 'Evidence',
    instructor: 'Taylor',
    overall: 10,
    overallReview: 'Taylor is amazing for Evidence. The subject matter is complex but she breaks it down beautifully. Lots of practical examples from her litigation experience.',
    coldCalls: 8,
    coldCallsReview: 'She uses cold calls effectively to work through evidence problems step by step. It\'s more collaborative than scary.',
    readings: 9,
    readingsReview: 'Heavy reading but every case matters. She connects everything back to practical litigation situations which helps it stick.',
    exam: 9,
    examReview: 'Challenging but fair exam with realistic evidence problems. Her practice exams are very helpful.',
    semester: 'Fall',
    year: '2024',
    anonymous: true,
    helpful: 22,
    unhelpful: 1,
    laptopsAllowed: true,
    assessmentType: 'Final',
    hasColdCalls: true,
    grade: 'DS'
  },
  {
    id: '7',
    course: 'Advanced Constitutional Law',
    instructor: 'Foster',
    overall: 7,
    overallReview: 'Foster\'s seminar is excellent for deep constitutional analysis. Great for students interested in constitutional scholarship and academic discussion.',
    readings: 8,
    readingsReview: 'Heavy reading load with academic articles and recent cases. Every reading is directly relevant to class discussion.',
    semester: 'Spring',
    year: '2024',
    anonymous: true,
    helpful: 15,
    unhelpful: 1,
    laptopsAllowed: true,
    assessmentType: 'Paper',
    hasColdCalls: false,
    grade: 'H'
  },
  {
    id: '8',
    course: 'Corporate Law',
    instructor: 'Collins',
    overall: 9,
    overallReview: 'Collins brings real-world business experience to the classroom. The material is complex but she explains it well. Mix of assessment types keeps things interesting.',
    coldCalls: 5,
    coldCallsReview: 'Light cold calling, more like check-ins to see if you\'re following along. She\'s supportive and not trying to trip you up.',
    readings: 7,
    readingsReview: 'Good selection of cases and materials. She provides helpful context about how things work in practice.',
    exam: 8,
    examReview: 'Fair exam that combines doctrinal knowledge with practical application. The paper component lets you dive deeper into topics of interest.',
    semester: 'Fall',
    year: '2024',
    anonymous: false,
    helpful: 19,
    unhelpful: 2,
    laptopsAllowed: true,
    assessmentType: 'Both',
    hasColdCalls: true,
    grade: 'DS'
  },
  {
    id: '9',
    course: 'Civil Rights Law',
    instructor: 'Rodriguez',
    overall: 8,
    overallReview: 'Professor Rodriguez brings her constitutional expertise to civil rights issues. Passionate about the subject and it shows in her teaching.',
    coldCalls: 7,
    coldCallsReview: 'Similar style to her Con Law class - challenging but supportive questions that help you understand the cases.',
    readings: 8,
    readingsReview: 'Heavy reading load with both historical and contemporary cases. Every reading connects to current events.',
    exam: 7,
    examReview: 'Challenging exam that requires you to apply civil rights principles to novel situations. Good preparation for practice.',
    semester: 'Spring',
    year: '2024',
    anonymous: true,
    helpful: 16,
    unhelpful: 1,
    laptopsAllowed: true,
    assessmentType: 'Final',
    hasColdCalls: true,
    grade: 'H'
  },
  {
    id: '10',
    course: 'Commercial Law',
    instructor: 'Chen',
    overall: 9,
    overallReview: 'Chen is just as excellent in Commercial Law as in Contracts. Great at connecting theory to practice.',
    coldCalls: 6,
    coldCallsReview: 'Uses cold calls to work through UCC problems. More technical than Contracts but still supportive.',
    readings: 7,
    readingsReview: 'Mix of cases and UCC provisions. Chen provides good commercial context for the statutory material.',
    exam: 9,
    examReview: 'Well-crafted exam that tests understanding of commercial transactions. Practice problems are essential.',
    semester: 'Spring',
    year: '2024',
    anonymous: false,
    helpful: 12,
    unhelpful: 0,
    laptopsAllowed: false,
    assessmentType: 'Final',
    hasColdCalls: true,
    grade: 'DS'
  }
];

const courses = [
  'All Courses',
  'Administrative Law',
  'Advanced Constitutional Law', 
  'Antitrust Law',
  'Bankruptcy',
  'Business Taxation',
  'Civil Rights Law',
  'Commercial Law',
  'Competition Law',
  'Constitutional Law',
  'Contract Law',
  'Corporate Law',
  'Criminal Law',
  'Criminal Procedure',
  'Domestic Relations',
  'Employment Law',
  'Energy Law',
  'Environmental Law',
  'Estate Planning',
  'Evidence',
  'Family Law',
  'Financial Regulation',
  'Health Law',
  'Immigration Law',
  'Intellectual Property Law',
  'International Law',
  'Labor Law',
  'Medical Malpractice',
  'Patent Law',
  'Personal Injury Law',
  'Property Law',
  'Real Estate Law',
  'Securities Law',
  'Tax Law',
  'Torts',
  'Trial Advocacy'
];

// Professor data with their courses and overall ratings
interface Professor {
  firstName: string;
  lastName: string;
  fullName: string;
  courses: string[];
  overallRating: number;
  totalReviews: number;
}

const professors: Professor[] = [
  { name: 'Rodriguez', courses: ['Constitutional Law', 'Civil Rights Law'], overallRating: 8.5, totalReviews: 12 },
  { name: 'Chen', courses: ['Contract Law', 'Commercial Law'], overallRating: 9.2, totalReviews: 8 },
  { name: 'Thompson', courses: ['Criminal Law', 'Criminal Procedure'], overallRating: 6.8, totalReviews: 15 },
  { name: 'Moore', courses: ['Torts', 'Personal Injury Law'], overallRating: 8.7, totalReviews: 9 },
  { name: 'Taylor', courses: ['Evidence', 'Trial Advocacy'], overallRating: 9.1, totalReviews: 11 },
  { name: 'Foster', courses: ['Advanced Constitutional Law', 'Civil Rights Law'], overallRating: 7.3, totalReviews: 6 },
  { name: 'Collins', courses: ['Corporate Law', 'Securities Law'], overallRating: 8.9, totalReviews: 7 },
  { name: 'Anderson', courses: ['Property Law', 'Real Estate Law'], overallRating: 8.0, totalReviews: 10 },
  { name: 'Davis', courses: ['Intellectual Property Law', 'Patent Law'], overallRating: 7.8, totalReviews: 14 },
  { name: 'Miller', courses: ['Labor Law', 'Employment Law'], overallRating: 8.3, totalReviews: 13 }
];

const instructorNames = [
  'Select a Professor',
  'Rodriguez', 'Chen', 'Thompson', 'Moore', 'Taylor', 'Foster', 'Collins', 
  'Anderson', 'Davis', 'Miller', 'Abel', 'Baker', 'Barnes', 'Brown', 'Campbell', 
  'Carter', 'Clark', 'Edwards', 'Evans', 'Garcia', 'Green', 'Hall', 'Harris', 
  'Jackson', 'Johnson', 'Kim', 'King', 'Lee', 'Lopez', 'Martinez', 'Mitchell', 
  'Morris', 'Nelson', 'Parker', 'Perez', 'Phillips', 'Sanchez', 'Scott', 
  'Stewart', 'Turner', 'White', 'Williams', 'Wilson', 'Wright', 'Young', 'Zachariah'
];

export function ReviewsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProfessor, setSelectedProfessor] = useState<string | null>(null);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [reviewSortBy, setReviewSortBy] = useState('Most Recent');

  // Calculate comprehensive professor data from reviews
  const professorData = React.useMemo(() => {
    const professorMap = new Map();
    
    // Aggregate data from reviews
    mockReviews.forEach(review => {
      if (!professorMap.has(review.instructor)) {
        const [firstName, lastName] = review.instructor.includes(' ') 
          ? review.instructor.split(' ') 
          : ['', review.instructor];
        
        professorMap.set(review.instructor, {
          firstName: firstName || '',
          lastName: lastName || review.instructor,
          fullName: review.instructor,
          courses: new Map(),
          totalReviews: 0,
          totalRating: 0
        });
      }
      
      const prof = professorMap.get(review.instructor);
      prof.totalReviews++;
      prof.totalRating += review.overall;
      
      if (!prof.courses.has(review.course)) {
        prof.courses.set(review.course, 0);
      }
      prof.courses.set(review.course, prof.courses.get(review.course) + 1);
    });
    
    // Convert to final format and sort by last name
    const result = Array.from(professorMap.values()).map(prof => ({
      firstName: prof.firstName,
      lastName: prof.lastName,
      fullName: prof.fullName,
      overallRating: prof.totalRating / prof.totalReviews,
      totalReviews: prof.totalReviews,
      courses: Array.from(prof.courses.entries()).map(([course, count]) => ({
        name: course,
        reviewCount: count
      })).sort((a, b) => a.name.localeCompare(b.name))
    })).sort((a, b) => a.lastName.localeCompare(b.lastName));
    
    return result;
  }, []);

  // Filter professors based on search
  const filteredProfessors = professorData.filter(prof =>
    prof.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    prof.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    prof.lastName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Group filtered professors alphabetically by last name
  const groupedProfessors = React.useMemo(() => {
    const groups: { [key: string]: typeof filteredProfessors } = {};
    
    filteredProfessors.forEach(prof => {
      const firstLetter = prof.lastName.charAt(0).toUpperCase();
      if (!groups[firstLetter]) {
        groups[firstLetter] = [];
      }
      groups[firstLetter].push(prof);
    });

    // Sort each group by last name
    Object.keys(groups).forEach(letter => {
      groups[letter].sort((a, b) => a.lastName.localeCompare(b.lastName));
    });

    return groups;
  }, [filteredProfessors]);

  // Get all letters that have professors (for A-Z navigation)
  const availableLetters = Object.keys(groupedProfessors).sort();
  
  // Function to scroll to a letter section
  const scrollToLetter = (letter: string) => {
    const element = document.getElementById(`letter-${letter}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Get reviews for selected professor/course
  const getReviewsForProfessorCourse = (professorName: string, courseName: string, sortBy: string) => {
    const filteredReviews = mockReviews.filter(review => 
      review.instructor === professorName && review.course === courseName
    );
    
    return filteredReviews.sort((a, b) => {
      switch (sortBy) {
        case 'Highest':
          return b.overall - a.overall;
        case 'Lowest':
          return a.overall - b.overall;
        case 'Most Recent':
        default:
          if (a.year !== b.year) return parseInt(b.year) - parseInt(a.year);
          return a.semester === 'Fall' ? -1 : 1;
      }
    });
  };

  const renderRatingBox = (rating: number, label: string, icon: React.ReactNode, reviewText: string, lowLabel?: string, highLabel?: string, isOverall?: boolean) => {
    return (
      <div className={`p-4 bg-white rounded-lg border ${isOverall ? 'border-l-4 border-[#752432] bg-gray-50' : 'border-gray-200'} shadow-sm`}>
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center space-x-2">
            {icon}
            <span className={`font-medium ${isOverall ? 'text-[#752432]' : 'text-gray-700'}`}>
              {label}
            </span>
          </div>
          <span className={`text-sm font-medium ${isOverall ? 'text-[#752432]' : 'text-gray-600'}`}>
            {rating}/10
          </span>
        </div>
        <div className="flex space-x-1 mb-3">
          {Array.from({ length: 10 }, (_, i) => (
            <div
              key={i}
              className={`h-2 flex-1 rounded-sm ${
                i < rating ? 'bg-[#752432]' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>
        {(lowLabel && highLabel) && (
          <div className="flex justify-between text-xs text-gray-500 mb-3">
            <span>{lowLabel}</span>
            <span>{highLabel}</span>
          </div>
        )}
        <p className="text-sm text-gray-700 leading-relaxed">
          {reviewText}
        </p>
      </div>
    );
  };

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'DS':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'H':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'P':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getAssessmentType = (type: string) => {
    switch (type) {
      case 'Final':
        return 'Final Exam';
      case 'Paper':
        return 'Final Paper';
      case 'Both':
        return 'Final Exam & Paper';
      default:
        return type;
    }
  };

  return (
    <div className="h-full bg-gray-100 overflow-hidden">
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 p-6">
          <div className="mx-auto">
            <div className="flex items-center mb-4">
              <Star className="w-8 h-8 mr-3" style={{ color: '#752432' }} />
              <h1 className="text-2xl font-medium text-gray-800">Course Reviews</h1>
            </div>
            <p className="text-gray-600 mb-6">
              Browse professor reviews organized by overall rating and course-specific feedback.
            </p>
            
            {/* Search and A-Z Navigation */}
            <div className="flex items-start gap-6">
              <div className="max-w-md flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search professors..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              {/* A-Z Navigation */}
              {!selectedProfessor && (
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-600 whitespace-nowrap">Jump to:</span>
                  <div className="flex items-center gap-2">
                    {Array.from({ length: 26 }, (_, i) => {
                      const letter = String.fromCharCode(65 + i);
                      const hasProfs = availableLetters.includes(letter);
                      return (
                        <button
                          key={letter}
                          onClick={() => hasProfs && scrollToLetter(letter)}
                          disabled={!hasProfs}
                          className={`px-2 py-1 text-sm font-medium transition-colors ${
                            hasProfs
                              ? 'text-[#752432] hover:text-[#752432]/80 cursor-pointer'
                              : 'text-gray-400 cursor-not-allowed'
                          }`}
                        >
                          {letter}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="mx-auto">
            {filteredProfessors.length === 0 ? (
              <div className="text-center py-12">
                <Star className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-700 mb-2">No Professors Found</h3>
                <p className="text-gray-600">
                  No professors match your search criteria. Try a different search term.
                </p>
              </div>
            ) : selectedProfessor && selectedCourse ? (
              /* Show reviews for selected professor and course */
              <div className="space-y-6">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSelectedProfessor(null);
                    setSelectedCourse('');
                  }}
                  className="mb-4"
                >
                  ← Back to All Professors
                </Button>
                
                {(() => {
                  const prof = professorData.find(p => p.fullName === selectedProfessor);
                  if (!prof) return null;
                  
                  const courseReviews = getReviewsForProfessorCourse(prof.fullName, selectedCourse, reviewSortBy);
                  const courseData = prof.courses.find(c => c.name === selectedCourse);
                  
                  return (
                    <div className="space-y-6">
                      <Card className="p-6">
                        <div className="mb-6">
                          <h2 className="text-xl font-medium text-gray-900 mb-2">
                            {prof.firstName} {prof.lastName} - {selectedCourse}
                          </h2>
                          <div className="flex items-center space-x-4 mb-4">
                            <div className="flex items-center">
                              <div className="flex items-center mr-2">
                                {Array.from({ length: 5 }, (_, i) => (
                                  <Star
                                    key={i}
                                    className={`w-5 h-5 ${
                                      i < Math.floor(prof.overallRating / 2) 
                                        ? 'text-[#752432] fill-current' 
                                        : 'text-gray-300'
                                    }`}
                                  />
                                ))}
                              </div>
                              <span className="font-medium text-gray-900">{prof.overallRating.toFixed(1)}</span>
                              <span className="text-gray-600 ml-1">out of 10</span>
                            </div>
                            <span className="text-gray-600">•</span>
                            <span className="text-gray-600">{courseData?.reviewCount || 0} reviews for this course</span>
                          </div>
                        </div>
                      </Card>
                      
                      {/* Sort Controls */}
                      {courseReviews.length > 0 && (
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-sm text-gray-600">Sort by:</span>
                          <div className="flex gap-2">
                            {['Most Recent', 'Highest', 'Lowest'].map((option) => (
                              <Button
                                key={option}
                                variant={reviewSortBy === option ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setReviewSortBy(option)}
                                className={reviewSortBy === option ? 'bg-[#752432] hover:bg-[#752432]/90' : ''}
                              >
                                {option}
                              </Button>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {courseReviews.length === 0 ? (
                        <div className="text-center py-8">
                          <Star className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                          <h4 className="font-medium text-gray-700 mb-2">No Reviews Yet</h4>
                          <p className="text-gray-600">
                            No reviews available for {prof.firstName} {prof.lastName}'s {selectedCourse} course.
                          </p>
                        </div>
                      ) : (
                        courseReviews.map(review => (
                          <Card key={review.id} className="p-6">
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex-1">
                                <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                                  <div className="flex items-center">
                                    <Calendar className="w-4 h-4 mr-1" />
                                    {review.semester} {review.year}
                                  </div>

                                </div>

                                {/* Course Details */}
                                <div className="flex flex-wrap gap-4 text-xs text-gray-600 mb-4">
                                  {review.laptopsAllowed !== undefined && (
                                    <span>Laptops: {review.laptopsAllowed ? 'Allowed' : 'Not Allowed'}</span>
                                  )}
                                  {review.assessmentType && (
                                    <span>Assessment: {getAssessmentType(review.assessmentType)}</span>
                                  )}
                                  {review.hasColdCalls !== undefined && (
                                    <span>Cold Calls: {review.hasColdCalls ? 'Yes' : 'No'}</span>
                                  )}
                                </div>
                              </div>
                              
                              {/* Grade Badge */}
                              <div className="ml-4">
                                <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium border ${getGradeColor(review.grade)}`}>
                                  {review.grade}
                                </span>
                              </div>
                            </div>

                            {/* Rating Boxes */}
                            <div className="space-y-4 mb-4">
                              {/* First row - Readings, Cold Calls, Exam */}
                              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                                {review.readings !== undefined && review.readingsReview && renderRatingBox(
                                  review.readings, 
                                  'Readings', 
                                  <BookOpen className="w-4 h-4 text-gray-600" />,
                                  review.readingsReview,
                                  'Light',
                                  'Heavy'
                                )}
                                {review.hasColdCalls && review.coldCalls !== undefined && review.coldCallsReview && renderRatingBox(
                                  review.coldCalls, 
                                  'Cold Calls', 
                                  <MessageCircle className="w-4 h-4 text-gray-600" />,
                                  review.coldCallsReview,
                                  'Easy',
                                  'Hard'
                                )}
                                {review.exam !== undefined && review.examReview && renderRatingBox(
                                  review.exam, 
                                  'Exam', 
                                  <FileText className="w-4 h-4 text-gray-600" />,
                                  review.examReview,
                                  'Easy',
                                  'Hard'
                                )}
                              </div>
                              
                              {/* Second row - Overall (more prominent) */}
                              <div>
                                {renderRatingBox(
                                  review.overall, 
                                  'Overall', 
                                  <Award className="w-4 h-4 text-[#752432]" />,
                                  review.overallReview,
                                  undefined,
                                  undefined,
                                  true
                                )}
                              </div>
                            </div>

                            {/* Helpful/Unhelpful */}
                            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                              <div className="flex items-center space-x-4">
                                <button className="flex items-center space-x-1 text-sm text-gray-600 hover:text-green-600 transition-colors">
                                  <ThumbsUp className="w-4 h-4" />
                                  <span>Helpful ({review.helpful})</span>
                                </button>
                                <button className="flex items-center space-x-1 text-sm text-gray-600 hover:text-red-600 transition-colors">
                                  <ThumbsDown className="w-4 h-4" />
                                  <span>Not Helpful ({review.unhelpful})</span>
                                </button>
                              </div>
                              <Button variant="outline" size="sm">
                                Report
                              </Button>
                            </div>
                          </Card>
                        ))
                      )}
                    </div>
                  );
                })()}
              </div>
            ) : selectedProfessor ? (
              /* Show courses for selected professor */
              <div className="space-y-6">
                <Button 
                  variant="outline" 
                  onClick={() => setSelectedProfessor(null)}
                  className="mb-4"
                >
                  ← Back to All Professors
                </Button>
                
                {(() => {
                  const prof = professorData.find(p => p.fullName === selectedProfessor);
                  if (!prof) return null;
                  
                  return (
                    <div className="space-y-6">
                      <Card className="p-6">
                        <div className="flex items-start justify-between mb-6">
                          <div className="flex-1">
                            <h2 className="text-xl font-medium text-gray-900 mb-2">
                              {prof.firstName} {prof.lastName}
                            </h2>
                            <div className="flex items-center space-x-4 mb-4">
                              <div className="flex items-center">
                                <div className="flex items-center mr-2">
                                  {Array.from({ length: 5 }, (_, i) => (
                                    <Star
                                      key={i}
                                      className={`w-5 h-5 ${
                                        i < Math.floor(prof.overallRating / 2) 
                                          ? 'text-[#752432] fill-current' 
                                          : 'text-gray-300'
                                      }`}
                                    />
                                  ))}
                                </div>
                                <span className="font-medium text-gray-900">{prof.overallRating.toFixed(1)}</span>
                                <span className="text-gray-600 ml-1">out of 10</span>
                              </div>
                              <span className="text-gray-600">•</span>
                              <span className="text-gray-600">{prof.totalReviews} total reviews</span>
                            </div>
                          </div>
                        </div>
                      </Card>
                      
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium text-gray-900">Select a Course to View Reviews</h3>
                        {prof.courses.map((courseInfo) => (
                          <Card 
                            key={courseInfo.name}
                            className="p-4 cursor-pointer hover:bg-gray-50 transition-colors border"
                            onClick={() => setSelectedCourse(courseInfo.name)}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <h4 className="font-medium text-gray-900">{courseInfo.name}</h4>
                                <p className="text-sm text-gray-600 mt-1">
                                  {courseInfo.reviewCount} review{courseInfo.reviewCount !== 1 ? 's' : ''}
                                </p>
                              </div>
                              <div className="text-[#752432]">
                                →
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </div>
            ) : (
              /* Show alphabetically grouped professors */
              <div className="space-y-8">
                {availableLetters.map((letter) => (
                  <div key={letter} id={`letter-${letter}`}>
                    {/* Letter Divider */}
                    <div className="flex items-center mb-4">
                      <div className="w-12 h-12 rounded-full bg-[#752432] flex items-center justify-center mr-4">
                        <span className="text-white text-lg font-medium">{letter}</span>
                      </div>
                      <div className="flex-1 h-px bg-gray-300"></div>
                    </div>
                    
                    {/* Professors in this letter group */}
                    <div className="grid gap-4">
                      {groupedProfessors[letter].map((prof) => (
                        <Card 
                          key={prof.fullName}
                          className="p-6 cursor-pointer hover:bg-gray-50 transition-colors border"
                          onClick={() => setSelectedProfessor(prof.fullName)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className="text-lg font-medium text-gray-900 mb-2">
                                {prof.firstName} {prof.lastName}
                              </h3>
                              <div className="flex items-center space-x-4 mb-3">
                                <div className="flex items-center">
                                  <div className="flex items-center mr-2">
                                    {Array.from({ length: 5 }, (_, i) => (
                                      <Star
                                        key={i}
                                        className={`w-4 h-4 ${
                                          i < Math.floor(prof.overallRating / 2) 
                                            ? 'text-[#752432] fill-current' 
                                            : 'text-gray-300'
                                        }`}
                                      />
                                    ))}
                                  </div>
                                  <span className="font-medium text-gray-900">{prof.overallRating.toFixed(1)}</span>
                                  <span className="text-gray-600 ml-1">out of 10</span>
                                </div>
                                <span className="text-gray-600">•</span>
                                <span className="text-gray-600">{prof.totalReviews} reviews</span>
                              </div>
                              
                              <div className="flex flex-wrap gap-2">
                                {prof.courses.map((courseInfo) => (
                                  <Badge 
                                    key={courseInfo.name} 
                                    variant="secondary" 
                                    className="text-xs bg-[#752432] text-white hover:bg-[#752432]/90 cursor-pointer transition-colors"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedProfessor(prof.fullName);
                                      setSelectedCourse(courseInfo.name);
                                    }}
                                  >
                                    {courseInfo.name} ({courseInfo.reviewCount})
                                  </Badge>
                                ))}
                              </div>
                            </div>
                            <div className="text-[#752432] ml-4">
                              →
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}