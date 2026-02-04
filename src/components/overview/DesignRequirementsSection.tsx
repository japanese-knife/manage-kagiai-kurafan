import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { DesignRequirement } from '../../types';
import { Palette, Plus, Edit2, Trash2, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';
import { useAccordionState } from '../../hooks/useAccordionState';

interface DesignRequirementsSectionProps {
  projectId: string;
  readOnly?: boolean;
}

export default function DesignRequirementsSection({ projectId, readOnly = false }: DesignRequirementsSectionProps) {
  const [items, setItems] = useState<DesignRequirement[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', url: '', memo: '' });
  const { isExpanded, toggleExpanded, setExpandedWithSave } = useAccordionState(projectId, 'design_requirements', true);

  useEffect(() => {
    loadItems();
  }, [projectId]);

  const loadItems = async () => {
  const { data } = await supabase
    .from('design_requirements')
    .select('*')
    .eq('project_id', projectId)
    .order('order_index', { ascending: true })
    .order('id', { ascending: true });

  setItems(data || []);
};

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingId) {
        await supabase
          .from('design_requirements')
          .update(formData)
          .eq('id', editingId);
      } else {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  // 最大の order_index を取得
  const { data: maxOrder } = await supabase
    .from('design_requirements')
    .select('order_index')
    .eq('project_id', projectId)
    .order('order_index', { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextOrder = maxOrder ? maxOrder.order_index + 1 : 0;

  await supabase
    .from('design_requirements')
    .insert({
      ...formData,
      project_id: projectId,
      user_id: user.id,
      order_index: nextOrder
    });
}

      setFormData({ name: '', url: '', memo: '' });
      setIsAdding(false);
      setEditingId(null);
      loadItems();
    } catch (error) {
      console.error('デザイン要項保存エラー:', error);
    }
  };

  const handleEdit = (item: DesignRequirement) => {
    setFormData({ name: item.name, url: item.url, memo: item.memo });
    setEditingId(item.id);
    setIsAdding(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('削除してもよろしいですか?')) {
      await supabase.from('design_requirements').delete().eq('id', id);
      loadItems();
    }
  };

  const handleMoveUp = async (item: DesignRequirement, index: number) => {
  if (index === 0) return;

  const prevItem = items[index - 1];
  
  await supabase
    .from('design_requirements')
    .update({ order_index: prevItem.order_index })
    .eq('id', item.id);
    
  await supabase
    .from('design_requirements')
    .update({ order_index: item.order_index })
    .eq('id', prevItem.id);
    
  loadItems();
};

const handleMoveDown = async (item: DesignRequirement, index: number) => {
  if (index === items.length - 1) return;

  const nextItem = items[index + 1];
  
  await supabase
    .from('design_requirements')
    .update({ order_index: nextItem.order_index })
    .eq('id', item.id);
    
  await supabase
    .from('design_requirements')
    .update({ order_index: item.order_index })
    .eq('id', nextItem.id);
    
  loadItems();
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
                    名前 *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="例: デザインガイドライン、カラーパレット"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    URL
                  </label>
                  <input
                    type="url"
                    value={formData.url}
                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Figma、Googleドキュメント..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    メモ
                  </label>
                  <textarea
                    value={formData.memo}
                    onChange={(e) => setFormData({ ...formData, memo: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={2}
                    placeholder="デザインの方向性、注意点など"
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
                      setFormData({ name: '', url: '', memo: '' });
                    }}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                  >
                    キャンセル
                  </button>
                </div>
              </div>
            </form>
          )}

          <div className="space-y-3">
            {items.map((item, index) => (
  <div
    key={item.id}
    className="bg-gray-50 p-4 rounded-lg flex items-start justify-between"
  >
    <div className="flex-1">
      <h3 className="font-semibold text-gray-900 mb-1">{item.name}</h3>
      {item.url && (
          
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-primary-600 hover:underline flex items-center mb-1"
        >
          <ExternalLink className="w-3 h-3 mr-1" />
          リンクを開く
        </a>
      )}
      {item.memo && <p className="text-sm text-gray-600">{item.memo}</p>}
    </div>
    {!readOnly && (
      <div className="flex space-x-2">
        <button
          onClick={() => handleMoveUp(item, index)}
          disabled={index === 0}
          className="p-1 text-gray-500 hover:text-primary-600 disabled:opacity-30 disabled:cursor-not-allowed"
          title="上に移動"
        >
          <ChevronUp className="w-4 h-4" />
        </button>
        <button
          onClick={() => handleMoveDown(item, index)}
          disabled={index === items.length - 1}
          className="p-1 text-gray-500 hover:text-primary-600 disabled:opacity-30 disabled:cursor-not-allowed"
          title="下に移動"
        >
          <ChevronDown className="w-4 h-4" />
        </button>
        <button
          onClick={() => handleEdit(item)}
          className="p-1 text-gray-500 hover:text-primary-600"
        >
          <Edit2 className="w-4 h-4" />
        </button>
        <button
          onClick={() => handleDelete(item.id)}
          className="p-1 text-gray-500 hover:text-red-600"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    )}
  </div>
))}
          </div>
        </>
      )}
    </section>
  );
}