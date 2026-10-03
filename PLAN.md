# Formsmith prototype plan

## Agreed design
Browser game for mouse and keyboard. Players recreate voxel targets with direct blocks and live template instances. Templates are spatial objects containing fixed blocks and positioned, oriented shape-input sockets. One shape input per template; nesting allowed; rotations in 90-degree increments. Exact occupancy determines completion. Any correct solution is accepted. Costs apply to the final recipe, including local template definitions and invocations, never editing actions. Global library persists locally. Targets support free inspection and a missing/extra voxel diff.

## Stack
TypeScript, Three.js, Vite, HTML/CSS for small readable controls. Pure TypeScript voxel evaluation separated from rendering. Static build deployed to GitHub Pages through GitHub Actions. Local browser storage and JSON export/import; no backend for the prototype.

## Milestones
1. Foundation: scaffold project, coordinate conventions, orbit camera, grid, target and build pedestals, hover and selection. Checkpoint: inspect a small target comfortably.
2. Direct construction: place/remove blocks, undo/redo, target comparison, diff overlay, exact completion, simple column and staircase levels. Checkpoint: solve the staircase without templates.
3. Spatial templates: 3D workbench, fixed blocks and input sockets, visible origin, socket rotations, shape substitution, live instance updates and output/socket preview toggle. Checkpoint: create and reuse a three-block column.
4. Composition: nested shape inputs, dependency tracking, cycle rejection, naming/editing, global and local libraries, local persistence and JSON export/import. Checkpoint: edit a nested template and see all dependent instances update correctly.
5. Economy and levels: configurable definition/invocation/direct-placement costs, readable breakdown, shared-component multi-object level, then small spiral tower. Checkpoint: compare manual and reusable solutions; tune with user playtesting.
6. Hosting and polish: GitHub repository, build checks, Pages workflow and repository base path, verify deployed assets and interactions, improve controls from feedback. Checkpoint: playable public URL.

Each milestone should produce a playable or inspectable result before the next begins. Publish an early build after milestone 2 if GitHub access is ready.

## Technical rules to settle during implementation
- Integer voxel coordinates and explicit shape origins; rendering never determines correctness.
- Template input composition and transforms evaluated deterministically; reject cycles and cap expansion to keep the browser responsive.
- Overlaps occupy one voxel but retain all recipe costs.
- Local library includes transitive template dependencies, charged once per definition.
- Deleting an occupied output voxel from an instance requires editing/removing the recipe instance; avoid silently converting outputs to manual blocks.

## Validation
Focused evaluator checks for translations, rotations, fixed blocks, nesting, overlap, cycles, diff and costs. Browser verification for placement, camera interaction, editing and persistence. Production build and deployed GitHub Pages smoke check.

## Deferred
Conditions/filter, running transformations/reduce, numeric input ports, multiplayer, accounts, cloud saves, cost medals and advanced materials.

## First prototype checkpoint (2026-10-03)
Foundation, direct construction, spatial templates, nesting, local/global library persistence, cost breakdown and four small targets are implemented. GitHub Pages is live at https://sweedee.github.io/formsmith/ . Six evaluator tests and the production build pass. On the deployed build, manual column construction completed at cost 30, survived reload, and a three-socket template completed it at cost 16. Block placement, undo, template creation and socket placement were verified through browser interactions.

This is the initial playtest pass, not a polished completion of every milestone: controls remain in a side panel, workspaces use grids rather than finished physical workbenches, and slice inspection is pending. Next checkpoint should respond to user feedback about placement, camera controls, origins and template composition before extending mechanics.
