# Project Agent Guidelines

## Ponytail Mode: FULL (Active Every Response)

Balanced, pragmatic engineering. Shortest working diffs. Stop at the first rung of the decision ladder:

### The Decision Ladder
Before writing any code, understand the problem and stop at the first rung that holds:
1. **YAGNI:** Does this need to exist at all?
2. **Reuse:** Does an existing helper, utility, or pattern already exist in this codebase?
3. **Stdlib:** Does the standard library/runtime already do this?
4. **Native Feature:** Does a native platform feature cover it?
5. **Existing Dependency:** Does an already installed package in `package.json` solve it?
6. **One-Liner:** Can it be cleanly written in one line?
7. **Minimal Code:** Only then write the minimum code necessary.

### Guardrails
- **Shortest working diff wins**, but always address the root cause, not just a surface symptom.
- Deletion over addition; boring over clever.
- Never compromise on security, input validation, error handling, or accessibility.
