import { Building2, Mail, ExternalLink } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-neutral-200/50 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-12 py-8 sm:py-10 md:py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-12">
          {/* 会社情報 */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-primary-50 rounded-lg flex items-center justify-center">
                <Building2 className="w-4 h-4 text-primary-600" />
              </div>
              <h3 className="text-base font-semibold text-neutral-900">
                株式会社RE-IDEA
              </h3>
            </div>
            <div className="space-y-2 text-sm text-neutral-600">
              <p>〒151-0051</p>
              <p>東京都渋谷区千駄ヶ谷1-30-10-4F</p>
              <div className="flex items-center space-x-2 pt-2">
                <Mail className="w-4 h-4 text-neutral-400" />
                <a 
                  href="mailto:info@re-idea.jp"
                  className="hover:text-primary-600 transition-colors"
                >
                  info@re-idea.jp
                </a>
              </div>
            </div>
          </div>

          {/* サービス紹介 */}
          <div>
            <h3 className="text-base font-semibold text-neutral-900 mb-4">
              RE-IDEA
            </h3>
            <p className="text-sm text-neutral-600 leading-relaxed">
              日本企業の海外進出を、私たちが徹底的にサポートいたします。海外クラウドファンディングで新たな可能性を切り開きましょう。
            </p>
          </div>

          {/* リンク */}
          <div>
            <h3 className="text-base font-semibold text-neutral-900 mb-4">
              リンク
            </h3>
            <ul className="space-y-3">
              <li>
                <a
                  href="https://re-idea-corp.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-sm text-neutral-600 hover:text-primary-600 transition-colors group"
                >
                  コーポレートサイト
                  <ExternalLink className="w-3.5 h-3.5 ml-1.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                </a>
              </li>
              <li>
                <a
                  href="https://kaigai-kurafan.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-sm text-neutral-600 hover:text-primary-600 transition-colors group"
                >
                  海外クラファン.com
                  <ExternalLink className="w-3.5 h-3.5 ml-1.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                </a>
              </li>
              <li>
                <a
                  href="https://kaigai-kurafan.com/privacy-policy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-sm text-neutral-600 hover:text-primary-600 transition-colors group"
                >
                  プライバシーポリシー
                  <ExternalLink className="w-3.5 h-3.5 ml-1.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* コピーライト */}
        <div className="mt-8 pt-6 border-t border-neutral-200/50">
          <p className="text-xs sm:text-sm text-center text-neutral-500">
            © {new Date().getFullYear()} 株式会社RE-IDEA. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}