import { Mail, Heart } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white/80 backdrop-blur-sm border-t border-neutral-200/50 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-12 py-6 sm:py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Logo & Copyright */}
          <div className="flex flex-col items-center sm:items-start gap-3">
            <img
              src="/kaigai-kurafan-logo.png"
              alt="海外クラファン.com"
              className="h-8 w-auto"
            />
            <p className="text-sm text-neutral-600 text-center sm:text-left">
              © {currentYear} 海外クラファン.com. All rights reserved.
            </p>
          </div>

          {/* Links */}
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
            <a
              href="mailto:contact@kaigai-kurafan.com"
              className="flex items-center text-sm text-neutral-600 hover:text-primary-600 transition-colors"
            >
              <Mail className="w-4 h-4 mr-2" />
              お問い合わせ
            </a>
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
          </div>

          {/* Made with love */}
          <div className="flex items-center text-sm text-neutral-600">
            <span>Made with</span>
            <Heart className="w-4 h-4 mx-1.5 text-red-500 fill-red-500" />
            <span>in Japan</span>
          </div>
        </div>
      </div>
    </footer>
  );
}