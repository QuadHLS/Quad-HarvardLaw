import { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Settings, ChevronDown, ChevronUp, Bell, BellOff } from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Collapsible, CollapsibleTrigger } from './ui/collapsible';
import { Switch } from './ui/switch';

// Pomodoro settings interface
interface PomodoroSettings {
  workMinutes: number;
  breakMinutes: number;
  longBreakMinutes: number;
  sessionsUntilLongBreak: number;
  soundEnabled: boolean;
  autoStartBreaks: boolean;
  autoStartWork: boolean;
}

// Component props interface
interface PomodoroTimerProps {
  className?: string;
  onStateChange?: (state: { 
    isRunning: boolean; 
    timeLeft: number; 
    currentSession: 'work' | 'break' | 'longBreak';
    sessionCount: number;
    phase: string;
  }) => void;
}

export function PomodoroTimer({ className = '', onStateChange }: PomodoroTimerProps) {
  // UI State
  const [isOpen, setIsOpen] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  
  // Timer State
  const [isRunning, setIsRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutes in seconds
  const [currentSession, setCurrentSession] = useState<'work' | 'break' | 'longBreak'>('work');
  const [sessionCount, setSessionCount] = useState(0);
  
  // Settings State
  const [settings, setSettings] = useState<PomodoroSettings>({
    workMinutes: 25,
    breakMinutes: 5,
    longBreakMinutes: 15,
    sessionsUntilLongBreak: 4,
    soundEnabled: true,
    autoStartBreaks: false,
    autoStartWork: false
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize audio for notifications
  useEffect(() => {
    audioRef.current = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT');
    audioRef.current.volume = 0.3;
  }, []);

  // Timer interval effect
  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, timeLeft]);

  // Handle timer completion
  useEffect(() => {
    if (timeLeft === 0) {
      setIsRunning(false);
      handleSessionComplete();
    }
  }, [timeLeft]);

  // Notify parent component of state changes
  useEffect(() => {
    if (onStateChange) {
      onStateChange({ 
        isRunning, 
        timeLeft, 
        currentSession, 
        sessionCount,
        phase: getSessionName()
      });
    }
  }, [isRunning, timeLeft, currentSession, sessionCount, onStateChange]);

  // Play notification sound
  const playNotificationSound = () => {
    if (settings.soundEnabled && audioRef.current) {
      audioRef.current.play().catch(console.error);
    }
  };

  // Handle session completion
  const handleSessionComplete = () => {
    playNotificationSound();
    
    if (currentSession === 'work') {
      const newSessionCount = sessionCount + 1;
      setSessionCount(newSessionCount);
      
      if (newSessionCount % settings.sessionsUntilLongBreak === 0) {
        setCurrentSession('longBreak');
        setTimeLeft(settings.longBreakMinutes * 60);
        if (settings.autoStartBreaks) {
          setIsRunning(true);
        }
      } else {
        setCurrentSession('break');
        setTimeLeft(settings.breakMinutes * 60);
        if (settings.autoStartBreaks) {
          setIsRunning(true);
        }
      }
    } else {
      setCurrentSession('work');
      setTimeLeft(settings.workMinutes * 60);
      if (settings.autoStartWork) {
        setIsRunning(true);
      }
    }
  };

  // Toggle timer
  const toggleTimer = () => {
    setIsRunning(!isRunning);
  };

  // Reset timer
  const resetTimer = () => {
    setIsRunning(false);
    setSessionCount(0);
    setCurrentSession('work');
    setTimeLeft(settings.workMinutes * 60);
  };

  // Update settings
  const updateSettings = (newSettings: Partial<PomodoroSettings>) => {
    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);
    
    // Update current timer if not running
    if (!isRunning) {
      if (currentSession === 'work') {
        setTimeLeft(updatedSettings.workMinutes * 60);
      } else if (currentSession === 'break') {
        setTimeLeft(updatedSettings.breakMinutes * 60);
      } else {
        setTimeLeft(updatedSettings.longBreakMinutes * 60);
      }
    }
  };

  // Format time display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Get session color
  const getSessionColor = () => {
    switch (currentSession) {
      case 'work':
        return '#752432'; // Maroon
      case 'break':
        return '#00962C'; // Green
      case 'longBreak':
        return '#0078C6'; // Blue
      default:
        return '#752432';
    }
  };

  // Get session name
  const getSessionName = () => {
    switch (currentSession) {
      case 'work':
        return 'Work Session';
      case 'break':
        return 'Short Break';
      case 'longBreak':
        return 'Long Break';
      default:
        return 'Work Session';
    }
  };

  // Calculate progress percentage
  const progressPercentage = () => {
    const totalTime = currentSession === 'work' 
      ? settings.workMinutes * 60
      : currentSession === 'break'
      ? settings.breakMinutes * 60
      : settings.longBreakMinutes * 60;
    
    return ((totalTime - timeLeft) / totalTime) * 100;
  };

  // Settings options
  const workMinutesOptions = [15, 20, 25, 30, 45, 50, 60];
  const breakMinutesOptions = [5, 10, 15, 20];
  const longBreakMinutesOptions = [15, 20, 25, 30];
  const sessionOptions = [2, 3, 4, 5, 6];

  return (
    <Card className={`overflow-hidden ${className}`} style={{ backgroundColor: '#FEFBF6' }}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-[#F5F1E8]/50 transition-colors border-b border-gray-200" style={{ backgroundColor: '#F8F4ED' }}>
            <div className="flex items-center gap-3">
              <div 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: getSessionColor() }}
              />
              <h3 className="font-medium text-gray-900 whitespace-nowrap">Pomodoro Timer</h3>
              <span className="text-sm text-gray-600 ml-1 font-mono">
                {formatTime(timeLeft)}
              </span>
            </div>
            <div className="flex items-center gap-2 ml-2">
              {isOpen ? (
                <ChevronUp className="w-4 h-4 text-gray-500" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-500" />
              )}
            </div>
          </div>
        </CollapsibleTrigger>
        
        <div 
          className="overflow-hidden transition-all duration-1000 ease-out"
          style={{ 
            height: isOpen ? (showSettings ? '600px' : '260px') : '0px'
          }}
        >
            <div className={`p-4 space-y-4 transition-opacity duration-1000 ${
              isOpen ? 'opacity-100' : 'opacity-0'
            }`}>
            {/* Timer Display */}
            <div className="text-center">
              <div className="relative mx-auto mb-3" style={{ width: '140px', height: '140px' }}>
                {/* Progress Circle */}
                <svg style={{ width: '140px', height: '140px', transform: 'rotate(-90deg)' }} viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    stroke="#F5F1E8"
                    strokeWidth="8"
                    fill="none"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    stroke={getSessionColor()}
                    strokeWidth="8"
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 45}`}
                    strokeDashoffset={`${2 * Math.PI * 45 - (2 * Math.PI * 45 * progressPercentage() / 100)}`}
                    className="transition-all duration-300"
                  />
                </svg>
                
                {/* Timer Text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="text-xl font-mono font-medium text-gray-900">
                    {formatTime(timeLeft)}
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    {getSessionName()}
                  </div>
                </div>
              </div>
              
              {/* Session Counter */}
              <div className="text-sm text-gray-600 mb-4">
                Sessions: {sessionCount} / {settings.sessionsUntilLongBreak}
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-2">
              <Button
                onClick={toggleTimer}
                size="sm"
                className="bg-[#752432] hover:bg-[#752432]/90 text-white px-4 py-2"
              >
                {isRunning ? (
                  <Pause className="w-4 h-4" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
              </Button>
              
              <Button
                onClick={resetTimer}
                size="sm"
                variant="outline"
                className="border-gray-300 hover:bg-[#F5F1E8] px-4 py-2"
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
              
              <Button
                onClick={() => setShowSettings(!showSettings)}
                size="sm"
                variant="outline"
                className={`border-gray-300 hover:bg-[#F5F1E8] px-4 py-2 ${
                  showSettings ? 'bg-[#752432] text-white hover:bg-[#752432]/90' : ''
                }`}
              >
                <Settings className="w-4 h-4" />
              </Button>
            </div>

            {/* Settings Panel */}
            <div 
              className={`border-t border-gray-200 pt-4 mt-4 space-y-4 transition-all duration-1000 overflow-hidden ${
                showSettings ? 'opacity-100 max-h-[400px]' : 'opacity-0 max-h-0 pt-0 mt-0'
              }`}
            >
                <h4 className="text-sm font-medium text-gray-800 mb-3">Timer Settings</h4>
                
                {/* Timer Duration Settings */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-600 mb-1 block">Work Time</label>
                    <Select
                      value={settings.workMinutes.toString()}
                      onValueChange={(value) => updateSettings({ workMinutes: parseInt(value) })}
                    >
                      <SelectTrigger className="h-8 text-xs border-gray-300">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {workMinutesOptions.map(minutes => (
                          <SelectItem key={minutes} value={minutes.toString()}>
                            {minutes} min
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label className="text-xs text-gray-600 mb-1 block">Short Break</label>
                    <Select
                      value={settings.breakMinutes.toString()}
                      onValueChange={(value) => updateSettings({ breakMinutes: parseInt(value) })}
                    >
                      <SelectTrigger className="h-8 text-xs border-gray-300">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {breakMinutesOptions.map(minutes => (
                          <SelectItem key={minutes} value={minutes.toString()}>
                            {minutes} min
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label className="text-xs text-gray-600 mb-1 block">Long Break</label>
                    <Select
                      value={settings.longBreakMinutes.toString()}
                      onValueChange={(value) => updateSettings({ longBreakMinutes: parseInt(value) })}
                    >
                      <SelectTrigger className="h-8 text-xs border-gray-300">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {longBreakMinutesOptions.map(minutes => (
                          <SelectItem key={minutes} value={minutes.toString()}>
                            {minutes} min
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label className="text-xs text-gray-600 mb-1 block">Sessions Until Long Break</label>
                    <Select
                      value={settings.sessionsUntilLongBreak.toString()}
                      onValueChange={(value) => updateSettings({ sessionsUntilLongBreak: parseInt(value) })}
                    >
                      <SelectTrigger className="h-8 text-xs border-gray-300">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {sessionOptions.map(sessions => (
                          <SelectItem key={sessions} value={sessions.toString()}>
                            {sessions}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Advanced Settings */}
                <div className="space-y-3 pt-2 border-t border-gray-100">
                  <h5 className="text-xs font-medium text-gray-700">Advanced Settings</h5>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {settings.soundEnabled ? (
                        <Bell className="w-4 h-4 text-[#752432]" />
                      ) : (
                        <BellOff className="w-4 h-4 text-gray-400" />
                      )}
                      <span className="text-xs text-gray-600">Sound Notifications</span>
                    </div>
                    <Switch
                      checked={settings.soundEnabled}
                      onCheckedChange={(checked) => updateSettings({ soundEnabled: checked })}
                      className="data-[state=checked]:bg-[#752432] scale-75"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Play className="w-4 h-4 text-gray-500" />
                      <span className="text-xs text-gray-600">Auto-start Breaks</span>
                    </div>
                    <Switch
                      checked={settings.autoStartBreaks}
                      onCheckedChange={(checked) => updateSettings({ autoStartBreaks: checked })}
                      className="data-[state=checked]:bg-[#752432] scale-75"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Play className="w-4 h-4 text-gray-500" />
                      <span className="text-xs text-gray-600">Auto-start Work</span>
                    </div>
                    <Switch
                      checked={settings.autoStartWork}
                      onCheckedChange={(checked) => updateSettings({ autoStartWork: checked })}
                      className="data-[state=checked]:bg-[#752432] scale-75"
                    />
                  </div>
                </div>
              </div>
            </div>
        </div>
      </Collapsible>
    </Card>
  );
}