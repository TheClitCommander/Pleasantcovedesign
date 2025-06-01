import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { botIntegration } from "./bot-integration";
import { insertBusinessSchema, insertCampaignSchema, PIPELINE_STAGES } from "@shared/schema";
import { z } from "zod";
import { launchOutreachForLead, launchBulkOutreach } from "./outreach";
import moment from "moment";
import { eq, desc, and, ne } from "drizzle-orm";
import { db } from "./db";
import * as schema from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Dashboard stats
  app.get("/api/stats", async (req, res) => {
    try {
      const stats = await storage.getStats();
      const businesses = await storage.getBusinesses();
      const activities = await storage.getActivities();
      
      // Calculate today's stats
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayActivities = activities.filter(a => 
        a.createdAt && new Date(a.createdAt).getTime() >= today.getTime()
      );
      
      // Calculate revenue stats
      const soldBusinesses = businesses.filter(b => b.stage === 'sold' || b.stage === 'delivered');
      const deliveredBusinesses = businesses.filter(b => b.stage === 'delivered');
      const monthlyRecurring = deliveredBusinesses.length * 50; // $50/mo per delivered site
      
      res.json({
        ...stats,
        monthlyRevenue: monthlyRecurring,
        totalDeals: soldBusinesses.length,
        avgDealSize: 400, // $400 per deal
        monthlyRecurring,
        today: {
          newLeads: todayActivities.filter(a => a.type === 'lead_added').length,
          responses: todayActivities.filter(a => a.type === 'sms_response').length,
          callsScheduled: todayActivities.filter(a => a.type === 'meeting_scheduled').length,
          delivered: todayActivities.filter(a => a.type === 'website_delivered').length,
        }
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

  // Templates Management Endpoints
  app.get("/api/templates", async (req, res) => {
    try {
      const templates = await storage.getTemplates();
      res.json(templates);
    } catch (error) {
      console.error("Error fetching templates:", error);
      res.status(500).json({ error: "Failed to fetch templates" });
    }
  });

  app.post("/api/templates", async (req, res) => {
    try {
      const template = await storage.createTemplate(req.body);
      res.json(template);
    } catch (error) {
      console.error("Error creating template:", error);
      res.status(500).json({ error: "Failed to create template" });
    }
  });

  // TODO: Implement update and delete methods in storage
  // app.put("/api/templates/:id", async (req, res) => {
  //   try {
  //     const id = parseInt(req.params.id);
  //     const template = await storage.updateTemplate(id, req.body);
  //     res.json(template);
  //   } catch (error) {
  //     console.error("Error updating template:", error);
  //     res.status(500).json({ error: "Failed to update template" });
  //   }
  // });

  // app.delete("/api/templates/:id", async (req, res) => {
  //   try {
  //     const id = parseInt(req.params.id);
  //     await storage.deleteTemplate(id);
  //     res.status(204).send();
  //   } catch (error) {
  //     console.error("Error deleting template:", error);
  //     res.status(500).json({ error: "Failed to delete template" });
  //   }
  // });

  // Activities endpoints
  app.get("/api/activities", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const activities = await storage.getRecentActivities(limit);
      res.json(activities);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch activities" });
    }
  });

  app.post("/api/activities", async (req, res) => {
    try {
      const activity = await storage.createActivity(req.body);
      res.json(activity);
    } catch (error) {
      console.error("Error creating activity:", error);
      res.status(500).json({ error: "Failed to create activity" });
    }
  });

  // New Lead Handler - Webhook endpoint for Squarespace forms
  app.post("/api/new-lead", async (req, res) => {
    try {
      // Handle Squarespace webhook format
      let leadData;
      
      // Check if it's Squarespace format (has data field) or direct format
      if (req.body.data) {
        // Squarespace webhook format
        leadData = req.body.data;
        console.log("Received Squarespace webhook:", {
          formId: req.body.formId,
          submissionId: req.body.submissionId,
          data: leadData
        });
      } else {
        // Direct API format
        leadData = req.body;
      }
      
      const { name, email, phone, message } = leadData;
      
      // Create the business/lead entry
      const businessData = {
        name: name || "Unknown Business",
        phone: phone || "No phone provided",
        email: email || "",
        address: "To be enriched",
        city: "To be enriched",
        state: "To be enriched",
        businessType: "unknown",
        stage: "scraped" as const,
        notes: `Source: Squarespace Form\nMessage: ${message || "No message"}\nSubmission ID: ${req.body.submissionId || "N/A"}`,
        website: "",
      };

      const business = await storage.createBusiness(businessData);
      
      // Create activity log
      await storage.createActivity({
        type: "lead_received",
        description: `New lead received from Squarespace: ${name}`,
        businessId: business.id,
      });

      // Trigger automatic enrichment in the background
      setTimeout(async () => {
        try {
          await botIntegration.enrichLead(business.id);
          console.log(`Auto-enriched lead: ${business.id} - ${name}`);
          
          // Get the updated business after enrichment
          const enrichedBusiness = await storage.getBusiness(business.id);
          
          // Check if enrichment resulted in high score
          if (enrichedBusiness && enrichedBusiness.score && enrichedBusiness.score > 80) {
            console.log(`🔥 Hot lead from Squarespace (score: ${enrichedBusiness.score}): ${name}`);
            
            // Auto-outreach for hot leads
            const outreachResult = await launchOutreachForLead(business.id);
            if (outreachResult.success) {
              await storage.createActivity({
                type: "auto_outreach",
                description: `Automatic outreach sent to hot Squarespace lead (score: ${enrichedBusiness.score})`,
                businessId: business.id
              });
            }
          }
        } catch (error) {
          console.error(`Failed to auto-enrich lead ${business.id}:`, error);
        }
      }, 1000); // Small delay to ensure webhook response is sent first
      
      // Return success to Squarespace immediately
      res.status(200).json({ 
        success: true, 
        businessId: business.id,
        message: "Lead received and queued for enrichment" 
      });
    } catch (error) {
      console.error("Failed to process new lead:", error);
      res.status(500).json({ error: "Failed to process new lead" });
    }
  });

  // Bot Integration Endpoints
  app.post("/api/bot/enrich/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Trigger bot enrichment
      await botIntegration.enrichLead(id);
      
      // Get updated business
      const business = await storage.getBusiness(id);
      
      // Automatic outreach for high-scoring leads
      if (business && business.score && business.score > 80) {
        console.log(`🎯 High-scoring lead detected (${business.score}): ${business.name}`);
        
        // Trigger outreach in the background
        setTimeout(async () => {
          try {
            const outreachResult = await launchOutreachForLead(id);
            console.log(`📧 Auto-outreach ${outreachResult.success ? 'sent' : 'failed'} for ${business.name}`);
            
            // Log activity
            await storage.createActivity({
              type: "auto_outreach",
              description: `Automatic outreach triggered for high-scoring lead (${business.score}): ${business.name}`,
              businessId: id
            });
          } catch (error) {
            console.error(`Failed to auto-send outreach for ${business.name}:`, error);
          }
        }, 2000); // Small delay to ensure enrichment is complete
      }

      res.json({ success: true, business });
    } catch (error) {
      console.error("Enrichment error:", error);
      res.status(500).json({ error: "Failed to enrich lead" });
    }
  });

  app.post("/api/bot/score/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { score, tags, priority } = req.body;
      
      // Update business with scoring data
      const business = await storage.updateBusiness(id, {
        score,
        tags,
        priority,
        notes: `Score: ${score}\nTags: ${tags.join(", ")}\nPriority: ${priority}\n\n${(await storage.getBusiness(id))?.notes || ""}`,
      });

      res.json({ success: true, business });
    } catch (error) {
      res.status(500).json({ error: "Failed to score lead" });
    }
  });

  app.post("/api/bot/launch-outreach", async (req, res) => {
    try {
      const { businessIds, campaignType } = req.body;
      
      // Validate input
      if (!businessIds || !Array.isArray(businessIds) || businessIds.length === 0) {
        return res.status(400).json({ error: "Business IDs array is required" });
      }
      
      // Create campaign for outreach
      const campaign = await storage.createCampaign({
        name: `Automated Outreach - ${new Date().toLocaleDateString()}`,
        businessType: campaignType || "general",
        status: "active",
        totalContacts: businessIds.length,
        sentCount: 0,
        responseCount: 0,
        message: "Automated outreach campaign via SMS and Email",
      });

      // Launch outreach using the new module
      const outreachResults = await launchBulkOutreach(businessIds);
      
      // Update campaign with results
      await storage.updateCampaign(campaign.id, {
        sentCount: outreachResults.successful,
        responseCount: outreachResults.failed // Using failed count as response for now
      });

      res.json({ 
        success: true, 
        campaign,
        outreach: outreachResults
      });
    } catch (error) {
      console.error("Outreach error:", error);
      res.status(500).json({ error: "Failed to launch outreach" });
    }
  });

  // Add endpoint for single lead outreach
  app.post("/api/bot/outreach/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Launch outreach for single lead
      const result = await launchOutreachForLead(id);
      
      res.json(result);
    } catch (error) {
      console.error("Single outreach error:", error);
      res.status(500).json({ error: "Failed to send outreach" });
    }
  });

  // Google Sheets import endpoint
  app.post("/api/import/google-sheets", async (req, res) => {
    try {
      const { sheetId } = req.body;
      
      if (!sheetId) {
        return res.status(400).json({ error: "Sheet ID is required" });
      }

      const importedBusinesses = await botIntegration.importFromGoogleSheets(sheetId);
      
      res.json({ 
        success: true, 
        imported: importedBusinesses.length,
        businesses: importedBusinesses 
      });
    } catch (error) {
      console.error("Google Sheets import error:", error);
      res.status(500).json({ error: "Failed to import from Google Sheets" });
    }
  });

  // Get individual business
  app.get("/api/businesses/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const business = await storage.getBusiness(id);
      if (!business) {
        return res.status(404).json({ error: "Business not found" });
      }
      res.json(business);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch business" });
    }
  });

  // Get business activities
  app.get("/api/businesses/:id/activities", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const activities = await storage.getBusinessActivities(id);
      res.json(activities);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch business activities" });
    }
  });

  // Schedule management
  app.get("/api/leads/pending", async (req, res) => {
    try {
      const businesses = await storage.getBusinesses();
      // Filter for pending leads: scraped stage with score >= 70
      const pendingLeads = businesses.filter(b => 
        (b.stage === 'scraped' || b.stage === 'pending') && 
        (b.score || 0) >= 70
      );
      res.json(pendingLeads);
    } catch (error) {
      console.error("Failed to fetch pending leads:", error);
      res.status(500).json({ error: "Failed to fetch pending leads" });
    }
  });

  app.post("/api/schedule", async (req, res) => {
    try {
      const { business_id, datetime } = req.body;
      
      if (!business_id || !datetime) {
        return res.status(400).json({ error: "business_id and datetime required" });
      }
      
      // Check for double-booking
      const dateStr = moment(datetime).format('YYYY-MM-DD');
      const timeStr = moment(datetime).format('HH:mm');
      
      const allBusinesses = await storage.getBusinesses();
      const conflictingBooking = allBusinesses.find(b => {
        if (!b.scheduledTime || b.id === business_id) return false;
        
        const existingDate = moment(b.scheduledTime).format('YYYY-MM-DD');
        const existingTime = moment(b.scheduledTime).format('HH:mm');
        
        return existingDate === dateStr && existingTime === timeStr && b.appointmentStatus !== 'no-show';
      });
      
      if (conflictingBooking) {
        return res.status(409).json({ 
          error: "Time slot already booked",
          conflict: {
            businessName: conflictingBooking.name,
            time: moment(conflictingBooking.scheduledTime).format('h:mm A')
          }
        });
      }
      
      // Check if this is a reschedule
      const existingBusiness = await storage.getBusinessById(business_id);
      const isReschedule = existingBusiness && existingBusiness.scheduledTime && existingBusiness.stage === 'scheduled';
      const oldDateTime = isReschedule ? existingBusiness.scheduledTime : null;
      
      const business = await storage.updateBusiness(business_id, {
        stage: 'scheduled',
        scheduledTime: datetime,
        appointmentStatus: 'confirmed'
      });
      
      // Add activity
      if (isReschedule) {
        await storage.createActivity({
          type: "meeting_rescheduled",
          description: `Consultation rescheduled from ${moment(oldDateTime).format('MMM D, h:mm A')} to ${moment(datetime).format('MMM D, h:mm A')}`,
          businessId: business_id
        });
      } else {
        await storage.createActivity({
          type: "meeting_scheduled",
          description: `Consultation scheduled for ${new Date(datetime).toLocaleString()}`,
          businessId: business_id
        });
      }
      
      res.json({ success: true, business });
    } catch (error) {
      console.error("Failed to schedule meeting:", error);
      res.status(500).json({ error: "Failed to schedule meeting" });
    }
  });

  app.get("/api/schedule", async (req, res) => {
    try {
      const businesses = await storage.getBusinesses();
      // Return all scheduled meetings
      const scheduled = businesses.filter(b => 
        b.stage === 'scheduled' && b.scheduledTime
      );
      res.json(scheduled);
    } catch (error) {
      console.error("Failed to fetch schedule:", error);
      res.status(500).json({ error: "Failed to fetch schedule" });
    }
  });

  app.get("/api/availability", async (req, res) => {
    try {
      const availability = await storage.getAvailabilityConfig();
      res.json(availability);
    } catch (error) {
      console.error("Failed to fetch availability:", error);
      res.status(500).json({ error: "Failed to fetch availability" });
    }
  });

  app.post("/api/availability", async (req, res) => {
    try {
      const configs = req.body;
      await storage.updateAvailabilityConfig(configs);
      res.json({ success: true });
    } catch (error) {
      console.error("Failed to update availability:", error);
      res.status(500).json({ error: "Failed to update availability" });
    }
  });

  // New Scheduling System Endpoints
  app.get("/api/scheduling/link/:businessId", async (req, res) => {
    try {
      const businessId = parseInt(req.params.businessId);
      const business = await storage.getBusinessById(businessId);
      
      if (!business) {
        return res.status(404).json({ error: "Business not found" });
      }
      
      const { generateSchedulingLink } = await import('./scheduling-utils');
      const link = generateSchedulingLink(businessId);
      res.json({ link, businessName: business.name });
    } catch (error) {
      console.error("Error generating scheduling link:", error);
      res.status(500).json({ error: "Failed to generate scheduling link" });
    }
  });

  // Get all appointments (manual and auto-scheduled)
  app.get("/api/scheduling/appointments", async (req, res) => {
    try {
      const businesses = await storage.getBusinesses();
      
      // Get all businesses with scheduled times
      const appointments = businesses
        .filter(b => b.stage === 'scheduled' && b.scheduledTime)
        .map(b => ({
          id: b.id,
          businessId: b.id,
          businessName: b.name,
          datetime: b.scheduledTime,
          phone: b.phone,
          score: b.score || 0,
          // Determine if auto-scheduled by checking notes or source
          isAutoScheduled: b.notes?.includes('Source: Scheduling Link') || 
                          b.notes?.includes('Self-scheduled') || 
                          false,
          notes: b.notes,
          appointmentStatus: b.appointmentStatus || 'confirmed'
        }));
      
      res.json(appointments);
    } catch (error) {
      console.error("Error fetching appointments:", error);
      res.status(500).json({ error: "Failed to fetch appointments" });
    }
  });

  // Blocked dates management
  app.get("/api/blocked-dates", async (req, res) => {
    try {
      const blockedDates = await storage.getBlockedDates();
      res.json(blockedDates);
    } catch (error) {
      console.error("Error fetching blocked dates:", error);
      res.status(500).json({ error: "Failed to fetch blocked dates" });
    }
  });

  app.post("/api/blocked-dates", async (req, res) => {
    try {
      const { date, startTime, endTime, reason } = req.body;
      
      if (!date) {
        return res.status(400).json({ error: "Date is required" });
      }
      
      // Validate time format if provided
      if (startTime && !/^\d{2}:\d{2}$/.test(startTime)) {
        return res.status(400).json({ error: "Invalid start time format (use HH:mm)" });
      }
      
      if (endTime && !/^\d{2}:\d{2}$/.test(endTime)) {
        return res.status(400).json({ error: "Invalid end time format (use HH:mm)" });
      }
      
      const blockedDate = await storage.createBlockedDate({
        date,
        startTime,
        endTime,
        reason
      });
      
      res.json(blockedDate);
    } catch (error) {
      console.error("Error creating blocked date:", error);
      res.status(500).json({ error: "Failed to create blocked date" });
    }
  });

  app.delete("/api/blocked-dates/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteBlockedDate(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting blocked date:", error);
      res.status(500).json({ error: "Failed to delete blocked date" });
    }
  });

  app.get("/api/scheduling/slots", async (req, res) => {
    try {
      const { date, businessId } = req.query;
      
      if (!date || typeof date !== 'string') {
        return res.status(400).json({ error: "Date parameter required" });
      }
      
      const leadScore = businessId ? 
        (await storage.getBusinessById(parseInt(businessId as string)))?.score || 0 : 
        0;
      
      const { getAvailableSlots } = await import('./scheduling-utils');
      const slots = await getAvailableSlots(date, leadScore);
      res.json({ slots });
    } catch (error) {
      console.error("Error fetching available slots:", error);
      res.status(500).json({ error: "Failed to fetch available slots" });
    }
  });

  app.post("/api/scheduling/book", async (req, res) => {
    try {
      const { businessId, datetime, duration = 30 } = req.body;
      
      if (!businessId || !datetime) {
        return res.status(400).json({ error: "businessId and datetime required" });
      }
      
      // Check for double-booking before creating
      const dateStr = moment(datetime).format('YYYY-MM-DD');
      const timeStr = moment(datetime).format('HH:mm');
      
      // Get all existing bookings for this date
      const allBusinesses = await storage.getBusinesses();
      const conflictingBooking = allBusinesses.find(b => {
        if (!b.scheduledTime || b.id === businessId) return false;
        
        const existingDate = moment(b.scheduledTime).format('YYYY-MM-DD');
        const existingTime = moment(b.scheduledTime).format('HH:mm');
        
        return existingDate === dateStr && existingTime === timeStr && b.appointmentStatus !== 'no-show';
      });
      
      if (conflictingBooking) {
        return res.status(409).json({ 
          error: "Time slot already booked",
          conflict: {
            businessName: conflictingBooking.name,
            time: moment(conflictingBooking.scheduledTime).format('h:mm A')
          }
        });
      }
      
      const { createBooking } = await import('./scheduling-utils');
      const booking = await createBooking(businessId, datetime, duration);
      res.json({ success: true, booking });
    } catch (error) {
      console.error("Error creating booking:", error);
      if (error instanceof Error && error.message.includes('already booked')) {
        res.status(409).json({ error: error.message });
      } else {
        res.status(500).json({ error: "Failed to create booking" });
      }
    }
  });

  app.get("/api/scheduling/booking/:businessId", async (req, res) => {
    try {
      const businessId = parseInt(req.params.businessId);
      const { getBookingDetails } = await import('./scheduling-utils');
      const booking = await getBookingDetails(businessId);
      
      if (!booking) {
        return res.status(404).json({ error: "No booking found" });
      }
      
      res.json(booking);
    } catch (error) {
      console.error("Error fetching booking details:", error);
      res.status(500).json({ error: "Failed to fetch booking details" });
    }
  });

  app.get("/api/scheduling/analytics", async (req, res) => {
    try {
      const { getSchedulingStats } = await import('./scheduling-utils');
      const analytics = await getSchedulingStats();
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching scheduling analytics:", error);
      res.status(500).json({ error: "Failed to fetch scheduling analytics" });
    }
  });

  // Message sending endpoint
  app.post("/api/messages/send", async (req, res) => {
    try {
      const { leadId, channel, body } = req.body;
      
      if (!leadId || !channel || !body) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      
      // Get the business/lead details
      const business = await storage.getBusinessById(leadId);
      if (!business) {
        return res.status(404).json({ error: "Business not found" });
      }
      
      // For now, we'll simulate sending the message
      // In production, this would integrate with Twilio or your SMS provider
      console.log(`[SMS] Sending to ${business.phone}: ${body}`);
      
      // Log the activity
      await storage.createActivity({
        type: 'sms_sent',
        description: `Manual SMS sent via Inbox UI: "${body.substring(0, 50)}..."`,
        businessId: leadId
      });
      
      // Update conversation state
      await storage.updateBusiness(leadId, {
        lastContactDate: new Date().toISOString()
      });
      
      res.json({ 
        success: true, 
        message: "Message sent successfully",
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("Failed to send message:", error);
      res.status(500).json({ error: "Failed to send message" });
    }
  });

  // Update appointment status (no-show, completed, etc)
  app.patch("/api/scheduling/appointments/:id/status", async (req, res) => {
    try {
      const businessId = parseInt(req.params.id);
      const { status } = req.body;
      
      if (!['confirmed', 'completed', 'no-show'].includes(status)) {
        return res.status(400).json({ error: "Invalid status. Must be: confirmed, completed, or no-show" });
      }
      
      const business = await storage.getBusinessById(businessId);
      if (!business || !business.scheduledTime) {
        return res.status(404).json({ error: "Appointment not found" });
      }
      
      // Update status
      const updatedBusiness = await storage.updateBusiness(businessId, {
        appointmentStatus: status
      });
      
      // Log activity
      await storage.createActivity({
        type: status === 'no-show' ? 'no_show' : 'appointment_status_updated',
        description: `Appointment marked as ${status}`,
        businessId
      });
      
      // If no-show, trigger reschedule message
      if (status === 'no-show') {
        const rescheduleLink = `https://www.pleasantcovedesign.com/schedule?lead_id=${businessId}`;
        const firstName = business.name.split(' ')[0];
        const rescheduleMessage = `Hey ${firstName}, sorry we missed you! You can rebook here: ${rescheduleLink}`;
        
        console.log(`[Auto-Reschedule SMS] To ${business.phone}: ${rescheduleMessage}`);
        
        // Log the reschedule message activity
        await storage.createActivity({
          type: 'sms_sent',
          description: 'Auto-reschedule message sent after no-show',
          businessId
        });
      }
      
      res.json({ success: true, business: updatedBusiness });
    } catch (error) {
      console.error("Error updating appointment status:", error);
      res.status(500).json({ error: "Failed to update appointment status" });
    }
  });

  // New Appointment System CRUD endpoints
  
  // Get all appointments
  app.get("/api/appointments", async (req, res) => {
    try {
      const { businessId } = req.query;
      
      if (businessId) {
        // Get appointments for specific business
        const appointments = await db.select()
          .from(schema.appointments)
          .where(eq(schema.appointments.businessId, parseInt(businessId as string)));
        return res.json(appointments);
      }
      
      // Get all appointments with business info
      const appointments = await db.select({
        appointment: schema.appointments,
        business: schema.businesses,
      })
        .from(schema.appointments)
        .leftJoin(schema.businesses, eq(schema.appointments.businessId, schema.businesses.id))
        .orderBy(desc(schema.appointments.datetime));
        
      res.json(appointments);
    } catch (error) {
      console.error("Failed to fetch appointments:", error);
      res.status(500).json({ error: "Failed to fetch appointments" });
    }
  });

  // Create new appointment
  app.post("/api/appointments", async (req, res) => {
    try {
      const { businessId, datetime, notes, isAutoScheduled = false } = req.body;
      
      if (!businessId || !datetime) {
        return res.status(400).json({ error: "businessId and datetime are required" });
      }

      // Check for double-booking
      const existingAppointments = await db.select()
        .from(schema.appointments)
        .where(
          and(
            eq(schema.appointments.datetime, datetime),
            ne(schema.appointments.status, 'cancelled')
          )
        );
      
      if (existingAppointments.length > 0) {
        return res.status(409).json({ error: "Time slot already booked" });
      }

      // Create appointment
      const [appointment] = await db.insert(schema.appointments)
        .values({
          businessId,
          datetime,
          notes,
          isAutoScheduled,
          status: 'confirmed',
        })
        .returning();

      // Update business stage
      await storage.updateBusiness(businessId, {
        stage: 'scheduled',
      });

      // Log activity
      await storage.createActivity({
        type: "appointment_created",
        description: `Appointment scheduled for ${moment(datetime).format('MMM D, YYYY at h:mm A')}`,
        businessId,
      });

      res.json(appointment);
    } catch (error) {
      console.error("Failed to create appointment:", error);
      res.status(500).json({ error: "Failed to create appointment" });
    }
  });

  // Update appointment
  app.patch("/api/appointments/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { datetime, status, notes } = req.body;

      const updates: any = {};
      if (datetime) updates.datetime = datetime;
      if (status) updates.status = status;
      if (notes !== undefined) updates.notes = notes;
      updates.updatedAt = new Date().toISOString();

      const [appointment] = await db.update(schema.appointments)
        .set(updates)
        .where(eq(schema.appointments.id, id))
        .returning();

      if (!appointment) {
        return res.status(404).json({ error: "Appointment not found" });
      }

      // If rescheduling, log activity
      if (datetime) {
        await storage.createActivity({
          type: "appointment_rescheduled",
          description: `Appointment rescheduled to ${moment(datetime).format('MMM D, YYYY at h:mm A')}`,
          businessId: appointment.businessId,
        });
      }

      // If status changed to no-show, handle auto-reschedule
      if (status === 'no-show') {
        const business = await storage.getBusinessById(appointment.businessId);
        if (business) {
          // Send reschedule SMS
          const rescheduleLink = `https://www.pleasantcovedesign.com/schedule?lead_id=${appointment.businessId}`;
          const firstName = business.name.split(' ')[0];
          const rescheduleMessage = `Hey ${firstName}, sorry we missed you! You can rebook here: ${rescheduleLink}`;
          
          console.log(`[Auto-Reschedule SMS] To ${business.phone}: ${rescheduleMessage}`);
          
          await storage.createActivity({
            type: 'sms_sent',
            description: 'Auto-reschedule message sent after no-show',
            businessId: appointment.businessId,
          });
        }
      }

      res.json(appointment);
    } catch (error) {
      console.error("Failed to update appointment:", error);
      res.status(500).json({ error: "Failed to update appointment" });
    }
  });

  // Delete/Cancel appointment
  app.delete("/api/appointments/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Update status to cancelled instead of deleting
      const [appointment] = await db.update(schema.appointments)
        .set({ 
          status: 'cancelled',
          updatedAt: new Date().toISOString()
        })
        .where(eq(schema.appointments.id, id))
        .returning();

      if (!appointment) {
        return res.status(404).json({ error: "Appointment not found" });
      }

      // Update business stage if no other appointments
      const otherAppointments = await db.select()
        .from(schema.appointments)
        .where(
          and(
            eq(schema.appointments.businessId, appointment.businessId),
            ne(schema.appointments.id, id),
            ne(schema.appointments.status, 'cancelled')
          )
        );

      if (otherAppointments.length === 0) {
        await storage.updateBusiness(appointment.businessId, {
          stage: 'contacted',
        });
      }

      // Log activity
      await storage.createActivity({
        type: "appointment_cancelled",
        description: `Appointment cancelled`,
        businessId: appointment.businessId,
      });

      res.json({ success: true, appointment });
    } catch (error) {
      console.error("Failed to cancel appointment:", error);
      res.status(500).json({ error: "Failed to cancel appointment" });
    }
  });

  // Get appointment history for a business
  app.get("/api/businesses/:id/appointments", async (req, res) => {
    try {
      const businessId = parseInt(req.params.id);
      
      const appointments = await db.select()
        .from(schema.appointments)
        .where(eq(schema.appointments.businessId, businessId))
        .orderBy(desc(schema.appointments.datetime));
        
      res.json(appointments);
    } catch (error) {
      console.error("Failed to fetch business appointments:", error);
      res.status(500).json({ error: "Failed to fetch appointments" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
