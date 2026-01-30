# Admin Guide - Extension Worker Mode Configuration

## Overview

As an admin, you configure and manage Extension Worker Mode for your organization. This includes assigning extension workers to districts, managing geographic regions, and configuring mortality thresholds.

## District Assignment

### Accessing Assignment Management

Navigate to Admin → Extension → Assignments

### Assigning Users to Districts

1. Click "Assign User"
2. Select user from dropdown
3. Select district
4. Toggle "Supervisor" if applicable
5. Click "Assign"

### Bulk Assignment

For multiple users:

1. Select multiple users (checkbox)
2. Click "Bulk Assign"
3. Select district
4. All selected users are assigned

### Removing Assignments

1. Find user in assignment table
2. Click "Remove" next to district
3. Confirm removal

### Supervisor Flag

- Supervisors can view multiple districts
- They see aggregated regional data
- Use for senior extension workers

## Region Management

### Accessing Region Management

Navigate to Admin → Extension → Regions

### Geographic Hierarchy

```
Country (e.g., Nigeria)
└── Region (e.g., North West)
    └── District (e.g., Kano)
```

### Creating Regions

1. Click "+ Country" to add a country
2. Click "+ Region" under a country
3. Click "+ District" under a region
4. Fill in name and slug (URL-friendly name)
5. Save

### Editing Regions

1. Click "Edit" next to region/district
2. Update name or slug
3. Save changes

### Deactivating Regions

- Only possible if no farms are assigned
- Prevents new assignments
- Existing data remains intact

### Region Statistics

Each region shows:

- Number of farms
- Number of extension workers
- Active status

## Threshold Configuration

### Accessing Threshold Management

Navigate to Admin → Extension → Thresholds

### Species Thresholds

Configure amber and red mortality thresholds for each species:

| Species | Default Amber | Default Red |
| ------- | ------------- | ----------- |
| Broiler | 5%            | 10%         |
| Layer   | 3%            | 7%          |
| Catfish | 12%           | 18%         |
| Tilapia | 10%           | 15%         |
| Cattle  | 2%            | 5%          |
| Goats   | 3%            | 7%          |
| Sheep   | 3%            | 7%          |

### Editing Thresholds

1. Click "Edit" next to species
2. Update amber threshold (must be < red)
3. Update red threshold
4. Preview health status calculation
5. Save

### Regional Overrides

Create region-specific thresholds:

1. Click "Add Override"
2. Select region
3. Set custom thresholds
4. Save

**Example**: Lagos district might have stricter thresholds due to higher disease risk.

### Resetting Thresholds

Click "Reset to Defaults" to restore global defaults.

## Audit Logs

### Viewing Audit Logs

Navigate to Admin → Audit Logs

### What's Logged

- District assignments
- Access requests and responses
- Visit record creation/edits
- Outbreak alert updates
- Threshold changes
- Region management actions

### Filtering Logs

- By user
- By action type
- By date range
- By entity (farm, district, etc.)

### Exporting Logs

Export audit logs to CSV for:

- Compliance reporting
- Security audits
- Performance analysis

## User Management

### Extension Worker Accounts

- Create user accounts for extension workers
- Assign role: "user" (not "admin")
- Assign to districts via Assignment Management
- Set supervisor flag if applicable

### Farmer Accounts

- Farmers create their own accounts
- Admins can verify accounts
- Admins can reset passwords if needed

## System Configuration

### Notification Settings

Configure notification preferences:

- Access request notifications
- Outbreak alert notifications
- Expiry warning timing (default: 7 days)

### Access Grant Defaults

- Default duration: 90 days
- Maximum duration: 365 days
- Edit window: 24 hours (for visit records)

### Outbreak Detection Parameters

- Minimum farms: 3
- Time window: 7 days
- Minimum batch size: 50
- Minimum batch age: 7 days

## Best Practices

### District Assignment

- Assign workers to their geographic area
- Limit to 2-3 districts per worker
- Designate 1 supervisor per 5-10 workers
- Review assignments quarterly

### Threshold Configuration

- Use defaults unless regional data justifies changes
- Document reasons for overrides
- Review thresholds annually
- Consult veterinary experts

### Region Management

- Use consistent naming conventions
- Keep hierarchy simple (3 levels max)
- Document region boundaries
- Update as administrative boundaries change

## Common Questions

### Q: How many districts can a user be assigned to?

**A:** No hard limit, but 2-3 is recommended for effective coverage.

### Q: Can I delete a district?

**A:** No, only deactivate. This preserves historical data.

### Q: What if I set thresholds too low?

**A:** You'll get too many false alerts. Monitor alert frequency and adjust.

### Q: Can extension workers see admin functions?

**A:** No, only users with "admin" role can access admin functions.

### Q: How do I bulk import districts?

**A:** Currently manual entry only. Contact support for bulk import assistance.

## Troubleshooting

### User can't see district dashboard

- Verify user is assigned to a district
- Check user has "user" role (not just "admin")
- Ensure district is active

### Outbreak alerts not triggering

- Verify threshold configuration
- Check minimum farm count (default: 3)
- Ensure farms have same species
- Verify time window (default: 7 days)

### Region hierarchy not displaying

- Check parent-child relationships
- Verify all regions are active
- Clear browser cache

## Security Considerations

### Access Control

- Only admins can assign districts
- Only admins can configure thresholds
- Audit logs track all admin actions
- Regular security reviews recommended

### Data Privacy

- Extension workers only see assigned districts
- Financial data requires farmer approval
- Audit logs show who accessed what data
- GDPR-compliant data handling

## Support

- **Email**: admin@livestockai.com
- **Documentation**: https://docs.livestockai.com
- **Training**: Contact for admin training sessions

## Related Guides

- [Extension Worker Mode Overview](../EXTENSION_WORKER_MODE.md)
- [Extension Worker Guide](./agent-guide.md)
- [Supervisor Guide](./supervisor-guide.md)

---

**Version**: 1.0  
**Last Updated**: January 29, 2026
