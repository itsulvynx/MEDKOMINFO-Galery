import { useState } from 'react';
import { Play, Stamp, ImageOff } from 'lucide-react';
import { Artwork } from '../types/gallery';

const EMOJIS = ['😍', '🔥', '😂', '🥹', '👏'] as const;

interface ArtworkFrameProps {
  artwork: Artwork;
  onOpen: (artwork: Artwork) => void;
  onToggleStempel: (artworkId: number) => Promise<void>;
  onToggleReaction: (artworkId: number, emoji: string) => Promise<void>;
  showCuratorQuote?: boolean;
  compact?: boolean;
}

export function ArtworkFrame({
  artwork,
  onOpen,
  onToggleStempel,
  onToggleReaction,
  showCuratorQuote = true,
  compact = false,
}: ArtworkFrameProps) {
  const [imgError, setImgError] = useState(false);
  const [stampAnim, setStampAnim] = useState(false);
  const [floatingEmoji, setFloatingEmoji] = useState<{ id: number; emoji: string } | null>(null);
  const [lastTapTime, setLastTapTime] = useState(0);

  const previewSrc =
    artwork.mediaType === 'video'
      ? artwork.thumbnailUrl || '/src/assets/images/proker1_pelantikan_1795774774073.jpg'
      : artwork.mediaUrl;

  const handleStampClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!artwork.userLiked) {
      setStampAnim(true);
      setTimeout(() => setStampAnim(false), 1200);
    }
    await onToggleStempel(artwork.id);
  };

  const handleEmojiClick = async (e: React.MouseEvent, emoji: string) => {
    e.stopPropagation();
    setFloatingEmoji({ id: Date.now(), emoji });
    setTimeout(() => setFloatingEmoji(null), 650);
    await onToggleReaction(artwork.id, emoji);
  };

  const handleTouchEnd = () => {
    const now = Date.now();
    if (now - lastTapTime < 350) {
      setLastTapTime(0);
      onOpen(artwork);
    } else {
      setLastTapTime(now);
    }
  };

  return (
    <article className="flex flex-col gap-3">
      {/* Passepartout Framed Media (Klik 2x untuk memperbesar) */}
      <div
        role="button"
        tabIndex={0}
        title="Klik 2 kali untuk memperbesar"
        onDoubleClick={() => onOpen(artwork)}
        onTouchEnd={handleTouchEnd}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onOpen(artwork);
          }
        }}
        className="group passepartout-frame cursor-pointer touch-manipulation text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F2B35E] transition-transform duration-300 hover:-translate-y-0.5"
      >
        <div
          className={`cyanotype-photo-wrap w-full ${
            artwork.aspectRatio === '3:4'
              ? 'aspect-[3/4]'
              : artwork.aspectRatio === '1:1'
              ? 'aspect-square'
              : artwork.aspectRatio === '16:9'
              ? 'aspect-video'
              : 'aspect-[4/3]'
          }`}
        >
          {!imgError ? (
            <img
              src={previewSrc}
              alt={artwork.title}
              loading="lazy"
              referrerPolicy="no-referrer"
              onError={() => setImgError(true)}
              className="cyanotype-photo-img w-full h-full object-cover group-hover:scale-[1.03]"
            />
          ) : (
            <div className="w-full h-full bg-[#0B2A4A] flex flex-col items-center justify-center p-6 text-center border border-[#F2EEE3]/15">
              <ImageOff className="w-7 h-7 text-[#F2EEE3]/40 mb-2" />
              <span className="font-serif-editorial text-sm text-[#F2EEE3]/75">
                {artwork.title}
              </span>
            </div>
          )}

          {/* Cyanotype Duotone Layers */}
          <div className="cyanotype-tint-layer" />
          <div className="cyanotype-deep-layer" />

          {/* Minimalist Play Indicator for Video */}
          {artwork.mediaType === 'video' && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-12 h-12 bg-[#07182B]/85 border border-[#F2EEE3]/80 flex items-center justify-center text-[#F2B35E] group-hover:bg-[#F2B35E] group-hover:text-[#07182B] transition-colors duration-200">
                <Play className="w-5 h-5 fill-current ml-0.5" />
              </div>
            </div>
          )}

          {/* Stamp Pop Feedback */}
          {stampAnim && (
            <div className="absolute top-3 right-3 px-2.5 py-1 bg-[#F2B35E] text-[#07182B] border border-[#07182B] font-mono-catalog text-[10px] tracking-[0.12em] uppercase animate-stempel pointer-events-none shadow-md">
              Distempel! ✨
            </div>
          )}
        </div>

        {/* Cream Matte Bottom Plaque Line */}
        <div className="pt-3 flex items-center justify-between gap-2 text-[#07182B] font-mono-catalog text-[10px] tracking-[0.14em] uppercase">
          <span className="truncate">{artwork.catalogNumber}</span>
          <span className="text-[#07182B]/65 shrink-0">
            {artwork.mediaType === 'video' ? 'FILM · ' : ''}
            {artwork.capturedDate}
          </span>
        </div>
      </div>

      {/* Caption & Museum Metadata below frame */}
      <div className="flex flex-col gap-2 px-0.5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-serif-editorial text-lg leading-snug text-[#F2EEE3]">
            {artwork.title}
          </h3>
        </div>

        {!compact && (
          <p className="text-sm text-[#F2EEE3]/75 leading-relaxed line-clamp-3">
            {artwork.caption}
          </p>
        )}

        {/* Kata Kurator mini plaque */}
        {showCuratorQuote && artwork.curatorQuote && (
          <div className="mt-1 px-3 py-2.5 border border-[#F2EEE3]/18 bg-[#0B2A4A]/70 text-xs text-[#F2EEE3]/85 leading-relaxed">
            <span className="font-mono-catalog text-[10px] tracking-[0.16em] uppercase text-[#F2B35E] block mb-1">
              Kata Kurator
            </span>
            <span className="italic font-serif-editorial text-[13px]">
              “{artwork.curatorQuote}”
            </span>
          </div>
        )}

        {/* Interactive Stempel & Emoji Reactions */}
        <div className="pt-2 border-t border-[#F2EEE3]/12 flex flex-wrap items-center justify-between gap-2 relative">
          <button
            type="button"
            onClick={handleStampClick}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 font-mono-catalog text-[11px] border transition-colors cursor-pointer min-h-[36px] ${
              artwork.userLiked
                ? 'bg-[#F2B35E] text-[#07182B] border-[#F2B35E] font-medium'
                : 'border-[#F2EEE3]/25 text-[#F2EEE3]/85 hover:border-[#F2B35E] hover:text-[#F2B35E]'
            }`}
            title={artwork.userLiked ? 'Batalkan stempel' : 'Beri stempel karya'}
          >
            <Stamp className="w-3.5 h-3.5" />
            <span>{artwork.userLiked ? 'Distempel' : 'Stempel'}</span>
            <span className="tabular-nums opacity-80">· {artwork.likeCount || 0}</span>
          </button>

          {!compact && (
            <div className="flex items-center gap-1 relative">
              {floatingEmoji && (
                <span
                  key={floatingEmoji.id}
                  className="absolute -top-6 right-4 text-lg pointer-events-none animate-emoji-float"
                >
                  {floatingEmoji.emoji}
                </span>
              )}
              {EMOJIS.map((emoji) => {
                const count = artwork.reactionCounts?.[emoji] || 0;
                const active = artwork.userReactions?.includes(emoji);
                return (
                  <button
                    key={emoji}
                    type="button"
                    onClick={(e) => handleEmojiClick(e, emoji)}
                    className={`inline-flex items-center gap-1 px-1.5 py-1 text-xs border transition-colors cursor-pointer min-h-[32px] ${
                      active
                        ? 'border-[#F2B35E] bg-[#1D4E89]/60 text-[#F2EEE3]'
                        : 'border-transparent hover:border-[#F2EEE3]/20 text-[#F2EEE3]/75'
                    }`}
                  >
                    <span>{emoji}</span>
                    {count > 0 && (
                      <span className="font-mono-catalog text-[10px] tabular-nums">
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
