---
description: Comprehensive hackathon submission review based on official judging criteria
---

# Hackathon Submission Review

Perform comprehensive review of hackathon submission based on the official Kiro Hackathon judging criteria.

## Step 0: Determine Review Scope

**Ask user interactively:**

> What type of hackathon review would you like?
>
> 1. **Full review** - All judging criteria (100 points)
> 2. **Quick check** - Critical issues only
> 3. **Specific category** - Application quality, Kiro usage, documentation, etc.
> 4. **Pre-submission** - Final checks before submitting
> 5. **Improvement plan** - Prioritized list of enhancements

**Then ask about focus:**

- Maximize score (find all improvement opportunities)
- Fix critical issues only
- Specific weakness areas
- Competitive positioning

Wait for response before proceeding.

## Step 1: Project Discovery

## Judging Criteria (100 Points Total)

1. **Application Quality (40 points)**
   - Functionality & Completeness (15 points)
   - Real-World Value (15 points)
   - Code Quality (10 points)

2. **Kiro CLI Usage (20 points)**
   - Effective Use of Features (10 points)
   - Custom Commands Quality (7 points)
   - Workflow Innovation (3 points)

3. **Documentation (20 points)**
   - Completeness (9 points)
   - Clarity (7 points)
   - Process Transparency (4 points)

4. **Innovation (15 points)**
   - Uniqueness (8 points)
   - Creative Problem-Solving (7 points)

5. **Presentation (5 points)**
   - Demo Video (3 points)
   - README (2 points)

## Step 1: Project Discovery

```bash
find . -name "README*" -o -name "*.md" | head -10
ls -la
tree -L 2 -I 'node_modules|__pycache__|.git|dist|build' || ls -la
```

**Error handling:**

- If no README: "❌ CRITICAL: No README.md found. This is required for submission."
- If no DEVLOG: "⚠️ WARNING: No DEVLOG.md found. This impacts documentation score."
- If no .kiro/: "❌ CRITICAL: No Kiro configuration found. Is this a Kiro project?"

**Ask if issues found:**

> Found missing critical files. What would you like to do?
>
> - (c) Create missing files now
> - (s) Skip and continue review
> - (a) Abort review (fix issues first)

## Step 2: Required Documentation Check

Look for:

- `.kiro/steering/` - Global rules, coding standards, architecture principles
- `.kiro/prompts/` - Custom Kiro commands, reusable prompts, workflows
- `DEVLOG.md` - Timeline, decisions, challenges, time spent
- `README.md` - Setup instructions and project overview

**Evaluate README.md and DEVLOG.md quality:**

- README: Clear setup instructions, project description, usage examples
- DEVLOG: Development timeline, decision rationale, challenges faced, time tracking

### 3. Kiro CLI Integration Analysis

Examine:

- `.kiro/` directory structure and contents
- Custom prompts and their quality
- Steering documents and their comprehensiveness
- Evidence of Kiro CLI usage throughout development

### 4. Application Assessment

Analyze:

- Core functionality and completeness
- Real-world applicability and value proposition
- Code architecture and quality
- Error handling and edge cases

### 5. Innovation Evaluation

Consider:

- Uniqueness of approach or solution
- Creative use of Kiro CLI features
- Novel problem-solving methods
- Technical creativity

## Scoring Framework

For each criterion, provide:

- **Score**: X/Y points
- **Justification**: Specific evidence and reasoning
- **Strengths**: What was done well
- **Areas for Improvement**: Specific suggestions

## Output Format

# Hackathon Submission Review

## Overall Score: X/100

## Detailed Scoring

### Application Quality (X/40)

**Functionality & Completeness (X/15)**

- Score justification
- Key strengths
- Missing functionality or issues

**Real-World Value (X/15)**

- Problem being solved
- Target audience and use case
- Practical applicability

**Code Quality (X/10)**

- Architecture and organization
- Error handling
- Code clarity and maintainability

### Kiro CLI Usage (X/20)

**Effective Use of Features (X/10)**

- Kiro CLI integration depth
- Feature utilization assessment
- Workflow effectiveness

**Custom Commands Quality (X/7)**

- Prompt quality and usefulness
- Command organization
- Reusability and clarity

**Workflow Innovation (X/3)**

- Creative Kiro CLI usage
- Novel workflow approaches

### Documentation (X/20)

**Completeness (X/9)**

- Required documentation presence
- Coverage of all aspects

**Clarity (X/7)**

- Writing quality and organization
- Ease of understanding

**Process Transparency (X/4)**

- Development process visibility
- Decision documentation

### Innovation (X/15)

**Uniqueness (X/8)**

- Originality of concept
- Differentiation from common solutions

**Creative Problem-Solving (X/7)**

- Novel approaches
- Technical creativity

### Presentation (X/5)

**Demo Video (X/3)**

- Video quality and clarity
- Effective demonstration

**README (X/2)**

- Setup instructions clarity
- Project overview quality

## Summary

**Top Strengths:**

- [Key strengths]

**Critical Issues:**

- [Major problems that impact scoring]

**Recommendations:**

- [Specific improvement suggestions]

**Hackathon Readiness:** [Ready/Needs Work/Major Issues]

## Validation & Next Steps

**Validate review findings:**

1. **Score accuracy:**
   - All criteria evaluated
   - Scores justified with evidence
   - No bias or assumptions

2. **Recommendations feasibility:**
   - Improvements are actionable
   - Effort estimates realistic
   - Prioritization clear

**Ask user:**

> Review complete. Current score: X/100. What would you like to do?
>
> - (i) Implement top 3 recommendations
> - (d) Deep dive into specific category
> - (c) Compare with winning submissions
> - (r) Re-review after improvements

**If score < 70:**

> Score is below competitive threshold. Critical improvements needed:
>
> 1. [High-impact improvement]
> 2. [High-impact improvement]
> 3. [High-impact improvement]
>
> Estimated score increase: +X points
> Proceed with improvements? (y/n)

**If score 70-85:**

> Good submission! These improvements could boost your score:
>
> - [Medium-impact improvement] (+X points)
> - [Medium-impact improvement] (+X points)

**If score > 85:**

> Excellent submission! Minor polish opportunities:
>
> - [Low-impact improvement] (+X points)

**Success criteria:**

- Score > 70 (competitive)
- All required documentation present
- No critical issues
- Clear value proposition
- Working demo

## Agent Delegation

For comprehensive hackathon review:

- `@qa-engineer` - Code quality, testing, and functionality review
- `@backend-engineer` - Architecture and database implementation review
- `@frontend-engineer` - UI/UX and component quality review
- `@devops-engineer` - Deployment and infrastructure review
- `@security-engineer` - Security and best practices review

### When to Delegate

- **Code quality** - @qa-engineer for testing and quality standards
- **Architecture** - @backend-engineer for system design review
- **UI/UX** - @frontend-engineer for user experience review
- **Deployment** - @devops-engineer for infrastructure review
- **Security** - @security-engineer for security audit

## Related Prompts

- `@code-review` - Detailed code quality review
- `@test-coverage` - Test coverage analysis
- `@accessibility-audit` - Accessibility compliance
- `@performance-audit` - Performance optimization
- `@update-devlog` - Ensure DEVLOG is complete
