import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertItemSchema, insertSwapSchema, insertPointTransactionSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Item routes
  app.post("/api/items", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const itemData = insertItemSchema.parse({
        ...req.body,
        userId,
      });
      
      const item = await storage.createItem(itemData);
      res.json(item);
    } catch (error) {
      console.error("Error creating item:", error);
      res.status(400).json({ message: "Failed to create item" });
    }
  });

  app.get("/api/items", async (req, res) => {
    try {
      const { status, category, search, limit } = req.query;
      const items = await storage.getItems({
        status: status as string || "approved",
        category: category as string,
        search: search as string,
        limit: limit ? parseInt(limit as string) : undefined,
      });
      res.json(items);
    } catch (error) {
      console.error("Error fetching items:", error);
      res.status(500).json({ message: "Failed to fetch items" });
    }
  });

  app.get("/api/items/featured", async (req, res) => {
    try {
      const items = await storage.getFeaturedItems();
      res.json(items);
    } catch (error) {
      console.error("Error fetching featured items:", error);
      res.status(500).json({ message: "Failed to fetch featured items" });
    }
  });

  app.get("/api/items/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const item = await storage.getItem(id);
      if (!item) {
        return res.status(404).json({ message: "Item not found" });
      }
      res.json(item);
    } catch (error) {
      console.error("Error fetching item:", error);
      res.status(500).json({ message: "Failed to fetch item" });
    }
  });

  app.get("/api/users/:userId/items", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.params.userId;
      const currentUserId = req.user.claims.sub;
      
      if (userId !== currentUserId) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      const items = await storage.getUserItems(userId);
      res.json(items);
    } catch (error) {
      console.error("Error fetching user items:", error);
      res.status(500).json({ message: "Failed to fetch user items" });
    }
  });

  // Swap routes
  app.post("/api/swaps", isAuthenticated, async (req: any, res) => {
    try {
      const requesterId = req.user.claims.sub;
      const swapData = insertSwapSchema.parse({
        ...req.body,
        requesterId,
      });
      
      const swap = await storage.createSwap(swapData);
      res.json(swap);
    } catch (error) {
      console.error("Error creating swap:", error);
      res.status(400).json({ message: "Failed to create swap" });
    }
  });

  app.get("/api/swaps", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { type } = req.query;
      
      let filters: any = {};
      if (type === "requested") {
        filters.requesterId = userId;
      } else if (type === "received") {
        filters.ownerId = userId;
      }
      
      const swaps = await storage.getSwaps(filters);
      res.json(swaps);
    } catch (error) {
      console.error("Error fetching swaps:", error);
      res.status(500).json({ message: "Failed to fetch swaps" });
    }
  });

  app.patch("/api/swaps/:id/status", isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;
      
      await storage.updateSwapStatus(id, status);
      
      // If swap is completed, handle point transactions
      if (status === "completed") {
        const swap = await storage.getSwap(id);
        if (swap) {
          if (swap.swapType === "points") {
            // Deduct points from requester
            const requester = await storage.getUser(swap.requesterId);
            if (requester) {
              await storage.updateUserPoints(
                swap.requesterId, 
                requester.points - swap.item.pointValue
              );
              await storage.createPointTransaction({
                userId: swap.requesterId,
                amount: -swap.item.pointValue,
                type: "spent",
                description: `Redeemed ${swap.item.title}`,
                relatedItemId: swap.itemId,
              });
            }
            
            // Add points to owner
            const owner = await storage.getUser(swap.ownerId);
            if (owner) {
              await storage.updateUserPoints(
                swap.ownerId, 
                owner.points + swap.item.pointValue
              );
              await storage.createPointTransaction({
                userId: swap.ownerId,
                amount: swap.item.pointValue,
                type: "earned",
                description: `Earned from ${swap.item.title}`,
                relatedItemId: swap.itemId,
              });
            }
          }
          
          // Mark item as unavailable
          await storage.updateItemAvailability(swap.itemId, false);
        }
      }
      
      res.json({ message: "Swap status updated" });
    } catch (error) {
      console.error("Error updating swap status:", error);
      res.status(400).json({ message: "Failed to update swap status" });
    }
  });

  // Point transaction routes
  app.get("/api/users/:userId/transactions", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.params.userId;
      const currentUserId = req.user.claims.sub;
      
      if (userId !== currentUserId) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      const transactions = await storage.getUserPointTransactions(userId);
      res.json(transactions);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });

  // Admin routes
  app.get("/api/admin/items/pending", isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const items = await storage.getPendingItems();
      res.json(items);
    } catch (error) {
      console.error("Error fetching pending items:", error);
      res.status(500).json({ message: "Failed to fetch pending items" });
    }
  });

  app.patch("/api/admin/items/:id/status", isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const id = parseInt(req.params.id);
      const { status } = req.body;
      
      await storage.updateItemStatus(id, status);
      
      // If item is approved, give bonus points to the user
      if (status === "approved") {
        const item = await storage.getItem(id);
        if (item) {
          const owner = await storage.getUser(item.userId);
          if (owner) {
            const bonusPoints = 10;
            await storage.updateUserPoints(
              item.userId, 
              owner.points + bonusPoints
            );
            await storage.createPointTransaction({
              userId: item.userId,
              amount: bonusPoints,
              type: "bonus",
              description: `Bonus for listing ${item.title}`,
              relatedItemId: id,
            });
          }
        }
      }
      
      res.json({ message: "Item status updated" });
    } catch (error) {
      console.error("Error updating item status:", error);
      res.status(400).json({ message: "Failed to update item status" });
    }
  });

  app.get("/api/admin/stats", isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const stats = await storage.getStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
