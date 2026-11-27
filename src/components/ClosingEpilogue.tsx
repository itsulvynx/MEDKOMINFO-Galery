import { useState } from 'react';
import { Film, ImageOff, Play } from 'lucide-react';
import { ClosingData } from '../types/gallery';
import { parseVideoSource } from '../utils/device';

interface ClosingEpilogueProps {
  closing: ClosingData | null;
  onVideoPlay?: () => void;
}

export function ClosingEpilogue({ closing, onVideoPlay }: ClosingEpilogueProps) {
  const [imgError, setImgError] = useState(false);
  const [playVideo, setPlayVideo] = useState(false);

  if (!closing || !closing.visible) return null;

  const videoInfo = closing.videoUrl ? parseVideoSource(closing.videoUrl) : null;

  return (
    <section className="mt-20 pt-16 border-t border-[#F2EEE3]/20">
      {/* Header */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-end mb-12">
        <div className="lg:col-span-8">
          <span className="font-mono-catalog text-xs tracking-[0.22em] uppercase text-[#F2B35E] block mb-2">
            Ruang Penutup · Epilog 2026/2027
          </span>
          <h2 className="font-serif-editorial text-3xl sm:text-5xl text-[#F2EEE3] tracking-tight [text-wrap:balance]">
            {closing.title}
          </h2>
        </div>
        <div className="lg:col-span-4 text-sm text-[#F2EEE3]/70 font-serif-editorial italic">
          {closing.subtitle}
        </div>
      </div>

      {/* Main Layout: Foto Bersama + Video Perjalanan */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
        {/* Foto Bersama Penutup */}
        <div className="lg:col-span-7 flex flex-col gap-3">
          <div className="group passepartout-frame">
            <div className="cyanotype-photo-wrap aspect-[16/9] w-full">
              {closing.photoUrl && !imgError ? (
                <img
                  src={closing.photoUrl}
                  alt={closing.photoCaption || 'Foto bersama penutup periode'}
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  onError={() => setImgError(true)}
                  className="cyanotype-photo-img w-full h-full object-cover group-hover:scale-[1.02]"
                />
              ) : (
                <div className="w-full h-full bg-[#0B2A4A] flex flex-col items-center justify-center p-6 text-center">
                  <ImageOff className="w-8 h-8 text-[#F2EEE3]/40 mb-2" />
                  <span className="font-serif-editorial text-sm text-[#F2EEE3]/70">
                    Foto Bersama Penutup
                  </span>
                </div>
              )}
              <div className="cyanotype-tint-layer" />
              <div className="cyanotype-deep-layer" />
            </div>
            <div className="pt-3 flex items-center justify-between gap-2 font-mono-catalog text-[10px] uppercase tracking-[0.14em] text-[#07182B]">
              <span>POTRET BERSAMA · AKHIR PERIODE</span>
              <span className="text-[#07182B]/65">2026 / 2027</span>
            </div>
          </div>
          {closing.photoCaption && (
            <p className="text-sm text-[#F2EEE3]/75 leading-relaxed px-0.5">
              {closing.photoCaption}
            </p>
          )}
        </div>

        {/* Video Perjalanan Kita */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          {closing.videoUrl && videoInfo && (
            <div className="passepartout-frame">
              <div className="aspect-video w-full bg-[#07182B] relative overflow-hidden">
                {!playVideo ? (
                  <button
                    type="button"
                    onClick={() => {
                      setPlayVideo(true);
                      onVideoPlay?.();
                    }}
                    className="group w-full h-full relative flex flex-col items-center justify-center p-6 text-center cursor-pointer"
                  >
                    {closing.photoUrl && !imgError && (
                      <img
                        src={closing.photoUrl}
                        alt={closing.videoTitle}
                        className="absolute inset-0 w-full h-full object-cover opacity-35 grayscale"
                      />
                    )}
                    <div className="relative z-10 w-14 h-14 bg-[#F2B35E] text-[#07182B] flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                      <Play className="w-6 h-6 fill-current ml-0.5" />
                    </div>
                    <span className="relative z-10 font-mono-catalog text-[11px] uppercase tracking-[0.16em] text-[#F2EEE3]">
                      Putar Video Perjalanan
                    </span>
                  </button>
                ) : videoInfo.kind === 'direct' ? (
                  <video
                    src={videoInfo.embedUrl}
                    controls
                    autoPlay
                    playsInline
                    className="w-full h-full bg-black"
                  />
                ) : (
                  <iframe
                    src={videoInfo.embedUrl}
                    title={closing.videoTitle || 'Video Perjalanan Kita'}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full border-0 bg-black"
                  />
                )}
              </div>
              <div className="pt-3 flex items-center justify-between gap-2 font-mono-catalog text-[10px] uppercase tracking-[0.14em] text-[#07182B]">
                <span className="inline-flex items-center gap-1.5 truncate">
                  <Film className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{closing.videoTitle || 'Film Perjalanan'}</span>
                </span>
                <span className="text-[#07182B]/65 shrink-0">ARSIP FILM</span>
              </div>
            </div>
          )}

          {/* Kata-Kata Manis Penutup */}
          {closing.message && (
            <div className="bg-[#F2EEE3] text-[#07182B] p-6 sm:p-8 border border-[#F2EEE3] shadow-xl flex flex-col gap-4">
              <span className="font-mono-catalog text-[10px] uppercase tracking-[0.18em] text-[#1D4E89] border-b border-[#07182B]/15 pb-2">
                Surat Penutup Kurator
              </span>
              <p className="font-serif-editorial italic text-lg sm:text-xl leading-relaxed text-[#07182B]">
                “{closing.message}”
              </p>
              <div className="font-mono-catalog text-[11px] uppercase tracking-[0.14em] text-[#07182B]/70 pt-1">
                — Medkominfo HIMATIF 2026/2027
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
