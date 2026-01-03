import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Document } from '../../types';
import { FileText, Plus, Edit2, Trash2, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';
import { useAccordionState } from '../../hooks/useAccordionState';

interface DocumentsSectionProps {
  projectId: string;
  readOnly?: boolean;
}

export default function DocumentsSection({ projectId, readOnly = false }: DocumentsSectionProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', url: '', memo: '' });
  const { isExpanded, toggleExpanded, setExpandedWithSave } = useAccordionState(projectId, 'documents', true);

  useEffect(() => {
    loadDocuments();
  }, [projectId]);

  const loadDocuments = async () => {
    const { data } = await supabase
      .from('documents')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    setDocuments(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingId) {
        await supabase.from('documents').update(formData).eq('id', editingId);
      } else {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        await supabase.from('documents').insert({
          ...formData,
          project_id: projectId,
          user_id: user.id
        });
      }

      setFormData({ name: '', url: '', memo: '' });
      setIsAdding(false);
      setEditingId(null);
      loadDocuments();
    } catch (error) {
      console.error('Error saving document:', error);
    }
  };

  const handleEdit = (doc: Document) => {
    setFormData({ name: doc.name, url: doc.url, memo: doc.memo });
    setEditingId(doc.id);
    setIsAdding(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('削除してもよろしいですか?')) {
      await supabase.from('documents').delete().eq('id', id);
      loadDocuments();
    }
  };

  return (
    <section className="border-b border-gray-200 pb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3">
        <button
          onClick={toggleExpanded}
          className="flex items-center text-lg sm:text-xl font-bold text-gray-900 hover:text-gray-700 transition-colors"
        >
          <FileText className="w-5 h-5 sm:w-6 sm:h-6 mr-2 text-primary-600" />
          資料一覧
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
                資料名 *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="例: プロジェクト企画書"
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
                placeholder="https..."
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
                placeholder="備考や補足情報"
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
        {documents.map((doc) => (
          <div
            key={doc.id}
            className="bg-gray-50 p-4 rounded-lg flex items-start justify-between"
          >
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-1">{doc.name}</h3>
              {doc.url && (
                <a
                  href={doc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary-600 hover:underline flex items-center mb-1"
                >
                  <ExternalLink className="w-3 h-3 mr-1" />
                  リンクを開く
                </a>
              )}
              {doc.memo && <p className="text-sm text-gray-600">{doc.memo}</p>}
            </div>
            {!readOnly && (
              <div className="flex space-x-2">
                <button
                  onClick={() => handleEdit(doc)}
                  className="p-1 text-gray-500 hover:text-primary-600"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(doc.id)}
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
