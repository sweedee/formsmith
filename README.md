# Formsmith

A browser voxel puzzle prototype built with Three.js, TypeScript and Vite.

## Run

Use Node.js 24 or newer. Run `npm install`, then `npm run dev`.
`npm test` checks the voxel evaluator; `npm run build` validates TypeScript and creates `dist/`.

## Play

Recreate the target on the left in the construction area on the right. Left-click a block face or the build plane to place; Shift-click or right-click removes a source placement. Drag to orbit, middle-drag to pan, scroll to zoom. Adjust the build plane to place floating blocks. Missing voxels are blue wireframes; extras are red.

Create a named template, place input sockets or fixed blocks on its workbench, and switch back to construction to place template instances. Instance shape selects the template to place; shape input selects what fills its sockets. Rotations are quarter turns around the vertical axis. Shape origins are the grid axes. Editing templates updates their instances. Undo/redo applies to construction and library changes.

Libraries and the active build save in this browser. Export/import provides portable library backups; import replaces the library and clears the active construction (undo restores it).

Prototype prices: direct block 10; template invocation 2; local definition 8 + 2 per recipe element. Transitive definitions are charged once. Costs are provisional.

## Deployment

The Pages workflow tests and builds pushes to main, then publishes the static artifact. Relative asset paths support repository hosting. See PLAN.md for staged design and checkpoints.

## Current limits

Controls are designed for desktop mouse/keyboard. Template controls currently use a side panel; moving them onto 3D workbenches is a later interaction pass. No slicing view or running transformations yet. Outputs are capped at 20,000 voxels. Removing a generated voxel removes its whole source instance. Global shapes persist locally rather than in an account.
