import { Mail, MapPin, ExternalLink, Building2 } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gradient-to-br from-neutral-50 to-neutral-100/50 border-t border-neutral-200/60 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-12">
        {/* メインコンテンツ */}
        <div className="py-10 sm:py-12 md:py-14">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
            {/* ブランド・ロゴセクション */}
            <div className="lg:col-span-1 flex flex-col items-center lg:items-start">
              <img
                src="/kaigai-kurafan-logo.png"
                alt="海外クラファン.com"
                className="h-11 w-auto mb-6"
              />
              <p className="text-sm text-neutral-600 leading-relaxed text-center lg:text-left max-w-xs">
                海外クラウドファンディングを成功に導く
                <br />
                プロジェクト管理プラットフォーム
              </p>
            </div>

            {/* 会社情報 */}
            <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-8">
              {/* 会社詳細 */}
              <div>
                <h3 className="text-sm font-semibold text-neutral-900 mb-4 flex items-center">
                  <Building2 className="w-4 h-4 mr-2 text-primary-600" />
                  会社情報
                </h3>
                <div className="space-y-3">
                  <p className="text-sm font-medium text-neutral-800">
                    株式会社RE-IDEA
                  </p>
                  <div className="flex items-start text-sm text-neutral-600">
                    <MapPin className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0 text-neutral-400" />
                    <span className="leading-relaxed">
                      〒151-0051<br />
                      東京都渋谷区千駄ヶ谷1-30-10-4F
                    </span>
                  </div>
                  <a 
                    href="mailto:info@re-idea.jp"
                    className="flex items-center text-sm text-neutral-600 hover:text-primary-600 transition-colors group"
                  >
                    <Mail className="w-4 h-4 mr-2 text-neutral-400 group-hover:text-primary-600 transition-colors" />
                    info@re-idea.jp
                  </a>
                </div>
              </div>

              {/* リンク */}
              <div>
                <h3 className="text-sm font-semibold text-neutral-900 mb-4">
                  リンク
                </h3>
                <ul className="space-y-3">
                  <li>
                    <a
                      href="https://re-idea-corp.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-neutral-600 hover:text-primary-600 transition-colors inline-flex items-center group"
                    >
                      <span>コーポレートサイト</span>
                      <ExternalLink className="w-3.5 h-3.5 ml-1.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </a>
                  </li>
                  <li>
                    <a
                      href="https://kaigai-kurafan.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-neutral-600 hover:text-primary-600 transition-colors inline-flex items-center group"
                    >
                      <span>海外クラファン.com</span>
                      <ExternalLink className="w-3.5 h-3.5 ml-1.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </a>
                  </li>
                  <li>
                    <a
                      href="https://kaigai-kurafan.com/privacy-policy"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-neutral-600 hover:text-primary-600 transition-colors inline-flex items-center group"
                    >
                      <span>プライバシーポリシー</span>
                      <ExternalLink className="w-3.5 h-3.5 ml-1.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* 区切り線 */}
        <div className="border-t border-neutral-200/60"></div>

        {/* コピーライト */}
        <div className="py-6 text-center">
          <p className="text-sm text-neutral-600">
            © {currentYear} RE-IDEA Corporation. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}