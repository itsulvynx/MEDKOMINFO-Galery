import { useEffect, useRef, useState } from 'react';
import { ArrowRight, RefreshCw, Stamp, Ticket } from 'lucide-react';
import { Artwork, QuoteItem } from '../types/gallery';
import { ArtworkFrame } from '../components/ArtworkFrame';

interface LobiPageProps {
  visitorCount: number;
  quotes: QuoteItem[];
  highlights: Artwork[];
  mostStamped: Artwork[];
  stats: { prokerCount: number; artworkCount: number };
  onEnterGallery: () => void;
  onOpenRoom: (slug: string) => void;
  onOpenLightbox: (list: Artwork[], index: number) => void;
  onToggleStempel: (artworkId: number) => Promise<void>;
  onToggleReaction: (artworkId: number, emoji: string) => Promise<void>;
}

export function LobiPage({
  visitorCount,
  quotes,
  highlights,
  mostStamped,
  stats,
  onEnterGallery,
  onOpenRoom,
  onOpenLightbox,
  onToggleStempel,
  onToggleReaction,
}: LobiPageProps) {
  const heroRef = useRef<HTMLElement | null>(null);
  const [spotlight, setSpotlight] = useState({ x: 52, y: 42 });
  const [quoteIdx, setQuoteIdx] = useState(() =>
    quotes.length > 0 ? Math.floor(Math.random() * quotes.length) : 0
  );

  useEffect(() => {
    if (quotes.length > 0) {
      setQuoteIdx(Math.floor(Math.random() * quotes.length));
    }
  }, [quotes.length]);

  const handleHeroMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    if (!heroRef.current) return;
    const rect = heroRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setSpotlight({ x, y });
  };

  const activeQuote = quotes[quoteIdx % Math.max(1, quotes.length)];
  const safeCount = visitorCount || 1;
  const ticketSerial = String(safeCount).padStart(4, '0');

  return (
    <div className="relative">
      {/* FULLSCREEN HERO LOBI */}
      <section
        ref={heroRef}
        onMouseMove={handleHeroMouseMove}
        className="relative min-h-[calc(100vh-3.5rem)] flex flex-col justify-between px-4 sm:px-8 lg:px-14 py-10 sm:py-14 overflow-hidden border-b border-[#F2EEE3]/15"
        style={{
          background: `radial-gradient(620px circle at ${spotlight.x}% ${spotlight.y}%, rgba(242, 179, 94, 0.16), rgba(29, 78, 137, 0.14) 38%, rgba(7, 24, 43, 0.98) 76%)`,
        }}
      >
        {/* Vertical Edge Archival Typography */}
        <div
          aria-hidden="true"
          className="hidden xl:flex writing-vertical absolute right-7 top-12 font-mono-catalog text-[10px] tracking-[0.26em] uppercase text-[#F2EEE3]/40 select-none"
        >
          CETAK CYANOTYPE · HIMATIF UNINUS MEDKOMINFO · 2026/2027
        </div>

        {/* Top Archival Metadata Strip */}
        <div className="max-w-[1360px] w-full mx-auto flex flex-wrap items-center justify-between gap-4 border-b border-[#F2EEE3]/15 pb-4">
          <div className="font-mono-catalog text-[11px] tracking-[0.18em] uppercase text-[#F2EEE3]/70 flex items-center gap-3">
            <span>Lobi Utama</span>
            <span aria-hidden="true">·</span>
            <span>Arsip Himpunan Teknik Informatika UNINUS</span>
          </div>
          <div className="font-mono-catalog text-[11px] tracking-[0.16em] uppercase text-[#F2B35E] flex items-center gap-2">
            <Ticket className="w-3.5 h-3.5" />
            <span className="tabular-nums">Total Kunjungan · Pengunjung Ke-{safeCount}</span>
          </div>
        </div>

        {/* Center Hero Headline & Serrated Ticket Button */}
        <div className="max-w-[1360px] w-full mx-auto my-auto py-12 lg:py-16 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-end">
          <div className="lg:col-span-8 flex flex-col gap-6">
            <p className="font-mono-catalog text-xs tracking-[0.22em] uppercase text-[#F2B35E]">
              Pameran Dokumentasi Terkurasi · 2026/2027
            </p>
            <div className="flex flex-col sm:flex-row sm:items-center gap-5 sm:gap-7">
              <img
                src="/assets/aistudio/Salinan_Logo_HIMATIF_4db90e2e.png"
                alt="Logo HIMATIF UNINUS"
                className="w-20 h-20 sm:w-24 sm:h-24 lg:w-28 lg:h-28 object-contain shrink-0 drop-shadow-xl"
              />
              <h1 className="font-serif-editorial text-5xl sm:text-7xl lg:text-[5.25rem] leading-[0.94] tracking-tight text-[#F2EEE3] [text-wrap:balance]">
                MEDKOMINFO{' '}
                <span className="italic font-normal text-[#F2B35E] block sm:inline">
                  Galery
                </span>
              </h1>
            </div>
            <p className="font-serif-editorial italic text-xl sm:text-2xl text-[#F2EEE3]/85 max-w-xl">
              “Setiap momen punya cerita.”
            </p>

            {/* Serrated Museum Ticket CTA */}
            <div className="pt-4 flex flex-wrap items-center gap-6">
              <button
                type="button"
                onClick={onEnterGallery}
                className="ticket-button px-7 py-4 flex items-center gap-5 cursor-pointer shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F2EEE3]"
              >
                <div className="flex flex-col text-left">
                  <span className="font-mono-catalog text-[9px] tracking-[0.2em] uppercase opacity-75">
                    TIKET MASUK · 2026/2027
                  </span>
                  <span className="font-serif-editorial text-lg sm:text-xl font-semibold tracking-tight">
                    Masuk Galeri
                  </span>
                </div>
                <span className="h-8 w-px bg-[#07182B]/25" />
                <div className="flex items-center gap-2 font-mono-catalog text-xs font-medium tracking-[0.12em]">
                  <span className="tabular-nums">NO.{ticketSerial}</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </button>

              <div className="font-mono-catalog text-xs text-[#F2EEE3]/65 leading-relaxed">
                <div className="tabular-nums">
                  {stats.prokerCount} Ruang Pamer · {stats.artworkCount} Karya Terarsip
                </div>
                <div>Masuk bebas biaya · Tanpa login</div>
              </div>
            </div>
          </div>

          {/* Lobi Hidup: Random Curator Quote Card */}
          <div className="lg:col-span-4">
            {activeQuote && (
              <div className="bg-[#F2EEE3] text-[#07182B] p-6 border border-[#F2EEE3] shadow-xl flex flex-col gap-4">
                <div className="flex items-center justify-between border-b border-[#07182B]/15 pb-2.5">
                  <span className="font-mono-catalog text-[10px] tracking-[0.18em] uppercase text-[#1D4E89]">
                    Catatan Lobi Hari Ini
                  </span>
                  {quotes.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setQuoteIdx((prev) => (prev + 1) % quotes.length)}
                      className="inline-flex items-center gap-1 font-mono-catalog text-[10px] uppercase tracking-[0.12em] text-[#07182B]/70 hover:text-[#07182B] cursor-pointer"
                      title="Lihat kutipan lain"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Acak</span>
                    </button>
                  )}
                </div>
                <p className="font-serif-editorial italic text-lg leading-relaxed text-[#07182B]">
                  “{activeQuote.text}”
                </p>
                <div className="font-mono-catalog text-[11px] uppercase tracking-[0.12em] text-[#07182B]/70">
                  — {activeQuote.author}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Index Cue */}
        <div className="max-w-[1360px] w-full mx-auto pt-4 border-t border-[#F2EEE3]/10 flex flex-wrap items-center justify-between gap-2 font-mono-catalog text-[11px] tracking-[0.16em] uppercase text-[#F2EEE3]/50">
          <span>Arahkan kursor untuk mencetak warna · Klik 2 kali foto untuk memperbesar</span>
          <span>Gulir ke bawah ↓</span>
        </div>
      </section>

      {/* SECTION: KARYA PILIHAN (ASYMMETRIC EDITORIAL GRID) */}
      <section className="max-w-[1360px] mx-auto px-4 sm:px-8 lg:px-14 py-16 sm:py-24 border-b border-[#F2EEE3]/15">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end mb-12">
          <div className="lg:col-span-7">
            <span className="font-mono-catalog text-xs tracking-[0.2em] uppercase text-[#F2B35E] block mb-2">
              01 · Koleksi Sorotan
            </span>
            <h2 className="font-serif-editorial text-3xl sm:text-5xl text-[#F2EEE3] tracking-tight">
              Karya <span className="italic">Pilihan</span>
            </h2>
          </div>
          <div className="lg:col-span-5 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <p className="text-sm text-[#F2EEE3]/70 leading-relaxed max-w-sm">
              Potret dan rekaman pilihan kurator yang paling menangkap denyut kegiatan HIMATIF sepanjang periode.
            </p>
            <button
              type="button"
              onClick={onEnterGallery}
              className="font-mono-catalog text-xs uppercase tracking-[0.16em] text-[#F2B35E] hover:underline whitespace-nowrap shrink-0 cursor-pointer text-left"
            >
              Lihat Semua Ruang →
            </button>
          </div>
        </div>

        {highlights.length === 0 ? (
          <div className="border border-[#F2EEE3]/20 p-10 text-center font-serif-editorial italic text-[#F2EEE3]/65">
            Belum ada karya yang ditandai sebagai highlight oleh kurator.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
            {highlights.map((art, index) => {
              // Intentional asymmetric editorial column spans & vertical offsets
              const colClass =
                index === 0
                  ? 'lg:col-span-7'
                  : index === 1
                  ? 'lg:col-span-5 lg:mt-14'
                  : index === 2
                  ? 'lg:col-span-5'
                  : 'lg:col-span-7 lg:-mt-6';

              return (
                <div key={art.id} className={colClass}>
                  {art.roomNumber && (
                    <button
                      type="button"
                      onClick={() => art.prokerSlug && onOpenRoom(art.prokerSlug)}
                      className="mb-2 inline-flex items-center gap-2 font-mono-catalog text-[10px] tracking-[0.18em] uppercase text-[#F2EEE3]/60 hover:text-[#F2B35E] cursor-pointer"
                    >
                      <span>{art.roomNumber}</span>
                      <span>·</span>
                      <span className="truncate max-w-[220px]">{art.prokerTitle}</span>
                    </button>
                  )}
                  <ArtworkFrame
                    artwork={art}
                    onOpen={() => onOpenLightbox(highlights, index)}
                    onToggleStempel={onToggleStempel}
                    onToggleReaction={onToggleReaction}
                    showCuratorQuote={false}
                  />
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* SECTION: PALING BANYAK DISTEMPEL */}
      <section className="max-w-[1360px] mx-auto px-4 sm:px-8 lg:px-14 py-16 sm:py-24">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10 border-b border-[#F2EEE3]/15 pb-5">
          <div>
            <span className="font-mono-catalog text-xs tracking-[0.2em] uppercase text-[#F2B35E] block mb-2">
              02 · Favorit Pengunjung
            </span>
            <h2 className="font-serif-editorial text-3xl sm:text-4xl text-[#F2EEE3]">
              Paling Banyak <span className="italic">Distempel</span>
            </h2>
          </div>
          <div className="flex items-center gap-2 font-mono-catalog text-xs text-[#F2EEE3]/65">
            <Stamp className="w-4 h-4 text-[#F2B35E]" />
            <span>Tekan stempel pada karya favoritmu di ruang pamer</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {mostStamped.map((art, idx) => (
            <div key={art.id} className="flex flex-col gap-2">
              <div className="flex items-center justify-between font-mono-catalog text-[11px] text-[#F2B35E]">
                <span>PERINGKAT 0{idx + 1}</span>
                <span className="tabular-nums">{art.likeCount || 0} STEMPEL</span>
              </div>
              <ArtworkFrame
                artwork={art}
                onOpen={() => onOpenLightbox(mostStamped, idx)}
                onToggleStempel={onToggleStempel}
                onToggleReaction={onToggleReaction}
                showCuratorQuote={false}
                compact
              />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
