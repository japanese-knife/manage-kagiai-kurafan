import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Task } from '../types';
import { Plus, ChevronDown, ChevronRight } from 'lucide-react';
import TaskItem from './tasks/TaskItem';
import TaskForm from './tasks/TaskForm';

interface TasksTabProps {
  projectId: string;
  readOnly?: boolean;
}

export default function TasksTab({ projectId, readOnly = false }: TasksTabProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [parentId, setParentId] = useState<string | null>(null);

  useEffect(() => {
    loadTasks();
  }, [projectId]);

  const loadTasks = async () => {
    const { data } = await supabase
      .from('tasks')
      .select('*')
      .eq('project_id', projectId)
      .order('order_index', { ascending: true });

    if (data) {
      const hierarchicalTasks = buildHierarchy(data);
      setTasks(hierarchicalTasks);
    }
  };

  const buildHierarchy = (flatTasks: Task[]): Task[] => {
    const taskMap = new Map<string, Task>();
    const rootTasks: Task[] = [];

    flatTasks.forEach((task) => {
      taskMap.set(task.id, { ...task, children: [] });
    });

    flatTasks.forEach((task) => {
      const taskNode = taskMap.get(task.id)!;
      if (task.parent_id) {
        const parent = taskMap.get(task.parent_id);
        if (parent) {
          parent.children = parent.children || [];
          parent.children.push(taskNode);
        } else {
          rootTasks.push(taskNode);
        }
      } else {
        rootTasks.push(taskNode);
      }
    });

    return rootTasks;
  };

  const handleAddTask = (pid: string | null = null) => {
    setParentId(pid);
    setIsAdding(true);
  };

  const handleTaskSaved = () => {
    setIsAdding(false);
    setParentId(null);
    loadTasks();
  };

  const handleTaskDeleted = () => {
    loadTasks();
  };

  const handleTaskUpdated = () => {
    loadTasks();
  };

  const calculateProgress = () => {
    const flatTasks: Task[] = [];
    const flatten = (tasks: Task[]) => {
      tasks.forEach((task) => {
        flatTasks.push(task);
        if (task.children && task.children.length > 0) {
          flatten(task.children);
        }
      });
    };
    flatten(tasks);

    const total = flatTasks.length;
    const completed = flatTasks.filter((t) => t.status === '完了').length;

    return { total, completed };
  };

  const { total, completed } = calculateProgress();

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">タスク一覧</h2>
          <p className="text-sm text-gray-600 mt-1">
            完了: {completed} / {total} タスク
          </p>
        </div>
        {!readOnly && (
  <button
    onClick={() => handleAddTask(null)}
    className="flex items-center px-4 py-2 btn-gradient-animated text-white rounded-lg shadow-soft-lg"
  >
    <Plus className="w-5 h-5 mr-2" />
    タスクを追加
  </button>
)}
      </div>

      {isAdding && (
  <TaskForm
    projectId={projectId}
    parentId={parentId}
    onSave={handleTaskSaved}
    onCancel={() => {
      setIsAdding(false);
      setParentId(null);
    }}
  />
)}

      <div className="space-y-2">
        {tasks.map((task) => (
          <TaskItem
  key={task.id}
  task={task}
  onAddChild={handleAddTask}
  onDelete={handleTaskDeleted}
  onUpdate={handleTaskUpdated}
  readOnly={false}
/>
        ))}
      </div>

      {tasks.length === 0 && !isAdding && (
        <div className="text-center py-12 text-gray-500">
          タスクがありません。タスクを追加してください。
        </div>
      )}
    </div>
  );
}
