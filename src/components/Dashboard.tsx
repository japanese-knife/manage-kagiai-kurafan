import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { Project, Task, ProjectStatus, BrandType } from '../types';
import { FolderKanban, Plus, ArrowRight, Calendar, CheckSquare, LogOut, Trash2, Edit2, Copy } from 'lucide-react';
import Footer from './Footer';

interface DashboardProps {
  onSelectProject: (project: Project) => void;
  user: User;
  onLogout: () => void;
}

interface ProjectStats {
  projectId: string;
  totalTasks: number;
  completedTasks: number;
  progress: number;
}

export default function Dashboard({ onSelectProject, user, onLogout }: DashboardProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectStats, setProjectStats] = useState<Map<string, ProjectStats>>(new Map());
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');
  const [newBrandType, setNewBrandType] = useState<BrandType>('海外クラファン.com');
  const [activeBrandTab, setActiveBrandTab] = useState<BrandType>('海外クラファン.com');
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editProjectName, setEditProjectName] = useState('');
  const [editProjectDescription, setEditProjectDescription] = useState('');

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('*')
        .order('updated_at', { ascending: false });

      if (projectsError) throw projectsError;

      setProjects(projectsData || []);

      const statsMap = new Map<string, ProjectStats>();
      for (const project of projectsData || []) {
        const { data: tasksData } = await supabase
          .from('tasks')
          .select('status')
          .eq('project_id', project.id);

        const total = tasksData?.length || 0;
        const completed = tasksData?.filter((t: Task) => t.status === '完了').length || 0;
        const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

        statsMap.set(project.id, {
          projectId: project.id,
          totalTasks: total,
          completedTasks: completed,
          progress,
        });
      }

      setProjectStats(statsMap);
    } catch (error) {
      console.error('プロジェクト読み込みエラー:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newProjectName.trim()) return;

    try {
      const { data, error } = await supabase
        .from('projects')
        .insert({
          name: newProjectName,
          description: newProjectDescription,
          status: '進行中',
          brand_type: newBrandType,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      setNewProjectName('');
      setNewProjectDescription('');
      setNewBrandType('海外クラファン.com');
      setShowCreateForm(false);
      loadProjects();
    } catch (error) {
      console.error('プロジェクト作成エラー:', error);
    }
  };

  const handleStatusChange = async (projectId: string, newStatus: ProjectStatus) => {
    try {
      const { error } = await supabase
        .from('projects')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', projectId);

      if (error) throw error;

      loadProjects();
    } catch (error) {
      console.error('ステータス更新エラー:', error);
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    if (!confirm('このプロジェクトを削除してもよろしいですか？関連するタスクもすべて削除されます。')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId);

      if (error) throw error;

      loadProjects();
    } catch (error) {
      console.error('プロジェクト削除エラー:', error);
      alert('プロジェクトの削除に失敗しました');
    }
  };

  const handleDuplicateProject = async (project: Project, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!confirm(`「${project.name}」を複製しますか？全てのセクション内容（タスク、資料、打ち合わせ、リターン、各種要項など）が複製されます。`)) {
      return;
    }

    const errors: string[] = [];

    try {
      // プロジェクトを複製
      const { data: newProject, error: projectError } = await supabase
        .from('projects')
        .insert({
          name: `${project.name}のコピー`,
          description: project.description,
          status: project.status,
          brand_type: project.brand_type || '海外クラファン.com',
          user_id: user.id,
        })
        .select()
        .single();

      if (projectError) {
        console.error('プロジェクト作成エラー:', projectError);
        throw projectError;
      }

      // 元のプロジェクトのタスクを取得
      const { data: tasks, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .eq('project_id', project.id)
        .order('created_at', { ascending: true });

      if (tasksError) throw tasksError;

      // タスクIDのマッピング（元のタスクID → 新しいタスクID）
      const taskIdMap = new Map<string, string>();

      // タスクを複製
      if (tasks && tasks.length > 0) {
        for (const task of tasks) {
          const { data: newTask, error: taskInsertError } = await supabase
            .from('tasks')
            .insert({
              project_id: newProject.id,
              title: task.title,
              description: task.description,
              status: task.status,
              priority: task.priority,
              due_date: task.due_date,
              user_id: user.id,
            })
            .select()
            .single();

          if (taskInsertError) throw taskInsertError;

          // 元のタスクIDと新しいタスクIDをマッピング
          taskIdMap.set(task.id, newTask.id);

          // サブタスクを取得して複製
          const { data: subtasks, error: subtasksError } = await supabase
            .from('subtasks')
            .select('*')
            .eq('task_id', task.id)
            .order('created_at', { ascending: true });

          if (!subtasksError && subtasks && subtasks.length > 0) {
            const newSubtasks = subtasks.map(subtask => ({
              task_id: newTask.id,
              title: subtask.title,
              completed: subtask.completed,
              user_id: user.id,
            }));

            const { error: subtaskInsertError } = await supabase
              .from('subtasks')
              .insert(newSubtasks);

            if (subtaskInsertError) {
              console.error('サブタスク複製エラー:', subtaskInsertError);
            }
          }

          // タスクメモを取得して複製
          const { data: notes, error: notesError } = await supabase
            .from('task_notes')
            .select('*')
            .eq('task_id', task.id)
            .order('created_at', { ascending: true });

          if (!notesError && notes && notes.length > 0) {
            const newNotes = notes.map(note => ({
              task_id: newTask.id,
              content: note.content,
              user_id: user.id,
            }));

            const { error: noteInsertError } = await supabase
              .from('task_notes')
              .insert(newNotes);

            if (noteInsertError) {
              console.error('メモ複製エラー:', noteInsertError);
            }
          }
        }
      }

      // プロジェクトメモを取得して複製
      const { data: projectNotes, error: projectNotesError } = await supabase
        .from('project_notes')
        .select('*')
        .eq('project_id', project.id)
        .order('created_at', { ascending: true });

      if (!projectNotesError && projectNotes && projectNotes.length > 0) {
  for (const note of projectNotes) {
    const { error: projectNoteInsertError } = await supabase
      .from('project_notes')
      .insert({
        project_id: newProject.id,
        content: note.content,
        user_id: user.id,
      });

    if (projectNoteInsertError) {
      console.error('プロジェクトメモ複製エラー:', projectNoteInsertError);
    }
    
    await new Promise(resolve => setTimeout(resolve, 10));
  }
}

      // スケジュールを取得して複製
      const { data: schedules, error: schedulesError } = await supabase
        .from('schedules')
        .select('*')
        .eq('project_id', project.id)
        .order('created_at', { ascending: true });

      if (!schedulesError && schedules && schedules.length > 0) {
  for (const schedule of schedules) {
    const { error: scheduleInsertError } = await supabase
      .from('schedules')
      .insert({
        project_id: newProject.id,
        content: schedule.content,
        milestone: schedule.milestone,
        user_id: user.id,
      });

    if (scheduleInsertError) {
      console.error('スケジュール複製エラー:', scheduleInsertError);
    }
    
    // 順序を確実に保持するため少し待機
    await new Promise(resolve => setTimeout(resolve, 10));
  }
}

      // 資料一覧を取得して複製
      const { data: documents, error: documentsError } = await supabase
        .from('documents')
        .select('*')
        .eq('project_id', project.id)
        .order('created_at', { ascending: true });

      if (!documentsError && documents && documents.length > 0) {
  for (const doc of documents) {
    const { error: documentInsertError } = await supabase
      .from('documents')
      .insert({
        project_id: newProject.id,
        name: doc.name,
        url: doc.url,
        memo: doc.memo,
        user_id: user.id,
      });

    if (documentInsertError) {
      console.error('資料一覧複製エラー:', documentInsertError);
    }
    
    await new Promise(resolve => setTimeout(resolve, 10));
  }
}

      // 打ち合わせ内容を取得して複製
      console.log('打ち合わせ内容を複製中...');
      const { data: meetings, error: meetingsError } = await supabase
        .from('meetings')
        .select('*')
        .eq('project_id', project.id)
        .order('created_at', { ascending: true });

      if (meetingsError) {
        console.error('打ち合わせ内容取得エラー:', meetingsError);
        errors.push(`打ち合わせ内容: ${meetingsError.message}`);
      } else if (meetings && meetings.length > 0) {
  console.log(`${meetings.length}件の打ち合わせ内容を複製`);
  for (const meeting of meetings) {
    const { error: meetingInsertError } = await supabase
      .from('meetings')
      .insert({
        project_id: newProject.id,
        date: meeting.date,
        participants: meeting.participants,
        summary: meeting.summary,
        decisions: meeting.decisions,
        user_id: user.id,
      });

    if (meetingInsertError) {
      console.error('打ち合わせ内容挿入エラー:', meetingInsertError);
      errors.push(`打ち合わせ内容挿入: ${meetingInsertError.message}`);
    }
    
    await new Promise(resolve => setTimeout(resolve, 10));
  }

      } else {
        console.log('打ち合わせ内容なし');
      }

      // リターン内容を取得して複製
      console.log('リターン内容を複製中...');
      const { data: returns, error: returnsError } = await supabase
        .from('returns')
        .select('*')
        .eq('project_id', project.id)
        .order('created_at', { ascending: true });

      if (returnsError) {
        console.error('リターン内容取得エラー:', returnsError);
        errors.push(`リターン内容: ${returnsError.message}`);
      } else if (returns && returns.length > 0) {
  console.log(`${returns.length}件のリターン内容を複製`);
  for (const ret of returns) {
    const { error: returnInsertError } = await supabase
      .from('returns')
      .insert({
        project_id: newProject.id,
        name: ret.name,
        price_range: ret.price_range,
        description: ret.description,
        status: ret.status,
        user_id: user.id,
      });

    if (returnInsertError) {
      console.error('リターン内容挿入エラー:', returnInsertError);
      errors.push(`リターン内容挿入: ${returnInsertError.message}`);
    }
    
    await new Promise(resolve => setTimeout(resolve, 10));
  }

      } else {
        console.log('リターン内容なし');
      }

      // ページデザイン要項を取得して複製
      const { data: designRequirements, error: designReqError } = await supabase
        .from('design_requirements')
        .select('*')
        .eq('project_id', project.id)
        .order('created_at', { ascending: true });

      if (!designReqError && designRequirements && designRequirements.length > 0) {
  for (const req of designRequirements) {
    const { error: designReqInsertError } = await supabase
      .from('design_requirements')
      .insert({
        project_id: newProject.id,
        name: req.name,
        url: req.url,
        memo: req.memo,
        user_id: user.id,
      });

    if (designReqInsertError) {
      console.error('ページデザイン要項複製エラー:', designReqInsertError);
    }
    
    await new Promise(resolve => setTimeout(resolve, 10));
  }
}

      // 掲載文章要項を取得して複製
      console.log('掲載文章要項を複製中...');
      const { data: textContentRequirements, error: textContentReqError } = await supabase
        .from('text_content_requirements')
        .select('*')
        .eq('project_id', project.id)
        .order('created_at', { ascending: true });

      if (textContentReqError) {
        console.error('掲載文章要項取得エラー:', textContentReqError);
        errors.push(`掲載文章要項: ${textContentReqError.message}`);
      } else if (textContentRequirements && textContentRequirements.length > 0) {
  console.log(`${textContentRequirements.length}件の掲載文章要項を複製`);
  for (const req of textContentRequirements) {
    const { error: textContentReqInsertError } = await supabase
      .from('text_content_requirements')
      .insert({
        project_id: newProject.id,
        name: req.name,
        url: req.url,
        memo: req.memo,
        user_id: user.id,
      });

    if (textContentReqInsertError) {
      console.error('掲載文章要項挿入エラー:', textContentReqInsertError);
      errors.push(`掲載文章要項挿入: ${textContentReqInsertError.message}`);
    }
    
    await new Promise(resolve => setTimeout(resolve, 10));
  }
  console.log('掲載文章要項の複製が完了しました');

      } else {
        console.log('掲載文章要項なし');
      }

      // 掲載動画要項を取得して複製
      console.log('掲載動画要項を複製中...');
      const { data: videoRequirements, error: videoReqError } = await supabase
        .from('video_requirements')
        .select('*')
        .eq('project_id', project.id)
        .order('created_at', { ascending: true });

      if (videoReqError) {
        console.error('掲載動画要項取得エラー:', videoReqError);
        errors.push(`掲載動画要項: ${videoReqError.message}`);
      } else if (videoRequirements && videoRequirements.length > 0) {
  console.log(`${videoRequirements.length}件の掲載動画要項を複製`);
  for (const req of videoRequirements) {
    const { error: videoReqInsertError } = await supabase
      .from('video_requirements')
      .insert({
        project_id: newProject.id,
        video_type: req.video_type,
        duration: req.duration,
        required_cuts: req.required_cuts,
        has_narration: req.has_narration,
        reference_url: req.reference_url,
        user_id: user.id,
      });

    if (videoReqInsertError) {
      console.error('掲載動画要項挿入エラー:', videoReqInsertError);
      errors.push(`掲載動画要項挿入: ${videoReqInsertError.message}`);
    }
    
    await new Promise(resolve => setTimeout(resolve, 10));
  }

      } else {
        console.log('掲載動画要項なし');
      }

      // 画像アセットを取得して複製
      console.log('画像アセットを複製中...');
      const { data: imageAssets, error: imageAssetsError } = await supabase
        .from('image_assets')
        .select('*')
        .eq('project_id', project.id)
        .order('created_at', { ascending: true });

      if (imageAssetsError) {
        console.error('画像アセット取得エラー:', imageAssetsError);
        errors.push(`画像アセット: ${imageAssetsError.message}`);
      } else if (imageAssets && imageAssets.length > 0) {
  console.log(`${imageAssets.length}件の画像アセットを複製`);
  for (const asset of imageAssets) {
    const { error: imageAssetsInsertError } = await supabase
      .from('image_assets')
      .insert({
        project_id: newProject.id,
        name: asset.name,
        purpose: asset.purpose,
        url: asset.url,
        status: asset.status,
        user_id: user.id,
      });

    if (imageAssetsInsertError) {
      console.error('画像アセット挿入エラー:', imageAssetsInsertError);
      errors.push(`画像アセット挿入: ${imageAssetsInsertError.message}`);
    }
    
    await new Promise(resolve => setTimeout(resolve, 10));
  }
} else {
        console.log('画像アセットなし');
      }

      // エラーがあった場合は警告を表示、なければ成功メッセージ
      if (errors.length > 0) {
        const errorMessage = `プロジェクトは複製されましたが、一部のセクションで問題が発生しました:\n\n${errors.join('\n')}`;
        alert(errorMessage);
        console.error('複製時のエラー一覧:', errors);
      } else {
        alert('プロジェクトを複製しました');
      }
      
      loadProjects();
    } catch (error) {
      console.error('プロジェクト複製エラー:', error);
      alert('プロジェクトの複製に失敗しました。詳細はコンソールを確認してください。');
    }
  };
  
  const handleStartEdit = (project: Project) => {
    setEditingProjectId(project.id);
    setEditProjectName(project.name);
    setEditProjectDescription(project.description || '');
  };

  const handleCancelEdit = () => {
    setEditingProjectId(null);
    setEditProjectName('');
    setEditProjectDescription('');
  };

  const handleUpdateProject = async (projectId: string) => {
    if (!editProjectName.trim()) return;

    try {
      const { error } = await supabase
        .from('projects')
        .update({
          name: editProjectName,
          description: editProjectDescription,
          updated_at: new Date().toISOString(),
        })
        .eq('id', projectId);

      if (error) throw error;

      setEditingProjectId(null);
      setEditProjectName('');
      setEditProjectDescription('');
      loadProjects();
    } catch (error) {
      console.error('プロジェクト更新エラー:', error);
      alert('プロジェクトの更新に失敗しました');
    }
  };
  
  const getProjectsByStatus = (status: ProjectStatus): Project[] => {
    return projects.filter((p) => p.status === status && p.brand_type === activeBrandTab);
  };
  
  const getProjectCountByBrand = (brandType: BrandType): number => {
    return projects.filter((p) => p.brand_type === brandType).length;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-neutral-600">読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <header className="bg-white/80 backdrop-blur-sm border-b border-neutral-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-12 py-6 sm:py-8 md:py-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between w-full sm:relative gap-4 sm:gap-0">
            <div className="flex items-center justify-center order-1 sm:order-2 sm:absolute sm:left-1/2 sm:transform sm:-translate-x-1/2">
              <img
                src="/kaigai-kurafan-logo.png"
                alt="海外クラファン.com"
                className="h-8 sm:h-10 md:h-12 w-auto"
              />
            </div>
            <div className="flex items-center space-x-3 sm:space-x-4 flex-1 order-2 sm:order-1">
              <div className="w-10 h-10 sm:w-11 sm:h-11 bg-primary-50 rounded-xl flex items-center justify-center">
                <FolderKanban className="w-5 h-5 sm:w-6 sm:h-6 text-primary-600" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl md:text-2xl font-semibold text-neutral-900 tracking-tight">
                  プロジェクト管理
                </h1>
                <p className="text-xs sm:text-sm text-neutral-500 mt-1 sm:mt-1.5">
                  {projects.length}件のプロジェクト
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 flex-1 justify-end order-3 sm:order-3">
              <button
                onClick={() => setShowCreateForm(true)}
                className="inline-flex items-center justify-center px-4 sm:px-5 py-2 sm:py-2.5 btn-gradient-animated text-white text-sm font-medium rounded-lg shadow-soft-lg"
              >
                <Plus className="w-4 h-4 mr-1.5 sm:mr-2" />
                <span className="hidden sm:inline">新規プロジェクト</span>
              </button>
              <button
                onClick={onLogout}
                className="inline-flex items-center justify-center px-3 sm:px-4 py-2 sm:py-2.5 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 text-sm font-medium rounded-lg transition-all"
              >
                <LogOut className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">ログアウト</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-12 py-6 sm:py-8 md:py-12">
        {showCreateForm && (
          <div className="bg-white rounded-2xl border border-neutral-200/50 p-4 sm:p-6 md:p-8 mb-6 sm:mb-8 md:mb-10 shadow-lg">
            <h2 className="text-base sm:text-lg font-semibold text-neutral-900 mb-4 sm:mb-6">
              新しいプロジェクトを作成
            </h2>
            <form onSubmit={handleCreateProject} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2.5">
                  ブランド *
                </label>
                <select
                  value={newBrandType}
                  onChange={(e) => setNewBrandType(e.target.value as BrandType)}
                  className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-100 focus:border-primary-500 bg-white"
                >
                  <option value="海外クラファン.com">海外クラファン.com</option>
                  <option value="BRAND-BASE">BRAND-BASE</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2.5">
                  プロジェクト名 *
                </label>
                <input
                  type="text"
                  required
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-100 focus:border-primary-500 bg-white"
                  placeholder="例: 株式会社RE-IDEA様"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2.5">
                  説明
                </label>
                <textarea
                  value={newProjectDescription}
                  onChange={(e) => setNewProjectDescription(e.target.value)}
                  className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-100 focus:border-primary-500 bg-white resize-none"
                  rows={3}
                  placeholder="プロジェクトの概要や目的"
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-3">
                <button
                  type="submit"
                  className="w-full sm:w-auto px-6 py-2.5 btn-gradient-animated text-white font-medium rounded-lg shadow-soft-lg"
                >
                  作成
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false);
                    setNewProjectName('');
                    setNewProjectDescription('');
                  }}
                  className="w-full sm:w-auto px-6 py-2.5 bg-white border border-neutral-300 text-neutral-700 font-medium rounded-lg hover:bg-neutral-50"
                >
                  キャンセル
                </button>
              </div>
            </form>
          </div>
        )}

        {projects.length === 0 ? (
          <div className="text-center py-16 sm:py-20 md:py-24 px-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-neutral-100 rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6">
              <FolderKanban className="w-8 h-8 sm:w-10 sm:h-10 text-neutral-400" />
            </div>
            <h2 className="text-base sm:text-lg font-semibold text-neutral-900 mb-2">
              プロジェクトがありません
            </h2>
            <p className="text-sm sm:text-base text-neutral-500 mb-6 sm:mb-8 leading-relaxed">
              新しいプロジェクトを作成して始めましょう
            </p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="inline-flex items-center px-5 sm:px-6 py-2 sm:py-2.5 btn-gradient-animated text-white text-sm font-medium rounded-lg shadow-soft-lg"
            >
              <Plus className="w-4 h-4 mr-1.5 sm:mr-2" />
              プロジェクトを作成
            </button>
          </div>
        ) : (
          <div className="space-y-8 sm:space-y-10 md:space-y-12">
            {(['進行中', '保留', '完了'] as ProjectStatus[]).map((status) => {
              const statusProjects = getProjectsByStatus(status);
              if (statusProjects.length === 0) return null;

              return (
                <div key={status}>
                  <div className="flex items-center mb-4 sm:mb-6">
                    <h2 className="text-sm sm:text-base font-semibold text-neutral-900">
                      {status}
                    </h2>
                    <span className="ml-2 sm:ml-3 px-2 sm:px-3 py-0.5 sm:py-1 text-xs font-medium bg-neutral-100 text-neutral-600 rounded-full">
                      {statusProjects.length}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
                    {statusProjects.map((project) => {
                      const stats = projectStats.get(project.id);
                      const lastUpdated = new Date(project.updated_at).toLocaleDateString('ja-JP');

                      return (
                        <div
                          key={project.id}
                          className="bg-white rounded-2xl border border-neutral-200/50 hover:border-primary-300 hover:shadow-xl transition-all group cursor-pointer"
                          onClick={() => onSelectProject(project)}
                        >
                          <div className="p-6">
                            {editingProjectId === project.id ? (
                              <div 
                                className="space-y-4"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <div>
                                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                                    プロジェクト名
                                  </label>
                                  <input
                                    type="text"
                                    value={editProjectName}
                                    onChange={(e) => setEditProjectName(e.target.value)}
                                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-100 focus:border-primary-500"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                                    説明
                                  </label>
                                  <textarea
                                    value={editProjectDescription}
                                    onChange={(e) => setEditProjectDescription(e.target.value)}
                                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-100 focus:border-primary-500 resize-none"
                                    rows={2}
                                  />
                                </div>
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleUpdateProject(project.id)}
                                    className="flex-1 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700"
                                  >
                                    保存
                                  </button>
                                  <button
                                    onClick={handleCancelEdit}
                                    className="flex-1 px-4 py-2 bg-white border border-neutral-300 text-neutral-700 text-sm font-medium rounded-lg hover:bg-neutral-50"
                                  >
                                    キャンセル
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <div className="flex items-start justify-between mb-4">
                                  <div className="flex-1">
                                    <h3 className="text-base font-semibold text-neutral-900 mb-2 group-hover:text-primary-600 transition-colors">
                                      {project.name}
                                    </h3>
                                    {project.description && (
                                      <p className="text-sm text-neutral-600 line-clamp-2 leading-relaxed">
                                        {project.description}
                                      </p>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2 ml-3">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleStartEdit(project);
                                      }}
                                      className="p-1.5 text-neutral-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                                      title="編集"
                                    >
                                      <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={(e) => handleDuplicateProject(project, e)}
                                      className="p-1.5 text-neutral-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                      title="複製"
                                    >
                                      <Copy className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteProject(project.id);
                                      }}
                                      className="p-1.5 text-neutral-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                      title="削除"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                    <select
                                      value={project.status}
                                      onChange={(e) => {
                                        e.stopPropagation();
                                        handleStatusChange(project.id, e.target.value as ProjectStatus);
                                      }}
                                      onClick={(e) => e.stopPropagation()}
                                      className={`px-3 py-1 text-xs font-medium rounded-full border-0 cursor-pointer ${
                                        project.status === '完了'
                                          ? 'bg-green-50 text-green-700'
                                          : project.status === '保留'
                                          ? 'bg-yellow-50 text-yellow-700'
                                          : 'bg-primary-50 text-primary-700'
                                      }`}
                                    >
                                      <option value="進行中">進行中</option>
                                      <option value="保留">保留</option>
                                      <option value="完了">完了</option>
                                    </select>
                                  </div>
                                </div>

                                <div className="space-y-4 mt-5">
                                  {stats && stats.totalTasks > 0 && (
                                    <>
                                      <div className="flex items-center justify-between text-sm">
                                        <span className="text-neutral-600 font-medium">進捗率</span>
                                        <span className="font-semibold text-primary-600">
                                          {stats.progress}%
                                        </span>
                                      </div>
                                      <div className="w-full bg-neutral-100 rounded-full h-2 overflow-hidden">
                                        <div
                                          className="bg-gradient-to-r from-primary-600 to-primary-500 h-2 rounded-full transition-all duration-300"
                                          style={{ width: `${stats.progress}%` }}
                                        />
                                      </div>
                                      <div className="flex items-center text-sm text-neutral-600">
                                        <CheckSquare className="w-4 h-4 mr-2 text-neutral-500" />
                                        {stats.completedTasks} / {stats.totalTasks} タスク完了
                                      </div>
                                    </>
                                  )}

                                  {(!stats || stats.totalTasks === 0) && (
                                    <div className="text-sm text-neutral-500">
                                      タスクがまだありません
                                    </div>
                                  )}

                                  <div className="pt-4 border-t border-neutral-100 flex items-center justify-between">
                                    <div className="flex items-center text-xs text-neutral-500">
                                      <Calendar className="w-3.5 h-3.5 mr-2" />
                                      {lastUpdated}
                                    </div>
                                    <div className="text-xs text-primary-600 font-medium flex items-center group-hover:translate-x-0.5 transition-transform">
                                      詳細
                                      <ArrowRight className="w-3.5 h-3.5 ml-1" />
                                    </div>
                                  </div>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}