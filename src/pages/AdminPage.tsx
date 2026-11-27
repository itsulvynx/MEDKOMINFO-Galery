import { useCallback, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import {
  Check,
  Eye,
  EyeOff,
  Film,
  GripVertical,
  ImagePlus,
  LogOut,
  Music,
  Plus,
  ShieldAlert,
  Star,
  Trash2,
  Upload,
  Users,
  X,
} from 'lucide-react';
import { auth, googleAuthProvider } from '../lib/firebase';
import {
  AdminUser,
  Artwork,
  GuestComment,
  Proker,
  QuoteItem,
  TeamMember,
  WhitelistEntry,
} from '../types/gallery';
import { compressImageFile, formatIndonesianDate } from '../utils/device';

type AdminTab =
  | 'proker'
  | 'karya'
  | 'pengurus'
  | 'penutup'
  | 'moderasi'
  | 'quote'
  | 'whitelist';

interface AdminPageProps {
  onDataChanged: () => void;
}

export function AdminPage({ onDataChanged }: AdminPageProps) {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [idToken, setIdToken] = useState<string | null>(null);

  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(false);

  const [activeTab, setActiveTab] = useState<AdminTab>('proker');
  const [loadingOverview, setLoadingOverview] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Overview Data
  const [prokers, setProkers] = useState<Proker[]>([]);
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [comments, setComments] = useState<GuestComment[]>([]);
  const [quotes, setQuotes] = useState<QuoteItem[]>([]);
  const [whitelist, setWhitelist] = useState<WhitelistEntry[]>([]);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [autoApprove, setAutoApprove] = useState(false);

  // Backsound & Closing Settings State
  const [backsoundMode, setBacksoundMode] = useState<'builtin' | 'youtube' | 'audio'>('builtin');
  const [backsoundUrl, setBacksoundUrl] = useState('');
  const [backsoundTitle, setBacksoundTitle] = useState('');
  const [uploadingAudio, setUploadingAudio] = useState(false);

  const [closingVisible, setClosingVisible] = useState(true);
  const [closingTitle, setClosingTitle] = useState('');
  const [closingSubtitle, setClosingSubtitle] = useState('');
  const [closingPhotoUrl, setClosingPhotoUrl] = useState('');
  const [closingPhotoCaption, setClosingPhotoCaption] = useState('');
  const [closingVideoUrl, setClosingVideoUrl] = useState('');
  const [closingVideoTitle, setClosingVideoTitle] = useState('');
  const [closingMessage, setClosingMessage] = useState('');
  const [uploadingClosingPhoto, setUploadingClosingPhoto] = useState(false);
  const [curatorPhotoUrl, setCuratorPhotoUrl] = useState('');
  const [uploadingCuratorPhoto, setUploadingCuratorPhoto] = useState(false);

  // Team Member Form State
  const [showMemberForm, setShowMemberForm] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [mName, setMName] = useState('');
  const [mRole, setMRole] = useState('');
  const [mDivision, setMDivision] = useState('');
  const [mPhotoUrl, setMPhotoUrl] = useState('');
  const [mIsLeader, setMIsLeader] = useState(false);
  const [mQuote, setMQuote] = useState('');
  const [uploadingMemberPhoto, setUploadingMemberPhoto] = useState(false);
  const [draggedMemberId, setDraggedMemberId] = useState<number | null>(null);

  // Proker Form State
  const [editingProker, setEditingProker] = useState<Proker | null>(null);
  const [showProkerForm, setShowProkerForm] = useState(false);
  const [pRoomNumber, setPRoomNumber] = useState('');
  const [pTitle, setPTitle] = useState('');
  const [pSubtitle, setPSubtitle] = useState('');
  const [pDate, setPDate] = useState('');
  const [pDesc, setPDesc] = useState('');
  const [pCuratorNote, setPCuratorNote] = useState('');
  const [pClosingNote, setPClosingNote] = useState('');
  const [pCoverUrl, setPCoverUrl] = useState('');
  const [uploadingCover, setUploadingCover] = useState(false);

  // Artwork Form State
  const [selectedProkerId, setSelectedProkerId] = useState<number>(0);
  const [showArtworkForm, setShowArtworkForm] = useState(false);
  const [editingArtwork, setEditingArtwork] = useState<Artwork | null>(null);
  const [aMediaType, setAMediaType] = useState<'image' | 'video'>('image');
  const [aMediaUrl, setAMediaUrl] = useState('');
  const [aThumbUrl, setAThumbUrl] = useState('');
  const [aTitle, setATitle] = useState('');
  const [aCaption, setACaption] = useState('');
  const [aCuratorQuote, setACuratorQuote] = useState('');
  const [aDate, setADate] = useState('');
  const [aCatalogNo, setACatalogNo] = useState('');
  const [aAspectRatio, setAAspectRatio] = useState('4:3');
  const [aHighlight, setAHighlight] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [compressionNote, setCompressionNote] = useState<string | null>(null);

  // Drag & Drop IDs
  const [draggedProkerId, setDraggedProkerId] = useState<number | null>(null);
  const [draggedArtworkId, setDraggedArtworkId] = useState<number | null>(null);

  // Moderation Filter
  const [commentFilter, setCommentFilter] = useState<
    'all' | 'pending' | 'approved' | 'rejected' | 'reported'
  >('pending');

  // Quote Form
  const [qText, setQText] = useState('');
  const [qAuthor, setQAuthor] = useState('');

  // Whitelist Form
  const [wEmail, setWEmail] = useState('');
  const [wRole, setWRole] = useState<'admin' | 'super_admin'>('admin');

  const notify = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3200);
  };

  const fetchOverview = useCallback(async (token: string) => {
    setLoadingOverview(true);
    try {
      const res = await fetch('/api/admin/overview', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Gagal memuat data admin.');
      const data = await res.json();
      setProkers(data.prokers || []);
      setArtworks(data.artworks || []);
      setComments(data.comments || []);
      setQuotes(data.quotes || []);
      setWhitelist(data.whitelist || []);
      setMembers(data.members || []);
      const s = data.settings || {};
      setAutoApprove(s.guestbook_auto_approve === 'true');
      setBacksoundMode(
        (s.backsound_mode as 'builtin' | 'youtube' | 'audio') || 'builtin'
      );
      setBacksoundUrl(s.backsound_url || '');
      setBacksoundTitle(s.backsound_title || 'Piano Latar Museum');
      setClosingVisible(s.closing_visible !== 'false');
      setClosingTitle(s.closing_title || 'Epilog Kabinet · Kisah Perjalanan Kita');
      setClosingSubtitle(
        s.closing_subtitle || 'Foto Bersama & Film Penutup Periode 2026/2027'
      );
      setClosingPhotoUrl(s.closing_photo_url || '');
      setClosingPhotoCaption(s.closing_photo_caption || '');
      setClosingVideoUrl(s.closing_video_url || '');
      setClosingVideoTitle(s.closing_video_title || '');
      setClosingMessage(s.closing_message || '');
      setCuratorPhotoUrl(
        s.curator_photo_url || '/src/assets/images/proker1_raker_1795774773977.jpg'
      );
      if (data.prokers?.length > 0) {
        setSelectedProkerId((prev) =>
          prev && data.prokers.some((p: Proker) => p.id === prev)
            ? prev
            : data.prokers[0].id
        );
      }
    } catch (err) {
      console.error(err);
      notify('Terjadi kesalahan saat memuat data kurator.');
    } finally {
      setLoadingOverview(false);
    }
  }, []);

  const verifySession = useCallback(
    async (user: User) => {
      setCheckingAuth(true);
      setAuthError(null);
      try {
        const token = await user.getIdToken(true);
        setIdToken(token);
        const res = await fetch('/api/admin/me', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!res.ok) {
          setAdminUser(null);
          setAuthError(
            data.error ||
              'Maaf, email Anda tidak terdaftar sebagai kurator Medkominfo HIMATIF.'
          );
          return;
        }
        setAdminUser(data);
        await fetchOverview(token);
      } catch (err) {
        console.error(err);
        setAdminUser(null);
        setAuthError('Gagal memverifikasi akun Google Anda.');
      } finally {
        setCheckingAuth(false);
      }
    },
    [fetchOverview]
  );

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      setAuthReady(true);
      if (user) {
        verifySession(user);
      } else {
        setIdToken(null);
        setAdminUser(null);
        setAuthError(null);
      }
    });
    return () => unsub();
  }, [verifySession]);

  const handleGoogleSignIn = async () => {
    setAuthError(null);
    try {
      await signInWithPopup(auth, googleAuthProvider);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Login dibatalkan.';
      setAuthError(`Gagal masuk dengan Google: ${msg}`);
    }
  };

  const handleSignOut = async () => {
    await signOut(auth);
    setIdToken(null);
    setAdminUser(null);
    setAuthError(null);
  };

  const authFetch = async (url: string, options: RequestInit = {}) => {
    if (!firebaseUser) throw new Error('Belum login');
    const freshToken = await firebaseUser.getIdToken();
    setIdToken(freshToken);
    return fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
        Authorization: `Bearer ${freshToken}`,
      },
    });
  };

  // Upload image helper (with automatic Canvas compression!)
  const handleCompressedImageUpload = async (
    file: File,
    onSuccess: (url: string, note: string) => void,
    setBusy: (b: boolean) => void
  ) => {
    setBusy(true);
    try {
      const origKB = Math.round(file.size / 1024);
      const compressed = await compressImageFile(file);
      const compKB = Math.round(compressed.sizeBytes / 1024);

      const res = await authFetch('/api/admin/upload', {
        method: 'POST',
        body: JSON.stringify({
          mimeType: compressed.mimeType,
          dataBase64: compressed.dataBase64,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal mengunggah gambar');

      onSuccess(
        data.url,
        `Dikompresi otomatis: ${origKB} KB → ${compKB} KB`
      );
    } catch (err: unknown) {
      notify(err instanceof Error ? err.message : 'Gagal mengunggah foto');
    } finally {
      setBusy(false);
    }
  };

  // Proker CRUD Handlers
  const openCreateProker = () => {
    setEditingProker(null);
    setPRoomNumber(`RUANG ${String(prokers.length + 1).padStart(2, '0')}`);
    setPTitle('');
    setPSubtitle('');
    setPDate('');
    setPDesc('');
    setPCuratorNote('');
    setPClosingNote('');
    setPCoverUrl('');
    setShowProkerForm(true);
  };

  const openEditProker = (p: Proker) => {
    setEditingProker(p);
    setPRoomNumber(p.roomNumber);
    setPTitle(p.title);
    setPSubtitle(p.subtitle || '');
    setPDate(p.eventDate);
    setPDesc(p.description);
    setPCuratorNote(p.curatorNote || '');
    setPClosingNote(p.closingNote || '');
    setPCoverUrl(p.coverUrl);
    setShowProkerForm(true);
  };

  const handleSaveProker = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        roomNumber: pRoomNumber,
        title: pTitle,
        subtitle: pSubtitle,
        eventDate: pDate,
        description: pDesc,
        curatorNote: pCuratorNote,
        closingNote: pClosingNote,
        coverUrl: pCoverUrl,
      };
      const res = editingProker
        ? await authFetch(`/api/admin/prokers/${editingProker.id}`, {
            method: 'PATCH',
            body: JSON.stringify(payload),
          })
        : await authFetch('/api/admin/prokers', {
            method: 'POST',
            body: JSON.stringify(payload),
          });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menyimpan proker');

      setShowProkerForm(false);
      if (idToken) await fetchOverview(idToken);
      onDataChanged();
      notify(editingProker ? 'Proker diperbarui!' : 'Ruang pamer baru ditambahkan!');
    } catch (err: unknown) {
      notify(err instanceof Error ? err.message : 'Gagal menyimpan proker');
    }
  };

  const handleToggleProkerVisibility = async (p: Proker) => {
    try {
      const res = await authFetch(`/api/admin/prokers/${p.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ isVisible: !p.isVisible }),
      });
      if (!res.ok) throw new Error('Gagal mengubah visibilitas');
      if (idToken) await fetchOverview(idToken);
      onDataChanged();
      notify(p.isVisible ? 'Ruang disembunyikan dari pengunjung.' : 'Ruang ditampilkan kembali.');
    } catch (err: unknown) {
      notify(err instanceof Error ? err.message : 'Gagal mengubah status');
    }
  };

  const handleDeleteProker = async (p: Proker) => {
    try {
      const res = await authFetch(`/api/admin/prokers/${p.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Gagal menghapus proker');
      if (idToken) await fetchOverview(idToken);
      onDataChanged();
      notify(`Ruang "${p.title}" dihapus.`);
    } catch (err: unknown) {
      notify(err instanceof Error ? err.message : 'Gagal menghapus');
    }
  };

  // Drag & Drop Proker Reorder
  const handleProkerDrop = async (targetId: number) => {
    if (!draggedProkerId || draggedProkerId === targetId) return;
    const list = [...prokers];
    const fromIdx = list.findIndex((p) => p.id === draggedProkerId);
    const toIdx = list.findIndex((p) => p.id === targetId);
    if (fromIdx < 0 || toIdx < 0) return;

    const [moved] = list.splice(fromIdx, 1);
    list.splice(toIdx, 0, moved);
    setProkers(list);
    setDraggedProkerId(null);

    await authFetch('/api/admin/prokers/reorder', {
      method: 'POST',
      body: JSON.stringify({ orderedIds: list.map((p) => p.id) }),
    });
    onDataChanged();
    notify('Urutan ruang pamer diperbarui.');
  };

  // Artwork CRUD Handlers
  const roomArtworks = artworks.filter((a) => a.prokerId === selectedProkerId);

  const openCreateArtwork = () => {
    setEditingArtwork(null);
    setAMediaType('image');
    setAMediaUrl('');
    setAThumbUrl('');
    setATitle('');
    setACaption('');
    setACuratorQuote('');
    setADate('');
    setACatalogNo(
      `KAT. ${String(selectedProkerId).padStart(2, '0')}-${String.fromCharCode(
        65 + (roomArtworks.length % 26)
      )}`
    );
    setAAspectRatio('4:3');
    setAHighlight(false);
    setCompressionNote(null);
    setShowArtworkForm(true);
  };

  const openEditArtwork = (art: Artwork) => {
    setEditingArtwork(art);
    setAMediaType(art.mediaType);
    setAMediaUrl(art.mediaUrl);
    setAThumbUrl(art.thumbnailUrl || '');
    setATitle(art.title);
    setACaption(art.caption);
    setACuratorQuote(art.curatorQuote || '');
    setADate(art.capturedDate);
    setACatalogNo(art.catalogNumber);
    setAAspectRatio(art.aspectRatio);
    setAHighlight(art.isHighlight);
    setCompressionNote(null);
    setShowArtworkForm(true);
  };

  const handleSaveArtwork = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        prokerId: selectedProkerId,
        catalogNumber: aCatalogNo,
        mediaType: aMediaType,
        mediaUrl: aMediaUrl,
        thumbnailUrl: aMediaType === 'video' ? aThumbUrl : null,
        title: aTitle,
        caption: aCaption,
        curatorQuote: aCuratorQuote,
        capturedDate: aDate,
        aspectRatio: aAspectRatio,
        isHighlight: aHighlight,
      };
      const res = editingArtwork
        ? await authFetch(`/api/admin/artworks/${editingArtwork.id}`, {
            method: 'PATCH',
            body: JSON.stringify(payload),
          })
        : await authFetch('/api/admin/artworks', {
            method: 'POST',
            body: JSON.stringify(payload),
          });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menyimpan karya');

      setShowArtworkForm(false);
      if (idToken) await fetchOverview(idToken);
      onDataChanged();
      notify(editingArtwork ? 'Karya diperbarui!' : 'Karya baru berhasil digantung di dinding!');
    } catch (err: unknown) {
      notify(err instanceof Error ? err.message : 'Gagal menyimpan karya');
    }
  };

  const handleToggleHighlight = async (art: Artwork) => {
    try {
      const res = await authFetch(`/api/admin/artworks/${art.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ isHighlight: !art.isHighlight }),
      });
      if (!res.ok) throw new Error('Gagal mengubah status highlight');
      if (idToken) await fetchOverview(idToken);
      onDataChanged();
      notify(art.isHighlight ? 'Dihapus dari Karya Pilihan Lobi.' : 'Ditandai sebagai Karya Pilihan Lobi!');
    } catch (err: unknown) {
      notify(err instanceof Error ? err.message : 'Gagal memperbarui');
    }
  };

  const handleDeleteArtwork = async (art: Artwork) => {
    try {
      const res = await authFetch(`/api/admin/artworks/${art.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Gagal menghapus karya');
      if (idToken) await fetchOverview(idToken);
      onDataChanged();
      notify('Karya dihapus dari arsip.');
    } catch (err: unknown) {
      notify(err instanceof Error ? err.message : 'Gagal menghapus');
    }
  };

  const handleArtworkDrop = async (targetId: number) => {
    if (!draggedArtworkId || draggedArtworkId === targetId) return;
    const list = [...roomArtworks];
    const fromIdx = list.findIndex((a) => a.id === draggedArtworkId);
    const toIdx = list.findIndex((a) => a.id === targetId);
    if (fromIdx < 0 || toIdx < 0) return;

    const [moved] = list.splice(fromIdx, 1);
    list.splice(toIdx, 0, moved);

    // Update local artworks list immediately
    const others = artworks.filter((a) => a.prokerId !== selectedProkerId);
    setArtworks([...others, ...list]);
    setDraggedArtworkId(null);

    await authFetch('/api/admin/artworks/reorder', {
      method: 'POST',
      body: JSON.stringify({ orderedIds: list.map((a) => a.id) }),
    });
    onDataChanged();
    notify('Urutan karya di ruang pamer diperbarui.');
  };

  // Upload audio file helper
  const handleAudioUpload = async (file: File) => {
    if (file.size > 6.5 * 1024 * 1024) {
      notify('Ukuran file audio maksimal 6.5 MB ya.');
      return;
    }
    setUploadingAudio(true);
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ''));
        reader.onerror = () => reject(new Error('Gagal membaca file audio'));
        reader.readAsDataURL(file);
      });
      const base64 = dataUrl.split(',')[1] || '';
      const res = await authFetch('/api/admin/upload', {
        method: 'POST',
        body: JSON.stringify({
          mimeType: file.type || 'audio/mpeg',
          dataBase64: base64,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal mengunggah audio');
      setBacksoundMode('audio');
      setBacksoundUrl(data.url);
      if (!backsoundTitle || backsoundTitle === 'Piano Latar Museum') {
        setBacksoundTitle(file.name.replace(/\.[^.]+$/, ''));
      }
      notify('File audio berhasil diunggah! Klik Simpan Backsound.');
    } catch (err: unknown) {
      notify(err instanceof Error ? err.message : 'Gagal mengunggah audio');
    } finally {
      setUploadingAudio(false);
    }
  };

  // Save Backsound Settings
  const handleSaveBacksound = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await authFetch('/api/admin/settings', {
      method: 'PATCH',
      body: JSON.stringify({
        backsoundMode,
        backsoundUrl: backsoundMode === 'builtin' ? '' : backsoundUrl,
        backsoundTitle:
          backsoundTitle.trim() ||
          (backsoundMode === 'builtin' ? 'Piano Latar Museum' : 'Musik Latar Galeri'),
      }),
    });
    if (res.ok) {
      onDataChanged();
      notify('Pengaturan backsound museum disimpan!');
    } else {
      const data = await res.json();
      notify(data.error || 'Gagal menyimpan backsound.');
    }
  };

  // Save Closing Epilogue Settings
  const handleSaveClosing = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await authFetch('/api/admin/settings', {
      method: 'PATCH',
      body: JSON.stringify({
        curatorPhotoUrl,
        closingVisible,
        closingTitle,
        closingSubtitle,
        closingPhotoUrl,
        closingPhotoCaption,
        closingVideoUrl,
        closingVideoTitle,
        closingMessage,
      }),
    });
    if (res.ok) {
      onDataChanged();
      notify('Babak Penutup Periode berhasil diperbarui!');
    } else {
      const data = await res.json();
      notify(data.error || 'Gagal menyimpan Babak Penutup.');
    }
  };

  // Team Member CRUD Handlers
  const openCreateMember = () => {
    setEditingMember(null);
    setMName('');
    setMRole('');
    setMDivision('');
    setMPhotoUrl('');
    setMIsLeader(false);
    setMQuote('');
    setShowMemberForm(true);
  };

  const openEditMember = (m: TeamMember) => {
    setEditingMember(m);
    setMName(m.name);
    setMRole(m.role);
    setMDivision(m.division);
    setMPhotoUrl(m.photoUrl || '');
    setMIsLeader(m.isLeader);
    setMQuote(m.quote || '');
    setShowMemberForm(true);
  };

  const handleSaveMember = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        name: mName,
        role: mRole,
        division: mDivision,
        photoUrl: mPhotoUrl,
        isLeader: mIsLeader,
        quote: mQuote,
      };
      const res = editingMember
        ? await authFetch(`/api/admin/team/${editingMember.id}`, {
            method: 'PATCH',
            body: JSON.stringify(payload),
          })
        : await authFetch('/api/admin/team', {
            method: 'POST',
            body: JSON.stringify(payload),
          });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menyimpan data pengurus');
      setShowMemberForm(false);
      if (idToken) await fetchOverview(idToken);
      onDataChanged();
      notify(editingMember ? 'Data pengurus diperbarui!' : 'Pengurus baru ditambahkan!');
    } catch (err: unknown) {
      notify(err instanceof Error ? err.message : 'Gagal menyimpan');
    }
  };

  const handleDeleteMember = async (m: TeamMember) => {
    const res = await authFetch(`/api/admin/team/${m.id}`, { method: 'DELETE' });
    if (res.ok && idToken) {
      await fetchOverview(idToken);
      onDataChanged();
      notify(`"${m.name}" dihapus dari struktur pengurus.`);
    }
  };

  const handleMemberDrop = async (targetId: number) => {
    if (!draggedMemberId || draggedMemberId === targetId) return;
    const list = [...members];
    const fromIdx = list.findIndex((m) => m.id === draggedMemberId);
    const toIdx = list.findIndex((m) => m.id === targetId);
    if (fromIdx < 0 || toIdx < 0) return;
    const [moved] = list.splice(fromIdx, 1);
    list.splice(toIdx, 0, moved);
    setMembers(list);
    setDraggedMemberId(null);

    await authFetch('/api/admin/team/reorder', {
      method: 'POST',
      body: JSON.stringify({ orderedIds: list.map((m) => m.id) }),
    });
    onDataChanged();
    notify('Urutan pigura pengurus diperbarui.');
  };

  // Moderation Handlers
  const handleModerateComment = async (
    commentId: number,
    status: 'approved' | 'rejected'
  ) => {
    const res = await authFetch(`/api/admin/comments/${commentId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    if (res.ok && idToken) {
      await fetchOverview(idToken);
      onDataChanged();
      notify(status === 'approved' ? 'Kartu pos disetujui & tampil!' : 'Kartu pos ditolak.');
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    const res = await authFetch(`/api/admin/comments/${commentId}`, {
      method: 'DELETE',
    });
    if (res.ok && idToken) {
      await fetchOverview(idToken);
      onDataChanged();
      notify('Kartu pos dihapus permanen.');
    }
  };

  const handleToggleAutoApprove = async () => {
    const nextVal = !autoApprove;
    const res = await authFetch('/api/admin/settings', {
      method: 'PATCH',
      body: JSON.stringify({ guestbookAutoApprove: nextVal }),
    });
    if (res.ok) {
      setAutoApprove(nextVal);
      notify(
        nextVal
          ? 'Mode Auto-Tampil aktif: komentar langsung tayang.'
          : 'Mode Moderasi aktif: komentar perlu disetujui kurator.'
      );
    }
  };

  // Quotes Handlers
  const handleAddQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await authFetch('/api/admin/quotes', {
      method: 'POST',
      body: JSON.stringify({ text: qText, author: qAuthor }),
    });
    if (res.ok && idToken) {
      setQText('');
      setQAuthor('');
      await fetchOverview(idToken);
      onDataChanged();
      notify('Kutipan lobi ditambahkan.');
    }
  };

  const handleDeleteQuote = async (id: number) => {
    const res = await authFetch(`/api/admin/quotes/${id}`, { method: 'DELETE' });
    if (res.ok && idToken) {
      await fetchOverview(idToken);
      onDataChanged();
      notify('Kutipan dihapus.');
    }
  };

  // Whitelist Handlers
  const handleAddWhitelist = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await authFetch('/api/admin/whitelist', {
      method: 'POST',
      body: JSON.stringify({ email: wEmail, role: wRole }),
    });
    const data = await res.json();
    if (!res.ok) {
      notify(data.error || 'Gagal menambah email whitelist.');
      return;
    }
    setWEmail('');
    if (idToken) await fetchOverview(idToken);
    notify('Email kurator berhasil ditambahkan ke whitelist!');
  };

  const handleDeleteWhitelist = async (id: number) => {
    const res = await authFetch(`/api/admin/whitelist/${id}`, {
      method: 'DELETE',
    });
    const data = await res.json();
    if (!res.ok) {
      notify(data.error || 'Gagal menghapus email.');
      return;
    }
    if (idToken) await fetchOverview(idToken);
    notify('Email dihapus dari whitelist.');
  };

  // ========================
  // RENDER: NOT LOGGED IN OR REJECTED
  // ========================
  if (!authReady || checkingAuth) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center font-mono-catalog text-xs uppercase tracking-[0.18em] text-[#F2EEE3]/70">
        Memeriksa kredensial kurator...
      </div>
    );
  }

  if (!firebaseUser) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 sm:py-28">
        <div className="bg-[#0B2A4A] border border-[#F2EEE3]/25 p-8 sm:p-10 flex flex-col gap-6">
          <div>
            <span className="font-mono-catalog text-[11px] uppercase tracking-[0.2em] text-[#F2B35E] block mb-2">
              Ruang Kurator · Akses Terbatas
            </span>
            <h1 className="font-serif-editorial text-3xl sm:text-4xl text-[#F2EEE3]">
              Masuk Panel <span className="italic">Admin</span>
            </h1>
          </div>
          <p className="text-sm text-[#F2EEE3]/75 leading-relaxed">
            Hanya pengurus Medkominfo HIMATIF yang alamat email Google-nya terdaftar di whitelist museum yang dapat mengelola program kerja, foto, video, dan moderasi buku tamu.
          </p>
          {authError && (
            <div className="p-3.5 border border-red-400/50 bg-red-950/40 text-xs text-red-200">
              {authError}
            </div>
          )}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            className="w-full py-3.5 px-5 bg-[#F2B35E] text-[#07182B] font-mono-catalog text-xs font-medium uppercase tracking-[0.16em] hover:bg-[#f6c47e] cursor-pointer min-h-[46px]"
          >
            Masuk dengan Akun Google
          </button>
        </div>
      </div>
    );
  }

  if (!adminUser) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 sm:py-28">
        <div className="bg-[#0B2A4A] border border-[#F2B35E]/40 p-8 sm:p-10 flex flex-col gap-5">
          <div className="flex items-center gap-3 text-[#F2B35E]">
            <ShieldAlert className="w-6 h-6 shrink-0" />
            <span className="font-mono-catalog text-xs uppercase tracking-[0.18em]">
              Akses Ditolak dengan Sopan
            </span>
          </div>
          <h1 className="font-serif-editorial text-3xl text-[#F2EEE3]">
            Email Belum Terdaftar
          </h1>
          <p className="text-sm text-[#F2EEE3]/80 leading-relaxed">
            {authError ||
              'Maaf, akun Google Anda belum masuk dalam daftar kurator Medkominfo HIMATIF.'}
          </p>
          <div className="p-3 bg-[#07182B] border border-[#F2EEE3]/15 font-mono-catalog text-xs text-[#F2EEE3]/70">
            Akun aktif: {firebaseUser.email}
          </div>
          <button
            type="button"
            onClick={handleSignOut}
            className="inline-flex items-center justify-center gap-2 py-3 px-5 border border-[#F2EEE3]/35 text-[#F2EEE3] hover:border-[#F2B35E] hover:text-[#F2B35E] font-mono-catalog text-xs uppercase tracking-[0.14em] cursor-pointer min-h-[44px]"
          >
            <LogOut className="w-4 h-4" />
            <span>Keluar & Gunakan Akun Lain</span>
          </button>
        </div>
      </div>
    );
  }

  const pendingCount = comments.filter((c) => c.status === 'pending').length;
  const reportedCount = comments.filter((c) => (c.reportCount || 0) > 0).length;
  const filteredComments = comments.filter((c) => {
    if (commentFilter === 'all') return true;
    if (commentFilter === 'reported') return (c.reportCount || 0) > 0;
    return c.status === commentFilter;
  });

  return (
    <div className="max-w-[1360px] mx-auto px-4 sm:px-8 lg:px-14 py-10 sm:py-14">
      {/* Admin Header */}
      <div className="border-b border-[#F2EEE3]/20 pb-6 mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="font-mono-catalog text-[11px] uppercase tracking-[0.18em] text-[#F2B35E] block mb-1">
            Ruang Kurator · {adminUser.role === 'super_admin' ? 'Admin Utama' : 'Kurator'}
          </span>
          <h1 className="font-serif-editorial text-3xl sm:text-4xl text-[#F2EEE3]">
            Panel Pengelola <span className="italic">Galeri</span>
          </h1>
          <p className="font-mono-catalog text-xs text-[#F2EEE3]/65 mt-1">
            Masuk sebagai {adminUser.email}
          </p>
        </div>

        <button
          type="button"
          onClick={handleSignOut}
          className="inline-flex items-center gap-2 px-4 py-2 border border-[#F2EEE3]/30 text-[#F2EEE3]/85 hover:border-[#F2B35E] hover:text-[#F2B35E] font-mono-catalog text-xs uppercase tracking-[0.14em] cursor-pointer self-start sm:self-auto"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Keluar</span>
        </button>
      </div>

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-[80] bg-[#F2B35E] text-[#07182B] px-5 py-3 border border-[#07182B] shadow-xl font-mono-catalog text-xs">
          {toast}
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-[#F2EEE3]/15 pb-4 mb-8">
        {(
          [
            { id: 'proker', label: `Proker (${prokers.length})` },
            { id: 'karya', label: `Karya (${artworks.length})` },
            { id: 'pengurus', label: `Pengurus (${members.length})` },
            { id: 'penutup', label: 'Penutup & Backsound' },
            {
              id: 'moderasi',
              label: `Moderasi (${pendingCount}${reportedCount > 0 ? ` · ${reportedCount} Lapor` : ''})`,
            },
            { id: 'quote', label: `Quote (${quotes.length})` },
            { id: 'whitelist', label: `Whitelist (${whitelist.length})` },
          ] as { id: AdminTab; label: string }[]
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 font-mono-catalog text-xs uppercase tracking-[0.12em] border cursor-pointer transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-[#F2B35E] text-[#07182B] border-[#F2B35E] font-medium'
                : 'bg-[#0B2A4A] text-[#F2EEE3]/80 border-[#F2EEE3]/20 hover:border-[#F2EEE3]/50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loadingOverview ? (
        <div className="py-16 text-center font-mono-catalog text-xs uppercase tracking-[0.16em] text-[#F2EEE3]/60">
          Memuat arsip kurator...
        </div>
      ) : (
        <>
          {/* TAB 1: PROKER */}
          {activeTab === 'proker' && (
            <div className="flex flex-col gap-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <p className="text-xs font-mono-catalog text-[#F2EEE3]/65">
                  Seret dan lepas baris proker untuk mengatur urutan di Denah Ruangan.
                </p>
                <button
                  type="button"
                  onClick={openCreateProker}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#F2B35E] text-[#07182B] font-mono-catalog text-xs font-medium uppercase tracking-[0.14em] cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Proker</span>
                </button>
              </div>

              {showProkerForm && (
                <form
                  onSubmit={handleSaveProker}
                  className="bg-[#0B2A4A] border border-[#F2B35E]/50 p-6 grid grid-cols-1 md:grid-cols-2 gap-4"
                >
                  <div className="md:col-span-2 flex items-center justify-between border-b border-[#F2EEE3]/15 pb-3">
                    <h2 className="font-serif-editorial text-2xl text-[#F2EEE3]">
                      {editingProker ? 'Edit Ruang Proker' : 'Ruang Proker Baru'}
                    </h2>
                    <button
                      type="button"
                      onClick={() => setShowProkerForm(false)}
                      className="text-[#F2EEE3]/65 hover:text-[#F2EEE3] cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div>
                    <label className="block font-mono-catalog text-[11px] uppercase mb-1 text-[#F2EEE3]/80">
                      Nomor Ruang
                    </label>
                    <input
                      type="text"
                      required
                      value={pRoomNumber}
                      onChange={(e) => setPRoomNumber(e.target.value)}
                      placeholder="RUANG 04"
                      className="w-full px-3 py-2 bg-[#07182B] border border-[#F2EEE3]/25 text-sm text-[#F2EEE3]"
                    />
                  </div>

                  <div>
                    <label className="block font-mono-catalog text-[11px] uppercase mb-1 text-[#F2EEE3]/80">
                      Tanggal Pelaksanaan
                    </label>
                    <input
                      type="text"
                      required
                      value={pDate}
                      onChange={(e) => setPDate(e.target.value)}
                      placeholder="15 Januari 2027"
                      className="w-full px-3 py-2 bg-[#07182B] border border-[#F2EEE3]/25 text-sm text-[#F2EEE3]"
                    />
                  </div>

                  <div>
                    <label className="block font-mono-catalog text-[11px] uppercase mb-1 text-[#F2EEE3]/80">
                      Nama Program Kerja
                    </label>
                    <input
                      type="text"
                      required
                      value={pTitle}
                      onChange={(e) => setPTitle(e.target.value)}
                      placeholder="Seminar Nasional AI & Etika"
                      className="w-full px-3 py-2 bg-[#07182B] border border-[#F2EEE3]/25 text-sm text-[#F2EEE3]"
                    />
                  </div>

                  <div>
                    <label className="block font-mono-catalog text-[11px] uppercase mb-1 text-[#F2EEE3]/80">
                      Subjudul Singkat (Opsional)
                    </label>
                    <input
                      type="text"
                      value={pSubtitle}
                      onChange={(e) => setPSubtitle(e.target.value)}
                      placeholder="Merawat Nalar di Era Otomasi"
                      className="w-full px-3 py-2 bg-[#07182B] border border-[#F2EEE3]/25 text-sm text-[#F2EEE3]"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block font-mono-catalog text-[11px] uppercase mb-1 text-[#F2EEE3]/80">
                      Deskripsi Plakat Museum
                    </label>
                    <textarea
                      rows={3}
                      required
                      value={pDesc}
                      onChange={(e) => setPDesc(e.target.value)}
                      className="w-full px-3 py-2 bg-[#07182B] border border-[#F2EEE3]/25 text-sm text-[#F2EEE3]"
                    />
                  </div>

                  <div>
                    <label className="block font-mono-catalog text-[11px] uppercase mb-1 text-[#F2EEE3]/80">
                      Kata Kurator Proker (Opsional)
                    </label>
                    <input
                      type="text"
                      value={pCuratorNote}
                      onChange={(e) => setPCuratorNote(e.target.value)}
                      className="w-full px-3 py-2 bg-[#07182B] border border-[#F2EEE3]/25 text-sm text-[#F2EEE3]"
                    />
                  </div>

                  <div>
                    <label className="block font-mono-catalog text-[11px] uppercase mb-1 text-[#F2EEE3]/80">
                      Ucapan Penutup Ruang
                    </label>
                    <input
                      type="text"
                      value={pClosingNote}
                      onChange={(e) => setPClosingNote(e.target.value)}
                      placeholder="Terima kasih sudah mampir di Ruang 04"
                      className="w-full px-3 py-2 bg-[#07182B] border border-[#F2EEE3]/25 text-sm text-[#F2EEE3]"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block font-mono-catalog text-[11px] uppercase mb-1 text-[#F2EEE3]/80">
                      Sampul Ruangan (Unggah Foto Otomatis Terkompresi atau Tempel URL)
                    </label>
                    <div className="flex flex-wrap items-center gap-3">
                      <input
                        type="text"
                        required
                        value={pCoverUrl}
                        onChange={(e) => setPCoverUrl(e.target.value)}
                        placeholder="/api/media/..."
                        className="flex-1 min-w-[220px] px-3 py-2 bg-[#07182B] border border-[#F2EEE3]/25 text-sm text-[#F2EEE3]"
                      />
                      <label className="inline-flex items-center gap-2 px-4 py-2 border border-[#F2B35E] text-[#F2B35E] hover:bg-[#F2B35E] hover:text-[#07182B] font-mono-catalog text-xs uppercase cursor-pointer">
                        <Upload className="w-3.5 h-3.5" />
                        <span>{uploadingCover ? 'Mengompres...' : 'Unggah Cover'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          disabled={uploadingCover}
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) {
                              handleCompressedImageUpload(
                                f,
                                (url, note) => {
                                  setPCoverUrl(url);
                                  notify(note);
                                },
                                setUploadingCover
                              );
                            }
                          }}
                        />
                      </label>
                    </div>
                  </div>

                  <div className="md:col-span-2 flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowProkerForm(false)}
                      className="px-4 py-2 border border-[#F2EEE3]/30 font-mono-catalog text-xs uppercase cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-[#F2B35E] text-[#07182B] font-mono-catalog text-xs font-medium uppercase cursor-pointer"
                    >
                      Simpan Proker
                    </button>
                  </div>
                </form>
              )}

              <div className="divide-y divide-[#F2EEE3]/15 border border-[#F2EEE3]/20 bg-[#0B2A4A]/50">
                {prokers.map((p) => (
                  <div
                    key={p.id}
                    draggable
                    onDragStart={() => setDraggedProkerId(p.id)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => handleProkerDrop(p.id)}
                    className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#0B2A4A]"
                  >
                    <div className="flex items-center gap-4">
                      <GripVertical className="w-4 h-4 text-[#F2EEE3]/40 cursor-grab shrink-0" />
                      <img
                        src={p.coverUrl}
                        alt={p.title}
                        className="w-16 h-12 object-cover border border-[#F2EEE3]/25 shrink-0"
                      />
                      <div>
                        <div className="font-mono-catalog text-[10px] uppercase tracking-[0.14em] text-[#F2B35E]">
                          {p.roomNumber} · {p.eventDate} {!p.isVisible && '· DISEMBUNYIKAN'}
                        </div>
                        <div className="font-serif-editorial text-xl text-[#F2EEE3]">
                          {p.title}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleToggleProkerVisibility(p)}
                        className="px-3 py-1.5 border border-[#F2EEE3]/25 font-mono-catalog text-[11px] uppercase inline-flex items-center gap-1.5 hover:border-[#F2B35E] cursor-pointer"
                        title={p.isVisible ? 'Sembunyikan' : 'Tampilkan'}
                      >
                        {p.isVisible ? (
                          <>
                            <Eye className="w-3.5 h-3.5" />
                            <span>Tampil</span>
                          </>
                        ) : (
                          <>
                            <EyeOff className="w-3.5 h-3.5 text-[#F2B35E]" />
                            <span>Tersembunyi</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => openEditProker(p)}
                        className="px-3 py-1.5 border border-[#F2EEE3]/25 font-mono-catalog text-[11px] uppercase hover:border-[#F2B35E] cursor-pointer"
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteProker(p)}
                        aria-label={`Hapus ${p.title}`}
                        className="p-2 border border-red-400/30 text-red-300 hover:bg-red-950/60 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: KARYA FOTO & VIDEO */}
          {activeTab === 'karya' && (
            <div className="flex flex-col gap-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <label className="font-mono-catalog text-xs uppercase tracking-[0.14em] text-[#F2EEE3]/70">
                    Pilih Ruang:
                  </label>
                  <select
                    value={selectedProkerId}
                    onChange={(e) => setSelectedProkerId(Number(e.target.value))}
                    className="px-3 py-2 bg-[#0B2A4A] border border-[#F2EEE3]/30 text-sm text-[#F2EEE3]"
                  >
                    {prokers.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.roomNumber} — {p.title}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="button"
                  onClick={openCreateArtwork}
                  disabled={!selectedProkerId}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#F2B35E] text-[#07182B] font-mono-catalog text-xs font-medium uppercase tracking-[0.14em] cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Foto / Video</span>
                </button>
              </div>

              {showArtworkForm && (
                <form
                  onSubmit={handleSaveArtwork}
                  className="bg-[#0B2A4A] border border-[#F2B35E]/50 p-6 grid grid-cols-1 md:grid-cols-2 gap-4"
                >
                  <div className="md:col-span-2 flex items-center justify-between border-b border-[#F2EEE3]/15 pb-3">
                    <h2 className="font-serif-editorial text-2xl text-[#F2EEE3]">
                      {editingArtwork ? 'Edit Karya Katalog' : 'Tambah Karya Baru'}
                    </h2>
                    <button
                      type="button"
                      onClick={() => setShowArtworkForm(false)}
                      className="text-[#F2EEE3]/65 hover:text-[#F2EEE3] cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Media Type Selector */}
                  <div className="md:col-span-2 flex gap-2">
                    <button
                      type="button"
                      onClick={() => setAMediaType('image')}
                      className={`px-4 py-2 font-mono-catalog text-xs uppercase border inline-flex items-center gap-2 cursor-pointer ${
                        aMediaType === 'image'
                          ? 'bg-[#F2B35E] text-[#07182B] border-[#F2B35E]'
                          : 'border-[#F2EEE3]/25 text-[#F2EEE3]'
                      }`}
                    >
                      <ImagePlus className="w-4 h-4" />
                      <span>Foto</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setAMediaType('video')}
                      className={`px-4 py-2 font-mono-catalog text-xs uppercase border inline-flex items-center gap-2 cursor-pointer ${
                        aMediaType === 'video'
                          ? 'bg-[#F2B35E] text-[#07182B] border-[#F2B35E]'
                          : 'border-[#F2EEE3]/25 text-[#F2EEE3]'
                      }`}
                    >
                      <Film className="w-4 h-4" />
                      <span>Video (YouTube / Google Drive / MP4)</span>
                    </button>
                  </div>

                  {aMediaType === 'image' ? (
                    <div className="md:col-span-2">
                      <label className="block font-mono-catalog text-[11px] uppercase mb-1 text-[#F2EEE3]/80">
                        Berkas Foto (Kompresi Otomatis Saat Upload)
                      </label>
                      <div className="flex flex-wrap items-center gap-3">
                        <input
                          type="text"
                          required
                          value={aMediaUrl}
                          onChange={(e) => setAMediaUrl(e.target.value)}
                          placeholder="/api/media/..."
                          className="flex-1 min-w-[220px] px-3 py-2 bg-[#07182B] border border-[#F2EEE3]/25 text-sm text-[#F2EEE3]"
                        />
                        <label className="inline-flex items-center gap-2 px-4 py-2 border border-[#F2B35E] text-[#F2B35E] hover:bg-[#F2B35E] hover:text-[#07182B] font-mono-catalog text-xs uppercase cursor-pointer">
                          <Upload className="w-3.5 h-3.5" />
                          <span>{uploadingMedia ? 'Mengompres...' : 'Pilih & Unggah Foto'}</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            disabled={uploadingMedia}
                            onChange={(e) => {
                              const f = e.target.files?.[0];
                              if (f) {
                                handleCompressedImageUpload(
                                  f,
                                  (url, note) => {
                                    setAMediaUrl(url);
                                    setCompressionNote(note);
                                  },
                                  setUploadingMedia
                                );
                              }
                            }}
                          />
                        </label>
                      </div>
                      {compressionNote && (
                        <p className="font-mono-catalog text-[11px] text-[#F2B35E] mt-1.5">
                          {compressionNote}
                        </p>
                      )}
                    </div>
                  ) : (
                    <>
                      <div className="md:col-span-2">
                        <label className="block font-mono-catalog text-[11px] uppercase mb-1 text-[#F2EEE3]/80">
                          Tautan Video (YouTube Unlisted, Google Drive, atau URL MP4)
                        </label>
                        <input
                          type="url"
                          required
                          value={aMediaUrl}
                          onChange={(e) => setAMediaUrl(e.target.value)}
                          placeholder="https://www.youtube.com/watch?v=... atau https://drive.google.com/file/d/.../view"
                          className="w-full px-3 py-2 bg-[#07182B] border border-[#F2EEE3]/25 text-sm text-[#F2EEE3]"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block font-mono-catalog text-[11px] uppercase mb-1 text-[#F2EEE3]/80">
                          Thumbnail Video (Opsional — Unggah atau URL)
                        </label>
                        <div className="flex flex-wrap gap-3">
                          <input
                            type="text"
                            value={aThumbUrl}
                            onChange={(e) => setAThumbUrl(e.target.value)}
                            placeholder="/api/media/..."
                            className="flex-1 min-w-[220px] px-3 py-2 bg-[#07182B] border border-[#F2EEE3]/25 text-sm text-[#F2EEE3]"
                          />
                          <label className="inline-flex items-center gap-2 px-4 py-2 border border-[#F2EEE3]/40 text-[#F2EEE3] hover:border-[#F2B35E] font-mono-catalog text-xs uppercase cursor-pointer">
                            <Upload className="w-3.5 h-3.5" />
                            <span>{uploadingMedia ? 'Mengompres...' : 'Unggah Thumbnail'}</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              disabled={uploadingMedia}
                              onChange={(e) => {
                                const f = e.target.files?.[0];
                                if (f) {
                                  handleCompressedImageUpload(
                                    f,
                                    (url, note) => {
                                      setAThumbUrl(url);
                                      setCompressionNote(note);
                                    },
                                    setUploadingMedia
                                  );
                                }
                              }}
                            />
                          </label>
                        </div>
                      </div>
                    </>
                  )}

                  <div>
                    <label className="block font-mono-catalog text-[11px] uppercase mb-1 text-[#F2EEE3]/80">
                      Judul Karya
                    </label>
                    <input
                      type="text"
                      required
                      value={aTitle}
                      onChange={(e) => setATitle(e.target.value)}
                      className="w-full px-3 py-2 bg-[#07182B] border border-[#F2EEE3]/25 text-sm text-[#F2EEE3]"
                    />
                  </div>

                  <div>
                    <label className="block font-mono-catalog text-[11px] uppercase mb-1 text-[#F2EEE3]/80">
                      No. Katalog & Tanggal
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        required
                        value={aCatalogNo}
                        onChange={(e) => setACatalogNo(e.target.value)}
                        placeholder="KAT. 01-D"
                        className="px-3 py-2 bg-[#07182B] border border-[#F2EEE3]/25 text-sm text-[#F2EEE3]"
                      />
                      <input
                        type="text"
                        required
                        value={aDate}
                        onChange={(e) => setADate(e.target.value)}
                        placeholder="18 Okt 2026"
                        className="px-3 py-2 bg-[#07182B] border border-[#F2EEE3]/25 text-sm text-[#F2EEE3]"
                      />
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block font-mono-catalog text-[11px] uppercase mb-1 text-[#F2EEE3]/80">
                      Caption Karya
                    </label>
                    <textarea
                      rows={2}
                      required
                      value={aCaption}
                      onChange={(e) => setACaption(e.target.value)}
                      className="w-full px-3 py-2 bg-[#07182B] border border-[#F2EEE3]/25 text-sm text-[#F2EEE3]"
                    />
                  </div>

                  <div>
                    <label className="block font-mono-catalog text-[11px] uppercase mb-1 text-[#F2EEE3]/80">
                      Kata Kurator (Opsional)
                    </label>
                    <input
                      type="text"
                      value={aCuratorQuote}
                      onChange={(e) => setACuratorQuote(e.target.value)}
                      className="w-full px-3 py-2 bg-[#07182B] border border-[#F2EEE3]/25 text-sm text-[#F2EEE3]"
                    />
                  </div>

                  <div className="flex items-end gap-4">
                    <div className="flex-1">
                      <label className="block font-mono-catalog text-[11px] uppercase mb-1 text-[#F2EEE3]/80">
                        Rasio Bingkai
                      </label>
                      <select
                        value={aAspectRatio}
                        onChange={(e) => setAAspectRatio(e.target.value)}
                        className="w-full px-3 py-2 bg-[#07182B] border border-[#F2EEE3]/25 text-sm text-[#F2EEE3]"
                      >
                        <option value="16:9">16:9 (Lanskap Lebar)</option>
                        <option value="4:3">4:3 (Klasik Kamera)</option>
                        <option value="3:4">3:4 (Potret Vertikal)</option>
                        <option value="1:1">1:1 (Persegi)</option>
                      </select>
                    </div>
                    <label className="inline-flex items-center gap-2 pb-2 cursor-pointer text-xs font-mono-catalog">
                      <input
                        type="checkbox"
                        checked={aHighlight}
                        onChange={(e) => setAHighlight(e.target.checked)}
                        className="accent-[#F2B35E]"
                      />
                      <span>Highlight di Lobi</span>
                    </label>
                  </div>

                  <div className="md:col-span-2 flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowArtworkForm(false)}
                      className="px-4 py-2 border border-[#F2EEE3]/30 font-mono-catalog text-xs uppercase cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-[#F2B35E] text-[#07182B] font-mono-catalog text-xs font-medium uppercase cursor-pointer"
                    >
                      Simpan Karya
                    </button>
                  </div>
                </form>
              )}

              <p className="text-xs font-mono-catalog text-[#F2EEE3]/60">
                Seret dan lepas kartu karya untuk mengatur urutan tampil di dinding pamer.
              </p>

              <div className="divide-y divide-[#F2EEE3]/15 border border-[#F2EEE3]/20 bg-[#0B2A4A]/50">
                {roomArtworks.length === 0 ? (
                  <div className="p-8 text-center text-sm text-[#F2EEE3]/60">
                    Belum ada karya di ruang proker ini.
                  </div>
                ) : (
                  roomArtworks.map((art) => (
                    <div
                      key={art.id}
                      draggable
                      onDragStart={() => setDraggedArtworkId(art.id)}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={() => handleArtworkDrop(art.id)}
                      className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#0B2A4A]"
                    >
                      <div className="flex items-center gap-4">
                        <GripVertical className="w-4 h-4 text-[#F2EEE3]/40 cursor-grab shrink-0" />
                        <img
                          src={
                            art.mediaType === 'video'
                              ? art.thumbnailUrl ||
                                '/src/assets/images/proker1_pelantikan_1795774774073.jpg'
                              : art.mediaUrl
                          }
                          alt={art.title}
                          className="w-16 h-12 object-cover border border-[#F2EEE3]/25 shrink-0"
                        />
                        <div>
                          <div className="font-mono-catalog text-[10px] uppercase tracking-[0.14em] text-[#F2B35E]">
                            {art.catalogNumber} · {art.mediaType.toUpperCase()} · {art.capturedDate}
                          </div>
                          <div className="font-serif-editorial text-lg text-[#F2EEE3]">
                            {art.title}
                          </div>
                          <div className="text-xs text-[#F2EEE3]/65 line-clamp-1">
                            {art.caption}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleToggleHighlight(art)}
                          className={`px-3 py-1.5 border font-mono-catalog text-[11px] uppercase inline-flex items-center gap-1.5 cursor-pointer ${
                            art.isHighlight
                              ? 'bg-[#F2B35E] text-[#07182B] border-[#F2B35E]'
                              : 'border-[#F2EEE3]/25 text-[#F2EEE3]/80 hover:border-[#F2B35E]'
                          }`}
                        >
                          <Star className="w-3.5 h-3.5" />
                          <span>Highlight</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => openEditArtwork(art)}
                          className="px-3 py-1.5 border border-[#F2EEE3]/25 font-mono-catalog text-[11px] uppercase hover:border-[#F2B35E] cursor-pointer"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteArtwork(art)}
                          aria-label={`Hapus ${art.title}`}
                          className="p-2 border border-red-400/30 text-red-300 hover:bg-red-950/60 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 3: MODERASI BUKU TAMU */}
          {activeTab === 'moderasi' && (
            <div className="flex flex-col gap-6">
              <div className="bg-[#0B2A4A] border border-[#F2EEE3]/20 p-5 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="font-serif-editorial text-xl text-[#F2EEE3]">
                    Mode Publikasi Kartu Pos Buku Tamu
                  </h2>
                  <p className="text-xs text-[#F2EEE3]/70 mt-0.5">
                    {autoApprove
                      ? 'Auto-Tampil aktif: komentar pengunjung yang lolos filter otomatis tayang.'
                      : 'Moderasi manual aktif: komentar baru menunggu persetujuan kurator sebelum tampil.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleToggleAutoApprove}
                  className={`px-4 py-2 font-mono-catalog text-xs uppercase border cursor-pointer ${
                    autoApprove
                      ? 'bg-[#F2B35E] text-[#07182B] border-[#F2B35E] font-medium'
                      : 'border-[#F2EEE3]/35 text-[#F2EEE3]'
                  }`}
                >
                  {autoApprove ? 'Mode: Auto-Tampil' : 'Mode: Moderasi Manual'}
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                {(
                  [
                    { id: 'pending', label: 'Menunggu' },
                    { id: 'approved', label: 'Disetujui' },
                    { id: 'reported', label: 'Dilaporkan' },
                    { id: 'rejected', label: 'Ditolak' },
                    { id: 'all', label: 'Semua' },
                  ] as const
                ).map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setCommentFilter(f.id)}
                    className={`px-3 py-1.5 font-mono-catalog text-xs uppercase border cursor-pointer ${
                      commentFilter === f.id
                        ? 'border-[#F2B35E] text-[#F2B35E] bg-[#0B2A4A]'
                        : 'border-[#F2EEE3]/20 text-[#F2EEE3]/70'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              <div className="divide-y divide-[#F2EEE3]/15 border border-[#F2EEE3]/20 bg-[#0B2A4A]/50">
                {filteredComments.length === 0 ? (
                  <div className="p-8 text-center text-sm text-[#F2EEE3]/60">
                    Tidak ada kartu pos pada kategori ini.
                  </div>
                ) : (
                  filteredComments.map((c) => (
                    <div
                      key={c.id}
                      className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="flex flex-col gap-1">
                        <div className="flex flex-wrap items-center gap-2 font-mono-catalog text-[11px] uppercase">
                          <span>{c.sticker}</span>
                          <span className="text-[#F2B35E]">{c.authorName}</span>
                          <span className="text-[#F2EEE3]/50">
                            · {formatIndonesianDate(c.createdAt)}
                          </span>
                          <span className="text-[#F2EEE3]/60">· Status: {c.status}</span>
                          {(c.reportCount || 0) > 0 && (
                            <span className="text-red-300">
                              · {c.reportCount} Laporan
                            </span>
                          )}
                        </div>
                        <p className="font-handwriting text-xl text-[#F2EEE3]">
                          “{c.message}”
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {c.status !== 'approved' && (
                          <button
                            type="button"
                            onClick={() => handleModerateComment(c.id, 'approved')}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#F2B35E] text-[#07182B] font-mono-catalog text-[11px] uppercase cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Setujui</span>
                          </button>
                        )}
                        {c.status !== 'rejected' && (
                          <button
                            type="button"
                            onClick={() => handleModerateComment(c.id, 'rejected')}
                            className="px-3 py-1.5 border border-[#F2EEE3]/30 font-mono-catalog text-[11px] uppercase cursor-pointer"
                          >
                            Tolak
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDeleteComment(c.id)}
                          aria-label="Hapus komentar"
                          className="p-2 border border-red-400/30 text-red-300 hover:bg-red-950/60 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 4: QUOTE LOBI */}
          {activeTab === 'quote' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <form
                onSubmit={handleAddQuote}
                className="lg:col-span-5 bg-[#0B2A4A] border border-[#F2EEE3]/25 p-6 flex flex-col gap-4 self-start"
              >
                <h2 className="font-serif-editorial text-2xl text-[#F2EEE3]">
                  Tambah Kutipan Lobi Hidup
                </h2>
                <div>
                  <label className="block font-mono-catalog text-[11px] uppercase mb-1 text-[#F2EEE3]/80">
                    Isi Kutipan
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={qText}
                    onChange={(e) => setQText(e.target.value)}
                    placeholder="Tulis kalimat hangat atau lucu seputar dokumentasi..."
                    className="w-full px-3 py-2 bg-[#07182B] border border-[#F2EEE3]/25 text-sm text-[#F2EEE3]"
                  />
                </div>
                <div>
                  <label className="block font-mono-catalog text-[11px] uppercase mb-1 text-[#F2EEE3]/80">
                    Sumber / Penulis
                  </label>
                  <input
                    type="text"
                    required
                    value={qAuthor}
                    onChange={(e) => setQAuthor(e.target.value)}
                    placeholder="Tim Desain Visual"
                    className="w-full px-3 py-2 bg-[#07182B] border border-[#F2EEE3]/25 text-sm text-[#F2EEE3]"
                  />
                </div>
                <button
                  type="submit"
                  className="py-2.5 px-4 bg-[#F2B35E] text-[#07182B] font-mono-catalog text-xs font-medium uppercase cursor-pointer"
                >
                  Simpan Kutipan
                </button>
              </form>

              <div className="lg:col-span-7 divide-y divide-[#F2EEE3]/15 border border-[#F2EEE3]/20 bg-[#0B2A4A]/50">
                {quotes.map((q) => (
                  <div key={q.id} className="p-5 flex items-start justify-between gap-4">
                    <div>
                      <p className="font-serif-editorial italic text-lg text-[#F2EEE3]">
                        “{q.text}”
                      </p>
                      <span className="font-mono-catalog text-xs text-[#F2B35E] mt-1 block">
                        — {q.author}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteQuote(q.id)}
                      className="p-2 border border-red-400/30 text-red-300 hover:bg-red-950/60 cursor-pointer shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: WHITELIST KURATOR */}
          {activeTab === 'whitelist' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-5 bg-[#0B2A4A] border border-[#F2EEE3]/25 p-6 flex flex-col gap-4 self-start">
                <h2 className="font-serif-editorial text-2xl text-[#F2EEE3]">
                  Tambah Email Whitelist
                </h2>
                {adminUser.role === 'super_admin' ? (
                  <form onSubmit={handleAddWhitelist} className="flex flex-col gap-4">
                    <div>
                      <label className="block font-mono-catalog text-[11px] uppercase mb-1 text-[#F2EEE3]/80">
                        Email Google Kurator
                      </label>
                      <input
                        type="email"
                        required
                        value={wEmail}
                        onChange={(e) => setWEmail(e.target.value)}
                        placeholder="nama@gmail.com"
                        className="w-full px-3 py-2 bg-[#07182B] border border-[#F2EEE3]/25 text-sm text-[#F2EEE3]"
                      />
                    </div>
                    <div>
                      <label className="block font-mono-catalog text-[11px] uppercase mb-1 text-[#F2EEE3]/80">
                        Peran
                      </label>
                      <select
                        value={wRole}
                        onChange={(e) =>
                          setWRole(e.target.value === 'super_admin' ? 'super_admin' : 'admin')
                        }
                        className="w-full px-3 py-2 bg-[#07182B] border border-[#F2EEE3]/25 text-sm text-[#F2EEE3]"
                      >
                        <option value="admin">Admin Kurator</option>
                        <option value="super_admin">Admin Utama</option>
                      </select>
                    </div>
                    <button
                      type="submit"
                      className="py-2.5 px-4 bg-[#F2B35E] text-[#07182B] font-mono-catalog text-xs font-medium uppercase cursor-pointer"
                    >
                      Tambahkan ke Whitelist
                    </button>
                  </form>
                ) : (
                  <p className="text-sm text-[#F2EEE3]/75 leading-relaxed">
                    Hanya Admin Utama yang dapat menambah atau menghapus daftar email kurator.
                  </p>
                )}
              </div>

              <div className="lg:col-span-7 divide-y divide-[#F2EEE3]/15 border border-[#F2EEE3]/20 bg-[#0B2A4A]/50">
                {whitelist.map((entry) => (
                  <div
                    key={entry.id}
                    className="p-4 flex items-center justify-between gap-4"
                  >
                    <div>
                      <div className="font-mono-catalog text-sm text-[#F2EEE3]">
                        {entry.email}
                      </div>
                      <div className="font-mono-catalog text-[10px] uppercase tracking-[0.14em] text-[#F2B35E] mt-0.5">
                        {entry.role === 'super_admin' ? 'Admin Utama' : 'Admin Kurator'}
                      </div>
                    </div>

                    {adminUser.role === 'super_admin' &&
                      entry.email !== adminUser.email && (
                        <button
                          type="button"
                          onClick={() => handleDeleteWhitelist(entry.id)}
                          className="p-2 border border-red-400/30 text-red-300 hover:bg-red-950/60 cursor-pointer"
                          title="Hapus dari whitelist"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                  </div>
                ))}
              </div>
            </div>
          )}
          {/* TAB: PENGURUS (PER PIGURA SATU ORANG) */}
          {activeTab === 'pengurus' && (
            <div className="flex flex-col gap-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <p className="text-xs font-mono-catalog text-[#F2EEE3]/65">
                  Atur foto pigura per orang untuk Inti Pengurus dan tiap Departemen di halaman Tentang. Seret baris untuk ubah urutan.
                </p>
                <button
                  type="button"
                  onClick={openCreateMember}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#F2B35E] text-[#07182B] font-mono-catalog text-xs font-medium uppercase tracking-[0.14em] cursor-pointer"
                >
                  <Users className="w-4 h-4" />
                  <span>Tambah Pengurus</span>
                </button>
              </div>

              {showMemberForm && (
                <form
                  onSubmit={handleSaveMember}
                  className="bg-[#0B2A4A] border border-[#F2B35E]/50 p-6 grid grid-cols-1 md:grid-cols-2 gap-4"
                >
                  <div className="md:col-span-2 flex items-center justify-between border-b border-[#F2EEE3]/15 pb-3">
                    <h2 className="font-serif-editorial text-2xl text-[#F2EEE3]">
                      {editingMember ? 'Edit Pigura Pengurus' : 'Tambah Pengurus Baru'}
                    </h2>
                    <button
                      type="button"
                      onClick={() => setShowMemberForm(false)}
                      className="text-[#F2EEE3]/65 hover:text-[#F2EEE3] cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div>
                    <label className="block font-mono-catalog text-[11px] uppercase mb-1 text-[#F2EEE3]/80">
                      Nama Lengkap
                    </label>
                    <input
                      type="text"
                      required
                      value={mName}
                      onChange={(e) => setMName(e.target.value)}
                      className="w-full px-3 py-2 bg-[#07182B] border border-[#F2EEE3]/25 text-sm text-[#F2EEE3]"
                    />
                  </div>

                  <div>
                    <label className="block font-mono-catalog text-[11px] uppercase mb-1 text-[#F2EEE3]/80">
                      Jabatan
                    </label>
                    <input
                      type="text"
                      required
                      value={mRole}
                      onChange={(e) => setMRole(e.target.value)}
                      placeholder="Ketua Departemen / Koordinator / Staf"
                      className="w-full px-3 py-2 bg-[#07182B] border border-[#F2EEE3]/25 text-sm text-[#F2EEE3]"
                    />
                  </div>

                  <div>
                    <label className="block font-mono-catalog text-[11px] uppercase mb-1 text-[#F2EEE3]/80">
                      Bagian / Departemen
                    </label>
                    <input
                      type="text"
                      required
                      list="himatif-department-list"
                      value={mDivision}
                      onChange={(e) => setMDivision(e.target.value)}
                      placeholder="Inti Pengurus / Departemen Kominfo"
                      className="w-full px-3 py-2 bg-[#07182B] border border-[#F2EEE3]/25 text-sm text-[#F2EEE3]"
                    />
                    <datalist id="himatif-department-list">
                      <option value="Inti Pengurus" />
                      <option value="Departemen Penelitian dan Pengembangan" />
                      <option value="Departemen Kominfo" />
                      <option value="Departemen PSDM" />
                    </datalist>
                  </div>

                  <div className="flex items-end pb-2">
                    <label className="inline-flex items-center gap-2 cursor-pointer font-mono-catalog text-xs text-[#F2EEE3]">
                      <input
                        type="checkbox"
                        checked={mIsLeader}
                        onChange={(e) => setMIsLeader(e.target.checked)}
                        className="accent-[#F2B35E]"
                      />
                      <span>Tandai sebagai Pimpinan / Kepala</span>
                    </label>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block font-mono-catalog text-[11px] uppercase mb-1 text-[#F2EEE3]/80">
                      Foto Pengurus (Rasio Potret 3:4 Disarankan)
                    </label>
                    <div className="flex flex-wrap items-center gap-3">
                      <input
                        type="text"
                        value={mPhotoUrl}
                        onChange={(e) => setMPhotoUrl(e.target.value)}
                        placeholder="/api/media/..."
                        className="flex-1 min-w-[220px] px-3 py-2 bg-[#07182B] border border-[#F2EEE3]/25 text-sm text-[#F2EEE3]"
                      />
                      <label className="inline-flex items-center gap-2 px-4 py-2 border border-[#F2B35E] text-[#F2B35E] hover:bg-[#F2B35E] hover:text-[#07182B] font-mono-catalog text-xs uppercase cursor-pointer">
                        <Upload className="w-3.5 h-3.5" />
                        <span>{uploadingMemberPhoto ? 'Mengompres...' : 'Unggah Foto'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          disabled={uploadingMemberPhoto}
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) {
                              handleCompressedImageUpload(
                                f,
                                (url, note) => {
                                  setMPhotoUrl(url);
                                  notify(note);
                                },
                                setUploadingMemberPhoto
                              );
                            }
                          }}
                        />
                      </label>
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block font-mono-catalog text-[11px] uppercase mb-1 text-[#F2EEE3]/80">
                      Kutipan Singkat (Opsional)
                    </label>
                    <input
                      type="text"
                      value={mQuote}
                      onChange={(e) => setMQuote(e.target.value)}
                      className="w-full px-3 py-2 bg-[#07182B] border border-[#F2EEE3]/25 text-sm text-[#F2EEE3]"
                    />
                  </div>

                  <div className="md:col-span-2 flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowMemberForm(false)}
                      className="px-4 py-2 border border-[#F2EEE3]/30 font-mono-catalog text-xs uppercase cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-[#F2B35E] text-[#07182B] font-mono-catalog text-xs font-medium uppercase cursor-pointer"
                    >
                      Simpan Pengurus
                    </button>
                  </div>
                </form>
              )}

              <div className="divide-y divide-[#F2EEE3]/15 border border-[#F2EEE3]/20 bg-[#0B2A4A]/50">
                {members.map((m) => (
                  <div
                    key={m.id}
                    draggable
                    onDragStart={() => setDraggedMemberId(m.id)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => handleMemberDrop(m.id)}
                    className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#0B2A4A]"
                  >
                    <div className="flex items-center gap-4">
                      <GripVertical className="w-4 h-4 text-[#F2EEE3]/40 cursor-grab shrink-0" />
                      {m.photoUrl ? (
                        <img
                          src={m.photoUrl}
                          alt={m.name}
                          className="w-12 h-14 object-cover border border-[#F2EEE3]/25 shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-14 bg-[#07182B] border border-[#F2EEE3]/25 flex items-center justify-center text-xs font-mono-catalog shrink-0">
                          —
                        </div>
                      )}
                      <div>
                        <div className="font-mono-catalog text-[10px] uppercase tracking-[0.14em] text-[#F2B35E]">
                          {m.division} {m.isLeader && '· PIMPINAN'}
                        </div>
                        <div className="font-serif-editorial text-xl text-[#F2EEE3]">
                          {m.name}
                        </div>
                        <div className="text-xs text-[#F2EEE3]/65">{m.role}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => openEditMember(m)}
                        className="px-3 py-1.5 border border-[#F2EEE3]/25 font-mono-catalog text-[11px] uppercase hover:border-[#F2B35E] cursor-pointer"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteMember(m)}
                        aria-label={`Hapus ${m.name}`}
                        className="p-2 border border-red-400/30 text-red-300 hover:bg-red-950/60 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB: PENUTUP & BACKSOUND */}
          {activeTab === 'penutup' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Pengaturan Backsound Museum */}
              <form
                onSubmit={handleSaveBacksound}
                className="lg:col-span-5 bg-[#0B2A4A] border border-[#F2EEE3]/25 p-6 flex flex-col gap-4"
              >
                <div className="flex items-center gap-2 text-[#F2B35E]">
                  <Music className="w-4 h-4" />
                  <span className="font-mono-catalog text-xs uppercase tracking-[0.16em]">
                    Musik Latar Galeri
                  </span>
                </div>
                <h2 className="font-serif-editorial text-2xl text-[#F2EEE3]">
                  Pengaturan Backsound
                </h2>
                <p className="text-xs text-[#F2EEE3]/70 leading-relaxed">
                  Untuk memakai instrumental <strong>Ruang Baru — Barsena Bestandhi (Piano Cover)</strong>, tempel link YouTube cover-nya di bawah atau unggah file MP3/M4A.
                </p>

                <div className="flex flex-col gap-2">
                  <label className="font-mono-catalog text-[11px] uppercase text-[#F2EEE3]/80">
                    Sumber Musik
                  </label>
                  <select
                    value={backsoundMode}
                    onChange={(e) =>
                      setBacksoundMode(
                        e.target.value as 'builtin' | 'youtube' | 'audio'
                      )
                    }
                    className="w-full px-3 py-2 bg-[#07182B] border border-[#F2EEE3]/25 text-sm text-[#F2EEE3]"
                  >
                    <option value="builtin">Piano Latar Bawaan Museum</option>
                    <option value="youtube">Tautan YouTube (Piano Cover / Instrumental)</option>
                    <option value="audio">Unggah File Audio (.mp3 / .m4a / .ogg)</option>
                  </select>
                </div>

                {backsoundMode === 'youtube' && (
                  <div>
                    <label className="block font-mono-catalog text-[11px] uppercase mb-1 text-[#F2EEE3]/80">
                      Link YouTube Piano Cover
                    </label>
                    <input
                      type="url"
                      required
                      value={backsoundUrl}
                      onChange={(e) => setBacksoundUrl(e.target.value)}
                      placeholder="https://www.youtube.com/watch?v=..."
                      className="w-full px-3 py-2 bg-[#07182B] border border-[#F2EEE3]/25 text-sm text-[#F2EEE3]"
                    />
                  </div>
                )}

                {backsoundMode === 'audio' && (
                  <div>
                    <label className="block font-mono-catalog text-[11px] uppercase mb-1 text-[#F2EEE3]/80">
                      File Audio (MP3 / M4A / OGG maks 6.5MB)
                    </label>
                    <div className="flex flex-wrap gap-2">
                      <input
                        type="text"
                        required
                        value={backsoundUrl}
                        onChange={(e) => setBacksoundUrl(e.target.value)}
                        placeholder="/api/media/..."
                        className="flex-1 min-w-[180px] px-3 py-2 bg-[#07182B] border border-[#F2EEE3]/25 text-sm text-[#F2EEE3]"
                      />
                      <label className="inline-flex items-center gap-2 px-3.5 py-2 border border-[#F2B35E] text-[#F2B35E] hover:bg-[#F2B35E] hover:text-[#07182B] font-mono-catalog text-xs uppercase cursor-pointer">
                        <Upload className="w-3.5 h-3.5" />
                        <span>{uploadingAudio ? 'Mengunggah...' : 'Unggah Audio'}</span>
                        <input
                          type="file"
                          accept="audio/*"
                          className="hidden"
                          disabled={uploadingAudio}
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) handleAudioUpload(f);
                          }}
                        />
                      </label>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block font-mono-catalog text-[11px] uppercase mb-1 text-[#F2EEE3]/80">
                    Judul Lagu yang Tampil di Tombol
                  </label>
                  <input
                    type="text"
                    value={backsoundTitle}
                    onChange={(e) => setBacksoundTitle(e.target.value)}
                    placeholder="Ruang Baru — Barsena (Piano)"
                    className="w-full px-3 py-2 bg-[#07182B] border border-[#F2EEE3]/25 text-sm text-[#F2EEE3]"
                  />
                </div>

                <button
                  type="submit"
                  className="py-2.5 px-4 bg-[#F2B35E] text-[#07182B] font-mono-catalog text-xs font-medium uppercase cursor-pointer"
                >
                  Simpan Backsound
                </button>
              </form>

              {/* Pengaturan Babak Penutup Periode */}
              <form
                onSubmit={handleSaveClosing}
                className="lg:col-span-7 bg-[#0B2A4A] border border-[#F2EEE3]/25 p-6 flex flex-col gap-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#F2EEE3]/15 pb-3">
                  <div>
                    <span className="font-mono-catalog text-[10px] uppercase tracking-[0.16em] text-[#F2B35E]">
                      Epilog Setelah Semua Proker
                    </span>
                    <h2 className="font-serif-editorial text-2xl text-[#F2EEE3]">
                      Foto Bersama, Video Perjalanan &amp; Kata Penutup
                    </h2>
                  </div>

                  <label className="inline-flex items-center gap-2 px-3 py-1.5 border border-[#F2EEE3]/30 cursor-pointer font-mono-catalog text-xs">
                    <input
                      type="checkbox"
                      checked={closingVisible}
                      onChange={(e) => setClosingVisible(e.target.checked)}
                      className="accent-[#F2B35E]"
                    />
                    <span>{closingVisible ? 'Ditampilkan' : 'Disembunyikan'}</span>
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-mono-catalog text-[11px] uppercase mb-1 text-[#F2EEE3]/80">
                      Judul Babak Penutup
                    </label>
                    <input
                      type="text"
                      value={closingTitle}
                      onChange={(e) => setClosingTitle(e.target.value)}
                      className="w-full px-3 py-2 bg-[#07182B] border border-[#F2EEE3]/25 text-sm text-[#F2EEE3]"
                    />
                  </div>
                  <div>
                    <label className="block font-mono-catalog text-[11px] uppercase mb-1 text-[#F2EEE3]/80">
                      Subjudul Singkat
                    </label>
                    <input
                      type="text"
                      value={closingSubtitle}
                      onChange={(e) => setClosingSubtitle(e.target.value)}
                      className="w-full px-3 py-2 bg-[#07182B] border border-[#F2EEE3]/25 text-sm text-[#F2EEE3]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-mono-catalog text-[11px] uppercase mb-1 text-[#F2EEE3]/80">
                    Foto Catatan Kurator (Halaman Tentang)
                  </label>
                  <div className="flex flex-wrap gap-3 mb-4">
                    <input
                      type="text"
                      value={curatorPhotoUrl}
                      onChange={(e) => setCuratorPhotoUrl(e.target.value)}
                      placeholder="/api/media/..."
                      className="flex-1 min-w-[220px] px-3 py-2 bg-[#07182B] border border-[#F2EEE3]/25 text-sm text-[#F2EEE3]"
                    />
                    <label className="inline-flex items-center gap-2 px-4 py-2 border border-[#F2B35E] text-[#F2B35E] hover:bg-[#F2B35E] hover:text-[#07182B] font-mono-catalog text-xs uppercase cursor-pointer">
                      <Upload className="w-3.5 h-3.5" />
                      <span>
                        {uploadingCuratorPhoto ? 'Mengompres...' : 'Unggah Foto Kurator'}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        disabled={uploadingCuratorPhoto}
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) {
                            handleCompressedImageUpload(
                              f,
                              (url, note) => {
                                setCuratorPhotoUrl(url);
                                notify(note);
                              },
                              setUploadingCuratorPhoto
                            );
                          }
                        }}
                      />
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block font-mono-catalog text-[11px] uppercase mb-1 text-[#F2EEE3]/80">
                    Foto Bersama Penutup (Kompresi Otomatis)
                  </label>
                  <div className="flex flex-wrap gap-3">
                    <input
                      type="text"
                      value={closingPhotoUrl}
                      onChange={(e) => setClosingPhotoUrl(e.target.value)}
                      placeholder="/api/media/..."
                      className="flex-1 min-w-[220px] px-3 py-2 bg-[#07182B] border border-[#F2EEE3]/25 text-sm text-[#F2EEE3]"
                    />
                    <label className="inline-flex items-center gap-2 px-4 py-2 border border-[#F2B35E] text-[#F2B35E] hover:bg-[#F2B35E] hover:text-[#07182B] font-mono-catalog text-xs uppercase cursor-pointer">
                      <Upload className="w-3.5 h-3.5" />
                      <span>
                        {uploadingClosingPhoto ? 'Mengompres...' : 'Unggah Foto Bersama'}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        disabled={uploadingClosingPhoto}
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) {
                            handleCompressedImageUpload(
                              f,
                              (url, note) => {
                                setClosingPhotoUrl(url);
                                notify(note);
                              },
                              setUploadingClosingPhoto
                            );
                          }
                        }}
                      />
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block font-mono-catalog text-[11px] uppercase mb-1 text-[#F2EEE3]/80">
                    Keterangan Foto Bersama
                  </label>
                  <input
                    type="text"
                    value={closingPhotoCaption}
                    onChange={(e) => setClosingPhotoCaption(e.target.value)}
                    className="w-full px-3 py-2 bg-[#07182B] border border-[#F2EEE3]/25 text-sm text-[#F2EEE3]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-mono-catalog text-[11px] uppercase mb-1 text-[#F2EEE3]/80">
                      Link Video Perjalanan (YouTube / Drive / MP4)
                    </label>
                    <input
                      type="url"
                      value={closingVideoUrl}
                      onChange={(e) => setClosingVideoUrl(e.target.value)}
                      placeholder="https://www.youtube.com/watch?v=..."
                      className="w-full px-3 py-2 bg-[#07182B] border border-[#F2EEE3]/25 text-sm text-[#F2EEE3]"
                    />
                  </div>
                  <div>
                    <label className="block font-mono-catalog text-[11px] uppercase mb-1 text-[#F2EEE3]/80">
                      Judul Video Perjalanan
                    </label>
                    <input
                      type="text"
                      value={closingVideoTitle}
                      onChange={(e) => setClosingVideoTitle(e.target.value)}
                      className="w-full px-3 py-2 bg-[#07182B] border border-[#F2EEE3]/25 text-sm text-[#F2EEE3]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-mono-catalog text-[11px] uppercase mb-1 text-[#F2EEE3]/80">
                    Kata-Kata Manis Penutup
                  </label>
                  <textarea
                    rows={4}
                    value={closingMessage}
                    onChange={(e) => setClosingMessage(e.target.value)}
                    placeholder="Tulis ucapan penutup hangat untuk seluruh pengurus dan pengunjung..."
                    className="w-full px-3 py-2 bg-[#07182B] border border-[#F2EEE3]/25 text-sm text-[#F2EEE3]"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="py-2.5 px-5 bg-[#F2B35E] text-[#07182B] font-mono-catalog text-xs font-medium uppercase cursor-pointer"
                  >
                    Simpan Babak Penutup
                  </button>
                </div>
              </form>
            </div>
          )}

        </>
      )}
    </div>
  );
}
