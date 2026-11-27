import { useCallback, useEffect, useState } from 'react';
import { AmbientAudioControl } from './components/AmbientAudioControl';
import { Lightbox } from './components/Lightbox';
import { Navbar, PageRoute } from './components/Navbar';
import { AdminPage } from './pages/AdminPage';
import { DenahPage } from './pages/DenahPage';
import { LobiPage } from './pages/LobiPage';
import { RuangPamerPage } from './pages/RuangPamerPage';
import { TentangPage } from './pages/TentangPage';
import {
  Artwork,
  BacksoundConfig,
  ClosingData,
  GuestComment,
  Proker,
  QuoteItem,
  TeamMember,
} from './types/gallery';
import { museumAmbient } from './utils/ambientSound';
import { getDeviceId } from './utils/device';

export default function App() {
  const [page, setPage] = useState<PageRoute>('lobi');
  const [activeSlug, setActiveSlug] = useState<string>('');
  const [deviceId] = useState<string>(() => getDeviceId());

  // Lobi State
  const [visitorCount, setVisitorCount] = useState<number>(1);
  const [quotes, setQuotes] = useState<QuoteItem[]>([]);
  const [highlights, setHighlights] = useState<Artwork[]>([]);
  const [mostStamped, setMostStamped] = useState<Artwork[]>([]);
  const [stats, setStats] = useState({ prokerCount: 3, artworkCount: 9 });

  // Denah State
  const [prokers, setProkers] = useState<Proker[]>([]);
  const [loadingDenah, setLoadingDenah] = useState(false);

  // Ruang Pamer State
  const [roomProker, setRoomProker] = useState<Proker | null>(null);
  const [roomArtworks, setRoomArtworks] = useState<Artwork[]>([]);
  const [roomComments, setRoomComments] = useState<GuestComment[]>([]);
  const [loadingRoom, setLoadingRoom] = useState(false);

  // Tentang State
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [curatorPhotoUrl, setCuratorPhotoUrl] = useState<string>(
    '/src/assets/images/proker1_raker_1795774773977.jpg'
  );
  const [loadingAbout, setLoadingAbout] = useState(false);

  // Lightbox State
  const [lightboxItems, setLightboxItems] = useState<Artwork[] | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number>(0);

  // Ambient Sound & Epilogue State
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [backsound, setBacksound] = useState<BacksoundConfig>({
    mode: 'builtin',
    url: '',
    title: 'Piano Latar Museum',
  });
  const [closing, setClosing] = useState<ClosingData | null>(null);
  const [closingVideoPlaying, setClosingVideoPlaying] = useState(false);

  const isVideoLightboxOpen = Boolean(
    lightboxItems && lightboxItems[lightboxIndex]?.mediaType === 'video'
  );
  const isDucked = isVideoLightboxOpen || closingVideoPlaying;

  useEffect(() => {
    museumAmbient.setDucked(isDucked);
  }, [isDucked]);

  useEffect(() => {
    if (backsound.mode !== 'builtin') {
      museumAmbient.stop();
    } else if (audioPlaying) {
      museumAmbient.start();
    }
  }, [backsound.mode, audioPlaying]);

  useEffect(() => {
    return () => {
      museumAmbient.stop();
    };
  }, []);

  const handleToggleAudio = async () => {
    if (audioPlaying) {
      museumAmbient.stop();
      setAudioPlaying(false);
      try {
        localStorage.setItem('medkominfo_audio_muted', '1');
      } catch {
        // ignore storage errors
      }
    } else {
      if (backsound.mode === 'builtin') {
        const ok = await museumAmbient.start();
        if (!ok) return;
      }
      setAudioPlaying(true);
      try {
        localStorage.removeItem('medkominfo_audio_muted');
      } catch {
        // ignore
      }
    }
  };

  const maybeStartAmbientOnEnter = async () => {
    if (audioPlaying) return;
    try {
      if (localStorage.getItem('medkominfo_audio_muted') === '1') return;
    } catch {
      // ignore
    }
    if (backsound.mode === 'builtin') {
      const ok = await museumAmbient.start();
      if (ok) setAudioPlaying(true);
    } else {
      setAudioPlaying(true);
    }
  };

  const fetchLobi = useCallback(
    async (countVisit = false) => {
      try {
        const res = await fetch(`/api/lobi${countVisit ? '?visit=1' : ''}`, {
          headers: { 'x-device-id': deviceId },
        });
        if (!res.ok) return;
        const data = await res.json();
        setVisitorCount(data.visitorCount || 1);
        setQuotes(data.quotes || []);
        setHighlights(data.highlights || []);
        setMostStamped(data.mostStamped || []);
        setStats(data.stats || { prokerCount: 0, artworkCount: 0 });
        if (data.backsound) setBacksound(data.backsound);
        if ('closing' in data) setClosing(data.closing ?? null);
      } catch (err) {
        console.error('Error fetching lobi:', err);
      }
    },
    [deviceId]
  );

  const fetchDenah = useCallback(async () => {
    setLoadingDenah(true);
    try {
      const res = await fetch('/api/prokers', {
        headers: { 'x-device-id': deviceId },
      });
      if (!res.ok) return;
      const data = await res.json();
      setProkers(data.prokers || []);
      if ('closing' in data) setClosing(data.closing ?? null);
    } catch (err) {
      console.error('Error fetching denah:', err);
    } finally {
      setLoadingDenah(false);
    }
  }, [deviceId]);

  const fetchRoom = useCallback(
    async (slug: string) => {
      if (!slug) return;
      setLoadingRoom(true);
      try {
        const res = await fetch(`/api/prokers/${encodeURIComponent(slug)}`, {
          headers: { 'x-device-id': deviceId },
        });
        if (!res.ok) {
          setRoomProker(null);
          setRoomArtworks([]);
          setRoomComments([]);
          return;
        }
        const data = await res.json();
        setRoomProker(data.proker);
        setRoomArtworks(data.artworks || []);
        setRoomComments(data.comments || []);
      } catch (err) {
        console.error('Error fetching room:', err);
      } finally {
        setLoadingRoom(false);
      }
    },
    [deviceId]
  );

  const fetchAbout = useCallback(async () => {
    setLoadingAbout(true);
    try {
      const res = await fetch('/api/about');
      if (!res.ok) return;
      const data = await res.json();
      setMembers(data.members || []);
      if (data.curatorPhotoUrl) setCuratorPhotoUrl(data.curatorPhotoUrl);
      if ('closing' in data) setClosing(data.closing ?? null);
    } catch (err) {
      console.error('Error fetching about:', err);
    } finally {
      setLoadingAbout(false);
    }
  }, []);

  // Sync URL hash navigation
  const syncFromHash = useCallback(() => {
    const hash = window.location.hash.replace(/^#/, '');
    if (hash.startsWith('ruang/')) {
      const slug = hash.slice('ruang/'.length);
      setActiveSlug(slug);
      setPage('ruang');
    } else if (hash === 'ruang-pamer') {
      setPage('denah');
    } else if (hash === 'tentang') {
      setPage('tentang');
    } else if (hash === 'admin') {
      setPage('admin');
    } else {
      setPage('lobi');
    }
  }, []);

  useEffect(() => {
    syncFromHash();
    window.addEventListener('hashchange', syncFromHash);
    return () => window.removeEventListener('hashchange', syncFromHash);
  }, [syncFromHash]);

  // Initial Lobi load (increment visit ticket once per browser session)
  useEffect(() => {
    let shouldCount = false;
    try {
      if (!sessionStorage.getItem('medkominfo_visited')) {
        sessionStorage.setItem('medkominfo_visited', '1');
        shouldCount = true;
      }
    } catch {
      shouldCount = false;
    }
    fetchLobi(shouldCount);
  }, [fetchLobi]);

  useEffect(() => {
    if (page === 'denah') {
      fetchDenah();
    } else if (page === 'ruang' && activeSlug) {
      fetchRoom(activeSlug);
    } else if (page === 'tentang' && members.length === 0) {
      fetchAbout();
    }
  }, [page, activeSlug, fetchDenah, fetchRoom, fetchAbout, members.length]);

  const navigate = (target: PageRoute, slug?: string) => {
    setClosingVideoPlaying(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (target === 'ruang' && slug) {
      window.location.hash = `ruang/${slug}`;
      setActiveSlug(slug);
      setPage('ruang');
    } else if (target === 'denah') {
      window.location.hash = 'ruang-pamer';
      setPage('denah');
    } else if (target === 'tentang') {
      window.location.hash = 'tentang';
      setPage('tentang');
    } else if (target === 'admin') {
      window.location.hash = 'admin';
      setPage('admin');
    } else {
      window.location.hash = '';
      setPage('lobi');
    }
  };

  // Update artwork state helper across Lobi, Room, and Lightbox
  const updateArtworkLocally = (
    artworkId: number,
    updater: (art: Artwork) => Artwork
  ) => {
    setHighlights((prev) => prev.map((a) => (a.id === artworkId ? updater(a) : a)));
    setMostStamped((prev) => prev.map((a) => (a.id === artworkId ? updater(a) : a)));
    setRoomArtworks((prev) => prev.map((a) => (a.id === artworkId ? updater(a) : a)));
    setLightboxItems((prev) =>
      prev ? prev.map((a) => (a.id === artworkId ? updater(a) : a)) : null
    );
  };

  const handleToggleArtworkStamp = async (artworkId: number) => {
    try {
      const res = await fetch('/api/likes/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetType: 'artwork', targetId: artworkId, deviceId }),
      });
      if (!res.ok) return;
      const data = await res.json();
      updateArtworkLocally(artworkId, (art) => ({
        ...art,
        userLiked: data.liked,
        likeCount: data.count,
      }));
    } catch (err) {
      console.error('Stempel error:', err);
    }
  };

  const handleToggleProkerStamp = async (prokerId: number) => {
    try {
      const res = await fetch('/api/likes/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetType: 'proker', targetId: prokerId, deviceId }),
      });
      if (!res.ok) return;
      const data = await res.json();
      setProkers((prev) =>
        prev.map((p) =>
          p.id === prokerId ? { ...p, userLiked: data.liked, likeCount: data.count } : p
        )
      );
      setRoomProker((prev) =>
        prev && prev.id === prokerId
          ? { ...prev, userLiked: data.liked, likeCount: data.count }
          : prev
      );
    } catch (err) {
      console.error('Proker stempel error:', err);
    }
  };

  const handleToggleReaction = async (artworkId: number, emoji: string) => {
    try {
      const res = await fetch('/api/reactions/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ artworkId, emoji, deviceId }),
      });
      if (!res.ok) return;
      const data = await res.json();
      updateArtworkLocally(artworkId, (art) => ({
        ...art,
        reactionCounts: data.counts,
        userReactions: data.userReactions,
      }));
    } catch (err) {
      console.error('Reaction error:', err);
    }
  };

  const handleSubmitComment = async (payload: {
    prokerId: number;
    authorName: string;
    message: string;
    sticker: string;
    honeypot: string;
  }) => {
    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, deviceId }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { ok: false, error: data.error || 'Gagal mengirim kartu pos.' };
      }
      if (data.status === 'approved' && data.comment) {
        setRoomComments((prev) => [data.comment, ...prev]);
      }
      return { ok: true, notice: data.notice };
    } catch {
      return { ok: false, error: 'Koneksi bermasalah. Coba lagi sebentar ya.' };
    }
  };

  const handleReportComment = async (commentId: number) => {
    try {
      await fetch(`/api/comments/${commentId}/report`, { method: 'POST' });
    } catch (err) {
      console.error('Report error:', err);
    }
  };

  const handleRefreshAfterAdminChange = () => {
    fetchLobi(false);
    fetchDenah();
    fetchAbout();
    if (activeSlug) fetchRoom(activeSlug);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#07182B] text-[#F2EEE3] museum-grain museum-vignette relative">
      <Navbar currentPage={page} onNavigate={(target) => navigate(target)} />

      <main className="flex-1">
        {page === 'lobi' && (
          <LobiPage
            visitorCount={visitorCount}
            quotes={quotes}
            highlights={highlights}
            mostStamped={mostStamped}
            stats={stats}
            onEnterGallery={() => {
              maybeStartAmbientOnEnter();
              navigate('denah');
            }}
            onOpenRoom={(slug) => navigate('ruang', slug)}
            onOpenLightbox={(list, idx) => {
              setLightboxItems(list);
              setLightboxIndex(idx);
            }}
            onToggleStempel={handleToggleArtworkStamp}
            onToggleReaction={handleToggleReaction}
          />
        )}

        {page === 'denah' && (
          <DenahPage
            prokers={prokers}
            closing={closing}
            loading={loadingDenah}
            onSelectRoom={(slug) => navigate('ruang', slug)}
            onToggleProkerStamp={handleToggleProkerStamp}
            onVideoPlay={() => setClosingVideoPlaying(true)}
          />
        )}

        {page === 'ruang' && (
          <RuangPamerPage
            proker={roomProker}
            artworks={roomArtworks}
            comments={roomComments}
            loading={loadingRoom}
            onBackToDenah={() => navigate('denah')}
            onOpenLightbox={(idx) => {
              setLightboxItems(roomArtworks);
              setLightboxIndex(idx);
            }}
            onToggleArtworkStamp={handleToggleArtworkStamp}
            onToggleProkerStamp={handleToggleProkerStamp}
            onToggleReaction={handleToggleReaction}
            onSubmitComment={handleSubmitComment}
            onReportComment={handleReportComment}
          />
        )}

        {page === 'tentang' && (
          <TentangPage
            members={members}
            curatorPhotoUrl={curatorPhotoUrl}
            closing={closing}
            loading={loadingAbout}
            onVideoPlay={() => setClosingVideoPlaying(true)}
          />
        )}

        {page === 'admin' && (
          <AdminPage onDataChanged={handleRefreshAfterAdminChange} />
        )}
      </main>

      {/* Quiet Museum Colophon Footer */}
      <footer className="border-t border-[#F2EEE3]/15 bg-[#07182B] py-8 px-4 sm:px-8 lg:px-14">
        <div className="max-w-[1360px] mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img
              src="/assets/aistudio/Salinan_Logo_HIMATIF_4db90e2e.png"
              alt="Logo HIMATIF UNINUS"
              className="w-7 h-7 object-contain shrink-0"
            />
            <span className="font-serif-editorial text-sm text-[#F2EEE3]/80">
              MEDKOMINFO <span className="italic text-[#F2B35E]">Galery</span> — HIMATIF UNINUS 2026/2027
            </span>
          </div>
          <div className="flex items-center gap-6 font-mono-catalog text-[11px] uppercase tracking-[0.14em] text-[#F2EEE3]/55">
            <button
              type="button"
              onClick={() => navigate('lobi')}
              className="hover:text-[#F2B35E] cursor-pointer"
            >
              Lobi
            </button>
            <button
              type="button"
              onClick={() => navigate('denah')}
              className="hover:text-[#F2B35E] cursor-pointer"
            >
              Denah
            </button>
            <button
              type="button"
              onClick={() => navigate('tentang')}
              className="hover:text-[#F2B35E] cursor-pointer"
            >
              Tentang
            </button>
          </div>
        </div>
      </footer>

      {lightboxItems && (
        <Lightbox
          artworks={lightboxItems}
          activeIndex={lightboxIndex}
          onClose={() => setLightboxItems(null)}
          onChangeIndex={(idx) => setLightboxIndex(idx)}
          onToggleStempel={handleToggleArtworkStamp}
          onToggleReaction={handleToggleReaction}
        />
      )}

      <AmbientAudioControl
        isPlaying={audioPlaying}
        isDucked={isDucked}
        config={backsound}
        onToggle={handleToggleAudio}
      />
    </div>
  );
}
