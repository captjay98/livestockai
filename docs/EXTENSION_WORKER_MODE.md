# Extension Worker Mode - User Guide

## Overview

Extension Worker Mode enables government agricultural extension services and NGOs to monitor farm health across districts, detect disease outbreaks early, and provide digital advisory services to farmers. This B2G (Business-to-Government) feature transforms LivestockAI into a powerful tool for agricultural oversight and farmer support.

## Key Features

### 1. District Dashboard

- Monitor all farms in your assigned district at a glance
- Color-coded health status (green/amber/red) based on mortality rates
- Filter by livestock type, health status, or search by farm name
- Export farm data to CSV for reporting

### 2. Outbreak Detection

- Automatic alerts when 3+ farms show high mortality
- Severity classification (critical/alert/watch)
- Track affected farms and species
- Update alert status as situations evolve

### 3. Digital Visit Records

- Record farm visits digitally with findings and recommendations
- Attach photos and documents (up to 5MB per file)
- Set follow-up dates for future visits
- Editable within 24 hours of creation

### 4. Privacy-First Access

- Farmers control who can view their data
- Time-limited access grants (default 90 days)
- Optional financial data visibility
- Farmers can revoke access at any time

### 5. Supervisor Dashboard

- Multi-district overview for senior extension workers
- Aggregated statistics across all supervised districts
- Regional mortality trends
- Active outbreak alerts per district

## User Roles

### Extension Worker (Observer)

- Assigned to one or more districts
- Can view farms with active access grants
- Can create visit records
- Can view and update outbreak alerts

### Supervisor

- Extension worker with supervisor flag
- Can view all districts they supervise
- Access to aggregated regional data
- Can drill down to specific districts

### Farmer (Farm Owner)

- Receives access requests from extension workers
- Approves or denies requests
- Can revoke access at any time
- Views visit history from extension workers

### Admin

- Assigns extension workers to districts
- Manages geographic regions (countries, regions, districts)
- Configures species-specific mortality thresholds
- Views audit logs

## Getting Started

### For Extension Workers

1. **Get Assigned**: Your admin will assign you to one or more districts
2. **Request Access**: Navigate to a farm and request access (explain your purpose)
3. **Wait for Approval**: Farmer will approve or deny your request
4. **View Farm Health**: Once approved, view farm details and health metrics
5. **Create Visit Records**: Document your farm visits with findings and recommendations

See: [Extension Worker Guide](./extension/agent-guide.md)

### For Farmers

1. **Receive Requests**: Extension workers will request access to your farm
2. **Review Purpose**: Check why they need access and for how long
3. **Approve/Deny**: Decide whether to grant access and if they can see financial data
4. **View Visits**: See all visit records from extension workers
5. **Acknowledge Visits**: Mark visits as acknowledged after reviewing

See: [Farmer Guide](./extension/farmer-guide.md)

### For Supervisors

1. **View All Districts**: See aggregated data across all your districts
2. **Monitor Trends**: Track regional mortality trends
3. **Drill Down**: Click on a district to see detailed farm list
4. **Export Data**: Generate CSV reports for stakeholders

See: [Supervisor Guide](./extension/supervisor-guide.md)

### For Admins

1. **Assign Workers**: Add extension workers to districts
2. **Manage Regions**: Create and organize geographic hierarchy
3. **Configure Thresholds**: Set species-specific mortality thresholds
4. **Monitor Activity**: View audit logs of all actions

See: [Admin Guide](./extension/admin-guide.md)

## Access Control

### Access Request Workflow

1. Extension worker submits access request with purpose and duration
2. Farmer receives notification
3. Farmer approves (with optional financial visibility) or denies
4. If approved, access grant is created with expiration date
5. Extension worker can now view farm data
6. Farmer can revoke access at any time

### Access Grant Details

- **Default Duration**: 90 days
- **Financial Visibility**: Optional (farmer decides)
- **Expiration Warning**: 7 days before expiry
- **Revocation**: Immediate effect, both parties notified

## Health Status Calculation

Farms are classified based on mortality rate:

| Species | Amber Threshold | Red Threshold |
| ------- | --------------- | ------------- |
| Broiler | 5%              | 10%           |
| Layer   | 3%              | 7%            |
| Catfish | 12%             | 18%           |
| Tilapia | 10%             | 15%           |
| Cattle  | 2%              | 5%            |
| Goats   | 3%              | 7%            |
| Sheep   | 3%              | 7%            |

**Health Status:**

- 🟢 **Green**: Mortality rate < amber threshold
- 🟡 **Amber**: Mortality rate >= amber threshold and < red threshold
- 🔴 **Red**: Mortality rate >= red threshold

Admins can configure custom thresholds per region.

## Outbreak Detection

Outbreaks are automatically detected when:

- 3+ farms in the same district
- Same livestock species
- High mortality (above amber threshold)
- Within 7-day window

**Severity Levels:**

- **Critical**: 5+ farms affected OR average mortality >= red threshold
- **Alert**: 3-4 farms affected
- **Watch**: Monitoring situation

## Visit Records

### Creating a Visit

1. Navigate to farm health summary
2. Click "Create Visit Record"
3. Fill in visit details:
   - Visit date
   - Visit type (routine/emergency/follow-up)
   - Findings (what you observed)
   - Recommendations (what farmer should do)
   - Attachments (optional photos/documents)
   - Follow-up date (optional)
4. Submit

### Editing a Visit

- Editable within 24 hours of creation
- After 24 hours, visits are locked
- Farmers can see edit history

### Farmer Acknowledgment

- Farmers can acknowledge visits (one-time action)
- Unacknowledged visits are highlighted
- Helps track which recommendations have been reviewed

## Mobile Usage

Extension Worker Mode is fully mobile-responsive:

- Large touch targets (48px minimum)
- Works offline (syncs when online)
- Optimized for field use
- Works on cracked screens and in bright sunlight

## Data Privacy

### What Extension Workers Can See

- Farm name and location
- Batch information (species, quantity, age)
- Mortality records
- Health status and trends
- Visit history
- **Financial data** (only if farmer grants visibility)

### What Extension Workers Cannot See

- Financial data (unless explicitly granted)
- Other farms outside their district
- Farms without active access grants
- Revoked access grants

## Notifications

Users receive notifications for:

- **Farmers**: Access requests, visit records, access expiry warnings
- **Extension Workers**: Access approvals/denials, outbreak alerts
- **Supervisors**: Critical outbreak alerts, district summaries

## Reporting

### CSV Exports

- District dashboard: Export all farms with health status
- Supervisor dashboard: Export all districts with statistics
- Visit records: Export visit history per farm

### Audit Logs

- All actions are logged for accountability
- Includes user, action, timestamp, and details
- Admins can view full audit trail

## Troubleshooting

### I can't see any farms

- Check that you've been assigned to a district (contact admin)
- Ensure you have active access grants (request access from farmers)
- Verify you're viewing the correct district

### My access request was denied

- Contact the farmer directly to explain your purpose
- Ensure your request includes a clear reason
- Try requesting again with more details

### I can't edit my visit record

- Visits are only editable within 24 hours of creation
- After 24 hours, contact your supervisor if changes are needed

### Outbreak alert not appearing

- Ensure 3+ farms have high mortality in the same district
- Check that farms have the same livestock species
- Verify mortality occurred within the last 7 days

## Support

For technical support or feature requests:

- Email: support@livestockai.com
- Documentation: https://docs.livestockai.com
- Community Forum: https://community.livestockai.com

## Related Documentation

- [Farmer Guide](./extension/farmer-guide.md) - Managing access requests
- [Extension Worker Guide](./extension/agent-guide.md) - Using the district dashboard
- [Supervisor Guide](./extension/supervisor-guide.md) - Multi-district oversight
- [Admin Guide](./extension/admin-guide.md) - System configuration

---

**Version**: 1.0  
**Last Updated**: January 29, 2026  
**Status**: Production Ready
