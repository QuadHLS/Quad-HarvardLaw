import React, { useState, useEffect, useMemo } from 'react';
import {
  CheckCircle2,
  Circle,
  X,
  Plus,
  BookOpen,
  GraduationCap,
  CheckSquare,
  Square,
  Timer,
  ChevronDown,
  ChevronUp,
  CalendarIcon,
  Book,
  ChevronRight,
} from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { supabase } from '../lib/supabase';
import { Feed } from './FeedComponent';

interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
  course?: string;
  section: 'today' | 'thisWeek';
  dueDate?: string;
}

interface UserCourse {
  course_id: string; // UUID from Courses table
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

const getSemestersFromCode = (semesterCode: string): ('FA' | 'WI' | 'SP')[] => {
  switch (semesterCode) {
    case 'FA': return ['FA'];
    case 'WI': return ['WI'];
    case 'SP': return ['SP'];
    case 'FS': return ['FA', 'SP'];
    case 'FW': return ['FA', 'WI'];
    case 'WS': return ['WI', 'SP'];
    default: return [];
  }
};

const courseMatchesSemester = (courseTerm: string, selectedSemester: 'FA' | 'WI' | 'SP'): boolean => {
  if (!courseTerm || courseTerm === 'TBD') return false;
  
  const semesterCode = courseTerm.slice(-2);
  const semesters = getSemestersFromCode(semesterCode);
  
  return semesters.includes(selectedSemester);
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

// Todo interface
interface ToDo {
  id: string;
  text: string;
  completed: boolean;
  dueDate?: string;
  category: 'today' | 'this-week';
}

// Props interface
interface TodoListProps {
  additionalTodos?: ToDo[];
  onPomodoroStateChange?: (state: { 
    isRunning: boolean; 
    timeLeft: number; 
    currentSession: 'work' | 'break' | 'longBreak';
    sessionCount: number;
    phase: string;
  }) => void;
  user?: any;
}

// New TodoList component
function TodoList({ onPomodoroStateChange, user }: TodoListProps) {
  // State management
  const [todos, setTodos] = useState<ToDo[]>([]);
  const [newTodoText, setNewTodoText] = useState('');
  const [newTodoCategory, setNewTodoCategory] = useState<'today' | 'this-week'>('today');
  const [showAddTodo, setShowAddTodo] = useState(false);
  const [selectedDueDate, setSelectedDueDate] = useState<Date | undefined>(undefined);
  const [todoCollapsed, setTodoCollapsed] = useState(false);
  const [AddTodoDialogComponent, setAddTodoDialogComponent] = useState<React.ComponentType<any> | null>(null);
  const [PomodoroTimerComponent, setPomodoroTimerComponent] = useState<React.ComponentType<any> | null>(null);

  // Dynamically load AddTodoDialog when dialog opens to defer Radix UI bundle
  useEffect(() => {
    if (showAddTodo && !AddTodoDialogComponent) {
      import('./AddTodoDialog').then(module => {
        setAddTodoDialogComponent(() => module.AddTodoDialog);
      }).catch(() => {
        console.error('Failed to load AddTodoDialog');
      });
    }
  }, [showAddTodo, AddTodoDialogComponent]);

  // Dynamically load PomodoroTimer when shown to defer Radix UI bundle (Select, Collapsible)
  useEffect(() => {
    if (showPomodoro && !PomodoroTimerComponent) {
      import('./PomodoroTimer').then(module => {
        setPomodoroTimerComponent(() => module.PomodoroTimer);
      }).catch(() => {
        console.error('Failed to load PomodoroTimer');
      });
    }
  }, [showPomodoro, PomodoroTimerComponent]);

  const [showPomodoro, setShowPomodoro] = useState(false);

  // Load todos from profile on mount
  useEffect(() => {
    if (user?.id) {
      const fetchTodos = async () => {
        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('todo_day, todo_week')
            .eq('id', user.id)
            .single();

          if (profile) {
            const todayTodos = (profile.todo_day || []).map((todo: any) => ({
              ...todo,
              category: 'today' as const
            }));
            const thisWeekTodos = (profile.todo_week || []).map((todo: any) => ({
              ...todo,
              category: 'this-week' as const
            }));
            setTodos([...todayTodos, ...thisWeekTodos]);
          }
        } catch (error) {
          console.error('Error fetching todos:', error instanceof Error ? error.message : "Unknown error");
        }
      };

      fetchTodos();
    }
  }, [user?.id]);

  // Save todos to profile whenever todos change
  const saveTodosToDatabase = async (todosToSave: ToDo[]) => {
    if (!user?.id) return;
    
    try {
      const todayTodos = todosToSave.filter(todo => todo.category === 'today');
      const thisWeekTodos = todosToSave.filter(todo => todo.category === 'this-week');
      
      const { error } = await supabase
        .from('profiles')
        .update({ 
          todo_day: todayTodos,
          todo_week: thisWeekTodos
        })
        .eq('id', user.id);
      
      if (error) {
        console.error('Error saving todos:', error?.message || "Unknown error");
      }
    } catch (error) {
      console.error('Error saving todos:', error instanceof Error ? error.message : "Unknown error");
    }
  };

  // Format due dates
  const formatDueDate = (dateString: string) => {
    // Convert "Dec 15" format to "Mon, Dec 15" format
    const currentYear = new Date().getFullYear();
    const date = new Date(`${dateString}, ${currentYear}`);
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    const dayName = dayNames[date.getDay()];
    const monthName = monthNames[date.getMonth()];
    const day = date.getDate();
    
    return `${dayName}, ${monthName} ${day}`;
  };

  // Todo management
  const toggleTodo = (id: string) => {
    const updatedTodos = todos.map(todo => 
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    );
    setTodos(updatedTodos);
    saveTodosToDatabase(updatedTodos);
  };

  const removeTodo = (id: string) => {
    const updatedTodos = todos.filter(todo => todo.id !== id);
    setTodos(updatedTodos);
    saveTodosToDatabase(updatedTodos);
  };

  const capitalizeFirstLetter = (str: string) => {
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  const addTodo = () => {
    if (newTodoText.trim()) {
      let dueDate: string | undefined = undefined;
      
      if (newTodoCategory === 'this-week' && selectedDueDate) {
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const monthName = monthNames[selectedDueDate.getMonth()];
        const day = selectedDueDate.getDate();
        dueDate = `${monthName} ${day}`;
      }
      
      const newTodo: ToDo = {
        id: Date.now().toString(),
        text: capitalizeFirstLetter(newTodoText.trim()),
        completed: false,
        category: newTodoCategory,
        dueDate
      };
      
      const updatedTodos = [...todos, newTodo];
      setTodos(updatedTodos);
      saveTodosToDatabase(updatedTodos);
      setNewTodoText('');
      setSelectedDueDate(undefined);
      setShowAddTodo(false);
    }
  };

  // Filter todos by category
  const todayTodos = todos.filter(todo => todo.category === 'today');
  const thisWeekTodos = todos.filter(todo => todo.category === 'this-week');


  return (
    <div className="space-y-4">
      {/* To Do Card */}
      <Card className="overflow-hidden" style={{ backgroundColor: '#FEFBF6' }}>
        <div className="px-4 py-2 border-b border-gray-200" style={{ backgroundColor: '#F8F4ED' }}>
          <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
              <h2 className="font-semibold text-gray-900">To Do</h2>
        </div>
            <div className="flex items-center gap-1">
        <Button
                variant="ghost"
          size="sm"
                onClick={() => setShowPomodoro(!showPomodoro)}
                className="h-6 w-6 p-0 text-[#752432] hover:bg-[#752432]/10 border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200"
                style={{ backgroundColor: '#fffcf7' }}
              >
                <Timer className="w-3.5 h-3.5" />
              </Button>
              <Button
          variant="ghost"
                size="sm"
                onClick={() => setShowAddTodo(true)}
                className="h-6 px-2 text-[#752432] hover:bg-[#752432]/10 flex items-center gap-1 border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200"
                style={{ backgroundColor: '#fffcf7' }}
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="text-xs font-medium">Add</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setTodoCollapsed(!todoCollapsed)}
                className="h-6 w-6 p-0 text-[#752432] hover:bg-[#752432]/10"
              >
                {todoCollapsed ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
        </Button>
      </div>
          </div>
        </div>
        <div 
          className="overflow-hidden transition-all duration-1000 ease-out"
          style={{ 
            height: todoCollapsed ? '0px' : (todayTodos.length + thisWeekTodos.length) === 0 ? '120px' : `${Math.max(150, (todayTodos.length + thisWeekTodos.length) * 35 + 70)}px`
          }}
        >
          <div className={`px-3 pb-3 space-y-3 transition-opacity duration-1000 ${
            todoCollapsed ? 'opacity-0' : 'opacity-100'
          }`}>
            {/* Today Section */}
            <div>
              <h4 className="text-xs font-medium text-gray-600 mb-2">Today</h4>
              <div className="space-y-1.5">
                {todayTodos.map((todo) => (
                  <div key={todo.id} className="flex items-center gap-2 group">
                    <button
                      onClick={() => toggleTodo(todo.id)}
                      className="flex-shrink-0"
                    >
                      {todo.completed ? (
                        <CheckSquare className="w-4 h-4 text-[#752432]" />
                      ) : (
                        <Square className="w-4 h-4 text-gray-400 hover:text-[#752432]" />
                      )}
                    </button>
                    <span 
                      className={`text-sm flex-1 ${
                        todo.completed 
                          ? 'text-gray-500 line-through' 
                          : 'text-gray-900'
                      }`}
                    >
                      {todo.text}
                    </span>
                    <button
                      onClick={() => removeTodo(todo.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-red-500"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                {todayTodos.length === 0 && (
                  <p className="text-xs text-gray-500 italic">No tasks for today</p>
                )}
              </div>
      </div>

            {/* In the Future Section */}
            <div>
              <h4 className="text-xs font-medium text-gray-600 mb-2">In the Future</h4>
              <div className="space-y-1.5">
                {thisWeekTodos.map((todo) => (
                  <div key={todo.id} className="flex items-center gap-2 group">
                    <button
                      onClick={() => toggleTodo(todo.id)}
                      className="flex-shrink-0"
                    >
                      {todo.completed ? (
                        <CheckSquare className="w-4 h-4 text-[#752432]" />
                      ) : (
                        <Square className="w-4 h-4 text-gray-400 hover:text-[#752432]" />
                      )}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col">
                        <span 
                          className={`text-sm ${
                            todo.completed 
                              ? 'text-gray-500 line-through' 
                              : 'text-gray-900'
                          }`}
                        >
                          {todo.text}
                        </span>
                        {todo.dueDate && (
                            <div className="mt-1 text-[10px] px-1 rounded inline-block self-start" style={{ color: '#8b5a5a', backgroundColor: '#f6e7e5', paddingTop: '1px', paddingBottom: '1px' }}>
                            {formatDueDate(todo.dueDate)}
            </div>
                        )}
          </div>
                    </div>
                    <button
                      onClick={() => removeTodo(todo.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-red-500"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                {thisWeekTodos.length === 0 && (
                  <p className="text-xs text-gray-500 italic">No future tasks</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Pomodoro Timer */}
      <div 
        className="transition-all duration-1000 ease-out overflow-hidden"
        style={{
          maxHeight: showPomodoro ? '1000px' : '0px',
          opacity: showPomodoro ? 1 : 0,
        }}
      >
        <div 
          className="transition-opacity duration-1000 ease-out"
          style={{ opacity: showPomodoro ? 1 : 0 }}
        >
          {showPomodoro && PomodoroTimerComponent && (
            <PomodoroTimerComponent onStateChange={onPomodoroStateChange} />
          )}
        </div>
      </div>

      {/* Add Todo Dialog - Dynamically loaded to defer Radix UI bundle */}
      {/* Radix UI chunk only loads when dialog is opened (showAddTodo = true) */}
      {showAddTodo && AddTodoDialogComponent && (
        <AddTodoDialogComponent
          open={showAddTodo}
          onOpenChange={setShowAddTodo}
          newTodoText={newTodoText}
          setNewTodoText={setNewTodoText}
          newTodoCategory={newTodoCategory}
          setNewTodoCategory={setNewTodoCategory}
          selectedDueDate={selectedDueDate}
          setSelectedDueDate={setSelectedDueDate}
          addTodo={addTodo}
          formatDueDate={formatDueDate}
        />
      )}
    </div>
  );
}

// Course interface
interface Course {
  id: string;
  name: string;
  code: string;
  instructor: string;
  schedule: string;
  location: string;
  nextClass: string;
  color: string;
  progress: number;
}

// MyCourses component props
interface MyCoursesProps {
  onNavigateToCourse?: (courseName: string) => void;
  courses?: Course[];
  selectedSemester?: string;
  onSemesterChange?: (semester: string) => void;
}

// MyCourses component
function MyCourses({ 
  onNavigateToCourse, 
  courses,
  selectedSemester,
  onSemesterChange
}: MyCoursesProps) {
  // Use provided courses or empty array
  const myCoursesData = courses || [];

  return (
    <Card className="overflow-hidden" style={{ backgroundColor: '#FEFBF6' }}>
      <div className="px-4 py-2 border-b border-gray-200" style={{ backgroundColor: '#F8F4ED' }}>
        <div className="flex items-center justify-center gap-2">
          {onSemesterChange && selectedSemester && (
            <div className="flex gap-1">
              {['Fall', 'Winter', 'Spring'].map((term, index) => {
                const year = selectedSemester.slice(0, 4);
                const semesterCode = `${year}${term === 'Fall' ? 'FA' : term === 'Winter' ? 'WI' : 'SP'}`;
                const isSelected = selectedSemester === semesterCode;
                
                return (
                  <div key={term} className="flex items-center">
                    <button
                      onClick={() => onSemesterChange(semesterCode)}
                      className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
                        isSelected 
                          ? 'bg-[#752432] text-white' 
                          : 'text-gray-600 hover:text-[#752432] hover:bg-white'
                      }`}
                    >
                      {term}
                    </button>
                    {index < 2 && (
                      <span className="mx-1 text-gray-400 text-xs">|</span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      <div className="px-3 pb-3 pt-0 space-y-2">
        {myCoursesData.map((course) => (
          <div 
            key={course.id}
            className="p-3 rounded-lg border border-gray-200 hover:border-[#752432] cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-110"
            style={{ backgroundColor: '#FEFBF6' }}
            onClick={() => onNavigateToCourse?.(course.name)}
          >
            <div className="flex items-start justify-between mb-1.5">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <div 
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: course.color }}
                  />
                  <h4
                    className="font-medium text-gray-900 text-sm leading-tight overflow-hidden"
                    style={{
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      wordBreak: 'break-word'
                    }}
                  >
                    {course.name}
                  </h4>
                </div>
                <p className="text-[10px] text-gray-600">{course.instructor}</p>
                {course.schedule && course.schedule.includes('    ') ? (
                  <>
                    <p className="text-[10px] text-gray-500">{course.schedule.split('    ')[0]}</p>
                    <p className="text-[10px] text-gray-500">{course.schedule.split('    ')[1]}</p>
                  </>
                ) : (
                  <p className="text-[10px] text-gray-500">{course.schedule}</p>
                )}
                {course.location && course.location !== 'TBD' && (
                  <p className="text-[10px] text-gray-600">{course.location}</p>
                )}
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </div>
        </div>
        ))}
        
        {/* Empty state */}
        {myCoursesData.length === 0 && (
          <div className="text-center py-8">
            <Book className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500 mb-2">No courses enrolled</p>
            <p className="text-xs text-gray-400">Edit Profile</p>
            </div>
          )}
          </div>
    </Card>
  );
}

interface HomePageProps {
  onNavigateToCourse?: (courseName: string) => void;
  onNavigateToStudentProfile?: (studentName: string) => void;
  user?: any;
}

export function HomePage({ onNavigateToCourse, onNavigateToStudentProfile, user }: HomePageProps) {
  const [, setUserProfile] = useState<UserProfile | null>(null);
  const [userCourses, setUserCourses] = useState<UserCourse[]>([]);
  const [transformedCourses, setTransformedCourses] = useState<Course[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [loading, setLoading] = useState(true);
  const [semesterProgressVisible, setSemesterProgressVisible] = useState(false);
  const [isMonthSwitching, setIsMonthSwitching] = useState(false);
  const [feedMode, setFeedMode] = useState<'campus' | 'my-courses'>('campus');
  const [isThreadViewOpen, setIsThreadViewOpen] = useState(false);
  
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


  // Fetch user's profile and courses
  // Start fetching immediately when animation begins (as soon as user exists)
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }
      
      // Start fetching immediately - don't wait for anything

      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('full_name, classes, class_year, todo_day, todo_week')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error fetching profile:', error?.message || "Unknown error");
          setLoading(false);
          return;
        }


        if (profile) {
          setUserProfile(profile);
          setUserCourses(profile.classes || []);
        }

        setLoading(false);
      } catch (error) {
        console.error('Error fetching user profile:', error instanceof Error ? error.message : "Unknown error");
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [user]);

  // Get current semester using date-based logic
  const getCurrentSemester = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth() + 1; // getMonth() is 0-indexed
    const day = today.getDate();
    
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
  const [selectedSemester, setSelectedSemester] = useState<string>(currentSemester);

  // Semester display formatting is now handled in the MyCourses component

  // Transform user courses to Course format for MyCourses component
  useEffect(() => {
    if (userCourses.length === 0) {
      setTransformedCourses([]);
      return;
    }

    // Helper functions
    const colorCycle = ['#04913A', '#0080BD', '#FFBB06', '#F22F21'];
    const getCourseColor = (index: number): string => {
      return colorCycle[index % 4];
    };

    const formatDays = (daysStr: string): string => {
      if (!daysStr || daysStr === 'TBD') return 'TBD';
      return daysStr
        .replace(/Monday/g, 'M')
        .replace(/Tuesday/g, 'Tu')
        .replace(/Wednesday/g, 'W')
        .replace(/Thursday/g, 'Th')
        .replace(/Friday/g, 'F')
        .replace(/Mon/g, 'M')
        .replace(/Tue/g, 'Tu')
        .replace(/Wed/g, 'W')
        .replace(/Thu/g, 'Th')
        .replace(/Fri/g, 'F');
    };

    const getLastNames = (professorStr: string): string => {
      if (!professorStr || professorStr === 'TBD') return 'TBD';
      
      // Split professors only by semicolons (not commas which separate last/first)
      const entries = professorStr
        .split(';')
        .map(name => name.trim())
        .filter(name => name.length > 0);
      
      const lastNames = entries
        .map(entry => {
          // If formatted as "Last, First", take the part before the comma
          const commaIndex = entry.indexOf(',');
          if (commaIndex !== -1) {
            const lastName = entry.slice(0, commaIndex).trim();
            if (lastName) return lastName;
          }
          
          // Otherwise assume "First Last"; take the last token
          const parts = entry.split(/\s+/).filter(part => part.length > 0);
          return parts.length > 0 ? parts[parts.length - 1] : entry.trim();
        })
        .filter(name => name.length > 0);
      
      return lastNames.join('; ');
    };

    // Filter courses for selected semester using multi-semester logic
    const selectedSemesterCourses = userCourses.filter(course => {
      const courseSemester = course.schedule?.semester;
      const selectedTerm = selectedSemester.slice(-2) as 'FA' | 'WI' | 'SP'; // Get last 2 characters (FA, WI, SP)
      
      // Use multi-semester logic to check if course matches selected semester
      return courseMatchesSemester(courseSemester, selectedTerm);
    });

    if (selectedSemesterCourses.length === 0) {
      setTransformedCourses([]);
      return;
    }

    // Helper functions defined above

    // Helper to get next class time
    const getNextClass = (course: UserCourse): string => {
      const schedule = course.schedule;
      if (!schedule?.days || !schedule?.times || schedule.days === 'TBD' || schedule.times === 'TBD') {
        return 'TBD';
      }

      // Parse days
      const dayMap: Record<string, number> = {
        'Mon': 1, 'Monday': 1, 'M': 1,
        'Tue': 2, 'Tuesday': 2, 'Tu': 2, 'Tues': 2,
        'Wed': 3, 'Wednesday': 3, 'W': 3,
        'Thu': 4, 'Thursday': 4, 'Th': 4, 'Thurs': 4,
        'Fri': 5, 'Friday': 5, 'F': 5,
        'Sat': 6, 'Saturday': 6,
        'Sun': 0, 'Sunday': 0
      };

      const daysString = schedule.days;
      const courseDays: number[] = [];
      
      // Parse all days from the string
      Object.keys(dayMap).forEach(dayName => {
        if (daysString.includes(dayName)) {
          const dayNum = dayMap[dayName];
          if (!courseDays.includes(dayNum)) {
            courseDays.push(dayNum);
          }
        }
      });

      if (courseDays.length === 0) return 'TBD';

      // Get current day
      const today = new Date();
      const currentDay = today.getDay();

      // Find next occurrence
      courseDays.sort((a, b) => a - b);
      
      // Check if class is today
      if (courseDays.includes(currentDay)) {
        // Parse time to check if it's already passed
        const timeMatch = schedule.times.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
        if (timeMatch) {
          const [, hour, min, period] = timeMatch;
          const classHour = parseInt(hour) + (period.toUpperCase() === 'PM' && hour !== '12' ? 12 : 0);
          const classMinutes = classHour * 60 + parseInt(min);
          const currentMinutes = today.getHours() * 60 + today.getMinutes();
          
          if (currentMinutes < classMinutes) {
            return `Today ${schedule.times.split('-')[0].trim()}`;
          }
        }
      }

      // Find next day
      const nextDay = courseDays.find(day => day > currentDay) || courseDays[0];
      const daysUntilNext = nextDay > currentDay ? nextDay - currentDay : 7 - currentDay + nextDay;

      if (daysUntilNext === 0) {
        return `Today ${schedule.times.split('-')[0].trim()}`;
      } else if (daysUntilNext === 1) {
        return `Tomorrow ${schedule.times.split('-')[0].trim()}`;
      } else {
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        return `${dayNames[nextDay]} ${schedule.times.split('-')[0].trim()}`;
      }
    };

    // getLastNames function defined above

    const transformed = selectedSemesterCourses.map((course, index) => ({
      id: `${index + 1}`,
      name: formatDisplayCourseName(course.class), // Format to hide section numbers for 1L courses
      code: '', // We don't have course codes in the current data structure
      instructor: getLastNames(course.professor || 'TBD'),
      schedule: course.schedule?.days && course.schedule?.times 
        ? `${formatDays(course.schedule.days)}    ${course.schedule.times}`
        : 'TBD',
      location: course.schedule?.location || 'TBD',
      nextClass: getNextClass(course),
      color: getCourseColor(index),
      progress: 0 // We don't track progress yet
    }));

    setTransformedCourses(transformed);
  }, [userCourses, selectedSemester]);









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

  // currentSemester is already defined above

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
      // Check if course is for selected semester using multi-semester logic
      const courseSemester = course.schedule?.semester;
      const selectedTerm = selectedSemester.slice(-2) as 'FA' | 'WI' | 'SP';
      
      if (!courseMatchesSemester(courseSemester, selectedTerm)) {
        return false;
      }
      
      // Parse schedule days
      const scheduleDays = parseCourseSchedule(course.schedule?.days || '');
      
      // Check if course meets on selected day
      return scheduleDays.includes(dayOfWeek);
    });
  };

  const selectedDayCourses = getCoursesForSelectedDay();

  // Map course name -> color for schedule blocks to match MyCourses dots
  const courseNameToColor = useMemo(() => {
    const map: Record<string, string> = {};
    transformedCourses.forEach(c => {
      if (c?.name && c?.color) {
        map[c.name] = c.color;
      }
    });
    return map;
  }, [transformedCourses]);


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

  // Import skeleton at top of file
  // import { ContentSkeleton } from './ui/skeletons';
  
  if (loading) {
    return (
      <div className="h-full p-6" style={{ backgroundColor: 'var(--background-color, #f9f5f0)' }}>
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <div className="h-8 w-48 bg-gray-200 rounded-md animate-pulse mb-4"></div>
            <div className="h-4 w-64 bg-gray-200 rounded-md animate-pulse"></div>
          </div>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 bg-gray-200 rounded-full animate-pulse"></div>
                  <div className="flex-1">
                    <div className="h-4 w-32 bg-gray-200 rounded-md animate-pulse mb-2"></div>
                    <div className="h-3 w-24 bg-gray-200 rounded-md animate-pulse mb-3"></div>
                    <div className="h-4 w-full bg-gray-200 rounded-md animate-pulse mb-2"></div>
                    <div className="h-4 w-3/4 bg-gray-200 rounded-md animate-pulse"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // JSON-LD structured data for SEO
  const siteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "url": "https://www.quadhls.com/",
    "name": "Quad",
    "alternateName": ["Quad HLS", "Quad for Harvard Law"],
    "description": "Harvard Law's all-in-one platform for course outlines, exam banks, social feeds, club chats, course reviews, and study planning.",
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://www.quadhls.com/search?q={search_term_string}",
      "query-input": "required name=search_term_string"
    }
  };

  const orgJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Quad",
    "url": "https://www.quadhls.com/",
    "logo": "https://www.quadhls.com/QUAD.svg",
    "description": "Harvard Law's go-to platform connecting students with course outlines, exam banks, social feeds, club chats, course reviews, and study planning tools."
  };

  return (
    <div className="h-full overflow-hidden" style={{ backgroundColor: 'var(--background-color, #f9f5f0)' }}>
      {/* JSON-LD Structured Data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(siteJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
      />
      
      {/* SEO: H1 and descriptive first paragraph for Google snippets */}
      <div className="sr-only" style={{ position: 'absolute', width: '1px', height: '1px', padding: 0, margin: '-1px', overflow: 'hidden', clip: 'rect(0, 0, 0, 0)', whiteSpace: 'nowrap', borderWidth: 0 }}>
        <h1>Quad – Your All-in-One HLS Platform</h1>
        <p>Quad is Harvard Law's go-to platform for course outlines, exam banks, social feeds, club chats, course reviews, and study planning. Connect with classmates, share resources, and ace your classes—all in one place!</p>
      </div>
      
      <div className="max-w-full mx-auto p-6 pb-0">
        <style>{`
          @media (min-width: 900px) {
            .sidebar-left, .sidebar-right {
              display: flex !important;
            }
          }
          @media (max-width: 899px) {
            .sidebar-left, .sidebar-right {
              display: none !important;
            }
          }
        `}</style>
        <div className={`flex gap-6 ${isThreadViewOpen ? 'justify-center' : ''} min-w-0`} style={{ 
          minWidth: '400px', // Just feed min width on smaller screens
          overflowX: 'auto'
        }}>
          {/* Left Content - Only show when not in thread view and on screens >= 900px */}
          {!isThreadViewOpen && (
            <div className="sidebar-left w-64 flex-shrink-0 flex-col space-y-4 overflow-y-auto scrollbar-hide" style={{ 
              height: 'calc(100vh - 0px)', 
              marginTop: '-24px', 
              paddingTop: '24px',
              paddingBottom: '80px',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              minWidth: '256px' // w-64 = 256px, prevents shrinking below this
            }}>
              {/* Todo Box */}
              <div>
                <TodoList 
                  user={user}
                  onPomodoroStateChange={() => {}}
                />
              </div>

              {/* My Courses Section */}
              <div>
                <MyCourses 
                  onNavigateToCourse={onNavigateToCourse}
                  courses={transformedCourses}
                  selectedSemester={selectedSemester}
                  onSemesterChange={setSelectedSemester}
                />
              </div>
            </div>
          )}

          {/* Feed Content - Always rendered */}
          <div className={`${isThreadViewOpen ? 'w-full max-w-4xl' : 'flex-1 min-w-0'} flex flex-col`} style={{ height: 'calc(100vh - 12px)', minWidth: '400px' }}>
            <Feed 
              feedMode={feedMode}
              onFeedModeChange={setFeedMode}
              myCourses={userCourses}
              onThreadViewChange={setIsThreadViewOpen}
              onNavigateToStudentProfile={onNavigateToStudentProfile}
            />
          </div>

          {/* Right Sidebar - Only show when not in thread view and on screens >= 900px */}
          {!isThreadViewOpen && (
            <div className="sidebar-right w-68 flex-shrink-0 flex-col space-y-4 overflow-y-auto scrollbar-hide" style={{ 
              height: 'calc(100vh - 0px)', 
              marginTop: '-24px', 
              paddingTop: '24px',
              paddingBottom: '80px',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              minWidth: '272px', // w-68 = 272px, prevents shrinking below this
              flexShrink: 0 // Ensure it doesn't shrink when feed hits minimum
            }}>
            {/* Calendar */}
            <Card className="overflow-hidden relative flex-shrink-0" style={{ backgroundColor: '#FEFBF6' }}>
              <div className="px-4 py-3 border-b border-gray-200 flex-shrink-0" style={{ backgroundColor: '#F8F4ED' }}>
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold text-gray-900">{monthNames[currentMonth]} {currentYear}</h2>
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
              <div className="p-3 flex-shrink-0">
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
                        <X className="w-3.5 h-3.5" />
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
            <Card className="p-0 overflow-hidden flex-shrink-0" style={{ backgroundColor: '#FEFBF6' }}>
              {/* Header */}
              <div className="p-4 border-b border-gray-200 flex-shrink-0" style={{ backgroundColor: '#F8F4ED' }}>
                <h2 className="font-semibold text-gray-900">
                  {selectedDate.toDateString() === new Date().toDateString() ? 'Today' : 'Schedule'}
                </h2>
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
                className="overflow-hidden transition-all duration-1000 ease-out flex-shrink-0"
                style={{ 
                  minHeight: selectedDayCourses.length === 0 ? '120px' : '520px',
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

                  {/* Events */}
                  <div className="absolute left-16 right-0 top-0 h-full pr-2">
                    {selectedDayCourses.map((course, index) => {
                      const timePosition = parseTimeToPosition(course.schedule?.times || '');
                      if (!timePosition) return null;
                      const displayName = formatDisplayCourseName(course.class);
                      const bgColor = courseNameToColor[displayName] || '#752432';
                      
                      return (
                        <div
                          key={index}
                          className="absolute text-white rounded text-xs p-2 left-1 right-1 z-10"
                          style={{
                            top: `${timePosition.startPosition}px`,
                            height: `${timePosition.height}px`,
                            backgroundColor: bgColor
                          }}
                        >
                          <div className="font-medium truncate">{displayName}</div>
                          <div className="text-white/90 mt-1 leading-none flex items-center">
                            <span>{course.schedule?.times || 'TBD'}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Current time indicator - rendered after events to ensure it's on top */}
                  <div
                    className="absolute left-16 right-0 z-50 flex items-center pointer-events-none"
                    style={{ top: `${getCurrentTimePosition()}px` }}
                  >
                    <div className="w-1.5 h-1.5 bg-red-500 rounded-full shadow-sm"></div>
                    <div className="flex-1 h-0.5 bg-red-500"></div>
                  </div>
                  </div>
                )}
              </div>
            </Card>
          </div>
          )}
        </div>
      </div>
    </div>
  );
}
