# FUTURE ENHANCEMENTS - OpenLivestock Manager

This document tracks new features and enhancements that are NOT bug fixes.
These are improvements to be implemented after critical audit remediation is complete.

---

## DOMAIN LOGIC ENHANCEMENTS

### FCR Calculation Unification
- Unify FCR formula across `feed/service.ts`, `batches/service.ts`, and `dashboard`
- Formula: `Total Feed / (Current Weight - Initial Weight)`
- **Status**: Partially in audit remediation (Task 4)

### Water Quality - Species-Specific Thresholds
- Refactor `water-quality/constants.ts` to support species-specific thresholds
- Distinct values for Catfish vs Tilapia vs other species
- **Status**: In audit remediation (Task 12)

### Weight & Growth Standards
- Add growth standard curves for Cattle, Goats, Sheep, and Bees
- Implement proper Average Daily Gain (ADG) calculations for all 6 species
- **Status**: Partially in audit remediation (Task 13)

---

## NEW FEATURES (Not in Audit Remediation)

### Production Logic Enhancements
- [ ] `eggs/service.ts`: Update production logic to account for age-related decline (>35 weeks)
- [ ] Implement Stocking Density validation per structure
- [ ] Add Biosecurity tracking (Disease exposure/contact tracing)
- [ ] Add Breeding/Reproduction tracking (kidding intervals, calving, etc.)
- [ ] Add Feed Formulation tracking (ingredient costs, nutritional analysis)
- [ ] Add Labor hours/cost tracking (20-30% of production costs)
- [ ] Add Environmental monitoring (Temperature/Humidity sensors)
- [ ] Add Beekeeping specific metrics:
  - Honey yield per hive
  - Hive health scoring
  - Varroa mite monitoring
  - Swarm prevention timing

### Industry KPIs
- [ ] DOC (Days Open) - poultry reproduction metric
- [ ] ABC (Animal Breeding Cycle) - breeding efficiency
- [ ] Turnover Rate - batch cycling efficiency
- [ ] Laying Percentage - layer flock productivity
- [ ] Cost of Production per unit

### Financial Enhancements
- [ ] Cash Flow projection reporting
- [ ] Gross margin vs Net margin distinction
- [ ] Annualized ROI calculations
- [ ] IRR (Internal Rate of Return)
- [ ] EBITDA calculations
- [ ] Profit forecasting by batch

---

## PRIORITY ORDER

### Phase 1 (After Audit Remediation)
1. Egg production age decline
2. Stocking density validation
3. Laying percentage KPI

### Phase 2
4. Biosecurity tracking
5. Breeding/reproduction tracking
6. DOC and ABC KPIs

### Phase 3
7. Labor tracking
8. Feed formulation
9. Cash flow projections

### Phase 4
10. Environmental monitoring
11. Beekeeping metrics
12. Advanced financial calculations

---

## ESTIMATED EFFORT

| Feature | Effort | Complexity |
|---------|--------|------------|
| Egg age decline | 2-4 hours | Low |
| Stocking density | 4-6 hours | Medium |
| Biosecurity tracking | 2-3 days | High |
| Breeding tracking | 3-5 days | High |
| Feed formulation | 2-3 days | Medium |
| Labor tracking | 1-2 days | Medium |
| Environmental monitoring | 3-5 days | High |
| Beekeeping metrics | 2-3 days | Medium |
| KPIs (DOC, ABC, etc.) | 1-2 days | Medium |
| Cash flow projections | 2-3 days | Medium |
| **Total** | **~3-4 weeks** | |

---

## NOTES

These features are enhancements, not bugs. They should be implemented after:
1. All critical security fixes (Phase 1 of audit remediation)
2. All high-priority maintainability fixes (Phase 2 of audit remediation)

See `.agents/plans/comprehensive-audit-remediation.md` for the bug fix roadmap.
