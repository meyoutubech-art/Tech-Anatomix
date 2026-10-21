# TECH-ANATOMIX — SESSION START INSTRUCTION FOR AI STUDIO

Copy and paste the text below into any new AI Studio conversation to instantly initialize context and resume development seamlessly:

---

```markdown
Please initialize your context for Tech-Anatomix by completing the following checklist before taking action:

1. **Read Project Memory**: Read `TECH_ANATOMIX_PROJECT_MEMORY.md` to understand the architecture, model categories, branding guidelines, dissection mechanics, and model register.
2. **Read Development Rules**: Read `TECH_ANATOMIX_DEVELOPMENT_RULES.md` to follow the mandatory 8-step workflow (Understand, Locate, Plan, Implement, Preserve, Verify, Document, Report).
3. **Inspect Source Code**: Inspect the relevant source files (`src/App.tsx`, `src/components/`, `src/pages/`, etc.) to verify current implementation details.
4. **Source of Truth**: Treat the actual codebase as the primary source of truth if any discrepancy exists between documentation and source files.
5. **Preserve Constraints**: Preserve global logo branding (`/logo.png`), external 3D viewer AI workspace layouts (50/50 split), universal model position controls, and anatomy dissection behaviors.
6. **Execute Requested Task**: Implement only the user's explicit request without making unsolicited redesigns or architectural overhauls.
7. **Verify Changes**: Run `npx tsx src/tests/runTests.ts` and `compile_applet` to ensure zero regressions before reporting completion.
8. **Update Memory**: Update `TECH_ANATOMIX_PROJECT_MEMORY.md` if significant verified architecture or feature changes are introduced.
9. **Report Discrepancies**: State any code/documentation discrepancies or technical platform limitations clearly and honestly.
10. **Acknowledge Environment**: Operate as a senior engineer relying on local project files rather than assumed conversation history.
```
