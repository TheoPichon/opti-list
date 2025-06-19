
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import { Trash2 } from 'lucide-react';
import type { Task, CreateTaskInput } from '../../server/src/schema';

function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTaskText, setNewTaskText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isAddingTask, setIsAddingTask] = useState(false);

  // Load tasks from server
  const loadTasks = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await trpc.getTasks.query();
      setTasks(result);
    } catch (error) {
      console.error('Failed to load tasks:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskText.trim()) return;

    setIsAddingTask(true);
    try {
      const taskInput: CreateTaskInput = { text: newTaskText.trim() };
      const newTask = await trpc.createTask.mutate(taskInput);
      setTasks((prev: Task[]) => [...prev, newTask]);
      setNewTaskText('');
    } catch (error) {
      console.error('Failed to create task:', error);
    } finally {
      setIsAddingTask(false);
    }
  };

  const handleToggleTask = async (taskId: number, completed: boolean) => {
    try {
      const updatedTask = await trpc.updateTask.mutate({ id: taskId, completed });
      setTasks((prev: Task[]) =>
        prev.map((task: Task) =>
          task.id === taskId ? updatedTask : task
        )
      );
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  };

  const handleDeleteTask = async (taskId: number) => {
    try {
      await trpc.deleteTask.mutate({ id: taskId });
      setTasks((prev: Task[]) => prev.filter((task: Task) => task.id !== taskId));
    } catch (error) {
      console.error('Failed to delete task:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="container mx-auto max-w-2xl px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            ✅ Opti-List
          </h1>
          <p className="text-gray-600">Optimize your daily tasks</p>
        </div>

        {/* Add Task Form */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <form onSubmit={handleAddTask} className="flex gap-3">
            <Input
              value={newTaskText}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setNewTaskText(e.target.value)
              }
              placeholder="Enter a new task..."
              className="flex-1 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              disabled={isAddingTask}
            />
            <Button
              type="submit"
              disabled={isAddingTask || !newTaskText.trim()}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 font-medium"
            >
              {isAddingTask ? 'Adding...' : 'Add'}
            </Button>
          </form>
        </div>

        {/* Tasks List */}
        <div className="bg-white rounded-lg shadow-md">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-600">Loading tasks...</p>
            </div>
          ) : tasks.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📝</div>
              <p className="text-gray-500 text-lg">No tasks yet!</p>
              <p className="text-gray-400">Add your first task above to get started.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {tasks.map((task: Task) => (
                <div
                  key={task.id}
                  className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors"
                >
                  <Checkbox
                    checked={task.completed}
                    onCheckedChange={(checked: boolean) =>
                      handleToggleTask(task.id, checked)
                    }
                    className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                  />
                  
                  <span
                    className={`flex-1 text-lg ${
                      task.completed
                        ? 'line-through text-gray-400'
                        : 'text-gray-800'
                    }`}
                  >
                    {task.text}
                  </span>
                  
                  <div className="text-xs text-gray-400">
                    {task.created_at.toLocaleDateString()}
                  </div>
                  
                  <Button
                    onClick={() => handleDeleteTask(task.id)}
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 p-2"
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              ))}
            </div>
          )}
          
          {/* Task Summary */}
          {tasks.length > 0 && (
            <div className="border-t border-gray-100 p-4 bg-gray-50 rounded-b-lg">
              <div className="flex justify-between text-sm text-gray-600">
                <span>
                  Total tasks: {tasks.length}
                </span>
                <span>
                  Completed: {tasks.filter((task: Task) => task.completed).length}
                </span>
                <span>
                  Remaining: {tasks.filter((task: Task) => !task.completed).length}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-gray-500 text-sm">
          <p>Stay organized, stay productive! 🚀</p>
        </div>
      </div>
    </div>
  );
}

export default App;
