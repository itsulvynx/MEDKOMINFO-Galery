import {
  boolean,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  email: text('email').notNull(),
  displayName: text('display_name'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const adminWhitelist = pgTable('admin_whitelist', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  role: text('role').notNull().default('admin'), // 'super_admin' | 'admin'
  addedBy: text('added_by'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const appSettings = pgTable('app_settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const prokers = pgTable('prokers', {
  id: serial('id').primaryKey(),
  roomNumber: text('room_number').notNull(),
  slug: text('slug').notNull().unique(),
  title: text('title').notNull(),
  subtitle: text('subtitle'),
  description: text('description').notNull(),
  curatorNote: text('curator_note'),
  closingNote: text('closing_note'),
  eventDate: text('event_date').notNull(),
  coverUrl: text('cover_url').notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
  isVisible: boolean('is_visible').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow(),
});

export const artworks = pgTable('artworks', {
  id: serial('id').primaryKey(),
  prokerId: integer('proker_id')
    .references(() => prokers.id, { onDelete: 'cascade' })
    .notNull(),
  catalogNumber: text('catalog_number').notNull(),
  mediaType: text('media_type').notNull().default('image'), // 'image' | 'video'
  mediaUrl: text('media_url').notNull(),
  thumbnailUrl: text('thumbnail_url'),
  title: text('title').notNull(),
  caption: text('caption').notNull(),
  curatorQuote: text('curator_quote'),
  capturedDate: text('captured_date').notNull(),
  aspectRatio: text('aspect_ratio').notNull().default('4:3'),
  isHighlight: boolean('is_highlight').notNull().default(false),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow(),
});

export const mediaAssets = pgTable('media_assets', {
  id: serial('id').primaryKey(),
  mimeType: text('mime_type').notNull(),
  dataBase64: text('data_base64').notNull(),
  sizeBytes: integer('size_bytes').notNull(),
  uploadedBy: text('uploaded_by'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const likes = pgTable(
  'likes',
  {
    id: serial('id').primaryKey(),
    targetType: text('target_type').notNull(), // 'artwork' | 'proker'
    targetId: integer('target_id').notNull(),
    deviceId: text('device_id').notNull(),
    createdAt: timestamp('created_at').defaultNow(),
  },
  (table) => [
    uniqueIndex('likes_target_device_idx').on(
      table.targetType,
      table.targetId,
      table.deviceId
    ),
  ]
);

export const reactions = pgTable(
  'reactions',
  {
    id: serial('id').primaryKey(),
    artworkId: integer('artwork_id')
      .references(() => artworks.id, { onDelete: 'cascade' })
      .notNull(),
    emoji: text('emoji').notNull(),
    deviceId: text('device_id').notNull(),
    createdAt: timestamp('created_at').defaultNow(),
  },
  (table) => [
    uniqueIndex('reactions_artwork_emoji_device_idx').on(
      table.artworkId,
      table.emoji,
      table.deviceId
    ),
  ]
);

export const comments = pgTable('comments', {
  id: serial('id').primaryKey(),
  prokerId: integer('proker_id')
    .references(() => prokers.id, { onDelete: 'cascade' })
    .notNull(),
  authorName: text('author_name').notNull().default('Pengunjung Anonim'),
  message: text('message').notNull(),
  sticker: text('sticker').notNull().default('✉️'),
  status: text('status').notNull().default('pending'), // 'pending' | 'approved' | 'rejected'
  reportCount: integer('report_count').notNull().default(0),
  deviceId: text('device_id').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const quotes = pgTable('quotes', {
  id: serial('id').primaryKey(),
  text: text('text').notNull(),
  author: text('author').notNull(),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow(),
});

export const teamMembers = pgTable('team_members', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  role: text('role').notNull(),
  division: text('division').notNull(),
  photoUrl: text('photo_url'),
  isLeader: boolean('is_leader').notNull().default(false),
  quote: text('quote'),
  sortOrder: integer('sort_order').notNull().default(0),
});
