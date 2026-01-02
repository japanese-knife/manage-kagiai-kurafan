import { useState } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '../lib/supabase';
import { Project } from '../types';
import { Share2, Copy, Check, X } from 'lucide-react';

interface ShareButtonProps {
  project: Project;
  onUpdate: () => void;
}

export default function ShareButton({ project, onUpdate }: ShareButtonProps) {
  const [showModal, setShowModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  const shareUrl = project.is_shared && project.share_token
    ? `${window.location.origin}?share=${project.share_token}`
    : '';

  const handleEnableSharing = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('projects')
        .update({
          is_shared: true,
          shared_at: new Date().toISOString(),
        })
        .eq('id', project.id);

      if (error) throw error;
      onUpdate();
    } catch (error) {
      console.error('共有リンク生成エラー:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDisableSharing = async () => {
    if (!confirm('共有リンクを無効にしますか？')) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('projects')
        .update({
          is_shared: false,
          shared_at: null,
        })
        .eq('id', project.id);

      if (error) throw error;
      onUpdate();
      setShowModal(false);
    } catch (error) {
      console.error('共有リンク無効化エラー:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('コピーエラー:', error);
    }
  };

  const modalContent = showModal ? (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={() => setShowModal(false)}
    >
      <div
        className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[80vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-xl font-bold text-gray-900">
            プロジェクトを共有
          </h3>
          <button
            onClick={() => setShowModal(false)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(80vh-100px)]">
          {!project.is_shared ? (
            <div className="space-y-4">
              <p className="text-sm text-gray-600 leading-relaxed">
                共有リンクを生成すると、リンクを知っている人は誰でもこのプロジェクトを閲覧できるようになります。
              </p>
              <button
                onClick={handleEnableSharing}
                disabled={loading}
                className="w-full px-4 py-2.5 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? '生成中...' : '共有リンクを生成'}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  共有リンク
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    readOnly
                    value={shareUrl}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm"
                  />
                  <button
                    onClick={handleCopyLink}
                    className="p-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                    title="コピー"
                  >
                    {copied ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {copied && (
                  <p className="text-xs text-green-600 mt-2">
                    クリップボードにコピーしました
                  </p>
                )}
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-xs text-amber-800">
                  このリンクを知っている人は誰でもプロジェクトを閲覧できます。編集はできません。
                </p>
              </div>

              <button
                onClick={handleDisableSharing}
                disabled={loading}
                className="w-full px-4 py-2.5 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? '無効化中...' : '共有リンクを無効にする'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  ) : null;

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="flex items-center px-4 py-2 text-sm text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-all"
      >
        <Share2 className="w-4 h-4 mr-2" />
        共有
      </button>

      {modalContent && createPortal(modalContent, document.body)}
    </>
  );
}