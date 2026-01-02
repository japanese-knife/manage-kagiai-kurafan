import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { DesignRequirement } from '../../types';
import { Palette, Plus, Edit2, ChevronDown, ChevronUp } from 'lucide-react';
import { useAccordionState } from '../../hooks/useAccordionState';

interface DesignRequirementsSectionProps {
  projectId: string;
  readOnly?: boolean;
}

export default function DesignRequirementsSection({ projectId, readOnly = false }: DesignRequirementsSectionProps) {
  const [requirement, setRequirement] = useState<DesignRequirement | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    design_tone: '',
    colors: '',
    fonts: '',
    ng_items: '',
    reference_urls: '',
  });
  const { isExpanded, toggleExpanded, setExpandedWithSave } = useAccordionState(projectId, 'design_requirements', true);

  useEffect(() => {
    loadRequirement();
  }, [projectId]);

  const loadRequirement = async () => {
    const { data } = await supabase
      .from('design_requirements')
      .select('*')
      .eq('project_id', projectId)
      .maybeSingle();

    if (data) {
      setRequirement(data);
      setFormData({
        design_tone: data.design_tone,
        colors: data.colors,
        fonts: data.fonts,
        ng_items: data.ng_items,
        reference_urls: data.reference_urls,
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (requirement) {
        await supabase
          .from('design_requirements')
          .update({ ...formData, updated_at: new Date().toISOString() })
          .eq('id', requirement.id);
      } else {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        await supabase
          .from('design_requirements')
          .insert({
            ...formData,
            project_id: projectId,
            user_id: user.id
          });
      }

      setIsEditing(false);
      loadRequirement();
    } catch (error) {
      console.error('Error saving design requirement:', error);
    }
  };

  const startEditing = () => {
    if (!isExpanded) setExpandedWithSave(true);
    if (requirement) {
      setFormData({
        design_tone: requirement.design_tone,
        colors: requirement.colors,
        fonts: requirement.fonts,
        ng_items: requirement.ng_items,
        reference_urls: requirement.reference_urls,
      });
    }
    setIsEditing(true);
  };

  return (
    <section className="border-b border-gray-200 pb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3">
        <button
          onClick={toggleExpanded}
          className="flex items-center text-lg sm:text-xl font-bold text-gray-900 hover:text-gray-700 transition-colors"
        >
          <Palette className="w-5 h-5 sm:w-6 sm:h-6 mr-2 text-primary-600" />
          ページデザイン要項
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 sm:w-5 sm:h-5 ml-2 text-gray-500" />
          ) : (
            <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5 ml-2 text-gray-500" />
          )}
        </button>
        {!readOnly && (
          <button
            onClick={startEditing}
            className="flex items-center justify-center px-3 py-1.5 text-sm btn-gradient-animated text-white rounded-lg transition-colors"
          >
            {requirement ? (
              <>
                <Edit2 className="w-4 h-4 mr-1" />
                編集
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-1" />
                追加
              </>
            )}
          </button>
        )}
      </div>

      {isExpanded && (
        <>
          {isEditing ? (
        <form onSubmit={handleSubmit} className="bg-gray-50 p-4 rounded-lg">
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                デザイントーン
              </label>
              <input
                type="text"
                value={formData.design_tone}
                onChange={(e) => setFormData({ ...formData, design_tone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="例: モダン、シンプル、ナチュラル"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                使用カラー
              </label>
              <input
                type="text"
                value={formData.colors}
                onChange={(e) => setFormData({ ...formData, colors: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="例: #3B82F6, #10B981"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                フォント
              </label>
              <input
                type="text"
                value={formData.fonts}
                onChange={(e) => setFormData({ ...formData, fonts: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="例: Noto Sans JP, Roboto"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                NG事項
              </label>
              <textarea
                value={formData.ng_items}
                onChange={(e) => setFormData({ ...formData, ng_items: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={3}
                placeholder="避けるべきデザイン要素"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                参考URL
              </label>
              <textarea
                value={formData.reference_urls}
                onChange={(e) =>
                  setFormData({ ...formData, reference_urls: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={3}
                placeholder="参考にしたいサイトのURL（1行に1つ）"
              />
            </div>
            <div className="flex space-x-2">
              <button
                type="submit"
                className="px-4 py-2 btn-gradient-animated text-white rounded-lg"
              >
                保存
              </button>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                キャンセル
              </button>
            </div>
          </div>
        </form>
          ) : requirement ? (
        <div className="bg-gray-50 p-4 rounded-lg space-y-3">
          {requirement.design_tone && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-1">デザイントーン</h4>
              <p className="text-sm text-gray-900">{requirement.design_tone}</p>
            </div>
          )}
          {requirement.colors && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-1">使用カラー</h4>
              <p className="text-sm text-gray-900">{requirement.colors}</p>
            </div>
          )}
          {requirement.fonts && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-1">フォント</h4>
              <p className="text-sm text-gray-900">{requirement.fonts}</p>
            </div>
          )}
          {requirement.ng_items && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-1">NG事項</h4>
              <p className="text-sm text-gray-900 whitespace-pre-wrap">
                {requirement.ng_items}
              </p>
            </div>
          )}
          {requirement.reference_urls && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-1">参考URL</h4>
              <div className="text-sm text-gray-900 space-y-1">
                {requirement.reference_urls.split('\n').map((url, index) => (
                  <div key={index}>
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-600 hover:underline"
                    >
                      {url}
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              デザイン要項が設定されていません
            </div>
          )}
        </>
      )}
    </section>
  );
}
