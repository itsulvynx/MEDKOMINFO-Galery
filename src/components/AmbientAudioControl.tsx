import { useEffect, useRef } from 'react';
import { Music, Volume2, VolumeX } from 'lucide-react';
import { BacksoundConfig } from '../types/gallery';

interface AmbientAudioControlProps {
  isPlaying: boolean;
  isDucked: boolean;
  config: BacksoundConfig;
  onToggle: () => void;
}

function extractYouTubeId(url: string): string | null {
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{6,})/
  );
  return match?.[1] || null;
}

export function AmbientAudioControl({
  isPlaying,
  isDucked,
  config,
  onToggle,
}: AmbientAudioControlProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const ytIframeRef = useRef<HTMLIFrameElement | null>(null);

  const ytId = config.mode === 'youtube' ? extractYouTubeId(config.url) : null;

  // Manage HTML5 <audio> playback for uploaded MP3/OGG/M4A
  useEffect(() => {
    const el = audioRef.current;
    if (!el || config.mode !== 'audio' || !config.url) return;

    el.volume = isDucked ? 0.08 : 0.45;
    if (isPlaying) {
      el.play().catch(() => {
        // Autoplay blocked until next click
      });
    } else {
      el.pause();
    }
  }, [isPlaying, isDucked, config.mode, config.url]);

  // Manage YouTube hidden iframe via postMessage API
  useEffect(() => {
    const iframe = ytIframeRef.current;
    if (!iframe?.contentWindow || config.mode !== 'youtube' || !ytId) return;

    const sendCommand = (func: string, args: unknown[] = []) => {
      iframe.contentWindow?.postMessage(
        JSON.stringify({ event: 'command', func, args }),
        '*'
      );
    };

    if (isPlaying) {
      sendCommand('setVolume', [isDucked ? 10 : 48]);
      sendCommand('playVideo');
    } else {
      sendCommand('pauseVideo');
    }
  }, [isPlaying, isDucked, config.mode, ytId]);

  const statusText = isPlaying
    ? isDucked
      ? 'Diredam'
      : config.title || 'Mengalun'
    : 'Hening';

  return (
    <>
      {/* Hidden Audio Element for uploaded MP3/M4A/OGG */}
      {config.mode === 'audio' && config.url && (
        <audio ref={audioRef} src={config.url} loop preload="none" />
      )}

      {/* Hidden YouTube Player for YouTube Piano Cover Links */}
      {config.mode === 'youtube' && ytId && isPlaying && (
        <iframe
          ref={ytIframeRef}
          title={config.title || 'Backsound Museum'}
          src={`https://www.youtube-nocookie.com/embed/${ytId}?autoplay=1&loop=1&playlist=${ytId}&enablejsapi=1&controls=0`}
          allow="autoplay; encrypted-media"
          className="fixed bottom-0 left-0 w-1 h-1 opacity-0 pointer-events-none border-0"
        />
      )}

      <button
        type="button"
        onClick={onToggle}
        aria-label={isPlaying ? 'Matikan musik latar museum' : 'Putar musik latar museum'}
        className={`fixed bottom-4 left-4 z-40 inline-flex items-center gap-2.5 px-3.5 py-2 border transition-colors cursor-pointer shadow-lg min-h-[40px] max-w-[260px] ${
          isPlaying
            ? 'bg-[#0B2A4A] border-[#F2B35E]/70 text-[#F2EEE3] hover:border-[#F2B35E]'
            : 'bg-[#07182B]/95 border-[#F2EEE3]/25 text-[#F2EEE3]/75 hover:border-[#F2B35E] hover:text-[#F2EEE3]'
        }`}
      >
        {isPlaying ? (
          config.mode === 'builtin' ? (
            <Volume2 className="w-3.5 h-3.5 text-[#F2B35E] shrink-0" />
          ) : (
            <Music className="w-3.5 h-3.5 text-[#F2B35E] shrink-0" />
          )
        ) : (
          <VolumeX className="w-3.5 h-3.5 shrink-0" />
        )}
        <span className="font-mono-catalog text-[10px] uppercase tracking-[0.14em] truncate">
          {isPlaying ? statusText : 'Suara Galeri · Hening'}
        </span>
      </button>
    </>
  );
}
