import { useState, useEffect } from 'react';
import * as React from 'react';
import { Star, Search, Calendar, ThumbsUp, ThumbsDown, BookOpen, MessageCircle, FileText, Award, Plus, X } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { supabase } from '../lib/supabase';
import { ReviewForm } from './ReviewForm';

// Database review interface
interface Review {
  id: string;
  user_id: string;
  professor_name: string;
  course_name: string;
  semester: string;
  year: string;
  grade: 'DS' | 'H' | 'P';
  
  // Ratings (1-10 scale)
  overall_rating: number;
  readings_rating: number;
  cold_calls_rating: number;
  exam_rating: number;
  
  
  // Review text
  overall_review: string;
  readings_review?: string;
  cold_calls_review?: string;
  exam_review?: string;
  
  // Course details
  laptops_allowed?: boolean;
  assessment_type?: 'Project' | 'Final Exam' | 'Both';
  has_cold_calls?: boolean;
  
  // Engagement
  helpful_count: number;
  not_helpful_count: number;
  
  // Metadata
  anonymous: boolean;
  created_at: string;
  updated_at: string;
}

// Database interfaces
interface Professor {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

interface Course {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

interface ProfessorCourse {
  professor_id: string;
  course_id: string;
  created_at: string;
}

interface ProfessorStats {
  professor_name: string;
  course_name: string;
  avg_overall_rating: number;
  avg_readings_rating: number;
  avg_cold_calls_rating: number;
  avg_exam_rating: number;
  total_reviews: number;
  total_helpful: number;
  total_not_helpful: number;
  some_laptops_allowed: boolean;
  some_has_cold_calls: boolean;
}

// Processed professor data for display
interface ProcessedProfessor {
  firstName: string;
  lastName: string;
  fullName: string;
  courses: Array<{
    name: string;
    reviewCount: number;
    avgRating?: number;
  }>;
  overallRating: number;
  totalReviews: number;
}

// Review form data
interface ReviewFormData {
  professor_name: string;
  course_name: string;
  semester: 'Fall' | 'Winter' | 'Spring' | 'Summer';
  year: string;
  grade: 'DS' | 'H' | 'P';
  overall_rating: number;
  readings_rating: number;
  cold_calls_rating: number;
  exam_rating: number;
  overall_review: string;
  readings_review: string;
  cold_calls_review: string;
  exam_review: string;
  laptops_allowed: boolean;
  assessment_type: 'Project' | 'Final Exam' | 'Both';
  has_cold_calls: boolean;
}

export function ReviewsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProfessor, setSelectedProfessor] = useState<string | null>(null);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [reviewSortBy, setReviewSortBy] = useState('Most Recent');

  // Real data state
  const [reviews, setReviews] = useState<Review[]>([]);
  const [professors, setProfessors] = useState<Professor[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [professorCourses, setProfessorCourses] = useState<ProfessorCourse[]>([]);
  const [professorStats, setProfessorStats] = useState<ProfessorStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // User votes state
  const [userVotes, setUserVotes] = useState<Record<string, 'helpful' | 'not_helpful' | null>>({});
  
  // Review form state
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [formData, setFormData] = useState<ReviewFormData>({
    professor_name: '',
    course_name: '',
    semester: '',
    year: '',
    grade: 'H',
    overall_rating: 5,
    readings_rating: 5,
    cold_calls_rating: 5,
    exam_rating: 5,
    overall_review: '',
    readings_review: '',
    cold_calls_review: '',
    exam_review: '',
    laptops_allowed: true,
    assessment_type: 'Final Exam',
    has_cold_calls: true
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  // Fetch user votes
  const fetchUserVotes = async (reviewIds: string[]) => {
    try {
      const { data, error } = await supabase.rpc('get_user_votes', {
        p_review_ids: reviewIds
      });
      
      if (error) throw error;
      
      const votes: Record<string, 'helpful' | 'not_helpful' | null> = {};
      reviewIds.forEach(id => votes[id] = null);
      
      if (data) {
        data.forEach((vote: any) => {
          votes[vote.review_id] = vote.engagement_type;
        });
      }
      
      setUserVotes(votes);
    } catch (err) {
      console.error('Error fetching user votes:', err);
    }
  };

  // Fetch data from database
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch all data in parallel
        const [reviewsResult, professorsResult, coursesResult, professorCoursesResult, statsResult] = await Promise.all([
          supabase.from('reviews').select('*').order('created_at', { ascending: false }),
          supabase.from('professors').select('*').order('name'),
          supabase.from('courses').select('*').order('name'),
          supabase.from('professor_courses').select('*'),
          supabase.from('professor_stats').select('*')
        ]);

        if (reviewsResult.error) throw reviewsResult.error;
        if (professorsResult.error) throw professorsResult.error;
        if (coursesResult.error) throw coursesResult.error;
        if (professorCoursesResult.error) throw professorCoursesResult.error;
        if (statsResult.error) throw statsResult.error;

        const reviewsData = reviewsResult.data || [];
        setReviews(reviewsData);
        setProfessors(professorsResult.data || []);
        setCourses(coursesResult.data || []);
        setProfessorCourses(professorCoursesResult.data || []);
        setProfessorStats(statsResult.data || []);
        
        // Fetch user votes for all reviews
        if (reviewsData.length > 0) {
          await fetchUserVotes(reviewsData.map(r => r.id));
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Get courses for selected professor
  const getCoursesForProfessor = (professorName: string) => {
    return courses.filter(course => {
      // Check if this professor teaches this course
      return professors.some(prof => 
        prof.name === professorName && 
        // This would need to be enhanced with the professor_courses relationship
        // For now, we'll show all courses and let the user select
        true
      );
    });
  };

  // Submit review form
  const handleSubmitReview = async () => {
    try {
      setFormLoading(true);
      setFormError(null);
      setFormSuccess(null);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('You must be logged in to submit a review');
      }

      // Submit review
      const { data, error } = await supabase
        .from('reviews')
        .insert([{
          user_id: user.id,
          ...formData
        }])
        .select();

      if (error) throw error;

      // Refresh all data to show the new review
      const [reviewsResult, professorsResult, coursesResult, professorCoursesResult, statsResult] = await Promise.all([
        supabase.from('reviews').select('*').order('created_at', { ascending: false }),
        supabase.from('professors').select('*').order('name'),
        supabase.from('courses').select('*').order('name'),
        supabase.from('professor_courses').select('*'),
        supabase.from('professor_stats').select('*')
      ]);

      if (reviewsResult.data) setReviews(reviewsResult.data);
      if (professorsResult.data) setProfessors(professorsResult.data);
      if (coursesResult.data) setCourses(coursesResult.data);
      if (professorCoursesResult.data) setProfessorCourses(professorCoursesResult.data);
      if (statsResult.data) setProfessorStats(statsResult.data);

      // Reset form and close modal
      setFormData({
        professor_name: '',
        course_name: '',
        semester: '',
        year: '',
        grade: 'H',
        overall_rating: 5,
        readings_rating: 5,
        cold_calls_rating: 5,
        exam_rating: 5,
        overall_review: '',
        readings_review: '',
        cold_calls_review: '',
        exam_review: '',
        laptops_allowed: true,
        assessment_type: 'Final Exam',
        has_cold_calls: true
      });
      setShowReviewForm(false);
      
      // Show success message
      console.log('Review submitted successfully!');

    } catch (err) {
      console.error('Error submitting review:', err);
      setFormError(err instanceof Error ? err.message : 'Failed to submit review');
    } finally {
      setFormLoading(false);
    }
  };

  // Vote on review (helpful/not helpful)
  const handleVote = async (reviewId: string, voteType: 'helpful' | 'not_helpful') => {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('You must be logged in to vote on reviews');
      }

      // Determine the action based on current vote
      const currentVote = userVotes[reviewId];
      let actionType = voteType;
      
      // If user clicks the same button they already voted for, unvote
      if (currentVote === voteType) {
        actionType = 'unvote';
      }

      // Call the voting function
      const { data, error } = await supabase.rpc('vote_on_review', {
        p_review_id: reviewId,
        p_engagement_type: actionType
      });

      if (error) throw error;

      // Update the review counts and user vote state
      if (data) {
        setReviews(prevReviews => 
          prevReviews.map(review => 
            review.id === reviewId 
              ? { 
                  ...review, 
                  helpful_count: data.helpful_count, 
                  not_helpful_count: data.not_helpful_count 
                }
              : review
          )
        );
        
        // Update user vote state
        setUserVotes(prev => ({
          ...prev,
          [reviewId]: data.user_vote
        }));
      }

    } catch (err) {
      console.error('Error voting on review:', err);
      // You could add a toast notification here
    }
  };

  // Calculate comprehensive professor data from database
  const professorData = React.useMemo(() => {
    const professorMap = new Map<string, ProcessedProfessor>();
    
    // Initialize professors from database
    professors.forEach(prof => {
      const [firstName, lastName] = prof.name.includes(' ') 
        ? prof.name.split(' ') 
        : ['', prof.name];
      
      professorMap.set(prof.name, {
          firstName: firstName || '',
        lastName: lastName || prof.name,
        fullName: prof.name,
        courses: [],
        overallRating: 0,
        totalReviews: 0
      });
    });
    
    // Add all courses that each professor teaches (from professor_courses relationship)
    professors.forEach(prof => {
      const profData = professorMap.get(prof.name);
      if (profData) {
        // Find all courses this professor teaches using professor_courses relationship
        const professorCourseIds = professorCourses
          .filter(pc => pc.professor_id === prof.id)
          .map(pc => pc.course_id);
        
        const professorCoursesList = courses.filter(course => 
          professorCourseIds.includes(course.id)
        );
        
        // Add courses to professor data
        professorCoursesList.forEach(course => {
          profData.courses.push({
            name: course.name,
            reviewCount: 0 // Will be updated below
          });
        });
      }
    });
    
    // Aggregate data from reviews
    reviews.forEach(review => {
      if (professorMap.has(review.professor_name)) {
        const prof = professorMap.get(review.professor_name)!;
      prof.totalReviews++;
        prof.overallRating += review.overall_rating;
        
        // Update course review count
        const existingCourse = prof.courses.find(c => c.name === review.course_name);
        if (existingCourse) {
          existingCourse.reviewCount++;
        }
      }
    });
    
    // Calculate averages and sort
    const result = Array.from(professorMap.values()).map(prof => ({
      ...prof,
      overallRating: prof.totalReviews > 0 ? prof.overallRating / prof.totalReviews : 0,
      courses: prof.courses.sort((a, b) => a.name.localeCompare(b.name))
    })).sort((a, b) => a.lastName.localeCompare(b.lastName));
    
    return result;
  }, [professors, courses, professorCourses, reviews]);

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
    const filteredReviews = reviews.filter(review => 
      review.professor_name === professorName && review.course_name === courseName
    );
    
    return filteredReviews.sort((a, b) => {
      switch (sortBy) {
        case 'Highest':
          return b.overall_rating - a.overall_rating;
        case 'Lowest':
          return a.overall_rating - b.overall_rating;
        case 'Most Recent':
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });
  };

  const renderRatingBox = (rating: number, label: string, icon: React.ReactNode, reviewText: string, lowLabel?: string, highLabel?: string, isOverall?: boolean) => {
    return (
      <div className={`p-4 rounded-lg border ${isOverall ? 'border-l-4 border-[#752432]' : 'border-gray-200'} shadow-sm`} style={{ backgroundColor: 'var(--background-color, #f9f5f0)' }}>
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
        return 'text-gray-800 border-gray-200';
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

  // Rating component
  const RatingInput = ({ 
    label, 
    value, 
    onChange, 
    icon 
  }: { 
    label: string; 
    value: number; 
    onChange: (value: number) => void; 
    icon: React.ReactNode;
  }) => (
    <div className="space-y-1 p-2 bg-gray-50 rounded">
      <Label className="flex items-center gap-1 text-xs font-medium">
        {icon}
        {label}
      </Label>
      <div className="flex items-center gap-1">
        <span className="text-xs text-gray-500 w-2">1</span>
        <div className="flex gap-0.5 flex-1">
          {Array.from({ length: 10 }, (_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => onChange(i + 1)}
              className={`w-3 h-3 rounded-sm border transition-colors ${
                i < value 
                  ? 'bg-[#752432] border-[#752432]' 
                  : 'bg-white border-gray-300 hover:border-[#752432]'
              }`}
            />
          ))}
        </div>
        <span className="text-xs text-gray-500 w-2">10</span>
        <span className="text-xs font-semibold ml-1 min-w-[1.5rem]">{value}/10</span>
      </div>
    </div>
  );


  // Show loading state
  if (loading) {
    return (
      <div className="h-full overflow-auto flex items-center justify-center" style={{ backgroundColor: 'var(--background-color, #f9f5f0)' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#752432] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading reviews...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="h-full overflow-auto flex items-center justify-center" style={{ backgroundColor: 'var(--background-color, #f9f5f0)' }}>
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Reviews</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto" style={{ backgroundColor: 'var(--background-color, #f9f5f0)' }}>
      <div className="max-w-full mx-auto p-6">
        <div className="h-full flex flex-col">
        {/* Header */}
        <div className="border-b border-gray-200 pb-6" style={{ backgroundColor: 'var(--background-color, #f9f5f0)' }}>
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
              <Star className="w-8 h-8 mr-3" style={{ color: '#752432' }} />
              <h1 className="text-2xl font-medium text-gray-800">Course Reviews</h1>
              </div>
              <Dialog open={showReviewForm} onOpenChange={setShowReviewForm}>
                <DialogTrigger asChild>
                  <Button className="bg-[#752432] hover:bg-[#752432]/90">
                    <Plus className="w-4 h-4 mr-2" />
                    Write Review
                  </Button>
                </DialogTrigger>
              </Dialog>
            </div>
            <p className="text-gray-600 mb-6">
              Browse professor reviews organized by overall rating and course-specific feedback.
            </p>
            
            {/* Search and A-Z Navigation */}
            <div className="flex flex-col lg:flex-row items-start gap-4 lg:gap-6">
              <div className="w-full lg:max-w-md lg:flex-1">
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
                <div className="w-full lg:w-auto">
                  <div className="flex flex-col lg:flex-row items-start lg:items-center gap-2 lg:gap-4">
                    <span className="text-sm text-gray-600 whitespace-nowrap">Jump to:</span>
                    <div className="flex flex-wrap items-center gap-1 lg:gap-2 max-w-full overflow-hidden">
                      {Array.from({ length: 26 }, (_, i) => {
                        const letter = String.fromCharCode(65 + i);
                        const hasProfs = availableLetters.includes(letter);
                        return (
                          <button
                            key={letter}
                            onClick={() => hasProfs && scrollToLetter(letter)}
                            disabled={!hasProfs}
                            className={`px-1.5 lg:px-2 py-1 text-xs lg:text-sm font-medium transition-colors flex-shrink-0 ${
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
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto pt-6">
          <div className="min-w-0">
            {filteredProfessors.length === 0 ? (
              <div className="text-center py-12">
                <Star className="w-16 h-16 text-gray-400 mb-4" />
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
                          <Star className="w-12 h-12 text-gray-400 mb-4" />
                          <h4 className="font-medium text-gray-700 mb-2">No Reviews Yet</h4>
                          <p className="text-gray-600 mb-4">
                            No reviews available for {prof.firstName} {prof.lastName}'s {selectedCourse} course.
                          </p>
                          <Button 
                            onClick={() => {
                              setFormData(prev => ({
                                ...prev,
                                professor_name: prof.fullName,
                                course_name: selectedCourse
                              }));
                              setShowReviewForm(true);
                            }}
                            className="bg-[#752432] hover:bg-[#752432]/90"
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Add the First Review
                          </Button>
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
                                  {review.laptops_allowed !== undefined && (
                                    <span>Laptops: {review.laptops_allowed ? 'Allowed' : 'Not Allowed'}</span>
                                  )}
                                  {review.assessment_type && (
                                    <span>Assessment: {getAssessmentType(review.assessment_type)}</span>
                                  )}
                                  {review.has_cold_calls !== undefined && (
                                    <span>Cold Calls: {review.has_cold_calls ? 'Yes' : 'No'}</span>
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
                                {review.readings_review && renderRatingBox(
                                  review.readings_rating, 
                                  'Readings', 
                                  <BookOpen className="w-4 h-4 text-gray-600" />,
                                  review.readings_review,
                                  'Light',
                                  'Heavy'
                                )}
                                {review.has_cold_calls && review.cold_calls_review && renderRatingBox(
                                  review.cold_calls_rating, 
                                  'Cold Calls', 
                                  <MessageCircle className="w-4 h-4 text-gray-600" />,
                                  review.cold_calls_review,
                                  'Easy',
                                  'Hard'
                                )}
                                {review.exam_review && renderRatingBox(
                                  review.exam_rating, 
                                  'Exam', 
                                  <FileText className="w-4 h-4 text-gray-600" />,
                                  review.exam_review,
                                  'Easy',
                                  'Hard'
                                )}
                              </div>
                              
                              {/* Second row - Overall (more prominent) */}
                              <div>
                                {renderRatingBox(
                                  review.overall_rating, 
                                  'Overall', 
                                  <Award className="w-4 h-4 text-[#752432]" />,
                                  review.overall_review,
                                  undefined,
                                  undefined,
                                  true
                                )}
                              </div>
                            </div>

                            {/* Helpful/Unhelpful */}
                            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                              <div className="flex items-center space-x-4">
                                <button 
                                  onClick={() => handleVote(review.id, 'helpful')}
                                  className={`flex items-center space-x-1 text-sm transition-colors ${
                                    userVotes[review.id] === 'helpful'
                                      ? 'text-green-600 bg-green-50 px-2 py-1 rounded'
                                      : 'text-gray-600 hover:text-green-600'
                                  }`}
                                >
                                  <ThumbsUp className={`w-4 h-4 ${userVotes[review.id] === 'helpful' ? 'fill-current' : ''}`} />
                                  <span>Helpful ({review.helpful_count})</span>
                                </button>
                                <button 
                                  onClick={() => handleVote(review.id, 'not_helpful')}
                                  className={`flex items-center space-x-1 text-sm transition-colors ${
                                    userVotes[review.id] === 'not_helpful'
                                      ? 'text-red-600 bg-red-50 px-2 py-1 rounded'
                                      : 'text-gray-600 hover:text-red-600'
                                  }`}
                                >
                                  <ThumbsDown className={`w-4 h-4 ${userVotes[review.id] === 'not_helpful' ? 'fill-current' : ''}`} />
                                  <span>Not Helpful ({review.not_helpful_count})</span>
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
                                  {courseInfo.reviewCount === 0 
                                    ? 'No reviews yet' 
                                    : `${courseInfo.reviewCount} review${courseInfo.reviewCount !== 1 ? 's' : ''}`
                                  }
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
                                    {courseInfo.name} ({courseInfo.reviewCount === 0 ? 'No reviews' : courseInfo.reviewCount})
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
      
      {/* Review Form Modal */}
      <ReviewForm
        showReviewForm={showReviewForm}
        setShowReviewForm={setShowReviewForm}
        formError={formError}
        formLoading={formLoading}
        formData={formData}
        setFormData={setFormData}
        professors={professors}
        courses={courses}
        professorCourses={professorCourses}
        handleSubmitReview={handleSubmitReview}
      />
    </div>
    </div>
  );
}