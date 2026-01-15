import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { Project, BrandType } from '../types';
import { FolderKanban, Plus, LogOut } from 'lucide-react';
import Footer from './Footer';
import GanttChartTab from './tabs/GanttChartTab';
import KaigaiKurafanTab from './tabs/KaigaiKurafanTab';
import BrandBaseTab from './tabs/BrandBaseTab';

interface DashboardProps {
  onSelectProject: (project: Project) => void;
  user: User;
  onLogout: () => void;
}

export default function Dashboard({ onSelectProject, user, onLogout }: DashboardProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');
  const [newBrandType, setNewBrandType] = useState<BrandType>('海外クラファン.com');
  const [activeTab, setActiveTab] = useState<'schedule' | 'kaigai' | 'brandbase'>('schedule');

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
        {/* タブナビゲーション */}
        <div className="flex items-center gap-2 mb-6 sm:mb-8 border-b border-neutral-200">
          <button
            onClick={() => setActiveTab('schedule')}
            className={`px-4 sm:px-6 py-3 text-sm sm:text-base font-medium transition-all relative ${
              activeTab === 'schedule'
                ? 'text-primary-600'
                : 'text-neutral-500 hover:text-neutral-700'
            }`}
          >
            ガントチャート
            {activeTab === 'schedule' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('kaigai')}
            className={`px-4 sm:px-6 py-3 text-sm sm:text-base font-medium transition-all relative ${
              activeTab === 'kaigai'
                ? 'text-primary-600'
                : 'text-neutral-500 hover:text-neutral-700'
            }`}
          >
            海外クラファン.com
            <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-neutral-100 text-neutral-600 rounded-full">
              {getProjectCountByBrand('海外クラファン.com')}
            </span>
            {activeTab === 'kaigai' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('brandbase')}
            className={`px-4 sm:px-6 py-3 text-sm sm:text-base font-medium transition-all relative ${
              activeTab === 'brandbase'
                ? 'text-primary-600'
                : 'text-neutral-500 hover:text-neutral-700'
            }`}
          >
            BRAND-BASE
            <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-neutral-100 text-neutral-600 rounded-full">
              {getProjectCountByBrand('BRAND-BASE')}
            </span>
            {activeTab === 'brandbase' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600" />
            )}
          </button>
        </div>

        {showCreateForm && (
          <div className="bg-white rounded-2xl border border-neutral-200/50 p-4 sm:p-6 md:p-8 mb-6 sm:mb-8 md:mb-10 shadow-lg">
            <h2 className="text-base sm:text-lg font-semibold text-neutral-900 mb-4 sm:mb-6">
              新しいプロジェクトを作成
            </h2>
            <form onSubmit={handleCreateProject} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2.5">
                  タイプ *
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
                  事業者名 *
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
                  商品
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

       {/* タブコンテンツ */}
        {activeTab === 'schedule' && (
          <GanttChartTab 
            user={user} 
            activeBrandTab="all"
            viewType="daily"
            onSelectProject={onSelectProject}
          />
        )}
        {activeTab === 'kaigai' && (
          <KaigaiKurafanTab
            projects={projects}
            user={user}
            onSelectProject={onSelectProject}
            onProjectsChange={loadProjects}
          />
        )}
        {activeTab === 'brandbase' && (
          <BrandBaseTab
            projects={projects}
            user={user}
            onSelectProject={onSelectProject}
            onProjectsChange={loadProjects}
          />
        )}
      </main>
      <Footer />
    </div>
  );
}