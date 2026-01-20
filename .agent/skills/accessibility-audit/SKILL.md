---
name: Accessibility Audit
description: Audit and improve accessibility
---

# Accessibility Audit

Ensure OpenLivestock meets accessibility standards.

## Standards

- WCAG 2.1 Level AA
- Keyboard navigable
- Screen reader compatible

## Checklist

### Semantic HTML

- [ ] Proper heading hierarchy (h1 > h2 > h3)
- [ ] Landmark regions (main, nav, aside)
- [ ] Buttons for actions, links for navigation

### Interactive Elements

- [ ] All interactive elements keyboard accessible
- [ ] Focus visible on all elements
- [ ] Skip links for navigation

### Forms

- [ ] Labels associated with inputs
- [ ] Error messages linked to fields
- [ ] Required fields indicated

### Colors

- [ ] Sufficient color contrast (4.5:1 for text)
- [ ] Information not conveyed by color alone

### Images

- [ ] Alt text on informative images
- [ ] Decorative images hidden (alt="")

## Testing Tools

```bash
# Run axe-core audit
npx @axe-core/cli http://localhost:3000
```

## Key Components

Check `app/components/ui/` for accessible patterns:

- Button, Input, Dialog use Radix primitives
- Built-in keyboard navigation
