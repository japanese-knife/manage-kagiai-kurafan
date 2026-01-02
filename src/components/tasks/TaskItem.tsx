import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Task } from '../../types';
import { ChevronDown, ChevronRight, Plus, Edit2, Trash2, Calendar } from 'lucide-react';
import TaskForm from './TaskForm';

interface TaskItemProps {
  task: Task;
  level?: number;
  onAddChild: (parentId: string) => void;
  onDelete: () => void;
  onUpdate: () => void;
  readOnly?: boolean;
}

export default function TaskItem({ task, level = 0, onAddChild, onDelete, onUpdate, readOnly = false }: TaskItemProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isAddingChild, setIsAddingChild] = useState(false);

  const hasChildren = task.children && task.children.length > 0;

  const handleDelete = async () => {
    if (confirm('このタスクを削除しますか?')) {
      await supabase.from('tasks').delete().eq('id', task.id);
      onDelete();
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    await supabase
      .from('tasks')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', task.id);
    onUpdate();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case '完了':
        return 'bg-green-100 text-green-700';
      case '進行中':
        return 'bg-primary-100 text-primary-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const handleTaskSaved = () => {
    setIsEditing(false);
    setIsAddingChild(false);
    onUpdate();
  };

  const paddingLeft = level * 32;

  if (isEditing) {
    return (
      <div style={{ paddingLeft: `${paddingLeft}px` }}>
        <TaskForm
          projectId={task.project_id}
          parentId={task.parent_id}
          task={task}
          onSave={handleTaskSaved}
          onCancel={() => setIsEditing(false)}
        />
      </div>
    );
  }

  return (
    <div>
      <div
        className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
        style={{ marginLeft: `${paddingLeft}px` }}
      >
        <div className="flex items-start space-x-3">
          {hasChildren && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="mt-1 text-gray-500 hover:text-gray-700"
            >
              {isExpanded ? (
                <ChevronDown className="w-5 h-5" />
              ) : (
                <ChevronRight className="w-5 h-5" />
              )}
            </button>
          )}
          {!hasChildren && <div className="w-5" />}

          <div className="flex-1">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">{task.title}</h3>
                {task.description && (
                  <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                )}
              </div>
              <div className="flex items-center space-x-2 ml-4">
                {readOnly ? (
                  <span className={`px-2 py-1 text-xs font-medium rounded ${getStatusColor(task.status)}`}>
                    {task.status}
                  </span>
                ) : (
                  <select
                    value={task.status}
                    onChange={(e) => handleStatusChange(e.target.value)}
                    className={`px-2 py-1 text-xs font-medium rounded ${getStatusColor(
                      task.status
                    )}`}
                  >
                    <option value="未着手">未着手</option>
                    <option value="進行中">進行中</option>
                    <option value="完了">完了</option>
                  </select>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {task.due_date && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="w-4 h-4 mr-1" />
                    {new Date(task.due_date).toLocaleDateString('ja-JP')}
                  </div>
                )}
              </div>

              {!readOnly && (
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => setIsAddingChild(true)}
                    className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                    title="サブタスクを追加"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                    title="編集"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleDelete}
                    className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded"
                    title="削除"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {isAddingChild && (
        <div style={{ marginLeft: `${paddingLeft + 32}px` }} className="mt-2">
          <TaskForm
            projectId={task.project_id}
            parentId={task.id}
            onSave={handleTaskSaved}
            onCancel={() => setIsAddingChild(false)}
          />
        </div>
      )}

      {isExpanded && hasChildren && (
        <div className="mt-2 space-y-2">
          {task.children!.map((child) => (
            <TaskItem
              key={child.id}
              task={child}
              level={level + 1}
              onAddChild={onAddChild}
              onDelete={onDelete}
              onUpdate={onUpdate}
              readOnly={readOnly}
            />
          ))}
        </div>
      )}
    </div>
  );
}
