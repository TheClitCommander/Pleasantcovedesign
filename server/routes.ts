import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertBusinessSchema, insertCampaignSchema, PIPELINE_STAGES } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Dashboard stats
  app.get("/api/stats", async (req, res) => {
    try {
      const businesses = await storage.getBusinesses();
      const stageStats = await storage.getStageStats();
      const revenueStats = await storage.getRevenueStats();
      const todayStats = await storage.getTodayStats();
      const campaigns = await storage.getCampaigns();

      res.json({
        totalLeads: businesses.length,
        activeCampaigns: campaigns.filter(c => c.status === 'active').length,
        conversionRate: businesses.length > 0 ? ((stageStats.sold + stageStats.delivered) / businesses.length * 100).toFixed(1) : "0.0",
        ...revenueStats,
        today: todayStats,
        stageStats
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });

  // Business operations
  app.get("/api/businesses", async (req, res) => {
    try {
      const businesses = await storage.getBusinesses();
      res.json(businesses);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch businesses" });
    }
  });

  app.get("/api/businesses/stage/:stage", async (req, res) => {
    try {
      const { stage } = req.params;
      if (!PIPELINE_STAGES.includes(stage as any)) {
        return res.status(400).json({ error: "Invalid stage" });
      }
      const businesses = await storage.getBusinessesByStage(stage as any);
      res.json(businesses);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch businesses by stage" });
    }
  });

  app.post("/api/businesses", async (req, res) => {
    try {
      const validatedData = insertBusinessSchema.parse(req.body);
      const business = await storage.createBusiness(validatedData);
      res.status(201).json(business);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation failed", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create business" });
    }
  });

  app.put("/api/businesses/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      const business = await storage.updateBusiness(id, updates);
      res.json(business);
    } catch (error) {
      res.status(500).json({ error: "Failed to update business" });
    }
  });

  app.delete("/api/businesses/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteBusiness(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete business" });
    }
  });

  // Import businesses (CSV upload simulation)
  app.post("/api/businesses/import", async (req, res) => {
    try {
      const { businesses } = req.body;
      if (!Array.isArray(businesses)) {
        return res.status(400).json({ error: "Expected array of businesses" });
      }

      const created = [];
      for (const businessData of businesses) {
        try {
          const validatedData = insertBusinessSchema.parse(businessData);
          const business = await storage.createBusiness(validatedData);
          created.push(business);
        } catch (error) {
          console.error("Failed to create business:", error);
        }
      }

      res.json({ imported: created.length, businesses: created });
    } catch (error) {
      res.status(500).json({ error: "Failed to import businesses" });
    }
  });

  // Campaign operations
  app.get("/api/campaigns", async (req, res) => {
    try {
      const campaigns = await storage.getCampaigns();
      res.json(campaigns);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch campaigns" });
    }
  });

  app.post("/api/campaigns", async (req, res) => {
    try {
      const validatedData = insertCampaignSchema.parse(req.body);
      const campaign = await storage.createCampaign(validatedData);
      res.status(201).json(campaign);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation failed", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create campaign" });
    }
  });

  app.put("/api/campaigns/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      const campaign = await storage.updateCampaign(id, updates);
      res.json(campaign);
    } catch (error) {
      res.status(500).json({ error: "Failed to update campaign" });
    }
  });

  // Template operations
  app.get("/api/templates", async (req, res) => {
    try {
      const templates = await storage.getTemplates();
      res.json(templates);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch templates" });
    }
  });

  // Activity operations
  app.get("/api/activities", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const activities = await storage.getRecentActivities(limit);
      res.json(activities);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch activities" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
