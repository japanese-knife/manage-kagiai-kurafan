export default function Footer() {
  return (
    <footer className="bg-white border-t border-neutral-200/50 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-12 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* ロゴとキャッチコピー */}
          <div className="space-y-4">
            <img
              src="/kaigai-kurafan-logo.png"
              alt="海外クラファン.com"
              className="h-8 w-auto"
            />
            <p className="text-sm text-neutral-600 leading-relaxed">
              プロジェクトとタスクを<br />
              シンプルに管理
            </p>
          </div>

          {/* リンク */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-neutral-900">サービス</h3>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-sm text-neutral-600 hover:text-primary-600 transition-colors">
                  プロジェクト管理
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-neutral-600 hover:text-primary-600 transition-colors">
                  タスク管理
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-neutral-600 hover:text-primary-600 transition-colors">
                  チーム共有
                </a>
              </li>
            </ul>
          </div>

          {/* サポート */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-neutral-900">サポート</h3>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-sm text-neutral-600 hover:text-primary-600 transition-colors">
                  ヘルプセンター
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-neutral-600 hover:text-primary-600 transition-colors">
                  お問い合わせ
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-neutral-600 hover:text-primary-600 transition-colors">
                  利用規約
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* コピーライト */}
        <div className="pt-6 border-t border-neutral-200/50">
          <p className="text-xs text-neutral-500 text-center">
            © 2025 海外クラファン.com All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}