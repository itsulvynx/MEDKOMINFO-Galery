export interface Artwork {
  id: number;
  prokerId: number;
  catalogNumber: string;
  mediaType: 'image' | 'video';
  mediaUrl: string;
  thumbnailUrl: string | null;
  title: string;
  caption: string;
  curatorQuote: string | null;
  capturedDate: string;
  aspectRatio: string;
  isHighlight: boolean;
  sortOrder: number;
  likeCount?: number;
  userLiked?: boolean;
  reactionCounts?: Record<string, number>;
  userReactions?: string[];
  prokerTitle?: string;
  prokerSlug?: string;
  roomNumber?: string;
}

export interface Proker {
  id: number;
  roomNumber: string;
  slug: string;
  title: string;
  subtitle: string | null;
  description: string;
  curatorNote: string | null;
  closingNote: string | null;
  eventDate: string;
  coverUrl: string;
  sortOrder: number;
  isVisible: boolean;
  artworkCount?: number;
  likeCount?: number;
  userLiked?: boolean;
}

export interface GuestComment {
  id: number;
  prokerId: number;
  authorName: string;
  message: string;
  sticker: string;
  status?: 'pending' | 'approved' | 'rejected';
  reportCount?: number;
  createdAt: string;
}

export interface QuoteItem {
  id: number;
  text: string;
  author: string;
  isActive: boolean;
}

export interface TeamMember {
  id: number;
  name: string;
  role: string;
  division: string;
  photoUrl: string | null;
  isLeader: boolean;
  quote: string | null;
  sortOrder: number;
}

export interface BacksoundConfig {
  mode: 'builtin' | 'youtube' | 'audio';
  url: string;
  title: string;
}

export interface ClosingData {
  visible: boolean;
  title: string;
  subtitle: string;
  photoUrl: string;
  photoCaption: string;
  videoUrl: string;
  videoTitle: string;
  message: string;
}

export interface WhitelistEntry {
  id: number;
  email: string;
  role: string;
  addedBy: string | null;
  createdAt: string;
}

export interface AdminUser {
  email: string;
  displayName: string;
  role: string;
}
