import { useState, useEffect, useRef } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { Project, BrandType } from '../types';
import { Calendar, Copy, Download } from 'lucide-react';

interface ProjectScheduleViewProps {
  user: User;
  activeBrandTab: BrandType;
}

interface ScheduleCell {
  projectId: string;
  date: string;
  content: string;
  backgroundColor: string;
}

export default function ProjectScheduleView({ user, activeBrandTab }: ProjectScheduleViewProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [schedules, setSchedules] = useState<Map<string, ScheduleCell>>(new Map());
  const [dates, setDates] = useState<Date[]>([]);
  const [selectedCell, setSelectedCell] = useState<{ projectId: string; date: string } | null>(null);
  const [editingCell, setEditingCell] = useState<{ projectId: string; date: string } | null>(null);
  const [editValue, setEditValue] = useState('');
  const [showColorPicker, setShowColorPicker] = useState<{ projectId: string; date: string } | null>(null);
  const [selectedColor, setSelectedColor] = useState('#ffffff');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadProjects();
    generateDates();
  }, [activeBrandTab]);

  useEffect(() => {
    if (projects.length > 0) {
      loadSchedules();
    }
  }, [projects]);

  useEffect(() => {
    if (editingCell && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editingCell]);

  const generateDates = () => {
    const today = new Date();
    const datesArray: Date[] = [];
    for (let i = -5; i <= 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      datesArray.push(date);
    }
    setDates(datesArray);
  };

  const loadProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('brand_type', activeBrandTab)
        .order('name', { ascending: true });

      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error('プロジェクト読み込みエラー:', error);
    }
  };

  const loadSchedules = async () => {
    try {
      const projectIds = projects.map(p => p.id);
      const { data, error } = await supabase
        .from('project_schedules')
        .select('*')
        .in('project_id', projectIds);

      if (error) throw error;

      const scheduleMap = new Map<string, ScheduleCell>();
      (data || []).forEach((schedule) => {
        const key = `${schedule.project_id}-${schedule.date}`;
        scheduleMap.set(key, {
          projectId: schedule.project_id,
          date: schedule.date,
          content: schedule.content || '',
          backgroundColor: schedule.background_color || '#ffffff',
        });
      });

      setSchedules(scheduleMap);
    } catch (error) {
      console.error('スケジュール読み込みエラー:', error);
    }
  };

  const getCellKey = (projectId: string, date: Date): string => {
    return `${projectId}-${date.toISOString().split('T')[0]}`;
  };

  const handleCellClick = (projectId: string, date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    setSelectedCell({ projectId, date: dateStr });
  };

  const handleCellDoubleClick = (projectId: string, date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    const key = getCellKey(projectId, date);
    const cell = schedules.get(key);
    
    setEditingCell({ projectId, date: dateStr });
    setEditValue(cell?.content || '');
  };

  const handleCellBlur = async () => {
    if (!editingCell) return;

    const key = `${editingCell.projectId}-${editingCell.date}`;
    const existingCell = schedules.get(key);

    try {
      if (editValue.trim() === '') {
        // 空の場合は削除
        if (existingCell) {
          await supabase
            .from('project_schedules')
            .delete()
            .eq('project_id', editingCell.projectId)
            .eq('date', editingCell.date);
        }
      } else {
        // 更新または作成
        const { error } = await supabase
          .from('project_schedules')
          .upsert({
            project_id: editingCell.projectId,
            date: editingCell.date,
            content: editValue,
            background_color: existingCell?.backgroundColor || '#ffffff',
            user_id: user.id,
          });

        if (error) throw error;
      }

      await loadSchedules();
    } catch (error) {
      console.error('スケジュール保存エラー:', error);
    }

    setEditingCell(null);
    setEditValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent, projectId: string, dateIndex: number) => {
    if (editingCell) {
      if (e.key === 'Enter') {
        handleCellBlur();
      } else if (e.key === 'Escape') {
        setEditingCell(null);
        setEditValue('');
      }
      return;
    }

    // コピー機能（Ctrl+C または Cmd+C）
    if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
      e.preventDefault();
      handleCopy();
      return;
    }

    // セル間の移動
    if (!selectedCell) return;

    const projectIndex = projects.findIndex(p => p.id === selectedCell.projectId);
    
    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault();
        if (projectIndex > 0) {
          setSelectedCell({ 
            projectId: projects[projectIndex - 1].id, 
            date: selectedCell.date 
          });
        }
        break;
      case 'ArrowDown':
        e.preventDefault();
        if (projectIndex < projects.length - 1) {
          setSelectedCell({ 
            projectId: projects[projectIndex + 1].id, 
            date: selectedCell.date 
          });
        }
        break;
      case 'ArrowLeft':
        e.preventDefault();
        if (dateIndex > 0) {
          setSelectedCell({ 
            projectId: selectedCell.projectId, 
            date: dates[dateIndex - 1].toISOString().split('T')[0]
          });
        }
        break;
      case 'ArrowRight':
        e.preventDefault();
        if (dateIndex < dates.length - 1) {
          setSelectedCell({ 
            projectId: selectedCell.projectId, 
            date: dates[dateIndex + 1].toISOString().split('T')[0]
          });
        }
        break;
      case 'Enter':
        e.preventDefault();
        handleCellDoubleClick(selectedCell.projectId, new Date(selectedCell.date));
        break;
      case 'Delete':
      case 'Backspace':
        e.preventDefault();
        handleCellDoubleClick(selectedCell.projectId, new Date(selectedCell.date));
        setEditValue('');
        break;
    }
  };

  const handleCopy = async () => {
    if (!selectedCell) return;

    const key = `${selectedCell.projectId}-${selectedCell.date}`;
    const cell = schedules.get(key);
    if (cell?.content) {
      try {
        await navigator.clipboard.writeText(cell.content);
      } catch (error) {
        console.error('コピーエラー:', error);
      }
    }
  };

  const handlePaste = async (e: React.ClipboardEvent, projectId: string, date: Date) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text');
    const dateStr = date.toISOString().split('T')[0];
    const key = `${projectId}-${dateStr}`;
    const existingCell = schedules.get(key);

    try {
      const { error } = await supabase
        .from('project_schedules')
        .upsert({
          project_id: projectId,
          date: dateStr,
          content: pastedText,
          background_color: existingCell?.backgroundColor || '#ffffff',
          user_id: user.id,
        });

      if (error) throw error;
      await loadSchedules();
    } catch (error) {
      console.error('ペーストエラー:', error);
    }
  };

  const handleColorChange = async (projectId: string, date: Date, color: string) => {
    const dateStr = date.toISOString().split('T')[0];
    const key = `${projectId}-${dateStr}`;
    const existingCell = schedules.get(key);

    try {
      const { error } = await supabase
        .from('project_schedules')
        .upsert({
          project_id: projectId,
          date: dateStr,
          content: existingCell?.content || '',
          background_color: color,
          user_id: user.id,
        });

      if (error) throw error;
      await loadSchedules();
      setShowColorPicker(null);
    } catch (error) {
      console.error('色変更エラー:', error);
    }
  };

  const predefinedColors = [
    '#ffffff', '#fef3c7', '#fecaca', '#fed7aa', '#d9f99d', 
    '#bbf7d0', '#bfdbfe', '#ddd6fe', '#f5d0fe', '#fecdd3',
    '#f3f4f6', '#fde68a', '#fca5a5', '#fdba74', '#bef264',
    '#86efac', '#93c5fd', '#c4b5fd', '#f0abfc', '#fb7185'
  ];

  const getWeekday = (date: Date): string => {
    const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
    return weekdays[date.getDay()];
  };

  const isWeekend = (date: Date): boolean => {
    const day = date.getDay();
    return day === 0 || day === 6;
  };

  const exportToCSV = () => {
    let csv = '事業者名,商品';
    dates.forEach(date => {
      csv += `,${date.getMonth() + 1}/${date.getDate()}`;
    });
    csv += '\n';

    projects.forEach(project => {
      csv += `${project.name},`;
      dates.forEach(date => {
        const key = getCellKey(project.id, date);
        const cell = schedules.get(key);
        const content = cell?.content || '';
        csv += `"${content.replace(/"/g, '""')}",`;
      });
      csv += '\n';
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `schedule_${activeBrandTab}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  if (projects.length === 0) {
    return (
      <div className="text-center py-12 text-neutral-500">
        このブランドにはプロジェクトがありません
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-neutral-200/50 shadow-lg overflow-hidden">
      <div className="p-4 border-b border-neutral-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary-600" />
          <h2 className="text-lg font-semibold text-neutral-900">
            プロジェクトスケジュール
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            disabled={!selectedCell}
            className="p-2 text-neutral-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors disabled:opacity-30"
            title="コピー (Ctrl+C)"
          >
            <Copy className="w-4 h-4" />
          </button>
          <button
            onClick={exportToCSV}
            className="p-2 text-neutral-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
            title="CSVエクスポート"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              <th className="sticky left-0 z-20 bg-neutral-50 border border-neutral-200 px-4 py-2 text-left font-semibold text-neutral-900 min-w-[200px]">
                事業者名
              </th>
              {dates.map((date, index) => (
                <th
                  key={index}
                  className={`border border-neutral-200 px-3 py-2 text-center font-medium min-w-[80px] ${
                    isWeekend(date) ? 'bg-blue-50' : 'bg-neutral-50'
                  }`}
                >
                  <div className="text-xs text-neutral-600">
                    {date.getMonth() + 1}/{date.getDate()}
                  </div>
                  <div className={`text-xs ${isWeekend(date) ? 'text-blue-600' : 'text-neutral-500'}`}>
                    {getWeekday(date)}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {projects.map((project) => (
              <tr key={project.id} className="hover:bg-neutral-50/50">
                <td className="sticky left-0 z-10 bg-white border border-neutral-200 px-4 py-2 font-medium text-neutral-900">
                  {project.name}
                </td>
                {dates.map((date, dateIndex) => {
                  const key = getCellKey(project.id, date);
                  const cell = schedules.get(key);
                  const dateStr = date.toISOString().split('T')[0];
                  const isSelected = selectedCell?.projectId === project.id && selectedCell?.date === dateStr;
                  const isEditing = editingCell?.projectId === project.id && editingCell?.date === dateStr;

                  return (
                    <td
                      key={dateIndex}
                      className={`border border-neutral-200 p-0 cursor-cell relative ${
                        isSelected ? 'ring-2 ring-primary-500 ring-inset' : ''
                      }`}
                      style={{ backgroundColor: cell?.backgroundColor || '#ffffff' }}
                      onClick={() => handleCellClick(project.id, date)}
                      onDoubleClick={() => handleCellDoubleClick(project.id, date)}
                      onPaste={(e) => handlePaste(e, project.id, date)}
                      onKeyDown={(e) => handleKeyDown(e, project.id, dateIndex)}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        setShowColorPicker({ projectId: project.id, date: dateStr });
                        setSelectedColor(cell?.backgroundColor || '#ffffff');
                      }}
                      tabIndex={0}
                    >
                      {isEditing ? (
                        <input
                          ref={inputRef}
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={handleCellBlur}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleCellBlur();
                            } else if (e.key === 'Escape') {
                              setEditingCell(null);
                              setEditValue('');
                            }
                          }}
                          className="w-full h-full px-2 py-1 border-0 focus:outline-none text-center"
                        />
                      ) : (
                        <>
                          <div className="px-2 py-1 min-h-[32px] flex items-center justify-center text-center">
                            {cell?.content || ''}
                          </div>
                          {showColorPicker?.projectId === project.id && showColorPicker?.date === dateStr && (
                            <div
                              className="absolute z-50 bg-white border border-neutral-300 rounded-lg shadow-xl p-3 top-full left-0 mt-1"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div className="grid grid-cols-5 gap-2 mb-2">
                                {predefinedColors.map((color) => (
                                  <button
                                    key={color}
                                    onClick={() => handleColorChange(project.id, date, color)}
                                    className="w-8 h-8 rounded border-2 border-neutral-300 hover:border-primary-500 transition-colors"
                                    style={{ backgroundColor: color }}
                                    title={color}
                                  />
                                ))}
                              </div>
                              <button
                                onClick={() => setShowColorPicker(null)}
                                className="w-full px-3 py-1.5 text-xs bg-neutral-100 hover:bg-neutral-200 rounded transition-colors"
                              >
                                閉じる
                              </button>
                            </div>
                          )}
                        </>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="p-3 border-t border-neutral-200 bg-neutral-50 text-xs text-neutral-600">
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          <span>• ダブルクリックで編集</span>
          <span>• 右クリックで色選択</span>
          <span>• 矢印キーで移動</span>
          <span>• Enterで編集開始</span>
          <span>• Ctrl+C でコピー</span>
          <span>• Ctrl+V でペースト</span>
        </div>
      </div>
    </div>
  );
}