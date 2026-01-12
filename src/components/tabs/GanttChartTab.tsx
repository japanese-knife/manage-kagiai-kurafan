import { User } from '@supabase/supabase-js';
import ProjectScheduleView from '../ProjectScheduleView';

interface GanttChartTabProps {
  user: User;
}

export default function GanttChartTab({ user }: GanttChartTabProps) {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold text-neutral-900 mb-6">全体ガントチャート</h2>
        <ProjectScheduleView user={user} activeBrandTab="all" viewType="daily" />
      </div>
      <div>
        <h2 className="text-lg font-semibold text-neutral-900 mb-6">BRAND-BASE 年間スケジュール</h2>
        <ProjectScheduleView user={user} activeBrandTab="BRAND-BASE" viewType="monthly" />
      </div>
    </div>
  );
}