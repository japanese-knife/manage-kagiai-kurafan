import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabase';
import { Project } from '../../types';
import ProjectScheduleView from '../ProjectScheduleView';
import BrandBaseTab from './BrandBaseTab';

interface GanttChartTabProps {
  user: User;
  onSelectProject: (project: Project) => void;
}

export default function GanttChartTab({ user, onSelectProject }: GanttChartTabProps) {
  const [showBrandBase, setShowBrandBase] = useState(false);
  const [selectedCreatorId, setSelectedCreatorId] = useState<string | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error('プロジェクト読み込みエラー:', error);
    }
  };

  const handleOpenCreatorBrands = async (project: Project) => {
    try {
      // プロジェクトからブランドIDを取得
      const { data: brandProjectData } = await supabase
        .from('brand_projects')
        .select('brand_id')
        .eq('project_id', project.id)
        .single();

      if (brandProjectData) {
        // ブランドIDからクリエイターIDを取得
        const { data: creatorBrandData } = await supabase
          .from('creator_brands')
          .select('creator_id')
          .eq('brand_id', brandProjectData.brand_id)
          .single();

        if (creatorBrandData) {
          setSelectedCreatorId(creatorBrandData.creator_id);
          setShowBrandBase(true);
        }
      }
    } catch (error) {
      console.error('クリエイター情報取得エラー:', error);
    }
  };

  if (showBrandBase && selectedCreatorId) {
    return (
      <div>
        <button
          onClick={() => {
            setShowBrandBase(false);
            setSelectedCreatorId(null);
          }}
          className="mb-6 inline-flex items-center px-4 py-2 text-sm font-medium text-neutral-700 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-all"
        >
          ← ガントチャートに戻る
        </button>
        <BrandBaseTab
          projects={projects}
          user={user}
          onSelectProject={onSelectProject}
          onProjectsChange={loadProjects}
          initialView="brands"
          initialSelectedCreatorId={selectedCreatorId}
        />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold text-neutral-900 mb-6">全体ガントチャート</h2>
        <ProjectScheduleView 
          user={user} 
          activeBrandTab="all" 
          viewType="daily" 
          onSelectProject={onSelectProject}
        />
      </div>
      <div>
        <h2 className="text-lg font-semibold text-neutral-900 mb-6">BRAND-BASE 年間スケジュール</h2>
        <ProjectScheduleView 
          user={user} 
          activeBrandTab="BRAND-BASE" 
          viewType="monthly" 
          onSelectProject={onSelectProject}
          onOpenCreatorBrands={handleOpenCreatorBrands}
        />
      </div>
    </div>
  );
}