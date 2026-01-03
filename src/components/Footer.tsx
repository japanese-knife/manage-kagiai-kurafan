export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white/80 backdrop-blur-sm border-t border-neutral-200/50 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-12 py-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center">
            <img
              src="/kaigai-kurafan-logo.png"
              alt="海外クラファン.com"
              className="h-6 w-auto"
            />
          </div>
          <div className="text-sm text-neutral-600 text-center sm:text-right">
            © {currentYear} 海外クラファン.com All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
}
