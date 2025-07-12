import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  integer,
  boolean,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";


export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);


export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  points: integer("points").default(100).notNull(),
  isAdmin: boolean("is_admin").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});


export const items = pgTable("items", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  title: varchar("title").notNull(),
  description: text("description"),
  category: varchar("category").notNull(),
  size: varchar("size").notNull(),
  condition: varchar("condition").notNull(),
  brand: varchar("brand"),
  pointValue: integer("point_value").notNull(),
  tags: text("tags").array(),
  images: text("images").array(),
  status: varchar("status").default("pending").notNull(),
  isAvailable: boolean("is_available").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});


export const swaps = pgTable("swaps", {
  id: serial("id").primaryKey(),
  requesterId: varchar("requester_id").notNull().references(() => users.id),
  ownerId: varchar("owner_id").notNull().references(() => users.id),
  itemId: integer("item_id").notNull().references(() => items.id),
  swapType: varchar("swap_type").notNull(),
  status: varchar("status").default("pending").notNull(),
  message: text("message"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});


export const pointTransactions = pgTable("point_transactions", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  amount: integer("amount").notNull(),
  type: varchar("type").notNull(),
  description: text("description"),
  relatedItemId: integer("related_item_id").references(() => items.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});


export const usersRelations = relations(users, ({ many }) => ({
  items: many(items),
  requestedSwaps: many(swaps, { relationName: "requesterSwaps" }),
  receivedSwaps: many(swaps, { relationName: "ownerSwaps" }),
  pointTransactions: many(pointTransactions),
}));

export const itemsRelations = relations(items, ({ one, many }) => ({
  user: one(users, {
    fields: [items.userId],
    references: [users.id],
  }),
  swaps: many(swaps),
  pointTransactions: many(pointTransactions),
}));

export const swapsRelations = relations(swaps, ({ one }) => ({
  requester: one(users, {
    fields: [swaps.requesterId],
    references: [users.id],
    relationName: "requesterSwaps",
  }),
  owner: one(users, {
    fields: [swaps.ownerId],
    references: [users.id],
    relationName: "ownerSwaps",
  }),
  item: one(items, {
    fields: [swaps.itemId],
    references: [items.id],
  }),
}));

export const pointTransactionsRelations = relations(pointTransactions, ({ one }) => ({
  user: one(users, {
    fields: [pointTransactions.userId],
    references: [users.id],
  }),
  item: one(items, {
    fields: [pointTransactions.relatedItemId],
    references: [items.id],
  }),
}));


export const insertUserSchema = createInsertSchema(users);
export const insertItemSchema = createInsertSchema(items).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const insertSwapSchema = createInsertSchema(swaps).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const insertPointTransactionSchema = createInsertSchema(pointTransactions).omit({
  id: true,
  createdAt: true,
});

export type UpsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertItem = z.infer<typeof insertItemSchema>;
export type Item = typeof items.$inferSelect;
export type InsertSwap = z.infer<typeof insertSwapSchema>;
export type Swap = typeof swaps.$inferSelect;
export type InsertPointTransaction = z.infer<typeof insertPointTransactionSchema>;
export type PointTransaction = typeof pointTransactions.$inferSelect;


export type ItemWithUser = Item & {
  user: User;
};

export type SwapWithDetails = Swap & {
  requester: User;
  owner: User;
  item: ItemWithUser;
};
