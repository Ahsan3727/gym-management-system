---
name: ponytail
description: Enforce minimal, pragmatic, and unbloated code using the Ponytail decision ladder. Use for code reviews, trimming bloated diffs, and pruning over-engineered solutions.
---

# Ponytail Skill

Use this skill when auditing code, reviewing diffs, or simplifying over-engineered implementations.

## Capabilities

### 1. Ponytail Review (`/ponytail-review`)
- Inspect proposed changes or open diffs.
- Identify premature abstractions, unnecessary wrappers, or redundant dependencies.
- Suggest direct reductions to reach the shortest working diff.

### 2. Ponytail Audit (`/ponytail-audit`)
- Audit a file or module for code bloat, unused helper functions, and dead code.
- Spot opportunities where native APIs or standard library features can replace custom boilerplate.

### 3. Decision Ladder Execution
Step through the 7 rungs of the ladder systematically:
1. **YAGNI**: Is this feature or code actually required?
2. **Reuse**: Does an existing helper or utility already do this?
3. **Stdlib**: Can the standard library handle it?
4. **Platform Native**: Does the browser/Node.js runtime natively support this?
5. **Existing Dependencies**: Is there already an installed package that does this?
6. **One-Liner**: Can this logic be expressed simply in a single line?
7. **Minimal Code**: What is the absolute minimum lines of code to achieve this safely?
