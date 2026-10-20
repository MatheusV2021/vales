import { sqliteTable, text } from 'drizzle-orm/sqlite-core';
export const wallets = sqliteTable('wallets', { id:text('id').primaryKey(), owner:text('owner').notNull().unique(), token:text('token').notNull().unique() });
export const vouchers = sqliteTable('vouchers', { id:text('id').primaryKey(), wallet:text('wallet').notNull().references(()=>wallets.id), title:text('title').notNull(), description:text('description').notNull(), icon:text('icon').notNull(), color:text('color').notNull(), expires:text('expires').notNull(), created:text('created').notNull(), used:text('used') });
