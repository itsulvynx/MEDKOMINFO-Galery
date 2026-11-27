import { useState } from 'react';
import { ArrowUpRight, Stamp } from 'lucide-react';
import { ClosingData, Proker } from '../types/gallery';
import { ClosingEpilogue } from '../components/ClosingEpilogue';

interface DenahPageProps {
  prokers: Proker[];
  closing: ClosingData | null;
  loading: boolean;
  onSelectRoom: (slug: string) => void;
  onToggleProkerStamp: (prokerId: number) => Promise<void>;
  onVideoPlay?: () => void;
}

export function DenahPage({
  prokers,
  closing,
  loading,
  onSelectRoom,
  onToggleProkerStamp,
  onVideoPlay,
}: DenahPageProps) {
  const [hoveredProker, setHoveredProker] = useState<Proker | null>(null);

  return (
    <div className="max-w-[1360px] mx-auto px-4 sm:px-8 lg:px-14 py-12 sm:py-20 min-h-[82vh] relative">
      {/* Header */}
      <div className="border-b border-[#F2EEE3]/20 pb-8 mb-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-end">
        <div className="lg:col-span-8">
          <span className="font-mono-catalog text-xs tracking-[0.2em] uppercase text-[#F2B35E] block mb-2">
            Katalog Pameran · 2026/2027
          </span>
          <h1 className="font-serif-editorial text-4xl sm:text-6xl text-[#F2EEE3] tracking-tight">
            Denah <span className="italic">Ruangan</span>
          </h1>
        </div>
        <div className="lg:col-span-4 text-sm text-[#F2EEE3]/70 leading-relaxed">
          Setiap program kerja HIMATIF disusun menjadi ruang pamer tersendiri. Pilih salah satu ruang untuk menelusuri foto, film, dan buku tamu.
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center font-mono-catalog text-xs tracking-[0.18em] uppercase text-[#F2EEE3]/60">
          Menyiapkan denah ruang pamer...
        </div>
      ) : prokers.length === 0 ? (
        <div className="border border-[#F2EEE3]/20 p-12 text-center font-serif-editorial italic text-xl text-[#F2EEE3]/70">
          Belum ada ruang pamer yang dibuka untuk umum saat ini.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Catalog Table of Contents List */}
          <div className="lg:col-span-8 divide-y divide-[#F2EEE3]/15 border-t border-b border-[#F2EEE3]/15">
            {prokers.map((proker) => (
              <div
                key={proker.id}
                onMouseEnter={() => setHoveredProker(proker)}
                onMouseLeave={() => setHoveredProker(null)}
                className="group py-7 sm:py-9 flex flex-col sm:flex-row sm:items-center justify-between gap-5 transition-colors hover:bg-[#0B2A4A]/55 px-2 sm:px-4 -mx-2 sm:-mx-4"
              >
                <button
                  type="button"
                  onClick={() => onSelectRoom(proker.slug)}
                  className="flex-1 text-left flex flex-col sm:flex-row sm:items-baseline gap-3 sm:gap-8 cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#F2B35E]"
                >
                  <span className="font-mono-catalog text-sm sm:text-base tracking-[0.18em] text-[#F2B35E] shrink-0 tabular-nums">
                    {proker.roomNumber}
                  </span>

                  <div className="flex flex-col gap-1.5">
                    <h2 className="font-serif-editorial text-2xl sm:text-4xl text-[#F2EEE3] group-hover:text-[#F2B35E] transition-colors leading-tight">
                      {proker.title}
                    </h2>
                    {proker.subtitle && (
                      <p className="text-sm text-[#F2EEE3]/65">{proker.subtitle}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-2 font-mono-catalog text-[11px] tracking-[0.12em] uppercase text-[#F2EEE3]/55 pt-1">
                      <span>{proker.eventDate}</span>
                      <span aria-hidden="true">·</span>
                      <span className="tabular-nums">{proker.artworkCount || 0} Karya</span>
                    </div>
                  </div>
                </button>

                {/* Stamp + Enter Arrow */}
                <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                  <button
                    type="button"
                    onClick={() => onToggleProkerStamp(proker.id)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 font-mono-catalog text-[11px] border cursor-pointer min-h-[38px] ${
                      proker.userLiked
                        ? 'bg-[#F2B35E] text-[#07182B] border-[#F2B35E] font-medium'
                        : 'border-[#F2EEE3]/25 text-[#F2EEE3]/80 hover:border-[#F2B35E]'
                    }`}
                  >
                    <Stamp className="w-3.5 h-3.5" />
                    <span className="tabular-nums">{proker.likeCount || 0}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onSelectRoom(proker.slug)}
                    aria-label={`Masuk ${proker.title}`}
                    className="w-10 h-10 border border-[#F2EEE3]/30 flex items-center justify-center text-[#F2EEE3] group-hover:bg-[#F2B35E] group-hover:text-[#07182B] group-hover:border-[#F2B35E] transition-colors cursor-pointer"
                  >
                    <ArrowUpRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Floating Framed Cover Preview */}
          <div className="hidden lg:block lg:col-span-4 sticky top-24">
            {hoveredProker ? (
              <div className="passepartout-frame transition-opacity duration-200">
                <div className="aspect-[4/3] w-full overflow-hidden bg-[#0B2A4A]">
                  <img
                    src={hoveredProker.coverUrl}
                    alt={hoveredProker.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="pt-3 flex items-center justify-between font-mono-catalog text-[10px] tracking-[0.16em] uppercase text-[#07182B]">
                  <span>{hoveredProker.roomNumber}</span>
                  <span>{hoveredProker.eventDate}</span>
                </div>
              </div>
            ) : (
              <div className="border border-[#F2EEE3]/20 bg-[#0B2A4A]/45 p-8 aspect-[4/3] flex flex-col justify-between">
                <span className="font-mono-catalog text-[11px] tracking-[0.18em] uppercase text-[#F2B35E]">
                  Pratinjau Sampul Ruang
                </span>
                <p className="font-serif-editorial italic text-xl text-[#F2EEE3]/75 leading-relaxed">
                  Arahkan kursor ke salah satu baris program kerja di sebelah kiri untuk mengintip sampul ruangannya.
                </p>
                <span className="font-mono-catalog text-[10px] uppercase tracking-[0.14em] text-[#F2EEE3]/45">
                  Arsip Medkominfo 2026/2027
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Babak Penutup di akhir Denah Ruangan */}
      {!loading && <ClosingEpilogue closing={closing} onVideoPlay={onVideoPlay} />}
    </div>
  );
}
