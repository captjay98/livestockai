# Extension Worker Guide - District Dashboard & Farm Visits

## Overview

As an extension worker, you monitor farm health across your assigned district, detect potential disease outbreaks, and provide advisory services to farmers. This guide covers the district dashboard, farm health monitoring, and creating visit records.

## Getting Started

### Prerequisites

1. Your admin must assign you to one or more districts
2. You need active access grants from farmers to view their data
3. Navigate to Extension → District Dashboard

## District Dashboard

### Overview

The district dashboard shows all farms you have access to in your assigned district.

### Key Features

- **Stats Cards**: Total farms, healthy/warning/critical counts, active alerts
- **Farm List**: Sortable table with health status indicators
- **Filters**: Livestock type, health status, search by name
- **Export**: Download CSV for reporting

### Health Status Indicators

- 🟢 **Green**: Farm is healthy (mortality < amber threshold)
- 🟡 **Amber**: Needs attention (mortality >= amber threshold)
- 🔴 **Red**: Critical (mortality >= red threshold)

### Viewing Farm Details

Click on any farm card to view:

- Batch information
- Mortality trends
- Growth metrics
- Visit history
- **Financial data** (only if farmer granted visibility)

## Requesting Farm Access

### When You Need Access

Before you can view a farm's data, you must request access from the farmer.

### How to Request

1. Navigate to the farm (from district dashboard or search)
2. Click "Request Access"
3. Fill in the form:
   - **Purpose**: Explain why you need access (e.g., "Routine health inspection")
   - **Duration**: How many days (default: 90)
4. Submit request

### Waiting for Approval

- Farmer receives notification
- They can approve (with/without financial visibility) or deny
- You'll be notified of their decision
- If approved, you can immediately view the farm

## Creating Visit Records

### When to Create a Visit

- After every farm visit
- Document findings and recommendations
- Provide actionable advice to farmers

### Step-by-Step

1. Navigate to farm health summary
2. Click "Create Visit Record"
3. Fill in details:
   - **Visit Date**: When you visited
   - **Visit Type**: Routine, Emergency, or Follow-up
   - **Findings**: What you observed (be specific)
   - **Recommendations**: What farmer should do
   - **Attachments**: Photos, documents (max 5MB each)
   - **Follow-up Date**: When to revisit (optional)
4. Submit

### Best Practices

- Be specific in findings (e.g., "Observed 5 birds with respiratory symptoms in Batch A")
- Provide actionable recommendations (e.g., "Increase ventilation, monitor for 48 hours")
- Attach photos of issues when possible
- Set follow-up dates for serious issues

### Editing Visits

- Editable within 24 hours of creation
- After 24 hours, visits are locked
- Farmers can see your edits

## Outbreak Alerts

### What are Outbreak Alerts?

Automatic warnings when 3+ farms in your district show high mortality for the same species within 7 days.

### Severity Levels

- **Critical**: 5+ farms OR average mortality >= red threshold
- **Alert**: 3-4 farms affected
- **Watch**: Monitoring situation

### Managing Alerts

1. Navigate to Extension → Outbreak Alerts
2. Click on an alert to view details
3. Update status:
   - **Active**: Ongoing situation
   - **Monitoring**: Under observation
   - **Resolved**: Issue addressed
   - **False Positive**: Not an actual outbreak
4. Add notes about actions taken

## Mobile Field Use

### Optimized for Field Work

- Large touch targets (works with gloves)
- Offline mode (syncs when online)
- Works in bright sunlight
- Minimal data usage

### Offline Workflow

1. View farms while online (data cached)
2. Go offline in the field
3. Create visit records offline
4. Records sync automatically when online

## Reporting

### CSV Exports

Export district data for:

- Monthly reports to supervisors
- Government reporting requirements
- Stakeholder presentations

### What's Included

- Farm names and locations
- Health status
- Mortality rates
- Last visit dates
- Contact information

## Common Questions

### Q: How do I get assigned to a district?

**A:** Contact your admin or supervisor. They manage district assignments.

### Q: What if a farmer denies my access request?

**A:** Contact them directly to explain your purpose. You can submit a new request with more details.

### Q: Can I see financial data?

**A:** Only if the farmer explicitly grants financial visibility when approving your request.

### Q: How long does access last?

**A:** Default is 90 days, but farmers can set custom durations or revoke access at any time.

### Q: What if I make a mistake in a visit record?

**A:** Edit it within 24 hours. After that, contact your supervisor.

### Q: Can I access farms outside my district?

**A:** No, you can only request access to farms in your assigned districts.

## Troubleshooting

### I can't see any farms

- Verify you're assigned to a district (check with admin)
- Ensure you have active access grants
- Check you're viewing the correct district

### My visit record won't save

- Check your internet connection
- Ensure all required fields are filled
- Verify attachments are under 5MB each

### Outbreak alert not showing

- Ensure 3+ farms have high mortality
- Check that farms have the same species
- Verify mortality occurred within 7 days

## Support

- **Email**: support@livestockai.com
- **Documentation**: https://docs.livestockai.com
- **Emergency**: Contact your supervisor

## Related Guides

- [Extension Worker Mode Overview](../EXTENSION_WORKER_MODE.md)
- [Farmer Guide](./farmer-guide.md)
- [Supervisor Guide](./supervisor-guide.md)

---

**Version**: 1.0  
**Last Updated**: January 29, 2026
