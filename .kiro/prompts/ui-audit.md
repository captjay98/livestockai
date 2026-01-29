---
description: 'Audit UI components against Rugged Utility standards'
---

# @ui-audit

Verify that UI components meet LivestockAI's "Rugged Utility" design standards for field use.

## Context

**Project**: LivestockAI
**Design System**: Rugged Utility - built for farmers in the field
**Reference**: `.kiro/steering/ui-standards.md`

## Objective

Audit components to ensure they meet:

1. Touch target minimums (48px+)
2. Signal palette usage (Green/Amber/Red)
3. Offline indicator presence
4. Mobile-first responsive design

## Step 0: Scope Selection

Ask the user:

> What would you like to audit?
>
> 1. **Full audit** - All components and routes
> 2. **Specific component** - e.g., "BatchDialog"
> 3. **Route page** - e.g., "batches/index"
> 4. **Component category** - dialogs, cards, forms

## Step 1: Touch Target Audit

Check button and interactive element sizes:

```bash
# Find all Button usages
grep -r "size=" app/components --include="*.tsx" | grep -E "(sm|xs)"
```

**Violations to flag:**

- `size="sm"` on primary actions
- `size="icon"` without 44px minimum
- List items under 48px height

**Fix pattern:**

```tsx
// ❌ Too small for field use
<Button size="sm">Save</Button>

// ✅ Proper touch target
<Button size="default">Save</Button>
```

## Step 2: Color Usage Audit

Verify Signal Palette compliance:

```bash
# Find hardcoded colors (should use semantic tokens)
grep -rE "text-(red|green|amber|blue)-[0-9]+" app/routes --include="*.tsx"
```

**Should use:**

- `text-success` / `bg-success` for positive
- `text-warning` / `bg-warning` for alerts
- `text-destructive` / `bg-destructive` for errors

## Step 3: Batch Header Compliance

Every batch-related page needs the standard header:

```bash
# Check batch routes for header pattern
cat app/routes/_auth/batches/\$batchId/index.tsx | head -50
```

**Required elements:**

- [ ] Species icon
- [ ] Batch name
- [ ] Age indicator (weeks/days)
- [ ] Sync status indicator
- [ ] Sticky positioning

## Step 4: Action Grid Check

Verify Command Center pattern on batch pages:

```tsx
// Required Action Grid structure
<div className="grid grid-cols-3 gap-3">
  <ActionButton icon={Utensils} label="Feed" />
  <ActionButton icon={Skull} label="Death" />
  <ActionButton icon={DollarSign} label="Sale" />
  <ActionButton icon={Scale} label="Weigh" />
  <ActionButton icon={Syringe} label="Vax" />
  <ActionButton icon={Droplet} label="Water" />
</div>
```

**Check:**

- [ ] Minimum 64px × 64px cells
- [ ] Icons + labels visible
- [ ] Consistent across batch types

## Step 5: Mobile Responsiveness

Test responsive breakpoints:

```bash
# Find responsive classes
grep -rE "sm:|md:|lg:" app/routes/_auth --include="*.tsx" | head -20
```

**Verify:**

- Tables transform to cards on mobile
- Navigation collapses properly
- Forms stack vertically on small screens

## Step 6: Offline Indicators

Check for sync status display:

```bash
grep -r "sync" app/components --include="*.tsx"
```

**Required on:**

- [ ] Navigation header
- [ ] Batch headers
- [ ] After form submissions

## Audit Report Template

```markdown
## UI Audit Report - [Component/Route]

### Touch Targets

| Element     | Current | Required | Status |
| ----------- | ------- | -------- | ------ |
| Save button | 36px    | 48px     | ❌     |
| List rows   | 48px    | 48px     | ✅     |

### Color Compliance

| Usage   | Current        | Should Be    | Status |
| ------- | -------------- | ------------ | ------ |
| Revenue | text-green-600 | text-success | ❌     |

### Batch Header

- [ ] Species icon present
- [ ] Age indicator present
- [ ] Sync status present

### Action Grid

- [ ] 6 actions present
- [ ] 64px minimum cells
- [ ] Icons + labels

### Recommendations

1. [Specific fix]
2. [Specific fix]
```

## Validation

After fixes:

```bash
bun run check
bun run lint
```

## Success Criteria

- [ ] All buttons meet 48px minimum
- [ ] Semantic color tokens used throughout
- [ ] Batch pages have standard header
- [ ] Action Grid present on batch detail
- [ ] Mobile responsive verified

## Related Prompts

- `@plan-structure` - For route reorganization
- `@accessibility-audit` - For WCAG compliance
- `@performance-audit` - For load time optimization
