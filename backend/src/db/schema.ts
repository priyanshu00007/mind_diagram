import { pgTable, text, timestamp, boolean } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  name: text('name'),
  email: text('email'),
  avatarUrl: text('avatar_url'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const folders = pgTable('folders', {
  id: text('id').primaryKey(),
  name: text('name'),
  userId: text('user_id'),
  parentId: text('parent_id'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const diagrams = pgTable('diagrams', {
  id: text('id').primaryKey(),
  userId: text('user_id'),
  name: text('name'),
  code: text('code'),
  theme: text('theme').default('dark'),
  folderId: text('folder_id'),
  isArchived: boolean('is_archived').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});
