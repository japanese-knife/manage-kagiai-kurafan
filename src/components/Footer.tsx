import { Mail, ExternalLink } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-neutral-200/80 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-12 py-8 sm:py-10 md:py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-12">
          {/* 会社情報 */}
          <div>
            <h3 className="text-sm font-semibold text-neutral-900 mb-4">
              会社情報
            </h3>
            <div className="space-y-2 text-sm text-neutral-600">
              <p className="font-medium text-neutral-800">株式会社RE-IDEA</p>
              <p>〒151-0051</p>
              <p>東京都渋谷区千駄ヶ谷1-30-10-4F</p>
              <a
                href="mailto:info@re-idea.jp"
                className="flex items-center text-primary-600 hover:text-primary-700 transition-colors mt-3"
              >
                <Mail className="w-4 h-4 mr-2" />
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
                  className="text-sm text-neutral-600 hover:text-primary-600 transition-colors inline-flex items-center"
                >
                  コーポレートサイト
                  <ExternalLink className="w-3.5 h-3.5 ml-1.5" />
                </a>
              </li>
              <li>
                <a
                  href="https://kaigai-kurafan.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-neutral-600 hover:text-primary-600 transition-colors inline-flex items-center"
                >
                  海外クラファン.com
                  <ExternalLink className="w-3.5 h-3.5 ml-1.5" />
                </a>
              </li>
              <li>
                <a
                  href="https://kaigai-kurafan.com/privacy-policy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-neutral-600 hover:text-primary-600 transition-colors inline-flex items-center"
                >
                  プライバシーポリシー
                  <ExternalLink className="w-3.5 h-3.5 ml-1.5" />
                </a>
              </li>
            </ul>
          </div>

          {/* ロゴ（オプション） */}
          <div className="md:col-span-2 lg:col-span-1 flex flex-col justify-center items-start lg:items-end">
            <img
              src="/kaigai-kurafan-logo.png"
              alt="海外クラファン.com"
              className="h-10 sm:h-12 w-auto mb-4"
            />
            <p className="text-xs text-neutral-500">
              プロジェクト管理システム
            </p>
          </div>
        </div>

        <div className="mt-8 sm:mt-10 pt-6 sm:pt-8 border-t border-neutral-200">
          <p className="text-xs sm:text-sm text-neutral-500 text-center">
            © {new Date().getFullYear()} 株式会社RE-IDEA. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}