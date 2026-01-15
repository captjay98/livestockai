# Feature: Settings Page UX Improvements

The following plan should be complete, but validate documentation and codebase patterns before implementing.

## Feature Description

Improve the Settings page UX by:

1. Consolidating 8 tabs into 5 logical groups (Regional, Preferences, Notifications, Business, Modules, Integrations)
2. Enhancing Module selector with expandable cards showing full details before saving
3. Optimizing notification toggles with grouped layout and category-level controls

## User Story

As a farm owner
I want a cleaner, more intuitive settings page
So that I can quickly find and configure the settings I need without cognitive overload

## Problem Statement

Current settings page has 8 tabs which fragments related settings:

- Currency, Date & Time, Units are separate but all regional/locale settings
- Notification toggles are verbose (11 individual switches)
- Module selector auto-saves on click without showing full details

## Solution Statement

1. **Tab Consolidation**: Merge Currency + Date/Time + Units into "Regional" tab
2. **Module UX**: Click expands card to show species, feed types, structures - explicit Save button
3. **Notification Toggles**: Group by category with "All On/Off" per group, compact grid layout

## Feature Metadata

**Feature Type**: Enhancement/Refactor
**Estimated Complexity**: Medium
**Primary Systems Affected**: Settings page, Module selector component
**Dependencies**: None (UI-only changes)

---

## CONTEXT REFERENCES

### Relevant Codebase Files - READ BEFORE IMPLEMENTING

- `app/routes/_auth/settings/index.tsx` - Main settings page with all 8 tabs
- `app/components/modules/selector.tsx` - Current module selector (auto-save on click)
- `app/features/modules/constants.ts` - MODULE_METADATA with all details to display
- `app/components/ui/switch.tsx` - Switch component for toggles
- `app/components/ui/collapsible.tsx` - Collapsible component for expandable sections

### Files to Modify

- `app/routes/_auth/settings/index.tsx` - Consolidate tabs, improve notification toggles
- `app/components/modules/selector.tsx` - Add expandable details, explicit save

### Patterns to Follow

**Tab Structure Pattern** (from settings/index.tsx):

```tsx
<Tabs defaultValue="regional" className="space-y-4">
  <TabsList>
    <TabsTrigger value="regional">Regional</TabsTrigger>
  </TabsList>
  <TabsContent value="regional">{/* Content */}</TabsContent>
</Tabs>
```

**Switch Toggle Pattern** (from settings/index.tsx):

```tsx
<div className="flex items-center justify-between">
  <div>
    <Label htmlFor="id">Label</Label>
    <p className="text-xs text-muted-foreground">Description</p>
  </div>
  <Switch id="id" checked={value} onCheckedChange={handler} />
</div>
```

**Module Metadata Structure** (from modules/constants.ts):

```typescript
{
  key: 'poultry',
  name: 'Poultry',
  description: 'Chicken farming (broilers, layers)',
  icon: '🐔',
  livestockTypes: ['poultry'],
  speciesOptions: [{ value: 'broiler', label: 'Broiler' }, ...],
  sourceSizeOptions: [...],
  feedTypes: ['starter', 'grower', 'finisher', 'layer_mash'],
  structureTypes: ['house', 'pen', 'cage'],
}
```

---

## IMPLEMENTATION PLAN

### Phase 1: Tab Consolidation

Merge Currency, Date & Time, and Units tabs into single "Regional" tab with sections.

**Tasks:**

- Remove 3 separate TabsTrigger entries
- Create single "Regional" TabsContent with 3 sections
- Add section headers with dividers

### Phase 2: Notification Toggles Optimization

Group toggles by category with compact layout and group-level controls.

**Tasks:**

- Create notification groups: Critical, Reminders, Reports
- Add "Enable All" / "Disable All" per group
- Use 2-column grid for toggles within each group

### Phase 3: Module Selector Enhancement

Replace auto-save with expandable details and explicit save.

**Tasks:**

- Track selected modules in local state (not auto-save)
- Click expands card to show full details
- Add "Save Changes" button at bottom
- Show species, feed types, structure types in expanded view

---

## STEP-BY-STEP TASKS

### Task 1: UPDATE `app/routes/_auth/settings/index.tsx` - Consolidate Tabs

- **IMPLEMENT**: Replace 8 tabs with 5 tabs: Regional, Preferences, Notifications, Business, Modules, Integrations
- **REMOVE**: Separate Currency, Date & Time, Units TabsTrigger entries
- **ADD**: Single "Regional" tab containing all three sections with headers

**New Tab Structure:**

```tsx
<TabsList className="flex-wrap">
  <TabsTrigger value="regional">Regional</TabsTrigger>
  <TabsTrigger value="preferences">Preferences</TabsTrigger>
  <TabsTrigger value="notifications">Notifications</TabsTrigger>
  <TabsTrigger value="business">Business</TabsTrigger>
  <TabsTrigger value="modules">Modules</TabsTrigger>
  <TabsTrigger value="integrations">Integrations</TabsTrigger>
</TabsList>
```

- **VALIDATE**: `bun run check`

### Task 2: UPDATE `app/routes/_auth/settings/index.tsx` - Regional Tab Content

- **IMPLEMENT**: Combine Currency, Date/Time, Units into single TabsContent
- **PATTERN**: Use section headers with `<h3>` and `border-t` dividers

**Structure:**

```tsx
<TabsContent value="regional">
  <Card className="p-6 space-y-6">
    {/* Currency Section */}
    <div>
      <h3 className="text-base font-semibold mb-4">Currency</h3>
      {/* Currency fields */}
    </div>

    <div className="border-t pt-6">
      <h3 className="text-base font-semibold mb-4">Date & Time</h3>
      {/* Date/time fields */}
    </div>

    <div className="border-t pt-6">
      <h3 className="text-base font-semibold mb-4">Units of Measurement</h3>
      {/* Unit fields */}
    </div>
  </Card>
</TabsContent>
```

- **VALIDATE**: `bun run check`

### Task 3: UPDATE `app/routes/_auth/settings/index.tsx` - Rename Alerts to Notifications

- **IMPLEMENT**: Move Alerts tab content to new "Notifications" tab
- **REMOVE**: "Alerts" TabsTrigger
- **ADD**: "Notifications" TabsTrigger with Bell icon
- **IMPORTS**: Add `Bell` from lucide-react

- **VALIDATE**: `bun run check`

### Task 4: UPDATE `app/routes/_auth/settings/index.tsx` - Notification Toggle Groups

- **IMPLEMENT**: Replace verbose individual toggles with grouped compact layout
- **ADD**: Helper function to toggle all in a group
- **PATTERN**: 2-column grid within each category

**Structure:**

```tsx
{
  /* Critical Alerts Group */
}
;<div className="space-y-3">
  <div className="flex items-center justify-between">
    <h4 className="text-sm font-medium">Critical Alerts</h4>
    <Button
      variant="ghost"
      size="sm"
      onClick={() => toggleGroup('critical', true)}
    >
      Enable All
    </Button>
  </div>
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
    {/* Compact toggle items */}
  </div>
</div>
```

**Compact Toggle Item:**

```tsx
<div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
  <span className="text-sm">High Mortality</span>
  <Switch checked={...} onCheckedChange={...} />
</div>
```

- **VALIDATE**: `bun run check`

### Task 5: UPDATE `app/components/modules/selector.tsx` - Local State

- **IMPLEMENT**: Track selections in local state instead of auto-saving
- **ADD**: `selectedModules` state initialized from `enabledModules`
- **REMOVE**: Direct `toggleModule` calls on click
- **ADD**: Click toggles local selection only

```tsx
const [selectedModules, setSelectedModules] =
  useState<ModuleKey[]>(enabledModules)
const [expandedModule, setExpandedModule] = useState<ModuleKey | null>(null)

const handleCardClick = (moduleKey: ModuleKey) => {
  if (expandedModule === moduleKey) {
    // Toggle selection
    setSelectedModules((prev) =>
      prev.includes(moduleKey)
        ? prev.filter((k) => k !== moduleKey)
        : [...prev, moduleKey],
    )
  } else {
    // Expand to show details
    setExpandedModule(moduleKey)
  }
}
```

- **VALIDATE**: `bun run check`

### Task 6: UPDATE `app/components/modules/selector.tsx` - Expanded Details

- **IMPLEMENT**: Show module details when expanded
- **PATTERN**: Use Collapsible or conditional rendering
- **DISPLAY**: Species options, source sizes, feed types, structure types

**Expanded Content:**

```tsx
{
  expandedModule === moduleKey && (
    <div className="mt-3 pt-3 border-t space-y-2 text-xs">
      <div>
        <span className="font-medium">Species:</span>
        <span className="ml-2 text-muted-foreground">
          {module.speciesOptions.map((s) => s.label).join(', ')}
        </span>
      </div>
      <div>
        <span className="font-medium">Feed Types:</span>
        <span className="ml-2 text-muted-foreground">
          {module.feedTypes.join(', ')}
        </span>
      </div>
      <div>
        <span className="font-medium">Structures:</span>
        <span className="ml-2 text-muted-foreground">
          {module.structureTypes.join(', ')}
        </span>
      </div>
    </div>
  )
}
```

- **VALIDATE**: `bun run check`

### Task 7: UPDATE `app/components/modules/selector.tsx` - Save Button

- **IMPLEMENT**: Add Save Changes button that applies all selections
- **ADD**: `hasChanges` computed from comparing `selectedModules` to `enabledModules`
- **ADD**: `handleSave` function that calls `toggleModule` for each change

```tsx
const hasChanges =
  JSON.stringify([...selectedModules].sort()) !==
  JSON.stringify([...enabledModules].sort())

const handleSave = async () => {
  const toEnable = selectedModules.filter((m) => !enabledModules.includes(m))
  const toDisable = enabledModules.filter((m) => !selectedModules.includes(m))

  for (const m of toEnable) await toggleModule(m)
  for (const m of toDisable) {
    const canDisable = await canDisableModule(m)
    if (canDisable) await toggleModule(m)
  }
}

// At bottom of component
{
  hasChanges && (
    <div className="flex justify-end pt-4">
      <Button onClick={handleSave}>Save Changes</Button>
    </div>
  )
}
```

- **VALIDATE**: `bun run check`

### Task 8: Final Validation

- **VALIDATE**: `bun run check && bun run lint`
- **MANUAL**: Test all tabs render correctly
- **MANUAL**: Test module expansion and save
- **MANUAL**: Test notification group toggles

---

## TESTING STRATEGY

### Manual Testing

1. **Tab Navigation**: All 5 tabs accessible and render content
2. **Regional Tab**: Currency, Date/Time, Units sections all functional
3. **Notifications Tab**: Group toggles work, individual toggles work
4. **Modules Tab**:
   - Click expands card with details
   - Selection toggles without saving
   - Save button appears when changes made
   - Save persists changes
5. **Settings Persistence**: Changes save correctly to database

---

## VALIDATION COMMANDS

### Level 1: Syntax & Style

```bash
bun run check
bun run lint
```

### Level 2: Manual Validation

1. Navigate to Settings page
2. Test each tab renders
3. Test Regional tab has all 3 sections
4. Test notification toggles
5. Test module expansion and save

---

## ACCEPTANCE CRITERIA

- [ ] Settings page has 5 tabs instead of 8
- [ ] Regional tab contains Currency, Date/Time, Units sections
- [ ] Notification toggles grouped with category headers
- [ ] Module cards expand on click to show details
- [ ] Module changes require explicit Save
- [ ] All validation commands pass
- [ ] No regressions in settings functionality

---

## COMPLETION CHECKLIST

- [ ] All tasks completed in order
- [ ] Each task validation passed
- [ ] All validation commands pass
- [ ] Manual testing confirms feature works
- [ ] Acceptance criteria all met

---

## NOTES

### Design Decisions

1. **5 Tabs vs 8**: Reduces cognitive load while keeping logical groupings
2. **Explicit Module Save**: Prevents accidental changes, allows reviewing before committing
3. **Notification Groups**: Faster to enable/disable related notifications together
4. **Compact Toggle Layout**: 2-column grid reduces vertical scrolling

### Future Considerations

- Could add "Reset to Defaults" per section
- Could add search/filter for settings
- Could add settings import/export
