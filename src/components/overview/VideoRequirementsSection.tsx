import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { VideoRequirement } from '../../types';
import { Video, Plus, Edit2, Trash2, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';
import { useAccordionState } from '../../hooks/useAccordionState';

interface VideoRequirementsSectionProps {
  projectId: string;
  readOnly?: boolean;
}

export default function VideoRequirementsSection({ projectId, readOnly = false }: VideoRequirementsSectionProps) {
  const [requirements, setRequirements] = useState<VideoRequirement[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    video_type: '',
    duration: '',
    required_cuts: '',
    has_narration: false,
    reference_url: '',
  });
  const { isExpanded, toggleExpanded, setExpandedWithSave } = useAccordionState(projectId, 'video_requirements', true);

  useEffect(() => {
    loadRequirements();
  }, [projectId]);

  const loadRequirements = async () => {
    const { data } = await supabase
      .from('video_requirements')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: true });
      .order('id', { ascending: true });

    setRequirements(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingId) {
        await supabase.from('video_requirements').update(formData).eq('id', editingId);
      } else {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        await supabase
          .from('video_requirements')
          .insert({
            ...formData,
            project_id: projectId,
            user_id: user.id
          });
      }

      setFormData({
        video_type: '',
        duration: '',
        required_cuts: '',
        has_narration: false,
        reference_url: '',
      });
      setIsAdding(false);
      setEditingId(null);
      loadRequirements();
    } catch (error) {
      console.error('Error saving video requirement:', error);
    }
  };

  const handleEdit = (req: VideoRequirement) => {
    setFormData({
      video_type: req.video_type,
      duration: req.duration,
      required_cuts: req.required_cuts,
      has_narration: req.has_narration,
      reference_url: req.reference_url,
    });
    setEditingId(req.id);
    setIsAdding(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('削除してもよろしいですか?')) {
      await supabase.from('video_requirements').delete().eq('id', id);
      loadRequirements();
    }
  };

  return (
    <section>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3">
        <button
          onClick={toggleExpanded}
          className="flex items-center text-lg sm:text-xl font-bold text-gray-900 hover:text-gray-700 transition-colors"
        >
          <Video className="w-5 h-5 sm:w-6 sm:h-6 mr-2 text-primary-600" />
          掲載動画要項
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 sm:w-5 sm:h-5 ml-2 text-gray-500" />
          ) : (
            <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5 ml-2 text-gray-500" />
          )}
        </button>
        {!readOnly && (
          <button
            onClick={() => {
              if (!isExpanded) setExpandedWithSave(true);
              setIsAdding(!isAdding);
            }}
            className="flex items-center justify-center px-3 py-1.5 text-sm btn-gradient-animated text-white rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4 mr-1" />
            追加
          </button>
        )}
      </div>

      {isExpanded && (
        <>
          {isAdding && (
        <form onSubmit={handleSubmit} className="bg-gray-50 p-4 rounded-lg mb-4">
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                動画種類
              </label>
              <input
                type="text"
                value={formData.video_type}
                onChange={(e) => setFormData({ ...formData, video_type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="例: プロモーション動画、使い方動画"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                長さ目安
              </label>
              <input
                type="text"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="例: 1分30秒"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                必須カット
              </label>
              <textarea
                value={formData.required_cuts}
                onChange={(e) =>
                  setFormData({ ...formData, required_cuts: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={3}
                placeholder="必ず含める場面やカット"
              />
            </div>
            <div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.has_narration}
                  onChange={(e) =>
                    setFormData({ ...formData, has_narration: e.target.checked })
                  }
                  className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <span className="text-sm font-medium text-gray-700">
                  ナレーションあり
                </span>
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                参考動画URL
              </label>
              <input
                type="url"
                value={formData.reference_url}
                onChange={(e) =>
                  setFormData({ ...formData, reference_url: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="https://..."
              />
            </div>
            <div className="flex space-x-2">
              <button
                type="submit"
                className="px-4 py-2 btn-gradient-animated text-white rounded-lg"
              >
                {editingId ? '更新' : '追加'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsAdding(false);
                  setEditingId(null);
                  setFormData({
                    video_type: '',
                    duration: '',
                    required_cuts: '',
                    has_narration: false,
                    reference_url: '',
                  });
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                キャンセル
              </button>
            </div>
          </div>
        </form>
          )}

          <div className="space-y-4">
        {requirements.map((req) => (
          <div key={req.id} className="bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-semibold text-gray-900">{req.video_type}</h3>
                {req.duration && (
                  <p className="text-sm text-gray-600">長さ: {req.duration}</p>
                )}
                <p className="text-sm text-gray-600">
                  ナレーション: {req.has_narration ? 'あり' : 'なし'}
                </p>
              </div>
              {!readOnly && (
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEdit(req)}
                    className="p-1 text-gray-500 hover:text-primary-600"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(req.id)}
                    className="p-1 text-gray-500 hover:text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
            {req.required_cuts && (
              <div className="mb-2">
                <h4 className="text-sm font-medium text-gray-700 mb-1">必須カット</h4>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {req.required_cuts}
                </p>
              </div>
            )}
            {req.reference_url && (
              <a
                href={req.reference_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary-600 hover:underline flex items-center"
              >
                <ExternalLink className="w-3 h-3 mr-1" />
                参考動画を見る
              </a>
            )}
          </div>
        ))}
          </div>
        </>
      )}
    </section>
  );
}
