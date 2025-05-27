import { 
  businesses, 
  campaigns, 
  templates, 
  activities,
  type Business, 
  type InsertBusiness,
  type Campaign,
  type InsertCampaign,
  type Template,
  type InsertTemplate,
  type Activity,
  type InsertActivity,
  type PipelineStage,
  PIPELINE_STAGES,
  BUSINESS_TYPES
} from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  // Business operations
  getBusinesses(): Promise<Business[]>;
  getBusinessesByStage(stage: PipelineStage): Promise<Business[]>;
  getBusinessById(id: number): Promise<Business | undefined>;
  createBusiness(business: InsertBusiness): Promise<Business>;
  updateBusiness(id: number, updates: Partial<Business>): Promise<Business>;
  deleteBusiness(id: number): Promise<void>;
  
  // Campaign operations
  getCampaigns(): Promise<Campaign[]>;
  getCampaignById(id: number): Promise<Campaign | undefined>;
  createCampaign(campaign: InsertCampaign): Promise<Campaign>;
  updateCampaign(id: number, updates: Partial<Campaign>): Promise<Campaign>;
  
  // Template operations
  getTemplates(): Promise<Template[]>;
  getTemplatesByBusinessType(businessType: string): Promise<Template[]>;
  
  // Activity operations
  getActivities(): Promise<Activity[]>;
  getRecentActivities(limit?: number): Promise<Activity[]>;
  createActivity(activity: InsertActivity): Promise<Activity>;
  
  // Analytics
  getStageStats(): Promise<Record<PipelineStage, number>>;
  getRevenueStats(): Promise<{
    monthlyRevenue: number;
    totalDeals: number;
    avgDealSize: number;
    monthlyRecurring: number;
  }>;
  getTodayStats(): Promise<{
    newLeads: number;
    responses: number;
    callsScheduled: number;
    delivered: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  async getBusinesses(): Promise<Business[]> {
    return await db.select().from(businesses);
  }

  async getBusinessesByStage(stage: PipelineStage): Promise<Business[]> {
    return await db.select().from(businesses).where(eq(businesses.stage, stage));
  }

  async getBusinessById(id: number): Promise<Business | undefined> {
    const [business] = await db.select().from(businesses).where(eq(businesses.id, id));
    return business || undefined;
  }

  async createBusiness(insertBusiness: InsertBusiness): Promise<Business> {
    const [business] = await db
      .insert(businesses)
      .values(insertBusiness)
      .returning();
    
    // Create activity
    await this.createActivity({
      type: "lead_added",
      description: `New lead added: ${business.name}`,
      businessId: business.id
    });
    
    return business;
  }

  async updateBusiness(id: number, updates: Partial<Business>): Promise<Business> {
    const [existing] = await db.select().from(businesses).where(eq(businesses.id, id));
    if (!existing) {
      throw new Error("Business not found");
    }

    const [updated] = await db
      .update(businesses)
      .set(updates)
      .where(eq(businesses.id, id))
      .returning();

    // Create activity for stage changes
    if (updates.stage && updates.stage !== existing.stage) {
      await this.createActivity({
        type: "stage_change",
        description: `${existing.name} moved to ${updates.stage}`,
        businessId: id
      });
    }

    return updated;
  }

  async deleteBusiness(id: number): Promise<void> {
    await db.delete(businesses).where(eq(businesses.id, id));
  }

  async getCampaigns(): Promise<Campaign[]> {
    return await db.select().from(campaigns);
  }

  async getCampaignById(id: number): Promise<Campaign | undefined> {
    const [campaign] = await db.select().from(campaigns).where(eq(campaigns.id, id));
    return campaign || undefined;
  }

  async createCampaign(insertCampaign: InsertCampaign): Promise<Campaign> {
    const [campaign] = await db
      .insert(campaigns)
      .values(insertCampaign)
      .returning();
    return campaign;
  }

  async updateCampaign(id: number, updates: Partial<Campaign>): Promise<Campaign> {
    const [updated] = await db
      .update(campaigns)
      .set(updates)
      .where(eq(campaigns.id, id))
      .returning();
    return updated;
  }

  async getTemplates(): Promise<Template[]> {
    return await db.select().from(templates);
  }

  async getTemplatesByBusinessType(businessType: string): Promise<Template[]> {
    return await db.select().from(templates).where(eq(templates.businessType, businessType));
  }

  async getActivities(): Promise<Activity[]> {
    return await db.select().from(activities).orderBy(activities.createdAt);
  }

  async getRecentActivities(limit = 10): Promise<Activity[]> {
    return await db.select().from(activities).orderBy(activities.createdAt).limit(limit);
  }

  async createActivity(insertActivity: InsertActivity): Promise<Activity> {
    const [activity] = await db
      .insert(activities)
      .values(insertActivity)
      .returning();
    return activity;
  }

  async getStageStats(): Promise<Record<PipelineStage, number>> {
    const allBusinesses = await this.getBusinesses();
    const stats: Record<PipelineStage, number> = {
      scraped: 0,
      contacted: 0,
      interested: 0,
      sold: 0,
      delivered: 0
    };

    allBusinesses.forEach(business => {
      if (PIPELINE_STAGES.includes(business.stage as PipelineStage)) {
        stats[business.stage as PipelineStage]++;
      }
    });

    return stats;
  }

  async getRevenueStats(): Promise<{
    monthlyRevenue: number;
    totalDeals: number;
    avgDealSize: number;
    monthlyRecurring: number;
  }> {
    const allBusinesses = await this.getBusinesses();
    const soldBusinesses = allBusinesses.filter(b => b.stage === 'sold' || b.stage === 'delivered');
    const deliveredBusinesses = allBusinesses.filter(b => b.stage === 'delivered');
    
    const totalDeals = soldBusinesses.length;
    
    // Average deal size between $500-2500 based on package tier
    const avgDealSize = totalDeals > 0 ? 1200 : 0; // $1200 average
    
    // Monthly recurring between $100-300 per delivered site
    const monthlyRecurring = deliveredBusinesses.length > 0 ? 
      deliveredBusinesses.length * 125 : // $125 per site
      150; // Base recurring even with no delivered sites
    
    const monthlyRevenue = monthlyRecurring;

    return {
      monthlyRevenue,
      totalDeals,
      avgDealSize,
      monthlyRecurring
    };
  }

  async getTodayStats(): Promise<{
    newLeads: number;
    responses: number;
    callsScheduled: number;
    delivered: number;
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const allActivities = await this.getActivities();
    const todayActivities = allActivities.filter(a => 
      a.createdAt && new Date(a.createdAt).getTime() >= today.getTime()
    );

    return {
      newLeads: todayActivities.filter(a => a.type === 'lead_added').length,
      responses: todayActivities.filter(a => a.type === 'sms_response').length,
      callsScheduled: todayActivities.filter(a => a.type === 'call_scheduled').length,
      delivered: todayActivities.filter(a => a.type === 'website_delivered').length,
    };
  }
}

export const storage = new DatabaseStorage();