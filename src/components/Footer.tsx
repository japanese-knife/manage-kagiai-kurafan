export default function Footer() {
  return (
    <footer className="relative mt-auto border-t border-neutral-200/50 bg-white to-indigo-50/40 backdrop-blur-sm">
      {/* 装飾的な背景要素 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary-100/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-indigo-100/20 rounded-full blur-3xl"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-12 py-8 sm:py-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* 左側: ロゴ・キャッチコピー・リンク */}
          <div className="space-y-5">
            <div className="inline-block">
              <img
                src="/kaigai-kurafan-logo.png"
                alt="海外クラファン.com"
                className="h-9 sm:h-10 w-auto drop-shadow-sm"
              />
            </div>
            
            <div className="space-y-2 max-w-xl">
              <p className="text-sm sm:text-base font-medium text-neutral-800 leading-relaxed">
                日本企業の海外進出を、私たちが徹底的にサポートいたします。
              </p>
              <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">
                海外クラウドファンディングで新たな可能性を切り開きましょう。
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs sm:text-sm">
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
          </div>

          {/* 右側: 会社情報 */}
          <div className="flex flex-col justify-center lg:items-end space-y-3 lg:text-right">
            <div className="space-y-1.5 text-xs sm:text-sm text-neutral-600">
              <p className="font-semibold text-neutral-700 text-sm sm:text-base">株式会社RE-IDEA</p>
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
            <p className="text-xs text-neutral-500 pt-2">
              © {new Date().getFullYear()} RE-IDEA Co.,Ltd. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}