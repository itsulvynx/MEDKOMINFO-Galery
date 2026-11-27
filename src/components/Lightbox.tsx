import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Stamp, X } from 'lucide-react';
import { Artwork } from '../types/gallery';
import { parseVideoSource } from '../utils/device';

const EMOJIS = ['😍', '🔥', '😂', '🥹', '👏'] as const;

interface LightboxProps {
  artworks: Artwork[];
  activeIndex: number;
  onClose: () => void;
  onChangeIndex: (newIndex: number) => void;
  onToggleStempel: (artworkId: number) => Promise<void>;
  onToggleReaction: (artworkId: number, emoji: string) => Promise<void>;
}

export function Lightbox({
  artworks,
  activeIndex,
  onClose,
  onChangeIndex,
  onToggleStempel,
  onToggleReaction,
}: LightboxProps) {
  const artwork = artworks[activeIndex];
  const touchStartX = useRef<number | null>(null);
  const [stampMsg, setStampMsg] = useState(false);

  const hasPrev = activeIndex > 0;
  const hasNext = activeIndex < artworks.length - 1;

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' && hasPrev) onChangeIndex(activeIndex - 1);
      if (e.key === 'ArrowRight' && hasNext) onChangeIndex(activeIndex + 1);
    };
    window.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [activeIndex, hasPrev, hasNext, onClose, onChangeIndex]);

  if (!artwork) return null;

  const videoInfo = artwork.mediaType === 'video' ? parseVideoSource(artwork.mediaUrl) : null;

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diff = e.changedTouches[0].clientX - touchStartX.current;
    if (diff > 55 && hasPrev) {
      onChangeIndex(activeIndex - 1);
    } else if (diff < -55 && hasNext) {
      onChangeIndex(activeIndex + 1);
    }
    touchStartX.current = null;
  };

  const handleStamp = async () => {
    if (!artwork.userLiked) {
      setStampMsg(true);
      setTimeout(() => setStampMsg(false), 1200);
    }
    await onToggleStempel(artwork.id);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={artwork.title}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="fixed inset-0 z-[100] bg-[#040E1A]/95 flex flex-col justify-between p-4 sm:p-6 md:p-8"
    >
      {/* Top Bar */}
      <div className="flex items-center justify-between gap-4 border-b border-[#F2EEE3]/15 pb-3">
        <div className="font-mono-catalog text-xs tracking-[0.16em] uppercase text-[#F2EEE3]/75 flex items-center gap-3">
          <span className="text-[#F2B35E]">{artwork.catalogNumber}</span>
          <span>·</span>
          <span>
            {activeIndex + 1} / {artworks.length}
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Tutup lightbox"
          className="inline-flex items-center gap-2 px-3 py-1.5 border border-[#F2EEE3]/30 text-[#F2EEE3] hover:border-[#F2B35E] hover:text-[#F2B35E] font-mono-catalog text-xs uppercase tracking-[0.14em] cursor-pointer min-h-[40px]"
        >
          <span>Tutup</span>
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Main Viewer Stage */}
      <div className="flex-1 min-h-0 my-4 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center max-w-[1360px] w-full mx-auto">
        {/* Media Column */}
        <div className="lg:col-span-8 h-full flex items-center justify-center relative min-h-[260px]">
          {hasPrev && (
            <button
              type="button"
              onClick={() => onChangeIndex(activeIndex - 1)}
              aria-label="Karya sebelumnya"
              className="hidden sm:flex absolute left-2 z-10 w-11 h-11 bg-[#07182B]/85 border border-[#F2EEE3]/30 items-center justify-center text-[#F2EEE3] hover:border-[#F2B35E] hover:text-[#F2B35E] cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}

          {artwork.mediaType === 'image' ? (
            <div className="passepartout-frame max-h-[65vh] lg:max-h-[74vh] flex items-center justify-center">
              <img
                src={artwork.mediaUrl}
                alt={artwork.title}
                referrerPolicy="no-referrer"
                className="max-h-[58vh] lg:max-h-[68vh] w-auto object-contain"
              />
            </div>
          ) : videoInfo?.kind === 'direct' ? (
            <div className="passepartout-frame w-full max-w-3xl">
              <video
                src={videoInfo.embedUrl}
                controls
                playsInline
                className="w-full aspect-video bg-black"
              />
            </div>
          ) : (
            <div className="passepartout-frame w-full max-w-3xl">
              <iframe
                src={videoInfo?.embedUrl}
                title={artwork.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full aspect-video bg-black border-0"
              />
            </div>
          )}

          {hasNext && (
            <button
              type="button"
              onClick={() => onChangeIndex(activeIndex + 1)}
              aria-label="Karya berikutnya"
              className="hidden sm:flex absolute right-2 z-10 w-11 h-11 bg-[#07182B]/85 border border-[#F2EEE3]/30 items-center justify-center text-[#F2EEE3] hover:border-[#F2B35E] hover:text-[#F2B35E] cursor-pointer"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Curatorial Plaque Column */}
        <div className="lg:col-span-4 bg-[#0B2A4A] border border-[#F2EEE3]/20 p-5 sm:p-6 flex flex-col gap-4 max-h-[74vh] overflow-y-auto">
          <div className="flex items-center justify-between font-mono-catalog text-[11px] uppercase tracking-[0.16em] text-[#F2B35E]">
            <span>{artwork.catalogNumber}</span>
            <span>{artwork.capturedDate}</span>
          </div>

          <h2 className="font-serif-editorial text-2xl sm:text-3xl text-[#F2EEE3] leading-tight">
            {artwork.title}
          </h2>

          <p className="text-sm text-[#F2EEE3]/85 leading-relaxed">{artwork.caption}</p>

          {artwork.curatorQuote && (
            <div className="p-3.5 bg-[#F2EEE3] text-[#07182B] border border-[#07182B]">
              <span className="font-mono-catalog text-[10px] uppercase tracking-[0.16em] text-[#1D4E89] block mb-1">
                Catatan Kurator
              </span>
              <p className="font-serif-editorial italic text-sm leading-relaxed">
                “{artwork.curatorQuote}”
              </p>
            </div>
          )}

          <div className="pt-3 border-t border-[#F2EEE3]/15 flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleStamp}
                className={`inline-flex items-center gap-2 px-4 py-2 font-mono-catalog text-xs uppercase tracking-[0.12em] border cursor-pointer transition-colors min-h-[42px] ${
                  artwork.userLiked
                    ? 'bg-[#F2B35E] text-[#07182B] border-[#F2B35E] font-medium'
                    : 'border-[#F2EEE3]/35 text-[#F2EEE3] hover:border-[#F2B35E] hover:text-[#F2B35E]'
                }`}
              >
                <Stamp className="w-4 h-4" />
                <span>{artwork.userLiked ? 'Distempel' : 'Beri Stempel'}</span>
                <span className="tabular-nums">· {artwork.likeCount || 0}</span>
              </button>
              {stampMsg && (
                <span className="font-mono-catalog text-xs text-[#F2B35E] animate-stempel">
                  Distempel! ✨
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {EMOJIS.map((emoji) => {
                const count = artwork.reactionCounts?.[emoji] || 0;
                const active = artwork.userReactions?.includes(emoji);
                return (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => onToggleReaction(artwork.id, emoji)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-sm border cursor-pointer min-h-[38px] ${
                      active
                        ? 'border-[#F2B35E] bg-[#1D4E89] text-[#F2EEE3]'
                        : 'border-[#F2EEE3]/20 text-[#F2EEE3]/85 hover:border-[#F2EEE3]/50'
                    }`}
                  >
                    <span>{emoji}</span>
                    <span className="font-mono-catalog text-xs tabular-nums">{count}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Mobile Prev/Next buttons */}
          <div className="flex sm:hidden items-center justify-between gap-3 pt-2 border-t border-[#F2EEE3]/15">
            <button
              type="button"
              disabled={!hasPrev}
              onClick={() => onChangeIndex(activeIndex - 1)}
              className="flex-1 py-2.5 border border-[#F2EEE3]/25 font-mono-catalog text-xs uppercase disabled:opacity-35"
            >
              ← Sebelumnya
            </button>
            <button
              type="button"
              disabled={!hasNext}
              onClick={() => onChangeIndex(activeIndex + 1)}
              className="flex-1 py-2.5 border border-[#F2EEE3]/25 font-mono-catalog text-xs uppercase disabled:opacity-35"
            >
              Berikutnya →
            </button>
          </div>
        </div>
      </div>

      <div className="text-center font-mono-catalog text-[10px] tracking-[0.16em] uppercase text-[#F2EEE3]/45 hidden sm:block">
        Gunakan tombol panah ← → untuk berpindah karya · ESC untuk menutup
      </div>
    </div>
  );
}
