import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Schedule, Task } from '../../types';
import { CalendarClock, Plus, Edit2, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { useAccordionState } from '../../hooks/useAccordionState';

interface ScheduleSectionProps {
  projectId: string;
  readOnly?: boolean;
}

export default function ScheduleSection({ projectId, readOnly = false }: ScheduleSectionProps) {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [upcomingTasks, setUpcomingTasks] = useState<Task[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ content: '', milestone: '' });
  const { isExpanded, toggleExpanded, setExpandedWithSave } = useAccordionState(projectId, 'schedule', true);

  useEffect(() => {
    loadSchedules();
    loadUpcomingTasks();
  }, [projectId]);

  const loadSchedules = async () => {
  const { data } = await supabase
    .from('schedules')
    .select('*')
    .eq('project_id', projectId)
    .order('order_index', { ascending: true })
    .order('id', { ascending: true });

  setSchedules(data || []);
};

  const loadUpcomingTasks = async () => {
    const { data } = await supabase
      .from('tasks')
      .select('*')
      .eq('project_id', projectId)
      .not('due_date', 'is', null)
      .neq('status', '完了')
      .order('due_date', { ascending: true })
      .limit(5);

    setUpcomingTasks(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingId) {
        // 編集時は更新のみで、created_atは変更しない
        await supabase
          .from('schedules')
          .update({
            content: formData.content,
            milestone: formData.milestone
          })
          .eq('id', editingId);
      } else {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  // 最大の order_index を取得
  const { data: maxOrder } = await supabase
    .from('schedules')
    .select('order_index')
    .eq('project_id', projectId)
    .order('order_index', { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextOrder = maxOrder ? maxOrder.order_index + 1 : 0;

  await supabase
    .from('schedules')
    .insert({ 
      ...formData, 
      project_id: projectId, 
      user_id: user.id,
      order_index: nextOrder
    });
}

      setFormData({ content: '', milestone: '' });
      setIsAdding(false);
      setEditingId(null);
      loadSchedules();
    } catch (error) {
      console.error('スケジュール保存エラー:', error);
    }
  };

  const handleEdit = (schedule: Schedule) => {
    setFormData({ content: schedule.content, milestone: schedule.milestone });
    setEditingId(schedule.id);
    setIsAdding(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('削除してもよろしいですか?')) {
      await supabase.from('schedules').delete().eq('id', id);
      loadSchedules();
    }
  };

  const handleMoveUp = async (schedule: Schedule, index: number) => {
  if (index === 0) return; // 一番上は上に移動できない

  const prevSchedule = schedules[index - 1];
  
  // order_index を入れ替え
  await supabase
    .from('schedules')
    .update({ order_index: prevSchedule.order_index })
    .eq('id', schedule.id);
    
  await supabase
    .from('schedules')
    .update({ order_index: schedule.order_index })
    .eq('id', prevSchedule.id);
    
  loadSchedules();
};

const handleMoveDown = async (schedule: Schedule, index: number) => {
  if (index === schedules.length - 1) return; // 一番下は下に移動できない

  const nextSchedule = schedules[index + 1];
  
  // order_index を入れ替え
  await supabase
    .from('schedules')
    .update({ order_index: nextSchedule.order_index })
    .eq('id', schedule.id);
    
  await supabase
    .from('schedules')
    .update({ order_index: schedule.order_index })
    .eq('id', nextSchedule.id);
    
  loadSchedules();
};
  
  return (
    <section className="border-b border-neutral-200/80 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3">
        <button
          onClick={toggleExpanded}
          className="flex items-center text-lg sm:text-xl font-bold text-gray-900 hover:text-gray-700 transition-colors"
        >
          <CalendarClock className="w-5 h-5 sm:w-6 sm:h-6 mr-2 text-primary-600" />
          スケジュール
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 sm:w-5 sm:h-5 ml-2 text-gray-500" />
          ) : (
            <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5 ml-2 text-gray-500" />
          )}
        </button>
        {!readOnly && (
          <button
            onClick={() => {
              if (!isExpanded) setExpandedWithSave(true);
              setIsAdding(!isAdding);
            }}
            className="flex items-center justify-center px-4 py-2 text-sm btn-gradient-animated text-white font-medium rounded-lg hover:shadow-soft-lg"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            追加
          </button>
        )}
      </div>

      {isExpanded && (
        <>
          {isAdding && (
            <form onSubmit={handleSubmit} className="bg-neutral-50 p-6 rounded-xl mb-6 border border-neutral-200/50">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2.5">
                    自由記述
                  </label>
                  <textarea
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-100 focus:border-primary-500 bg-white resize-none"
                    rows={2}
                    placeholder="例: 掲載開始：1月中旬"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2.5">
                    マイルストーン
                  </label>
                  <input
                    type="text"
                    value={formData.milestone}
                    onChange={(e) => setFormData({ ...formData, milestone: e.target.value })}
                    className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-100 focus:border-primary-500 bg-white"
                    placeholder="例: 第1フェーズ完了"
                  />
                </div>
                <div className="flex space-x-3 pt-3">
                  <button
                    type="submit"
                    className="px-6 py-2.5 btn-gradient-animated text-white font-medium rounded-lg hover:shadow-soft-lg"
                  >
                    {editingId ? '更新' : '追加'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAdding(false);
                      setEditingId(null);
                      setFormData({ content: '', milestone: '' });
                    }}
                    className="px-6 py-2.5 bg-white border border-neutral-300 text-neutral-700 font-medium rounded-lg hover:bg-neutral-50"
                  >
                    キャンセル
                  </button>
                </div>
              </div>
            </form>
          )}

          <div className="space-y-3">
            {schedules.map((schedule) => (
              <div key={schedule.id} className="bg-white border border-neutral-200/60 p-5 rounded-xl hover:border-neutral-300 hover:shadow-soft transition-all group">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    {schedule.content && (
  <p className="text-neutral-700 mb-2 leading-relaxed whitespace-pre-wrap">{schedule.content}</p>
)}
                    {schedule.milestone && (
                      <p className="text-sm font-semibold text-primary-600">
                        {schedule.milestone}
                      </p>
                    )}
                  </div>
                  {!readOnly && (
  <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
    <button
      onClick={() => handleMoveUp(schedule, index)}
      disabled={index === 0}
      className="p-2 text-neutral-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
      title="上に移動"
    >
      <ChevronUp className="w-4 h-4" />
    </button>
    <button
      onClick={() => handleMoveDown(schedule, index)}
      disabled={index === schedules.length - 1}
      className="p-2 text-neutral-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
      title="下に移動"
    >
      <ChevronDown className="w-4 h-4" />
    </button>
    <button
      onClick={() => handleEdit(schedule)}
      className="p-2 text-neutral-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
    >
      <Edit2 className="w-4 h-4" />
    </button>
    <button
      onClick={() => handleDelete(schedule.id)}
      className="p-2 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
    >
      <Trash2 className="w-4 h-4" />
    </button>
  </div>
)}
                </div>
              </div>
            ))}

            {upcomingTasks.length > 0 && (
              <div className="mt-8">
                <h3 className="text-sm font-semibold text-neutral-900 mb-4">
                  直近のタスク期限
                </h3>
                <div className="space-y-2">
                  {upcomingTasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center justify-between bg-amber-50/80 border border-amber-200/50 px-4 py-3 rounded-xl hover:bg-amber-50 transition-colors"
                    >
                      <span className="text-sm font-medium text-neutral-700">{task.title}</span>
                      <span className="text-sm font-semibold text-amber-700">
                        {task.due_date && new Date(task.due_date).toLocaleDateString('ja-JP')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </section>
  );
}