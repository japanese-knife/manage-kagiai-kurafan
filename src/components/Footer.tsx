import { Mail, Heart, Shield, Zap, Users, Award } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-neutral-200/50 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-12">
        {/* 主要コンテンツエリア */}
        <div className="py-8 sm:py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
            {/* ブランドセクション */}
            <div className="lg:col-span-2">
              <img
                src="/kaigai-kurafan-logo.png"
                alt="海外クラファン.com"
                className="h-10 w-auto mb-4"
              />
              <p className="text-sm text-neutral-600 leading-relaxed mb-6 max-w-md">
                海外クラウドファンディングを成功に導くプロジェクト管理ツール。
                チームの生産性を最大化し、あなたのビジョンを実現します。
              </p>
              
              {/* 信頼性インジケーター */}
              <div className="grid grid-cols-3 gap-4 max-w-md">
                <div className="flex flex-col items-center p-3 bg-primary-50/50 rounded-lg">
                  <Shield className="w-5 h-5 text-primary-600 mb-1" />
                  <span className="text-xs font-medium text-neutral-700">安全性</span>
                </div>
                <div className="flex flex-col items-center p-3 bg-primary-50/50 rounded-lg">
                  <Zap className="w-5 h-5 text-primary-600 mb-1" />
                  <span className="text-xs font-medium text-neutral-700">高速</span>
                </div>
                <div className="flex flex-col items-center p-3 bg-primary-50/50 rounded-lg">
                  <Users className="w-5 h-5 text-primary-600 mb-1" />
                  <span className="text-xs font-medium text-neutral-700">協調作業</span>
                </div>
              </div>
            </div>

            {/* プロダクトリンク */}
            <div>
              <h3 className="text-sm font-semibold text-neutral-900 mb-4">プロダクト</h3>
              <ul className="space-y-3">
                <li>
                  <a href="/features" className="text-sm text-neutral-600 hover:text-primary-600 transition-colors">
                    機能一覧
                  </a>
                </li>
                <li>
                  <a href="/pricing" className="text-sm text-neutral-600 hover:text-primary-600 transition-colors">
                    料金プラン
                  </a>
                </li>
                <li>
                  <a href="/updates" className="text-sm text-neutral-600 hover:text-primary-600 transition-colors">
                    最新情報
                  </a>
                </li>
                <li>
                  <a href="/roadmap" className="text-sm text-neutral-600 hover:text-primary-600 transition-colors">
                    ロードマップ
                  </a>
                </li>
              </ul>
            </div>

            {/* サポートリンク */}
            <div>
              <h3 className="text-sm font-semibold text-neutral-900 mb-4">サポート</h3>
              <ul className="space-y-3">
                <li>
                  <a href="/help" className="text-sm text-neutral-600 hover:text-primary-600 transition-colors">
                    ヘルプセンター
                  </a>
                </li>
                <li>
                  <a href="/guide" className="text-sm text-neutral-600 hover:text-primary-600 transition-colors">
                    使い方ガイド
                  </a>
                </li>
                <li>
                  <a href="/faq" className="text-sm text-neutral-600 hover:text-primary-600 transition-colors">
                    よくある質問
                  </a>
                </li>
                <li>
                  <a 
                    href="mailto:support@kaigai-kurafan.com" 
                    className="text-sm text-neutral-600 hover:text-primary-600 transition-colors inline-flex items-center"
                  >
                    <Mail className="w-3.5 h-3.5 mr-1.5" />
                    お問い合わせ
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* 区切り線 */}
        <div className="border-t border-neutral-200/50"></div>

        {/* フッター下部 */}
        <div className="py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            {/* コピーライト */}
            <div className="flex flex-col md:flex-row items-center gap-3 md:gap-4">
              <p className="text-sm text-neutral-600">
                © {currentYear} 海外クラファン.com
              </p>
              <div className="hidden md:block w-1 h-1 bg-neutral-300 rounded-full"></div>
              <div className="flex items-center text-sm text-neutral-600">
                <span>Made with</span>
                <Heart className="w-4 h-4 mx-1.5 text-red-500 fill-red-500" />
                <span>in Tokyo</span>
              </div>
            </div>

            {/* 法的リンク */}
            <div className="flex items-center gap-6">
              <a
                href="/terms"
                className="text-sm text-neutral-600 hover:text-primary-600 transition-colors"
              >
                利用規約
              </a>
              <a
                href="/privacy"
                className="text-sm text-neutral-600 hover:text-primary-600 transition-colors"
              >
                プライバシーポリシー
              </a>
              <a
                href="/security"
                className="text-sm text-neutral-600 hover:text-primary-600 transition-colors inline-flex items-center"
              >
                <Shield className="w-3.5 h-3.5 mr-1" />
                セキュリティ
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}