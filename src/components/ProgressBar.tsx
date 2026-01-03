import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Task } from '../types';

interface ProgressBarProps {
  projectId: string;
}

export default function ProgressBar({ projectId }: ProgressBarProps) {
  const [progress, setProgress] = useState(0);
  const [totalTasks, setTotalTasks] = useState(0);
  const [completedTasks, setCompletedTasks] = useState(0);

  useEffect(() => {
    loadProgress();

    const channel = supabase
      .channel(`tasks-${projectId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
          filter: `project_id=eq.${projectId}`,
        },
        () => {
          loadProgress();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId]);

  const loadProgress = async () => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('status')
        .eq('project_id', projectId);

      if (error) throw error;

      const tasks = data || [];
      const total = tasks.length;
      const completed = tasks.filter((t: Task) => t.status === '完了').length;

      setTotalTasks(total);
      setCompletedTasks(completed);
      setProgress(total > 0 ? Math.round((completed / total) * 100) : 0);
    } catch (error) {
      console.error('進捗読み込みエラー:', error);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-neutral-200/50 p-6 mb-6 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-neutral-900">タスク進捗</h3>
        <span className="text-sm text-neutral-600 font-medium">
          {completedTasks} / {totalTasks} タスク完了
        </span>
      </div>
      <div className="w-full bg-neutral-100 rounded-full h-2.5 overflow-hidden">
        <div
          className="bg-gradient-to-r from-primary-600 to-primary-500 h-2.5 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="text-right mt-3">
        <span className="text-2xl font-semibold text-primary-600">{progress}%</span>
      </div>
    </div>
  );
}
