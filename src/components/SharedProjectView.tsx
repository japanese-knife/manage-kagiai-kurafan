import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Project, TabType } from '../types';
import { FolderKanban, Lock } from 'lucide-react';
import ProgressBar from './ProgressBar';
import TabNavigation from './TabNavigation';
import OverviewTab from './OverviewTab';
import TasksTab from './TasksTab';
import CalendarTab from './CalendarTab';
import Footer from './Footer';

interface SharedProjectViewProps {
  shareToken: string;
}

export default function SharedProjectView({ shareToken }: SharedProjectViewProps) {
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  useEffect(() => {
    loadSharedProject();
  }, [shareToken]);

  const loadSharedProject = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('projects')
        .select('*')
        .eq('share_token', shareToken)
        .eq('is_shared', true)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (!data) {
        setError('このプロジェクトは共有されていないか、存在しません。');
      } else {
        setProject(data);
      }
    } catch (err) {
      console.error('共有プロジェクト読み込みエラー:', err);
      setError('プロジェクトの読み込みに失敗しました。');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-neutral-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-neutral-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Lock className="w-8 h-8 text-neutral-400" />
          </div>
          <h1 className="text-2xl font-semibold text-neutral-900 mb-3">
            アクセスできません
          </h1>
          <p className="text-neutral-600 leading-relaxed">
            {error || 'このプロジェクトは共有されていないか、存在しません。'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex flex-col">
      <header className="bg-white/80 backdrop-blur-sm border-b border-neutral-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-12 py-4 sm:py-5 md:py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-4">
            <div className="flex items-center justify-center order-1 sm:order-2">
              <img
                src="/kaigai-kurafan-logo.png"
                alt="海外クラファン.com"
                className="h-8 sm:h-10 md:h-12 w-auto"
              />
            </div>
            <div className="flex items-center space-x-3 sm:space-x-4 order-2 sm:order-1">
              <div className="w-10 h-10 sm:w-11 sm:h-11 bg-primary-50 rounded-xl flex items-center justify-center flex-shrink-0">
                <FolderKanban className="w-5 h-5 sm:w-6 sm:h-6 text-primary-600" />
              </div>
              <div className="min-w-0">
                <h1 className="text-base sm:text-lg md:text-xl font-semibold text-neutral-900 truncate">
                  {project.name}
                </h1>
                {project.description && (
                  <p className="text-xs sm:text-sm text-neutral-600 mt-0.5 sm:mt-1 line-clamp-2">
                    {project.description}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-2 px-2.5 sm:px-3 py-1 sm:py-1.5 bg-amber-50 border border-amber-200 rounded-lg flex-shrink-0 self-start sm:self-auto order-3 sm:order-3">
              <Lock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-600" />
              <span className="text-xs sm:text-sm font-medium text-amber-900">
                閲覧のみ
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-12 py-4 sm:py-6 md:py-8">
        <ProgressBar projectId={project.id} />
        <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />

        <div className="bg-white rounded-xl border border-neutral-200/80 shadow-soft">
          {activeTab === 'overview' && <OverviewTab projectId={project.id} readOnly sharedView />}
          {activeTab === 'tasks' && <TasksTab projectId={project.id} readOnly />}
          {activeTab === 'calendar' && <CalendarTab projectId={project.id} />}
        </div>
      </main>
    </div>
  );
}
