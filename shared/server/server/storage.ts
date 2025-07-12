import {
  users,
  items,
  swaps,
  pointTransactions,
  type User,
  type UpsertUser,
  type Item,
  type InsertItem,
  type ItemWithUser,
  type Swap,
  type InsertSwap,
  type SwapWithDetails,
  type PointTransaction,
  type InsertPointTransaction,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, or, sql, count } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserPoints(userId: string, points: number): Promise<void>;
  
  // Item operations
  createItem(item: InsertItem): Promise<Item>;
  getItem(id: number): Promise<ItemWithUser | undefined>;
  getItems(filters?: { 
    status?: string;
    category?: string;
    userId?: string;
    search?: string;
    limit?: number;
  }): Promise<ItemWithUser[]>;
  updateItemStatus(id: number, status: string): Promise<void>;
  updateItemAvailability(id: number, isAvailable: boolean): Promise<void>;
  getUserItems(userId: string): Promise<Item[]>;
  getFeaturedItems(): Promise<ItemWithUser[]>;
  
  // Swap operations
  createSwap(swap: InsertSwap): Promise<Swap>;
  getSwap(id: number): Promise<SwapWithDetails | undefined>;
  getSwaps(filters?: { 
    requesterId?: string;
    ownerId?: string;
    status?: string;
  }): Promise<SwapWithDetails[]>;
  updateSwapStatus(id: number, status: string): Promise<void>;
  
  // Point transaction operations
  createPointTransaction(transaction: InsertPointTransaction): Promise<PointTransaction>;
  getUserPointTransactions(userId: string): Promise<PointTransaction[]>;
  
  // Admin operations
  getPendingItems(): Promise<ItemWithUser[]>;
  getStats(): Promise<{
    totalUsers: number;
    totalItems: number;
    totalSwaps: number;
    pendingItems: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateUserPoints(userId: string, points: number): Promise<void> {
    await db
      .update(users)
      .set({ points, updatedAt: new Date() })
      .where(eq(users.id, userId));
  }

  // Item operations
  async createItem(item: InsertItem): Promise<Item> {
    const [newItem] = await db.insert(items).values(item).returning();
    return newItem;
  }

  async getItem(id: number): Promise<ItemWithUser | undefined> {
    const [item] = await db
      .select()
      .from(items)
      .leftJoin(users, eq(items.userId, users.id))
      .where(eq(items.id, id));
    
    if (!item) return undefined;
    
    return {
      ...item.items,
      user: item.users!,
    };
  }

  async getItems(filters?: { 
    status?: string;
    category?: string;
    userId?: string;
    search?: string;
    limit?: number;
  }): Promise<ItemWithUser[]> {
    let query = db
      .select()
      .from(items)
      .leftJoin(users, eq(items.userId, users.id))
      .orderBy(desc(items.createdAt));

    const conditions = [];
    
    if (filters?.status) {
      conditions.push(eq(items.status, filters.status));
    }
    
    if (filters?.category) {
      conditions.push(eq(items.category, filters.category));
    }
    
    if (filters?.userId) {
      conditions.push(eq(items.userId, filters.userId));
    }
    
    if (filters?.search) {
      conditions.push(
        or(
          sql`${items.title} ILIKE ${'%' + filters.search + '%'}`,
          sql`${items.description} ILIKE ${'%' + filters.search + '%'}`,
          sql`${items.brand} ILIKE ${'%' + filters.search + '%'}`
        )
      );
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    if (filters?.limit) {
      query = query.limit(filters.limit) as any;
    }

    const results = await query;
    
    return results.map(result => ({
      ...result.items,
      user: result.users!,
    }));
  }

  async updateItemStatus(id: number, status: string): Promise<void> {
    await db
      .update(items)
      .set({ status, updatedAt: new Date() })
      .where(eq(items.id, id));
  }

  async updateItemAvailability(id: number, isAvailable: boolean): Promise<void> {
    await db
      .update(items)
      .set({ isAvailable, updatedAt: new Date() })
      .where(eq(items.id, id));
  }

  async getUserItems(userId: string): Promise<Item[]> {
    return await db
      .select()
      .from(items)
      .where(eq(items.userId, userId))
      .orderBy(desc(items.createdAt));
  }

  async getFeaturedItems(): Promise<ItemWithUser[]> {
    return await this.getItems({ status: "approved", limit: 6 });
  }

  // Swap operations
  async createSwap(swap: InsertSwap): Promise<Swap> {
    const [newSwap] = await db.insert(swaps).values(swap).returning();
    return newSwap;
  }

  async getSwap(id: number): Promise<SwapWithDetails | undefined> {
    const [swap] = await db
      .select()
      .from(swaps)
      .leftJoin(users, eq(swaps.requesterId, users.id))
      .leftJoin(items, eq(swaps.itemId, items.id))
      .where(eq(swaps.id, id));
    
    if (!swap) return undefined;
    
    // Get owner and item details
    const [owner] = await db
      .select()
      .from(users)
      .where(eq(users.id, swap.items!.userId));
    
    return {
      ...swap.swaps,
      requester: swap.users!,
      owner: owner,
      item: {
        ...swap.items!,
        user: owner,
      },
    };
  }

  async getSwaps(filters?: { 
    requesterId?: string;
    ownerId?: string;
    status?: string;
  }): Promise<SwapWithDetails[]> {
    let query = db
      .select()
      .from(swaps)
      .leftJoin(users, eq(swaps.requesterId, users.id))
      .leftJoin(items, eq(swaps.itemId, items.id))
      .orderBy(desc(swaps.createdAt));

    const conditions = [];
    
    if (filters?.requesterId) {
      conditions.push(eq(swaps.requesterId, filters.requesterId));
    }
    
    if (filters?.ownerId) {
      conditions.push(eq(swaps.ownerId, filters.ownerId));
    }
    
    if (filters?.status) {
      conditions.push(eq(swaps.status, filters.status));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    const results = await query;
    
    // Get owner details for each swap
    const swapsWithDetails = await Promise.all(
      results.map(async (result) => {
        const [owner] = await db
          .select()
          .from(users)
          .where(eq(users.id, result.items!.userId));
        
        return {
          ...result.swaps,
          requester: result.users!,
          owner: owner,
          item: {
            ...result.items!,
            user: owner,
          },
        };
      })
    );
    
    return swapsWithDetails;
  }

  async updateSwapStatus(id: number, status: string): Promise<void> {
    await db
      .update(swaps)
      .set({ status, updatedAt: new Date() })
      .where(eq(swaps.id, id));
  }

  // Point transaction operations
  async createPointTransaction(transaction: InsertPointTransaction): Promise<PointTransaction> {
    const [newTransaction] = await db
      .insert(pointTransactions)
      .values(transaction)
      .returning();
    return newTransaction;
  }

  async getUserPointTransactions(userId: string): Promise<PointTransaction[]> {
    return await db
      .select()
      .from(pointTransactions)
      .where(eq(pointTransactions.userId, userId))
      .orderBy(desc(pointTransactions.createdAt));
  }

  // Admin operations
  async getPendingItems(): Promise<ItemWithUser[]> {
    return await this.getItems({ status: "pending" });
  }

  async getStats(): Promise<{
    totalUsers: number;
    totalItems: number;
    totalSwaps: number;
    pendingItems: number;
  }> {
    const [userCount] = await db.select({ count: count() }).from(users);
    const [itemCount] = await db.select({ count: count() }).from(items);
    const [swapCount] = await db.select({ count: count() }).from(swaps);
    const [pendingCount] = await db
      .select({ count: count() })
      .from(items)
      .where(eq(items.status, "pending"));

    return {
      totalUsers: userCount.count,
      totalItems: itemCount.count,
      totalSwaps: swapCount.count,
      pendingItems: pendingCount.count,
    };
  }
}

export const storage = new DatabaseStorage();
