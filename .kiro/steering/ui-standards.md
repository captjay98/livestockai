# OpenLivestock UI Standards - "Rugged Utility"

## Design Philosophy

OpenLivestock is built for farmers in the field - often on dusty phones with cracked screens, under bright sunlight, with dirty hands. Every UI decision prioritizes **usability over aesthetics**.

## Signal Palette

| Color            | CSS Variable    | Usage                               |
| ---------------- | --------------- | ----------------------------------- |
| **Forest Green** | `--success`     | Growth, revenue, healthy batches    |
| **Amber**        | `--warning`     | Alerts, low stock, attention needed |
| **Red**          | `--destructive` | Mortality, losses, critical issues  |
| **Neutral**      | `--muted`       | Data, secondary information         |
| **Primary**      | `--primary`     | Actions, CTAs (Emerald brand)       |

## Touch Targets

All interactive elements MUST meet minimum sizes:

| Element           | Minimum Size    | Rationale             |
| ----------------- | --------------- | --------------------- |
| Buttons           | 48px height     | Fat finger friendly   |
| Action Grid items | 64px × 64px     | Field use with gloves |
| Form inputs       | 44px height     | Easy tap targets      |
| List items        | 48px row height | Scrollable lists      |
| Icon buttons      | 44px × 44px     | Toolbar actions       |

## Component Patterns

### Batch Header (North Star)

Every batch-related page starts with this anchored header:

```
┌─────────────────────────────────────────────┐
│ 🐔 Broiler Batch A          Week 6    ● Synced │
│ 450/500 birds • Sunrise Poultry Farm         │
└─────────────────────────────────────────────┘
```

- Always visible (sticky on scroll)
- Shows: Species icon, name, age, sync status
- Tap to expand batch details

### Health Pulse Card

Color-coded status at a glance:

```
┌─────────────────────────────────────────────┐
│ 🟢 ON TRACK                                  │
│ Mortality: 2.1% • FCR: 1.8 • Weight: 1.2kg  │
└─────────────────────────────────────────────┘
```

States:

- 🟢 **Green**: All metrics within targets
- 🟡 **Amber**: One metric needs attention
- 🔴 **Red**: Critical - immediate action required

### Action Grid

High-frequency actions as large touch targets:

```
┌──────────┬──────────┬──────────┐
│   🍗     │    💀    │    💰    │
│  Feed    │  Death   │   Sale   │
├──────────┼──────────┼──────────┤
│   ⚖️     │    💉    │    💧    │
│  Weigh   │   Vax    │  Water   │
└──────────┴──────────┴──────────┘
```

- 2×3 or 3×2 grid depending on screen
- Icons + labels always visible
- Each cell minimum 64px × 64px

### Data Tables (Mobile)

On mobile, tables transform to cards:

```
┌─────────────────────────────────────────────┐
│ Jan 15, 2026                    ₦45,000     │
│ 50 birds @ ₦900/bird                        │
│ Customer: Alhaji Musa           [View →]    │
└─────────────────────────────────────────────┘
```

- Primary info (date, amount) prominent
- Secondary info smaller
- Action always visible

## Typography

| Element    | Size | Weight   | Usage               |
| ---------- | ---- | -------- | ------------------- |
| Page title | 24px | Bold     | Route headers       |
| Card title | 18px | Semibold | Card headers        |
| Body       | 16px | Regular  | Content             |
| Caption    | 14px | Regular  | Secondary text      |
| Label      | 12px | Medium   | Form labels, badges |

## Spacing Scale

Use consistent spacing (Tailwind):

- `p-2` (8px): Tight spacing within components
- `p-3` (12px): Default component padding
- `p-4` (16px): Card padding, section gaps
- `p-6` (24px): Page sections (reduced from p-8 for mobile)

## Offline Indicators

Always show sync status:

```
● Synced          - Green dot, all data uploaded
◐ Syncing...      - Animated, upload in progress
○ Offline (3)     - Gray dot, 3 items pending
⚠ Sync Failed     - Red, tap to retry
```

## Form Patterns

### Input Groups

```
┌─────────────────────────────────────────────┐
│ Quantity *                                   │
│ ┌─────────────────────────────────────────┐ │
│ │ 50                                      │ │
│ └─────────────────────────────────────────┘ │
│ Number of birds sold                         │
└─────────────────────────────────────────────┘
```

- Label above input
- Helper text below
- Required fields marked with \*

### Select Dropdowns

Use native selects on mobile for OS picker. Custom selects only on desktop.

## Dialog Standards

| Type   | Width      | Use Case              |
| ------ | ---------- | --------------------- |
| Alert  | sm (400px) | Confirmations, errors |
| Form   | md (500px) | Create/edit records   |
| Detail | lg (600px) | View full record      |

## Loading States

- Skeleton loaders for initial page load
- Spinner for actions (save, delete)
- Progress bar for multi-step operations

## Error States

```
┌─────────────────────────────────────────────┐
│ ⚠️ Failed to save feed record               │
│                                              │
│ Check your connection and try again.         │
│                                              │
│ [Retry]                      [Save Offline]  │
└─────────────────────────────────────────────┘
```

- Clear error message
- Actionable recovery options
- Offline fallback when applicable

## Accessibility

- Minimum contrast ratio: 4.5:1
- Focus indicators visible
- Screen reader labels on icons
- Reduced motion option respected
