import { Request, Response, NextFunction } from 'express';
import { DecodedIdToken } from 'firebase-admin/auth';
import { eq } from 'drizzle-orm';
import { adminAuth } from '../lib/firebase-admin.ts';
import { db } from '../db/index.ts';
import { adminWhitelist, users } from '../db/schema.ts';

export interface AuthRequest extends Request {
  user?: DecodedIdToken;
  adminRole?: string;
}

export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Sesi otentikasi tidak ditemukan.' });
  }

  const token = authHeader.split('Bearer ')[1];
  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    req.user = decodedToken;

    if (decodedToken.uid && decodedToken.email) {
      await db
        .insert(users)
        .values({
          uid: decodedToken.uid,
          email: decodedToken.email.toLowerCase(),
          displayName: decodedToken.name || decodedToken.email.split('@')[0],
        })
        .onConflictDoUpdate({
          target: users.uid,
          set: {
            email: decodedToken.email.toLowerCase(),
            displayName: decodedToken.name || decodedToken.email.split('@')[0],
          },
        });
    }

    next();
  } catch (error) {
    console.error('Error verifying Firebase ID token:', error);
    return res.status(401).json({ error: 'Token otentikasi tidak valid atau kedaluwarsa.' });
  }
};

export const requireWhitelistedAdmin = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const email = req.user?.email?.toLowerCase();
  if (!email) {
    return res.status(403).json({
      error: 'Akses ditolak. Akun Google Anda tidak memiliki alamat email terverifikasi.',
    });
  }

  try {
    const rows = await db
      .select()
      .from(adminWhitelist)
      .where(eq(adminWhitelist.email, email))
      .limit(1);

    if (rows.length === 0) {
      return res.status(403).json({
        error:
          'Maaf, email Anda belum terdaftar dalam daftar kurator Medkominfo HIMATIF. Silakan hubungi admin utama untuk mendapatkan akses.',
      });
    }

    req.adminRole = rows[0].role;
    next();
  } catch (error) {
    console.error('Failed to verify admin whitelist:', error);
    return res.status(500).json({ error: 'Gagal memverifikasi akses admin.' });
  }
};
