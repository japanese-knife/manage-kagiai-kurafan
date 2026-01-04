import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { Project, TabType } from './types';
import { supabase } from './lib/supabase';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import SharedProjectView from './components/SharedProjectView';
import ShareButton from './components/ShareButton';
import ProgressBar from './components/ProgressBar';
import TabNavigation from './components/TabNavigation';
import OverviewTab from './components/OverviewTab';
import TasksTab from './components/TasksTab';
import CalendarTab from './components/CalendarTab';
import { ArrowLeft, LogOut } from 'lucide-react';
import Footer from './components/Footer';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [shareToken, setShareToken] = useState<string | null>(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('share');
    setShareToken(token);

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      (async () => {
        setUser(session?.user ?? null);
      })();
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSelectProject = (project: Project) => {
    setSelectedProject(project);
    setActiveTab('overview');
  };

  const handleBackToDashboard = () => {
    setSelectedProject(null);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSelectedProject(null);
  };

  const handleProjectUpdate = () => {
    if (selectedProject) {
      supabase
        .from('projects')
        .select('*')
        .eq('id', selectedProject.id)
        .maybeSingle()
        .then(({ data }) => {
          if (data) setSelectedProject(data);
        });
    }
  };

  if (shareToken) {
    return <SharedProjectView shareToken={shareToken} />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-neutral-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  if (!selectedProject) {
    return <Dashboard onSelectProject={handleSelectProject} user={user} onLogout={handleLogout} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <header className="bg-white/80 backdrop-blur-sm border-b border-neutral-200/50">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between w-full sm:relative gap-4 sm:gap-0">
            <div className="flex items-center justify-center order-1 sm:order-2 sm:absolute sm:left-1/2 sm:transform sm:-translate-x-1/2">
              <img
                src="/kaigai-kurafan-logo.png"
                alt="海外クラファン.com"
                className="h-8 sm:h-10 md:h-12 w-auto"
              />
            </div>
            <div className="flex items-center space-x-4 flex-1 order-2 sm:order-1">
              <button
                onClick={handleBackToDashboard}
                className="p-2.5 hover:bg-neutral-100 rounded-xl transition-all"
                title="ダッシュボードに戻る"
              >
                <ArrowLeft className="w-5 h-5 text-neutral-600" />
              </button>
              <div>
                <h1 className="text-xl font-semibold text-neutral-900">
                  {selectedProject.name}
                </h1>
                {selectedProject.description && (
                  <p className="text-sm text-neutral-600 mt-1">
                    {selectedProject.description}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-2 flex-1 justify-end order-3 sm:order-3">
              <ShareButton project={selectedProject} onUpdate={handleProjectUpdate} />
              <button
                onClick={handleLogout}
                className="flex items-center px-4 py-2 text-sm text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-all"
              >
                <LogOut className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">ログアウト</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-8">
        <ProgressBar projectId={selectedProject.id} />
        <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />

        <div className="bg-white rounded-2xl border border-neutral-200/50 mt-6 shadow-xl">
          {activeTab === 'overview' && (
            <OverviewTab projectId={selectedProject.id} />
          )}
          {activeTab === 'tasks' && (
            <TasksTab projectId={selectedProject.id} />
          )}
          {activeTab === 'calendar' && (
            <CalendarTab projectId={selectedProject.id} />
          )}
        </div>
      </main>
    <Footer />
  </div>
);
}

export default App;
