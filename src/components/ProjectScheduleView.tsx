import { useState, useEffect, useRef } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { Project, BrandType } from '../types';
import { Calendar, Copy, Download } from 'lucide-react';

interface ProjectScheduleViewProps {
  user: User;
  activeBrandTab: BrandType | 'all';
  viewType: 'daily' | 'monthly';
  onSelectProject: (project: Project) => void;
}

interface ScheduleCell {
  projectId: string;
  date: string;
  content: string;
  backgroundColor: string;
  textColor: string;
}

interface ProjectWithBrandInfo extends Project {
  creatorName?: string;
  brandName?: string;
}

export default function ProjectScheduleView({ user, activeBrandTab, viewType, onSelectProject }: ProjectScheduleViewProps) {
  const [projects, setProjects] = useState<ProjectWithBrandInfo[]>([]);
  const [schedules, setSchedules] = useState<Map<string, ScheduleCell>>(new Map());
  const [dates, setDates] = useState<Date[]>([]);
  const [selectedCell, setSelectedCell] = useState<{ projectId: string; date: string } | null>(null);
  const [selectedCells, setSelectedCells] = useState<Set<string>>(new Set());
  const [editingCell, setEditingCell] = useState<{ projectId: string; date: string } | null>(null);
  const [editValue, setEditValue] = useState('');
  const [showColorPicker, setShowColorPicker] = useState<{ projectId: string; date: string } | null>(null);
  const [copiedCellData, setCopiedCellData] = useState<any>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const hasScrolledToToday = useRef(false);

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

  useEffect(() => {
    // 日次ビューで初回読み込み時のみ当日の列を中央に配置
    if (viewType === 'daily' && dates.length > 0 && !hasScrolledToToday.current) {
      const todayIndex = dates.findIndex(date => isToday(date));
      if (todayIndex !== -1) {
        hasScrolledToToday.current = true;
        setTimeout(() => {
          const tableContainers = document.querySelectorAll('.overflow-x-auto');
          
          tableContainers.forEach((tableContainer) => {
            const todayHeader = tableContainer.querySelectorAll('thead th')[todayIndex + 1];
            
            if (tableContainer && todayHeader) {
              const containerWidth = tableContainer.clientWidth;
              const headerLeft = (todayHeader as HTMLElement).offsetLeft;
              const headerWidth = (todayHeader as HTMLElement).offsetWidth;
              
              const scrollLeft = headerLeft - (containerWidth / 2) + (headerWidth / 2);
              tableContainer.scrollLeft = scrollLeft;
            }
          });
        }, 100);
      }
    }
  }, [dates.length, viewType]);

  useEffect(() => {
    hasScrolledToToday.current = false;
  }, [viewType]);

  const generateDates = () => {
    if (viewType === 'monthly') {
      const today = new Date();
      const datesArray: Date[] = [];
      for (let i = 0; i < 12; i++) {
        const date = new Date(today.getFullYear(), today.getMonth() + i, 1);
        datesArray.push(date);
      }
      setDates(datesArray);
    } else {
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
    
    if (activeBrandTab !== 'all') {
      query = query.eq('brand_type', activeBrandTab);
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    
    // BRAND-BASEの場合、クリエイターとブランド情報を取得
    if (data && activeBrandTab === 'BRAND-BASE') {
      const projectsWithInfo: ProjectWithBrandInfo[] = await Promise.all(
        data.map(async (project) => {
          // brand_projectsからブランド情報を取得
          const { data: brandProjectData } = await supabase
            .from('brand_projects')
            .select('brand_id')
            .eq('project_id', project.id)
            .single();
          
          if (brandProjectData) {
            // brandsテーブルからブランド名を取得
            const { data: brandData } = await supabase
              .from('brands')
              .select('name, id')
              .eq('id', brandProjectData.brand_id)
              .single();
            
            if (brandData) {
              // creator_brandsからクリエイター情報を取得
              const { data: creatorBrandData } = await supabase
                .from('creator_brands')
                .select('creator_id')
                .eq('brand_id', brandData.id)
                .single();
              
              if (creatorBrandData) {
                // creatorsテーブルからクリエイター名を取得
                const { data: creatorData } = await supabase
                  .from('creators')
                  .select('name')
                  .eq('id', creatorBrandData.creator_id)
                  .single();
                
                return {
                  ...project,
                  creatorName: creatorData?.name,
                  brandName: brandData.name
                };
              }
            }
          }
          
          return project;
        })
      );
      
      setProjects(projectsWithInfo);
    } else if (activeBrandTab === 'all' && data) {
      const sortedData = data.sort((a, b) => {
        if (a.brand_type !== b.brand_type) {
          return a.brand_type === '海外クラファン.com' ? -1 : 1;
        }
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
      setProjects(sortedData);
    } else {
      setProjects(data || []);
    }
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
    const hex = bgColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 155 ? '#000000' : '#ffffff';
  };

  const isToday = (date: Date): boolean => {
    const today = new Date();
    return date.getFullYear() === today.getFullYear() &&
           date.getMonth() === today.getMonth() &&
           date.getDate() === today.getDate();
  };

  const handleCellClick = (projectId: string, date: Date, e?: React.MouseEvent) => {
    const dateStr = date.toISOString().split('T')[0];
    const cellKey = `${projectId}-${dateStr}`;
    
    if (e?.shiftKey && selectedCell) {
      handleRangeSelection(projectId, dateStr);
    } else if (e?.ctrlKey || e?.metaKey) {
      const newSelectedCells = new Set(selectedCells);
      if (newSelectedCells.has(cellKey)) {
        newSelectedCells.delete(cellKey);
      } else {
        newSelectedCells.add(cellKey);
      }
      setSelectedCells(newSelectedCells);
      setSelectedCell({ projectId, date: dateStr });
    } else {
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
        if (existingCell) {
          await supabase
            .from('project_schedules')
            .delete()
            .eq('project_id', editingCell.projectId)
            .eq('date', editingCell.date);
          
          const updatedSchedules = new Map(schedules);
          updatedSchedules.delete(key);
          setSchedules(updatedSchedules);
        }
      } else {
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

    if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
      e.preventDefault();
      handleCopy();
      return;
    }

    if (e.key === 'Escape' && !editingCell) {
      e.preventDefault();
      setSelectedCells(new Set());
      setSelectedCell(null);
      return;
    }

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
      const cellsData = Array.from(selectedCells).map(key => {
        const cell = schedules.get(key);
        return {
          key,
          content: cell?.content || '',
          backgroundColor: cell?.backgroundColor || '#ffffff',
          textColor: cell?.textColor || '#000000'
        };
      });
      
      setCopiedCellData({
        content: cellsData.map(c => c.content).join('\t'),
        backgroundColor: cellsData[0].backgroundColor,
        textColor: cellsData[0].textColor,
        isMultiple: selectedCells.size > 1,
        cellsData: cellsData
      });
      
      await navigator.clipboard.writeText(cellsData.map(c => c.content).join('\t'));
    } catch (error) {
      console.error('コピーエラー:', error);
    }
  };

  const handlePaste = async (e: React.ClipboardEvent, projectId: string, date: Date) => {
    e.preventDefault();
    
    const targetCells = selectedCells.size > 0 ? Array.from(selectedCells) : [`${projectId}-${date.toISOString().split('T')[0]}`];

    try {
      if (copiedCellData && copiedCellData.isMultiple && copiedCellData.cellsData) {
        const cellsData = copiedCellData.cellsData;
        
        for (const targetKey of targetCells) {
          const [targetProjectId, targetDateStr] = targetKey.split('-').reduce((acc, part, idx, arr) => {
            if (idx < arr.length - 3) {
              acc[0] = acc[0] ? `${acc[0]}-${part}` : part;
            } else {
              acc[1] = acc[1] ? `${acc[1]}-${part}` : part;
            }
            return acc;
          }, ['', '']);
          
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
        for (const targetKey of targetCells) {
          const [targetProjectId, targetDateStr] = targetKey.split('-').reduce((acc, part, idx, arr) => {
            if (idx < arr.length - 3) {
              acc[0] = acc[0] ? `${acc[0]}-${part}` : part;
            } else {
              acc[1] = acc[1] ? `${acc[1]}-${part}` : part;
            }
            return acc;
          }, ['', '']);
          
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
        const content = e.clipboardData.getData('text');
        const backgroundColor = '#ffffff';
        const textColor = getTextColorForBackground(backgroundColor);
        
        for (const targetKey of targetCells) {
          const [targetProjectId, targetDateStr] = targetKey.split('-').reduce((acc, part, idx, arr) => {
            if (idx < arr.length - 3) {
              acc[0] = acc[0] ? `${acc[0]}-${part}` : part;
            } else {
              acc[1] = acc[1] ? `${acc[1]}-${part}` : part;
            }
            return acc;
          }, ['', '']);
          
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
    
    const targetCells = selectedCells.size > 0 && selectedCells.has(clickedCellKey) 
      ? Array.from(selectedCells) 
      : [clickedCellKey];

    try {
      const updatedSchedules = new Map(schedules);
      
      for (const cellKey of targetCells) {
        const parts = cellKey.split('-');
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

  

  // ブランドごとにプロジェクトをグループ化
  const projectsByBrand = activeBrandTab === 'all' 
    ? {
        '海外クラファン.com': projects.filter(p => p.brand_type === '海外クラファン.com'),
        'BRAND-BASE': projects.filter(p => p.brand_type === 'BRAND-BASE')
      }
    : { [activeBrandTab]: projects };

 // ヘッダー部分を共通化する関数
  const renderDateHeaders = (brandName?: string) => {
  const headerLabel = brandName === 'BRAND-BASE' || activeBrandTab === 'BRAND-BASE' 
    ? 'クリエイター' 
    : '事業者名';
  
  return (
    <tr>
      <th className="sticky left-0 z-30 bg-neutral-50 border border-neutral-200 px-4 py-2 text-left font-semibold text-neutral-900 min-w-[200px]">
        {headerLabel}
      </th>
      <th className="sticky left-[200px] z-30 bg-neutral-50 border border-neutral-200 px-2 py-2 text-center font-semibold text-neutral-900 w-[60px]">
  リンク
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
    );
  };

  const renderProjectRows = (brandProjects: ProjectWithBrandInfo[]) => {
  return (
    <>
      {brandProjects.map((project) => (
        <tr key={project.id} className="hover:bg-neutral-50/50">
          <td className="sticky left-0 z-20 bg-white border border-neutral-200 px-4 py-2 text-neutral-900 shadow-sm">
            {activeBrandTab === 'BRAND-BASE' ? (
              <>
                {project.creatorName && (
                  <div className="text-sm font-semibold text-primary-600 mb-1">
                    {project.creatorName}
                  </div>
                )}
                {project.brandName && (
                  <div className="font-medium text-neutral-900">
                    {project.brandName}
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="font-medium">{project.name}</div>
                {project.description && (
                  <div className="text-xs text-neutral-500 mt-1 line-clamp-2">
                    {project.description}
                  </div>
                )}
              </>
            )}
          </td>
          
          <td className="sticky left-[200px] z-20 bg-white border border-neutral-200 px-2 py-2 text-center shadow-sm">
  <button
    onClick={() => onSelectProject(project)}
    className="px-2 py-1 text-xs text-primary-600 underline hover:text-primary-700 hover:no-underline transition-colors"
    title="プロジェクトを開く"
  >
    開く
  </button>
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
                }}
                tabIndex={0}
              >
                <div 
                  className="absolute inset-0 z-0"
                  style={{ backgroundColor: cell?.backgroundColor || '#ffffff' }}
                />
                
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
    </>
  );
};

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
            disabled={selectedCells.size === 0}
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

      {activeBrandTab === 'all' ? (
        <div className="flex flex-col">
          {Object.entries(projectsByBrand).map(([brandName, brandProjects], brandIndex) => (
            brandProjects.length > 0 && (
              <div key={brandName} className={brandIndex > 0 ? 'border-t-4 border-primary-600' : ''}>
                <div className="bg-primary-50 px-4 py-2 border-b border-neutral-200">
                  <h3 className="text-sm font-bold text-primary-900">{brandName}</h3>
                </div>
                <div className="overflow-x-auto overflow-y-auto max-h-[600px]">
                  <table className="w-full border-collapse text-sm">
                    <thead className="sticky top-0 z-20 bg-neutral-50">
                      {renderDateHeaders(brandName)}
                    </thead>
                    <tbody>
                      {renderProjectRows(brandProjects)}
                    </tbody>
                  </table>
                </div>
              </div>
            )
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto overflow-y-auto max-h-[600px]">
          <table className="w-full border-collapse text-sm">
            <thead className="sticky top-0 z-20 bg-neutral-50">
              {renderDateHeaders()}
            </thead>
            <tbody>
              {renderProjectRows(projects)}
            </tbody>
          </table>
        </div>
      )}

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