import { Mail, ExternalLink } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-neutral-200/50 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-12 py-8 sm:py-10 md:py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-10 mb-8">
          {/* 会社情報 */}
          <div>
            <h3 className="text-sm font-semibold text-neutral-900 mb-4">
              会社情報
            </h3>
            <div className="space-y-2 text-sm text-neutral-600">
              <p className="font-medium text-neutral-800">株式会社RE-IDEA</p>
              <p className="leading-relaxed">
                〒151-0051<br />
                東京都渋谷区千駄ヶ谷1-30-10-4F
              </p>
              <a
                href="mailto:info@re-idea.jp"
                className="inline-flex items-center text-primary-600 hover:text-primary-700 transition-colors"
              >
                <Mail className="w-4 h-4 mr-1.5" />
                info@re-idea.jp
              </a>
            </div>
          </div>

          {/* リンク */}
          <div>
            <h3 className="text-sm font-semibold text-neutral-900 mb-4">
              リンク
            </h3>
            <div className="space-y-2.5">
              <a
                href="https://re-idea-corp.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center text-sm text-neutral-600 hover:text-primary-600 transition-colors group"
              >
                <span>コーポレートサイト</span>
                <ExternalLink className="w-3.5 h-3.5 ml-1.5 opacity-0 group-hover:opacity-100 transition-opacity" />
              </a>
              <a
                href="https://kaigai-kurafan.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center text-sm text-neutral-600 hover:text-primary-600 transition-colors group"
              >
                <span>海外クラファン.com</span>
                <ExternalLink className="w-3.5 h-3.5 ml-1.5 opacity-0 group-hover:opacity-100 transition-opacity" />
              </a>
            </div>
          </div>

          {/* 法的情報 */}
          <div>
            <h3 className="text-sm font-semibold text-neutral-900 mb-4">
              法的情報
            </h3>
            <div className="space-y-2.5">
              <a
                href="https://kaigai-kurafan.com/privacy-policy"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center text-sm text-neutral-600 hover:text-primary-600 transition-colors group"
              >
                <span>プライバシーポリシー</span>
                <ExternalLink className="w-3.5 h-3.5 ml-1.5 opacity-0 group-hover:opacity-100 transition-opacity" />
              </a>
            </div>
          </div>
        </div>

        {/* コピーライト */}
        <div className="pt-6 sm:pt-8 border-t border-neutral-200/50">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <img
              src="/kaigai-kurafan-logo.png"
              alt="海外クラファン.com"
              className="h-8 w-auto opacity-60"
            />
            <p className="text-xs sm:text-sm text-neutral-500 text-center sm:text-right">
              © {currentYear} RE-IDEA Inc. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}