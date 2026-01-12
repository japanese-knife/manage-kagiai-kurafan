import { User } from '@supabase/supabase-js';
import { Project } from '../../types';
import ProjectScheduleView from '../ProjectScheduleView';

interface GanttChartTabProps {
  user: User;
  onSelectProject: (project: Project) => void;
}

export default function GanttChartTab({ user, onSelectProject }: GanttChartTabProps) {
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
        />
      </div>
    </div>
  );
}