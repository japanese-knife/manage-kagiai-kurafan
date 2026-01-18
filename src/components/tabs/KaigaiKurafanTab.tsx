import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabase';
import { Project, Task, ProjectStatus, BrandType } from '../../types';
import { FolderKanban, Plus, ArrowRight, Calendar, CheckSquare, Trash2, Edit2, Copy } from 'lucide-react';

interface KaigaiKurafanTabProps {
  projects: Project[];
  user: User;
  onSelectProject: (project: Project) => void;
  onProjectsChange: () => void;
}

interface ProjectStats {
  projectId: string;
  totalTasks: number;
  completedTasks: number;
  progress: number;
}

export default function KaigaiKurafanTab({ 
  projects, 
  user, 
  onSelectProject, 
  onProjectsChange 
}: KaigaiKurafanTabProps) {
  const [projectStats, setProjectStats] = useState<Map<string, ProjectStats>>(new Map());
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editProjectName, setEditProjectName] = useState('');
  const [editProjectDescription, setEditProjectDescription] = useState('');
  const [editBrandType, setEditBrandType] = useState<BrandType>('海外クラファン.com');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadProjectStats();
  }, [projects]);

  const loadProjectStats = async () => {
    const statsMap = new Map<string, ProjectStats>();
    const kaigaiProjects = projects.filter(p => p.brand_type === '海外クラファン.com');
    
    for (const project of kaigaiProjects) {
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
  };

  const handleStatusChange = async (projectId: string, newStatus: ProjectStatus) => {
    try {
      const { error } = await supabase
        .from('projects')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', projectId);

      if (error) throw error;

      onProjectsChange();
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

      onProjectsChange();
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

      if (projectError) throw projectError;

      // タスクを複製
      const { data: tasks, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .eq('project_id', project.id)
        .order('created_at', { ascending: true });

      if (tasksError) throw tasksError;

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

          // サブタスクを複製
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

            await supabase.from('subtasks').insert(newSubtasks);
          }

          // タスクメモを複製
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

            await supabase.from('task_notes').insert(newNotes);
          }
        }
      }

      // その他のデータを複製（プロジェクトメモ、スケジュール、資料、打ち合わせ、リターンなど）
      await duplicateProjectData(project.id, newProject.id, user.id, errors);

      if (errors.length > 0) {
        alert(`プロジェクトは複製されましたが、一部のセクションで問題が発生しました:\n\n${errors.join('\n')}`);
      } else {
        alert('プロジェクトを複製しました');
      }
      
      onProjectsChange();
    } catch (error) {
      console.error('プロジェクト複製エラー:', error);
      alert('プロジェクトの複製に失敗しました');
    }
  };

  const duplicateProjectData = async (oldProjectId: string, newProjectId: string, userId: string, errors: string[]) => {
    // プロジェクトメモ
    const { data: projectNotes } = await supabase
      .from('project_notes')
      .select('*')
      .eq('project_id', oldProjectId)
      .order('created_at', { ascending: true });

    if (projectNotes && projectNotes.length > 0) {
      for (const note of projectNotes) {
        await supabase.from('project_notes').insert({
          project_id: newProjectId,
          content: note.content,
          user_id: userId,
        });
        await new Promise(resolve => setTimeout(resolve, 10));
      }
    }

    // スケジュール
    const { data: schedules } = await supabase
      .from('schedules')
      .select('*')
      .eq('project_id', oldProjectId)
      .order('created_at', { ascending: true });

    if (schedules && schedules.length > 0) {
      for (const schedule of schedules) {
        await supabase.from('schedules').insert({
          project_id: newProjectId,
          content: schedule.content,
          milestone: schedule.milestone,
          user_id: userId,
        });
        await new Promise(resolve => setTimeout(resolve, 10));
      }
    }

    // 資料
    const { data: documents } = await supabase
      .from('documents')
      .select('*')
      .eq('project_id', oldProjectId)
      .order('created_at', { ascending: true });

    if (documents && documents.length > 0) {
      for (const doc of documents) {
        await supabase.from('documents').insert({
          project_id: newProjectId,
          name: doc.name,
          url: doc.url,
          memo: doc.memo,
          user_id: userId,
        });
        await new Promise(resolve => setTimeout(resolve, 10));
      }
    }

    // 打ち合わせ
    const { data: meetings } = await supabase
      .from('meetings')
      .select('*')
      .eq('project_id', oldProjectId)
      .order('created_at', { ascending: true });

    if (meetings && meetings.length > 0) {
      for (const meeting of meetings) {
        await supabase.from('meetings').insert({
          project_id: newProjectId,
          date: meeting.date,
          participants: meeting.participants,
          summary: meeting.summary,
          decisions: meeting.decisions,
          user_id: userId,
        });
        await new Promise(resolve => setTimeout(resolve, 10));
      }
    }

    // リターン
    const { data: returns } = await supabase
      .from('returns')
      .select('*')
      .eq('project_id', oldProjectId)
      .order('created_at', { ascending: true });

    if (returns && returns.length > 0) {
      for (const ret of returns) {
        await supabase.from('returns').insert({
          project_id: newProjectId,
          name: ret.name,
          price_range: ret.price_range,
          description: ret.description,
          status: ret.status,
          user_id: userId,
        });
        await new Promise(resolve => setTimeout(resolve, 10));
      }
    }

    // ページデザイン要項
    const { data: designRequirements } = await supabase
      .from('design_requirements')
      .select('*')
      .eq('project_id', oldProjectId)
      .order('created_at', { ascending: true });

    if (designRequirements && designRequirements.length > 0) {
      for (const req of designRequirements) {
        await supabase.from('design_requirements').insert({
          project_id: newProjectId,
          name: req.name,
          url: req.url,
          memo: req.memo,
          user_id: userId,
        });
        await new Promise(resolve => setTimeout(resolve, 10));
      }
    }

    // 掲載文章要項
    const { data: textContentRequirements } = await supabase
      .from('text_content_requirements')
      .select('*')
      .eq('project_id', oldProjectId)
      .order('created_at', { ascending: true });

    if (textContentRequirements && textContentRequirements.length > 0) {
      for (const req of textContentRequirements) {
        await supabase.from('text_content_requirements').insert({
          project_id: newProjectId,
          name: req.name,
          url: req.url,
          memo: req.memo,
          user_id: userId,
        });
        await new Promise(resolve => setTimeout(resolve, 10));
      }
    }

    // 掲載動画要項
    const { data: videoRequirements } = await supabase
      .from('video_requirements')
      .select('*')
      .eq('project_id', oldProjectId)
      .order('created_at', { ascending: true });

    if (videoRequirements && videoRequirements.length > 0) {
      for (const req of videoRequirements) {
        await supabase.from('video_requirements').insert({
          project_id: newProjectId,
          video_type: req.video_type,
          duration: req.duration,
          required_cuts: req.required_cuts,
          has_narration: req.has_narration,
          reference_url: req.reference_url,
          user_id: userId,
        });
        await new Promise(resolve => setTimeout(resolve, 10));
      }
    }

    // 画像アセット
    const { data: imageAssets } = await supabase
      .from('image_assets')
      .select('*')
      .eq('project_id', oldProjectId)
      .order('created_at', { ascending: true });

    if (imageAssets && imageAssets.length > 0) {
      for (const asset of imageAssets) {
        await supabase.from('image_assets').insert({
          project_id: newProjectId,
          name: asset.name,
          purpose: asset.purpose,
          url: asset.url,
          status: asset.status,
          user_id: userId,
        });
        await new Promise(resolve => setTimeout(resolve, 10));
      }
    }
  };

  const handleStartEdit = (project: Project) => {
    setEditingProjectId(project.id);
    setEditProjectName(project.name);
    setEditProjectDescription(project.description || '');
    setEditBrandType(project.brand_type || '海外クラファン.com');
  };

  const handleCancelEdit = () => {
    setEditingProjectId(null);
    setEditProjectName('');
    setEditProjectDescription('');
    setEditBrandType('海外クラファン.com');
  };

  const handleUpdateProject = async (projectId: string) => {
    if (!editProjectName.trim()) return;

    try {
      const { error } = await supabase
        .from('projects')
        .update({
          name: editProjectName,
          description: editProjectDescription,
          brand_type: editBrandType,
          updated_at: new Date().toISOString(),
        })
        .eq('id', projectId);

      if (error) throw error;

      setEditingProjectId(null);
      setEditProjectName('');
      setEditProjectDescription('');
      setEditBrandType('海外クラファン.com');
      onProjectsChange();
    } catch (error) {
      console.error('プロジェクト更新エラー:', error);
      alert('プロジェクトの更新に失敗しました');
    }
  };

  const filterProjects = (projectsList: Project[]): Project[] => {
    if (!searchQuery.trim()) return projectsList;
    
    const query = searchQuery.toLowerCase();
    return projectsList.filter(project => 
      project.name.toLowerCase().includes(query) ||
      (project.description && project.description.toLowerCase().includes(query))
    );
  };
  
  const getProjectsByStatus = (status: ProjectStatus): Project[] => {
  const kaigaiProjects = projects.filter((p) => p.brand_type === '海外クラファン.com');
  return filterProjects(kaigaiProjects).filter((p) => p.status === status);
};

const kaigaiProjects = filterProjects(projects.filter(p => p.brand_type === '海外クラファン.com'));

return (
  <div className="mt-8">
    {/* 検索バー */}
    <div className="mb-6">
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="プロジェクト名や説明で検索..."
        className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-100 focus:border-primary-500 bg-white text-sm"
      />
    </div>

    <h2 className="text-lg font-semibold text-neutral-900 mb-6">プロジェクト一覧</h2>

    {kaigaiProjects.length === 0 ? (
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
      </div>
    ) : (
      <div className="space-y-8 sm:space-y-10 md:space-y-12">
      {(['PICKS', '進行中', '保留', '完了'] as ProjectStatus[]).map((status) => {
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
                                タイプ
                              </label>
                              <select
                                value={editBrandType}
                                onChange={(e) => setEditBrandType(e.target.value as BrandType)}
                                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-100 focus:border-primary-500"
                              >
                                <option value="海外クラファン.com">海外クラファン.com</option>
                                <option value="BRAND-BASE">BRAND-BASE</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-neutral-700 mb-2">
                                事業者名
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
                                商品
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
      : project.status === 'PICKS'
      ? 'bg-purple-50 text-purple-700'
      : project.status === '保留'
      ? 'bg-yellow-50 text-yellow-700'
      : 'bg-primary-50 text-primary-700'
  }`}
>
  <option value="進行中">進行中</option>
  <option value="PICKS">PICKS</option>
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
    </div>
  );
}