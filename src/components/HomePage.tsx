import { useState, useEffect } from 'react';
import {
  CheckCircle2,
  Circle,
  X,
  Plus,
  BookOpen,
  GraduationCap,
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
  course?: any;
  onCourseClick?: (courseName: string) => void;
}

// Display-only formatter: hide trailing section number (1-7) for 1L required course names.
const formatDisplayCourseName = (rawName: string): string => {
  if (!rawName) return rawName;
  const requiredPatterns = [
    'Civil Procedure',
    'Contracts',
    'Criminal Law',
    'Torts',
    'Constitutional Law',
    'Property',
    'Legislation and Regulation'
  ];
  const pattern = new RegExp(`^(?:${requiredPatterns.join('|')})\\s([1-7])$`);
  if (pattern.test(rawName)) {
    return rawName.replace(/\s[1-7]$/, '');
  }
  return rawName;
};

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
          <div className="flex flex-col items-center justify-center text-center px-6" style={{ height: '210px' }}>
            <div className="w-12 h-12 rounded-full flex items-center justify-center mb-3" style={{ backgroundColor: 'var(--background-color, #f9f5f0)' }}>
              <span className="text-gray-400 text-xl">✓</span>
            </div>
            <p className="text-gray-500 text-sm font-medium">
              {section === 'today' ? 'Ready to tackle today?' : 'Let\'s plan your week!'}
            </p>
            <p className="text-gray-400 text-xs mt-1">
              Add your first task and start crushing your goals! 🚀
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
  course,
  onCourseClick,
}: CourseCardProps) {
  // Get real course data from the course object
  const getCoursePreview = () => {
    if (!course?.schedule) {
      return {
        schedule: 'TBD',
        location: 'TBD'
      };
    }

    const schedule = course.schedule;
    const days = schedule.days || 'TBD';
    const times = schedule.times || 'TBD';
    const location = schedule.location || 'TBD';
    
    // Format the schedule display
    let scheduleDisplay = 'TBD';
    if (days !== 'TBD' && times !== 'TBD') {
      scheduleDisplay = `${days} ${times}`;
    } else if (days !== 'TBD') {
      scheduleDisplay = days;
    } else if (times !== 'TBD') {
      scheduleDisplay = times;
    }

    return {
      schedule: scheduleDisplay,
      location: location
    };
  };

  const coursePreview = getCoursePreview();

  return (
    <Card
      className="overflow-hidden shadow-sm border border-gray-200 cursor-pointer hover:shadow-lg hover:border-gray-300 transition-all duration-200" 
      style={{ 
        backgroundColor: 'var(--background-color, #f9f5f0)',
        height: '120px',
        width: '100%'
      }}
      onClick={() => onCourseClick?.(title)}
    >
      {/* Burgundy Header with Schedule */}
      <div 
        className="bg-[#752432] text-white relative"
        style={{
          height: '120px',
          padding: '8px 8px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}
      >
        <div>
          <h3 className="text-xs font-semibold leading-none mb-0.5 truncate">
            {formatDisplayCourseName(title)}
          </h3>
          <div className="flex items-center justify-between">
            <span className="text-white/75 text-[10px] font-medium">
              {coursePreview.schedule}
            </span>
          </div>
        </div>
        <div>
          {coursePreview.location && coursePreview.location !== 'TBD' && (
            <div className="mt-0.5">
              <span className="text-white/70 text-[10px]">
                📍 {coursePreview.location}
              </span>
            </div>
          )}
          <div className="mt-0.5">
            <p className="text-white/85 text-[10px] truncate">{instructor}</p>
          </div>
        </div>
      </div>

    </Card>
  );
}

interface HomePageProps {
  onNavigateToCourse?: (courseName: string) => void;
  user?: any;
}

export function HomePage({ onNavigateToCourse, user }: HomePageProps) {
  const [todayTodos, setTodayTodos] = useState<TodoItem[]>([]);
  const [thisWeekTodos, setThisWeekTodos] = useState<TodoItem[]>([]);
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
  const [loading, setLoading] = useState(true);
  const [semesterProgressVisible, setSemesterProgressVisible] = useState(false);
  const [isMonthSwitching, setIsMonthSwitching] = useState(false);
  
  // Calendar state
  const today = new Date();
  const currentYear = selectedDate.getFullYear();
  const currentMonth = selectedDate.getMonth();
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  
  // Semester progress calculation using dynamic semester logic
  const semesterProgress = (() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth() + 1; // getMonth() is 0-indexed
    const day = today.getDate();
    
    // Determine current semester and its dates
    let semesterStart, semesterEnd, semesterName;
    
    // Fall: September 2 - November 25
    if ((month === 9 && day >= 2) || month === 10 || (month === 11 && day <= 25)) {
      semesterStart = new Date(year, 8, 2); // September 2
      semesterEnd = new Date(year, 10, 25); // November 25
      semesterName = `${year}FA`;
    }
    // Winter: January 5 - January 21
    else if (month === 1 && day >= 5 && day <= 21) {
      semesterStart = new Date(year, 0, 5); // January 5
      semesterEnd = new Date(year, 0, 21); // January 21
      semesterName = `${year}WI`;
    }
    // Spring: January 26 - April 24
    else if ((month === 1 && day >= 26) || month === 2 || month === 3 || (month === 4 && day <= 24)) {
      semesterStart = new Date(year, 0, 26); // January 26
      semesterEnd = new Date(year, 3, 24); // April 24
      semesterName = `${year}SP`;
    }
    // Default to current year Fall if outside semester periods
    else {
      semesterStart = new Date(year, 8, 2); // September 2
      semesterEnd = new Date(year, 10, 25); // November 25
      semesterName = `${year}FA`;
    }
    
    // Normalize dates to midnight for accurate day counting
    const startDate = new Date(semesterStart.getFullYear(), semesterStart.getMonth(), semesterStart.getDate());
    const endDate = new Date(semesterEnd.getFullYear(), semesterEnd.getMonth(), semesterEnd.getDate());
    const currentDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    
    const totalDays = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const daysPassed = Math.max(0, Math.round((currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1);
    const percentage = Math.min(100, Math.max(0, Math.round((daysPassed / totalDays) * 100)));
    
    // Calculate school days remaining (more accurate calculation)
    
    // Count actual school days (Monday-Friday) remaining
    let schoolDaysRemaining = 0;
    const checkDate = new Date(today);
    checkDate.setDate(checkDate.getDate() + 1); // Start from tomorrow
    
    while (checkDate <= semesterEnd) {
      const dayOfWeek = checkDate.getDay();
      // Count Monday (1) through Friday (5) as school days
      if (dayOfWeek >= 1 && dayOfWeek <= 5) {
        schoolDaysRemaining++;
      }
      checkDate.setDate(checkDate.getDate() + 1);
    }
    
    

    return {
      percentage,
      schoolDaysRemaining,
      semesterName
    };
  })();

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
          .select('full_name, classes, class_year, todo_day, todo_week')
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
          setTodayTodos(profile.todo_day || []);
          setThisWeekTodos(profile.todo_week || []);
        }

        setLoading(false);
      } catch (error) {
        console.error('Error fetching user profile:', error);
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [user]);

  // Save todos to database
  const saveTodosToDatabase = async (todayTodos: TodoItem[], thisWeekTodos: TodoItem[]) => {
    if (!user?.id) return;
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          todo_day: todayTodos,
          todo_week: thisWeekTodos
        })
        .eq('id', user.id);
      
      if (error) {
        console.error('Error saving todos:', error);
      }
    } catch (error) {
      console.error('Error saving todos:', error);
    }
  };

  const toggleTodo = (id: string) => {
    // Check if todo is in today's list
    const todayTodoIndex = todayTodos.findIndex(todo => todo.id === id);
    if (todayTodoIndex !== -1) {
      const updatedTodayTodos = todayTodos.map((todo) =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      );
      setTodayTodos(updatedTodayTodos);
      saveTodosToDatabase(updatedTodayTodos, thisWeekTodos);
      return;
    }

    // Check if todo is in this week's list
    const thisWeekTodoIndex = thisWeekTodos.findIndex(todo => todo.id === id);
    if (thisWeekTodoIndex !== -1) {
      const updatedThisWeekTodos = thisWeekTodos.map((todo) =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      );
      setThisWeekTodos(updatedThisWeekTodos);
      saveTodosToDatabase(todayTodos, updatedThisWeekTodos);
    }
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
      if (targetSection === 'today') {
        const updatedTodayTodos = [...todayTodos, newTodo];
        setTodayTodos(updatedTodayTodos);
        saveTodosToDatabase(updatedTodayTodos, thisWeekTodos);
      } else {
        const updatedThisWeekTodos = [...thisWeekTodos, newTodo];
        setThisWeekTodos(updatedThisWeekTodos);
        saveTodosToDatabase(todayTodos, updatedThisWeekTodos);
      }
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
    // Check if todo is in today's list
    const todayTodoIndex = todayTodos.findIndex(todo => todo.id === id);
    if (todayTodoIndex !== -1) {
      const updatedTodayTodos = todayTodos.filter((todo) => todo.id !== id);
      setTodayTodos(updatedTodayTodos);
      saveTodosToDatabase(updatedTodayTodos, thisWeekTodos);
      return;
    }

    // Check if todo is in this week's list
    const thisWeekTodoIndex = thisWeekTodos.findIndex(todo => todo.id === id);
    if (thisWeekTodoIndex !== -1) {
      const updatedThisWeekTodos = thisWeekTodos.filter((todo) => todo.id !== id);
      setThisWeekTodos(updatedThisWeekTodos);
      saveTodosToDatabase(todayTodos, updatedThisWeekTodos);
    }
  };

  const startEditing = (todo: TodoItem) => {
    setEditingTodoId(todo.id);
    setEditingText(todo.text);
  };

  const saveEdit = () => {
    if (editingTodoId && editingText.trim()) {
      // Check if todo is in today's list
      const todayTodoIndex = todayTodos.findIndex(todo => todo.id === editingTodoId);
      if (todayTodoIndex !== -1) {
        const updatedTodayTodos = todayTodos.map((todo) =>
          todo.id === editingTodoId
            ? { ...todo, text: editingText.trim() }
            : todo
        );
        setTodayTodos(updatedTodayTodos);
        saveTodosToDatabase(updatedTodayTodos, thisWeekTodos);
      } else {
        // Check if todo is in this week's list
        const thisWeekTodoIndex = thisWeekTodos.findIndex(todo => todo.id === editingTodoId);
        if (thisWeekTodoIndex !== -1) {
          const updatedThisWeekTodos = thisWeekTodos.map((todo) =>
            todo.id === editingTodoId
              ? { ...todo, text: editingText.trim() }
              : todo
          );
          setThisWeekTodos(updatedThisWeekTodos);
          saveTodosToDatabase(todayTodos, updatedThisWeekTodos);
        }
      }
    }
    setEditingTodoId(null);
    setEditingText('');
  };

  const cancelEdit = () => {
    setEditingTodoId(null);
    setEditingText('');
  };



  const sortedTodayTodos = todayTodos.sort((a, b) => {
    // Sort completed items to the bottom
    if (a.completed && !b.completed) return 1;
    if (!a.completed && b.completed) return -1;
    return 0;
  });

  const sortedThisWeekTodos = thisWeekTodos.sort((a, b) => {
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
    course: course, // This contains the full course object with schedule
  }));

  // Group courses by semester
  const groupCoursesBySemester = () => {
    const grouped: { [semester: string]: typeof courseData } = {};
    
    courseData.forEach(course => {
      // The course object contains the schedule data directly
      const semester = course.course?.schedule?.semester || 'TBD';
      if (!grouped[semester]) {
        grouped[semester] = [];
      }
      grouped[semester].push(course);
    });
    
    // Sort semesters: FA (Fall), SP (Spring), WI (Winter), then TBD
    const semesterOrder = ['FA', 'SP', 'WI', 'TBD'];
    const sortedSemesters = Object.keys(grouped).sort((a, b) => {
      const aYear = parseInt(a.replace(/\D/g, '')) || 0;
      const bYear = parseInt(b.replace(/\D/g, '')) || 0;
      const aSem = a.replace(/\d/g, '');
      const bSem = b.replace(/\d/g, '');
      
      // First sort by semester order (FA, SP, WI), then by year
      const aSemIndex = semesterOrder.indexOf(aSem);
      const bSemIndex = semesterOrder.indexOf(bSem);
      
      if (aSemIndex !== bSemIndex) {
        return aSemIndex - bSemIndex; // FA first, then SP, then WI
      }
      
      return bYear - aYear; // Newer years first within same semester
    });
    
    return { grouped, sortedSemesters };
  };

  const { grouped: coursesBySemester, sortedSemesters } = groupCoursesBySemester();

  // Get available courses for todo dropdown
  const availableCourses = userCourses.map((course) => course.class);


  const [currentTime, setCurrentTime] = useState(() => {
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes();
  });

  // Update current time every minute for real-time red line movement
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.getHours() * 60 + now.getMinutes());
    };

    // Update immediately
    updateTime();

    // Set up interval to update every minute
    const interval = setInterval(updateTime, 60000); // 60000ms = 1 minute

    // Cleanup interval on unmount
    return () => clearInterval(interval);
  }, []);

  const currentDate = new Date();

  // Semester detection logic
  const getCurrentSemester = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1; // getMonth() is 0-indexed
    const day = currentDate.getDate();
    
    // Fall: September 2 - November 25
    if ((month === 9 && day >= 2) || month === 10 || (month === 11 && day <= 25)) {
      return `${year}FA`;
    }
    // Winter: January 5 - January 21
    else if (month === 1 && day >= 5 && day <= 21) {
      return `${year}WI`;
    }
    // Spring: January 26 - April 24
    else if ((month === 1 && day >= 26) || month === 2 || month === 3 || (month === 4 && day <= 24)) {
      return `${year}SP`;
    }
    // Default to current year Fall if outside semester periods
    else {
      return `${year}FA`;
    }
  };

  const currentSemester = getCurrentSemester();

  // Parse course schedule and get courses for current day
  const parseCourseSchedule = (scheduleString: string) => {
    if (!scheduleString || scheduleString === 'TBD') return [];
    
    // Split by bullet points and commas
    const days = scheduleString.split(/[,\•]/).map(d => d.trim());
    const dayMap: { [key: string]: number } = {
      'Mon': 1, 'Monday': 1,
      'Tue': 2, 'Tuesday': 2, 'Tues': 2,
      'Wed': 3, 'Wednesday': 3,
      'Thu': 4, 'Thursday': 4, 'Thurs': 4,
      'Fri': 5, 'Friday': 5,
      'Sat': 6, 'Saturday': 6,
      'Sun': 0, 'Sunday': 0
    };
    
    return days.map(day => dayMap[day]).filter(day => day !== undefined);
  };

  const getCoursesForSelectedDay = () => {
    const dayOfWeek = selectedDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
    
    return userCourses.filter(course => {
      // Check if course is for current semester
      if (course.schedule?.semester && course.schedule.semester !== currentSemester) {
        return false;
      }
      
      // Parse schedule days
      const scheduleDays = parseCourseSchedule(course.schedule?.days || '');
      
      // Check if course meets on selected day
      return scheduleDays.includes(dayOfWeek);
    });
  };

  const selectedDayCourses = getCoursesForSelectedDay();


  // Parse time string and convert to position for calendar display
  const parseTimeToPosition = (timeString: string) => {
    if (!timeString || timeString === 'TBD') return null;
    
    // Parse time format like "1:30PM - 3:30PM" or "8:00AM - 9:30AM"
    const timeMatch = timeString.match(/(\d{1,2}):(\d{2})\s*(AM|PM)\s*-\s*(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (!timeMatch) return null;
    
    const [, startHour, startMin, startPeriod, endHour, endMin, endPeriod] = timeMatch;
    
    // Convert to 24-hour format
    const startHour24 = parseInt(startHour) + (startPeriod.toUpperCase() === 'PM' && startHour !== '12' ? 12 : 0);
    const endHour24 = parseInt(endHour) + (endPeriod.toUpperCase() === 'PM' && endHour !== '12' ? 12 : 0);
    
    // Convert to minutes since midnight
    const startMinutes = startHour24 * 60 + parseInt(startMin);
    const endMinutes = endHour24 * 60 + parseInt(endMin);
    
    // Only show courses within 8AM-8PM range
    if (startHour24 < 8 || endHour24 > 20) return null;
    
    // Convert to pixel position (8 AM to 8 PM = 12 hours = 720 minutes, 40px per hour)
    const startPosition = ((startMinutes - 480) / 60) * 40 + 6; // 480 = 8 AM in minutes, 6px offset
    const height = ((endMinutes - startMinutes) / 60) * 40;
    
    return { startPosition, height };
  };



  const getCurrentTimePosition = () => {
    // Calculate pixel position based on 8 AM to 8 PM timeframe (40px per hour)
    const startOfDay = 8 * 60; // 8 AM in minutes
    const timeFromStart = currentTime - startOfDay;
    const position = (timeFromStart / 60) * 40 + 6; // 40px per hour + 6px offset, match class boxes
    
    // Show the line even if outside the range, but clamp it to visible area
    return Math.max(6, Math.min(486, position)); // 6px to 486px (12 hours * 40px + 6px)
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
                    {sortedTodayTodos.length === 0 ? (
                      <div className="flex flex-col items-center justify-center text-center px-6" style={{ height: '210px' }}>
                        <div className="w-12 h-12 rounded-full flex items-center justify-center mb-3" style={{ backgroundColor: 'var(--background-color, #f9f5f0)' }}>
                          <span className="text-gray-400 text-xl">✓</span>
                        </div>
                        <p className="text-gray-500 text-sm font-medium">
                          Ready to tackle today?
                        </p>
                        <p className="text-gray-400 text-xs mt-1">
                          Add your first task and start crushing your goals! 🚀
                        </p>
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-100">
                        {sortedTodayTodos.map((todo) => (
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
                  todos={sortedThisWeekTodos}
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
                <div className="space-y-6">
                  {sortedSemesters.map((semester, semesterIndex) => (
                    <div key={semester}>
                      {/* Add line break before 2026SP courses */}
                      {semester === '2026SP' && semesterIndex > 0 && (
                        <div className="h-4"></div>
                      )}
                      <h3 className="text-md font-semibold text-gray-800 mb-3">
                        {semester === 'TBD' ? 'Schedule TBD' : semester}
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3">
                        {coursesBySemester[semester].map((course, index) => (
                          <CourseCard
                            key={`${semester}-${index}`}
                            title={course.title}
                            instructor={course.instructor}
                            course={course.course}
                            onCourseClick={onNavigateToCourse}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Sidebar - Calendar and Schedule */}
          <div className="w-68 flex-shrink-0 space-y-4">
            {/* Calendar */}
            <Card className="overflow-hidden relative" style={{ backgroundColor: '#FEFBF6' }}>
              <div className="px-4 py-3 border-b border-gray-200" style={{ backgroundColor: '#F8F4ED' }}>
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">{monthNames[currentMonth]} {currentYear}</h3>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 w-8 p-0 text-gray-600 hover:text-[#752432] text-lg"
                      onClick={() => {
                        setIsMonthSwitching(true);
                        const newMonth = currentMonth - 1;
                        const newYear = newMonth < 0 ? currentYear - 1 : currentYear;
                        const actualNewMonth = newMonth < 0 ? 11 : newMonth;
                        
                        // If navigating to current month, select today's date
                        if (actualNewMonth === today.getMonth() && newYear === today.getFullYear()) {
                          setSelectedDate(today);
                        } else {
                          setSelectedDate(new Date(newYear, actualNewMonth, 1));
                        }
                        
                        // Reset the month switching flag after a brief delay
                        setTimeout(() => setIsMonthSwitching(false), 100);
                      }}
                    >
                      ‹
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 w-8 p-0 text-gray-600 hover:text-[#752432] text-lg"
                      onClick={() => {
                        setIsMonthSwitching(true);
                        const newMonth = currentMonth + 1;
                        const newYear = newMonth > 11 ? currentYear + 1 : currentYear;
                        const actualNewMonth = newMonth > 11 ? 0 : newMonth;
                        
                        // If navigating to current month, select today's date
                        if (actualNewMonth === today.getMonth() && newYear === today.getFullYear()) {
                          setSelectedDate(today);
                        } else {
                          setSelectedDate(new Date(newYear, actualNewMonth, 1));
                        }
                        
                        // Reset the month switching flag after a brief delay
                        setTimeout(() => setIsMonthSwitching(false), 100);
                      }}
                    >
                      ›
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSemesterProgressVisible(!semesterProgressVisible)}
                      className="h-8 w-8 p-0 text-gray-500 hover:text-[#752432] hover:bg-[#752432]/10 rounded-full"
                    >
                      <GraduationCap className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
              <div className="p-3">
                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {dayNames.map((day, index) => (
                    <div key={`day-${index}`} className="text-center text-xs font-medium text-gray-500 py-1">
                      {day}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {/* Empty cells for days before month starts */}
                  {Array.from({ length: firstDayOfMonth }, (_, i) => (
                    <div key={`empty-${i}`} className="h-8" />
                  ))}
                  {/* Days of the month */}
                  {Array.from({ length: daysInMonth }, (_, i) => {
                    const day = i + 1;
                    const date = new Date(currentYear, currentMonth, day);
                    const isToday = date.toDateString() === today.toDateString() && currentMonth === today.getMonth() && currentYear === today.getFullYear();
                    const isSelected = date.toDateString() === selectedDate.toDateString();
                    
                    return (
                      <button
                        key={day}
                        onClick={() => setSelectedDate(date)}
                        className={`h-8 w-8 text-xs rounded-md font-medium flex items-center justify-center relative leading-none ${
                          isMonthSwitching ? '' : 'transition-colors'
                        } ${
                          isSelected 
                            ? 'bg-[#752432] text-white' 
                            : isToday 
                            ? 'bg-[#752432]/10 text-[#752432] border border-[#752432]/20' 
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                        style={{ 
                          fontFamily: 'system-ui, -apple-system, sans-serif',
                          fontWeight: '500',
                          fontSize: '12px',
                          lineHeight: '1'
                        }}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>
              
              {/* Semester Progress Overlay */}
              {semesterProgressVisible && (
                <div className="absolute bottom-10 right-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
                  <div className="px-3 py-2 border-b border-gray-200 bg-[#F8F4ED]">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <GraduationCap className="w-3.5 h-3.5 text-[#752432]" />
                        <h4 className="text-sm font-semibold text-gray-900">{semesterProgress.semesterName} Progress</h4>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSemesterProgressVisible(false)}
                        className="h-5 w-5 p-0 text-gray-500 hover:text-[#752432]"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                  <div className="px-3 py-3 space-y-3">
                    {/* Progress Bar */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-gray-700">Semester Complete</span>
                        <span className="text-xs font-semibold text-[#752432]">{semesterProgress.percentage}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-[#752432] h-2 rounded-full transition-all duration-300" 
                          style={{ width: `${semesterProgress.percentage}%` }}
                        />
                      </div>
                    </div>
                    
                    {/* Days Remaining */}
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-600">School days until break:</span>
                      <span className="text-xs font-semibold text-gray-900">
                        {semesterProgress.schoolDaysRemaining} days
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </Card>

            {/* Selected Day's Schedule - Google Calendar Style */}
            <Card className="p-0 overflow-hidden" style={{ backgroundColor: '#FEFBF6' }}>
              {/* Header */}
              <div className="p-4 border-b border-gray-200" style={{ backgroundColor: '#F8F4ED' }}>
                <h3 className="font-semibold text-gray-900">
                  {selectedDate.toDateString() === new Date().toDateString() ? 'Today' : 'Schedule'}
                </h3>
                <p className="text-xs text-gray-600">
                  {selectedDate.toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'short',
                    day: 'numeric'
                  })}
                </p>
              </div>

              {/* Schedule Content */}
              <div 
                className="overflow-hidden transition-all duration-1000 ease-out"
                style={{ 
                  height: selectedDayCourses.length === 0 ? '120px' : '520px',
                  backgroundColor: '#FEFBF6'
                }}
              >
                {selectedDayCourses.length === 0 ? (
                  <div className="p-6 text-center w-full h-full flex flex-col items-center justify-center">
                    <div className="flex items-center justify-center mx-auto mb-2">
                      <BookOpen className="w-6 h-6 text-gray-400" />
                    </div>
                    <p className="text-sm text-gray-500">
                      {selectedDate.toDateString() === new Date().toDateString() ? 'No classes today' : 'No classes scheduled'}
                    </p>
                  </div>
                ) : (
                  <div className="relative h-full">
                  {/* Time column */}
                  <div className="absolute left-0 w-16 h-full border-r border-gray-200" style={{ top: '6px' }}>
                    {/* Time labels */}
                    {[8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20].map(
                      (hour, index) => (
                        <div
                          key={hour}
                          className="absolute text-[10px] text-gray-500 text-center w-full leading-none"
                          style={{ top: `${index * 40 - 4}px` }}
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
                  <div className="absolute left-16 right-0 h-full" style={{ top: '6px' }}>
                    {Array.from({ length: 13 }, (_, index) => (
                      <div
                        key={index}
                        className="absolute w-full border-b border-gray-200"
                        style={{ top: `${index * 40}px` }}
                      />
                    ))}
                  </div>

                  {/* Current time indicator */}
                  <div
                    className="absolute left-16 right-0 z-50 flex items-center"
                    style={{ top: `${getCurrentTimePosition()}px` }}
                  >
                    <div className="w-1.5 h-1.5 bg-red-500 rounded-full shadow-sm"></div>
                    <div className="flex-1 h-0.5 bg-red-500"></div>
                  </div>

                  {/* Events */}
                  <div className="absolute left-16 right-0 top-0 h-full pr-2">
                    {selectedDayCourses.map((course, index) => {
                      const timePosition = parseTimeToPosition(course.schedule?.times || '');
                      if (!timePosition) return null;
                      
                      return (
                        <div
                          key={index}
                          className="absolute bg-[#752432] text-white rounded text-xs p-2 left-1 right-1 z-10"
                          style={{
                            top: `${timePosition.startPosition}px`,
                            height: `${timePosition.height}px`,
                          }}
                        >
                          <div className="font-medium truncate">{formatDisplayCourseName(course.class)}</div>
                          <div className="text-white/90 mt-1 leading-none flex items-center">
                            <span>{course.schedule?.times || 'TBD'}</span>
                            {course.schedule?.location && course.schedule.location !== 'TBD' && (
                              <span className="text-white/80 text-[10px] ml-2">
                                📍 {course.schedule.location}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  </div>
                )}
              </div>
            </Card>
          </div>

        </div>
      </div>
    </div>
  );
}
