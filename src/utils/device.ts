const DEVICE_ID_KEY = 'medkominfo_galery_device_id';

export function getDeviceId(): string {
  try {
    let existing = localStorage.getItem(DEVICE_ID_KEY);
    if (!existing || existing.length < 8) {
      existing =
        typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
          ? crypto.randomUUID()
          : `dev-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
      localStorage.setItem(DEVICE_ID_KEY, existing);
    }
    return existing;
  } catch {
    return 'visitor-session-fallback';
  }
}

export interface CompressedImageResult {
  mimeType: 'image/webp' | 'image/jpeg';
  dataBase64: string;
  previewUrl: string;
  sizeBytes: number;
}

/**
 * Automatically compresses image files on the client before uploading.
 * Resizes longest edge to max 1600px and compresses to WebP/JPEG ~82% quality.
 */
export async function compressImageFile(file: File): Promise<CompressedImageResult> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const maxDim = 1600;
      let { width, height } = img;

      if (width > maxDim || height > maxDim) {
        if (width >= height) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas context unavailable'));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      const mimeType: 'image/webp' | 'image/jpeg' = 'image/jpeg';
      const dataUrl = canvas.toDataURL(mimeType, 0.82);
      const base64 = dataUrl.split(',')[1] || '';
      const approxBytes = Math.round((base64.length * 3) / 4);

      resolve({
        mimeType,
        dataBase64: base64,
        previewUrl: dataUrl,
        sizeBytes: approxBytes,
      });
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Gagal membaca berkas gambar.'));
    };

    img.src = objectUrl;
  });
}

export interface ParsedVideo {
  kind: 'youtube' | 'gdrive' | 'direct';
  embedUrl: string;
}

export function parseVideoSource(rawUrl: string): ParsedVideo {
  const url = rawUrl.trim();

  // YouTube patterns (watch?v=, youtu.be/, embed/, shorts/)
  const ytMatch = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{6,})/
  );
  if (ytMatch && ytMatch[1]) {
    return {
      kind: 'youtube',
      embedUrl: `https://www.youtube-nocookie.com/embed/${ytMatch[1]}?rel=0`,
    };
  }

  // Google Drive /file/d/<id>/view or open?id=<id>
  const gdMatch = url.match(/drive\.google\.com\/(?:file\/d\/|open\?id=)([A-Za-z0-9_-]+)/);
  if (gdMatch && gdMatch[1]) {
    return {
      kind: 'gdrive',
      embedUrl: `https://drive.google.com/file/d/${gdMatch[1]}/preview`,
    };
  }

  return {
    kind: 'direct',
    embedUrl: url,
  };
}

export function formatIndonesianDate(isoDate?: string | Date): string {
  if (!isoDate) return '';
  const d = typeof isoDate === 'string' ? new Date(isoDate) : isoDate;
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}
