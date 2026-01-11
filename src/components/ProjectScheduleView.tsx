import { useState, useEffect, useRef } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { Project, BrandType } from '../types';
import { Calendar, Copy, Download } from 'lucide-react';

interface ProjectScheduleViewProps {
  user: User;
  activeBrandTab: BrandType | 'all';
  viewType: 'daily' | 'monthly';
}

interface ScheduleCell {
  projectId: string;
  date: string;
  content: string;
  backgroundColor: string;
  textColor: string;
}

export default function ProjectScheduleView({ user, activeBrandTab, viewType }: ProjectScheduleViewProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [schedules, setSchedules] = useState<Map<string, ScheduleCell>>(new Map());
  const [dates, setDates] = useState<Date[]>([]);
  const [selectedCell, setSelectedCell] = useState<{ projectId: string; date: string } | null>(null);
const [selectedCells, setSelectedCells] = useState<Set<string>>(new Set());
const [isMultiSelecting, setIsMultiSelecting] = useState(false);
const [selectionStart, setSelectionStart] = useState<{ projectId: string; date: string } | null>(null);
  const [editingCell, setEditingCell] = useState<{ projectId: string; date: string } | null>(null);
  const [editValue, setEditValue] = useState('');
  const [showColorPicker, setShowColorPicker] = useState<{ projectId: string; date: string } | null>(null);
  const [selectedColor, setSelectedColor] = useState('#ffffff');
  const [copiedCellData, setCopiedCellData] = useState<{ content: string; backgroundColor: string; textColor: string } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadProjects();
    generateDates();
  }, [activeBrandTab, viewType]);

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

const hasScrolledToToday = useRef(false);

useEffect(() => {
  // 日次ビューで初回読み込み時のみ当日の列を中央に配置
  if (viewType === 'daily' && dates.length > 0 && !hasScrolledToToday.current) {
    const todayIndex = dates.findIndex(date => isToday(date));
    if (todayIndex !== -1) {
      hasScrolledToToday.current = true;
      setTimeout(() => {
        const tableContainer = document.querySelector('.overflow-x-auto');
        const todayHeader = document.querySelectorAll('thead th')[todayIndex + 1]; // +1 は「事業者名」列の分
        
        if (tableContainer && todayHeader) {
          const containerWidth = tableContainer.clientWidth;
          const headerLeft = (todayHeader as HTMLElement).offsetLeft;
          const headerWidth = (todayHeader as HTMLElement).offsetWidth;
          
          // 当日の列を中央に配置
          const scrollLeft = headerLeft - (containerWidth / 2) + (headerWidth / 2);
          tableContainer.scrollLeft = scrollLeft;
        }
      }, 100);
    }
  }
}, [dates.length, viewType]);

// viewTypeが変わったらリセット
useEffect(() => {
  hasScrolledToToday.current = false;
}, [viewType]);

  const generateDates = () => {
    if (viewType === 'monthly') {
      // 月次ビュー: 今月から12ヶ月分
      const today = new Date();
      const datesArray: Date[] = [];
      for (let i = 0; i < 12; i++) {
        const date = new Date(today.getFullYear(), today.getMonth() + i, 1);
        datesArray.push(date);
      }
      setDates(datesArray);
    } else {
      // 日次ビュー: 過去30日から未来60日
      const today = new Date();
      const datesArray: Date[] = [];
      for (let i = -30; i <= 60; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        datesArray.push(date);
      }
      setDates(datesArray);
    }
  };

  const loadProjects = async () => {
    try {
      let query = supabase
        .from('projects')
        .select('*');
      
      // 'all'の場合は両方のブランドを取得
      if (activeBrandTab !== 'all') {
        query = query.eq('brand_type', activeBrandTab);
      }
      
      const { data, error } = await query.order('name', { ascending: true });

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
        const bgColor = schedule.background_color || '#ffffff';
        // 背景色に応じて文字色を自動設定
        const autoTextColor = getTextColorForBackground(bgColor);
        scheduleMap.set(key, {
          projectId: schedule.project_id,
          date: schedule.date,
          content: schedule.content || '',
          backgroundColor: bgColor,
          textColor: schedule.text_color || autoTextColor,
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

  const getTextColorForBackground = (bgColor: string): string => {
    // 背景色の明度に基づいて文字色を決定
    const hex = bgColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 155 ? '#000000' : '#ffffff';
  };

  const handleCellClick = (projectId: string, date: Date, e?: React.MouseEvent) => {
  const dateStr = date.toISOString().split('T')[0];
  const cellKey = `${projectId}-${dateStr}`;
  
  if (e?.shiftKey && selectedCell) {
    // Shiftキーで範囲選択
    handleRangeSelection(projectId, dateStr);
  } else if (e?.ctrlKey || e?.metaKey) {
    // Ctrl/Cmdキーで複数選択
    const newSelectedCells = new Set(selectedCells);
    if (newSelectedCells.has(cellKey)) {
      newSelectedCells.delete(cellKey);
    } else {
      newSelectedCells.add(cellKey);
    }
    setSelectedCells(newSelectedCells);
    setSelectedCell({ projectId, date: dateStr });
  } else {
    // 通常選択
    setSelectedCell({ projectId, date: dateStr });
    setSelectedCells(new Set([cellKey]));
  }
};

const handleRangeSelection = (endProjectId: string, endDate: string) => {
  if (!selectedCell) return;
  
  const startProjectIndex = projects.findIndex(p => p.id === selectedCell.projectId);
  const endProjectIndex = projects.findIndex(p => p.id === endProjectId);
  const startDateIndex = dates.findIndex(d => d.toISOString().split('T')[0] === selectedCell.date);
  const endDateIndex = dates.findIndex(d => d.toISOString().split('T')[0] === endDate);
  
  const minProjectIndex = Math.min(startProjectIndex, endProjectIndex);
  const maxProjectIndex = Math.max(startProjectIndex, endProjectIndex);
  const minDateIndex = Math.min(startDateIndex, endDateIndex);
  const maxDateIndex = Math.max(startDateIndex, endDateIndex);
  
  const newSelectedCells = new Set<string>();
  for (let pIndex = minProjectIndex; pIndex <= maxProjectIndex; pIndex++) {
    for (let dIndex = minDateIndex; dIndex <= maxDateIndex; dIndex++) {
      const cellKey = `${projects[pIndex].id}-${dates[dIndex].toISOString().split('T')[0]}`;
      newSelectedCells.add(cellKey);
    }
  }
  
  setSelectedCells(newSelectedCells);
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
          
          // ローカルステートから削除
          const updatedSchedules = new Map(schedules);
          updatedSchedules.delete(key);
          setSchedules(updatedSchedules);
        }
      } else {
        // 更新または作成
        const bgColor = existingCell?.backgroundColor || '#ffffff';
        const txtColor = existingCell?.textColor || getTextColorForBackground(bgColor);
        
        const updateData: any = {
          project_id: editingCell.projectId,
          date: editingCell.date,
          content: editValue,
          background_color: bgColor,
          text_color: txtColor,
          user_id: user.id,
        };

        const { error } = await supabase
          .from('project_schedules')
          .upsert(updateData, {
            onConflict: 'project_id,date'
          });

        if (error) throw error;
        
        // ローカルステートを即座に更新
        const updatedSchedules = new Map(schedules);
        updatedSchedules.set(key, {
          projectId: editingCell.projectId,
          date: editingCell.date,
          content: editValue,
          backgroundColor: bgColor,
          textColor: txtColor,
        });
        setSchedules(updatedSchedules);
      }
    } catch (error) {
      console.error('スケジュール保存エラー:', error);
      alert('スケジュールの保存に失敗しました');
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
  // コピー機能（Ctrl+C または Cmd+C）
if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
  e.preventDefault();
  handleCopy();
  return;
}

// 全選択解除（Escape）
if (e.key === 'Escape' && !editingCell) {
  e.preventDefault();
  setSelectedCells(new Set());
  setSelectedCell(null);
  return;
}

  // セルが選択されていない場合は現在のセルを選択
  if (!selectedCell) {
    const dateStr = dates[dateIndex].toISOString().split('T')[0];
    setSelectedCell({ projectId, date: dateStr });
    return;
  }

  const currentProjectIndex = projects.findIndex(p => p.id === selectedCell.projectId);
  const currentDateIndex = dates.findIndex(d => d.toISOString().split('T')[0] === selectedCell.date);
  
  switch (e.key) {
    case 'ArrowUp':
      e.preventDefault();
      if (currentProjectIndex > 0) {
        setSelectedCell({ 
          projectId: projects[currentProjectIndex - 1].id, 
          date: selectedCell.date 
        });
        // 選択されたセルにフォーカスを移動
        setTimeout(() => {
          const newCell = document.querySelector(
            `[data-cell-id="${projects[currentProjectIndex - 1].id}-${selectedCell.date}"]`
          ) as HTMLElement;
          newCell?.focus();
        }, 0);
      }
      break;
    case 'ArrowDown':
      e.preventDefault();
      if (currentProjectIndex < projects.length - 1) {
        setSelectedCell({ 
          projectId: projects[currentProjectIndex + 1].id, 
          date: selectedCell.date 
        });
        // 選択されたセルにフォーカスを移動
        setTimeout(() => {
          const newCell = document.querySelector(
            `[data-cell-id="${projects[currentProjectIndex + 1].id}-${selectedCell.date}"]`
          ) as HTMLElement;
          newCell?.focus();
        }, 0);
      }
      break;
    case 'ArrowLeft':
      e.preventDefault();
      if (currentDateIndex > 0) {
        const newDate = dates[currentDateIndex - 1].toISOString().split('T')[0];
        setSelectedCell({ 
          projectId: selectedCell.projectId, 
          date: newDate
        });
        // 選択されたセルにフォーカスを移動
        setTimeout(() => {
          const newCell = document.querySelector(
            `[data-cell-id="${selectedCell.projectId}-${newDate}"]`
          ) as HTMLElement;
          newCell?.focus();
        }, 0);
      }
      break;
    case 'ArrowRight':
      e.preventDefault();
      if (currentDateIndex < dates.length - 1) {
        const newDate = dates[currentDateIndex + 1].toISOString().split('T')[0];
        setSelectedCell({ 
          projectId: selectedCell.projectId, 
          date: newDate
        });
        // 選択されたセルにフォーカスを移動
        setTimeout(() => {
          const newCell = document.querySelector(
            `[data-cell-id="${selectedCell.projectId}-${newDate}"]`
          ) as HTMLElement;
          newCell?.focus();
        }, 0);
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
  if (selectedCells.size === 0) return;

  try {
    // 選択されたセルのデータを取得
    const cellsData = Array.from(selectedCells).map(key => {
      const cell = schedules.get(key);
      return {
        key,
        content: cell?.content || '',
        backgroundColor: cell?.backgroundColor || '#ffffff',
        textColor: cell?.textColor || '#000000'
      };
    });
    
    // 複数セルのデータを保存（色情報も含む）
    setCopiedCellData({
      content: cellsData.map(c => c.content).join('\t'),
      backgroundColor: cellsData[0].backgroundColor,
      textColor: cellsData[0].textColor,
      isMultiple: selectedCells.size > 1,
      cellsData: cellsData
    } as any);
    
    // クリップボードにはテキストのみ
    await navigator.clipboard.writeText(cellsData.map(c => c.content).join('\t'));
  } catch (error) {
    console.error('コピーエラー:', error);
  }
};

  const handlePaste = async (e: React.ClipboardEvent, projectId: string, date: Date) => {
  e.preventDefault();
  
  // 複数セル選択時は選択されたすべてのセルにペースト
  const targetCells = selectedCells.size > 0 ? Array.from(selectedCells) : [`${projectId}-${date.toISOString().split('T')[0]}`];

  try {
    if (copiedCellData && (copiedCellData as any).isMultiple && (copiedCellData as any).cellsData) {
      // 複数セルのコピーデータをペースト
      const cellsData = (copiedCellData as any).cellsData;
      
      for (const targetKey of targetCells) {
        const [targetProjectId, targetDateStr] = targetKey.split('-');
        // 各セルに最初のセルのデータを適用
        const sourceData = cellsData[0];
        
        const updateData: any = {
          project_id: targetProjectId,
          date: targetDateStr,
          content: sourceData.content,
          background_color: sourceData.backgroundColor,
          text_color: sourceData.textColor,
          user_id: user.id,
        };

        await supabase
          .from('project_schedules')
          .upsert(updateData, {
            onConflict: 'project_id,date'
          });
      }
    } else if (copiedCellData) {
      // 単一セルのコピーデータをペースト
      for (const targetKey of targetCells) {
        const [targetProjectId, targetDateStr] = targetKey.split('-');
        
        const updateData: any = {
          project_id: targetProjectId,
          date: targetDateStr,
          content: copiedCellData.content,
          background_color: copiedCellData.backgroundColor,
          text_color: copiedCellData.textColor,
          user_id: user.id,
        };

        await supabase
          .from('project_schedules')
          .upsert(updateData, {
            onConflict: 'project_id,date'
          });
      }
    } else {
      // クリップボードからテキストを取得してペースト
      const content = e.clipboardData.getData('text');
      const backgroundColor = '#ffffff';
      const textColor = getTextColorForBackground(backgroundColor);
      
      for (const targetKey of targetCells) {
        const [targetProjectId, targetDateStr] = targetKey.split('-');
        
        const updateData: any = {
          project_id: targetProjectId,
          date: targetDateStr,
          content: content,
          background_color: backgroundColor,
          text_color: textColor,
          user_id: user.id,
        };

        await supabase
          .from('project_schedules')
          .upsert(updateData);
      }
    }

    await loadSchedules();
  } catch (error) {
    console.error('ペーストエラー:', error);
  }
};

  const handleColorChange = async (projectId: string, date: Date, color: string, textColor: string) => {
  const dateStr = date.toISOString().split('T')[0];
  const clickedCellKey = `${projectId}-${dateStr}`;
  
  // 複数セル選択時はすべてのセルの色を変更、未選択の場合はクリックしたセルのみ
  const targetCells = selectedCells.size > 0 && selectedCells.has(clickedCellKey) 
    ? Array.from(selectedCells) 
    : [clickedCellKey];

  try {
    const updatedSchedules = new Map(schedules);
    
    for (const cellKey of targetCells) {
      // cellKeyの形式を確認してパース
      const parts = cellKey.split('-');
      // 日付部分は最後の3つ（YYYY-MM-DD）
      const targetDateStr = parts.slice(-3).join('-');
      const targetProjectId = parts.slice(0, -3).join('-');
      
      const existingCell = schedules.get(cellKey);
      
      const updateData: any = {
        project_id: targetProjectId,
        date: targetDateStr,
        content: existingCell?.content || '',
        background_color: color,
        text_color: textColor,
        user_id: user.id,
      };

      const { error } = await supabase
        .from('project_schedules')
        .upsert(updateData, {
          onConflict: 'project_id,date'
        });

      if (error) {
        console.error('Supabaseエラー詳細:', error);
        throw error;
      }
      
      // ローカルステートを更新
      updatedSchedules.set(cellKey, {
        projectId: targetProjectId,
        date: targetDateStr,
        content: existingCell?.content || '',
        backgroundColor: color,
        textColor: textColor,
      });
    }
    
    setSchedules(updatedSchedules);
    setShowColorPicker(null);
  } catch (error) {
    console.error('色変更エラー:', error);
    alert(`色の変更に失敗しました: ${error instanceof Error ? error.message : '不明なエラー'}`);
  }
};

  const predefinedColors = [
    { name: '白', color: '#ffffff', textColor: '#000000' },
    { name: '淡黄', color: '#fef3c7', textColor: '#000000' },
    { name: '淡赤', color: '#fecaca', textColor: '#000000' },
    { name: '淡橙', color: '#fed7aa', textColor: '#000000' },
    { name: '淡緑黄', color: '#d9f99d', textColor: '#000000' },
    { name: '淡緑', color: '#bbf7d0', textColor: '#000000' },
    { name: '淡青', color: '#bfdbfe', textColor: '#000000' },
    { name: '淡紫', color: '#ddd6fe', textColor: '#000000' },
    { name: '淡桃', color: '#f5d0fe', textColor: '#000000' },
    { name: '淡ピンク', color: '#fecdd3', textColor: '#000000' },
    { name: 'グレー', color: '#f3f4f6', textColor: '#000000' },
    { name: '黄', color: '#fde68a', textColor: '#000000' },
    { name: '赤', color: '#fca5a5', textColor: '#000000' },
    { name: '橙', color: '#fdba74', textColor: '#000000' },
    { name: '黄緑', color: '#bef264', textColor: '#000000' },
    { name: '緑', color: '#86efac', textColor: '#000000' },
    { name: '青', color: '#93c5fd', textColor: '#000000' },
    { name: '紫', color: '#c4b5fd', textColor: '#000000' },
    { name: '桃', color: '#f0abfc', textColor: '#000000' },
    { name: 'ピンク', color: '#fb7185', textColor: '#000000' },
    { name: '濃黄', color: '#fbbf24', textColor: '#000000' },
    { name: '濃赤', color: '#ef4444', textColor: '#ffffff' },
    { name: '濃橙', color: '#f97316', textColor: '#ffffff' },
    { name: '濃緑', color: '#22c55e', textColor: '#ffffff' },
    { name: '濃青', color: '#3b82f6', textColor: '#ffffff' },
    { name: '濃紫', color: '#a855f7', textColor: '#ffffff' },
    { name: '濃桃', color: '#ec4899', textColor: '#ffffff' },
    { name: 'ダーク', color: '#6b7280', textColor: '#ffffff' },
  ];

  const getWeekday = (date: Date): string => {
    const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
    return weekdays[date.getDay()];
  };

  const isWeekend = (date: Date): boolean => {
    const day = date.getDay();
    return day === 0 || day === 6;
  };

  const isToday = (date: Date): boolean => {
    const today = new Date();
    return date.getFullYear() === today.getFullYear() &&
           date.getMonth() === today.getMonth() &&
           date.getDate() === today.getDate();
  };

  const exportToCSV = () => {
    let csv = '事業者名,商品';
    dates.forEach(date => {
      if (viewType === 'monthly') {
        csv += `,${date.getFullYear()}年${date.getMonth() + 1}月`;
      } else {
        csv += `,${date.getMonth() + 1}/${date.getDate()}`;
      }
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
    const brandName = activeBrandTab === 'all' ? 'all_projects' : activeBrandTab;
    const viewTypeName = viewType === 'monthly' ? 'monthly' : 'daily';
    link.download = `schedule_${brandName}_${viewTypeName}_${new Date().toISOString().split('T')[0]}.csv`;
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
          viewType === 'daily' && isToday(date) 
            ? 'bg-yellow-100 border-yellow-400 border-2' 
            : viewType === 'daily' && isWeekend(date) 
              ? 'bg-blue-50' 
              : 'bg-neutral-50'
        }`}
      >
        {viewType === 'monthly' ? (
          <>
            <div className="text-xs text-neutral-600">
              {date.getFullYear()}年
            </div>
            <div className="text-xs text-neutral-600">
              {date.getMonth() + 1}月
            </div>
          </>
        ) : (
          <>
            <div className={`text-xs ${isToday(date) ? 'font-bold text-yellow-700' : 'text-neutral-600'}`}>
              {date.getMonth() + 1}/{date.getDate()}
            </div>
            <div className={`text-xs ${
              isToday(date) 
                ? 'font-bold text-yellow-700' 
                : isWeekend(date) 
                  ? 'text-blue-600' 
                  : 'text-neutral-500'
            }`}>
              {getWeekday(date)}
            </div>
          </>
        )}
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
                  const cellKey = `${project.id}-${dateStr}`;
const isSelected = selectedCells.has(cellKey);
const isPrimarySelected = selectedCell?.projectId === project.id && selectedCell?.date === dateStr;
                  const isEditing = editingCell?.projectId === project.id && editingCell?.date === dateStr;

                  return (
                    <td
  key={dateIndex}
  data-cell-id={`${project.id}-${dateStr}`}
  className={`p-0 cursor-cell relative ${
  isPrimarySelected
    ? 'border-4 border-primary-600 shadow-lg' 
    : isSelected
      ? 'border-2 border-primary-400 bg-primary-50/30'
      : 'border border-neutral-200'
}`}
onClick={(e) => handleCellClick(project.id, date, e)}
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
                      {/* 背景色レイヤー */}
                      <div 
                        className="absolute inset-0 z-0"
                        style={{ backgroundColor: cell?.backgroundColor || '#ffffff' }}
                      />
                      
                      {/* コンテンツレイヤー（前面） */}
                      <div className="relative z-10">
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
                            className="w-full h-full px-2 py-1 border-0 focus:outline-none text-center bg-transparent"
                            style={{ color: cell?.textColor || '#000000' }}
                          />
                        ) : (
                          <div 
                            className="px-2 py-1 min-h-[32px] flex items-center justify-center text-center"
                            style={{ color: cell?.textColor || '#000000' }}
                          >
                            {cell?.content || ''}
                          </div>
                        )}
                      </div>
                      
                      {/* カラーピッカー（最前面） */}
{/* カラーピッカー（最前面） */}
{showColorPicker?.projectId === project.id && showColorPicker?.date === dateStr && (
  <div
    className="absolute z-50 bg-white border-2 border-neutral-300 rounded-xl shadow-2xl p-4 top-full left-0 mt-1 min-w-[280px]"
    onClick={(e) => e.stopPropagation()}
  >
    <div className="mb-3">
      <p className="text-xs font-semibold text-neutral-700 mb-2">
        {selectedCells.size > 1 ? `${selectedCells.size}個のセルの色を変更` : 'カラーを選択'}
      </p>
      <div className="grid grid-cols-7 gap-2">
        {predefinedColors.map((item) => (
          <button
            key={item.color}
            onClick={() => handleColorChange(project.id, date, item.color, item.textColor)}
            className="group relative"
            title={item.name}
          >
            <div
              className="w-9 h-9 rounded-lg border-2 border-neutral-300 hover:border-primary-500 hover:scale-110 transition-all shadow-sm"
              style={{ backgroundColor: item.color }}
            />
            <span className="absolute hidden group-hover:block bottom-full left-1/2 transform -translate-x-1/2 mb-1 px-2 py-1 text-xs bg-neutral-800 text-white rounded whitespace-nowrap">
              {item.name}
            </span>
          </button>
        ))}
      </div>
    </div>
    <button
      onClick={() => setShowColorPicker(null)}
      className="w-full px-3 py-2 text-sm font-medium bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors"
    >
      閉じる
    </button>
  </div>
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
  <span>• Ctrl+クリックで複数選択</span>
  <span>• Shiftで範囲選択</span>
  <span>• Ctrl+C でコピー</span>
  <span>• Ctrl+V でペースト</span>
</div>
      </div>
    </div>
  );
}