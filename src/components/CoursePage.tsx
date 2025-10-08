import React, { useState } from 'react';
import { ArrowLeft, BookOpen, Calendar, CheckCircle2, Circle, Clock, FileText, GraduationCap, MapPin, Star, Users, Plus } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

interface CoursePageProps {
  courseName: string;
  onBack: () => void;
  onNavigateToOutlines?: (courseName: string, outlineName: string) => void;
  onNavigateToOutlinesPage?: (courseName: string) => void;
  onNavigateToStudentProfile?: (studentName: string) => void;
}

interface SyllabusSession {
  id: string;
  sessionNumber: number;
  date: string;
  topic: string;
  readings: string[];
  assignments?: string[];
  completed: boolean;
  upcoming: boolean;
}

export function CoursePage({ courseName, onBack, onNavigateToOutlines, onNavigateToOutlinesPage, onNavigateToStudentProfile }: CoursePageProps) {
  const [syllabusData, setSyllabusData] = useState<SyllabusSession[]>([
    { id: '1', sessionNumber: 1, date: '2025-08-25', topic: 'Introduction to Contract Formation', readings: ['Restatement § 17-20', 'Hawkins v. McGee'], completed: true, upcoming: false },
    { id: '2', sessionNumber: 2, date: '2025-08-27', topic: 'Offer and Acceptance', readings: ['Restatement § 24-29', 'Carlill v. Carbolic Smoke Ball'], completed: true, upcoming: false },
    { id: '3', sessionNumber: 3, date: '2025-09-01', topic: 'Consideration', readings: ['Restatement § 71-81', 'Hamer v. Sidway'], completed: true, upcoming: false },
    { id: '4', sessionNumber: 4, date: '2025-09-03', topic: 'Promissory Estoppel', readings: ['Restatement § 90', 'Ricketts v. Scothorn'], completed: true, upcoming: false },
    { id: '5', sessionNumber: 5, date: '2025-09-08', topic: 'Statute of Frauds', readings: ['Restatement § 110-150', 'Crabtree v. Elizabeth Arden'], assignments: ['Problem Set 1 Due'], completed: false, upcoming: true },
    { id: '6', sessionNumber: 6, date: '2025-09-10', topic: 'Parol Evidence Rule', readings: ['Restatement § 213-217', 'Pacific Gas & Electric v. Thomas Drayage'], completed: false, upcoming: false },
    { id: '7', sessionNumber: 7, date: '2025-09-15', topic: 'Interpretation of Contracts', readings: ['Restatement § 200-203', 'Frigaliment Importing Co. v. B.N.S. Int\'l Sales'], completed: false, upcoming: false },
    { id: '8', sessionNumber: 8, date: '2025-09-17', topic: 'Conditions and Performance', readings: ['Restatement § 224-230', 'Kingston v. Preston'], completed: false, upcoming: false },
    { id: '9', sessionNumber: 9, date: '2025-09-22', topic: 'Breach and Excuse', readings: ['Restatement § 235-254', 'Jacob & Youngs v. Kent'], completed: false, upcoming: false },
    { id: '10', sessionNumber: 10, date: '2025-09-24', topic: 'Damages', readings: ['Restatement § 344-356', 'Hadley v. Baxendale'], assignments: ['Midterm Exam'], completed: false, upcoming: false },
  ]);

  const toggleSessionComplete = (sessionId: string) => {
    setSyllabusData(prev => prev.map(session => 
      session.id === sessionId 
        ? { ...session, completed: !session.completed }
        : session
    ));
  };

  // Mock course data based on courseName
  const getCourseData = (name: string) => {
    const courseMap: { [key: string]: any } = {
      'Contract Law': {
        instructor: 'Prof. Chen',
        semester: 'Fall 2025',
        schedule: 'M,W,F 9:00-10:00 AM',
        location: 'Austin Hall 101',
        description: 'This course provides a comprehensive introduction to the law of contracts, covering formation, interpretation, performance, breach, and remedies. Students will develop skills in legal analysis through case study and problem-solving exercises.',
        students: [
          { name: 'Justin Abbey', email: 'jabbey@law.edu', year: '2L', profileImage: '/profiles/justin.jpg' },
          { name: 'Sarah Martinez', email: 'smartinez@law.edu', year: '2L', profileImage: '/profiles/sarah.jpg' },
          { name: 'Mike Chen', email: 'mchen@law.edu', year: '2L', profileImage: '/profiles/mike.jpg' },
          { name: 'Emma Wilson', email: 'ewilson@law.edu', year: '2L', profileImage: '/profiles/emma.jpg' },
          { name: 'Alex Johnson', email: 'ajohnson@law.edu', year: '2L', profileImage: '/profiles/alex.jpg' },
          { name: 'Lisa Park', email: 'lpark@law.edu', year: '2L', profileImage: '/profiles/lisa.jpg' },
          { name: 'David Kim', email: 'dkim@law.edu', year: '2L', profileImage: '/profiles/david.jpg' },
          { name: 'Rachel Brown', email: 'rbrown@law.edu', year: '2L', profileImage: '/profiles/rachel.jpg' },
          { name: 'Tom Anderson', email: 'tanderson@law.edu', year: '2L', profileImage: '/profiles/tom.jpg' },
          { name: 'Kelly White', email: 'kwhite@law.edu', year: '2L', profileImage: '/profiles/kelly.jpg' },
          { name: 'James Wilson', email: 'jwilson@law.edu', year: '2L', profileImage: '/profiles/james.jpg' },
          { name: 'Ashley Davis', email: 'adavis@law.edu', year: '2L', profileImage: '/profiles/ashley.jpg' }
        ],
        upcomingEvents: [
          { date: '2025-09-08', event: 'Problem Set 1 Due', type: 'assignment' },
          { date: '2025-09-24', event: 'Midterm Exam', type: 'exam' }
        ]
      },
      'Torts': {
        instructor: 'Prof. Johnson',
        semester: 'Fall 2025', 
        schedule: 'Tu,Th 10:30-12:00 PM',
        location: 'Langdell Library North',
        description: 'An examination of civil liability for personal injury and property damage, including intentional torts, negligence, strict liability, and defenses. Emphasis on case analysis and policy considerations.',
        students: [
          { name: 'Justin Abbey', email: 'jabbey@law.edu', year: '2L', profileImage: '/profiles/justin.jpg' },
          { name: 'Sarah Martinez', email: 'smartinez@law.edu', year: '2L', profileImage: '/profiles/sarah.jpg' },
          { name: 'Mike Chen', email: 'mchen@law.edu', year: '2L', profileImage: '/profiles/mike.jpg' },
          { name: 'Emma Wilson', email: 'ewilson@law.edu', year: '2L', profileImage: '/profiles/emma.jpg' },
          { name: 'Alex Johnson', email: 'ajohnson@law.edu', year: '2L', profileImage: '/profiles/alex.jpg' },
          { name: 'Lisa Park', email: 'lpark@law.edu', year: '2L', profileImage: '/profiles/lisa.jpg' },
          { name: 'David Kim', email: 'dkim@law.edu', year: '2L', profileImage: '/profiles/david.jpg' },
          { name: 'Rachel Brown', email: 'rbrown@law.edu', year: '2L', profileImage: '/profiles/rachel.jpg' },
          { name: 'Tom Anderson', email: 'tanderson@law.edu', year: '2L', profileImage: '/profiles/tom.jpg' },
          { name: 'Nina Rodriguez', email: 'nrodriguez@law.edu', year: '2L', profileImage: '/profiles/nina.jpg' },
          { name: 'Marcus Thompson', email: 'mthompson@law.edu', year: '2L', profileImage: '/profiles/marcus.jpg' },
          { name: 'Sophia Lee', email: 'slee@law.edu', year: '2L', profileImage: '/profiles/sophia.jpg' }
        ],
        upcomingEvents: [
          { date: '2025-09-07', event: 'Class Discussion', type: 'class' },
          { date: '2025-10-15', event: 'Final Exam', type: 'exam' }
        ]
      },
      'Property Law': {
        instructor: 'Prof. Chen',
        semester: 'Fall 2025',
        schedule: 'M,W,F 11:30-12:30 PM',
        location: 'Austin Hall 200',
        description: 'Study of property rights including acquisition, transfer, and use of real and personal property. Covers estates, landlord-tenant law, easements, and land use regulations.',
        students: [
          { name: 'Justin Abbey', email: 'jabbey@law.edu', year: '2L', profileImage: '/profiles/justin.jpg' },
          { name: 'Emma Wilson', email: 'ewilson@law.edu', year: '2L', profileImage: '/profiles/emma.jpg' },
          { name: 'David Kim', email: 'dkim@law.edu', year: '2L', profileImage: '/profiles/david.jpg' },
          { name: 'Rachel Brown', email: 'rbrown@law.edu', year: '2L', profileImage: '/profiles/rachel.jpg' },
          { name: 'Kelly White', email: 'kwhite@law.edu', year: '2L', profileImage: '/profiles/kelly.jpg' },
          { name: 'James Wilson', email: 'jwilson@law.edu', year: '2L', profileImage: '/profiles/james.jpg' },
          { name: 'Ashley Davis', email: 'adavis@law.edu', year: '2L', profileImage: '/profiles/ashley.jpg' },
          { name: 'Chris Garcia', email: 'cgarcia@law.edu', year: '2L', profileImage: '/profiles/chris.jpg' },
          { name: 'Megan Taylor', email: 'mtaylor@law.edu', year: '2L', profileImage: '/profiles/megan.jpg' },
          { name: 'Ryan Mitchell', email: 'rmitchell@law.edu', year: '2L', profileImage: '/profiles/ryan.jpg' }
        ],
        upcomingEvents: [
          { date: '2025-09-06', event: 'Property Transfer Assignment Due', type: 'assignment' },
          { date: '2025-11-20', event: 'Final Exam', type: 'exam' }
        ]
      },
      'Civil Procedure': {
        instructor: 'Prof. Martinez',
        semester: 'Fall 2025',
        schedule: 'Tu,Th 2:00-3:30 PM',
        location: 'Hauser Hall 104',
        description: 'Introduction to the procedural rules governing civil litigation in federal courts, including jurisdiction, pleading, discovery, trial, and appeals.',
        students: [
          { name: 'Justin Abbey', email: 'jabbey@law.edu', year: '2L', profileImage: '/profiles/justin.jpg' },
          { name: 'Sarah Martinez', email: 'smartinez@law.edu', year: '2L', profileImage: '/profiles/sarah.jpg' },
          { name: 'Alex Johnson', email: 'ajohnson@law.edu', year: '2L', profileImage: '/profiles/alex.jpg' },
          { name: 'Lisa Park', email: 'lpark@law.edu', year: '2L', profileImage: '/profiles/lisa.jpg' },
          { name: 'Tom Anderson', email: 'tanderson@law.edu', year: '2L', profileImage: '/profiles/tom.jpg' },
          { name: 'Nina Rodriguez', email: 'nrodriguez@law.edu', year: '2L', profileImage: '/profiles/nina.jpg' },
          { name: 'Marcus Thompson', email: 'mthompson@law.edu', year: '2L', profileImage: '/profiles/marcus.jpg' },
          { name: 'Sophia Lee', email: 'slee@law.edu', year: '2L', profileImage: '/profiles/sophia.jpg' },
          { name: 'Jordan Martinez', email: 'jmartinez@law.edu', year: '2L', profileImage: '/profiles/jordan.jpg' },
          { name: 'Rebecca Chang', email: 'rchang@law.edu', year: '2L', profileImage: '/profiles/rebecca.jpg' }
        ],
        upcomingEvents: [
          { date: '2025-09-05', event: 'Civil Procedure Quiz', type: 'exam' },
          { date: '2025-12-10', event: 'Final Exam', type: 'exam' }
        ]
      }
    };

    return courseMap[name] || {
      instructor: 'Prof. Smith',
      semester: 'Fall 2025',
      schedule: 'TBD',
      location: 'TBD',
      description: `This course provides comprehensive coverage of ${name} principles and applications.`,
      students: [
        { name: 'Justin Abbey', email: 'jabbey@law.edu', year: '2L', profileImage: '/profiles/justin.jpg' }
      ],
      upcomingEvents: []
    };
  };

  const courseData = getCourseData(courseName);
  const completedSessions = syllabusData.filter(s => s.completed).length;
  const totalSessions = syllabusData.length;

  return (
    <div className="h-full style={{ backgroundColor: 'var(--background-color, #f9f5f0)' }} overflow-auto">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={onBack}
            className="mb-4 text-gray-600 hover:text-gray-800"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
          
          <div className="bg-gradient-to-r from-[#752432] to-[#8B2E42] text-white rounded-lg p-8 mb-6">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2">{courseName}</h1>
                <p className="text-white/90 text-lg mb-4">{courseData.instructor} • {courseData.semester}</p>
                <div className="flex items-center gap-6 text-sm text-white/80">
                  <div className="flex items-center gap-1">
                    <GraduationCap className="w-4 h-4" />
                    {courseData.credits} 4 Credits
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {courseData.schedule}
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {courseData.location}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="style={{ backgroundColor: 'var(--background-color, #f9f5f0)' }}/20 rounded-lg p-4 backdrop-blur-sm">
                  <div className="text-2xl font-bold">{courseData.students.length}</div>
                  <div className="text-white/80 text-sm">Students</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="syllabus">Living Syllabus</TabsTrigger>
            <TabsTrigger value="resources">Resources</TabsTrigger>
            <TabsTrigger value="assignments">Assignments</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Course Description */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-[#752432]" />
                    Course Description
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 leading-relaxed">{courseData.description}</p>
                </CardContent>
              </Card>

              {/* Students */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-[#752432]" />
                    Students ({courseData.students.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {courseData.students.map((student: any, index: number) => (
                      <div 
                        key={index} 
                        className="flex items-center gap-3 p-2 rounded-lg hover:style={{ backgroundColor: 'var(--background-color, #f9f5f0)' }} cursor-pointer transition-colors"
                        onClick={() => onNavigateToStudentProfile?.(student.name)}
                      >
                        <div className="w-8 h-8 bg-[#752432] text-white rounded-full flex items-center justify-center text-sm font-medium">
                          {student.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-gray-900 hover:text-[#752432] transition-colors">
                            {student.name}
                          </div>
                          <div className="text-sm text-gray-600">{student.year}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Upcoming Events */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-[#752432]" />
                  Upcoming Events
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {courseData.upcomingEvents.map((event: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 style={{ backgroundColor: 'var(--background-color, #f9f5f0)' }} rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${
                          event.type === 'exam' ? 'bg-red-500' : 
                          event.type === 'assignment' ? 'bg-orange-500' : 'bg-blue-500'
                        }`} />
                        <div>
                          <div className="font-medium">{event.event}</div>
                          <div className="text-sm text-gray-600">
                            {new Date(event.date).toLocaleDateString('en-US', { 
                              weekday: 'long', 
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric' 
                            })}
                          </div>
                        </div>
                      </div>
                      <Badge variant={event.type === 'exam' ? 'destructive' : 'secondary'}>
                        {event.type}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="syllabus" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-[#752432]" />
                    Interactive Syllabus
                  </span>
                  <div className="text-sm text-gray-600">
                    {completedSessions} of {totalSessions} sessions completed
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {syllabusData.map((session) => (
                    <div key={session.id} className={`border rounded-lg p-4 transition-all ${
                      session.upcoming ? 'border-[#752432] bg-[#752432]/5' : 
                      session.completed ? 'border-green-200 bg-green-50' : 'border-gray-200'
                    }`}>
                      <div className="flex items-start gap-4">
                        <button
                          onClick={() => toggleSessionComplete(session.id)}
                          className="flex-shrink-0 mt-1"
                        >
                          {session.completed ? (
                            <CheckCircle2 className="w-5 h-5 text-green-600" />
                          ) : (
                            <Circle className="w-5 h-5 text-gray-400 hover:text-[#752432] transition-colors" />
                          )}
                        </button>
                        
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h3 className={`font-medium ${
                                session.completed ? 'text-green-800 line-through' : 
                                session.upcoming ? 'text-[#752432]' : 'text-gray-900'
                              }`}>
                                Session {session.sessionNumber}: {session.topic}
                              </h3>
                              <p className="text-sm text-gray-600">
                                {new Date(session.date).toLocaleDateString('en-US', { 
                                  weekday: 'long', 
                                  month: 'long', 
                                  day: 'numeric' 
                                })}
                              </p>
                            </div>
                            {session.upcoming && (
                              <Badge className="bg-[#752432] text-white">Next Class</Badge>
                            )}
                          </div>
                          
                          <div className="space-y-2">
                            <div>
                              <h4 className="text-sm font-medium text-gray-700 mb-1">Required Readings:</h4>
                              <ul className="text-sm text-gray-600 space-y-1">
                                {session.readings.map((reading, index) => (
                                  <li key={index} className="flex items-center gap-2">
                                    <div className="w-1 h-1 bg-gray-400 rounded-full" />
                                    {reading}
                                  </li>
                                ))}
                              </ul>
                            </div>
                            
                            {session.assignments && (
                              <div>
                                <h4 className="text-sm font-medium text-gray-700 mb-1">Assignments:</h4>
                                <ul className="text-sm text-orange-600 space-y-1">
                                  {session.assignments.map((assignment, index) => (
                                    <li key={index} className="flex items-center gap-2">
                                      <div className="w-1 h-1 bg-orange-500 rounded-full" />
                                      {assignment}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="resources" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Outlines */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-[#752432]" />
                    Student Outlines
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">Browse outlines shared by your classmates</p>
                    <Button 
                      variant="outline" 
                      onClick={() => onNavigateToOutlinesPage?.(courseName)}
                    >
                      View All Outlines
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Study Resources */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-[#752432]" />
                    Study Resources
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="p-3 style={{ backgroundColor: 'var(--background-color, #f9f5f0)' }} rounded-lg">
                      <div className="font-medium">Study Group</div>
                      <div className="text-sm text-gray-600">Join or create study groups</div>
                    </div>
                    <div className="p-3 style={{ backgroundColor: 'var(--background-color, #f9f5f0)' }} rounded-lg">
                      <div className="font-medium">Practice Exams</div>
                      <div className="text-sm text-gray-600">Previous years' exams and answers</div>
                    </div>
                    <div className="p-3 style={{ backgroundColor: 'var(--background-color, #f9f5f0)' }} rounded-lg">
                      <div className="font-medium">Case Briefs</div>
                      <div className="text-sm text-gray-600">Student-contributed case summaries</div>
                    </div>
                    <div className="p-3 style={{ backgroundColor: 'var(--background-color, #f9f5f0)' }} rounded-lg">
                      <div className="font-medium">Discussion Forum</div>
                      <div className="text-sm text-gray-600">Ask questions and share insights</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="assignments" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-[#752432]" />
                  Assignments & Deadlines
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="border border-orange-200 bg-orange-50 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-medium text-orange-800">Problem Set 1</h3>
                        <p className="text-sm text-orange-700 mt-1">Contract formation scenarios</p>
                        <p className="text-sm text-orange-600 mt-2">Due: September 8, 2025</p>
                      </div>
                      <Badge className="bg-orange-500 text-white">Upcoming</Badge>
                    </div>
                  </div>
                  
                  <div className="border border-red-200 bg-red-50 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-medium text-red-800">Midterm Exam</h3>
                        <p className="text-sm text-red-700 mt-1">Covers sessions 1-10</p>
                        <p className="text-sm text-red-600 mt-2">Date: September 24, 2025</p>
                      </div>
                      <Badge variant="destructive">Exam</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}