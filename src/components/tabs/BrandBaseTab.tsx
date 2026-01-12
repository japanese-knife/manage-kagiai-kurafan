import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabase';
import { Project, Task, ProjectStatus, BrandType } from '../../types';
import { FolderKanban, Plus, ArrowRight, Calendar, CheckSquare, Trash2, Edit2, Copy } from 'lucide-react';

interface BrandBaseTabProps {
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

interface Brand {
  id: string;
  name: string;
  theme: string;
  features: string;
  created_at: string;
  updated_at: string;
  user_id: string;
}

interface BrandProject {
  id: string;
  brand_id: string;
  project_id: string;
  created_at: string;
}

interface Creator {
  id: string;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
  user_id: string;
}

interface CreatorBrand {
  id: string;
  creator_id: string;
  brand_id: string;
  created_at: string;
}

export default function BrandBaseTab({ 
  projects, 
  user, 
  onSelectProject, 
  onProjectsChange 
}: BrandBaseTabProps) {
  const [view, setView] = useState<'creators' | 'brands' | 'projects'>('creators');
  const [displayMode, setDisplayMode] = useState<'creators' | 'projects'>('creators');
  const [creators, setCreators] = useState<Creator[]>([]);
  const [selectedCreatorId, setSelectedCreatorId] = useState<string | null>(null);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [creatorBrands, setCreatorBrands] = useState<Map<string, string[]>>(new Map());
  const [brandProjects, setBrandProjects] = useState<Map<string, string[]>>(new Map());
  const [showNewCreatorForm, setShowNewCreatorForm] = useState(false);
  const [newCreatorName, setNewCreatorName] = useState('');
  const [newCreatorDescription, setNewCreatorDescription] = useState('');
  const [editingBrandId, setEditingBrandId] = useState<string | null>(null);
const [editBrandName, setEditBrandName] = useState('');
const [editBrandTheme, setEditBrandTheme] = useState('');
const [editBrandFeatures, setEditBrandFeatures] = useState('');
  const [showNewBrandForm, setShowNewBrandForm] = useState(false);
  const [newBrandName, setNewBrandName] = useState('');
  const [newBrandTheme, setNewBrandTheme] = useState('');
  const [newBrandFeatures, setNewBrandFeatures] = useState('');
  const [showProjectLinkModal, setShowProjectLinkModal] = useState(false);
  const [selectedBrandForLink, setSelectedBrandForLink] = useState<string | null>(null);
  const [showNewProjectInModal, setShowNewProjectInModal] = useState(false);
  const [newProjectNameInModal, setNewProjectNameInModal] = useState('');
  const [newProjectDescriptionInModal, setNewProjectDescriptionInModal] = useState('');
  
  const [projectStats, setProjectStats] = useState<Map<string, ProjectStats>>(new Map());
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editProjectName, setEditProjectName] = useState('');
  const [editProjectDescription, setEditProjectDescription] = useState('');
  const [editBrandType, setEditBrandType] = useState<BrandType>('BRAND-BASE');

  useEffect(() => {
    loadProjectStats();
    loadCreators();
    loadBrands();
  }, [projects]);

  const loadCreators = async () => {
  try {
    const { data: creatorsData, error: creatorsError } = await supabase
      .from('creators')
      .select('*')
      // .eq('user_id', user.id) ← この行を削除
      .order('created_at', { ascending: false });

    if (creatorsError) throw creatorsError;

    setCreators(creatorsData || []);
  } catch (error) {
    console.error('クリエイター読み込みエラー:', error);
  }
};

  const loadBrands = async () => {
    try {
      const { data: brandsData, error: brandsError } = await supabase
        .from('brands')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (brandsError) throw brandsError;

      setBrands(brandsData || []);

      // クリエイターとブランドの紐付けを取得
      const { data: creatorBrandData, error: creatorBrandError } = await supabase
        .from('creator_brands')
        .select('*');

      if (creatorBrandError) throw creatorBrandError;

      const creatorBrandMap = new Map<string, string[]>();
      creatorBrandData?.forEach((link: CreatorBrand) => {
        if (!creatorBrandMap.has(link.creator_id)) {
          creatorBrandMap.set(link.creator_id, []);
        }
        creatorBrandMap.get(link.creator_id)?.push(link.brand_id);
      });

      setCreatorBrands(creatorBrandMap);

      // ブランドとプロジェクトの紐付けを取得
      const { data: linkData, error: linkError } = await supabase
        .from('brand_projects')
        .select('*');

      if (linkError) throw linkError;

      const linkMap = new Map<string, string[]>();
      linkData?.forEach((link: BrandProject) => {
        if (!linkMap.has(link.brand_id)) {
          linkMap.set(link.brand_id, []);
        }
        linkMap.get(link.brand_id)?.push(link.project_id);
      });

      setBrandProjects(linkMap);
    } catch (error) {
      console.error('ブランド読み込みエラー:', error);
    }
  };

  const loadProjectStats = async () => {
    const statsMap = new Map<string, ProjectStats>();
    const brandbaseProjects = projects.filter(p => p.brand_type === 'BRAND-BASE');
    
    for (const project of brandbaseProjects) {
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

  const handleCreateCreator = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!newCreatorName.trim()) return;

  try {
    const { data, error } = await supabase
      .from('creators')
      .insert({
        name: newCreatorName,
        description: newCreatorDescription,
        user_id: user.id,
      })
      .select();

    if (error) {
      console.error('Supabase エラー詳細:', error);
      alert(`クリエイターの作成に失敗しました:\n${error.message}\nコード: ${error.code}\n詳細: ${error.details || 'なし'}`);
      throw error;
    }

    console.log('クリエイター作成成功:', data);
    setNewCreatorName('');
    setNewCreatorDescription('');
    setShowNewCreatorForm(false);
    loadCreators();
  } catch (error: any) {
    console.error('クリエイター作成エラー:', error);
  }
};

  const handleDeleteCreator = async (creatorId: string) => {
    if (!confirm('このクリエイターを削除してもよろしいですか？関連するブランドとの紐付けも削除されます。')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('creators')
        .delete()
        .eq('id', creatorId);

      if (error) throw error;

      loadCreators();
    } catch (error) {
      console.error('クリエイター削除エラー:', error);
      alert('クリエイターの削除に失敗しました');
    }
  };

  const handleLinkBrandToCreator = async (creatorId: string, brandId: string) => {
    try {
      const { error } = await supabase
        .from('creator_brands')
        .insert({
          creator_id: creatorId,
          brand_id: brandId,
        });

      if (error) throw error;

      loadBrands();
    } catch (error) {
      console.error('ブランドリンクエラー:', error);
      alert('ブランドの紐付けに失敗しました');
    }
  };

  const handleUnlinkBrandFromCreator = async (creatorId: string, brandId: string) => {
    try {
      const { error } = await supabase
        .from('creator_brands')
        .delete()
        .eq('creator_id', creatorId)
        .eq('brand_id', brandId);

      if (error) throw error;

      loadBrands();
    } catch (error) {
      console.error('ブランドリンク解除エラー:', error);
      alert('ブランドの紐付け解除に失敗しました');
    }
  };

  const handleCreateBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBrandName.trim() || !selectedCreatorId) return;

    try {
      // ブランドを作成
      const { data: newBrand, error: brandError } = await supabase
        .from('brands')
        .insert({
          name: newBrandName,
          theme: newBrandTheme,
          features: newBrandFeatures,
          user_id: user.id,
        })
        .select()
        .single();

      if (brandError) throw brandError;

      // クリエイターとブランドを紐付け
      const { error: linkError } = await supabase
        .from('creator_brands')
        .insert({
          creator_id: selectedCreatorId,
          brand_id: newBrand.id,
        });

      if (linkError) throw linkError;

      setNewBrandName('');
      setNewBrandTheme('');
      setNewBrandFeatures('');
      setShowNewBrandForm(false);
      loadBrands();
      alert('ブランドを作成しました');
    } catch (error) {
      console.error('ブランド作成エラー:', error);
      alert('ブランドの作成に失敗しました');
    }
  };

  const handleUpdateBrand = async (brandId: string) => {
  if (!editBrandName.trim()) {
    alert('商品 / ブランド名を入力してください');
    return;
  }

  try {
    const { error } = await supabase
      .from('brands')
      .update({
        name: editBrandName,
        theme: editBrandTheme,
        features: editBrandFeatures,
        updated_at: new Date().toISOString(),
      })
      .eq('id', brandId);

    if (error) throw error;

    setEditingBrandId(null);
    setEditBrandName('');
    setEditBrandTheme('');
    setEditBrandFeatures('');
    loadBrands();
  } catch (error) {
    console.error('ブランド更新エラー:', error);
    alert('ブランドの更新に失敗しました');
  }
};

  const handleDeleteBrand = async (brandId: string) => {
    if (!confirm('このブランドを削除してもよろしいですか？プロジェクトとの紐付けも削除されます。')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('brands')
        .delete()
        .eq('id', brandId);

      if (error) throw error;

      loadBrands();
    } catch (error) {
      console.error('ブランド削除エラー:', error);
      alert('ブランドの削除に失敗しました');
    }
  };

  const handleLinkProject = async (brandId: string, projectId: string) => {
    try {
      const { error } = await supabase
        .from('brand_projects')
        .insert({
          brand_id: brandId,
          project_id: projectId,
        });

      if (error) throw error;

      loadBrands();
      setShowProjectLinkModal(false);
      setSelectedBrandForLink(null);
    } catch (error) {
      console.error('プロジェクトリンクエラー:', error);
      alert('プロジェクトの紐付けに失敗しました');
    }
  };

  const handleUnlinkProject = async (brandId: string, projectId: string) => {
    try {
      const { error } = await supabase
        .from('brand_projects')
        .delete()
        .eq('brand_id', brandId)
        .eq('project_id', projectId);

      if (error) throw error;

      loadBrands();
    } catch (error) {
      console.error('プロジェクトリンク解除エラー:', error);
      alert('プロジェクトの紐付け解除に失敗しました');
    }
  };

  const handleCreateAndLinkProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectNameInModal.trim() || !selectedBrandForLink) return;

    try {
      const { data: newProject, error: projectError } = await supabase
        .from('projects')
        .insert({
          name: newProjectNameInModal,
          description: newProjectDescriptionInModal,
          status: '進行中',
          brand_type: 'BRAND-BASE',
          user_id: user.id,
        })
        .select()
        .single();

      if (projectError) throw projectError;

      const { error: linkError } = await supabase
        .from('brand_projects')
        .insert({
          brand_id: selectedBrandForLink,
          project_id: newProject.id,
        });

      if (linkError) throw linkError;

      setNewProjectNameInModal('');
      setNewProjectDescriptionInModal('');
      setShowNewProjectInModal(false);
      onProjectsChange();
      loadBrands();
    } catch (error) {
      console.error('プロジェクト作成エラー:', error);
      alert('プロジェクトの作成に失敗しました');
    }
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

    try {
      // プロジェクトを複製
      const { data: newProject, error: projectError } = await supabase
        .from('projects')
        .insert({
          name: `${project.name}のコピー`,
          description: project.description,
          status: project.status,
          brand_type: project.brand_type || 'BRAND-BASE',
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

      // その他のデータを複製
      await duplicateProjectData(project.id, newProject.id, user.id);

      alert('プロジェクトを複製しました');
      onProjectsChange();
    } catch (error) {
      console.error('プロジェクト複製エラー:', error);
      alert('プロジェクトの複製に失敗しました');
    }
  };

  const duplicateProjectData = async (oldProjectId: string, newProjectId: string, userId: string) => {
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
    setEditBrandType(project.brand_type || 'BRAND-BASE');
  };

  const handleCancelEdit = () => {
    setEditingProjectId(null);
    setEditProjectName('');
    setEditProjectDescription('');
    setEditBrandType('BRAND-BASE');
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
      setEditBrandType('BRAND-BASE');
      onProjectsChange();
    } catch (error) {
      console.error('プロジェクト更新エラー:', error);
      alert('プロジェクトの更新に失敗しました');
    }
  };

  const getProjectsByStatus = (status: ProjectStatus): Project[] => {
    return projects.filter((p) => p.status === status && p.brand_type === 'BRAND-BASE');
  };

  const brandbaseProjects = projects.filter(p => p.brand_type === 'BRAND-BASE');

  return (
    <div className="mt-8">
      {/* 戻るボタン（ブランド一覧表示時のみ） */}
      {view === 'brands' && selectedCreatorId && (
        <button
          onClick={() => {
            setView('creators');
            setSelectedCreatorId(null);
          }}
          className="inline-flex items-center px-4 py-2 mb-6 text-sm font-medium text-neutral-700 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-all"
        >
          <ArrowRight className="w-4 h-4 mr-2 rotate-180" />
          クリエイター一覧に戻る
        </button>
      )}

      {/* 表示モード切り替えボタン */}
{view === 'creators' && (
  <div className="flex items-center gap-2 mb-6 border-b border-neutral-200">
    <button
      onClick={() => setDisplayMode('creators')}
      className={`px-6 py-3 text-sm font-medium transition-all relative ${
        displayMode === 'creators'
          ? 'text-primary-600'
          : 'text-neutral-500 hover:text-neutral-700'
      }`}
    >
      クリエイター一覧
      {displayMode === 'creators' && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600" />
      )}
    </button>
    <button
      onClick={() => setDisplayMode('projects')}
      className={`px-6 py-3 text-sm font-medium transition-all relative ${
        displayMode === 'projects'
          ? 'text-primary-600'
          : 'text-neutral-500 hover:text-neutral-700'
      }`}
    >
      プロジェクト一覧
      {displayMode === 'projects' && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600" />
      )}
    </button>
  </div>
)}

{/* クリエイター一覧ビュー */}
{view === 'creators' && displayMode === 'creators' && (
  <>
    <div className="flex items-center justify-between mb-6">
      <h2 className="text-lg font-semibold text-neutral-900">クリエイター一覧</h2>
            <button
              onClick={() => setShowNewCreatorForm(true)}
              className="inline-flex items-center px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              新規クリエイター
            </button>
          </div>

          {showNewCreatorForm && (
            <div className="bg-white rounded-lg border border-neutral-200 p-6 mb-6">
              <h3 className="text-base font-semibold text-neutral-900 mb-4">新規クリエイター作成</h3>
              <form onSubmit={handleCreateCreator} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    クリエイター名 *
                  </label>
                  <input
                    type="text"
                    required
                    value={newCreatorName}
                    onChange={(e) => setNewCreatorName(e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-100 focus:border-primary-500"
                    placeholder="例: 山田太郎"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    説明
                  </label>
                  <textarea
                    value={newCreatorDescription}
                    onChange={(e) => setNewCreatorDescription(e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-100 focus:border-primary-500 resize-none"
                    rows={3}
                    placeholder="クリエイターの説明や特徴"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700"
                  >
                    作成
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowNewCreatorForm(false);
                      setNewCreatorName('');
                      setNewCreatorDescription('');
                    }}
                    className="px-4 py-2 bg-white border border-neutral-300 text-neutral-700 text-sm font-medium rounded-lg hover:bg-neutral-50"
                  >
                    キャンセル
                  </button>
                </div>
              </form>
            </div>
          )}

          {creators.length === 0 ? (
            <div className="text-center py-16 px-4">
              <div className="w-16 h-16 bg-neutral-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <FolderKanban className="w-8 h-8 text-neutral-400" />
              </div>
              <h2 className="text-base font-semibold text-neutral-900 mb-2">
                クリエイターがありません
              </h2>
              <p className="text-sm text-neutral-500 mb-6">
                新しいクリエイターを作成して始めましょう
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
              {creators.map((creator) => {
                const linkedBrandIds = creatorBrands.get(creator.id) || [];
                const linkedBrands = brands.filter(b => linkedBrandIds.includes(b.id));

                return (
                  <div
                    key={creator.id}
                    className="bg-white rounded-2xl border border-neutral-200/50 hover:border-primary-300 hover:shadow-xl transition-all group"
                  >
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-base font-semibold text-neutral-900 mb-2">
                            {creator.name}
                          </h3>
                          {creator.description && (
                            <p className="text-sm text-neutral-600 line-clamp-2 leading-relaxed">
                              {creator.description}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteCreator(creator.id);
                          }}
                          className="p-1.5 text-neutral-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="削除"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="space-y-3 mt-5">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-neutral-600 font-medium">ブランド数</span>
                          <span className="font-semibold text-primary-600">
                            {linkedBrands.length}
                          </span>
                        </div>

                        {linkedBrands.length > 0 && (
                          <div className="pt-3 border-t border-neutral-100">
                            <div className="text-xs text-neutral-500 mb-2">登録ブランド</div>
                            <div className="space-y-1">
                              {linkedBrands.slice(0, 3).map((brand) => (
                                <div key={brand.id} className="text-sm text-neutral-700">
                                  • {brand.name}
                                </div>
                              ))}
                              {linkedBrands.length > 3 && (
                                <div className="text-xs text-neutral-500">
                                  他 {linkedBrands.length - 3} 件
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        <button
                          onClick={() => {
                            setSelectedCreatorId(creator.id);
                            setView('brands');
                          }}
                          className="w-full mt-4 px-4 py-2.5 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors flex items-center justify-center"
                        >
                          ブランドを管理
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ブランド一覧ビュー */}
      {view === 'brands' && selectedCreatorId && (
        <>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-neutral-900">
                {creators.find(c => c.id === selectedCreatorId)?.name} のブランド一覧
              </h2>
              <p className="text-sm text-neutral-500 mt-1">
                ブランドを選択してプロジェクトを管理できます
              </p>
            </div>
            <button
              onClick={() => setShowNewBrandForm(true)}
              className="inline-flex items-center px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              新規ブランド
            </button>
          </div>

          {showNewBrandForm && (
            <div className="bg-white rounded-lg border border-neutral-200 p-6 mb-6">
              <h3 className="text-base font-semibold text-neutral-900 mb-4">新規ブランド作成</h3>
              <form onSubmit={handleCreateBrand} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    商品 / ブランド名 *
                  </label>
                  <input
                    type="text"
                    required
                    value={newBrandName}
                    onChange={(e) => setNewBrandName(e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-100 focus:border-primary-500"
                    placeholder="例: テクノブランドA"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    ブランドテーマ
                  </label>
                  <input
                    type="text"
                    value={newBrandTheme}
                    onChange={(e) => setNewBrandTheme(e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-100 focus:border-primary-500"
                    placeholder="例: 最先端テクノロジー"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    特化した特徴
                  </label>
                  <textarea
                    value={newBrandFeatures}
                    onChange={(e) => setNewBrandFeatures(e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-100 focus:border-primary-500 resize-none"
                    rows={3}
                    placeholder="例: AI技術、IoT製品、スマートデバイス"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700"
                  >
                    作成
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowNewBrandForm(false);
                      setNewBrandName('');
                      setNewBrandTheme('');
                      setNewBrandFeatures('');
                    }}
                    className="px-4 py-2 bg-white border border-neutral-300 text-neutral-700 text-sm font-medium rounded-lg hover:bg-neutral-50"
                  >
                    キャンセル
                  </button>
                </div>
              </form>
            </div>
          )}

          {brands.length === 0 ? (
            <div className="text-center py-16 px-4">
              <div className="w-16 h-16 bg-neutral-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <FolderKanban className="w-8 h-8 text-neutral-400" />
              </div>
              <h2 className="text-base font-semibold text-neutral-900 mb-2">
                ブランドがありません
              </h2>
              <p className="text-sm text-neutral-500 mb-6">
                新しいブランドを作成して始めましょう
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-neutral-50 border-b border-neutral-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-neutral-900 min-w-[200px]">
                        商品 / ブランド名
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-neutral-900 min-w-[250px]">
                        ブランドテーマ
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-neutral-900 min-w-[300px]">
                        特化した特徴
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-neutral-900 min-w-[250px]">
                        プロジェクトリンク
                      </th>
                      <th className="px-6 py-4 text-right text-sm font-semibold text-neutral-900 w-[100px]">
                        操作
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200">
                    {brands
                      .filter(brand => {
                        const linkedBrandIds = creatorBrands.get(selectedCreatorId!) || [];
                        return linkedBrandIds.includes(brand.id);
                      })
                      .map((brand) => {
                      const linkedProjectIds = brandProjects.get(brand.id) || [];
                      const linkedProjects = projects.filter(p => linkedProjectIds.includes(p.id));

                      return (
                        <tr key={brand.id} className="hover:bg-neutral-50">
  <td className="px-6 py-4">
    {editingBrandId === brand.id ? (
      <input
        type="text"
        required
        value={editBrandName}
        onChange={(e) => setEditBrandName(e.target.value)}
        className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-100 focus:border-primary-500 text-sm font-medium"
        placeholder="商品 / ブランド名"
      />
    ) : (
      <div className="text-sm font-medium text-neutral-900">
        {brand.name}
      </div>
    )}
  </td>
  <td className="px-6 py-4">
    {editingBrandId === brand.id ? (
      <input
        type="text"
        value={editBrandTheme}
        onChange={(e) => setEditBrandTheme(e.target.value)}
        className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-100 focus:border-primary-500 text-sm"
      />
    ) : (
      <div className="text-sm text-neutral-600">
        {brand.theme || '-'}
      </div>
    )}
  </td>
                          <td className="px-6 py-4">
                            {editingBrandId === brand.id ? (
                              <textarea
                                value={editBrandFeatures}
                                onChange={(e) => setEditBrandFeatures(e.target.value)}
                                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-100 focus:border-primary-500 resize-none text-sm"
                                rows={2}
                              />
                            ) : (
                              <div className="text-sm text-neutral-600 whitespace-pre-wrap">
                                {brand.features || '-'}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className="space-y-2">
                              {linkedProjects.map((project) => (
                                <div
                                  key={project.id}
                                  className="flex items-center justify-between bg-primary-50 px-3 py-2 rounded-lg group"
                                >
                                  <button
                                    onClick={() => onSelectProject(project)}
                                    className="text-sm text-primary-600 hover:text-primary-700 font-medium flex-1 text-left"
                                  >
                                    {project.name}
                                  </button>
                                  <button
                                    onClick={() => handleUnlinkProject(brand.id, project.id)}
                                    className="ml-2 text-neutral-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                    title="リンク解除"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ))}
                              <button
                                onClick={() => {
                                  setSelectedBrandForLink(brand.id);
                                  setShowProjectLinkModal(true);
                                }}
                                className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                              >
                                <Plus className="w-3.5 h-3.5 mr-1" />
                                プロジェクトを追加
                              </button>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-end gap-2">
                              {editingBrandId === brand.id ? (
                                <>
                                  <button
                                    onClick={() => handleUpdateBrand(brand.id)}
                                    className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                    title="保存"
                                  >
                                    <CheckSquare className="w-4 h-4" />
                                  </button>
                                  <button
  onClick={() => {
    setEditingBrandId(null);
    setEditBrandName('');
    setEditBrandTheme('');
    setEditBrandFeatures('');
  }}
  className="p-1.5 text-neutral-500 hover:bg-neutral-100 rounded-lg transition-colors"
  title="キャンセル"
>
  ×
</button>
                                </>
                              ) : (
                                <>
                                  <button
  onClick={() => {
    setEditingBrandId(brand.id);
    setEditBrandName(brand.name);
    setEditBrandTheme(brand.theme || '');
    setEditBrandFeatures(brand.features || '');
  }}
  className="p-1.5 text-neutral-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
  title="編集"
>
  <Edit2 className="w-4 h-4" />
</button>
                                  <button
                                    onClick={() => handleDeleteBrand(brand.id)}
                                    className="p-1.5 text-neutral-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    title="削除"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* プロジェクトリンクモーダル */}
          {showProjectLinkModal && selectedBrandForLink && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
                <div className="p-6 border-b border-neutral-200">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-neutral-900">プロジェクトを選択または作成</h3>
                    <button
                      onClick={() => setShowNewProjectInModal(!showNewProjectInModal)}
                      className="inline-flex items-center px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      新規作成
                    </button>
                  </div>
                </div>

                <div className="p-6 overflow-y-auto max-h-[60vh]">
                  {showNewProjectInModal && (
                    <div className="bg-neutral-50 rounded-lg p-4 mb-4">
                      <h4 className="text-sm font-semibold text-neutral-900 mb-3">新規プロジェクト作成</h4>
                      <form onSubmit={handleCreateAndLinkProject} className="space-y-3">
                        <div>
                          <label className="block text-xs font-medium text-neutral-700 mb-1.5">
                            事業者名 *
                          </label>
                          <input
                            type="text"
                            required
                            value={newProjectNameInModal}
                            onChange={(e) => setNewProjectNameInModal(e.target.value)}
                            className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-100 focus:border-primary-500 text-sm"
                            placeholder="例: 株式会社RE-IDEA様"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-neutral-700 mb-1.5">
                            商品
                          </label>
                          <textarea
                            value={newProjectDescriptionInModal}
                            onChange={(e) => setNewProjectDescriptionInModal(e.target.value)}
                            className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-100 focus:border-primary-500 resize-none text-sm"
                            rows={2}
                            placeholder="プロジェクトの概要"
                          />
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="submit"
                            className="flex-1 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700"
                          >
                            作成してリンク
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setShowNewProjectInModal(false);
                              setNewProjectNameInModal('');
                              setNewProjectDescriptionInModal('');
                            }}
                            className="flex-1 px-4 py-2 bg-white border border-neutral-300 text-neutral-700 text-sm font-medium rounded-lg hover:bg-neutral-50"
                          >
                            キャンセル
                          </button>
                        </div>
                      </form>
                    </div>
                  )}

                  <div className="space-y-2">
  <h4 className="text-xs font-semibold text-neutral-700 mb-2">既存のプロジェクトから選択</h4>
  {projects
    .filter(p => p.brand_type === 'BRAND-BASE')
    .filter(p => {
      // 選択中のブランドに既にリンクされているプロジェクトを除外
      const linkedIds = brandProjects.get(selectedBrandForLink!) || [];
      if (linkedIds.includes(p.id)) return false;
      
      // 他のどのブランドにもリンクされていないプロジェクトのみ表示
      for (const [brandId, projectIds] of brandProjects.entries()) {
        if (projectIds.includes(p.id)) {
          return false;
        }
      }
      return true;
    })
    .map((project) => (
      <button
        key={project.id}
        onClick={() => handleLinkProject(selectedBrandForLink!, project.id)}
        className="w-full text-left px-4 py-3 border border-neutral-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-all"
      >
        <div className="font-medium text-neutral-900">{project.name}</div>
        {project.description && (
          <div className="text-sm text-neutral-600 mt-1">{project.description}</div>
        )}
      </button>
    ))}
  {projects
    .filter(p => p.brand_type === 'BRAND-BASE')
    .filter(p => {
      const linkedIds = brandProjects.get(selectedBrandForLink!) || [];
      if (linkedIds.includes(p.id)) return false;
      for (const [brandId, projectIds] of brandProjects.entries()) {
        if (projectIds.includes(p.id)) {
          return false;
        }
      }
      return true;
    }).length === 0 && (
    <div className="text-sm text-neutral-500 text-center py-4">
      リンク可能なプロジェクトがありません
    </div>
  )}
</div>
                </div>

                <div className="p-6 border-t border-neutral-200">
                  <button
                    onClick={() => {
                      setShowProjectLinkModal(false);
                      setSelectedBrandForLink(null);
                      setShowNewProjectInModal(false);
                      setNewProjectNameInModal('');
                      setNewProjectDescriptionInModal('');
                    }}
                    className="w-full px-4 py-2 bg-neutral-100 text-neutral-700 font-medium rounded-lg hover:bg-neutral-200"
                  >
                    閉じる
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* 旧クリエイター/品目一覧ビュー（プロジェクト一覧） - 削除または非表示 */}
    </div>
  );
}