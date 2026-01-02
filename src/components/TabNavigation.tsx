import { TabType } from '../types';
import { LayoutDashboard, CheckSquare, Calendar } from 'lucide-react';

interface TabNavigationProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export default function TabNavigation({ activeTab, onTabChange }: TabNavigationProps) {
  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: '概要', icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'tasks', label: 'タスク一覧', icon: <CheckSquare className="w-5 h-5" /> },
    { id: 'calendar', label: 'カレンダー', icon: <Calendar className="w-5 h-5" /> },
  ];

  return (
    <div className="border-b border-neutral-200/80">
      <nav className="flex space-x-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`
              flex items-center space-x-2.5 px-6 py-4 font-medium text-sm border-b-2 transition-all
              ${
                activeTab === tab.id
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-neutral-600 hover:text-neutral-900 hover:border-neutral-300 hover:bg-neutral-50/50'
              }
            `}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
