export default function Footer() {
  return (
    <footer className="relative mt-auto border-t border-neutral-200/50 bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 backdrop-blur-sm">
      {/* 装飾的な背景要素 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary-100/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-indigo-100/20 rounded-full blur-3xl"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-12 py-12 sm:py-16">
        <div className="flex flex-col items-center text-center space-y-8">
          {/* ロゴセクション */}
          <div className="space-y-6">
            <div className="inline-block">
              <img
                src="/kaigai-kurafan-logo.png"
                alt="海外クラファン.com"
                className="h-10 sm:h-12 w-auto mx-auto drop-shadow-sm"
              />
            </div>
            
            {/* キャッチコピー */}
            <div className="max-w-2xl mx-auto space-y-3">
              <p className="text-base sm:text-lg font-medium text-neutral-800 leading-relaxed">
                日本企業の海外進出を、私たちが徹底的にサポートいたします。
              </p>
              <p className="text-sm sm:text-base text-neutral-600 leading-relaxed">
                海外クラウドファンディングで新たな可能性を切り開きましょう。
              </p>
            </div>

            {/* 装飾的な区切り線 */}
            <div className="flex items-center justify-center gap-2">
              <div className="h-px w-16 bg-gradient-to-r from-transparent via-primary-300 to-transparent"></div>
              <div className="w-1.5 h-1.5 rounded-full bg-primary-400"></div>
              <div className="h-px w-16 bg-gradient-to-r from-transparent via-primary-300 to-transparent"></div>
            </div>
          </div>

          {/* リンクセクション */}
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4 text-sm">
            <a
              href="https://kaigai-kurafan.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-neutral-600 hover:text-primary-600 transition-colors duration-200 font-medium"
            >
              海外クラファン.com
            </a>
            <span className="text-neutral-300">•</span>
            <a
              href="https://re-idea-corp.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-neutral-600 hover:text-primary-600 transition-colors duration-200 font-medium"
            >
              コーポレートサイト
            </a>
            <span className="text-neutral-300">•</span>
            <a
              href="https://kaigai-kurafan.com/privacy-policy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-neutral-600 hover:text-primary-600 transition-colors duration-200 font-medium"
            >
              プライバシーポリシー
            </a>
          </div>

          {/* 会社情報 */}
          <div className="space-y-2 text-xs sm:text-sm text-neutral-600">
            <p className="font-semibold text-neutral-700">株式会社RE-IDEA</p>
            <p>〒151-0051 東京都渋谷区千駄ヶ谷1-30-10-4F</p>
            <p>
              Email:{' '}
              <a
                href="mailto:info@re-idea.jp"
                className="text-primary-600 hover:text-primary-700 transition-colors duration-200"
              >
                info@re-idea.jp
              </a>
            </p>
          </div>

          {/* コピーライト */}
          <div className="pt-6 border-t border-neutral-200/50 w-full max-w-4xl">
            <p className="text-xs sm:text-sm text-neutral-500">
              © {new Date().getFullYear()} RE-IDEA Corporation. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}