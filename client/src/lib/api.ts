import { apiRequest } from "./queryClient";
import type { Business, InsertBusiness, Campaign, InsertCampaign, Activity, Template } from "@shared/schema";

export const api = {
  // Stats
  getStats: async () => {
    const res = await apiRequest("GET", "/api/stats");
    return res.json();
  },

  // Businesses
  getBusinesses: async (): Promise<Business[]> => {
    const res = await apiRequest("GET", "/api/businesses");
    return res.json();
  },

  getBusinessesByStage: async (stage: string): Promise<Business[]> => {
    const res = await apiRequest("GET", `/api/businesses/stage/${stage}`);
    return res.json();
  },

  createBusiness: async (business: InsertBusiness): Promise<Business> => {
    const res = await apiRequest("POST", "/api/businesses", business);
    return res.json();
  },

  updateBusiness: async (id: number, updates: Partial<Business>): Promise<Business> => {
    const res = await apiRequest("PUT", `/api/businesses/${id}`, updates);
    return res.json();
  },

  deleteBusiness: async (id: number): Promise<void> => {
    await apiRequest("DELETE", `/api/businesses/${id}`);
  },

  importBusinesses: async (businesses: InsertBusiness[]) => {
    const res = await apiRequest("POST", "/api/businesses/import", { businesses });
    return res.json();
  },

  // Campaigns
  getCampaigns: async (): Promise<Campaign[]> => {
    const res = await apiRequest("GET", "/api/campaigns");
    return res.json();
  },

  createCampaign: async (campaign: InsertCampaign): Promise<Campaign> => {
    const res = await apiRequest("POST", "/api/campaigns", campaign);
    return res.json();
  },

  updateCampaign: async (id: number, updates: Partial<Campaign>): Promise<Campaign> => {
    const res = await apiRequest("PUT", `/api/campaigns/${id}`, updates);
    return res.json();
  },

  // Templates
  getTemplates: async (): Promise<Template[]> => {
    const res = await apiRequest("GET", "/api/templates");
    return res.json();
  },

  // Activities
  getActivities: async (limit?: number): Promise<Activity[]> => {
    const url = limit ? `/api/activities?limit=${limit}` : "/api/activities";
    const res = await apiRequest("GET", url);
    return res.json();
  },
};
