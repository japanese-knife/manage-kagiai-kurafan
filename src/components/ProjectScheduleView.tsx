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
  onOpenCreatorBrands?: (project: Project) => void;
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

export default function ProjectScheduleView({ 
  user, 
  activeBrandTab, 
  viewType, 
  onSelectProject,
  onOpenCreatorBrands 
}: ProjectScheduleViewProps) {
  const [projects, setProjects] = useState<ProjectWithBrandInfo[]>([]);
  // ... 以下のコードはそのまま
  const [schedules, setSchedules] = useState<Map<string, ScheduleCell>>(new Map());
  const [dates, setDates] = useState<Date[]>([]);
  const [selectedCell, setSelectedCell] = useState<{ projectId: string; date: string } | null>(null);
const [selectedCells, setSelectedCells] = useState<Set<string>>(new Set());
const [isSelecting, setIsSelecting] = useState(false);
const [selectionStart, setSelectionStart] = useState<{ projectId: string; date: string } | null>(null);
  const [editingCell, setEditingCell] = useState<{ projectId: string; date: string } | null>(null);
  const [editValue, setEditValue] = useState('');
  const [showColorPicker, setShowColorPicker] = useState<{ projectId: string; date: string } | null>(null);
  const [copiedCellData, setCopiedCellData] = useState<any>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const hasScrolledToToday = useRef(false);
  const [columnWidth, setColumnWidth] = useState<'narrow' | 'wide'>('narrow');

  // 日付生成
  useEffect(() => {
    generateDates();
  }, [viewType, activeBrandTab]);

  // プロジェクト読み込み
  useEffect(() => {
    if (dates.length > 0) {
      loadProjects();
    }
  }, [dates.length, activeBrandTab]);

  // スケジュール読み込み
  useEffect(() => {
    if (projects.length > 0) {
      loadSchedules();
    }
  }, [projects.length]);
  
  useEffect(() => {
  // 日次ビューで初回読み込み時のみ当日の列を中央に配置
  if (viewType === 'daily' && dates.length > 0 && !hasScrolledToToday.current) {
    const todayIndex = dates.findIndex(date => isToday(date));
    if (todayIndex !== -1) {
      hasScrolledToToday.current = true;
      setTimeout(() => {
        const tableContainers = document.querySelectorAll('.overflow-x-auto');
        
        tableContainers.forEach((tableContainer) => {
          const table = tableContainer.querySelector('table');
          if (!table) return;
          
          const allHeaders = table.querySelectorAll('thead th');
          // 固定列が2つあるため、+2でインデックスを調整
          const todayHeader = allHeaders[todayIndex + 2];
          
          if (tableContainer && todayHeader) {
            const containerWidth = tableContainer.clientWidth;
            const todayHeaderElement = todayHeader as HTMLElement;
            
            // 固定列の実際の幅を取得
            const firstFixedColumn = allHeaders[0] as HTMLElement;
            const secondFixedColumn = allHeaders[1] as HTMLElement;
            const fixedColumnsWidth = firstFixedColumn.offsetWidth + secondFixedColumn.offsetWidth;
            
            // todayHeaderの実際の位置を取得
            const headerLeft = todayHeaderElement.offsetLeft;
            const headerWidth = todayHeaderElement.offsetWidth;
            
            // 中央に配置するためのスクロール位置を計算
            // 固定列の幅を引いて、残りのスペースの中央に配置
            const visibleWidth = containerWidth - fixedColumnsWidth;
            const scrollLeft = headerLeft - fixedColumnsWidth - (visibleWidth / 2) + (headerWidth / 2);
            
            tableContainer.scrollLeft = Math.max(0, scrollLeft);
          }
        });
      }, 200);
    }
  }
}, [dates.length, viewType, activeBrandTab]);

  useEffect(() => {
    hasScrolledToToday.current = false;
  }, [viewType]);

  const generateDates = () => {
    if (viewType === 'monthly') {
      const today = new Date();
      const datesArray: Date[] = [];
      // BRAND-BASEの場合は年単位（1年＝12ヶ月）、それ以外は月単位（12ヶ月）
      const monthCount = activeBrandTab === 'BRAND-BASE' ? 12 : 12;
      for (let i = 0; i < monthCount; i++) {
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

  const getColumnWidth = () => {
  switch (columnWidth) {
    case 'narrow':
      return 'min-w-[24px] w-[24px]';
    case 'wide':
      return 'min-w-[80px] w-[80px]';
    default:
      return 'min-w-[24px] w-[24px]';
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
    
    // ステータスフィルター: 「進行中」と「PICKS」のみ表示
    query = query.in('status', ['進行中', 'PICKS']);
    
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
        // ステータス順: 進行中 → PICKS
        const statusOrder = { '進行中': 1, 'PICKS': 2 };
        const aOrder = statusOrder[a.status as keyof typeof statusOrder] || 999;
        const bOrder = statusOrder[b.status as keyof typeof statusOrder] || 999;
        
        if (aOrder !== bOrder) {
          return aOrder - bOrder;
        }
        
        // 同じステータス内ではブランドタイプ順
        if (a.brand_type !== b.brand_type) {
          return a.brand_type === '海外クラファン.com' ? -1 : 1;
        }
        
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
      setProjects(sortedData);
    } else {
      // 単一ブランドタブでもステータス順にソート
      const sortedData = (data || []).sort((a, b) => {
        const statusOrder = { '進行中': 1, 'PICKS': 2 };
        const aOrder = statusOrder[a.status as keyof typeof statusOrder] || 999;
        const bOrder = statusOrder[b.status as keyof typeof statusOrder] || 999;
        
        if (aOrder !== bOrder) {
          return aOrder - bOrder;
        }
        
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
      setProjects(sortedData);
    }
  } catch (error) {
    console.error('プロジェクト読み込みエラー:', error);
  }
};

  const loadSchedules = async () => {
    try {
      const projectIds = projects.map(p => p.id);
      // viewTypeに応じて異なるテーブルから取得
      const tableName = viewType === 'monthly' ? 'annual_schedules' : 'project_schedules';
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .in('project_id', projectIds);

      if (error) throw error;

      const scheduleMap = new Map<string, ScheduleCell>();
      (data || []).forEach((schedule) => {
        // キー生成ロジックを統一
        const key = getCellKey(schedule.project_id, new Date(schedule.date + 'T00:00:00'));
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
  if (viewType === 'monthly') {
    // 月次ビューの場合は YYYY-MM 形式
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${projectId}-${year}-${month}`;
  } else {
    // 日次ビューの場合は YYYY-MM-DD 形式
    const dateStr = date.toISOString().split('T')[0];
    return `${projectId}-${dateStr}`;
  }
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

const isCurrentMonth = (date: Date): boolean => {
  const today = new Date();
  return date.getFullYear() === today.getFullYear() &&
         date.getMonth() === today.getMonth();
};

  

  const handleCellClick = (projectId: string, date: Date, e?: React.MouseEvent) => {
    const cellKey = getCellKey(projectId, date);
    const dateStr = viewType === 'monthly'
      ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      : date.toISOString().split('T')[0];
    
    if (e?.shiftKey && selectedCell) {
      // Shift + クリックで範囲選択
      handleRangeSelection(projectId, dateStr);
    } else if (e?.ctrlKey || e?.metaKey) {
      // Ctrl/Cmd + クリックで複数選択（トグル）
      const newSelectedCells = new Set(selectedCells);
      if (newSelectedCells.has(cellKey)) {
        newSelectedCells.delete(cellKey);
        // 削除後に残っているセルがあれば、最後のセルを選択状態に
        if (newSelectedCells.size > 0) {
          const lastCell = Array.from(newSelectedCells)[newSelectedCells.size - 1];
          const [pid, ...dateParts] = lastCell.split('-');
          setSelectedCell({ projectId: pid, date: dateParts.join('-') });
        } else {
          setSelectedCell(null);
        }
      } else {
        newSelectedCells.add(cellKey);
        setSelectedCell({ projectId, date: dateStr });
      }
      setSelectedCells(newSelectedCells);
    } else {
      // 通常のクリック
      setSelectedCell({ projectId, date: dateStr });
      setSelectedCells(new Set([cellKey]));
    }
  };

  const handleCellMouseDown = (projectId: string, date: Date, e: React.MouseEvent) => {
    // 編集中やカラーピッカー表示中はドラッグ選択しない
    if (editingCell || showColorPicker) return;
    
    const dateStr = date.toISOString().split('T')[0];
    
    if (!e.shiftKey && !e.ctrlKey && !e.metaKey) {
      // 通常のマウスダウンでドラッグ選択を開始
      setIsSelecting(true);
      setSelectionStart({ projectId, date: dateStr });
      setSelectedCell({ projectId, date: dateStr });
      setSelectedCells(new Set([`${projectId}-${dateStr}`]));
    }
  };

  const handleCellMouseEnter = (projectId: string, date: Date) => {
    if (!isSelecting || !selectionStart) return;
    
    const dateStr = date.toISOString().split('T')[0];
    handleRangeSelection(projectId, dateStr, selectionStart);
  };

  const handleMouseUp = () => {
    setIsSelecting(false);
    setSelectionStart(null);
  };

  useEffect(() => {
    // グローバルなマウスアップイベントを監視
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);
  
  const handleRangeSelection = (endProjectId: string, endDate: string, startCell?: { projectId: string; date: string }) => {
    const baseCell = startCell || selectedCell;
    if (!baseCell) return;
    
    const startProjectIndex = projects.findIndex(p => p.id === baseCell.projectId);
    const endProjectIndex = projects.findIndex(p => p.id === endProjectId);
    const startDateIndex = dates.findIndex(d => d.toISOString().split('T')[0] === baseCell.date);
    const endDateIndex = dates.findIndex(d => d.toISOString().split('T')[0] === endDate);
    
    if (startProjectIndex === -1 || endProjectIndex === -1 || startDateIndex === -1 || endDateIndex === -1) {
      return;
    }
    
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
    const tableName = viewType === 'monthly' ? 'annual_schedules' : 'project_schedules';

    try {
      if (editValue.trim() === '') {
        if (existingCell) {
          await supabase
            .from(tableName)
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
          .from(tableName)
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

    if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
      e.preventDefault();
      handleKeyboardPaste();
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
      // 選択されたセルを行列順にソート
      const sortedCells = Array.from(selectedCells).sort((a, b) => {
        const [aProjectId, aDate] = a.split('-').reduce((acc, part, idx, arr) => {
          if (idx < arr.length - 3) {
            acc[0] = acc[0] ? `${acc[0]}-${part}` : part;
          } else {
            acc[1] = acc[1] ? `${acc[1]}-${part}` : part;
          }
          return acc;
        }, ['', '']);
        
        const [bProjectId, bDate] = b.split('-').reduce((acc, part, idx, arr) => {
          if (idx < arr.length - 3) {
            acc[0] = acc[0] ? `${acc[0]}-${part}` : part;
          } else {
            acc[1] = acc[1] ? `${acc[1]}-${part}` : part;
          }
          return acc;
        }, ['', '']);
        
        const aProjectIndex = projects.findIndex(p => p.id === aProjectId);
        const bProjectIndex = projects.findIndex(p => p.id === bProjectId);
        
        if (aProjectIndex !== bProjectIndex) {
          return aProjectIndex - bProjectIndex;
        }
        
        const aDateIndex = dates.findIndex(d => d.toISOString().split('T')[0] === aDate);
        const bDateIndex = dates.findIndex(d => d.toISOString().split('T')[0] === bDate);
        
        return aDateIndex - bDateIndex;
      });

      const cellsData = sortedCells.map(key => {
        const cell = schedules.get(key);
        let projectId: string;
        let dateStr: string;
        
        if (viewType === 'monthly') {
          // 月次ビュー: {projectId}-YYYY-MM 形式
          const parts = key.split('-');
          dateStr = parts.slice(-2).join('-'); // YYYY-MM
          projectId = parts.slice(0, -2).join('-');
        } else {
          // 日次ビュー: {projectId}-YYYY-MM-DD 形式
          const parts = key.split('-');
          dateStr = parts.slice(-3).join('-'); // YYYY-MM-DD
          projectId = parts.slice(0, -3).join('-');
        }
        
        return {
          key,
          projectId,
          dateStr,
          content: cell?.content || '',
          backgroundColor: cell?.backgroundColor || '#ffffff',
          textColor: cell?.textColor || '#000000'
        };
      });
      
      // 矩形領域として構造化
      const cellStructure = new Map<string, Map<string, typeof cellsData[0]>>();
      cellsData.forEach(cell => {
        if (!cellStructure.has(cell.projectId)) {
          cellStructure.set(cell.projectId, new Map());
        }
        cellStructure.get(cell.projectId)!.set(cell.dateStr, cell);
      });
      
      setCopiedCellData({
        cellsData: cellsData,
        structure: cellStructure,
        isMultiple: selectedCells.size > 1
      });
      
      // TSV形式でクリップボードにコピー（Excel互換）
      let tsvContent = '';
      const projectIds = Array.from(new Set(cellsData.map(c => c.projectId)));
      const dateStrs = Array.from(new Set(cellsData.map(c => c.dateStr))).sort();
      
      projectIds.forEach((projectId, pIndex) => {
        dateStrs.forEach((dateStr, dIndex) => {
          const cell = cellStructure.get(projectId)?.get(dateStr);
          tsvContent += cell?.content || '';
          if (dIndex < dateStrs.length - 1) {
            tsvContent += '\t';
          }
        });
        if (pIndex < projectIds.length - 1) {
          tsvContent += '\n';
        }
      });
      
      await navigator.clipboard.writeText(tsvContent);
      
      // 視覚的フィードバック
      const copyButton = document.querySelector('[title="コピー (Ctrl+C)"]');
      if (copyButton) {
        copyButton.classList.add('bg-green-100');
        setTimeout(() => {
          copyButton.classList.remove('bg-green-100');
        }, 300);
      }
    } catch (error) {
      console.error('コピーエラー:', error);
      alert('コピーに失敗しました');
    }
  };

  const handleKeyboardPaste = async () => {
    console.log('handleKeyboardPaste called');
    console.log('selectedCells:', selectedCells);
    console.log('copiedCellData:', copiedCellData);
    
    if (selectedCells.size === 0) {
      console.log('No cells selected');
      return;
    }
    
    if (!copiedCellData) {
      console.log('No copied data');
      return;
    }

    const tableName = viewType === 'monthly' ? 'annual_schedules' : 'project_schedules';

    try {
      // 1つのセルをコピーして複数セルにペースト
      if (copiedCellData.cellsData && copiedCellData.cellsData.length === 1) {
        console.log('Single cell paste to multiple cells');
        const sourceCellData = copiedCellData.cellsData[0];
        console.log('Source cell data:', sourceCellData);
        
        const updates: any[] = [];
        
        selectedCells.forEach(cellKey => {
          const parts = cellKey.split('-');
let targetDateStr: string;
let targetProjectId: string;

if (viewType === 'monthly') {
  targetDateStr = parts.slice(-2).join('-'); // YYYY-MM
  targetProjectId = parts.slice(0, -2).join('-');
} else {
  targetDateStr = parts.slice(-3).join('-'); // YYYY-MM-DD
  targetProjectId = parts.slice(0, -3).join('-');
}
          
          console.log('Processing cellKey:', cellKey, 'projectId:', targetProjectId, 'date:', targetDateStr);
          
          updates.push({
            project_id: targetProjectId,
            date: targetDateStr,
            content: sourceCellData.content,
            background_color: sourceCellData.backgroundColor,
            text_color: sourceCellData.textColor,
            user_id: user.id,
          });
        });
        
        console.log('Updates to perform:', updates);
        
        // バッチ更新
        for (const updateData of updates) {
          console.log('Upserting:', updateData);
          const { data, error } = await supabase
            .from(tableName)
            .upsert(updateData, {
              onConflict: 'project_id,date'
            });
          
          if (error) {
            console.error('Upsert error:', error);
          } else {
            console.log('Upsert success:', data);
          }
        }
        
        console.log('Reloading schedules...');
        await loadSchedules();
        
        // 視覚的フィードバック
        selectedCells.forEach(cellKey => {
          const cell = document.querySelector(`[data-cell-id="${cellKey}"]`);
          if (cell) {
            cell.classList.add('ring-2', 'ring-green-400');
            setTimeout(() => {
              cell.classList.remove('ring-2', 'ring-green-400');
            }, 500);
          }
        });
        
        return;
      }

      // 複数セルのコピー＆ペースト（矩形領域）
      if (copiedCellData.structure && selectedCell) {
        console.log('Multiple cells paste (rectangular area)');
        const sourceProjectIds = Array.from(copiedCellData.structure.keys());
        const sourceDates = Array.from(new Set(
          Array.from(copiedCellData.structure.values())
            .flatMap(dateMap => Array.from(dateMap.keys()))
        )).sort();
        
        const startProjectIndex = projects.findIndex(p => p.id === selectedCell.projectId);
        const startDateIndex = dates.findIndex(d => d.toISOString().split('T')[0] === selectedCell.date);
        
        if (startProjectIndex === -1 || startDateIndex === -1) return;
        
        const updates: any[] = [];
        sourceProjectIds.forEach((sourceProjectId, pOffset) => {
          const targetProjectIndex = startProjectIndex + pOffset;
          if (targetProjectIndex >= projects.length) return;
          
          const targetProjectId = projects[targetProjectIndex].id;
          const sourceDateMap = copiedCellData.structure.get(sourceProjectId);
          
          sourceDates.forEach((sourceDate, dOffset) => {
            const targetDateIndex = startDateIndex + dOffset;
            if (targetDateIndex >= dates.length) return;
            
            const targetDate = dates[targetDateIndex].toISOString().split('T')[0];
            const sourceCell = sourceDateMap?.get(sourceDate);
            
            if (sourceCell) {
              updates.push({
                project_id: targetProjectId,
                date: targetDate,
                content: sourceCell.content,
                background_color: sourceCell.backgroundColor,
                text_color: sourceCell.textColor,
                user_id: user.id,
              });
            }
          });
        });
        
        // バッチ更新
        for (const updateData of updates) {
          await supabase
            .from(tableName)
            .upsert(updateData, {
              onConflict: 'project_id,date'
            });
        }
        
        await loadSchedules();
        
        // 視覚的フィードバック
        if (selectedCell) {
          const targetCell = document.querySelector(`[data-cell-id="${selectedCell.projectId}-${selectedCell.date}"]`);
          if (targetCell) {
            targetCell.classList.add('ring-2', 'ring-green-400');
            setTimeout(() => {
              targetCell.classList.remove('ring-2', 'ring-green-400');
            }, 500);
          }
        }
      }
    } catch (error) {
      console.error('ペーストエラー:', error);
      alert('ペーストに失敗しました');
    }
  };
  
  const handlePaste = async (e: React.ClipboardEvent, projectId: string, date: Date) => {
    e.preventDefault();
    
    const dateStr = date.toISOString().split('T')[0];
    const tableName = viewType === 'monthly' ? 'annual_schedules' : 'project_schedules';

    try {
      if (copiedCellData && copiedCellData.structure) {
        // 構造化されたデータのペースト（矩形領域）
        const sourceProjectIds = Array.from(copiedCellData.structure.keys());
        const sourceDates = Array.from(new Set(
          Array.from(copiedCellData.structure.values())
            .flatMap(dateMap => Array.from(dateMap.keys()))
        )).sort();
        
        const startProjectIndex = projects.findIndex(p => p.id === projectId);
        const startDateIndex = dates.findIndex(d => d.toISOString().split('T')[0] === dateStr);
        
        if (startProjectIndex === -1 || startDateIndex === -1) return;
        
        // コピー元の構造を維持してペースト
        const updates: any[] = [];
        sourceProjectIds.forEach((sourceProjectId, pOffset) => {
          const targetProjectIndex = startProjectIndex + pOffset;
          if (targetProjectIndex >= projects.length) return;
          
          const targetProjectId = projects[targetProjectIndex].id;
          const sourceDateMap = copiedCellData.structure.get(sourceProjectId);
          
          sourceDates.forEach((sourceDate, dOffset) => {
            const targetDateIndex = startDateIndex + dOffset;
            if (targetDateIndex >= dates.length) return;
            
            const targetDate = dates[targetDateIndex].toISOString().split('T')[0];
            const sourceCell = sourceDateMap?.get(sourceDate);
            
            if (sourceCell) {
              updates.push({
                project_id: targetProjectId,
                date: targetDate,
                content: sourceCell.content,
                background_color: sourceCell.backgroundColor,
                text_color: sourceCell.textColor,
                user_id: user.id,
              });
            }
          });
        });
        
        // バッチ更新
        for (const updateData of updates) {
          await supabase
            .from(tableName)
            .upsert(updateData, {
              onConflict: 'project_id,date'
            });
        }
      } else {
        // プレーンテキストのペースト
        const clipboardText = e.clipboardData.getData('text');
        const lines = clipboardText.split('\n').filter(line => line.trim());
        
        const startProjectIndex = projects.findIndex(p => p.id === projectId);
        const startDateIndex = dates.findIndex(d => d.toISOString().split('T')[0] === dateStr);
        
        if (startProjectIndex === -1 || startDateIndex === -1) return;
        
        const updates: any[] = [];
        lines.forEach((line, rowOffset) => {
          const cells = line.split('\t');
          const targetProjectIndex = startProjectIndex + rowOffset;
          
          if (targetProjectIndex >= projects.length) return;
          
          const targetProjectId = projects[targetProjectIndex].id;
          
          cells.forEach((content, colOffset) => {
            const targetDateIndex = startDateIndex + colOffset;
            if (targetDateIndex >= dates.length) return;
            
            const targetDate = dates[targetDateIndex].toISOString().split('T')[0];
            const backgroundColor = '#ffffff';
            const textColor = getTextColorForBackground(backgroundColor);
            
            updates.push({
              project_id: targetProjectId,
              date: targetDate,
              content: content.trim(),
              background_color: backgroundColor,
              text_color: textColor,
              user_id: user.id,
            });
          });
        });
        
        // バッチ更新
        for (const updateData of updates) {
          await supabase
            .from(tableName)
            .upsert(updateData, {
              onConflict: 'project_id,date'
            });
        }
      }

      await loadSchedules();
      
      // 視覚的フィードバック
      const targetCell = document.querySelector(`[data-cell-id="${projectId}-${dateStr}"]`);
      if (targetCell) {
        targetCell.classList.add('bg-green-100');
        setTimeout(() => {
          targetCell.classList.remove('bg-green-100');
        }, 300);
      }
    } catch (error) {
      console.error('ペーストエラー:', error);
      alert('ペーストに失敗しました');
    }
  };

  const handleColorChange = async (projectId: string, date: Date, color: string, textColor: string) => {
    const dateStr = date.toISOString().split('T')[0];
    const clickedCellKey = `${projectId}-${dateStr}`;
    
    const targetCells = selectedCells.size > 0 && selectedCells.has(clickedCellKey) 
      ? Array.from(selectedCells) 
      : [clickedCellKey];

    const tableName = viewType === 'monthly' ? 'annual_schedules' : 'project_schedules';

    try {
      const updatedSchedules = new Map(schedules);
      
      for (const cellKey of targetCells) {
        const parts = cellKey.split('-');
let targetDateStr: string;
let targetProjectId: string;

if (viewType === 'monthly') {
  targetDateStr = parts.slice(-2).join('-'); // YYYY-MM
  targetProjectId = parts.slice(0, -2).join('-');
} else {
  targetDateStr = parts.slice(-3).join('-'); // YYYY-MM-DD
  targetProjectId = parts.slice(0, -3).join('-');
}
        
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
          .from(tableName)
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
      
      // 視覚的フィードバック
      targetCells.forEach(cellKey => {
        const cell = document.querySelector(`[data-cell-id="${cellKey}"]`);
        if (cell) {
          cell.classList.add('ring-2', 'ring-green-400');
          setTimeout(() => {
            cell.classList.remove('ring-2', 'ring-green-400');
          }, 500);
        }
      });
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
      <th className={`sticky left-0 z-40 bg-neutral-50 border border-neutral-200 px-2 sm:px-4 py-2 text-left font-semibold text-neutral-900 ${
  brandName === 'BRAND-BASE' || activeBrandTab === 'BRAND-BASE' 
    ? viewType === 'monthly' 
      ? 'min-w-[60px] sm:min-w-[80px] max-w-[80px] sm:max-w-[100px]' 
      : 'min-w-[80px] sm:min-w-[120px]'
    : 'min-w-[80px] sm:min-w-[200px]'
}`}>
  {headerLabel}
</th>
<th className={`sticky ${
  brandName === 'BRAND-BASE' || activeBrandTab === 'BRAND-BASE'
    ? viewType === 'monthly'
      ? 'left-[60px] sm:left-[80px]'
      : 'left-[80px] sm:left-[120px]'
    : 'left-[80px] sm:left-[200px]'
} z-40 bg-neutral-50 border border-neutral-200 px-1 sm:px-2 py-2 text-center font-semibold text-neutral-900 w-[40px] sm:w-[60px]`}>
  リンク
</th>
      {dates.map((date, index) => (
  <th
  key={index}
  className={`border border-neutral-200 px-3 py-2 text-center font-medium ${getColumnWidth()} ${
    viewType === 'monthly' && isCurrentMonth(date)
      ? 'bg-yellow-100 border-yellow-400 border-2'
      : viewType === 'daily' && isToday(date) 
        ? 'bg-yellow-100 border-yellow-400 border-2' 
        : viewType === 'daily' && isWeekend(date) 
          ? 'bg-blue-50' 
          : 'bg-neutral-50'
  }`}
>
  {viewType === 'monthly' ? (
    <>
      <div className={`text-xs ${isCurrentMonth(date) ? 'font-bold text-yellow-700' : 'text-neutral-600'}`}>
        {date.getFullYear()}
      </div>
      <div className={`text-xs ${isCurrentMonth(date) ? 'font-bold text-yellow-700' : 'text-neutral-600'}`}>
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
          <td className={`sticky left-0 z-20 bg-white border border-neutral-200 px-2 sm:px-4 py-2 text-neutral-900 shadow-sm ${
  activeBrandTab === 'BRAND-BASE' 
    ? viewType === 'monthly'
      ? 'min-w-[60px] sm:min-w-[80px] max-w-[80px] sm:max-w-[100px]'
      : 'min-w-[80px] sm:min-w-[120px]'
    : 'min-w-[80px] sm:min-w-[200px]'
}`}>
  {activeBrandTab === 'BRAND-BASE' ? (
    <>
      {project.creatorName && (
        <div className="text-xs sm:text-sm font-semibold text-primary-600 mb-1">
          {project.creatorName}
        </div>
      )}
      {project.brandName && (
        <div className="text-xs sm:text-sm font-medium text-neutral-900">
          {project.brandName}
        </div>
      )}
    </>
  ) : (
    <>
      <div className="text-xs sm:text-sm font-medium">
        {project.name}
      </div>
      {project.description && (
        <div className="text-xs text-neutral-500 mt-1 line-clamp-2">
          {project.description}
        </div>
      )}
    </>
  )}
</td>

<td className={`sticky ${
  activeBrandTab === 'BRAND-BASE'
    ? viewType === 'monthly'
      ? 'left-[60px] sm:left-[80px]'
      : 'left-[80px] sm:left-[120px]'
    : 'left-[80px] sm:left-[200px]'
} z-20 bg-white border border-neutral-200 px-1 sm:px-2 py-2 text-center shadow-sm w-[40px] sm:w-[60px]`}>
  <button
  onClick={() => {
    console.log('Button clicked, activeBrandTab:', activeBrandTab, 'viewType:', viewType);
    console.log('onOpenCreatorBrands exists:', !!onOpenCreatorBrands);
    console.log('project:', project);
    
    if (activeBrandTab === 'BRAND-BASE' && viewType === 'monthly') {
      // 年間スケジュールの場合は、onOpenCreatorBrandsを呼び出す
      if (onOpenCreatorBrands) {
        console.log('Calling onOpenCreatorBrands');
        onOpenCreatorBrands(project);
      } else {
        console.log('onOpenCreatorBrands is not defined');
      }
    } else {
      // それ以外の場合は通常通りプロジェクトを開く
      console.log('Calling onSelectProject');
      onSelectProject(project);
    }
  }}
  className="px-1 sm:px-2 py-1 text-xs text-primary-600 underline hover:text-primary-700 hover:no-underline transition-colors"
  title={activeBrandTab === 'BRAND-BASE' && viewType === 'monthly' ? 'ブランド一覧を開く' : 'プロジェクトを開く'}
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
  className={`p-0 cursor-cell relative select-none ${
    isPrimarySelected
      ? 'border-4 border-primary-600 shadow-lg' 
      : isSelected
        ? 'border-2 border-primary-400 bg-primary-50/30'
        : 'border border-neutral-200'
  }`}
  onClick={(e) => handleCellClick(project.id, date, e)}
  onMouseDown={(e) => handleCellMouseDown(project.id, date, e)}
  onMouseEnter={() => handleCellMouseEnter(project.id, date)}
  onDoubleClick={() => handleCellDoubleClick(project.id, date)}
  onPaste={(e) => handlePaste(e, project.id, date)}
  onKeyDown={(e) => handleKeyDown(e, project.id, dateIndex)}
  onContextMenu={(e) => {
    e.preventDefault();
    setShowColorPicker({ projectId: project.id, date: dateStr });
  }}
  onTouchStart={(e) => {
    const touchTimer = setTimeout(() => {
      e.preventDefault();
      setShowColorPicker({ projectId: project.id, date: dateStr });
    }, 500);
    
    const clearTimer = () => {
      clearTimeout(touchTimer);
      document.removeEventListener('touchend', clearTimer);
      document.removeEventListener('touchmove', clearTimer);
    };
    
    document.addEventListener('touchend', clearTimer);
    document.addEventListener('touchmove', clearTimer);
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
    <select
  value={columnWidth}
  onChange={(e) => setColumnWidth(e.target.value as 'narrow' | 'wide')}
  className="px-3 py-1.5 text-xs border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-100 focus:border-primary-500 bg-white"
  title="列幅を変更"
>
  <option value="narrow">狭い</option>
  <option value="wide">広い</option>
</select>
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
                    <thead className="sticky top-0 z-30 bg-neutral-50">
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
            <thead className="sticky top-0 z-30 bg-neutral-50">
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
    <span className="hidden sm:inline">• ダブルクリックで編集</span>
    <span className="sm:hidden">• タップで編集</span>
    <span className="hidden sm:inline">• 右クリックで色選択</span>
    <span className="sm:hidden">• 長押しで色選択</span>
    <span className="hidden sm:inline">• 矢印キーで移動</span>
    <span className="hidden sm:inline">• Enterで編集開始</span>
    <span className="hidden sm:inline">• Ctrl+クリックで複数選択</span>
    <span className="hidden sm:inline">• Shiftで範囲選択</span>
    <span className="hidden sm:inline">• Ctrl+C でコピー</span>
    <span className="hidden sm:inline">• Ctrl+V でペースト</span>
  </div>
</div>
    </div>
  );
}