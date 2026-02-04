import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Task } from '../../types';

interface TaskFormProps {
  projectId: string;
  parentId: string | null;
  task?: Task;
  onSave: () => void;
  onCancel: () => void;
}

export default function TaskForm({ projectId, parentId, task, onSave, onCancel }: TaskFormProps) {
  const [formData, setFormData] = useState({
    title: task?.title || '',
    description: task?.description || '',
    status: task?.status || '未着手',
    due_date: task?.due_date || '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      if (task) {
        // タスク更新
        const { error } = await supabase
          .from('tasks')
          .update({ 
            title: formData.title,
            description: formData.description,
            status: formData.status,
            due_date: formData.due_date || null,
            updated_at: new Date().toISOString() 
          })
          .eq('id', task.id);

        if (error) {
          console.error('タスク更新エラー:', error);
          alert(`更新に失敗しました: ${error.message}`);
          setIsSubmitting(false);
          return;
        }
      } else {
        
        // タスク新規作成
const { data: { user } } = await supabase.auth.getUser();
const userId = user?.id || null; // ユーザーがいない場合はnull

const { data: maxOrder } = await supabase
  .from('tasks')
  .select('order_index')
  .eq('project_id', projectId)
  .order('order_index', { ascending: false })
  .limit(1)
  .maybeSingle();

const nextOrder = maxOrder ? maxOrder.order_index + 1 : 0;

const { error } = await supabase.from('tasks').insert({
  title: formData.title,
  description: formData.description,
  status: formData.status,
  project_id: projectId,
  parent_id: parentId,
  order_index: nextOrder,
  due_date: formData.due_date || null,
  user_id: userId,
});

        if (error) {
          console.error('タスク作成エラー:', error);
          alert(`作成に失敗しました: ${error.message}`);
          setIsSubmitting(false);
          return;
        }
      }

      onSave();
    } catch (error) {
      console.error('タスク保存エラー:', error);
      alert('予期しないエラーが発生しました');
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-gray-50 p-4 rounded-lg mb-4 border-2 border-primary-200">
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            タスク名 *
          </label>
          <input
            type="text"
            required
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            placeholder="タスク名を入力"
            disabled={isSubmitting}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            説明
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            rows={2}
            placeholder="タスクの詳細"
            disabled={isSubmitting}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ステータス
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              disabled={isSubmitting}
            >
              <option value="未着手">未着手</option>
              <option value="進行中">進行中</option>
              <option value="完了">完了</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              期限
            </label>
            <input
              type="date"
              value={formData.due_date}
              onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              disabled={isSubmitting}
            />
          </div>
        </div>
        <div className="flex space-x-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 btn-gradient-animated text-white rounded-lg shadow-soft-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? '処理中...' : (task ? '更新' : '追加')}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            キャンセル
          </button>
        </div>
      </div>
    </form>
  );
}