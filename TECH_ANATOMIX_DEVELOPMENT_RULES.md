# TECH-ANATOMIX — DEVELOPMENT RULES & WORKFLOW

> **Notice to AI Studio Sessions & Engineering Agents**: This document specifies the mandatory 8-step development workflow and safety constraints for all future changes to Tech-Anatomix. Follow these rules strictly to preserve project health, viewer stability, and cross-session continuity.

---

## MANDATORY 8-STEP DEVELOPMENT WORKFLOW

### STEP 1: UNDERSTAND
- Read `TECH_ANATOMIX_PROJECT_MEMORY.md` to understand the current architecture, model categories, branding guidelines, and verified constraints.
- Review existing test suites in `src/tests/` to identify relevant assertions and safety contracts.
- Do NOT assume a feature exists or works in a specific way without inspecting the source code.

### STEP 2: LOCATE
- Identify the exact source files, components, data registries, and utilities responsible for the requested behavior.
- Determine whether the target model belongs to **Native Three.js**, **GLB/GLTF App Viewer**, or **External Embedded (Sketchfab)**.

### STEP 3: PLAN
- Formulate the smallest reliable implementation that satisfies the user's requirements without breaking existing functionality.
- Check if shared components (`Global3DViewer`, `ExternalModelWorkspace`, `ModelPositionControls`, `EducationalExplanationBox`) are affected.

### STEP 4: IMPLEMENT
- Modify the existing implementation in the correct location.
- Reuse existing components, utilities, and styling standards (Tailwind CSS).
- Do NOT create duplicate viewers, parallel dissection pages, or secondary routing logic.

### STEP 5: PRESERVE
- **Branding**: Preserve `/logo.png` usage in `Navbar.tsx` and top-left overlays in `ExternalModelWorkspace.tsx`.
- **Anatomy**: Maintain existing human/frog GLB models, dissection mechanics, camera controls, and anatomical accuracy.
- **Controls**: Preserve universal `ModelPositionControls` (X/Y translation) for native Three.js and GLB models.
- **AI Workspace**: Maintain the 50/50 split layout (`ExternalModelAiChat.tsx` on left, 3D viewer on right) for Sketchfab models.

### STEP 6: VERIFY
- Execute test suites using `npx tsx src/tests/runTests.ts` to verify zero test regressions.
- Run `compile_applet` and `lint_applet` to confirm clean compilation and TypeScript build compliance.

### STEP 7: DOCUMENT
- Update `TECH_ANATOMIX_PROJECT_MEMORY.md` when introducing new features, updating architecture, or modifying model registers.
- Append a concise entry to Section I (Feature and Change History).

### STEP 8: REPORT
- Provide a clear, honest summary of changed files, verified behaviors, test results, and any unresolved technical limitations.

---

## CORE DEVELOPMENT CONSTRAINTS

1. **Zero Duplicate Viewers**: Never build parallel or duplicate 3D viewers for an existing model.
2. **Real Integrations**: Use real 3D models and mathematical engines; never use fake image placeholders or camera cheats.
3. **Clean UI**: Keep viewports clean, uncluttered, and responsive across desktop and mobile screen sizes.
4. **Honest Limitations**: Explicitly report external platform constraints (e.g., Sketchfab iframe cross-origin limits) when applicable.
