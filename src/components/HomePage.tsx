import { useState, useEffect } from 'react';
import {
  CheckCircle2,
  Circle,
  X,
  Plus,
  Clock,
  Calendar,
  BookOpen,
  Users,
} from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { supabase } from '../lib/supabase';

interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
  course?: string;
  section: 'today' | 'thisWeek';
  dueDate?: string;
}

interface UserCourse {
  class: string;
  professor: string;
  schedule?: any;
}

interface UserProfile {
  id: string;
  full_name: string;
  classes: UserCourse[];
  class_year: string;
}

interface CourseCardProps {
  title: string;
  instructor: string;
  nextEvent?: string;
  onCourseClick?: (courseName: string) => void;
}

interface TodoItemProps {
  todo: TodoItem;
  isEditing: boolean;
  editingText: string;
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
  onStartEdit: (todo: TodoItem) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onEditTextChange: (text: string) => void;
}

function TodoItem({
  todo,
  isEditing,
  editingText,
  onToggle,
  onRemove,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onEditTextChange,
}: TodoItemProps) {
  const handleTextClick = () => {
    if (!isEditing) {
      onStartEdit(todo);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onSaveEdit();
    } else if (e.key === 'Escape') {
      onCancelEdit();
    }
  };

  return (
    <div className="flex gap-4 group px-5 py-4 hover:bg-gray-50/50 transition-all duration-200">
      <button
        onClick={() => onToggle(todo.id)}
        className="flex-shrink-0 mt-0.5"
      >
        {todo.completed ? (
          <CheckCircle2 className="w-5 h-5 text-[#752432]" />
        ) : (
          <Circle className="w-5 h-5 text-gray-400 hover:text-[#752432] transition-colors duration-200" />
        )}
      </button>

      <div className="flex-1 min-w-0">
        {isEditing ? (
          <Input
            value={editingText}
            onChange={(e) => onEditTextChange(e.target.value)}
            onKeyDown={handleKeyPress}
            onBlur={onSaveEdit}
            className="text-sm border-[#752432] focus:ring-[#752432]"
            autoFocus
          />
        ) : (
          <>
            <div className="flex items-start justify-between mb-2">
              <div
                onClick={handleTextClick}
                className={`cursor-text hover:bg-gray-100/80 px-3 py-2 rounded-lg transition-colors flex-1 mr-3 ${
                  todo.completed
                    ? 'text-gray-500 line-through'
                    : 'text-gray-800 font-medium'
                }`}
              >
                <p className="leading-relaxed line-clamp-2 break-words">
                  {todo.text}
                </p>
              </div>

              {todo.dueDate && (
                <span className="inline-flex items-center px-3 py-1 bg-[#752432]/10 text-[#752432] text-xs font-medium rounded-full flex-shrink-0">
                  {new Date(todo.dueDate)
                    .toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                    })
                    .replace(/,/g, '')}
                </span>
              )}
            </div>

            {todo.course && (
              <div className="px-3">
                <span className="inline-flex items-center px-2.5 py-1 text-gray-700 text-xs font-medium rounded-md" style={{ backgroundColor: 'var(--background-color, #f9f5f0)' }}>
                  {todo.course}
                </span>
              </div>
            )}
          </>
        )}
      </div>

      {!isEditing && (
        <button
          onClick={() => onRemove(todo.id)}
          className="opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-red-50 hover:text-red-600 rounded-lg flex-shrink-0 mt-0.5"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

interface TodoSectionProps {
  title: string;
  section: 'today' | 'thisWeek';
  todos: TodoItem[];
  editingTodoId: string | null;
  editingText: string;
  onToggleTodo: (id: string) => void;
  onRemoveTodo: (id: string) => void;
  onStartEdit: (todo: TodoItem) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onEditTextChange: (text: string) => void;
  onAddTodo: (section: 'today' | 'thisWeek') => void;
}

function TodoSection({
  title,
  section,
  todos,
  editingTodoId,
  editingText,
  onToggleTodo,
  onRemoveTodo,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onEditTextChange,
  onAddTodo,
}: TodoSectionProps) {
  return (
    <div className="rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col" style={{ backgroundColor: 'var(--background-color, #f9f5f0)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#752432]"></div>
          <h3 className="font-semibold text-gray-900">{title}</h3>
        </div>
        <Button
          onClick={() => onAddTodo(section)}
          size="sm"
          variant="ghost"
          className="text-[#752432] hover:text-white hover:bg-[#752432] h-8 px-3 rounded-lg transition-all duration-200 text-sm font-medium"
        >
          <Plus className="w-4 h-4 mr-1" />
          Add Task
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto" style={{ backgroundColor: 'var(--background-color, #f9f5f0)' }}>
        {todos.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-60 text-center px-6">
            <div className="w-12 h-12 rounded-full flex items-center justify-center mb-3" style={{ backgroundColor: 'var(--background-color, #f9f5f0)' }}>
              <span className="text-gray-400 text-xl">✓</span>
            </div>
            <p className="text-gray-500 text-sm font-medium">
              No {section === 'today' ? 'tasks for today' : 'tasks this week'}
            </p>
            <p className="text-gray-400 text-xs mt-1">
              Click "Add Task" to get started
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {todos.map((todo) => (
              <TodoItem
                key={todo.id}
                todo={todo}
                isEditing={editingTodoId === todo.id}
                editingText={editingText}
                onToggle={onToggleTodo}
                onRemove={onRemoveTodo}
                onStartEdit={onStartEdit}
                onSaveEdit={onSaveEdit}
                onCancelEdit={onCancelEdit}
                onEditTextChange={onEditTextChange}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function CourseCard({
  title,
  instructor,
  nextEvent,
  onCourseClick,
}: CourseCardProps) {
  // Get course-specific data for mini landing page
  const getCoursePreview = (courseName: string) => {
    const courseData: { [key: string]: any } = {
      'Contract Law': {
        schedule: 'M,W,F 9:00-10:00 AM',
        nextTopic: 'Statute of Frauds',
      },
      Torts: {
        schedule: 'Tu,Th 10:30-12:00 PM',
        nextTopic: 'Negligence Standards',
      },
      'Property Law': {
        schedule: 'M,W,F 11:30-12:30 PM',
        nextTopic: 'Easements & Servitudes',
      },
      'Civil Procedure': {
        schedule: 'Tu,Th 2:00-3:30 PM',
        nextTopic: 'Discovery Rules',
      },
    };

    return (
      courseData[courseName] || {
        schedule: 'TBD',
        nextTopic: 'Course Introduction',
      }
    );
  };

  const coursePreview = getCoursePreview(title);

  return (
    <Card
      className="overflow-hidden h-[160px] flex flex-col shadow-sm border border-gray-200 cursor-pointer hover:shadow-lg hover:border-gray-300 transition-all duration-200" style={{ backgroundColor: 'var(--background-color, #f9f5f0)' }}
      onClick={() => onCourseClick?.(title)}
    >
      {/* Burgundy Header with Schedule */}
      <div className="bg-[#752432] text-white px-3 py-2">
        <h3 className="text-sm font-semibold leading-none mb-1 truncate">
          {title}
        </h3>
        <div className="flex items-center justify-between">
          <p className="text-white/85 text-xs truncate">{instructor}</p>
          <span className="text-white/75 text-xs font-medium">
            {coursePreview.schedule}
          </span>
        </div>
      </div>

      {/* Compact Content Area */}
      <div className="flex-1 px-3 py-1 flex flex-col justify-between min-h-0" style={{ backgroundColor: 'var(--background-color, #f9f5f0)' }}>
        {/* Next Topic - Compact */}
        <div className="rounded px-2 py-1.5" style={{ backgroundColor: 'var(--background-color, #f9f5f0)' }}>
          <div className="text-xs font-medium text-[#752432] mb-0.5">
            Next Topic
          </div>
          <div className="text-xs text-gray-800 font-medium leading-tight truncate">
            {coursePreview.nextTopic}
          </div>
        </div>

        {/* Next Event - Compact */}
        {nextEvent && (
          <div className="flex items-center gap-1 mt-auto">
            <Clock className="w-3 h-3 text-[#752432] flex-shrink-0" />
            <span className="text-xs text-[#752432] font-medium">Next:</span>
            <span className="text-xs text-gray-700 font-medium truncate flex-1">
              {nextEvent}
            </span>
          </div>
        )}
      </div>
    </Card>
  );
}

interface HomePageProps {
  onNavigateToCourse?: (courseName: string) => void;
  user?: any;
}

export function HomePage({ onNavigateToCourse, user }: HomePageProps) {
  const [todos, setTodos] = useState<TodoItem[]>([
    {
      id: '1',
      text: 'Review Torts outlines for tomorrow',
      completed: false,
      course: 'Torts',
      section: 'today',
    },
    {
      id: '2',
      text: 'Submit Property Law assignment',
      completed: true,
      course: 'Property Law',
      section: 'today',
    },
    {
      id: '3',
      text: 'Meet with study group',
      completed: false,
      section: 'today',
    },
    {
      id: '4',
      text: 'Prepare for Civil Procedure exam',
      completed: false,
      course: 'Civil Procedure',
      section: 'thisWeek',
      dueDate: '2025-09-08',
    },
    {
      id: '5',
      text: 'Complete Constitutional Law reading',
      completed: false,
      course: 'Constitutional Law',
      section: 'thisWeek',
      dueDate: '2025-09-06',
    },
    {
      id: '6',
      text: 'Research for Law Review article',
      completed: false,
      section: 'thisWeek',
      dueDate: '2025-09-10',
    },
  ]);
  const [newTodoText, setNewTodoText] = useState('');
  const [newTodoCourse, setNewTodoCourse] = useState('');
  const [newTodoDueDate, setNewTodoDueDate] = useState('');
  const [showAddTodo, setShowAddTodo] = useState(false);
  const [addingToSection, setAddingToSection] = useState<'today' | 'thisWeek'>(
    'today'
  );
  const [editingTodoId, setEditingTodoId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [firstName, setFirstName] = useState<string>('');
  const [, setUserProfile] = useState<UserProfile | null>(null);
  const [userCourses, setUserCourses] = useState<UserCourse[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showDailyView, setShowDailyView] = useState(false);
  const [dailyCourses, setDailyCourses] = useState<UserCourse[]>([]);
  const [loading, setLoading] = useState(true);

  // Function to extract first name from full name
  const getFirstName = (fullName: string | null): string => {
    if (!fullName) return '';
    const trimmed = fullName.trim();
    if (!trimmed) return '';
    const firstSpaceIndex = trimmed.indexOf(' ');
    return firstSpaceIndex === -1
      ? trimmed
      : trimmed.substring(0, firstSpaceIndex);
  };

  // Fetch user's profile and courses
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('full_name, classes, class_year')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error fetching profile:', error);
          setLoading(false);
          return;
        }

        const first = getFirstName(profile?.full_name);
        setFirstName(first);

        if (profile) {
          setUserProfile(profile);
          setUserCourses(profile.classes || []);
        }

        setLoading(false);
      } catch (error) {
        console.error('Error fetching user profile:', error);
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [user]);

  const toggleTodo = (id: string) => {
    setTodos((prev) =>
      prev.map((todo) =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    );
  };

  const addTodo = (section?: 'today' | 'thisWeek') => {
    const targetSection = section || addingToSection;
    if (newTodoText.trim()) {
      const newTodo: TodoItem = {
        id: Date.now().toString(),
        text: newTodoText.trim(),
        completed: false,
        course: newTodoCourse || undefined,
        section: targetSection,
        dueDate:
          targetSection === 'thisWeek' && newTodoDueDate
            ? newTodoDueDate
            : undefined,
      };
      setTodos((prev) => [...prev, newTodo]);
      setNewTodoText('');
      setNewTodoCourse('');
      setNewTodoDueDate('');
      setShowAddTodo(false);
    }
  };

  const startAddingTodo = (section: 'today' | 'thisWeek') => {
    setAddingToSection(section);
    setShowAddTodo(true);
  };

  const removeTodo = (id: string) => {
    setTodos((prev) => prev.filter((todo) => todo.id !== id));
  };

  const startEditing = (todo: TodoItem) => {
    setEditingTodoId(todo.id);
    setEditingText(todo.text);
  };

  const saveEdit = () => {
    if (editingTodoId && editingText.trim()) {
      setTodos((prev) =>
        prev.map((todo) =>
          todo.id === editingTodoId
            ? { ...todo, text: editingText.trim() }
            : todo
        )
      );
    }
    setEditingTodoId(null);
    setEditingText('');
  };

  const cancelEdit = () => {
    setEditingTodoId(null);
    setEditingText('');
  };

  // Handle calendar day click
  const handleCalendarDayClick = (day: number | null) => {
    if (!day) return;

    const clickedDate = new Date(2025, 8, day); // September 2025 (month is 0-indexed)
    setSelectedDate(clickedDate);

    // Filter courses for the selected day
    const dayOfWeek = clickedDate.getDay(); // 0 = Sunday, 1 = Monday, etc.

    // For now, we'll show courses based on a simple schedule mapping
    // In a real implementation, you'd parse the schedule data from user courses
    const coursesForDay = userCourses.filter((course) => {
      // Simple mapping - in reality you'd parse the schedule field
      const courseName = course.class.toLowerCase();
      if (courseName.includes('torts') && (dayOfWeek === 1 || dayOfWeek === 3))
        return true; // Mon, Wed
      if (
        courseName.includes('contract') &&
        (dayOfWeek === 0 || dayOfWeek === 2 || dayOfWeek === 4)
      )
        return true; // Mon, Wed, Fri
      if (
        courseName.includes('property') &&
        (dayOfWeek === 0 || dayOfWeek === 2 || dayOfWeek === 4)
      )
        return true; // Mon, Wed, Fri
      if (courseName.includes('civil') && (dayOfWeek === 1 || dayOfWeek === 3))
        return true; // Tue, Thu
      return false;
    });

    setDailyCourses(coursesForDay);
    setShowDailyView(true);
  };

  // Close daily view
  const closeDailyView = () => {
    setShowDailyView(false);
    setDailyCourses([]);
  };

  const todayTodos = todos
    .filter((todo) => todo.section === 'today')
    .sort((a, b) => {
      // Sort completed items to the bottom
      if (a.completed && !b.completed) return 1;
      if (!a.completed && b.completed) return -1;
      return 0;
    });

  const thisWeekTodos = todos
    .filter((todo) => todo.section === 'thisWeek')
    .sort((a, b) => {
      // Sort completed items to the bottom first
      if (a.completed && !b.completed) return 1;
      if (!a.completed && b.completed) return -1;

      // Then sort by due date for uncompleted items, with items without due dates at the end
      if (!a.dueDate && !b.dueDate) return 0;
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    });

  // Generate course data from user's courses
  const courseData = userCourses.map((course) => ({
    title: course.class,
    instructor: course.professor,
    nextEvent: getNextEventForCourse(course.class),
  }));

  // Get available courses for todo dropdown
  const availableCourses = userCourses.map((course) => course.class);

  // Helper function to get next event for a course
  function getNextEventForCourse(courseName: string): string {
    const currentDate = new Date();
    const dayOfWeek = currentDate.getDay();

    const courseNameLower = courseName.toLowerCase();

    // Simple schedule mapping - in reality you'd parse the schedule field
    if (courseNameLower.includes('torts')) {
      if (dayOfWeek === 1 || dayOfWeek === 3) return 'Today 8:00 AM';
      return 'Tomorrow 8:00 AM';
    }
    if (courseNameLower.includes('contract')) {
      if (dayOfWeek === 0 || dayOfWeek === 2 || dayOfWeek === 4)
        return 'Today 9:00 AM';
      return 'Tomorrow 9:00 AM';
    }
    if (courseNameLower.includes('property')) {
      if (dayOfWeek === 0 || dayOfWeek === 2 || dayOfWeek === 4)
        return 'Today 11:30 AM';
      return 'Tomorrow 11:30 AM';
    }
    if (courseNameLower.includes('civil')) {
      if (dayOfWeek === 1 || dayOfWeek === 3) return 'Today 2:00 PM';
      return 'Tomorrow 2:00 PM';
    }

    return 'Schedule TBD';
  }

  const currentDate = new Date();
  const currentTime = currentDate.getHours() * 60 + currentDate.getMinutes(); // Current time in minutes since midnight

  // Generate calendar days for September 2025
  const generateCalendarDays = () => {
    const daysInMonth = 30; // September has 30 days
    const startDay = 0; // September 1, 2025 starts on Monday (0 = Sunday offset)
    const days = [];

    // Add empty cells for days before the 1st
    for (let i = 0; i < startDay; i++) {
      days.push(null);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }

    return days;
  };

  const calendarDays = generateCalendarDays();
  const weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  const getCurrentTimePosition = () => {
    // Calculate position based on 6 AM to 5 PM timeframe (11 hours = 660 minutes)
    const startOfDay = 6 * 60; // 6 AM in minutes
    const endOfDay = 17 * 60; // 5 PM in minutes
    const timeFromStart = currentTime - startOfDay;
    const totalMinutes = endOfDay - startOfDay;
    return Math.max(0, Math.min(100, (timeFromStart / totalMinutes) * 100));
  };

  if (loading) {
    return (
      <div className="h-full style={{ backgroundColor: 'var(--background-color, #f9f5f0)' }} flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-[#752432] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your courses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto" style={{ backgroundColor: 'var(--background-color, #f9f5f0)' }}>
      <div className="max-w-full mx-auto p-6">
        <div className="flex gap-6">
          {/* Left Content - Extended */}
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-medium text-gray-900 mb-6">
              Welcome{firstName ? `, ${firstName}` : ''}!
            </h1>

            {/* Interactive To-Do List */}
            <div className="mb-8">
              <h2 className="text-lg font-medium text-gray-800 mb-4">To Do</h2>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-stretch">
                {/* Today Todo List - Exact copy of This Week styling */}
                <div className="rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col" style={{ backgroundColor: 'var(--background-color, #f9f5f0)' }}>
                  {/* Header */}
                  <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 bg-white">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-[#752432]"></div>
                      <h3 className="font-semibold text-gray-900">Today</h3>
                    </div>
                    <Button
                      onClick={() => startAddingTodo('today')}
                      size="sm"
                      variant="ghost"
                      className="text-[#752432] hover:text-white hover:bg-[#752432] h-8 px-3 rounded-lg transition-all duration-200 text-sm font-medium"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add Task
                    </Button>
                  </div>

                  {/* Content */}
                  <div className="flex-1 overflow-y-auto" style={{ backgroundColor: 'var(--background-color, #f9f5f0)' }}>
                    {todayTodos.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-60 text-center px-6">
                        <div className="w-12 h-12 rounded-full flex items-center justify-center mb-3" style={{ backgroundColor: 'var(--background-color, #f9f5f0)' }}>
                          <span className="text-gray-400 text-xl">✓</span>
                        </div>
                        <p className="text-gray-500 text-sm font-medium">
                          No tasks for today
                        </p>
                        <p className="text-gray-400 text-xs mt-1">
                          Click "Add Task" to get started
                        </p>
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-100">
                        {todayTodos.map((todo) => (
                          <TodoItem
                            key={todo.id}
                            todo={todo}
                            isEditing={editingTodoId === todo.id}
                            editingText={editingText}
                            onToggle={toggleTodo}
                            onRemove={removeTodo}
                            onStartEdit={startEditing}
                            onSaveEdit={saveEdit}
                            onCancelEdit={cancelEdit}
                            onEditTextChange={setEditingText}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* This Week Todo List */}
                <TodoSection
                  title="This Week"
                  section="thisWeek"
                  todos={thisWeekTodos}
                  editingTodoId={editingTodoId}
                  editingText={editingText}
                  onToggleTodo={toggleTodo}
                  onRemoveTodo={removeTodo}
                  onStartEdit={startEditing}
                  onSaveEdit={saveEdit}
                  onCancelEdit={cancelEdit}
                  onEditTextChange={setEditingText}
                  onAddTodo={startAddingTodo}
                />
              </div>

              {showAddTodo && (
                <div className="mt-6 p-6 style={{ backgroundColor: 'var(--background-color, #f9f5f0)' }} rounded-xl border border-gray-200 shadow-lg">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-full bg-[#752432] flex items-center justify-center">
                      <Plus className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        Add New Task
                      </h3>
                      <p className="text-sm text-gray-500">
                        Adding to{' '}
                        {addingToSection === 'today' ? 'Today' : 'This Week'}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <Input
                      value={newTodoText}
                      onChange={(e) => setNewTodoText(e.target.value)}
                      placeholder="What do you need to do?"
                      onKeyPress={(e) =>
                        e.key === 'Enter' && !e.shiftKey && addTodo()
                      }
                      autoFocus
                      className="w-full border-gray-300 focus:border-[#752432] focus:ring-[#752432]"
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <Select
                        value={newTodoCourse}
                        onValueChange={setNewTodoCourse}
                      >
                        <SelectTrigger className="border-gray-300 focus:border-[#752432] focus:ring-[#752432]">
                          <SelectValue placeholder="📚 Select Course (Optional)" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableCourses.map((course) => (
                            <SelectItem key={course} value={course}>
                              📚 {course}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {addingToSection === 'thisWeek' && (
                        <Input
                          type="date"
                          value={newTodoDueDate}
                          onChange={(e) => setNewTodoDueDate(e.target.value)}
                          className="border-gray-300 focus:border-[#752432] focus:ring-[#752432]"
                          placeholder="Due Date"
                          min={new Date().toISOString().split('T')[0]}
                        />
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 mt-6">
                    <Button
                      onClick={() => addTodo()}
                      className="bg-[#752432] hover:bg-[#752432]/90 px-6"
                    >
                      Add Task
                    </Button>
                    <Button
                      onClick={() => {
                        setShowAddTodo(false);
                        setNewTodoText('');
                        setNewTodoCourse('');
                        setNewTodoDueDate('');
                      }}
                      variant="outline"
                      className="border-gray-300 hover:style={{ backgroundColor: 'var(--background-color, #f9f5f0)' }}"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Courses Section */}
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                Your Courses
              </h2>
              {courseData.length === 0 ? (
                <div className="rounded-xl border border-gray-200 shadow-sm p-8 text-center" style={{ backgroundColor: 'var(--background-color, #f9f5f0)' }}>
                  <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: 'var(--background-color, #f9f5f0)' }}>
                    <BookOpen className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No courses selected
                  </h3>
                  <p className="text-gray-500 mb-4">
                    It looks like you haven't selected your courses yet.
                    Complete your onboarding to get started.
                  </p>
                  <Button
                    onClick={() => window.location.reload()}
                    className="bg-[#752432] hover:bg-[#752432]/90 text-white"
                  >
                    Refresh Page
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                  {courseData.map((course, index) => (
                    <CourseCard
                      key={index}
                      title={course.title}
                      instructor={course.instructor}
                      nextEvent={course.nextEvent}
                      onCourseClick={onNavigateToCourse}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Sidebar - Calendar and Schedule */}
          <div className="w-80 flex-shrink-0 space-y-4">
            {/* Compact Calendar */}
            <Card className="p-3">
              <div className="text-center mb-3">
                <h3 className="text-sm font-medium text-gray-900">
                  September 2025
                </h3>
              </div>

              <div className="grid grid-cols-7 gap-0.5 mb-1">
                {weekDays.map((day, index) => (
                  <div
                    key={`weekday-${index}`}
                    className="text-center text-xs font-medium text-gray-500 py-1"
                  >
                    {day}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-0.5">
                {calendarDays.map((day, index) => (
                  <div
                    key={index}
                    className={`text-center text-xs py-1.5 cursor-pointer hover:style={{ backgroundColor: 'var(--background-color, #f9f5f0)' }} transition-colors ${
                      day === 5
                        ? 'bg-[#752432] text-white font-medium rounded-full w-6 h-6 flex items-center justify-center mx-auto'
                        : day
                        ? 'text-gray-900 rounded-full w-6 h-6 flex items-center justify-center mx-auto hover:bg-[#752432]/10'
                        : ''
                    }`}
                    onClick={() => handleCalendarDayClick(day)}
                  >
                    {day}
                  </div>
                ))}
              </div>
            </Card>

            {/* Today's Schedule - Google Calendar Style */}
            <Card className="p-0 overflow-hidden">
              {/* Header */}
              <div className="p-4 border-b border-gray-200">
                <h3 className="text-sm font-medium text-gray-900">Today</h3>
                <p className="text-xs text-gray-600">Friday, Sep 5</p>
              </div>

              {/* Schedule Content */}
              <div
                className="relative style={{ backgroundColor: 'var(--background-color, #f9f5f0)' }} overflow-hidden"
                style={{ height: '600px' }}
              >
                {/* Time column */}
                <div className="absolute left-0 top-0 w-16 h-full border-r border-gray-200">
                  {/* Time labels */}
                  {[6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17].map(
                    (hour, index) => (
                      <div
                        key={hour}
                        className="absolute text-[10px] text-gray-500 text-center w-full leading-none"
                        style={{ top: `${index * 50 + 8}px` }}
                      >
                        <span className="whitespace-nowrap">
                          {hour <= 12 ? (hour === 0 ? 12 : hour) : hour - 12}:00
                          {hour < 12 ? 'AM' : 'PM'}
                        </span>
                      </div>
                    )
                  )}
                </div>

                {/* Time grid lines */}
                <div className="absolute left-16 right-0 top-0 h-full">
                  {Array.from({ length: 12 }, (_, index) => (
                    <div
                      key={index}
                      className="absolute w-full border-b border-gray-100"
                      style={{ top: `${index * 50}px` }}
                    />
                  ))}
                </div>

                {/* Current time indicator */}
                <div
                  className="absolute left-0 right-0 z-20 flex items-center"
                  style={{ top: `${getCurrentTimePosition()}%` }}
                >
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <div className="flex-1 h-0.5 bg-red-500"></div>
                </div>

                {/* Events */}
                <div className="absolute left-16 right-0 top-0 h-full pr-2">
                  {/* Torts: 8am - 9:30am */}
                  <div
                    className="absolute bg-[#752432] text-white rounded text-xs p-2 left-1 right-1 z-10"
                    style={{
                      top: `${2 * 50}px`,
                      height: `${1.5 * 50}px`,
                    }}
                  >
                    <div className="font-medium">Torts</div>
                    <div className="text-white/90 mt-1 leading-none">
                      8:00-9:30am
                    </div>
                  </div>

                  {/* Property: 11:30am - 12:30pm */}
                  <div
                    className="absolute bg-[#752432] text-white rounded text-xs p-2 left-1 right-1 z-10"
                    style={{
                      top: `${5.5 * 50}px`,
                      height: `${1 * 50}px`,
                    }}
                  >
                    <div className="font-medium">Property</div>
                    <div className="text-white/90 mt-1 leading-none">
                      11:30am-12:30pm
                    </div>
                  </div>

                  {/* Board Meeting: 2pm - 3pm */}
                  <div
                    className="absolute bg-[#752432] text-white rounded text-xs p-2 left-1 right-1 z-10"
                    style={{
                      top: `${8 * 50}px`,
                      height: `${1 * 50}px`,
                    }}
                  >
                    <div className="font-medium">Board Meeting</div>
                    <div className="text-white/90 mt-1 leading-none">
                      2:00-3:00pm
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Daily View Sidebar - Shows when calendar day is clicked */}
          {showDailyView && (
            <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
              <Card className="w-full max-w-md style={{ backgroundColor: 'var(--background-color, #f9f5f0)' }} rounded-xl shadow-2xl">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[#752432] rounded-full flex items-center justify-center">
                        <Calendar className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {selectedDate.toLocaleDateString('en-US', {
                            weekday: 'long',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </h3>
                        <p className="text-sm text-gray-500">
                          Your courses for this day
                        </p>
                      </div>
                    </div>
                    <Button
                      onClick={closeDailyView}
                      variant="ghost"
                      size="sm"
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-5 h-5" />
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {dailyCourses.length === 0 ? (
                      <div className="text-center py-8">
                        <div className="w-16 h-16 style={{ backgroundColor: 'var(--background-color, #f9f5f0)' }} rounded-full flex items-center justify-center mx-auto mb-3">
                          <BookOpen className="w-8 h-8 text-gray-400" />
                        </div>
                        <p className="text-gray-500 font-medium">
                          No courses scheduled
                        </p>
                        <p className="text-gray-400 text-sm mt-1">
                          Enjoy your free day!
                        </p>
                      </div>
                    ) : (
                      dailyCourses.map((course, index) => (
                        <div
                          key={index}
                          className="style={{ backgroundColor: 'var(--background-color, #f9f5f0)' }} rounded-lg p-4 border border-gray-200"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-900 mb-1">
                                {course.class}
                              </h4>
                              <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                                <Users className="w-4 h-4" />
                                <span>{course.professor}</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-[#752432]">
                                <Clock className="w-4 h-4" />
                                <span>Schedule: TBD</span>
                              </div>
                            </div>
                            <Button
                              onClick={() => onNavigateToCourse?.(course.class)}
                              size="sm"
                              className="bg-[#752432] hover:bg-[#752432]/90 text-white"
                            >
                              View Course
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="mt-6 pt-4 border-t border-gray-200">
                    <Button
                      onClick={closeDailyView}
                      className="w-full style={{ backgroundColor: 'var(--background-color, #f9f5f0)' }} hover:bg-gray-200 text-gray-700"
                    >
                      Close
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
