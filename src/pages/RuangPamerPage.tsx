import { useRef, useState } from 'react';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Flag,
  LayoutGrid,
  MoveHorizontal,
  Send,
  Stamp,
} from 'lucide-react';
import { motion } from 'motion/react';
import { Artwork, GuestComment, Proker } from '../types/gallery';
import { ArtworkFrame } from '../components/ArtworkFrame';
import { formatIndonesianDate } from '../utils/device';

const STICKERS = ['✉️', '📸', '✨', '☕', '🌿', '💌', '🎞️'] as const;

interface RuangPamerPageProps {
  proker: Proker | null;
  artworks: Artwork[];
  comments: GuestComment[];
  loading: boolean;
  onBackToDenah: () => void;
  onOpenLightbox: (index: number) => void;
  onToggleArtworkStamp: (artworkId: number) => Promise<void>;
  onToggleProkerStamp: (prokerId: number) => Promise<void>;
  onToggleReaction: (artworkId: number, emoji: string) => Promise<void>;
  onSubmitComment: (payload: {
    prokerId: number;
    authorName: string;
    message: string;
    sticker: string;
    honeypot: string;
  }) => Promise<{ ok: boolean; notice?: string; error?: string }>;
  onReportComment: (commentId: number) => Promise<void>;
}

export function RuangPamerPage({
  proker,
  artworks,
  comments,
  loading,
  onBackToDenah,
  onOpenLightbox,
  onToggleArtworkStamp,
  onToggleProkerStamp,
  onToggleReaction,
  onSubmitComment,
  onReportComment,
}: RuangPamerPageProps) {
  const [viewMode, setViewMode] = useState<'dinding' | 'lorong'>('dinding');
  const [spotlight, setSpotlight] = useState({ x: 50, y: 20 });
  const corridorRef = useRef<HTMLDivElement | null>(null);

  // Guestbook form state
  const [authorName, setAuthorName] = useState('');
  const [message, setMessage] = useState('');
  const [sticker, setSticker] = useState<string>('✉️');
  const [honeypot, setHoneypot] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [reportedIds, setReportedIds] = useState<number[]>([]);
  const [prokerStampAnim, setProkerStampAnim] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setSpotlight({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    });
  };

  const scrollCorridor = (dir: 'left' | 'right') => {
    if (!corridorRef.current) return;
    const offset = dir === 'left' ? -460 : 460;
    corridorRef.current.scrollBy({ left: offset, behavior: 'smooth' });
  };

  const handlePostcardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!proker || submitting) return;
    setFeedback(null);
    setSubmitting(true);

    const res = await onSubmitComment({
      prokerId: proker.id,
      authorName: authorName.trim(),
      message: message.trim(),
      sticker,
      honeypot,
    });

    setSubmitting(false);
    if (res.ok) {
      setMessage('');
      setFeedback({
        type: 'ok',
        text: res.notice || 'Kartu pos berhasil dikirim!',
      });
    } else {
      setFeedback({
        type: 'err',
        text: res.error || 'Gagal mengirim kartu pos.',
      });
    }
  };

  const handleReport = async (id: number) => {
    if (reportedIds.includes(id)) return;
    setReportedIds((prev) => [...prev, id]);
    await onReportComment(id);
  };

  const handleProkerStamp = async () => {
    if (!proker) return;
    if (!proker.userLiked) {
      setProkerStampAnim(true);
      setTimeout(() => setProkerStampAnim(false), 1200);
    }
    await onToggleProkerStamp(proker.id);
  };

  if (loading) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center font-mono-catalog text-xs uppercase tracking-[0.18em] text-[#F2EEE3]/65">
        Membuka pintu ruang pamer...
      </div>
    );
  }

  if (!proker) {
    return (
      <div className="max-w-xl mx-auto px-6 py-24 text-center flex flex-col items-center gap-5">
        <h1 className="font-serif-editorial text-3xl text-[#F2EEE3]">
          Ruang Pamer Tidak Ditemukan
        </h1>
        <p className="text-sm text-[#F2EEE3]/70">
          Mungkin ruangan ini sedang ditutup kurator untuk penataan ulang.
        </p>
        <button
          type="button"
          onClick={onBackToDenah}
          className="px-5 py-2.5 bg-[#F2B35E] text-[#07182B] font-mono-catalog text-xs uppercase tracking-[0.14em] cursor-pointer"
        >
          Kembali ke Denah Ruangan
        </button>
      </div>
    );
  }

  return (
    <div
      onMouseMove={handleMouseMove}
      className="relative min-h-screen"
      style={{
        backgroundImage: `radial-gradient(640px circle at ${spotlight.x}% ${spotlight.y}%, rgba(242, 179, 94, 0.09), transparent 65%)`,
      }}
    >
      {/* ROOM HEADER & MUSEUM PLAQUE */}
      <section className="max-w-[1360px] mx-auto px-4 sm:px-8 lg:px-14 pt-10 pb-12 border-b border-[#F2EEE3]/15">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <button
            type="button"
            onClick={onBackToDenah}
            className="inline-flex items-center gap-2 font-mono-catalog text-xs uppercase tracking-[0.16em] text-[#F2EEE3]/75 hover:text-[#F2B35E] cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Denah Ruangan</span>
          </button>

          <div className="flex items-center gap-3 relative">
            <button
              type="button"
              onClick={handleProkerStamp}
              className={`inline-flex items-center gap-2 px-4 py-2 font-mono-catalog text-xs uppercase tracking-[0.14em] border cursor-pointer transition-colors min-h-[40px] ${
                proker.userLiked
                  ? 'bg-[#F2B35E] text-[#07182B] border-[#F2B35E] font-medium'
                  : 'border-[#F2EEE3]/35 text-[#F2EEE3] hover:border-[#F2B35E] hover:text-[#F2B35E]'
              }`}
            >
              <Stamp className="w-4 h-4" />
              <span>{proker.userLiked ? 'Ruang Distempel' : 'Stempel Ruang'}</span>
              <span className="tabular-nums">· {proker.likeCount || 0}</span>
            </button>
            {prokerStampAnim && (
              <span className="font-mono-catalog text-xs text-[#F2B35E] animate-stempel">
                Distempel! ✨
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Left: Big Room Number & Serif Title */}
          <div className="lg:col-span-7 flex flex-col gap-3">
            <span className="font-mono-catalog text-sm sm:text-base tracking-[0.22em] uppercase text-[#F2B35E]">
              {proker.roomNumber} · {proker.eventDate}
            </span>
            <h1 className="font-serif-editorial text-4xl sm:text-6xl leading-[1.02] text-[#F2EEE3] tracking-tight [text-wrap:balance]">
              {proker.title}
            </h1>
            {proker.subtitle && (
              <p className="font-serif-editorial italic text-xl text-[#F2EEE3]/75 mt-1">
                {proker.subtitle}
              </p>
            )}
          </div>

          {/* Right: Cream Museum Plaque (PLAKAT) */}
          <div className="lg:col-span-5 bg-[#F2EEE3] text-[#07182B] p-6 sm:p-7 border border-[#F2EEE3] shadow-xl flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-[#07182B]/15 pb-2">
              <span className="font-mono-catalog text-[10px] tracking-[0.18em] uppercase text-[#1D4E89]">
                Plakat Pameran
              </span>
              <span className="font-mono-catalog text-[10px] tracking-[0.14em] uppercase text-[#07182B]/60 tabular-nums">
                {artworks.length} Karya
              </span>
            </div>
            <p className="text-sm leading-relaxed text-[#07182B]/90">
              {proker.description}
            </p>
            {proker.curatorNote && (
              <div className="pt-3 border-t border-[#07182B]/15">
                <span className="font-mono-catalog text-[10px] tracking-[0.16em] uppercase text-[#1D4E89] block mb-1">
                  Kata Kurator
                </span>
                <p className="font-serif-editorial italic text-[15px] text-[#07182B]">
                  “{proker.curatorNote}”
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* EXHIBITION TOOLBAR & WORKS */}
      <section className="max-w-[1360px] mx-auto px-4 sm:px-8 lg:px-14 py-10 sm:py-14">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-10">
          <div className="font-mono-catalog text-xs uppercase tracking-[0.16em] text-[#F2EEE3]/65">
            Mode Eksplorasi · Klik 2 kali karya untuk memperbesar
          </div>

          {/* Segmented Dinding / Lorong Mode Switcher */}
          <div className="inline-flex border border-[#F2EEE3]/25 bg-[#0B2A4A] p-1">
            <button
              type="button"
              onClick={() => setViewMode('dinding')}
              className={`inline-flex items-center gap-2 px-4 py-1.5 font-mono-catalog text-xs uppercase tracking-[0.14em] cursor-pointer transition-colors whitespace-nowrap ${
                viewMode === 'dinding'
                  ? 'bg-[#F2B35E] text-[#07182B] font-medium'
                  : 'text-[#F2EEE3]/75 hover:text-[#F2EEE3]'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Dinding</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('lorong')}
              className={`inline-flex items-center gap-2 px-4 py-1.5 font-mono-catalog text-xs uppercase tracking-[0.14em] cursor-pointer transition-colors whitespace-nowrap ${
                viewMode === 'lorong'
                  ? 'bg-[#F2B35E] text-[#07182B] font-medium'
                  : 'text-[#F2EEE3]/75 hover:text-[#F2EEE3]'
              }`}
            >
              <MoveHorizontal className="w-3.5 h-3.5" />
              <span>Lorong</span>
            </button>
          </div>
        </div>

        {artworks.length === 0 ? (
          <div className="border border-[#F2EEE3]/20 p-14 text-center font-serif-editorial italic text-xl text-[#F2EEE3]/65">
            Dinding ruang ini masih disiapkan oleh kurator. Silakan mampir lagi nanti!
          </div>
        ) : viewMode === 'dinding' ? (
          /* MODE DINDING: Asymmetric Masonry Wall */
          <div className="columns-1 md:columns-2 lg:columns-3 gap-8 space-y-10">
            {artworks.map((art, index) => (
              <div key={art.id} className="break-inside-avoid">
                <ArtworkFrame
                  artwork={art}
                  onOpen={() => onOpenLightbox(index)}
                  onToggleStempel={onToggleArtworkStamp}
                  onToggleReaction={onToggleReaction}
                />
              </div>
            ))}
          </div>
        ) : (
          /* MODE LORONG: Horizontal Corridor Scroll */
          <div className="relative">
            <div className="hidden sm:flex items-center justify-end gap-2 mb-4">
              <button
                type="button"
                onClick={() => scrollCorridor('left')}
                aria-label="Geser lorong ke kiri"
                className="w-10 h-10 border border-[#F2EEE3]/30 flex items-center justify-center text-[#F2EEE3] hover:border-[#F2B35E] hover:text-[#F2B35E] cursor-pointer"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={() => scrollCorridor('right')}
                aria-label="Geser lorong ke kanan"
                className="w-10 h-10 border border-[#F2EEE3]/30 flex items-center justify-center text-[#F2EEE3] hover:border-[#F2B35E] hover:text-[#F2B35E] cursor-pointer"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            <div
              ref={corridorRef}
              className="lorong-scroll flex items-start gap-8 lg:gap-12 overflow-x-auto pb-8 snap-x snap-mandatory"
            >
              {artworks.map((art, index) => (
                <div
                  key={art.id}
                  className={`shrink-0 snap-start ${
                    art.aspectRatio === '3:4'
                      ? 'w-[80vw] sm:w-[340px]'
                      : 'w-[85vw] sm:w-[480px] lg:w-[520px]'
                  } ${index % 2 === 1 ? 'sm:mt-10' : ''}`}
                >
                  <ArtworkFrame
                    artwork={art}
                    onOpen={() => onOpenLightbox(index)}
                    onToggleStempel={onToggleArtworkStamp}
                    onToggleReaction={onToggleReaction}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Closing Note Banner */}
        <div className="mt-16 pt-10 border-t border-[#F2EEE3]/15 text-center">
          <p className="font-serif-editorial italic text-2xl sm:text-3xl text-[#F2B35E]">
            “{proker.closingNote || `Terima kasih sudah mampir di ${proker.roomNumber}.`}”
          </p>
        </div>
      </section>

      {/* BUKU TAMU / KARTU POS */}
      <section className="bg-[#0B2A4A]/65 border-t border-[#F2EEE3]/15 py-16 sm:py-20">
        <div className="max-w-[1360px] mx-auto px-4 sm:px-8 lg:px-14 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
          {/* Postcard Form */}
          <div className="lg:col-span-5 bg-[#07182B] border border-[#F2EEE3]/25 p-6 sm:p-8">
            <span className="font-mono-catalog text-[11px] tracking-[0.2em] uppercase text-[#F2B35E] block mb-2">
              Buku Tamu · Kartu Pos
            </span>
            <h2 className="font-serif-editorial text-2xl sm:text-3xl text-[#F2EEE3] mb-2">
              Nitip Kesan di {proker.roomNumber}
            </h2>
            <p className="text-xs text-[#F2EEE3]/65 leading-relaxed mb-6">
              Tulis ucapan singkat layaknya kartu pos museum. Tanpa tautan, maksimal 140 karakter ya.
            </p>

            <form onSubmit={handlePostcardSubmit} className="flex flex-col gap-4">
              {/* Anti-bot Honeypot */}
              <div className="sr-only" aria-hidden="true">
                <label htmlFor="website-field">Website</label>
                <input
                  id="website-field"
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                  value={honeypot}
                  onChange={(e) => setHoneypot(e.target.value)}
                />
              </div>

              <div>
                <label
                  htmlFor="guest-name"
                  className="block font-mono-catalog text-[11px] uppercase tracking-[0.14em] text-[#F2EEE3]/80 mb-1.5"
                >
                  Nama Panggilan (Boleh Kosong)
                </label>
                <input
                  id="guest-name"
                  type="text"
                  maxLength={40}
                  placeholder="Pengunjung Anonim"
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#0B2A4A] border border-[#F2EEE3]/25 text-sm text-[#F2EEE3] placeholder:text-[#F2EEE3]/35 focus:outline-none focus:border-[#F2B35E]"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor="guest-message"
                    className="font-mono-catalog text-[11px] uppercase tracking-[0.14em] text-[#F2EEE3]/80"
                  >
                    Pesan Kartu Pos
                  </label>
                  <span
                    className={`font-mono-catalog text-[11px] tabular-nums ${
                      message.length > 130 ? 'text-[#F2B35E]' : 'text-[#F2EEE3]/55'
                    }`}
                  >
                    {message.length}/140
                  </span>
                </div>
                <textarea
                  id="guest-message"
                  rows={3}
                  maxLength={140}
                  required
                  placeholder="Ceritain momen favoritmu di proker ini..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#0B2A4A] border border-[#F2EEE3]/25 text-sm text-[#F2EEE3] placeholder:text-[#F2EEE3]/35 focus:outline-none focus:border-[#F2B35E] resize-none"
                />
              </div>

              {/* Sticker Selector */}
              <div>
                <span className="block font-mono-catalog text-[11px] uppercase tracking-[0.14em] text-[#F2EEE3]/80 mb-2">
                  Tempel Stiker Kecil
                </span>
                <div className="flex flex-wrap gap-2">
                  {STICKERS.map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setSticker(st)}
                      className={`w-10 h-10 flex items-center justify-center text-lg border cursor-pointer transition-colors ${
                        sticker === st
                          ? 'border-[#F2B35E] bg-[#1D4E89]'
                          : 'border-[#F2EEE3]/20 bg-[#0B2A4A] hover:border-[#F2EEE3]/50'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {feedback && (
                <div
                  className={`p-3 text-xs border ${
                    feedback.type === 'ok'
                      ? 'border-[#F2B35E]/60 bg-[#F2B35E]/10 text-[#F2EEE3]'
                      : 'border-red-400/60 bg-red-950/40 text-red-200'
                  }`}
                >
                  {feedback.text}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting || !message.trim()}
                className="mt-1 inline-flex items-center justify-center gap-2 px-5 py-3 bg-[#F2B35E] text-[#07182B] font-mono-catalog text-xs font-medium uppercase tracking-[0.16em] hover:bg-[#f6c47e] disabled:opacity-40 cursor-pointer min-h-[44px]"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{submitting ? 'Mengirim...' : 'Kirim Kartu Pos'}</span>
              </button>
            </form>
          </div>

          {/* Postcards Corkboard / Wall */}
          <div className="lg:col-span-7">
            <div className="flex items-center justify-between border-b border-[#F2EEE3]/15 pb-3 mb-7">
              <span className="font-mono-catalog text-xs uppercase tracking-[0.18em] text-[#F2EEE3]/80">
                Dinding Kartu Pos Pengunjung
              </span>
              <span className="font-mono-catalog text-xs text-[#F2B35E] tabular-nums">
                {comments.length} Ucapan
              </span>
            </div>

            {comments.length === 0 ? (
              <div className="border border-dashed border-[#F2EEE3]/25 p-12 text-center">
                <p className="font-serif-editorial italic text-xl text-[#F2EEE3]/75">
                  “Belum ada yang nitip kesan. Jadi yang pertama yuk.”
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {comments.map((c, idx) => {
                  const tiltClass =
                    idx % 3 === 0
                      ? '-rotate-[1.2deg]'
                      : idx % 3 === 1
                      ? 'rotate-[1.4deg]'
                      : '-rotate-[0.5deg]';

                  return (
                    <motion.div
                      key={c.id}
                      initial={{ opacity: 0, y: -16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.45, delay: Math.min(idx * 0.06, 0.35) }}
                      className={`bg-[#F2EEE3] text-[#07182B] p-5 border border-[#07182B]/15 shadow-lg flex flex-col justify-between gap-4 relative ${tiltClass} hover:rotate-0 transition-transform duration-200`}
                    >
                      {/* Postmark & Sticker Top Row */}
                      <div className="flex items-start justify-between gap-2 border-b border-[#07182B]/15 pb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xl" aria-hidden="true">
                            {c.sticker}
                          </span>
                          <div className="font-mono-catalog text-[10px] uppercase tracking-[0.12em] text-[#07182B]/70">
                            {c.authorName}
                          </div>
                        </div>

                        {/* Blue Cyanotype Postmark Stamp */}
                        <div className="border border-[#1D4E89]/80 px-2 py-1 text-right font-mono-catalog text-[8px] leading-tight uppercase tracking-[0.12em] text-[#1D4E89] -rotate-3">
                          <div>{proker.roomNumber}</div>
                          <div>{formatIndonesianDate(c.createdAt)}</div>
                        </div>
                      </div>

                      {/* Caveat Handwritten Message */}
                      <p className="font-handwriting text-2xl leading-snug text-[#07182B] break-words">
                        “{c.message}”
                      </p>

                      {/* Bottom Subtle Report */}
                      <div className="flex items-center justify-end pt-1">
                        <button
                          type="button"
                          onClick={() => handleReport(c.id)}
                          disabled={reportedIds.includes(c.id)}
                          className="inline-flex items-center gap-1 font-mono-catalog text-[10px] uppercase tracking-[0.1em] text-[#07182B]/45 hover:text-[#1D4E89] disabled:opacity-60 cursor-pointer"
                          title="Laporkan komentar tidak pantas"
                        >
                          <Flag className="w-3 h-3" />
                          <span>
                            {reportedIds.includes(c.id) ? 'Dilaporkan' : 'Laporkan'}
                          </span>
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
