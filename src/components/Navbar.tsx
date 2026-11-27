import { useState } from 'react';
import { Menu, X } from 'lucide-react';

export type PageRoute = 'lobi' | 'denah' | 'ruang' | 'tentang' | 'admin';

interface NavbarProps {
  currentPage: PageRoute;
  onNavigate: (page: PageRoute) => void;
}

export function Navbar({ currentPage, onNavigate }: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleNav = (page: PageRoute) => {
    setMobileOpen(false);
    onNavigate(page);
  };

  const isGalleryActive = currentPage === 'denah' || currentPage === 'ruang';

  return (
    <header className="sticky top-0 z-50 border-b border-[#F2EEE3]/15 bg-[#07182B]/95 backdrop-blur-none">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-8 h-14 flex items-center justify-between gap-8">
        {/* Zone 1: Brand Mark */}
        <button
          type="button"
          onClick={() => handleNav('lobi')}
          className="flex items-center gap-3 text-left group cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#F2B35E]"
        >
          <img
            src="/assets/aistudio/Salinan_Logo_HIMATIF_4db90e2e.png"
            alt="Logo HIMATIF UNINUS"
            className="w-8 h-8 object-contain shrink-0"
          />
          <span className="font-serif-editorial text-base sm:text-lg tracking-tight text-[#F2EEE3] whitespace-nowrap">
            MEDKOMINFO <span className="italic text-[#F2B35E]">Galery</span>
          </span>
        </button>

        {/* Zone 2: Navigation Links (Mono) */}
        <nav className="hidden md:flex items-center gap-8 font-mono-catalog text-xs tracking-[0.16em] uppercase">
          <button
            type="button"
            onClick={() => handleNav('lobi')}
            className={`py-1 cursor-pointer whitespace-nowrap shrink-0 border-b transition-colors ${
              currentPage === 'lobi'
                ? 'border-[#F2B35E] text-[#F2B35E]'
                : 'border-transparent text-[#F2EEE3]/75 hover:text-[#F2EEE3]'
            }`}
          >
            Lobi
          </button>
          <button
            type="button"
            onClick={() => handleNav('denah')}
            className={`py-1 cursor-pointer whitespace-nowrap shrink-0 border-b transition-colors ${
              isGalleryActive
                ? 'border-[#F2B35E] text-[#F2B35E]'
                : 'border-transparent text-[#F2EEE3]/75 hover:text-[#F2EEE3]'
            }`}
          >
            Ruang Pamer
          </button>
          <button
            type="button"
            onClick={() => handleNav('tentang')}
            className={`py-1 cursor-pointer whitespace-nowrap shrink-0 border-b transition-colors ${
              currentPage === 'tentang'
                ? 'border-[#F2B35E] text-[#F2B35E]'
                : 'border-transparent text-[#F2EEE3]/75 hover:text-[#F2EEE3]'
            }`}
          >
            Tentang
          </button>
        </nav>

        {/* Zone 3: Single Admin Action + Mobile Toggle */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => handleNav('admin')}
            className={`hidden md:inline-flex items-center px-3.5 py-1.5 font-mono-catalog text-[11px] tracking-[0.14em] uppercase border transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
              currentPage === 'admin'
                ? 'bg-[#F2B35E] text-[#07182B] border-[#F2B35E]'
                : 'border-[#F2EEE3]/30 text-[#F2EEE3]/85 hover:border-[#F2B35E] hover:text-[#F2B35E]'
            }`}
          >
            Admin
          </button>

          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-label={mobileOpen ? 'Tutup menu' : 'Buka menu'}
            className="md:hidden p-2 border border-[#F2EEE3]/25 text-[#F2EEE3] hover:border-[#F2B35E] min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="md:hidden border-t border-[#F2EEE3]/15 bg-[#07182B] px-4 py-4 flex flex-col gap-2 font-mono-catalog text-xs uppercase tracking-[0.16em]">
          <button
            type="button"
            onClick={() => handleNav('lobi')}
            className={`text-left py-2.5 px-2 border-b border-[#F2EEE3]/10 ${
              currentPage === 'lobi' ? 'text-[#F2B35E]' : 'text-[#F2EEE3]'
            }`}
          >
            01 · Lobi
          </button>
          <button
            type="button"
            onClick={() => handleNav('denah')}
            className={`text-left py-2.5 px-2 border-b border-[#F2EEE3]/10 ${
              isGalleryActive ? 'text-[#F2B35E]' : 'text-[#F2EEE3]'
            }`}
          >
            02 · Ruang Pamer
          </button>
          <button
            type="button"
            onClick={() => handleNav('tentang')}
            className={`text-left py-2.5 px-2 border-b border-[#F2EEE3]/10 ${
              currentPage === 'tentang' ? 'text-[#F2B35E]' : 'text-[#F2EEE3]'
            }`}
          >
            03 · Tentang
          </button>
          <button
            type="button"
            onClick={() => handleNav('admin')}
            className={`text-left py-2.5 px-2 ${
              currentPage === 'admin' ? 'text-[#F2B35E]' : 'text-[#F2EEE3]/80'
            }`}
          >
            04 · Panel Admin
          </button>
        </div>
      )}
    </header>
  );
}
