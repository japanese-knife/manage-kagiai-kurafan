import { Mail, MapPin } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 text-white mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-12 py-12 sm:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-12">
          <div className="flex flex-col items-start">
            <img
              src="/kaigai-kurafan-logo.png"
              alt="海外クラファン.com"
              className="h-10 sm:h-12 w-auto mb-6 brightness-0 invert"
            />
            <div className="space-y-2">
              <p className="text-lg font-semibold text-white">RE-IDEA Co.,Ltd</p>
              <p className="text-base text-neutral-300">株式会社RE-IDEA</p>
            </div>
          </div>

          <div className="flex flex-col space-y-4">
            <h3 className="text-sm font-semibold text-neutral-400 uppercase tracking-wider mb-2">
              Contact
            </h3>
            <a
              href="mailto:info@re-idea.jp"
              className="flex items-start text-neutral-300 hover:text-white transition-colors group"
            >
              <Mail className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0 group-hover:scale-110 transition-transform" />
              <span className="text-base">info@re-idea.jp</span>
            </a>
            <div className="flex items-start text-neutral-300">
              <MapPin className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" />
              <div className="text-base leading-relaxed">
                <p>〒151-0051</p>
                <p>東京都渋谷区千駄ヶ谷1-30-10-4F</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col justify-between">
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-neutral-400 uppercase tracking-wider">
                About Us
              </h3>
              <p className="text-sm text-neutral-400 leading-relaxed">
                海外クラウドファンディングの成功をサポートする案件管理システム
              </p>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-neutral-700">
          <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
            <p className="text-sm text-neutral-400">
              &copy; {new Date().getFullYear()} RE-IDEA Co.,Ltd. All rights reserved.
            </p>
            <div className="flex items-center space-x-6">
              <a
                href="https://re-idea.jp"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-neutral-400 hover:text-white transition-colors"
              >
                Website
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
