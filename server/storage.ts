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

export class MemStorage implements IStorage {
  private businesses: Map<number, Business> = new Map();
  private campaigns: Map<number, Campaign> = new Map();
  private templates: Map<number, Template> = new Map();
  private activities: Map<number, Activity> = new Map();
  private currentBusinessId = 1;
  private currentCampaignId = 1;
  private currentTemplateId = 1;
  private currentActivityId = 1;

  constructor() {
    this.initializeData();
  }

  private initializeData() {
    // Initialize with some templates
    const initialTemplates: Template[] = [
      {
        id: this.currentTemplateId++,
        name: "Auto Repair Template",
        businessType: "auto_repair",
        description: "Professional mechanic layout",
        usageCount: 12,
        previewUrl: "https://example.com/preview/auto",
        features: ["Service booking", "Photo gallery", "Contact forms"]
      },
      {
        id: this.currentTemplateId++,
        name: "Landscaping Template", 
        businessType: "landscaping",
        description: "Photo-focused design",
        usageCount: 8,
        previewUrl: "https://example.com/preview/landscape",
        features: ["Project gallery", "Service areas", "Quote requests"]
      },
      {
        id: this.currentTemplateId++,
        name: "General Contractor",
        businessType: "general_contractor", 
        description: "Service-focused layout",
        usageCount: 15,
        previewUrl: "https://example.com/preview/contractor",
        features: ["Project portfolio", "Testimonials", "Service catalog"]
      }
    ];

    initialTemplates.forEach(template => {
      this.templates.set(template.id, template);
    });

    // Initialize with some sample campaigns
    const initialCampaigns: Campaign[] = [
      {
        id: this.currentCampaignId++,
        name: "Brunswick Mechanics",
        businessType: "auto_repair",
        status: "active",
        totalContacts: 23,
        sentCount: 18,
        responseCount: 5,
        message: "Hi {name}, I noticed {businessName} doesn't have a website. I'm local and can get one built for just $400 with free setup. Want the details?",
        createdAt: new Date()
      }
    ];

    initialCampaigns.forEach(campaign => {
      this.campaigns.set(campaign.id, campaign);
    });

    // Initialize with some sample businesses to show revenue calculations
    const initialBusinesses: Business[] = [
      {
        id: this.currentBusinessId++,
        name: "Mike's Auto Repair",
        phone: "(207) 555-0123",
        address: "123 Main St",
        city: "Brunswick",
        state: "ME",
        businessType: "auto_repair",
        stage: "delivered",
        website: "https://mikesautorepair.com",
        notes: "Very responsive client",
        lastContactDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      },
      {
        id: this.currentBusinessId++,
        name: "Bath Plumbing Co",
        phone: "(207) 555-0156",
        address: "456 Oak Ave",
        city: "Bath",
        state: "ME",
        businessType: "plumbing",
        stage: "sold",
        website: null,
        notes: "Paid $1,200 upfront",
        lastContactDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
      },
      {
        id: this.currentBusinessId++,
        name: "Coastal Electric",
        phone: "(207) 555-0189",
        address: "789 Pine Rd",
        city: "Wiscasset",
        state: "ME",
        businessType: "electrical",
        stage: "interested",
        website: null,
        notes: "Call scheduled for tomorrow",
        lastContactDate: new Date(),
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
      },
      {
        id: this.currentBusinessId++,
        name: "Green Thumb Landscaping",
        phone: "(207) 555-0234",
        address: "321 Elm St",
        city: "Boothbay",
        state: "ME",
        businessType: "landscaping",
        stage: "contacted",
        website: null,
        notes: "SMS sent this morning",
        lastContactDate: new Date(),
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
      },
      {
        id: this.currentBusinessId++,
        name: "Superior Roofing",
        phone: "(207) 555-0345",
        address: "654 Maple Ave",
        city: "Damariscotta",
        state: "ME",
        businessType: "roofing",
        stage: "delivered",
        website: "https://superiorroof.com",
        notes: "Premium package client",
        lastContactDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
      }
    ];

    initialBusinesses.forEach(business => {
      this.businesses.set(business.id, business);
    });
  }

  async getBusinesses(): Promise<Business[]> {
    return Array.from(this.businesses.values());
  }

  async getBusinessesByStage(stage: PipelineStage): Promise<Business[]> {
    return Array.from(this.businesses.values()).filter(b => b.stage === stage);
  }

  async getBusinessById(id: number): Promise<Business | undefined> {
    return this.businesses.get(id);
  }

  async createBusiness(insertBusiness: InsertBusiness): Promise<Business> {
    const business: Business = {
      ...insertBusiness,
      id: this.currentBusinessId++,
      createdAt: new Date(),
      stage: insertBusiness.stage || "scraped",
      website: insertBusiness.website || null,
      notes: insertBusiness.notes || null,
      lastContactDate: insertBusiness.lastContactDate || null,
    };
    this.businesses.set(business.id, business);
    
    // Create activity
    await this.createActivity({
      type: "lead_added",
      description: `New lead added: ${business.name}`,
      businessId: business.id
    });
    
    return business;
  }

  async updateBusiness(id: number, updates: Partial<Business>): Promise<Business> {
    const existing = this.businesses.get(id);
    if (!existing) {
      throw new Error("Business not found");
    }

    const updated = { ...existing, ...updates };
    this.businesses.set(id, updated);

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
    this.businesses.delete(id);
  }

  async getCampaigns(): Promise<Campaign[]> {
    return Array.from(this.campaigns.values());
  }

  async getCampaignById(id: number): Promise<Campaign | undefined> {
    return this.campaigns.get(id);
  }

  async createCampaign(insertCampaign: InsertCampaign): Promise<Campaign> {
    const campaign: Campaign = {
      ...insertCampaign,
      id: this.currentCampaignId++,
      createdAt: new Date(),
      status: insertCampaign.status || "active",
      totalContacts: insertCampaign.totalContacts || 0,
      sentCount: insertCampaign.sentCount || 0,
      responseCount: insertCampaign.responseCount || 0,
    };
    this.campaigns.set(campaign.id, campaign);
    return campaign;
  }

  async updateCampaign(id: number, updates: Partial<Campaign>): Promise<Campaign> {
    const existing = this.campaigns.get(id);
    if (!existing) {
      throw new Error("Campaign not found");
    }

    const updated = { ...existing, ...updates };
    this.campaigns.set(id, updated);
    return updated;
  }

  async getTemplates(): Promise<Template[]> {
    return Array.from(this.templates.values());
  }

  async getTemplatesByBusinessType(businessType: string): Promise<Template[]> {
    return Array.from(this.templates.values()).filter(t => t.businessType === businessType);
  }

  async getActivities(): Promise<Activity[]> {
    return Array.from(this.activities.values()).sort((a, b) => 
      new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime()
    );
  }

  async getRecentActivities(limit = 10): Promise<Activity[]> {
    const activities = await this.getActivities();
    return activities.slice(0, limit);
  }

  async createActivity(insertActivity: InsertActivity): Promise<Activity> {
    const activity: Activity = {
      ...insertActivity,
      id: this.currentActivityId++,
      createdAt: new Date(),
      businessId: insertActivity.businessId || null,
    };
    this.activities.set(activity.id, activity);
    return activity;
  }

  async getStageStats(): Promise<Record<PipelineStage, number>> {
    const businesses = await this.getBusinesses();
    const stats: Record<PipelineStage, number> = {
      scraped: 0,
      contacted: 0,
      interested: 0,
      sold: 0,
      delivered: 0
    };

    businesses.forEach(business => {
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
    const businesses = await this.getBusinesses();
    const soldBusinesses = businesses.filter(b => b.stage === 'sold' || b.stage === 'delivered');
    const deliveredBusinesses = businesses.filter(b => b.stage === 'delivered');
    
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

    const activities = await this.getActivities();
    const todayActivities = activities.filter(a => 
      new Date(a.createdAt!).getTime() >= today.getTime()
    );

    return {
      newLeads: todayActivities.filter(a => a.type === 'lead_added').length,
      responses: todayActivities.filter(a => a.type === 'sms_response').length,
      callsScheduled: todayActivities.filter(a => a.type === 'call_scheduled').length,
      delivered: todayActivities.filter(a => a.type === 'website_delivered').length,
    };
  }
}

export const storage = new MemStorage();
