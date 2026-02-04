import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Return } from '../../types';
import { Gift, Plus, Edit2, Trash2, ChevronDown, ChevronUp, Copy } from 'lucide-react';
import { useAccordionState } from '../../hooks/useAccordionState';

interface ReturnsSectionProps {
  projectId: string;
  readOnly?: boolean;
}

export default function ReturnsSection({ projectId, readOnly = false }: ReturnsSectionProps) {
  const [returns, setReturns] = useState<Return[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    price_range: '',
    description: '',
    status: '案' as '案' | '確定',
  });
  const { isExpanded, toggleExpanded, setExpandedWithSave } = useAccordionState(projectId, 'returns', true);

  useEffect(() => {
    loadReturns();
  }, [projectId]);

  const loadReturns = async () => {
  const { data } = await supabase
    .from('returns')
    .select('*')
    .eq('project_id', projectId)
    .order('order_index', { ascending: true })
    .order('id', { ascending: true });

  setReturns(data || []);
};

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingId) {
        await supabase.from('returns').update(formData).eq('id', editingId);
      } else {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  // 最大の order_index を取得
  const { data: maxOrder } = await supabase
    .from('returns')
    .select('order_index')
    .eq('project_id', projectId)
    .order('order_index', { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextOrder = maxOrder ? maxOrder.order_index + 1 : 0;

  await supabase.from('returns').insert({
    ...formData,
    project_id: projectId,
    user_id: user.id,
    order_index: nextOrder
  });
}

      setFormData({ name: '', price_range: '', description: '', status: '案' });
      setIsAdding(false);
      setEditingId(null);
      loadReturns();
    } catch (error) {
      console.error('Error saving return:', error);
    }
  };

  const handleEdit = (returnItem: Return) => {
    setFormData({
      name: returnItem.name,
      price_range: returnItem.price_range,
      description: returnItem.description,
      status: returnItem.status,
    });
    setEditingId(returnItem.id);
    setIsAdding(true);
  };

  const handleDuplicate = async (returnItem: Return) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // 最大の order_index を取得
    const { data: maxOrder } = await supabase
      .from('returns')
      .select('order_index')
      .eq('project_id', projectId)
      .order('order_index', { ascending: false })
      .limit(1)
      .maybeSingle();

    const nextOrder = maxOrder ? maxOrder.order_index + 1 : 0;

    await supabase.from('returns').insert({
      name: `${returnItem.name} (コピー)`,
      price_range: returnItem.price_range,
      description: returnItem.description,
      status: returnItem.status,
      project_id: projectId,
      user_id: user.id,
      order_index: nextOrder
    });

    loadReturns();
  } catch (error) {
    console.error('Error duplicating return:', error);
  }
};

  const handleDelete = async (id: string) => {
    if (confirm('削除してもよろしいですか?')) {
      await supabase.from('returns').delete().eq('id', id);
      loadReturns();
    }
  };

  const handleMoveUp = async (returnItem: Return, index: number) => {
  if (index === 0) return;

  const prevReturn = returns[index - 1];
  
  await supabase
    .from('returns')
    .update({ order_index: prevReturn.order_index })
    .eq('id', returnItem.id);
    
  await supabase
    .from('returns')
    .update({ order_index: returnItem.order_index })
    .eq('id', prevReturn.id);
    
  loadReturns();
};

const handleMoveDown = async (returnItem: Return, index: number) => {
  if (index === returns.length - 1) return;

  const nextReturn = returns[index + 1];
  
  await supabase
    .from('returns')
    .update({ order_index: nextReturn.order_index })
    .eq('id', returnItem.id);
    
  await supabase
    .from('returns')
    .update({ order_index: returnItem.order_index })
    .eq('id', nextReturn.id);
    
  loadReturns();
};

  return (
    <section className="border-b border-gray-200 pb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3">
        <button
          onClick={toggleExpanded}
          className="flex items-center text-lg sm:text-xl font-bold text-gray-900 hover:text-gray-700 transition-colors"
        >
          <Gift className="w-5 h-5 sm:w-6 sm:h-6 mr-2 text-primary-600" />
          リターン内容
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
                リターン名 *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="例: 早期応援コース"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                価格帯
              </label>
              <input
                type="text"
                value={formData.price_range}
                onChange={(e) => setFormData({ ...formData, price_range: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="例: ¥3,000 - ¥5,000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                内容概要
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={3}
                placeholder="リターンの詳細説明"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ステータス
              </label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value as '案' | '確定' })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="案">案</option>
                <option value="確定">確定</option>
              </select>
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
                  setFormData({ name: '', price_range: '', description: '', status: '案' });
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
        {returns.map((returnItem) => (
          <div key={returnItem.id} className="bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="font-semibold text-gray-900">{returnItem.name}</h3>
                {returnItem.price_range && (
                  <p className="text-sm text-gray-600">{returnItem.price_range}</p>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <span
                  className={`px-2 py-1 text-xs font-medium rounded ${
                    returnItem.status === '確定'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-yellow-100 text-yellow-700'
                  }`}
                >
                  {returnItem.status}
                </span>
                {!readOnly && (
                  <>
                    <button
                      onClick={() => handleDuplicate(returnItem)}
                      className="p-1 text-gray-500 hover:text-blue-600"
                      title="複製"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleEdit(returnItem)}
                      className="p-1 text-gray-500 hover:text-primary-600"
                      title="編集"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(returnItem.id)}
                      className="p-1 text-gray-500 hover:text-red-600"
                      title="削除"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            </div>
            {returnItem.description && (
              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                {returnItem.description}
              </p>
            )}
          </div>
        ))}
          </div>
        </>
      )}
    </section>
  );
}