import { pgTable, text, timestamp, boolean, index } from 'drizzle-orm/pg-core'
import { createId } from '@paralleldrive/cuid2'

// ── better-auth required tables ──────────────────────────────────────────────
// Do NOT rename these tables or columns — better-auth expects this exact shape.
// Run `bunx @better-auth/cli generate` to regenerate if you add auth plugins.

export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').notNull(),
  image: text('image'),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull(),
})

export const session = pgTable('session', {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expires_at').notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
})

export const account = pgTable('account', {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at'),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull(),
})

export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at'),
  updatedAt: timestamp('updated_at'),
})

// ── Application tables (SPEC §4) ──────────────────────────────────────────────

export const links = pgTable(
  'links',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => createId()),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    slug: text('slug').notNull().unique(),
    url: text('url').notNull(),
    title: text('title'),
    expiresAt: timestamp('expires_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index('idx_link_user').on(t.userId),
    index('idx_link_slug').on(t.slug),
  ],
)

export const clicks = pgTable(
  'clicks',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => createId()),
    linkId: text('link_id')
      .notNull()
      .references(() => links.id, { onDelete: 'cascade' }),
    clickedAt: timestamp('clicked_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    referrer: text('referrer'),
    browser: text('browser'),
    deviceType: text('device_type'),
    country: text('country'),
  },
  (t) => [index('idx_click_link_at').on(t.linkId, t.clickedAt)],
)
