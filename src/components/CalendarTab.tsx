import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Task } from '../types';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

interface CalendarTabProps {
  projectId: string;
}

export default function CalendarTab({ projectId }: CalendarTabProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    loadTasks();
  }, [projectId]);

  const loadTasks = async () => {
    const { data } = await supabase
      .from('tasks')
      .select('*')
      .eq('project_id', projectId)
      .not('due_date', 'is', null);

    setTasks(data || []);
  };

  const getTasksForDate = (date: Date): Task[] => {
    const dateStr = date.toISOString().split('T')[0];
    return tasks.filter((task) => task.due_date === dateStr);
  };

  const getDaysInMonth = (date: Date): Date[] => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();

    const days: Date[] = [];

    const firstDayOfWeek = firstDay.getDay();
    for (let i = 0; i < firstDayOfWeek; i++) {
      const prevDate = new Date(year, month, -i);
      days.unshift(prevDate);
    }

    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }

    const remainingDays = 7 - (days.length % 7);
    if (remainingDays < 7) {
      for (let i = 1; i <= remainingDays; i++) {
        days.push(new Date(year, month + 1, i));
      }
    }

    return days;
  };

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const isToday = (date: Date): boolean => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const isCurrentMonth = (date: Date): boolean => {
    return date.getMonth() === currentDate.getMonth();
  };

  const days = getDaysInMonth(currentDate);
  const weekDays = ['日', '月', '火', '水', '木', '金', '土'];

  const selectedTasks = selectedDate ? getTasksForDate(selectedDate) : [];

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          {currentDate.getFullYear()}年 {currentDate.getMonth() + 1}月
        </h2>
        <div className="flex space-x-2">
          <button
            onClick={goToPreviousMonth}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => setCurrentDate(new Date())}
            className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg"
          >
            今月
          </button>
          <button
            onClick={goToNextMonth}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2 mb-2">
        {weekDays.map((day) => (
          <div
            key={day}
            className="text-center text-sm font-semibold text-gray-700 py-2"
          >
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2 mb-6">
        {days.map((date, index) => {
          const dayTasks = getTasksForDate(date);
          const completedTasks = dayTasks.filter((t) => t.status === '完了').length;
          const incompleteTasks = dayTasks.length - completedTasks;

          return (
            <button
              key={index}
              onClick={() => {
                if (dayTasks.length > 0) {
                  setSelectedDate(date);
                  setIsModalOpen(true);
                }
              }}
              className={`
                min-h-28 p-2 rounded-lg border transition-all flex flex-col items-center
                ${
                  isToday(date)
                    ? 'border-primary-400 bg-primary-50'
                    : 'border-neutral-200/50 hover:border-primary-300'
                }
                ${!isCurrentMonth(date) ? 'opacity-40' : ''}
                ${dayTasks.length > 0 ? 'cursor-pointer hover:shadow-lg' : 'cursor-default'}
              `}
            >
              <div
                className={`text-sm font-medium mb-2 ${
                  isToday(date) ? 'text-primary-600' : 'text-gray-700'
                }`}
              >
                {date.getDate()}
              </div>
              {dayTasks.length > 0 && (
                <div className="space-y-1 w-full">
                  {dayTasks.slice(0, 2).map((task) => (
                    <div
                      key={task.id}
                      className={`text-xs px-1.5 py-0.5 rounded truncate ${
                        task.status === '完了'
                          ? 'bg-green-100 text-green-700'
                          : task.status === '進行中'
                          ? 'bg-primary-100 text-primary-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}
                      title={task.title}
                    >
                      {task.title}
                    </div>
                  ))}
                  {dayTasks.length > 2 && (
                    <div className="text-xs text-gray-500 px-1.5">
                      +{dayTasks.length - 2}件
                    </div>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {isModalOpen && selectedDate && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900">
                {selectedDate.toLocaleDateString('ja-JP', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
                のタスク
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(80vh-100px)]">
              {selectedTasks.length > 0 ? (
                <div className="space-y-3">
                  {selectedTasks.map((task) => (
                    <div
                      key={task.id}
                      className="bg-gray-50 p-4 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 mb-1">
                            {task.title}
                          </h4>
                          {task.description && (
                            <p className="text-sm text-gray-600 mt-2 whitespace-pre-wrap">
                              {task.description}
                            </p>
                          )}
                        </div>
                        <span
                          className={`ml-3 px-3 py-1 text-xs font-medium rounded-full whitespace-nowrap ${
                            task.status === '完了'
                              ? 'bg-green-100 text-green-700'
                              : task.status === '進行中'
                              ? 'bg-primary-100 text-primary-700'
                              : 'bg-yellow-100 text-yellow-700'
                          }`}
                        >
                          {task.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">
                  この日のタスクはありません
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
