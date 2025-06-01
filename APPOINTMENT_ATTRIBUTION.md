# Appointment Attribution System

## Overview
Every appointment in LocalBiz Pro is directly tied to its corresponding business/client for complete tracking and history.

## Current Implementation

### Data Structure
Appointments are currently stored in the `businesses` table with these fields:
- `scheduledTime` - ISO timestamp of the appointment
- `appointmentStatus` - 'confirmed' | 'completed' | 'no-show'
- `stage` - Set to 'scheduled' when appointment exists

**Limitation**: Only ONE active appointment per business at a time.

### Appointment Display in Client Profile

#### 1. Current/Active Appointment
- Displayed prominently with blue background
- Shows date, time, and current status
- Includes action buttons:
  - **Complete** - Mark appointment as completed
  - **No-show** - Mark as no-show (triggers auto-reschedule SMS)
- Self-scheduled appointments show special badge

#### 2. Historical Appointments
- Shown from the `activities` table
- Tracks all appointment-related activities:
  - `meeting_scheduled` - Initial booking
  - `meeting_rescheduled` - Changed appointments
  - `appointment_status_updated` - Status changes
  - `no_show` - No-show events

#### 3. Features
- **Schedule New Appointment** button for easy booking
- Visual status badges (confirmed, completed, no-show)
- Activity timeline showing appointment history
- Automatic activity logging for all changes

## API Endpoints

### Get Appointments
```
GET /api/scheduling/appointments
```
Returns all businesses with scheduled appointments, including:
- `businessId` - Links to business record
- `datetime` - Appointment time
- `appointmentStatus` - Current status
- `isAutoScheduled` - Whether self-booked

### Update Appointment Status
```
PATCH /api/scheduling/appointments/:businessId/status
Body: { status: 'confirmed' | 'completed' | 'no-show' }
```

### Schedule New Appointment
```
POST /api/schedule
Body: { business_id: 123, datetime: "2025-06-05T08:30:00Z" }
```

## Automatic Actions

### No-Show Handling
When marked as no-show:
1. Status updated to 'no-show'
2. Activity logged
3. Auto-reschedule SMS sent with booking link
4. Original appointment preserved for history

### Activity Logging
Every appointment action creates an activity record:
- Links to `businessId`
- Timestamped
- Descriptive message
- Used for historical tracking

## Usage in UI

### Client Profile (/clients/:id)
- **Bookings Tab** shows:
  - Current appointment with actions
  - Historical appointments from activities
  - Quick scheduling button

### Scheduling Page
- Drag & drop to calendar
- Modal for time selection
- Automatic businessId linkage

### Dashboard/Analytics
- Appointment counts
- No-show tracking
- Conversion metrics

## Future Enhancements

### Recommended: Separate Appointments Table
Create dedicated `appointments` table:
```sql
CREATE TABLE appointments (
  id INTEGER PRIMARY KEY,
  businessId INTEGER REFERENCES businesses(id),
  datetime TEXT NOT NULL,
  status TEXT DEFAULT 'confirmed',
  method TEXT DEFAULT 'manual',
  duration INTEGER DEFAULT 30,
  notes TEXT,
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP
);
```

Benefits:
- Multiple appointments per business
- Complete appointment history
- Better reporting capabilities
- Recurring appointment support

### Additional Features
1. **Appointment Reminders**
   - SMS 24 hours before
   - Email confirmations

2. **Recurring Appointments**
   - Weekly/monthly scheduling
   - Automatic rebooking

3. **Appointment Types**
   - Initial consultation
   - Follow-up
   - Delivery/presentation

4. **Integration with Calendar Apps**
   - Google Calendar sync
   - iCal export

## Key Points

✅ Every appointment MUST have a `businessId`
✅ All status changes are logged as activities
✅ No-shows trigger automatic rescheduling
✅ Historical tracking via activities table
✅ UI shows both current and past appointments
✅ Easy access to schedule new appointments

The system ensures complete appointment attribution while maintaining simplicity and efficiency in the current single-appointment-per-business model. 