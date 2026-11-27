import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { and, asc, desc, eq, gte, inArray, sql } from 'drizzle-orm';
import { db } from './src/db/index.ts';
import {
  adminWhitelist,
  appSettings,
  artworks,
  comments,
  likes,
  mediaAssets,
  prokers,
  quotes,
  reactions,
  teamMembers,
} from './src/db/schema.ts';
import { ensureSeeded } from './src/db/seed.ts';
import { AuthRequest, requireAuth, requireWhitelistedAdmin } from './src/middleware/auth.ts';
import { containsLink, containsProfanity } from './src/utils/moderation.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ALLOWED_EMOJIS = ['😍', '🔥', '😂', '🥹', '👏'] as const;
const ALLOWED_STICKERS = ['✉️', '📸', '✨', '☕', '🌿', '💌', '🎞️'] as const;

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 60);
}

function isSafeMediaUrl(url: string): boolean {
  if (!url) return false;
  if (url.startsWith('/api/media/') || url.startsWith('/src/assets/')) {
    return true;
  }
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

async function getSettingsMap(): Promise<Record<string, string>> {
  const rows = await db.select().from(appSettings);
  const map: Record<string, string> = {};
  for (const r of rows) {
    map[r.key] = r.value;
  }
  return map;
}

function buildClosingData(settings: Record<string, string>) {
  return {
    visible: settings.closing_visible !== 'false',
    title: settings.closing_title || 'Epilog Kabinet · Kisah Perjalanan Kita',
    subtitle: settings.closing_subtitle || 'Foto Bersama & Film Penutup Periode 2026/2027',
    photoUrl:
      settings.closing_photo_url || '/src/assets/images/foto_bersama_akhir_1795791766079.jpg',
    photoCaption:
      settings.closing_photo_caption ||
      'Foto bersama seluruh keluarga besar Medkominfo HIMATIF 2026/2027.',
    videoUrl: settings.closing_video_url || '',
    videoTitle: settings.closing_video_title || 'Film Perjalanan Kita',
    message: settings.closing_message || '',
  };
}

function buildBacksoundData(settings: Record<string, string>) {
  return {
    mode: (settings.backsound_mode as 'builtin' | 'youtube' | 'audio') || 'builtin',
    url: settings.backsound_url || '',
    title: settings.backsound_title || 'Piano Latar Museum',
  };
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '10mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true });
  });

  // Serve compressed uploaded media from PostgreSQL
  app.get('/api/media/:id', async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).send('Invalid media ID');
    }
    try {
      const rows = await db
        .select()
        .from(mediaAssets)
        .where(eq(mediaAssets.id, id))
        .limit(1);
      if (rows.length === 0) {
        return res.status(404).send('Media not found');
      }
      const asset = rows[0];
      const buffer = Buffer.from(asset.dataBase64, 'base64');
      res.setHeader('Content-Type', asset.mimeType);
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      res.send(buffer);
    } catch (err) {
      console.error('Error serving media:', err);
      res.status(500).send('Error loading media');
    }
  });

  // Lobi data: highlights, most stamped, random quote, visitor counter
  app.get('/api/lobi', async (req, res) => {
    try {
      await ensureSeeded();
      const deviceId = String(req.headers['x-device-id'] || req.query.deviceId || '');
      const incrementVisit = req.query.visit === '1';

      if (incrementVisit) {
        await db
          .insert(appSettings)
          .values({ key: 'visitor_counter', value: '1' })
          .onConflictDoUpdate({
            target: appSettings.key,
            set: {
              value: sql`(COALESCE(NULLIF(${appSettings.value}, ''), '0')::integer + 1)::text`,
              updatedAt: new Date(),
            },
          });
      }

      const [counterRow] = await db
        .select()
        .from(appSettings)
        .where(eq(appSettings.key, 'visitor_counter'))
        .limit(1);
      const visitorCount = Number(counterRow?.value || 1);

      const activeQuotes = await db
        .select()
        .from(quotes)
        .where(eq(quotes.isActive, true));

      const visibleProkers = await db
        .select()
        .from(prokers)
        .where(eq(prokers.isVisible, true))
        .orderBy(asc(prokers.sortOrder), asc(prokers.id));

      const visibleIds = visibleProkers.map((p) => p.id);
      const prokerMap = new Map(visibleProkers.map((p) => [p.id, p]));

      const allArtworks =
        visibleIds.length > 0
          ? await db
              .select()
              .from(artworks)
              .where(inArray(artworks.prokerId, visibleIds))
              .orderBy(asc(artworks.sortOrder), asc(artworks.id))
          : [];

      const artworkIds = allArtworks.map((a) => a.id);

      const allLikes =
        artworkIds.length > 0
          ? await db
              .select()
              .from(likes)
              .where(and(eq(likes.targetType, 'artwork'), inArray(likes.targetId, artworkIds)))
          : [];

      const allReactions =
        artworkIds.length > 0
          ? await db
              .select()
              .from(reactions)
              .where(inArray(reactions.artworkId, artworkIds))
          : [];

      const likeCountMap = new Map<number, number>();
      const userLikedSet = new Set<number>();
      for (const l of allLikes) {
        likeCountMap.set(l.targetId, (likeCountMap.get(l.targetId) || 0) + 1);
        if (deviceId && l.deviceId === deviceId) {
          userLikedSet.add(l.targetId);
        }
      }

      const reactionMap = new Map<number, Record<string, number>>();
      const userReactionMap = new Map<number, string[]>();
      for (const r of allReactions) {
        const current = reactionMap.get(r.artworkId) || {};
        current[r.emoji] = (current[r.emoji] || 0) + 1;
        reactionMap.set(r.artworkId, current);
        if (deviceId && r.deviceId === deviceId) {
          const list = userReactionMap.get(r.artworkId) || [];
          list.push(r.emoji);
          userReactionMap.set(r.artworkId, list);
        }
      }

      const enriched = allArtworks.map((art) => {
        const parent = prokerMap.get(art.prokerId);
        return {
          ...art,
          prokerTitle: parent?.title || '',
          prokerSlug: parent?.slug || '',
          roomNumber: parent?.roomNumber || '',
          likeCount: likeCountMap.get(art.id) || 0,
          userLiked: userLikedSet.has(art.id),
          reactionCounts: reactionMap.get(art.id) || {},
          userReactions: userReactionMap.get(art.id) || [],
        };
      });

      const highlights = enriched.filter((a) => a.isHighlight).slice(0, 4);
      const mostStamped = [...enriched]
        .sort((a, b) => b.likeCount - a.likeCount || a.id - b.id)
        .slice(0, 4);

      const settingsMap = await getSettingsMap();

      res.json({
        visitorCount,
        quotes: activeQuotes,
        highlights: highlights.length > 0 ? highlights : enriched.slice(0, 4),
        mostStamped,
        backsound: buildBacksoundData(settingsMap),
        closing: buildClosingData(settingsMap),
        stats: {
          prokerCount: visibleProkers.length,
          artworkCount: enriched.length,
        },
      });
    } catch (err) {
      console.error('Error loading lobi:', err);
      res.status(500).json({ error: 'Gagal memuat lobi museum.' });
    }
  });

  // Denah Ruangan: list of visible prokers
  app.get('/api/prokers', async (req, res) => {
    try {
      await ensureSeeded();
      const deviceId = String(req.headers['x-device-id'] || '');

      const visibleProkers = await db
        .select()
        .from(prokers)
        .where(eq(prokers.isVisible, true))
        .orderBy(asc(prokers.sortOrder), asc(prokers.id));

      const prokerIds = visibleProkers.map((p) => p.id);
      const artCounts = new Map<number, number>();
      const likeCounts = new Map<number, number>();
      const userLiked = new Set<number>();

      if (prokerIds.length > 0) {
        const arts = await db
          .select({ id: artworks.id, prokerId: artworks.prokerId })
          .from(artworks)
          .where(inArray(artworks.prokerId, prokerIds));
        for (const a of arts) {
          artCounts.set(a.prokerId, (artCounts.get(a.prokerId) || 0) + 1);
        }

        const prokerLikes = await db
          .select()
          .from(likes)
          .where(and(eq(likes.targetType, 'proker'), inArray(likes.targetId, prokerIds)));
        for (const l of prokerLikes) {
          likeCounts.set(l.targetId, (likeCounts.get(l.targetId) || 0) + 1);
          if (deviceId && l.deviceId === deviceId) {
            userLiked.add(l.targetId);
          }
        }
      }

      const data = visibleProkers.map((p) => ({
        ...p,
        artworkCount: artCounts.get(p.id) || 0,
        likeCount: likeCounts.get(p.id) || 0,
        userLiked: userLiked.has(p.id),
      }));

      const settingsMap = await getSettingsMap();

      res.json({
        prokers: data,
        closing: buildClosingData(settingsMap),
      });
    } catch (err) {
      console.error('Error fetching prokers:', err);
      res.status(500).json({ error: 'Gagal memuat denah ruangan.' });
    }
  });

  // Ruang Pamer: single proker + artworks + approved comments
  app.get('/api/prokers/:slug', async (req, res) => {
    try {
      await ensureSeeded();
      const deviceId = String(req.headers['x-device-id'] || '');
      const slug = req.params.slug;

      const [proker] = await db
        .select()
        .from(prokers)
        .where(and(eq(prokers.slug, slug), eq(prokers.isVisible, true)))
        .limit(1);

      if (!proker) {
        return res.status(404).json({ error: 'Ruang pamer tidak ditemukan.' });
      }

      const roomArtworks = await db
        .select()
        .from(artworks)
        .where(eq(artworks.prokerId, proker.id))
        .orderBy(asc(artworks.sortOrder), asc(artworks.id));

      const prokerLikes = await db
        .select()
        .from(likes)
        .where(and(eq(likes.targetType, 'proker'), eq(likes.targetId, proker.id)));

      const artIds = roomArtworks.map((a) => a.id);
      const artLikes =
        artIds.length > 0
          ? await db
              .select()
              .from(likes)
              .where(and(eq(likes.targetType, 'artwork'), inArray(likes.targetId, artIds)))
          : [];
      const artReactions =
        artIds.length > 0
          ? await db
              .select()
              .from(reactions)
              .where(inArray(reactions.artworkId, artIds))
          : [];

      const approvedComments = await db
        .select({
          id: comments.id,
          prokerId: comments.prokerId,
          authorName: comments.authorName,
          message: comments.message,
          sticker: comments.sticker,
          createdAt: comments.createdAt,
        })
        .from(comments)
        .where(and(eq(comments.prokerId, proker.id), eq(comments.status, 'approved')))
        .orderBy(desc(comments.createdAt), desc(comments.id));

      const enrichedArtworks = roomArtworks.map((art) => {
        const likesForArt = artLikes.filter((l) => l.targetId === art.id);
        const reactionsForArt = artReactions.filter((r) => r.artworkId === art.id);
        const counts: Record<string, number> = {};
        const mine: string[] = [];
        for (const r of reactionsForArt) {
          counts[r.emoji] = (counts[r.emoji] || 0) + 1;
          if (deviceId && r.deviceId === deviceId) {
            mine.push(r.emoji);
          }
        }
        return {
          ...art,
          likeCount: likesForArt.length,
          userLiked: Boolean(deviceId && likesForArt.some((l) => l.deviceId === deviceId)),
          reactionCounts: counts,
          userReactions: mine,
        };
      });

      res.json({
        proker: {
          ...proker,
          likeCount: prokerLikes.length,
          userLiked: Boolean(deviceId && prokerLikes.some((l) => l.deviceId === deviceId)),
        },
        artworks: enrichedArtworks,
        comments: approvedComments,
      });
    } catch (err) {
      console.error('Error loading room:', err);
      res.status(500).json({ error: 'Gagal memuat ruang pamer.' });
    }
  });

  // Tentang Medkominfo
  app.get('/api/about', async (_req, res) => {
    try {
      await ensureSeeded();
      const members = await db
        .select()
        .from(teamMembers)
        .orderBy(asc(teamMembers.sortOrder), asc(teamMembers.id));
      const settingsMap = await getSettingsMap();
      res.json({
        members,
        curatorPhotoUrl:
          settingsMap.curator_photo_url ||
          '/src/assets/images/proker1_raker_1795774773977.jpg',
        closing: buildClosingData(settingsMap),
      });
    } catch (err) {
      console.error('Error loading about:', err);
      res.status(500).json({ error: 'Gagal memuat data tim Medkominfo.' });
    }
  });

  // Stempel Like toggle (anonymous per deviceId)
  app.post('/api/likes/toggle', async (req, res) => {
    const { targetType, targetId, deviceId } = req.body || {};
    if (
      (targetType !== 'artwork' && targetType !== 'proker') ||
      !Number.isInteger(Number(targetId)) ||
      typeof deviceId !== 'string' ||
      deviceId.trim().length < 6
    ) {
      return res.status(400).json({ error: 'Permintaan stempel tidak valid.' });
    }

    const id = Number(targetId);
    const dev = deviceId.trim().slice(0, 80);

    try {
      const existing = await db
        .select()
        .from(likes)
        .where(
          and(
            eq(likes.targetType, targetType),
            eq(likes.targetId, id),
            eq(likes.deviceId, dev)
          )
        )
        .limit(1);

      let liked = false;
      if (existing.length > 0) {
        await db.delete(likes).where(eq(likes.id, existing[0].id));
        liked = false;
      } else {
        await db.insert(likes).values({ targetType, targetId: id, deviceId: dev });
        liked = true;
      }

      const allRows = await db
        .select({ id: likes.id })
        .from(likes)
        .where(and(eq(likes.targetType, targetType), eq(likes.targetId, id)));

      res.json({ liked, count: allRows.length });
    } catch (err) {
      console.error('Error toggling stempel:', err);
      res.status(500).json({ error: 'Gagal memproses stempel.' });
    }
  });

  // Emoji Reaction toggle
  app.post('/api/reactions/toggle', async (req, res) => {
    const { artworkId, emoji, deviceId } = req.body || {};
    if (
      !Number.isInteger(Number(artworkId)) ||
      !ALLOWED_EMOJIS.includes(emoji) ||
      typeof deviceId !== 'string' ||
      deviceId.trim().length < 6
    ) {
      return res.status(400).json({ error: 'Permintaan reaksi tidak valid.' });
    }

    const id = Number(artworkId);
    const dev = deviceId.trim().slice(0, 80);

    try {
      const existing = await db
        .select()
        .from(reactions)
        .where(
          and(
            eq(reactions.artworkId, id),
            eq(reactions.emoji, emoji),
            eq(reactions.deviceId, dev)
          )
        )
        .limit(1);

      let active = false;
      if (existing.length > 0) {
        await db.delete(reactions).where(eq(reactions.id, existing[0].id));
        active = false;
      } else {
        await db.insert(reactions).values({ artworkId: id, emoji, deviceId: dev });
        active = true;
      }

      const allRows = await db
        .select()
        .from(reactions)
        .where(eq(reactions.artworkId, id));

      const counts: Record<string, number> = {};
      const userReactions: string[] = [];
      for (const r of allRows) {
        counts[r.emoji] = (counts[r.emoji] || 0) + 1;
        if (r.deviceId === dev) {
          userReactions.push(r.emoji);
        }
      }

      res.json({ active, counts, userReactions });
    } catch (err) {
      console.error('Error toggling reaction:', err);
      res.status(500).json({ error: 'Gagal menyimpan reaksi.' });
    }
  });

  // Guestbook / Kartu Pos submission with moderation, profanity filter, link block, rate limit & honeypot
  app.post('/api/comments', async (req, res) => {
    const { prokerId, authorName, message, sticker, deviceId, honeypot } = req.body || {};

    // Honeypot anti-bot: silently accept without writing
    if (typeof honeypot === 'string' && honeypot.trim().length > 0) {
      return res.json({
        ok: true,
        status: 'pending',
        notice: 'Kartu pos diterima untuk ditinjau kurator.',
      });
    }

    if (
      !Number.isInteger(Number(prokerId)) ||
      typeof message !== 'string' ||
      typeof deviceId !== 'string' ||
      deviceId.trim().length < 6
    ) {
      return res.status(400).json({ error: 'Data kartu pos belum lengkap.' });
    }

    const cleanMessage = message.trim();
    const cleanAuthor =
      typeof authorName === 'string' && authorName.trim().length > 0
        ? authorName.trim().slice(0, 40)
        : 'Pengunjung Anonim';
    const cleanSticker = ALLOWED_STICKERS.includes(sticker) ? sticker : '✉️';
    const dev = deviceId.trim().slice(0, 80);

    if (cleanMessage.length === 0 || cleanMessage.length > 140) {
      return res
        .status(400)
        .json({ error: 'Ucapan harus diisi dan maksimal 140 karakter ya.' });
    }

    if (containsLink(cleanMessage) || containsLink(cleanAuthor)) {
      return res.status(400).json({
        error: 'Kartu pos tidak boleh memuat tautan atau alamat situs web.',
      });
    }

    if (containsProfanity(cleanMessage) || containsProfanity(cleanAuthor)) {
      return res.status(400).json({
        error: 'Yuk jaga suasana museum tetap hangat dengan bahasa yang santun.',
      });
    }

    try {
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
      const recent = await db
        .select({ id: comments.id })
        .from(comments)
        .where(
          and(eq(comments.deviceId, dev), gte(comments.createdAt, tenMinutesAgo))
        );

      if (recent.length >= 3) {
        return res.status(429).json({
          error:
            'Pelan-pelan ya! Maksimal 3 kartu pos per 10 menit dari perangkat yang sama.',
        });
      }

      const [autoSetting] = await db
        .select()
        .from(appSettings)
        .where(eq(appSettings.key, 'guestbook_auto_approve'))
        .limit(1);

      const status = autoSetting?.value === 'true' ? 'approved' : 'pending';

      const [inserted] = await db
        .insert(comments)
        .values({
          prokerId: Number(prokerId),
          authorName: cleanAuthor,
          message: cleanMessage,
          sticker: cleanSticker,
          status,
          deviceId: dev,
        })
        .returning({
          id: comments.id,
          prokerId: comments.prokerId,
          authorName: comments.authorName,
          message: comments.message,
          sticker: comments.sticker,
          status: comments.status,
          createdAt: comments.createdAt,
        });

      res.json({
        ok: true,
        status,
        comment: inserted,
        notice:
          status === 'approved'
            ? 'Kartu pos kamu langsung tertempel di dinding buku tamu!'
            : 'Kartu pos diterima! Akan tampil setelah dicek sebentar oleh kurator.',
      });
    } catch (err) {
      console.error('Error saving comment:', err);
      res.status(500).json({ error: 'Gagal mengirim kartu pos.' });
    }
  });

  // Report inappropriate comment
  app.post('/api/comments/:id/report', async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'ID komentar tidak valid.' });
    }
    try {
      await db
        .update(comments)
        .set({ reportCount: sql`${comments.reportCount} + 1` })
        .where(eq(comments.id, id));
      res.json({ ok: true });
    } catch (err) {
      console.error('Error reporting comment:', err);
      res.status(500).json({ error: 'Gagal melaporkan kartu pos.' });
    }
  });

  // =========================
  // ADMIN ROUTES (WHITELISTED)
  // =========================
  app.get('/api/admin/me', requireAuth, requireWhitelistedAdmin, (req: AuthRequest, res) => {
    res.json({
      email: req.user?.email?.toLowerCase(),
      displayName: req.user?.name || req.user?.email,
      role: req.adminRole,
    });
  });

  app.get('/api/admin/overview', requireAuth, requireWhitelistedAdmin, async (_req, res) => {
    try {
      await ensureSeeded();
      const allProkers = await db
        .select()
        .from(prokers)
        .orderBy(asc(prokers.sortOrder), asc(prokers.id));
      const allArtworks = await db
        .select()
        .from(artworks)
        .orderBy(asc(artworks.sortOrder), asc(artworks.id));
      const allComments = await db
        .select()
        .from(comments)
        .orderBy(desc(comments.createdAt), desc(comments.id));
      const allQuotes = await db
        .select()
        .from(quotes)
        .orderBy(desc(quotes.id));
      const whitelist = await db
        .select()
        .from(adminWhitelist)
        .orderBy(asc(adminWhitelist.id));
      const members = await db
        .select()
        .from(teamMembers)
        .orderBy(asc(teamMembers.sortOrder), asc(teamMembers.id));
      const settingsMap = await getSettingsMap();

      res.json({
        prokers: allProkers,
        artworks: allArtworks,
        comments: allComments,
        quotes: allQuotes,
        whitelist,
        members,
        settings: settingsMap,
      });
    } catch (err) {
      console.error('Admin overview error:', err);
      res.status(500).json({ error: 'Gagal memuat panel kurator.' });
    }
  });

  // Upload compressed image or audio file to DB
  app.post('/api/admin/upload', requireAuth, requireWhitelistedAdmin, async (req: AuthRequest, res) => {
    const { mimeType, dataBase64 } = req.body || {};
    const allowedImage = ['image/jpeg', 'image/webp', 'image/png'];
    const allowedAudio = [
      'audio/mpeg',
      'audio/mp3',
      'audio/ogg',
      'audio/wav',
      'audio/mp4',
      'audio/x-m4a',
      'audio/aac',
    ];
    const isImage = allowedImage.includes(mimeType);
    const isAudio = allowedAudio.includes(mimeType);

    if ((!isImage && !isAudio) || typeof dataBase64 !== 'string' || dataBase64.length === 0) {
      return res.status(400).json({ error: 'Format file tidak didukung (gunakan JPG/PNG/WEBP atau MP3/M4A/OGG).' });
    }

    const cleanB64 = dataBase64.replace(/^data:[^;]+;base64,/, '');
    const buffer = Buffer.from(cleanB64, 'base64');
    const maxBytes = isAudio ? 6.5 * 1024 * 1024 : 2.5 * 1024 * 1024;
    if (buffer.length > maxBytes) {
      return res.status(400).json({
        error: isAudio
          ? 'Ukuran file audio maksimal 6.5MB.'
          : 'Ukuran file foto setelah kompresi melebihi 2.5MB.',
      });
    }

    try {
      const [inserted] = await db
        .insert(mediaAssets)
        .values({
          mimeType,
          dataBase64: cleanB64,
          sizeBytes: buffer.length,
          uploadedBy: req.user?.email || 'admin',
        })
        .returning({ id: mediaAssets.id });

      res.json({ url: `/api/media/${inserted.id}` });
    } catch (err) {
      console.error('Upload error:', err);
      res.status(500).json({ error: 'Gagal menyimpan berkas ke arsip.' });
    }
  });

  // CRUD Proker
  app.post('/api/admin/prokers', requireAuth, requireWhitelistedAdmin, async (req, res) => {
    const {
      roomNumber,
      title,
      subtitle,
      description,
      curatorNote,
      closingNote,
      eventDate,
      coverUrl,
      isVisible,
    } = req.body || {};

    if (!title || !description || !eventDate || !coverUrl || !isSafeMediaUrl(coverUrl)) {
      return res.status(400).json({ error: 'Data proker belum lengkap atau URL cover tidak valid.' });
    }

    try {
      const existing = await db.select({ id: prokers.id }).from(prokers);
      const nextNum = existing.length + 1;
      const room = roomNumber?.trim() || `RUANG ${String(nextNum).padStart(2, '0')}`;
      const baseSlug = slugify(title) || `ruang-${nextNum}`;
      const slug = `${baseSlug}-${Date.now().toString(36).slice(-4)}`;

      const [created] = await db
        .insert(prokers)
        .values({
          roomNumber: room.toUpperCase(),
          slug,
          title: title.trim(),
          subtitle: subtitle?.trim() || null,
          description: description.trim(),
          curatorNote: curatorNote?.trim() || null,
          closingNote:
            closingNote?.trim() || `Terima kasih sudah mampir di ${room.toUpperCase()}.`,
          eventDate: eventDate.trim(),
          coverUrl: coverUrl.trim(),
          sortOrder: nextNum,
          isVisible: isVisible !== false,
        })
        .returning();

      res.json({ proker: created });
    } catch (err) {
      console.error('Create proker error:', err);
      res.status(500).json({ error: 'Gagal membuat proker.' });
    }
  });

  app.patch('/api/admin/prokers/:id', requireAuth, requireWhitelistedAdmin, async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ error: 'ID tidak valid.' });

    const {
      roomNumber,
      title,
      subtitle,
      description,
      curatorNote,
      closingNote,
      eventDate,
      coverUrl,
      isVisible,
      sortOrder,
    } = req.body || {};

    try {
      const updates: Record<string, unknown> = {};
      if (typeof roomNumber === 'string') updates.roomNumber = roomNumber.trim().toUpperCase();
      if (typeof title === 'string') updates.title = title.trim();
      if (subtitle !== undefined) updates.subtitle = subtitle ? String(subtitle).trim() : null;
      if (typeof description === 'string') updates.description = description.trim();
      if (curatorNote !== undefined)
        updates.curatorNote = curatorNote ? String(curatorNote).trim() : null;
      if (closingNote !== undefined)
        updates.closingNote = closingNote ? String(closingNote).trim() : null;
      if (typeof eventDate === 'string') updates.eventDate = eventDate.trim();
      if (typeof coverUrl === 'string' && isSafeMediaUrl(coverUrl)) updates.coverUrl = coverUrl.trim();
      if (typeof isVisible === 'boolean') updates.isVisible = isVisible;
      if (Number.isInteger(sortOrder)) updates.sortOrder = sortOrder;

      const [updated] = await db
        .update(prokers)
        .set(updates)
        .where(eq(prokers.id, id))
        .returning();

      res.json({ proker: updated });
    } catch (err) {
      console.error('Update proker error:', err);
      res.status(500).json({ error: 'Gagal memperbarui proker.' });
    }
  });

  app.delete('/api/admin/prokers/:id', requireAuth, requireWhitelistedAdmin, async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ error: 'ID tidak valid.' });
    try {
      await db.delete(prokers).where(eq(prokers.id, id));
      res.json({ ok: true });
    } catch (err) {
      console.error('Delete proker error:', err);
      res.status(500).json({ error: 'Gagal menghapus proker.' });
    }
  });

  app.post('/api/admin/prokers/reorder', requireAuth, requireWhitelistedAdmin, async (req, res) => {
    const { orderedIds } = req.body || {};
    if (!Array.isArray(orderedIds)) return res.status(400).json({ error: 'Data urutan tidak valid.' });
    try {
      for (let i = 0; i < orderedIds.length; i++) {
        const pid = Number(orderedIds[i]);
        if (Number.isInteger(pid)) {
          await db.update(prokers).set({ sortOrder: i + 1 }).where(eq(prokers.id, pid));
        }
      }
      res.json({ ok: true });
    } catch (err) {
      console.error('Reorder prokers error:', err);
      res.status(500).json({ error: 'Gagal menyimpan urutan proker.' });
    }
  });

  // CRUD Artworks
  app.post('/api/admin/artworks', requireAuth, requireWhitelistedAdmin, async (req, res) => {
    const {
      prokerId,
      catalogNumber,
      mediaType,
      mediaUrl,
      thumbnailUrl,
      title,
      caption,
      curatorQuote,
      capturedDate,
      aspectRatio,
      isHighlight,
    } = req.body || {};

    if (
      !Number.isInteger(Number(prokerId)) ||
      !title ||
      !caption ||
      !mediaUrl ||
      !isSafeMediaUrl(mediaUrl)
    ) {
      return res.status(400).json({ error: 'Data karya belum lengkap atau URL media tidak valid.' });
    }

    try {
      const existing = await db
        .select({ id: artworks.id })
        .from(artworks)
        .where(eq(artworks.prokerId, Number(prokerId)));
      const nextIdx = existing.length + 1;
      const letter = String.fromCharCode(64 + ((nextIdx - 1) % 26) + 1);
      const catNo = catalogNumber?.trim() || `KAT. ${String(prokerId).padStart(2, '0')}-${letter}`;

      const [created] = await db
        .insert(artworks)
        .values({
          prokerId: Number(prokerId),
          catalogNumber: catNo.toUpperCase(),
          mediaType: mediaType === 'video' ? 'video' : 'image',
          mediaUrl: mediaUrl.trim(),
          thumbnailUrl: thumbnailUrl && isSafeMediaUrl(thumbnailUrl) ? thumbnailUrl.trim() : null,
          title: title.trim(),
          caption: caption.trim(),
          curatorQuote: curatorQuote?.trim() || null,
          capturedDate: capturedDate?.trim() || '2026',
          aspectRatio: aspectRatio || '4:3',
          isHighlight: Boolean(isHighlight),
          sortOrder: nextIdx,
        })
        .returning();

      res.json({ artwork: created });
    } catch (err) {
      console.error('Create artwork error:', err);
      res.status(500).json({ error: 'Gagal menambahkan karya.' });
    }
  });

  app.patch('/api/admin/artworks/:id', requireAuth, requireWhitelistedAdmin, async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ error: 'ID tidak valid.' });
    const {
      catalogNumber,
      title,
      caption,
      curatorQuote,
      capturedDate,
      aspectRatio,
      isHighlight,
      mediaUrl,
      thumbnailUrl,
    } = req.body || {};

    try {
      const updates: Record<string, unknown> = {};
      if (typeof catalogNumber === 'string') updates.catalogNumber = catalogNumber.trim().toUpperCase();
      if (typeof title === 'string') updates.title = title.trim();
      if (typeof caption === 'string') updates.caption = caption.trim();
      if (curatorQuote !== undefined)
        updates.curatorQuote = curatorQuote ? String(curatorQuote).trim() : null;
      if (typeof capturedDate === 'string') updates.capturedDate = capturedDate.trim();
      if (typeof aspectRatio === 'string') updates.aspectRatio = aspectRatio;
      if (typeof isHighlight === 'boolean') updates.isHighlight = isHighlight;
      if (typeof mediaUrl === 'string' && isSafeMediaUrl(mediaUrl)) updates.mediaUrl = mediaUrl.trim();
      if (thumbnailUrl !== undefined) {
        updates.thumbnailUrl =
          thumbnailUrl && isSafeMediaUrl(thumbnailUrl) ? String(thumbnailUrl).trim() : null;
      }

      const [updated] = await db
        .update(artworks)
        .set(updates)
        .where(eq(artworks.id, id))
        .returning();

      res.json({ artwork: updated });
    } catch (err) {
      console.error('Update artwork error:', err);
      res.status(500).json({ error: 'Gagal memperbarui karya.' });
    }
  });

  app.delete('/api/admin/artworks/:id', requireAuth, requireWhitelistedAdmin, async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ error: 'ID tidak valid.' });
    try {
      await db.delete(artworks).where(eq(artworks.id, id));
      res.json({ ok: true });
    } catch (err) {
      console.error('Delete artwork error:', err);
      res.status(500).json({ error: 'Gagal menghapus karya.' });
    }
  });

  app.post('/api/admin/artworks/reorder', requireAuth, requireWhitelistedAdmin, async (req, res) => {
    const { orderedIds } = req.body || {};
    if (!Array.isArray(orderedIds)) return res.status(400).json({ error: 'Urutan tidak valid.' });
    try {
      for (let i = 0; i < orderedIds.length; i++) {
        const aid = Number(orderedIds[i]);
        if (Number.isInteger(aid)) {
          await db.update(artworks).set({ sortOrder: i + 1 }).where(eq(artworks.id, aid));
        }
      }
      res.json({ ok: true });
    } catch (err) {
      console.error('Reorder artworks error:', err);
      res.status(500).json({ error: 'Gagal mengatur urutan karya.' });
    }
  });

  // Moderation & Settings
  app.patch('/api/admin/comments/:id', requireAuth, requireWhitelistedAdmin, async (req, res) => {
    const id = Number(req.params.id);
    const { status } = req.body || {};
    if (!Number.isInteger(id) || !['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Status moderasi tidak valid.' });
    }
    try {
      const [updated] = await db
        .update(comments)
        .set({ status })
        .where(eq(comments.id, id))
        .returning();
      res.json({ comment: updated });
    } catch (err) {
      console.error('Moderate comment error:', err);
      res.status(500).json({ error: 'Gagal memperbarui status komentar.' });
    }
  });

  app.delete('/api/admin/comments/:id', requireAuth, requireWhitelistedAdmin, async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ error: 'ID tidak valid.' });
    try {
      await db.delete(comments).where(eq(comments.id, id));
      res.json({ ok: true });
    } catch (err) {
      console.error('Delete comment error:', err);
      res.status(500).json({ error: 'Gagal menghapus komentar.' });
    }
  });

  app.patch('/api/admin/settings', requireAuth, requireWhitelistedAdmin, async (req, res) => {
    const body = req.body || {};
    const pairs: Array<[string, string]> = [];

    if (typeof body.guestbookAutoApprove === 'boolean') {
      pairs.push(['guestbook_auto_approve', body.guestbookAutoApprove ? 'true' : 'false']);
    }
    if (typeof body.backsoundMode === 'string' && ['builtin', 'youtube', 'audio'].includes(body.backsoundMode)) {
      pairs.push(['backsound_mode', body.backsoundMode]);
    }
    if (typeof body.backsoundUrl === 'string') {
      if (body.backsoundUrl === '' || isSafeMediaUrl(body.backsoundUrl)) {
        pairs.push(['backsound_url', body.backsoundUrl.trim()]);
      }
    }
    if (typeof body.backsoundTitle === 'string') {
      pairs.push(['backsound_title', body.backsoundTitle.trim().slice(0, 120)]);
    }
    if (typeof body.closingVisible === 'boolean') {
      pairs.push(['closing_visible', body.closingVisible ? 'true' : 'false']);
    }
    if (typeof body.closingTitle === 'string') {
      pairs.push(['closing_title', body.closingTitle.trim()]);
    }
    if (typeof body.closingSubtitle === 'string') {
      pairs.push(['closing_subtitle', body.closingSubtitle.trim()]);
    }
    if (typeof body.closingPhotoUrl === 'string') {
      if (body.closingPhotoUrl === '' || isSafeMediaUrl(body.closingPhotoUrl)) {
        pairs.push(['closing_photo_url', body.closingPhotoUrl.trim()]);
      }
    }
    if (typeof body.curatorPhotoUrl === 'string') {
      if (body.curatorPhotoUrl === '' || isSafeMediaUrl(body.curatorPhotoUrl)) {
        pairs.push(['curator_photo_url', body.curatorPhotoUrl.trim()]);
      }
    }
    if (typeof body.closingPhotoCaption === 'string') {
      pairs.push(['closing_photo_caption', body.closingPhotoCaption.trim()]);
    }
    if (typeof body.closingVideoUrl === 'string') {
      if (body.closingVideoUrl === '' || isSafeMediaUrl(body.closingVideoUrl)) {
        pairs.push(['closing_video_url', body.closingVideoUrl.trim()]);
      }
    }
    if (typeof body.closingVideoTitle === 'string') {
      pairs.push(['closing_video_title', body.closingVideoTitle.trim()]);
    }
    if (typeof body.closingMessage === 'string') {
      pairs.push(['closing_message', body.closingMessage.trim()]);
    }

    if (pairs.length === 0) {
      return res.status(400).json({ error: 'Tidak ada pengaturan valid yang dikirim.' });
    }

    try {
      for (const [key, value] of pairs) {
        await db
          .insert(appSettings)
          .values({ key, value, updatedAt: new Date() })
          .onConflictDoUpdate({
            target: appSettings.key,
            set: { value, updatedAt: new Date() },
          });
      }
      const updated = await getSettingsMap();
      res.json({ ok: true, settings: updated });
    } catch (err) {
      console.error('Update settings error:', err);
      res.status(500).json({ error: 'Gagal menyimpan pengaturan.' });
    }
  });

  // Team Members CRUD (Ketua & Semua Divisi)
  app.post('/api/admin/team', requireAuth, requireWhitelistedAdmin, async (req, res) => {
    const { name, role, division, photoUrl, isLeader, quote } = req.body || {};
    if (!name?.trim() || !role?.trim() || !division?.trim()) {
      return res.status(400).json({ error: 'Nama, jabatan, dan divisi wajib diisi.' });
    }
    if (photoUrl && !isSafeMediaUrl(photoUrl)) {
      return res.status(400).json({ error: 'URL foto pengurus tidak valid.' });
    }
    try {
      const existing = await db.select({ id: teamMembers.id }).from(teamMembers);
      const [created] = await db
        .insert(teamMembers)
        .values({
          name: name.trim(),
          role: role.trim(),
          division: division.trim(),
          photoUrl: photoUrl ? photoUrl.trim() : null,
          isLeader: Boolean(isLeader),
          quote: quote?.trim() || null,
          sortOrder: existing.length + 1,
        })
        .returning();
      res.json({ member: created });
    } catch (err) {
      console.error('Create team member error:', err);
      res.status(500).json({ error: 'Gagal menambahkan pengurus.' });
    }
  });

  app.patch('/api/admin/team/:id', requireAuth, requireWhitelistedAdmin, async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ error: 'ID tidak valid.' });
    const { name, role, division, photoUrl, isLeader, quote } = req.body || {};
    try {
      const updates: Record<string, unknown> = {};
      if (typeof name === 'string') updates.name = name.trim();
      if (typeof role === 'string') updates.role = role.trim();
      if (typeof division === 'string') updates.division = division.trim();
      if (photoUrl !== undefined) {
        updates.photoUrl = photoUrl && isSafeMediaUrl(photoUrl) ? String(photoUrl).trim() : null;
      }
      if (typeof isLeader === 'boolean') updates.isLeader = isLeader;
      if (quote !== undefined) updates.quote = quote ? String(quote).trim() : null;

      const [updated] = await db
        .update(teamMembers)
        .set(updates)
        .where(eq(teamMembers.id, id))
        .returning();
      res.json({ member: updated });
    } catch (err) {
      console.error('Update team member error:', err);
      res.status(500).json({ error: 'Gagal memperbarui data pengurus.' });
    }
  });

  app.delete('/api/admin/team/:id', requireAuth, requireWhitelistedAdmin, async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ error: 'ID tidak valid.' });
    try {
      await db.delete(teamMembers).where(eq(teamMembers.id, id));
      res.json({ ok: true });
    } catch (err) {
      console.error('Delete team member error:', err);
      res.status(500).json({ error: 'Gagal menghapus pengurus.' });
    }
  });

  app.post('/api/admin/team/reorder', requireAuth, requireWhitelistedAdmin, async (req, res) => {
    const { orderedIds } = req.body || {};
    if (!Array.isArray(orderedIds)) return res.status(400).json({ error: 'Urutan tidak valid.' });
    try {
      for (let i = 0; i < orderedIds.length; i++) {
        const tid = Number(orderedIds[i]);
        if (Number.isInteger(tid)) {
          await db.update(teamMembers).set({ sortOrder: i + 1 }).where(eq(teamMembers.id, tid));
        }
      }
      res.json({ ok: true });
    } catch (err) {
      console.error('Reorder team error:', err);
      res.status(500).json({ error: 'Gagal menyimpan urutan pengurus.' });
    }
  });

  // Quotes CRUD
  app.post('/api/admin/quotes', requireAuth, requireWhitelistedAdmin, async (req, res) => {
    const { text, author } = req.body || {};
    if (!text?.trim() || !author?.trim()) {
      return res.status(400).json({ error: 'Teks quote dan nama penulis wajib diisi.' });
    }
    try {
      const [created] = await db
        .insert(quotes)
        .values({ text: text.trim(), author: author.trim(), isActive: true })
        .returning();
      res.json({ quote: created });
    } catch (err) {
      console.error('Create quote error:', err);
      res.status(500).json({ error: 'Gagal menambah quote.' });
    }
  });

  app.delete('/api/admin/quotes/:id', requireAuth, requireWhitelistedAdmin, async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ error: 'ID tidak valid.' });
    try {
      await db.delete(quotes).where(eq(quotes.id, id));
      res.json({ ok: true });
    } catch (err) {
      console.error('Delete quote error:', err);
      res.status(500).json({ error: 'Gagal menghapus quote.' });
    }
  });

  // Whitelist management (super_admin only)
  app.post('/api/admin/whitelist', requireAuth, requireWhitelistedAdmin, async (req: AuthRequest, res) => {
    if (req.adminRole !== 'super_admin') {
      return res.status(403).json({ error: 'Hanya Admin Utama yang dapat menambah email whitelist.' });
    }
    const email = String(req.body?.email || '').trim().toLowerCase();
    const role = req.body?.role === 'super_admin' ? 'super_admin' : 'admin';
    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Alamat email tidak valid.' });
    }
    try {
      const [created] = await db
        .insert(adminWhitelist)
        .values({
          email,
          role,
          addedBy: req.user?.email || 'super_admin',
        })
        .onConflictDoNothing()
        .returning();
      res.json({ entry: created });
    } catch (err) {
      console.error('Whitelist add error:', err);
      res.status(500).json({ error: 'Gagal menambahkan email whitelist.' });
    }
  });

  app.delete('/api/admin/whitelist/:id', requireAuth, requireWhitelistedAdmin, async (req: AuthRequest, res) => {
    if (req.adminRole !== 'super_admin') {
      return res.status(403).json({ error: 'Hanya Admin Utama yang dapat menghapus email whitelist.' });
    }
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ error: 'ID tidak valid.' });

    try {
      const [target] = await db
        .select()
        .from(adminWhitelist)
        .where(eq(adminWhitelist.id, id))
        .limit(1);

      if (!target) return res.status(404).json({ error: 'Email tidak ditemukan.' });
      if (target.email === req.user?.email?.toLowerCase()) {
        return res.status(400).json({ error: 'Tidak dapat menghapus akun Anda sendiri dari whitelist.' });
      }

      await db.delete(adminWhitelist).where(eq(adminWhitelist.id, id));
      res.json({ ok: true });
    } catch (err) {
      console.error('Whitelist delete error:', err);
      res.status(500).json({ error: 'Gagal menghapus email whitelist.' });
    }
  });

  // Vite / Static serving
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const port = Number(process.env.PORT) || 3000;
  app.listen(port, '0.0.0.0', () => {
    console.log(`MEDKOMINFO GALERY server running on port ${port}`);
  });
}

startServer();
