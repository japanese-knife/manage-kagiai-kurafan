import { Mail, MapPin } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 border-t border-neutral-700/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-12 py-12 sm:py-16">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12">
          <div className="md:col-span-5">
            <div className="flex items-center mb-6">
              <img
                src="/kaigai-kurafan-logo.png"
                alt="海外クラファン.com"
                className="h-10 w-auto brightness-0 invert"
              />
            </div>
            <p className="text-neutral-400 text-sm leading-relaxed mb-6">
              海外クラウドファンディングの専門サポートを提供する株式会社RE-IDEAが運営する案件管理サイトです。
            </p>
          </div>

          <div className="md:col-span-7">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              <div>
                <h3 className="text-white font-semibold mb-4 text-sm tracking-wider uppercase">
                  会社情報
                </h3>
                <div className="space-y-3">
                  <p className="text-neutral-300 text-sm font-medium">
                    株式会社RE-IDEA
                  </p>
                  <div className="flex items-start text-neutral-400 text-sm">
                    <MapPin className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                    <span>
                      〒151-0051<br />
                      東京都渋谷区千駄ヶ谷1-30-10-4F
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-white font-semibold mb-4 text-sm tracking-wider uppercase">
                  お問い合わせ
                </h3>
                <div className="space-y-3">
                  <a
                    href="mailto:info@re-idea.jp"
                    className="flex items-center text-neutral-400 hover:text-white text-sm transition-colors group"
                  >
                    <Mail className="w-4 h-4 mr-2 flex-shrink-0 group-hover:text-primary-400" />
                    info@re-idea.jp
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-neutral-700/50 mt-12 pt-8">
          <p className="text-neutral-500 text-xs text-center">
            &copy; 2025 RE-IDEA Co.,Ltd. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
