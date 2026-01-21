---
description: 'Comprehensive accessibility audit for rural farmers and users with disabilities'
---

# Accessibility Audit for OpenLivestock Manager

🌍 Ensure OpenLivestock Manager works for all farmers, including those with disabilities, limited literacy, or using assistive technologies.

## Step 0: Determine Audit Scope

**Ask user interactively:**

> What accessibility audit would you like to perform?
>
> 1. **Full audit** - All accessibility categories
> 2. **Visual accessibility** - Color, contrast, typography
> 3. **Motor accessibility** - Touch targets, keyboard navigation
> 4. **Cognitive accessibility** - Information architecture, language
> 5. **Assistive technology** - Screen readers, voice control
> 6. **Specific feature** - Audit one feature area

**Then ask about priority:**

- Critical issues only (WCAG A compliance)
- Standard compliance (WCAG AA)
- Enhanced accessibility (WCAG AAA)
- Rural farmer focus (sunlight, low literacy, field use)

Wait for response before proceeding.

## Step 1: Run Automated Checks

**If tools available:**

```bash
# Install accessibility testing tools
bun add -D @axe-core/cli pa11y

# Run automated audit
npx axe http://localhost:3001
npx pa11y http://localhost:3001
```

**Error handling:**

- If dev server not running: "Start dev server first: `bun dev`"
- If tools not installed: "Install tools or proceed with manual audit? (y/n)"
- If errors found: "X accessibility issues found. Review details? (y/n)"

## Audit Categories

### 1. Visual Accessibility

**Color & Contrast**

- Check color contrast ratios (WCAG AA: 4.5:1, AAA: 7:1)
- Test in bright sunlight conditions (farmers work outdoors)
- Verify colorblind accessibility (red/green mortality indicators)
- Dark mode support for night/early morning use

**Typography & Readability**

- Font sizes readable on mobile (minimum 16px)
- Clear hierarchy with proper heading structure
- Simple language, avoid technical jargon
- Icons with text labels, not just symbols

### 2. Motor Accessibility

**Touch Targets**

- Minimum 44px touch targets (Apple/Android guidelines)
- Adequate spacing between interactive elements
- Large buttons for users with limited dexterity
- Swipe gestures as alternatives to small buttons

**Input Methods**

- Keyboard navigation support
- Voice input compatibility
- One-handed operation for field use
- Reduce required precision (large input areas)

### 3. Cognitive Accessibility

**Information Architecture**

- Clear, predictable navigation
- Consistent UI patterns across screens
- Progress indicators for multi-step processes
- Error messages in plain language

**Memory & Attention**

- Auto-save functionality (farmers get interrupted)
- Clear visual feedback for actions
- Undo functionality for accidental actions
- Simplified workflows with fewer steps

### 4. Assistive Technology

**Screen Readers**

- Proper ARIA labels and roles
- Semantic HTML structure
- Alt text for images and icons
- Skip navigation links

**Voice Control**

- Voice commands for common actions
- Speech-to-text for data entry
- Audio feedback for confirmations

## Rural Context Considerations

### Environmental Factors

- **Bright sunlight**: High contrast, no pure white backgrounds
- **Dusty conditions**: Large touch targets, easy to clean screen
- **Noisy environments**: Visual feedback, not just audio
- **Limited connectivity**: Offline accessibility features

### User Demographics

- **Age range**: 25-65+ years (older farmers may need larger text)
- **Education levels**: Mixed literacy levels
- **Technology familiarity**: Varying smartphone experience
- **Physical demands**: May use app while handling livestock

## Audit Process

### Automated Testing

```bash
# Install accessibility testing tools
bun add -D @axe-core/playwright axe-core

# Run automated accessibility tests
bun test:a11y
```

### Manual Testing Checklist

**Navigation**

- [ ] Tab through entire app using only keyboard
- [ ] All interactive elements are focusable
- [ ] Focus indicators are clearly visible
- [ ] Logical tab order throughout app

**Screen Reader Testing**

- [ ] Test with VoiceOver (iOS) or TalkBack (Android)
- [ ] All content is announced properly
- [ ] Form labels are associated correctly
- [ ] Error messages are announced

**Visual Testing**

- [ ] Zoom to 200% - content still usable
- [ ] Test with high contrast mode enabled
- [ ] Verify in bright outdoor lighting conditions
- [ ] Check with colorblind simulation tools

**Motor Testing**

- [ ] All actions possible with one hand
- [ ] Touch targets meet minimum size requirements
- [ ] No precision gestures required
- [ ] Alternative input methods work

### User Testing with Farmers

**Recruit Test Users**

- Farmers with visual impairments
- Older farmers (55+ years)
- Farmers with limited smartphone experience
- Users of assistive technologies

**Test Scenarios**

1. **New batch setup** - Can they create a batch independently?
2. **Daily data entry** - Record mortality, feed consumption
3. **View reports** - Access and understand financial reports
4. **Emergency use** - Find critical information quickly

## Common Issues & Solutions

### Issue: Small touch targets

**Solution**: Increase button size to minimum 44px, add padding

### Issue: Poor color contrast

**Solution**: Use high contrast color palette, test with contrast checker

### Issue: Complex navigation

**Solution**: Simplify menu structure, add breadcrumbs

### Issue: Technical language

**Solution**: Use farmer-friendly terms, add tooltips for technical concepts

### Issue: No offline accessibility

**Solution**: Ensure screen readers work offline, cache accessibility features

## Implementation Priority

### Phase 1: Critical Issues

- Color contrast fixes
- Touch target sizing
- Keyboard navigation
- Screen reader compatibility

### Phase 2: Enhancements

- Voice input support
- Simplified language
- Better error messages
- Offline accessibility features

### Phase 3: Advanced Features

- Voice commands
- Gesture alternatives
- Customizable UI scaling
- Multi-modal input

## Success Metrics

**Technical Metrics**

- WCAG 2.1 AA compliance score
- Lighthouse accessibility score >90
- Zero critical accessibility violations
- Keyboard navigation coverage 100%

**User Metrics**

- Task completion rate with assistive technology
- User satisfaction scores from farmers with disabilities
- Support ticket reduction for accessibility issues
- Increased user base from underserved communities

## Tools & Resources

**Testing Tools**

- axe-core for automated testing
- WAVE browser extension
- Lighthouse accessibility audit
- Color contrast analyzers

**Screen Readers**

- NVDA (Windows, free)
- VoiceOver (macOS/iOS, built-in)
- TalkBack (Android, built-in)

**Simulation Tools**

- Colorblind web page filter
- High contrast mode testing
- Zoom testing (200%+)

---

## Instructions for Assistant

### Audit Approach

1. **Run automated tests** first to catch obvious issues
2. **Manual testing** with keyboard and screen reader
3. **Visual inspection** for contrast, sizing, clarity
4. **User scenario testing** with farmer workflows
5. **Document findings** with severity levels and solutions

### Prioritization

- **Critical**: Blocks users from core functionality
- **High**: Significantly impacts user experience
- **Medium**: Usability improvements
- **Low**: Nice-to-have enhancements

### Reporting

- Provide specific, actionable recommendations
- Include code examples for fixes
- Estimate implementation effort
- Suggest testing methods for verification

Remember: Accessibility isn't just compliance - it's about making the app usable for all farmers, regardless of their abilities or circumstances.

## Validation & Next Steps

**Validate audit findings:**

1. **Test with real users:**
   - Screen reader users
   - Keyboard-only navigation
   - Colorblind simulation
   - Mobile device testing

2. **Verify fixes:**
   - Re-run automated tools
   - Manual testing of fixed issues
   - Cross-browser compatibility
   - Assistive technology compatibility

**Ask user:**

> Accessibility audit complete. What would you like to do?
>
> - (f) Fix critical issues first (blocking users)
> - (p) Create prioritized fix plan
> - (t) Test with assistive technology
> - (r) Generate detailed report

**If critical issues found:**

> Found X critical accessibility issues that block users:
>
> 1. [Issue description]
> 2. [Issue description]
>
> These should be fixed immediately. Proceed? (y/n)

**Success criteria:**

- WCAG AA compliance achieved
- All critical issues resolved
- Keyboard navigation works throughout
- Screen reader announces all content correctly
- Color contrast meets standards
- Touch targets meet minimum size

## Agent Delegation

For accessibility implementation and testing:

- `@frontend-engineer` - Implement accessibility fixes and ARIA attributes
- `@qa-engineer` - Accessibility testing automation and validation
- `@backend-engineer` - Server-side accessibility features (alt text generation)
- `@security-engineer` - Ensure accessibility doesn't compromise security

### When to Delegate

- **Implementation** - @frontend-engineer for fixing accessibility issues
- **Testing** - @qa-engineer for automated accessibility testing
- **Content** - @backend-engineer for accessible data formatting
- **Security** - @security-engineer to review accessibility features

## Related Prompts

- `@pwa-optimize` - Performance for low-end devices
- `@performance-audit` - Mobile and rural connectivity optimization
- `@code-review` - Review accessibility in code changes
- `@test-coverage` - Ensure accessibility tests exist
