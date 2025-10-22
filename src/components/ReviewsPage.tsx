import { useState, useEffect } from 'react';
import * as React from 'react';
import { Star, Search, Calendar, Plus, Megaphone, FileText, Laptop } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent } from './ui/card';
import { Dialog, DialogTrigger } from './ui/dialog';
import { supabase } from '../lib/supabase';
import { ReviewForm } from './ReviewForm';

interface Review {
  id: string;
  user_id: string;
  professor_name: string;
  course_name: string;
  semester: string;
  year: string;
  grade: 'DS' | 'H' | 'P';
  
  overall_rating: number;
  readings_rating: number;
  cold_calls_rating: number;
  exam_rating: number;
  
  overall_review: string;
  readings_review?: string;
  cold_calls_review?: string;
  exam_review?: string;
  
  laptops_allowed?: boolean;
  assessment_type?: 'Project' | 'Final Exam' | 'Both';
  has_cold_calls?: boolean;
  
  helpful_count: number;
  not_helpful_count: number;
  
  anonymous: boolean;
  created_at: string;
  updated_at: string;
}

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
  anonymous: boolean;
}

export function ReviewsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProfessor, setSelectedProfessor] = useState<string | null>(null);
  const [selectedCourse, setSelectedCourse] = useState('');
  const reviewSortBy = 'Most Recent';

  // Real data state
  const [reviews, setReviews] = useState<Review[]>([]);
  const [professors, setProfessors] = useState<Professor[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [professorCourses, setProfessorCourses] = useState<ProfessorCourse[]>([]);
  // const [professorStats, setProfessorStats] = useState<ProfessorStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // User votes state disabled
  
  // Review form state
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [formData, setFormData] = useState<ReviewFormData>({
    professor_name: '',
    course_name: '',
    semester: 'Fall',
    year: '',
    grade: 'P',
    overall_rating: 0,
    readings_rating: 0,
    cold_calls_rating: 0,
    exam_rating: 0,
    overall_review: '',
    readings_review: '',
    cold_calls_review: '',
    exam_review: '',
    laptops_allowed: false,
    assessment_type: 'Final Exam',
    has_cold_calls: false,
    anonymous: false
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  // const [formSuccess, setFormSuccess] = useState<string | null>(null);

  // Voting system disabled - no longer fetching user votes
  // const fetchUserVotes = async (reviewIds: string[]) => {
  //   try {
  //     const { data, error } = await supabase.rpc('get_user_votes', {
  //       p_review_ids: reviewIds
  //     });
  //     
  //     if (error) throw error;
  //     
  //     const votes: Record<string, 'helpful' | 'not_helpful' | null> = {};
  //     reviewIds.forEach(id => votes[id] = null);
  //     
  //     if (data) {
  //       data.forEach((vote: any) => {
  //         votes[vote.review_id] = vote.engagement_type;
  //       });
  //     }
  //     
  //     setUserVotes(votes);
  //   } catch (err) {
  //     console.error('Error fetching user votes:', err);
  //   }
  // };

  // Fetch data from database
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch all data in parallel
        const [reviewsResult, professorsResult, coursesResult, professorCoursesResult] = await Promise.all([
          supabase.from('reviews').select('*').order('created_at', { ascending: false }),
          supabase.from('professors').select('*').order('name'),
          supabase.from('courses').select('*').order('name'),
          supabase.from('professor_courses').select('*')
        ]);

        if (reviewsResult.error) throw reviewsResult.error;
        if (professorsResult.error) throw professorsResult.error;
        if (coursesResult.error) throw coursesResult.error;
        if (professorCoursesResult.error) throw professorCoursesResult.error;

        const reviewsData = reviewsResult.data || [];
        setReviews(reviewsData);
        setProfessors(professorsResult.data || []);
        setCourses(coursesResult.data || []);
        setProfessorCourses(professorCoursesResult.data || []);
        // setProfessorStats(statsResult.data || []);
        
        // Voting system disabled - no longer fetching user votes
        // if (reviewsData.length > 0) {
        //   await fetchUserVotes(reviewsData.map((r: Review) => r.id));
        // }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Get courses for selected professor using professor_courses relationship (not used in current UI)

  // Submit review form
  const handleSubmitReview = async () => {
    try {
      setFormLoading(true);
      setFormError(null);
      // setFormSuccess(null);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('You must be logged in to submit a review');
      }

      // Submit review - only include fields supported by the new UI
      const insertPayload: any = {
        user_id: user.id,
        professor_name: formData.professor_name,
        course_name: formData.course_name,
        year: formData.year,
        overall_rating: formData.overall_rating, // Store 0.0-5.0 scale directly
        overall_review: formData.overall_review,
        laptops_allowed: formData.laptops_allowed,
        assessment_type: formData.assessment_type,
        has_cold_calls: formData.has_cold_calls
        // Removed null fields that might be causing constraint violations
      };

      // Debug: Log the payload being sent
      console.log('Review payload being sent:', insertPayload);

      const { error } = await supabase
        .from('reviews')
        .insert([insertPayload])
        .select();

      if (error) throw error;

      // Refresh all data to show the new review
      const [reviewsResult, professorsResult, coursesResult, professorCoursesResult] = await Promise.all([
        supabase.from('reviews').select('*').order('created_at', { ascending: false }),
        supabase.from('professors').select('*').order('name'),
        supabase.from('courses').select('*').order('name'),
        supabase.from('professor_courses').select('*')
      ]);

      if (reviewsResult.data) setReviews(reviewsResult.data);
      if (professorsResult.data) setProfessors(professorsResult.data);
      if (coursesResult.data) setCourses(coursesResult.data);
      if (professorCoursesResult.data) setProfessorCourses(professorCoursesResult.data);

      // Reset form and close modal
      setFormData({
        professor_name: '',
        course_name: '',
        semester: 'Fall',
        year: '',
        grade: 'P',
        overall_rating: 0,
        readings_rating: 0,
        cold_calls_rating: 0,
        exam_rating: 0,
        overall_review: '',
        readings_review: '',
        cold_calls_review: '',
        exam_review: '',
        laptops_allowed: false,
        assessment_type: 'Final Exam',
        has_cold_calls: false,
        anonymous: false
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

  // Voting system disabled
  // const handleVote = async (reviewId: string, voteType: 'helpful' | 'not_helpful') => {
  //   try {
  //     // Get current user
  //     const { data: { user } } = await supabase.auth.getUser();
  //     if (!user) {
  //       throw new Error('You must be logged in to vote on reviews');
  //     }

  //     // Determine the action based on current vote
  //     const currentVote = userVotes[reviewId];
  //     let actionType: 'helpful' | 'not_helpful' | 'unvote' = voteType;
  //     
  //     // If user clicks the same button they already voted for, unvote
  //     if (currentVote === voteType) {
  //       actionType = 'unvote';
  //     }

  //     // Call the voting function
  //     const { data, error } = await supabase.rpc('vote_on_review', {
  //       p_review_id: reviewId,
  //       p_engagement_type: actionType
  //     });

  //     if (error) throw error;

  //     // Update the review counts and user vote state
  //     if (data) {
  //       setReviews(prevReviews => 
  //         prevReviews.map(review => 
  //           review.id === reviewId 
  //             ? { 
  //                 ...review, 
  //                 helpful_count: data.helpful_count, 
  //                 not_helpful_count: data.not_helpful_count 
  //               }
  //             : review
  //         )
  //       );
        
  //       // Update user vote state
  //       setUserVotes(prev => ({
  //         ...prev,
  //         [reviewId]: data.user_vote
  //       }));
  //     }

  //   } catch (err) {
  //     console.error('Error voting on review:', err);
  //     // You could add a toast notification here
  //   }
  // };

  // Calculate comprehensive professor data from database
  const professorData = React.useMemo(() => {
    const professorMap = new Map<string, ProcessedProfessor>();
    
    // Initialize professors from database
    professors.forEach(prof => {
      const [firstName, lastName] = prof.name.includes(',') 
        ? prof.name.split(',').map(part => part.trim())
        : [prof.name, ''];
      
      professorMap.set(prof.name, {
          firstName: firstName || '',
        lastName: lastName || '',
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

  // Consistent accent color based on professor's last name initial
  const getProfessorAccentColor = (professorName: string) => {
    const colorPattern = ['#00962c', '#ffb100', '#0277c5', '#f71417'];
    const parts = professorName.trim().split(' ');
    const last = parts[parts.length - 1] || professorName;
    const code = last.toUpperCase().charCodeAt(0);
    const letterIndex = (code - 65 + 26) % 26;
    return colorPattern[letterIndex % 4];
  };

  // Selected header background color using same accent logic
  const getSelectedHeaderColor = () => {
    if (!selectedProfessor) return '#752531';
    return getProfessorAccentColor(selectedProfessor);
  };

  // Map a 0-10 overall rating to a 0-5 star scale (preserving decimals)
  const mapTenScaleToFive = (tenScale: number) => Math.max(0, Math.min(10, tenScale)) / 2;

  // Group reviews by year (desc)
  const groupReviewsByYear = (courseReviews: Review[]) => {
    const groups = new Map<string, Review[]>();
    courseReviews.forEach(r => {
      const year = r.year || 'Unknown';
      if (!groups.has(year)) groups.set(year, []);
      groups.get(year)!.push(r);
    });
    return Array.from(groups.entries())
      .sort((a, b) => Number(b[0]) - Number(a[0]))
      .map(([year, yearReviews]) => ({ year, reviews: yearReviews }));
  };

  // Icons for details row
  const getColdCallIcon = (_hasColdCalls?: boolean) => (
    <Megaphone className="w-4 h-4 text-gray-500" />
  );
  const getFinalIcon = (_assessment?: string) => (
    <FileText className="w-4 h-4 text-gray-500" />
  );
  const getElectronicsIcon = (_allowed?: boolean) => (
    <Laptop className="w-4 h-4 text-gray-500" />
  );

  // renderRatingBox removed (unused)

  // Grade color mapping no longer used in the UI

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

  // RatingInput removed (unused)


  // Show loading state
  if (loading) {
    return (
      <div className="h-full overflow-auto flex items-center justify-center" style={{ 
        backgroundColor: 'var(--background-color, #f9f5f0)',
        scrollbarWidth: 'thin',
        scrollbarColor: '#752531 transparent'
      }}>
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
      <div className="h-full overflow-auto flex items-center justify-center" style={{ 
        backgroundColor: 'var(--background-color, #f9f5f0)',
        scrollbarWidth: 'thin',
        scrollbarColor: '#752531 transparent'
      }}>
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
    <div className="h-full overflow-auto" style={{ 
      backgroundColor: 'var(--background-color, #f9f5f0)',
      scrollbarWidth: 'thin',
      scrollbarColor: '#752531 transparent'
    }}>
      {/* Header - Full Width */}
      <div className="border-b border-gray-200 pt-6 pb-6 px-6" style={{ backgroundColor: selectedProfessor && selectedCourse ? getSelectedHeaderColor() : '#752531' }}>
        <div className="max-w-full mx-auto">
          {selectedProfessor && selectedCourse ? (
            <div className="flex items-start w-full">
              <div className="flex-1">
                <div className="flex items-center gap-4 mb-3">
                  <h1 className="text-3xl font-semibold text-white">
                    Professor {selectedProfessor}
                  </h1>
                  <div className="inline-flex px-2 py-1 bg-white/20 backdrop-blur-sm rounded-full border border-white/30">
                    <span className="text-white text-sm font-medium">{selectedCourse}</span>
                  </div>
                </div>
                {(() => {
                  const prof = professorData.find(p => p.fullName === selectedProfessor);
                  if (!prof) return null;
                  const courseReviews = getReviewsForProfessorCourse(prof.fullName, selectedCourse, reviewSortBy);
                  const fiveStarAvg = courseReviews.length > 0
                    ? (courseReviews.reduce((sum, r) => sum + mapTenScaleToFive(r.overall_rating), 0) / courseReviews.length)
                    : 0;
                  const tenScaleAvg = courseReviews.length > 0
                    ? (courseReviews.reduce((s, r) => s + r.overall_rating, 0) / courseReviews.length)
                    : 0;
                  return courseReviews.length > 0 ? (
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        {Array.from({ length: 5 }, (_, i) => (
                          <Star
                            key={i}
                            className={`w-5 h-5 ${i < fiveStarAvg ? 'fill-current text-white' : 'text-white/40'}`}
                          />
                        ))}
                      </div>
                      <span className="text-white font-medium text-lg">
                        {(tenScaleAvg / 2).toFixed(1)}
                      </span>
                      <div className="flex items-center gap-1 text-white/80">
                        <span className="text-sm">
                          {courseReviews.length} review{courseReviews.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                  ) : null;
                })()}
              </div>
              <div className="ml-6">
                <Dialog open={showReviewForm} onOpenChange={setShowReviewForm}>
                  <DialogTrigger asChild>
                    <Button 
                      onClick={() => {
                        // Pre-fill professor and course when opening from course reviews page
                        setFormData(prev => ({
                          ...prev,
                          professor_name: selectedProfessor || '',
                          course_name: selectedCourse || ''
                        }));
                      }}
                      className="bg-white text-[#752432] hover:bg-white/90 hover:shadow-lg hover:scale-105 transition-all duration-200 ease-in-out rounded-xl font-medium shadow-md"
                      style={{
                        transform: 'scale(1)',
                        transition: 'all 0.2s ease-in-out'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'scale(1.05)';
                        e.currentTarget.style.backgroundColor = '#f3f4f6';
                        e.currentTarget.style.boxShadow = '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'scale(1)';
                        e.currentTarget.style.backgroundColor = 'white';
                        e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
                      }}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Write Review
                    </Button>
                  </DialogTrigger>
                </Dialog>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <h1 className="text-2xl font-medium text-white">Professor Reviews</h1>
                </div>
                <Dialog open={showReviewForm} onOpenChange={setShowReviewForm}>
                  <DialogTrigger asChild>
                    <Button 
                      className="bg-[#752432] hover:shadow-lg hover:scale-105 transition-all duration-200 ease-in-out rounded-xl font-medium shadow-md"
                      style={{
                        transform: 'scale(1)',
                        transition: 'all 0.2s ease-in-out',
                        color: 'white'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'scale(1.05)';
                        e.currentTarget.style.backgroundColor = 'white';
                        e.currentTarget.style.color = 'black';
                        e.currentTarget.style.boxShadow = '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'scale(1)';
                        e.currentTarget.style.backgroundColor = '#752432';
                        e.currentTarget.style.color = 'white';
                        e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
                      }}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Write Review
                    </Button>
                  </DialogTrigger>
                </Dialog>
              </div>
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
                      <span className="text-sm text-white whitespace-nowrap">Jump to:</span>
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
                                  ? 'text-white hover:text-gray-200 cursor-pointer'
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
            </>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-full mx-auto p-6">
        <div className="h-full flex flex-col">

        <div className="flex-1 overflow-y-auto pt-6" style={{ 
          scrollbarWidth: 'thin',
          scrollbarColor: '#752531 transparent'
        }}>
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
              /* New selected-course view: header + grouped reviews */
              <div className="space-y-6">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSelectedProfessor(null);
                    setSelectedCourse('');
                  }}
                  className="mb-4 -mt-4"
                >
                  ← Back to All Professors
                </Button>
                {(() => {
                  const prof = professorData.find(p => p.fullName === selectedProfessor);
                  if (!prof) return null;
                  const courseReviews = getReviewsForProfessorCourse(prof.fullName, selectedCourse, reviewSortBy);
                  const getCourseColor = () => getProfessorAccentColor(selectedProfessor!);
                  // Grouped reviews by year
                  return (
                    <div className="space-y-6">
                      {/* Grouped reviews by year */}
                      {courseReviews.length === 0 ? (
                        <div className="flex flex-col items-center justify-center min-h-[40vh] px-4">
                          <div className="relative mb-8">
                            <div 
                              className="w-32 h-32 rounded-full flex items-center justify-center"
                                  style={{ 
                                background: `linear-gradient(to bottom right, ${getCourseColor()}10, ${getCourseColor()}20)`
                              }}
                            >
                              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#F8F4ED] to-[#F5F1E8] flex items-center justify-center shadow-lg">
                                <Calendar 
                                  className="w-12 h-12"
                                  style={{ color: `${getCourseColor()}60` }}
                                />
                              </div>
                            </div>
                          </div>
                          <div className="text-center max-w-md">
                            <h3 className="text-xl font-semibold text-gray-800 mb-3">No Reviews Yet!</h3>
                            <p className="text-gray-600 leading-relaxed">No reviews available for this course.</p>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-8">
                          {groupReviewsByYear(courseReviews).map(({ year, reviews }) => (
                            <div key={year}>
                              <div className="flex items-center gap-4 mb-6">
                                <div 
                                  className="w-12 h-12 rounded-full flex items-center justify-center"
                                  style={{ backgroundColor: getCourseColor() }}
                                >
                                  <span className="text-white font-semibold">{year}</span>
                                </div>
                                <div className="flex-1 h-px bg-gray-200"></div>
                                <span className="text-sm text-gray-500 font-medium">
                                  {reviews.length} review{reviews.length !== 1 ? 's' : ''}
                                </span>
                              </div>
                              <div className="space-y-4 ml-4">
                                {reviews.map(review => {
                                  const five = mapTenScaleToFive(review.overall_rating);
                                  return (
                                    <Card 
                                      key={review.id}
                                      className="transition-all duration-200 hover:shadow-md border-l-4"
                                      style={{ backgroundColor: '#FEFBF6', borderLeftColor: getCourseColor() }}
                                    >
                                      <CardContent className="p-6">
                                        <div className="flex items-center justify-between mb-4">
                                          <div className="flex items-center gap-3">
                                            <div className="flex items-center gap-1">
                                              {Array.from({ length: 5 }, (_, i) => (
                                                <Star
                                                  key={i}
                                                  className={`w-4 h-4 ${i < five ? 'fill-current' : 'text-gray-300'}`}
                                                  style={{ color: i < five ? getCourseColor() : undefined }}
                                                />
                                              ))}
                                            </div>
                                            <span className="text-sm font-medium text-gray-600">
                                              {five.toFixed(1)}/5
                                            </span>
                                          </div>
                                          {/* Grade removed from card display */}
                                        </div>
                                        <div className="flex items-center gap-6 mb-4 text-sm text-gray-600 border-b border-gray-200 pb-3">
                                          <div className="flex items-center gap-2">
                                            {getColdCallIcon(review.has_cold_calls)}
                                            <span>Cold Calls: <span className="font-medium">{review.has_cold_calls ? 'Yes' : 'No'}</span></span>
                                          </div>
                                          <div className="flex items-center gap-2">
                                            {getFinalIcon(review.assessment_type)}
                                            <span>Final: <span className="font-medium">{getAssessmentType(review.assessment_type || '')}</span></span>
                                          </div>
                                          <div className="flex items-center gap-2">
                                            {getElectronicsIcon(review.laptops_allowed)}
                                            <span>Electronics: <span className="font-medium">{review.laptops_allowed ? 'Allowed' : 'Prohibited'}</span></span>
                                          </div>
                                        </div>
                                        <p className="text-gray-700 leading-relaxed text-base">
                                          {review.overall_review}
                                        </p>
                                      </CardContent>
                                    </Card>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
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
                                  {(() => {
                                    // Color stars to match this professor's card color
                                    const colorPattern = ['#00962c', '#ffb100', '#0277c5', '#f71417'];
                                    const letterIndex = (prof.lastName.charCodeAt(0) - 65 + 26) % 26;
                                    const currentColor = colorPattern[letterIndex % 4];
                                    return Array.from({ length: 5 }, (_, i) => (
                                      <Star
                                        key={i}
                                        className={`w-5 h-5 ${
                                          i < Math.floor(prof.overallRating / 2) 
                                            ? 'fill-current' 
                                            : 'text-gray-300'
                                        }`}
                                        style={{ color: i < Math.floor(prof.overallRating / 2) ? currentColor : undefined }}
                                      />
                                    ));
                                  })()}
                                </div>
                                <span className="font-medium text-gray-600">{(prof.overallRating / 2).toFixed(1)}/5</span>
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
                {availableLetters.map((letter) => {
                  // Color pattern: A=#00962c, B=#ffb100, C=#0277c5, D=#f71417, repeat
                  const colorPattern = ['#00962c', '#ffb100', '#0277c5', '#f71417'];
                  const letterIndex = letter.charCodeAt(0) - 65; // A=0, B=1, C=2, D=3, etc.
                  
                  return (
                    <div key={letter} id={`letter-${letter}`}>
                      {/* Letter Divider */}
                      <div className="flex items-center mb-4">
                        <div 
                          className="w-12 h-12 rounded-full flex items-center justify-center mr-4"
                          style={{ backgroundColor: colorPattern[letterIndex % 4] }}
                        >
                          <span className="text-white text-lg font-medium">{letter}</span>
                        </div>
                        <div className="flex-1 h-px bg-gray-300"></div>
                      </div>
                    
                    {/* Professors in this letter group */}
                    <div className="grid gap-4">
                      {groupedProfessors[letter].map((prof) => {
                        // Color pattern: A=#00962c, B=#ffb100, C=#0277c5, D=#f71417, repeat
                        const colorPattern = ['#00962c', '#ffb100', '#0277c5', '#f71417'];
                        const letterIndex = letter.charCodeAt(0) - 65; // A=0, B=1, C=2, D=3, etc.
                        const currentColor = colorPattern[letterIndex % 4];
                        return (
                          <Card 
                            key={prof.fullName}
                            className="transition-all duration-200 hover:shadow-lg border-l-4"
                            style={{ 
                              backgroundColor: '#FEFBF6',
                              borderLeftColor: currentColor
                            }}
                          >
                            <CardContent className="p-6">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <h3 className="text-xl font-semibold text-gray-900 mb-4">
                                    {prof.firstName} {prof.lastName}
                                  </h3>
                                  
                                  {/* Rating and review count */}
                                  <div className="flex items-center space-x-4 mb-4">
                                    <div className="flex items-center">
                                    <div className="flex items-center mr-2">
                                      {Array.from({ length: 5 }, (_, i) => (
                                        <Star
                                          key={i}
                                          className={`w-4 h-4 ${
                                            i < Math.floor(prof.overallRating / 2) 
                                              ? 'fill-current' 
                                              : 'text-gray-300'
                                          }`}
                                          style={{ color: i < Math.floor(prof.overallRating / 2) ? currentColor : undefined }}
                                        />
                                      ))}
                                      </div>
                                    <span className="font-medium text-gray-600">{(prof.overallRating / 2).toFixed(1)}/5</span>
                                    </div>
                                    <span className="text-gray-600">•</span>
                                    <span className="text-gray-600">{prof.totalReviews} reviews</span>
                                  </div>
                                  
                                  {/* Courses - more prominent and clickable */}
                                  <div className="space-y-2">
                                    <h4 className="text-sm font-medium text-gray-600 mb-3">Click a course to view reviews:</h4>
                                    <div className="flex flex-wrap gap-3">
                                      {prof.courses.map((courseInfo) => {
                                        return (
                                          <button
                                            key={courseInfo.name}
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setSelectedProfessor(prof.fullName);
                                              setSelectedCourse(courseInfo.name);
                                            }}
                                            className="px-4 py-3 text-white font-medium rounded-lg transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-offset-2"
                                            style={{ 
                                              backgroundColor: currentColor
                                            } as React.CSSProperties}
                                            onMouseEnter={(e) => {
                                              e.currentTarget.style.backgroundColor = currentColor + 'DD';
                                            }}
                                            onMouseLeave={(e) => {
                                              e.currentTarget.style.backgroundColor = currentColor;
                                            }}
                                          >
                                            {courseInfo.name}
                                          </button>
                                        );
                                      })}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                    </div>
                  );
                })}
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