import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { ImageAsset } from '../../types';
import { Image, Plus, Edit2, Trash2, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';
import { useAccordionState } from '../../hooks/useAccordionState';

interface ImageAssetsSectionProps {
  projectId: string;
  readOnly?: boolean;
}

export default function ImageAssetsSection({ projectId, readOnly = false }: ImageAssetsSectionProps) {
  const [assets, setAssets] = useState<ImageAsset[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    purpose: '',
    url: '',
    status: '準備中',
  });
  const { isExpanded, toggleExpanded, setExpandedWithSave } = useAccordionState(projectId, 'image_assets', true);

  useEffect(() => {
    loadAssets();
  }, [projectId]);

  const loadAssets = async () => {
  const { data } = await supabase
    .from('image_assets')
    .select('*')
    .eq('project_id', projectId)
    .order('order_index', { ascending: true })
    .order('id', { ascending: true });
  setAssets(data || []);
};

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  try {
    if (editingId) {
      await supabase.from('image_assets').update(formData).eq('id', editingId);
    } else {
  const { data: { user } } = await supabase.auth.getUser();
  const userId = user?.id || null;

  // 最大の order_index を取得
  const { data: maxOrder } = await supabase
    .from('image_assets')
    .select('order_index')
    .eq('project_id', projectId)
    .order('order_index', { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextOrder = maxOrder ? maxOrder.order_index + 1 : 0;

  await supabase.from('image_assets').insert({
    ...formData,
    project_id: projectId,
    user_id: userId,
    order_index: nextOrder
  });
}
    setFormData({ name: '', purpose: '', url: '', status: '準備中' });
    setIsAdding(false);
    setEditingId(null);
    loadAssets();
  } catch (error) {
    console.error('Error saving image asset:', error);
    alert('保存に失敗しました。もう一度お試しください。');
  }
};

  const handleEdit = (asset: ImageAsset) => {
    setFormData({
      name: asset.name,
      purpose: asset.purpose,
      url: asset.url,
      status: asset.status,
    });
    setEditingId(asset.id);
    setIsAdding(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('削除してもよろしいですか?')) {
      await supabase.from('image_assets').delete().eq('id', id);
      loadAssets();
    }
  };

  const handleMoveUp = async (asset: ImageAsset, index: number) => {
  if (index === 0) return;

  const prevAsset = assets[index - 1];
  
  await supabase
    .from('image_assets')
    .update({ order_index: prevAsset.order_index })
    .eq('id', asset.id);
    
  await supabase
    .from('image_assets')
    .update({ order_index: asset.order_index })
    .eq('id', prevAsset.id);
    
  loadAssets();
};

const handleMoveDown = async (asset: ImageAsset, index: number) => {
  if (index === assets.length - 1) return;

  const nextAsset = assets[index + 1];
  
  await supabase
    .from('image_assets')
    .update({ order_index: nextAsset.order_index })
    .eq('id', asset.id);
    
  await supabase
    .from('image_assets')
    .update({ order_index: asset.order_index })
    .eq('id', nextAsset.id);
    
  loadAssets();
};

  return (
    <section className="border-b border-gray-200 pb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3">
        <button
          onClick={toggleExpanded}
          className="flex items-center text-lg sm:text-xl font-bold text-gray-900 hover:text-gray-700 transition-colors"
        >
          <Image className="w-5 h-5 sm:w-6 sm:h-6 mr-2 text-primary-600" />
          掲載画像・動画素材
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
                素材名 *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="例: メインビジュアル"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                用途
              </label>
              <input
                type="text"
                value={formData.purpose}
                onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="例: ヘッダー画像"
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
                placeholder="Google ドライブ, ギガファイル便..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ステータス
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="準備中">準備中</option>
                <option value="確認中">確認中</option>
                <option value="完了">完了</option>
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
                  setFormData({ name: '', purpose: '', url: '', status: '準備中' });
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                キャンセル
              </button>
            </div>
          </div>
        </form>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {assets.map((asset, index) => (
  <div key={asset.id} className="bg-gray-50 p-4 rounded-lg">
    <div className="flex justify-between items-start mb-2">
      <h3 className="font-semibold text-gray-900">{asset.name}</h3>
      <span
        className={`px-2 py-1 text-xs font-medium rounded ${
          asset.status === '完了'
            ? 'bg-green-100 text-green-700'
            : asset.status === '確認中'
            ? 'bg-primary-100 text-primary-700'
            : 'bg-gray-100 text-gray-700'
        }`}
      >
        {asset.status}
      </span>
    </div>
    {asset.purpose && (
      <p className="text-sm text-gray-600 mb-2">{asset.purpose}</p>
    )}
    {asset.url && (
      <a
        href={asset.url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm text-primary-600 hover:underline flex items-center mb-2"
      >
        <ExternalLink className="w-3 h-3 mr-1" />
        画像を表示
      </a>
    )}
    <div className="flex space-x-2 mt-2">
      <button
        onClick={() => handleMoveUp(asset, index)}
        disabled={index === 0}
        className="p-1 text-gray-500 hover:text-primary-600 disabled:opacity-30 disabled:cursor-not-allowed"
        title="上に移動"
      >
        <ChevronUp className="w-4 h-4" />
      </button>
      <button
        onClick={() => handleMoveDown(asset, index)}
        disabled={index === assets.length - 1}
        className="p-1 text-gray-500 hover:text-primary-600 disabled:opacity-30 disabled:cursor-not-allowed"
        title="下に移動"
      >
        <ChevronDown className="w-4 h-4" />
      </button>
      <button
        onClick={() => handleEdit(asset)}
        className="p-1 text-gray-500 hover:text-primary-600"
      >
        <Edit2 className="w-4 h-4" />
      </button>
      <button
        onClick={() => handleDelete(asset.id)}
        className="p-1 text-gray-500 hover:text-red-600"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  </div>
))}
          </div>
        ))}
          </div>
        </>
      )}
    </section>
  );
}
