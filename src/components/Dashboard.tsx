import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { Project, Task, ProjectStatus } from '../types';
import { FolderKanban, Plus, ArrowRight, Calendar, CheckSquare, LogOut, Trash2, Edit2 } from 'lucide-react';

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
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      setNewProjectName('');
      setNewProjectDescription('');
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
      // タスクは外部キー制約で自動削除されるため、プロジェクトのみ削除
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
    return projects.filter((p) => p.status === status);
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
                  プロジェクト名 *
                </label>
                <input
                  type="text"
                  required
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-100 focus:border-primary-500 bg-white"
                  placeholder="例: 2024年春のクラウドファンディング"
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
                          className="bg-white rounded-2xl border border-neutral-200/50 hover:border-primary-300 hover:shadow-xl transition-all group"
                        >
                          <div className="p-6">
                            {editingProjectId === project.id ? (
                              <div className="space-y-4">
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
                                  <div
                                    className="flex-1 cursor-pointer"
                                    onClick={() => onSelectProject(project)}
                                  >
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
                              </>
                            )}

                            {editingProjectId !== project.id && (
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
                          </div>
                            )}
                          </div>
                        </div>
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
    </div>
  );
}
