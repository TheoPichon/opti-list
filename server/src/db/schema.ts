
import { serial, text, pgTable, timestamp, boolean } from 'drizzle-orm/pg-core';

export const tasksTable = pgTable('tasks', {
  id: serial('id').primaryKey(),
  text: text('text').notNull(),
  completed: boolean('completed').notNull().default(false),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// TypeScript type for the table schema
export type Task = typeof tasksTable.$inferSelect;
export type NewTask = typeof tasksTable.$inferInsert;

// Export all tables for proper query building
export const tables = { tasks: tasksTable };
