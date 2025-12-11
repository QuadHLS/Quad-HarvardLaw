import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Calendar as CalendarComponent } from './ui/calendar';
import { CalendarIcon } from 'lucide-react';

interface AddTodoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  newTodoText: string;
  setNewTodoText: (text: string) => void;
  newTodoCategory: 'today' | 'this-week';
  setNewTodoCategory: (category: 'today' | 'this-week') => void;
  selectedDueDate: Date | undefined;
  setSelectedDueDate: (date: Date | undefined) => void;
  addTodo: () => void;
  formatDueDate: (dateString: string) => string;
}

export function AddTodoDialog({
  open,
  onOpenChange,
  newTodoText,
  setNewTodoText,
  newTodoCategory,
  setNewTodoCategory,
  selectedDueDate,
  setSelectedDueDate,
  addTodo,
  formatDueDate,
}: AddTodoDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="max-w-sm border border-gray-200 bg-white"
        style={{ backgroundColor: 'rgb(255, 255, 255)' }}
      >
        <DialogHeader>
          <DialogTitle>Add New Task</DialogTitle>
          <DialogDescription>
            Create a new task and assign it to today or in the future.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Input
            placeholder="Enter task description..."
            value={newTodoText}
            onChange={(e) => setNewTodoText(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addTodo()}
          />
          <div className="flex gap-2">
            <Button
              variant={newTodoCategory === 'today' ? 'default' : 'outline'}
              size="sm"
              onClick={() => {
                setNewTodoCategory('today');
                setSelectedDueDate(undefined);
              }}
              className={newTodoCategory === 'today' ? 'bg-[#752432] hover:bg-[#752432]/90' : ''}
            >
              Today
            </Button>
            <Button
              variant={newTodoCategory === 'this-week' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setNewTodoCategory('this-week')}
              className={newTodoCategory === 'this-week' ? 'bg-[#752432] hover:bg-[#752432]/90' : ''}
            >
              In the Future
            </Button>
          </div>
          
          {/* Date Picker for This Week */}
          {newTodoCategory === 'this-week' && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Due Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-between text-left font-normal"
                  >
                    {selectedDueDate ? (
                      formatDueDate(`${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][selectedDueDate.getMonth()]} ${selectedDueDate.getDate()}`)
                    ) : (
                      <span className="text-gray-500">Select due date</span>
                    )}
                    <CalendarIcon className="w-4 h-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={selectedDueDate}
                    onSelect={setSelectedDueDate}
                    disabled={(date: Date) => date < new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                onOpenChange(false);
                setNewTodoText('');
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={addTodo}
              className="bg-[#752432] hover:bg-[#752432]/90"
              disabled={!newTodoText.trim()}
            >
              Add Task
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
